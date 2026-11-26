"use client";

import * as React from "react";
import { toast } from "sonner";
import type {
  Booking,
  Business,
  Conversation,
  Faq,
  Message,
  Service,
  Workspace,
} from "./types";
import { createEmptyWorkspace } from "./sample-data";
import {
  demoMode,
  loadWorkspace,
  resetDemoWorkspace,
  saveWorkspace,
  seedDemoWorkspace,
} from "./repo";
import { uid } from "./utils";

/**
 * Octo's client store.
 *
 * Every screen reads from one workspace object, so an edit made in Replies is
 * instantly reflected in the assistant preview and in Settings. Writes are
 * optimistic and debounced: the UI never waits for the network, and the small
 * "Saved" pill confirms the write landed.
 */

interface OctoContextValue {
  workspace: Workspace;
  /** false while the first load is in flight — screens show skeletons. */
  ready: boolean;
  saving: boolean;
  savedAt: number | null;
  demoMode: boolean;
  error: string | null;

  updateBusiness: (patch: Partial<Business>) => void;
  /** Demo shortcut: load the sample salon so the full design can be seen. */
  loadSampleData: () => Promise<void>;
  completeOnboarding: (input: {
    business: Business;
    services: Service[];
    faqs: Faq[];
  }) => void;

  upsertService: (service: Service) => void;
  removeService: (id: string) => void;

  upsertFaq: (faq: Faq) => void;
  removeFaq: (id: string) => void;

  updateConversation: (id: string, patch: Partial<Conversation>) => void;
  markConversationRead: (id: string) => void;
  addMessage: (input: {
    conversationId: string;
    author: Message["author"];
    body: string;
  }) => void;

  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, patch: Partial<Booking>) => void;

  resetDemo: () => Promise<void>;
}

const OctoContext = React.createContext<OctoContextValue | null>(null);

export function OctoProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = React.useState<Workspace>(createEmptyWorkspace);
  const [ready, setReady] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const dirty = React.useRef(false);

  // Initial load: real workspace, or the demo salon on a first visit.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await loadWorkspace();
        // A brand-new owner starts at the wizard with a blank workspace. The
        // sample salon is one tap away (see `loadSampleData`).
        if (!cancelled) {
          setWorkspace(existing ?? createEmptyWorkspace());
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setError("We could not load your business. Please refresh.");
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** All mutations funnel through here so autosave stays predictable. */
  const commit = React.useCallback((updater: (ws: Workspace) => Workspace) => {
    dirty.current = true;
    setWorkspace(updater);
  }, []);

  // Debounced autosave — 600ms after the last keystroke.
  React.useEffect(() => {
    if (!ready || !dirty.current) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        await saveWorkspace(workspace);
        setSavedAt(Date.now());
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "We could not save your changes. Please try again.",
        );
        toast.error("Could not save", {
          description: "Your changes are still here. We'll try again on your next edit.",
        });
      } finally {
        setSaving(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [workspace, ready]);

  const value: OctoContextValue = {
    workspace,
    ready,
    saving,
    savedAt,
    demoMode,
    error,

    updateBusiness: (patch) =>
      commit((ws) => ({ ...ws, business: { ...ws.business, ...patch } })),

    loadSampleData: async () => {
      const demo = await seedDemoWorkspace();
      dirty.current = false;
      setWorkspace(demo);
      setSavedAt(Date.now());
    },

    completeOnboarding: ({ business, services, faqs }) =>
      commit((ws) => ({
        ...ws,
        business: { ...business, whatsapp_connected: true },
        services,
        faqs,
        onboarded_at: new Date().toISOString(),
      })),

    upsertService: (service) =>
      commit((ws) => ({
        ...ws,
        services: ws.services.some((s) => s.id === service.id)
          ? ws.services.map((s) => (s.id === service.id ? service : s))
          : [...ws.services, service],
      })),

    removeService: (id) =>
      commit((ws) => ({ ...ws, services: ws.services.filter((s) => s.id !== id) })),

    upsertFaq: (faq) =>
      commit((ws) => ({
        ...ws,
        faqs: ws.faqs.some((f) => f.id === faq.id)
          ? ws.faqs.map((f) => (f.id === faq.id ? faq : f))
          : [...ws.faqs, faq],
      })),

    removeFaq: (id) =>
      commit((ws) => ({ ...ws, faqs: ws.faqs.filter((f) => f.id !== id) })),

    updateConversation: (id, patch) =>
      commit((ws) => ({
        ...ws,
        conversations: ws.conversations.map((c) =>
          c.id === id ? { ...c, ...patch } : c,
        ),
      })),

    markConversationRead: (id) =>
      commit((ws) => ({
        ...ws,
        conversations: ws.conversations.map((c) =>
          c.id === id && c.unread > 0 ? { ...c, unread: 0 } : c,
        ),
      })),

    addMessage: ({ conversationId, author, body }) =>
      commit((ws) => {
        const now = new Date().toISOString();
        const message: Message = {
          id: uid("msg"),
          business_id: ws.business.id,
          conversation_id: conversationId,
          author,
          body,
          created_at: now,
        };
        return {
          ...ws,
          messages: [...ws.messages, message],
          conversations: ws.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, last_message_at: now, unread: author === "customer" ? c.unread + 1 : c.unread }
              : c,
          ),
        };
      }),

    addBooking: (booking) =>
      commit((ws) => ({ ...ws, bookings: [...ws.bookings, booking] })),

    updateBooking: (id, patch) =>
      commit((ws) => ({
        ...ws,
        bookings: ws.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      })),

    resetDemo: async () => {
      const fresh = await resetDemoWorkspace();
      dirty.current = false;
      setWorkspace(fresh);
      setSavedAt(Date.now());
      toast.success("Sample data restored");
    },
  };

  return <OctoContext.Provider value={value}>{children}</OctoContext.Provider>;
}

export function useOcto() {
  const ctx = React.useContext(OctoContext);
  if (!ctx) throw new Error("useOcto must be used inside <OctoProvider>");
  return ctx;
}
