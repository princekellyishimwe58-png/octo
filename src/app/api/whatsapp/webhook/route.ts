import { NextResponse } from "next/server";
import { answerLocally, askConfiguredModel, type AssistantContext } from "@/lib/assistant";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { parseInboundMessage, sendWhatsAppText } from "@/lib/whatsapp";
import type { Business, Faq, Service } from "@/lib/types";

/**
 * WhatsApp Cloud API webhook.
 *
 * GET  — Meta's one-time verification handshake.
 * POST — a customer sent a message: save it, answer from the business's own
 *        information, and flag anything we're unsure about for the owner.
 *
 * Requires: WHATSAPP_VERIFY_TOKEN, and on the server Supabase's
 * SUPABASE_SERVICE_ROLE_KEY so we can write without a logged-in user.
 */

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const inbound = parseInboundMessage(payload);

  // Always acknowledge quickly so Meta does not retry.
  if (!inbound || !inbound.text) return NextResponse.json({ received: true });

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn("Webhook received but Supabase service role is not configured.");
    return NextResponse.json({ received: true });
  }

  // 1) Which business owns this WhatsApp number?
  const { data: businessRow } = await supabase
    .from("businesses")
    .select("*")
    .eq("whatsapp_phone_id", inbound.phoneNumberId ?? "")
    .maybeSingle();

  if (!businessRow) {
    console.warn("No business connected to phone number id", inbound.phoneNumberId);
    return NextResponse.json({ received: true });
  }
  const business = businessRow as Business;

  // 2) Find or create the conversation (one per customer number).
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("business_id", business.id)
    .eq("customer_phone", inbound.from)
    .maybeSingle();

  let conversation = existing;
  if (!conversation) {
    const { data: created } = await supabase
      .from("conversations")
      .insert({
        business_id: business.id,
        customer_name: inbound.name,
        customer_phone: inbound.from,
        last_message_at: new Date().toISOString(),
        ai_paused: false,
        needs_attention: false,
        unread: 0,
      })
      .select("*")
      .single();
    conversation = created;
  }
  if (!conversation) return NextResponse.json({ received: true });

  const now = new Date().toISOString();

  // 3) Save the customer's message.
  await supabase.from("messages").insert({
    business_id: business.id,
    conversation_id: conversation.id,
    author: "customer",
    body: inbound.text,
    created_at: now,
  });

  // 4) If the owner has taken over, stay quiet and just count the message.
  if (conversation.ai_paused) {
    await supabase
      .from("conversations")
      .update({ unread: (conversation.unread ?? 0) + 1, last_message_at: now })
      .eq("id", conversation.id);
    return NextResponse.json({ received: true, replied: false });
  }

  // 5) Answer only from the owner's own information.
  const [{ data: faqs }, { data: services }] = await Promise.all([
    supabase.from("faqs").select("*").eq("business_id", business.id).eq("enabled", true),
    supabase.from("services").select("*").eq("business_id", business.id),
  ]);

  const context: AssistantContext = {
    businessName: business.name,
    tone: business.tone,
    language: business.language,
    services: (services ?? []) as Service[],
    faqs: (faqs ?? []) as Faq[],
    hours: business.hours ?? {},
  };

  const answer =
    (await askConfiguredModel(inbound.text, context)) ?? answerLocally(inbound.text, context);

  await supabase.from("messages").insert({
    business_id: business.id,
    conversation_id: conversation.id,
    author: "ai",
    body: answer.body,
    created_at: new Date().toISOString(),
  });

  await supabase
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      needs_attention: !answer.confident || Boolean(conversation.needs_attention),
    })
    .eq("id", conversation.id);

  await sendWhatsAppText(inbound.from, answer.body);

  // 6) If the model understood a booking, verify it and save it.
  if (answer.booking) {
    const service = (services ?? []).find(
      (s: Service) => s.name.toLowerCase() === answer.booking!.service.toLowerCase(),
    );
    const startsAt = new Date(answer.booking.starts_at);
    if (service && startsAt.getTime() > Date.now()) {
      await supabase.from("bookings").insert({
        business_id: business.id,
        conversation_id: conversation.id,
        customer_name: inbound.name,
        customer_phone: inbound.from,
        service_name: service.name,
        price: service.price,
        starts_at: startsAt.toISOString(),
        duration_min: service.duration_min,
        status: "pending",
        created_by: "ai",
      });
    }
  }

  return NextResponse.json({ received: true, replied: true, confident: answer.confident });
}
