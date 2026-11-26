"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  PartyPopper,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useOcto } from "@/lib/store";
import type { Business, BusinessType, DayKey, Faq, Service } from "@/lib/types";
import { BUSINESS_TYPES, businessTypeLabel, starterPack } from "@/lib/templates";
import { OctoMark } from "@/components/octo-mark";
import { AssistantTestDialog } from "@/components/assistant-tester";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea, FieldError } from "@/components/ui/field";
import { useHydrated } from "@/lib/hooks";
import { cn, uid } from "@/lib/utils";

/**
 * The 4-step setup wizard. Design rules:
 *  - one question group per screen, plain language only
 *  - everything editable and pre-filled with a sensible starter
 *  - answers survive a refresh (saved on the device while you type)
 */

const DAY_ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<DayKey, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

const STEPS = [
  { title: "About your business", hint: "30 seconds" },
  { title: "Hours and prices", hint: "2 minutes" },
  { title: "Questions and answers", hint: "3 minutes" },
  { title: "Connect WhatsApp", hint: "2 minutes" },
];

const DRAFT_KEY = "octo.onboarding.v1";

interface Draft {
  step: number;
  name: string;
  type: BusinessType | null;
  location: string;
  openDays: DayKey[];
  openTime: string;
  closeTime: string;
  services: Service[];
  faqs: Faq[];
  whatsapp: string;
  tested: boolean;
}

const initialDraft: Draft = {
  step: 0,
  name: "",
  type: null,
  location: "",
  openDays: ["mon", "tue", "wed", "thu", "fri", "sat"],
  openTime: "08:00",
  closeTime: "18:00",
  services: [],
  faqs: [],
  whatsapp: "",
  tested: false,
};

/** Draft answers live on the device, so we read them once, after hydration. */
function readSavedDraft(): Draft {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (raw) return { ...initialDraft, ...(JSON.parse(raw) as Partial<Draft>) };
  } catch {
    // Ignore damaged drafts.
  }
  return initialDraft;
}

export default function OnboardingPage() {
  const hydrated = useHydrated();
  if (!hydrated) return <WizardSkeleton />;
  return <OnboardingWizard />;
}

function WizardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10" aria-busy="true" aria-label="Loading setup">
      <div className="mb-8 flex items-center gap-3">
        <OctoMark className="size-9" />
        <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
      <div className="mt-8 space-y-3 rounded-3xl border border-border bg-card p-6">
        <div className="h-6 w-2/3 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

function OnboardingWizard() {
  const router = useRouter();
  const { workspace, completeOnboarding, loadSampleData, ready } = useOcto();
  const [draft, setDraft] = React.useState<Draft>(readSavedDraft);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [testOpen, setTestOpen] = React.useState(false);
  const seededType = React.useRef<BusinessType | null>(draft.type);

  // Save the draft as the owner types.
  React.useEffect(() => {
    if (done) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Private browsing — the wizard still works in memory.
    }
  }, [draft, done]);

  // Going back to step 1 and changing the type refreshes the starter content,
  // unless the owner has already written their own.
  function chooseType(type: BusinessType) {
    const pack = starterPack(type);
    const untouched = seededType.current === null || seededType.current === draft.type;
    setDraft((prev) => {
      const keepOwn = !untouched;
      return {
        ...prev,
        type,
        services: keepOwn
          ? prev.services
          : pack.services.map((s) => ({
              id: uid("svc"),
              business_id: workspace.business.id,
              ...s,
            })),
        faqs: keepOwn
          ? prev.faqs
          : pack.faqs.map((f) => ({
              id: uid("faq"),
              business_id: workspace.business.id,
              ...f,
              enabled: true,
            })),
      };
    });
    seededType.current = type;
    setError(null);
  }

  function validateStep(step: number): string | null {
    if (step === 0) {
      if (draft.name.trim().length < 2) return "Please tell us your business name.";
      if (!draft.type) return "Please choose the type of business you run.";
      if (draft.location.trim().length < 2) return "Where can customers find you?";
    }
    if (step === 1) {
      if (draft.openDays.length === 0) return "Choose at least one day you're open.";
      if (draft.services.some((s) => !s.name.trim())) {
        return "Give every service a name, or remove it.";
      }
      if (draft.services.length === 0) return "Add at least one service.";
    }
    if (step === 2) {
      const broken = draft.faqs.some(
        (f) => (f.question.trim() && !f.answer.trim()) || (!f.question.trim() && f.answer.trim()),
      );
      if (broken) return "Each question needs a reply. Fill in the missing box or remove it.";
    }
    if (step === 3) {
      if (draft.whatsapp.replace(/\D/g, "").length < 9) {
        return "Enter the WhatsApp number customers use to reach you.";
      }
    }
    return null;
  }

  function goNext() {
    const problem = validateStep(draft.step);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    if (draft.step < 3) {
      setDraft((prev) => ({ ...prev, step: prev.step + 1 }));
      window.scrollTo({ top: 0 });
    } else {
      finish();
    }
  }

  function finish() {
    const hours = buildHours(draft.openDays, draft.openTime, draft.closeTime);
    const business: Business = {
      ...workspace.business,
      name: draft.name.trim(),
      type: draft.type ?? "other",
      location: draft.location.trim(),
      whatsapp_number: draft.whatsapp.trim() || null,
      hours,
    };
    completeOnboarding({
      business,
      services: draft.services.filter((s) => s.name.trim()),
      faqs: draft.faqs.filter((f) => f.question.trim() && f.answer.trim()),
    });
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* noop */
    }
    setDone(true);
    window.scrollTo({ top: 0 });
  }

  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </main>
    );
  }

  if (done) {
    return (
      <Celebration
        businessName={draft.name}
        replyCount={draft.faqs.filter((f) => f.question.trim() && f.answer.trim()).length}
        onDashboard={() => router.push("/home")}
        onTest={() => setTestOpen(true)}
        testOpen={testOpen}
        setTestOpen={setTestOpen}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Header + progress */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <OctoMark className="size-8" />
              <span className="text-lg font-semibold">Octo</span>
            </span>
            <button
              type="button"
              onClick={async () => {
                await loadSampleData();
                router.push("/home");
              }}
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Skip for now
            </button>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">
                Step {draft.step + 1} of 4 · {STEPS[draft.step].title}
              </p>
              <p className="text-xs text-muted-foreground">{STEPS[draft.step].hint}</p>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={4}
              aria-valuenow={draft.step + 1}
              aria-label="Setup progress"
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${((draft.step + 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-40 pt-6">
        {draft.step === 0 ? (
          <StepBusiness draft={draft} setDraft={setDraft} chooseType={chooseType} />
        ) : null}
        {draft.step === 1 ? <StepHoursAndPrices draft={draft} setDraft={setDraft} /> : null}
        {draft.step === 2 ? <StepQuestions draft={draft} setDraft={setDraft} /> : null}
        {draft.step === 3 ? <StepWhatsApp draft={draft} setDraft={setDraft} /> : null}
      </main>

      {/* Sticky actions: one primary button, always in reach of a thumb */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur">
        <div className="safe-bottom mx-auto w-full max-w-2xl px-4 py-3">
          <FieldError>{error}</FieldError>
          <div className={cn("flex items-center gap-2", error && "mt-1")}>
            {draft.step > 0 ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  setError(null);
                  setDraft((prev) => ({ ...prev, step: prev.step - 1 }));
                }}
              >
                <ArrowLeft /> Back
              </Button>
            ) : null}
            <Button size="lg" className="flex-1" onClick={goNext}>
              {draft.step === 3 ? "Finish setup" : "Continue"}
              {draft.step === 3 ? <Check /> : <ArrowRight />}
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Your answers are saved on this phone as you go.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Step 1 ------------------------------ */

function StepBusiness({
  draft,
  setDraft,
  chooseType,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  chooseType: (type: BusinessType) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Let&apos;s set up your assistant</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Three quick questions about your business. You can change anything later.
        </p>
      </div>

      <Card className="flex flex-col gap-5 p-5">
        <Field
          label="What is your business called?"
          htmlFor="name"
          hint="Use the name customers know."
        >
          <Input
            id="name"
            value={draft.name}
            onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="e.g. Malaika Hair Studio"
            autoComplete="organization"
          />
        </Field>

        <fieldset>
          <legend className="text-base font-medium">What kind of business is it?</legend>
          <p className="mb-2 mt-0.5 text-sm text-muted-foreground">
            We&apos;ll fill in helpful starter answers for you.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {BUSINESS_TYPES.map((type) => {
              const active = draft.type === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => chooseType(type.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-16 items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  <span className="text-xl" aria-hidden>
                    {type.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-snug">
                      {type.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">{type.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <Field
          label="Where are you located?"
          htmlFor="location"
          hint="Area, building or a landmark customers know."
        >
          <Input
            id="location"
            value={draft.location}
            onChange={(event) => setDraft((prev) => ({ ...prev, location: event.target.value }))}
            placeholder="e.g. Kilimani, Nairobi"
            autoComplete="address-level2"
          />
        </Field>
      </Card>
    </div>
  );
}

/* ------------------------------ Step 2 ------------------------------ */

function StepHoursAndPrices({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
}) {
  function updateService(id: string, patch: Partial<Service>) {
    setDraft((prev) => ({
      ...prev,
      services: prev.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">When are you open, and what do you charge?</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Your assistant uses these answers so it never guesses a price or a time.
        </p>
      </div>

      {/* Hours */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Your opening hours</h2>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">Which days are you open?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DAY_ORDER.map((day) => {
              const active = draft.openDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      openDays: active
                        ? prev.openDays.filter((d) => d !== day)
                        : [...prev.openDays, day],
                    }))
                  }
                  className={cn(
                    "h-11 min-w-11 rounded-full border px-3 text-sm font-semibold transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  {DAY_LABELS[day]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Opens at" htmlFor="open">
            <Input
              id="open"
              type="time"
              value={draft.openTime}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, openTime: event.target.value }))
              }
            />
          </Field>
          <Field label="Closes at" htmlFor="close">
            <Input
              id="close"
              type="time"
              value={draft.closeTime}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, closeTime: event.target.value }))
              }
            />
          </Field>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Need different hours for Saturday? You can set that later in Settings.
        </p>
      </Card>

      {/* Services */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Your services and prices</h2>
          <span className="text-sm text-muted-foreground">{draft.services.length} added</span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Prices are in Kenyan shillings. Remove anything you don&apos;t offer.
        </p>

        <div className="mt-4 flex flex-col gap-4">
          {draft.services.map((service) => (
            <div key={service.id} className="rounded-md border border-border bg-background p-3">
              <div className="flex items-end gap-2">
                <Field label="Service" htmlFor={`svc-${service.id}`} className="flex-1">
                  <Input
                    id={`svc-${service.id}`}
                    value={service.name}
                    onChange={(event) => updateService(service.id, { name: event.target.value })}
                    placeholder="e.g. Braiding"
                  />
                </Field>
                <button
                  type="button"
                  aria-label="Remove this service"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      services: prev.services.filter((s) => s.id !== service.id),
                    }))
                  }
                  className="mb-0.5 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-accent"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Price (KSh)" htmlFor={`price-${service.id}`}>
                  <Input
                    id={`price-${service.id}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={service.price || ""}
                    onChange={(event) =>
                      updateService(service.id, { price: Number(event.target.value) || 0 })
                    }
                    placeholder="2500"
                  />
                </Field>
                <Field label="Takes (minutes)" htmlFor={`dur-${service.id}`}>
                  <Input
                    id={`dur-${service.id}`}
                    type="number"
                    inputMode="numeric"
                    min={5}
                    step={5}
                    value={service.duration_min || ""}
                    onChange={(event) =>
                      updateService(service.id, {
                        duration_min: Number(event.target.value) || 0,
                      })
                    }
                    placeholder="60"
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="secondary"
          className="mt-4 w-full"
          onClick={() =>
            setDraft((prev) => ({
              ...prev,
              services: [
                ...prev.services,
                {
                  id: uid("svc"),
                  business_id: prev.services[0]?.business_id ?? "new",
                  name: "",
                  price: 0,
                  duration_min: 30,
                },
              ],
            }))
          }
        >
          <Plus /> Add another service
        </Button>
      </Card>
    </div>
  );
}

/* ------------------------------ Step 3 ------------------------------ */

function StepQuestions({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
}) {
  function updateFaq(id: string, patch: Partial<Faq>) {
    setDraft((prev) => ({
      ...prev,
      faqs: prev.faqs.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          What do customers ask you most?
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          We&apos;ve written {draft.faqs.length} starters for a{" "}
          {businessTypeLabel(draft.type ?? "other").toLowerCase()}. Edit the words so
          they sound like you.
        </p>
      </div>

      <div className="rounded-md bg-primary-soft px-4 py-3 text-sm text-primary">
        Your assistant only answers from what you write here. If it isn&apos;t sure, it
        asks a person to follow up instead of guessing.
      </div>

      <div className="flex flex-col gap-3">
        {draft.faqs.map((faq) => (
          <Card key={faq.id} className="p-4">
            <div className="flex items-start gap-2">
              <div className="grid flex-1 gap-3">
                <Field
                  label="When customers ask about…"
                  htmlFor={`q-${faq.id}`}
                  className="[&>label]:text-sm [&>label]:text-muted-foreground"
                >
                  <Input
                    id={`q-${faq.id}`}
                    value={faq.question}
                    onChange={(event) => updateFaq(faq.id, { question: event.target.value })}
                    placeholder="e.g. How much is a haircut?"
                  />
                </Field>
                <Field
                  label="…reply with"
                  htmlFor={`a-${faq.id}`}
                  className="[&>label]:text-sm [&>label]:text-muted-foreground"
                >
                  <Textarea
                    id={`a-${faq.id}`}
                    value={faq.answer}
                    onChange={(event) => updateFaq(faq.id, { answer: event.target.value })}
                    placeholder="e.g. A haircut is KSh 500 and takes 30 minutes."
                  />
                </Field>
              </div>
              <button
                type="button"
                aria-label="Remove this question"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    faqs: prev.faqs.filter((f) => f.id !== faq.id),
                  }))
                }
                className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-accent"
              >
                <Trash2 className="size-5" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Button
        variant="secondary"
        onClick={() =>
          setDraft((prev) => ({
            ...prev,
            faqs: [
              ...prev.faqs,
              {
                id: uid("faq"),
                business_id: prev.faqs[0]?.business_id ?? "new",
                question: "",
                answer: "",
                enabled: true,
              },
            ],
          }))
        }
      >
        <Plus /> Add another question
      </Button>
    </div>
  );
}

/* ------------------------------ Step 4 ------------------------------ */

function StepWhatsApp({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
}) {
  const [testing, setTesting] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; text: string } | null>(null);

  const supportLink = `https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "254700000000"}?text=${encodeURIComponent(
    "Hi Octo, I'm setting up my assistant and need help connecting WhatsApp",
  )}`;

  async function test() {
    setTesting(true);
    setResult(null);
    try {
      const response = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: draft.whatsapp, businessName: draft.name || "your business" }),
      });
      const data = (await response.json()) as { sent?: boolean; simulated?: boolean; message?: string };
      if (data.sent) {
        setResult({ ok: true, text: "Sent! Check your WhatsApp — your assistant replied." });
      } else if (data.simulated) {
        setResult({
          ok: true,
          text: "Everything looks right. WhatsApp isn't switched on yet, so nothing was sent — we'll finish that for you.",
        });
      } else {
        setResult({ ok: false, text: data.message ?? "We couldn't test it just now. Please try again." });
      }
      setDraft((prev) => ({ ...prev, tested: true }));
    } catch {
      setResult({ ok: false, text: "No connection. Try again when you're back online." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connect your WhatsApp</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Follow these four steps. We&apos;ll be on WhatsApp if you get stuck.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <GuideStep number={1} title="Open WhatsApp Business on your phone">
          Tap <strong>Settings</strong>, then <strong>Business tools</strong>, then{" "}
          <strong>API setup</strong>.
          <ScreenshotPlaceholder label="WhatsApp Business → Settings → Business tools" />
        </GuideStep>
        <GuideStep number={2} title="Copy the two long codes you see">
          One is called <strong>Phone number ID</strong>, the other is an{" "}
          <strong>access token</strong>. Send both to our team and we&apos;ll connect
          them for you — usually within an hour.
          <ScreenshotPlaceholder label="Phone number ID and access token screen" />
          <Button variant="secondary" size="sm" className="mt-3" asChild>
            <a href={supportLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> Send our team the codes
            </a>
          </Button>
        </GuideStep>
        <GuideStep number={3} title="Tell us the number customers already use">
          <Field label="Business WhatsApp number" htmlFor="wa-number" className="mt-3">
            <Input
              id="wa-number"
              type="tel"
              inputMode="tel"
              value={draft.whatsapp}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, whatsapp: event.target.value }))
              }
              placeholder="+254 712 345 678"
              autoComplete="tel"
            />
          </Field>
        </GuideStep>
        <GuideStep number={4} title="Test it">
          We&apos;ll send a test message and your assistant will answer it.
          <div className="mt-3">
            <Button variant="soft" onClick={test} disabled={testing}>
              {testing ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {testing ? "Testing…" : "Test it"}
            </Button>
          </div>
          {result ? (
            <p
              role="status"
              className={cn(
                "mt-3 rounded-md px-3 py-2.5 text-sm font-medium",
                result.ok ? "bg-primary-soft text-primary" : "bg-accent-soft text-accent",
              )}
            >
              {result.text}
            </p>
          ) : null}
        </GuideStep>
      </div>
    </div>
  );
}

function GuideStep({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">{title}</h2>
          <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</div>
        </div>
      </div>
    </Card>
  );
}

/** A dashed frame standing in for a real screenshot. */
function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div className="mt-3 flex aspect-[16/9] flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-border bg-muted/50 px-3 text-center">
      <ImageIcon className="size-5 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

/* ---------------------------- Celebration ---------------------------- */

function Celebration({
  businessName,
  replyCount,
  onDashboard,
  onTest,
  testOpen,
  setTestOpen,
}: {
  businessName: string;
  replyCount: number;
  onDashboard: () => void;
  onTest: () => void;
  testOpen: boolean;
  setTestOpen: (open: boolean) => void;
}) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-4 py-10">
      {/* Soft celebratory glow */}
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
        <div className="absolute left-1/2 top-0 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-soft blur-3xl" />
        <div className="absolute bottom-0 right-0 size-[260px] rounded-full bg-accent-soft blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <span className="grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift animate-in zoom-in-50 duration-500">
          <CheckCircle2 className="size-11" strokeWidth={2.2} />
        </span>

        <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
          <PartyPopper className="size-4" /> Setup complete
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Your assistant is live</h1>
        <p className="mt-2 text-base text-muted-foreground">
          {businessName || "Your business"} can now reply to customers on WhatsApp, day
          and night.
        </p>

        <div className="mt-6 w-full rounded-lg border border-border bg-card p-5 text-left shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            What&apos;s ready
          </p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {[
              `${replyCount} answers written in your words`,
              "Bookings added straight to your calendar",
              "Anything it's unsure about comes to you",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-base">
                <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button size="lg" className="mt-6 w-full" onClick={onDashboard}>
          Go to my dashboard
        </Button>
        <Button variant="ghost" className="mt-1 w-full" onClick={onTest}>
          Try a test message first
        </Button>
      </div>

      <AssistantTestDialog open={testOpen} onOpenChange={setTestOpen} />
    </main>
  );
}

/* ------------------------------ helpers ------------------------------ */

function buildHours(openDays: DayKey[], open: string, close: string): Business["hours"] {
  return DAY_ORDER.reduce(
    (acc, day) => {
      acc[day] = { open, close, closed: !openDays.includes(day) };
      return acc;
    },
    {} as Business["hours"],
  );
}
