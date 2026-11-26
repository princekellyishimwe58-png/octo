"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bot,
  CheckCheck,
  MessageCircle,
  Send,
  Sparkles,
  TriangleAlert,
  UserRoundCheck,
} from "lucide-react";
import { useOcto } from "@/lib/store";
import type { Conversation } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TestAssistantButton } from "@/components/assistant-tester";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  cn,
  addDays,
  avatarColor,
  formatDayShort,
  formatTime,
  initials,
  isSameDay,
  relativeTime,
} from "@/lib/utils";

/**
 * Conversations: a familiar WhatsApp inbox.
 *
 * Desktop = list on the left, thread on the right.
 * Mobile  = list stacked on top, thread below (the list stays scrollable and
 *           compact so the conversation is still the focus).
 *
 * Take over pauses the AI for that customer; hand back resumes it.
 */
export default function ConversationsPage() {
  const { workspace, ready } = useOcto();
  const [pickedId, setPickedId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const conversations = [...workspace.conversations].sort((a, b) =>
    b.last_message_at.localeCompare(a.last_message_at),
  );

  // No effect needed: until the owner picks a chat we show the newest one.
  const selectedId = pickedId ?? conversations[0]?.id ?? null;
  const setSelectedId = setPickedId;

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const messages = workspace.messages
    .filter((m) => m.conversation_id === selectedId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const { markConversationRead, updateConversation, addMessage } = useOcto();

  function openConversation(id: string) {
    setSelectedId(id);
    markConversationRead(id);
  }

  async function sendReply() {
    const body = draft.trim();
    if (!body || !selected) return;
    setSending(true);
    addMessage({ conversationId: selected.id, author: "owner", body });
    setDraft("");
    try {
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selected.customer_phone, body }),
      });
    } catch {
      // The message is saved locally either way; delivery can retry later.
    } finally {
      setSending(false);
    }
  }

  if (ready && conversations.length === 0) {
    return (
      <>
        <PageHeader title="Conversations" description="Customer chats arrive here." />
        <EmptyState
          icon={MessageCircle}
          title="No chats yet"
          description="When a customer messages your WhatsApp number, the conversation will appear here and your assistant will reply."
          action={
            <div className="flex flex-col items-center gap-3">
              <TestAssistantButton />
              <Link
                href="/replies"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Or check the answers your assistant knows
              </Link>
            </div>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Conversations"
        description="Your assistant replies here. Jump in any time."
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr] lg:items-start">
        {/* ---------------- Chat list ---------------- */}
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-muted-foreground">
              {conversations.length} chats
            </p>
          </div>
          <ul className="max-h-64 overflow-y-auto lg:max-h-[calc(100dvh-16rem)]">
            {conversations.map((conversation) => {
              const last = [...workspace.messages]
                .filter((m) => m.conversation_id === conversation.id)
                .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => openConversation(conversation.id)}
                    aria-current={conversation.id === selectedId ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-border/70 px-3.5 py-3 text-left transition-colors last:border-b-0",
                      conversation.id === selectedId
                        ? "bg-primary-soft"
                        : "hover:bg-muted/70",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold",
                        avatarColor(conversation.customer_name),
                      )}
                    >
                      {initials(conversation.customer_name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[15px] font-semibold">
                          {conversation.customer_name}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {relativeTime(conversation.last_message_at)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <span className="truncate text-sm text-muted-foreground">
                          {last?.body ?? "No messages yet"}
                        </span>
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        {conversation.needs_attention ? (
                          <Badge tone="alert">
                            <TriangleAlert className="size-3" /> Needs you
                          </Badge>
                        ) : null}
                        {conversation.ai_paused ? (
                          <Badge tone="neutral">
                            <UserRoundCheck className="size-3" /> You&apos;re replying
                          </Badge>
                        ) : null}
                        {conversation.unread > 0 ? (
                          <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold text-accent-foreground">
                            {conversation.unread}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ---------------- Thread ---------------- */}
        {selected ? (
          <ChatThread
            conversation={selected}
            messages={messages}
            draft={draft}
            setDraft={setDraft}
            sending={sending}
            onSend={sendReply}
            onTakeOver={() => {
              updateConversation(selected.id, { ai_paused: true });
              toast.success("You're replying now", {
                description: "Your assistant is paused for this chat.",
              });
            }}
            onHandBack={() => {
              updateConversation(selected.id, {
                ai_paused: false,
                needs_attention: false,
              });
              toast.success("Handed back to your assistant");
            }}
          />
        ) : null}
      </div>
    </>
  );
}

/** "Today", "Yesterday" or "Mon 24 Nov" for a chat date separator. */
function dayLabel(iso: string) {
  const today = new Date();
  if (isSameDay(today, iso)) return "Today";
  if (isSameDay(addDays(today, -1), iso)) return "Yesterday";
  return formatDayShort(iso);
}

function ChatThread({
  conversation,
  messages,
  draft,
  setDraft,
  sending,
  onSend,
  onTakeOver,
  onHandBack,
}: {
  conversation: Conversation;
  messages: { id: string; author: "customer" | "ai" | "owner"; body: string; created_at: string }[];
  draft: string;
  setDraft: (value: string) => void;
  sending: boolean;
  onSend: () => void;
  onTakeOver: () => void;
  onHandBack: () => void;
}) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length, conversation.id]);

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft">
      {/* Thread header */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold",
            avatarColor(conversation.customer_name),
          )}
        >
          {initials(conversation.customer_name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{conversation.customer_name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {conversation.customer_phone}
          </p>
        </div>
        {conversation.ai_paused ? (
          <Button size="sm" onClick={onHandBack} className="shrink-0">
            <Bot className="size-4" />
            <span className="hidden sm:inline">Hand back to AI</span>
            <span className="sm:hidden">Hand back</span>
          </Button>
        ) : (
          <Button size="sm" onClick={onTakeOver} className="shrink-0">
            <UserRoundCheck className="size-4" />
            Take over
          </Button>
        )}
      </header>

      {/* AI paused / needs attention banner */}
      {conversation.needs_attention && !conversation.ai_paused ? (
        <div className="flex items-start gap-2 border-b border-border bg-accent-soft px-4 py-2.5 text-sm text-accent">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            Your assistant wasn&apos;t sure about something here, so it asked the
            customer to wait for you.
          </p>
        </div>
      ) : null}
      {conversation.ai_paused ? (
        <div className="flex items-start gap-2 border-b border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground">
          <UserRoundCheck className="mt-0.5 size-4 shrink-0" />
          <p>You&apos;re replying yourself. Your assistant is paused in this chat.</p>
        </div>
      ) : null}

      {/* Messages */}
      <div className="chat-canvas flex h-[46dvh] min-h-64 flex-col gap-3 overflow-y-auto p-3 sm:p-4 lg:h-[calc(100dvh-24rem)]">
        {messages.length === 0 ? (
          <p className="m-auto text-sm text-muted-foreground">No messages yet.</p>
        ) : null}
        {messages.map((message, index) => {
          const fromBusiness = message.author !== "customer";
          // A quiet date line whenever the day changes keeps long chats readable.
          const previous = messages[index - 1];
          const newDay = !previous || !isSameDay(previous.created_at, message.created_at);
          return (
            <React.Fragment key={message.id}>
            {newDay ? (
              <p className="mx-auto rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {dayLabel(message.created_at)}
              </p>
            ) : null}
            <div
              className={cn("flex w-full", fromBusiness ? "justify-end" : "justify-start")}
            >
              <div className={cn("max-w-[88%] sm:max-w-[75%]")}>
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed shadow-sm",
                    message.author === "customer" &&
                      "rounded-bl-sm border border-border bg-card",
                    message.author === "ai" &&
                      "rounded-br-sm bg-primary-soft text-foreground",
                    message.author === "owner" &&
                      "rounded-br-sm bg-primary text-primary-foreground",
                  )}
                >
                  {message.body}
                  <div
                    className={cn(
                      "mt-1.5 flex items-center justify-end gap-1 text-[11px]",
                      message.author === "owner"
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatTime(message.created_at)}
                    {fromBusiness ? <CheckCheck className="size-3.5" /> : null}
                  </div>
                </div>
                <p
                  className={cn(
                    "mt-1 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground",
                    fromBusiness ? "justify-end" : "justify-start",
                  )}
                >
                  {message.author === "ai" ? (
                    <>
                      <Sparkles className="size-3" /> AI
                    </>
                  ) : message.author === "owner" ? (
                    "You"
                  ) : (
                    conversation.customer_name
                  )}
                </p>
              </div>
            </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3">
        {conversation.ai_paused ? (
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              onSend();
            }}
          >
            <label htmlFor="reply" className="sr-only">
              Reply to {conversation.customer_name}
            </label>
            <textarea
              id="reply"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type your reply…"
              rows={1}
              className="min-h-11 max-h-32 flex-1 resize-none rounded-md border border-input bg-card px-3 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Send reply"
              disabled={!draft.trim() || sending}
            >
              <Send />
            </Button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-md bg-muted px-3.5 py-2.5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              Your assistant is replying
            </p>
            <Button size="sm" variant="secondary" onClick={onTakeOver}>
              Take over
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
