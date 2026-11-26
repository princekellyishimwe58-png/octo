/**
 * WhatsApp Business Cloud API helpers (server only).
 *
 * Keys live in environment variables and never reach the browser:
 *   WHATSAPP_ACCESS_TOKEN
 *   WHATSAPP_PHONE_NUMBER_ID
 *   WHATSAPP_VERIFY_TOKEN
 */

export const whatsappConfigured = Boolean(
  process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID,
);

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? "v21.0";

export interface SendResult {
  sent: boolean;
  /** true when no credentials exist yet and nothing left the server. */
  simulated?: boolean;
  message?: string;
}

/** Send a plain text WhatsApp message. Never throws. */
export async function sendWhatsAppText(to: string, body: string): Promise<SendResult> {
  if (!whatsappConfigured) {
    return {
      sent: false,
      simulated: true,
      message: "WhatsApp isn't connected yet.",
    };
  }

  const phone = to.replace(/[^\d]/g, "");
  if (phone.length < 9) {
    return { sent: false, message: "That phone number doesn't look complete." };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "text",
          text: { preview_url: false, body },
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("WhatsApp send failed", response.status, detail.slice(0, 300));
      return {
        sent: false,
        message: "WhatsApp couldn't deliver that message. Please check the number.",
      };
    }
    return { sent: true };
  } catch (error) {
    console.error("WhatsApp send error", error);
    return { sent: false, message: "We couldn't reach WhatsApp. Please try again." };
  }
}

/** Read a text message out of an inbound webhook payload. */
export function parseInboundMessage(payload: unknown): {
  from: string;
  name: string;
  text: string;
  phoneNumberId: string | null;
} | null {
  try {
    const body = payload as {
      entry?: {
        changes?: {
          value?: {
            metadata?: { phone_number_id?: string };
            contacts?: { profile?: { name?: string } }[];
            messages?: { from?: string; type?: string; text?: { body?: string } }[];
          };
        }[];
      }[];
    };
    const value = body.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message?.from) return null;

    return {
      from: message.from,
      name: value?.contacts?.[0]?.profile?.name ?? "Customer",
      // Only text is supported in v1; voice notes are out of scope.
      text: message.text?.body?.trim() ?? "",
      phoneNumberId: value?.metadata?.phone_number_id ?? null,
    };
  } catch {
    return null;
  }
}
