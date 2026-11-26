import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendWhatsAppText } from "@/lib/whatsapp";

/**
 * GET /api/cron/reminders — run once a day (see vercel.json).
 *
 * Sends tomorrow's confirmed bookings a friendly reminder on WhatsApp, so the
 * owner never has to chase anyone. Protected by CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ sent: 0, note: "Supabase not configured" });

  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, businesses(name)")
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString())
    .eq("status", "confirmed")
    .is("reminder_sent_at", null);

  let sent = 0;
  for (const booking of bookings ?? []) {
    const when = new Date(booking.starts_at).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const businessName = (booking as { businesses?: { name?: string } }).businesses?.name ?? "us";
    const result = await sendWhatsAppText(
      booking.customer_phone,
      `Hi ${booking.customer_name.split(" ")[0]}, a reminder about your ${booking.service_name} tomorrow at ${when} with ${businessName}. Reply here if you need to change it.`,
    );
    if (result.sent) {
      sent += 1;
      await supabase
        .from("bookings")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", booking.id);
    }
  }

  return NextResponse.json({ sent });
}
