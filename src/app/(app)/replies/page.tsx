"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Languages,
  Loader2,
  MessageSquareText,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useOcto } from "@/lib/store";
import type { Faq, Language, Tone } from "@/lib/types";
import { answerLocally, type AssistantContext } from "@/lib/assistant";
import { previewExamples } from "@/lib/templates";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SavedPill } from "@/components/saved-pill";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { cn, uid } from "@/lib/utils";

/**
 * Knowledge & Replies: everything the assistant is allowed to say, in everyday
 * language. Edits save automatically and the preview updates as you type.
 */

const TONES: { value: Tone; label: string; hint: string }[] = [
  { value: "friendly", label: "Friendly", hint: "Warm and welcoming" },
  { value: "professional", label: "Professional", hint: "Clear and polite" },
  { value: "casual", label: "Casual", hint: "Relaxed, like a friend" },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "english", label: "English" },
  { value: "swahili", label: "Swahili" },
  { value: "mixed", label: "Mix of both" },
];

export default function RepliesPage() {
  const { workspace, updateBusiness, upsertFaq, removeFaq } = useOcto();
  const [pendingDelete, setPendingDelete] = React.useState<Faq | null>(null);
  const [focusId, setFocusId] = React.useState<string | null>(null);

  const faqs = workspace.faqs;

  function addFaq() {
    const faq: Faq = {
      id: uid("faq"),
      business_id: workspace.business.id,
      question: "",
      answer: "",
      enabled: true,
    };
    upsertFaq(faq);
    setFocusId(faq.id);
    toast.success("Add your question and reply", {
      description: "Fill in both boxes and it's saved automatically.",
    });
  }

  return (
    <>
      <PageHeader
        title="Replies"
        description="Your assistant only uses what you write here."
        action={
          <div className="flex items-center gap-2">
            <SavedPill />
            <Button onClick={addFaq} className="flex-1 sm:flex-none">
              <Plus /> Add a question
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="flex flex-col gap-4">
          {/* Tone + language */}
          <Card className="p-5">
            <h2 className="text-lg font-semibold">How should it sound?</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your customers will hear this voice on WhatsApp.
            </p>

            <fieldset className="mt-4">
              <legend className="mb-2 text-sm font-semibold text-muted-foreground">
                Tone
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {TONES.map((tone) => {
                  const active = workspace.business.tone === tone.value;
                  return (
                    <button
                      key={tone.value}
                      type="button"
                      onClick={() => updateBusiness({ tone: tone.value })}
                      aria-pressed={active}
                      className={cn(
                        "min-h-16 rounded-md border px-3 py-2.5 text-left transition-colors",
                        active
                          ? "border-primary bg-primary-soft"
                          : "border-border bg-background hover:bg-muted",
                      )}
                    >
                      <span className="block text-[15px] font-semibold">{tone.label}</span>
                      <span className="block text-sm text-muted-foreground">{tone.hint}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-semibold text-muted-foreground">
                Language
              </legend>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((language) => {
                  const active = workspace.business.language === language.value;
                  return (
                    <button
                      key={language.value}
                      type="button"
                      onClick={() => updateBusiness({ language: language.value })}
                      aria-pressed={active}
                      className={cn(
                        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border bg-background text-foreground hover:bg-muted",
                      )}
                    >
                      <Languages className="size-4" />
                      {language.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </Card>

          {/* FAQ list */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Questions your customers ask</h2>
              <Badge tone="neutral">{faqs.length} saved</Badge>
            </div>

            {faqs.length === 0 ? (
              <EmptyState
                icon={MessageSquareText}
                title="No replies yet"
                description="Add the questions you answer every day. Your assistant will use your words, word for word."
                action={
                  <Button onClick={addFaq}>
                    <Plus /> Add your first question
                  </Button>
                }
              />
            ) : (
              faqs.map((faq) => (
                <FaqEditor
                  key={faq.id}
                  faq={faq}
                  autoFocus={focusId === faq.id}
                  onChange={(patch) => upsertFaq({ ...faq, ...patch })}
                  onDelete={() => setPendingDelete(faq)}
                />
              ))
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6">
          <PreviewReply />
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this reply?"
        description="Your assistant will stop using it straight away. This can't be undone."
        confirmLabel="Yes, delete it"
        onConfirm={() => {
          if (!pendingDelete) return;
          removeFaq(pendingDelete.id);
          toast.success("Reply deleted");
          setPendingDelete(null);
        }}
      />
    </>
  );
}

/* ------------------------------- FAQ item ------------------------------- */

function FaqEditor({
  faq,
  onChange,
  onDelete,
  autoFocus,
}: {
  faq: Faq;
  onChange: (patch: Partial<Faq>) => void;
  onDelete: () => void;
  autoFocus?: boolean;
}) {
  const questionRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (autoFocus) questionRef.current?.focus();
  }, [autoFocus]);

  return (
    <Card className={cn("p-4 sm:p-5", !faq.enabled && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="grid flex-1 gap-3">
          <div>
            <Label htmlFor={`q-${faq.id}`} className="text-sm text-muted-foreground">
              When customers ask about…
            </Label>
            <Input
              id={`q-${faq.id}`}
              ref={questionRef}
              value={faq.question}
              onChange={(event) => onChange({ question: event.target.value })}
              placeholder="e.g. How much is braiding?"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor={`a-${faq.id}`} className="text-sm text-muted-foreground">
              …reply with
            </Label>
            <Textarea
              id={`a-${faq.id}`}
              value={faq.answer}
              onChange={(event) => onChange({ answer: event.target.value })}
              placeholder="e.g. Knotless braiding is KSh 2,500 and takes about 3 hours."
              className="mt-1.5"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete this reply"
          className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
        >
          <Trash2 className="size-5" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch
            checked={faq.enabled}
            onCheckedChange={(checked) => onChange({ enabled: checked })}
            aria-label={faq.enabled ? "Turn this reply off" : "Turn this reply on"}
            id={`on-${faq.id}`}
          />
          <label htmlFor={`on-${faq.id}`} className="cursor-pointer">
            {faq.enabled ? "Your assistant can use this" : "Turned off"}
          </label>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------ Preview box ------------------------------ */

function PreviewReply() {
  const { workspace } = useOcto();
  const [message, setMessage] = React.useState("");
  const [asking, setAsking] = React.useState<string | null>(null);
  const [answer, setAnswer] = React.useState<string | null>(null);
  const [thinking, setThinking] = React.useState(false);
  const examples = previewExamples(workspace.business.type);

  const context: AssistantContext = {
    businessName: workspace.business.name,
    tone: workspace.business.tone,
    language: workspace.business.language,
    services: workspace.services,
    faqs: workspace.faqs.filter((f) => f.enabled),
    hours: workspace.business.hours,
  };

  function preview(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setAsking(clean);
    setThinking(true);
    setAnswer(null);
    // A tiny pause makes it feel like a real reply without feeling slow.
    setTimeout(() => {
      setAnswer(answerLocally(clean, context).body);
      setThinking(false);
    }, 450);
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-primary">
          <Sparkles className="size-4" />
        </span>
        <div>
          <h2 className="text-lg font-semibold leading-tight">Preview reply</h2>
          <p className="text-sm text-muted-foreground">See exactly what it would say</p>
        </div>
      </div>

      <div className="chat-canvas mt-4 min-h-36 rounded-lg border border-border p-3">
        {!answer && !thinking ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Type a customer message below to see the reply.
          </p>
        ) : null}

        {thinking ? (
          <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Your assistant is replying…
          </p>
        ) : null}

        {answer ? (
          <div className="flex flex-col gap-2">
            <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-[15px] text-primary-foreground shadow-sm">
              {asking}
            </div>
            <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5 text-[15px] shadow-sm">
              {answer}
            </div>
            <p className="text-[11px] font-semibold text-muted-foreground">AI</p>
          </div>
        ) : null}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          preview(message);
        }}
      >
        <label htmlFor="preview-message" className="sr-only">
          Sample customer message
        </label>
        <Input
          id="preview-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="e.g. How much is a haircut?"
        />
        <Button type="submit" className="shrink-0" disabled={!message.trim()}>
          <Send />
          Preview
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {examples.slice(0, 3).map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setMessage(example);
              preview(example);
            }}
            className="min-h-11 rounded-full border border-border bg-background px-3 text-sm text-foreground transition-colors hover:bg-muted"
          >
            {example}
          </button>
        ))}
      </div>
    </Card>
  );
}
