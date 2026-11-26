import { NextResponse } from "next/server";
import { sendWhatsAppText, whatsappConfigured } from "@/lib/whatsapp";

/**
 * POST /api/whatsapp/test
 * Used by the "Test it" button at the end of onboarding.
 */
export async function POST(request: Request) {
  let body: { to?: string; businessName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const to = (body.to ?? "").toString().slice(0, 30);
  const businessName = (body.businessName ?? "your business").toString().slice(0, 80);

  if (to.replace(/\D/g, "").length < 9) {
    return NextResponse.json(
      { sent: false, message: "Enter the WhatsApp number customers use." },
      { status: 400 },
    );
  }

  if (!whatsappConfigured) {
    return NextResponse.json({
      sent: false,
      simulated: true,
      message: "WhatsApp isn't connected yet.",
    });
  }

  const result = await sendWhatsAppText(
    to,
    `Hi! This is the Octo assistant for ${businessName} 👋 Reply with a question and I'll answer it.`,
  );

  return NextResponse.json(result);
}
