import { NextResponse } from "next/server";
import { sendWhatsAppText } from "@/lib/whatsapp";

/**
 * POST /api/whatsapp/send
 * Used for booking confirmations, reschedules and owner replies.
 * Without WhatsApp keys it reports `simulated: true` so the UI can stay honest.
 */
export async function POST(request: Request) {
  let body: { to?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const to = (body.to ?? "").toString().slice(0, 30);
  const text = (body.body ?? "").toString().slice(0, 1000).trim();

  if (!to || !text) {
    return NextResponse.json({ error: "A number and a message are required." }, { status: 400 });
  }

  const result = await sendWhatsAppText(to, text);
  return NextResponse.json(result);
}
