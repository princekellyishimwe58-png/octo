import { NextResponse } from "next/server";
import {
  answerLocally,
  askConfiguredModel,
  type AssistantContext,
} from "@/lib/assistant";

/**
 * POST /api/assistant/reply
 *
 * The single reply endpoint used by "Test my assistant", the "Preview reply"
 * box fallback and the WhatsApp webhook. It tries the configured LLM (via n8n
 * or a provider) and falls back to the local, grounded engine.
 */

export async function POST(request: Request) {
  let body: { message?: string; context?: AssistantContext };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const message = (body.message ?? "").toString().slice(0, 1500).trim();
  const context = body.context;

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (!context?.businessName || !Array.isArray(context.faqs)) {
    return NextResponse.json({ error: "Business information is missing." }, { status: 400 });
  }

  // Keep the context small and predictable.
  const safeContext: AssistantContext = {
    businessName: String(context.businessName).slice(0, 120),
    tone: context.tone ?? "friendly",
    language: context.language ?? "english",
    services: Array.isArray(context.services) ? context.services.slice(0, 50) : [],
    faqs: context.faqs.slice(0, 60),
    hours: context.hours ?? {},
  };

  const modelAnswer = await askConfiguredModel(message, safeContext);
  const answer = modelAnswer ?? answerLocally(message, safeContext);

  return NextResponse.json(
    {
      reply: answer.body,
      confident: answer.confident,
      source: modelAnswer ? "llm" : "local",
      matchedFaq: answer.matchedFaq ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
