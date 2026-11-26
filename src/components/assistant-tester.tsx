"use client";

import * as React from "react";
import { Loader2, Send, ShieldCheck, TriangleAlert } from "lucide-react";
import { useOcto } from "@/lib/store";
import { answerLocally, type AssistantContext } from "@/lib/assistant";
import { previewExamples } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * "Test my assistant" — sends a sample customer message through the same reply
 * endpoint the WhatsApp webhook uses, so what you see is what customers get.
 * Nothing is sent to WhatsApp.
 */

interface Exchange {
  question: string;
  answer: string;
  confident: boolean;
}

export function AssistantTestPanel({ autoFocus = false }: { autoFocus?: boolean }) {
  const { workspace } = useOcto();
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [exchanges, setExchanges] = React.useState<Exchange[]>([]);
  const examples = previewExamples(workspace.business.type);

  const context: AssistantContext = {
    businessName: workspace.business.name,
    tone: workspace.business.tone,
    language: workspace.business.language,
    services: workspace.services,
    faqs: workspace.faqs.filter((f) => f.enabled),
    hours: workspace.business.hours,
  };

  async function ask(question: string) {
    const text = question.trim();
    if (!text || loading) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/assistant/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, context }),
      });
      if (!response.ok) throw new Error("bad response");
      const data = (await response.json()) as { reply: string; confident: boolean };
      setExchanges((prev) => [
        ...prev,
        { question: text, answer: data.reply, confident: data.confident },
      ]);
    } catch {
      // Offline or server hiccup: answer locally so the owner still sees the
      // assistant working. Same rules apply — no invented prices.
      const local = answerLocally(text, context);
      setExchanges((prev) => [
        ...prev,
        { question: text, answer: local.body, confident: local.confident },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sample customer messages to try with one tap */}
      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => ask(example)}
            disabled={loading}
            className="min-h-11 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {example}
          </button>
        ))}
      </div>

      {/* Transcript */}
      <div className="chat-canvas flex max-h-72 min-h-40 flex-col gap-3 overflow-y-auto rounded-lg border border-border p-3">
        {exchanges.length === 0 ? (
          <p className="m-auto max-w-xs text-center text-sm text-muted-foreground">
            Type a message a customer might send. You&apos;ll see exactly what your
            assistant would reply.
          </p>
        ) : (
          exchanges.map((exchange, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-[15px] text-primary-foreground shadow-sm">
                {exchange.question}
              </div>
              <div className="flex flex-col items-start gap-1">
                <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5 text-[15px] shadow-sm">
                  {exchange.answer}
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    {exchange.confident ? (
                      <>
                        <ShieldCheck className="size-3.5 text-primary" /> From your own
                        information
                      </>
                    ) : (
                      <>
                        <TriangleAlert className="size-3.5 text-accent" /> Flagged for you
                        to follow up
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Your assistant is typing…
          </div>
        ) : null}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          ask(message);
        }}
      >
        <label htmlFor="test-message" className="sr-only">
          Customer message
        </label>
        <Input
          id="test-message"
          value={message}
          autoFocus={autoFocus}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="e.g. How much is a haircut?"
        />
        <Button type="submit" size="icon" aria-label="Send test message" disabled={!message.trim() || loading}>
          <Send />
        </Button>
      </form>
    </div>
  );
}

export function AssistantTestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test your assistant</DialogTitle>
          <DialogDescription>
            This is a practice chat. Nothing is sent to WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <AssistantTestPanel />
      </DialogContent>
    </Dialog>
  );
}

/** Small helper button used in empty states. */
export function TestAssistantButton({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="secondary" className={cn(className)} onClick={() => setOpen(true)}>
        Test my assistant
      </Button>
      <AssistantTestDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
