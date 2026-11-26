"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, LogOut, MessageCircle, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { useOcto } from "@/lib/store";
import type { DayKey, Plan } from "@/lib/types";
import { BUSINESS_TYPES } from "@/lib/templates";
import { PageHeader } from "@/components/page-header";
import { SavedPill } from "@/components/saved-pill";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { SwitchRow } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn, formatKes } from "@/lib/utils";

/** Settings: one page, clearly sectioned, everything autosaves. */

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const PLANS: { id: Plan; name: string; price: number; blurb: string; features: string[] }[] = [
  {
    id: "starter",
    name: "Starter",
    price: 1500,
    blurb: "For one busy shop",
    features: ["1 WhatsApp number", "Up to 500 chats a month", "Bookings and replies"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 3000,
    blurb: "For a growing business",
    features: ["Everything in Starter", "2,000 chats a month", "Daily summary on WhatsApp"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 5500,
    blurb: "For busy teams",
    features: ["Everything in Growth", "Unlimited chats", "Priority support"],
  },
];

export default function SettingsPage() {
  const { workspace, updateBusiness, resetDemo, demoMode, error } = useOcto();
  const business = workspace.business;
  const [confirmDisconnect, setConfirmDisconnect] = React.useState(false);
  const [confirmReset, setConfirmReset] = React.useState(false);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your business details, hours and plan."
        action={<SavedPill />}
      />

      {error ? (
        <p className="mb-4 rounded-md bg-accent-soft px-4 py-3 text-sm font-medium text-accent">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-5">
        {/* ---------------- Business profile ---------------- */}
        <Section title="Business profile" description="This is what your assistant tells customers about you.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name" htmlFor="business-name">
              <Input
                id="business-name"
                value={business.name}
                onChange={(event) => updateBusiness({ name: event.target.value })}
                placeholder="e.g. Malaika Hair Studio"
              />
            </Field>
            <Field label="Business type" htmlFor="business-type">
              <Select
                id="business-type"
                value={business.type}
                onChange={(event) =>
                  updateBusiness({ type: event.target.value as typeof business.type })
                }
              >
                {BUSINESS_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Location" htmlFor="business-location" className="sm:col-span-2" hint="Building, street and a landmark customers know.">
              <Input
                id="business-location"
                value={business.location}
                onChange={(event) => updateBusiness({ location: event.target.value })}
                placeholder="e.g. Kilimani, Nairobi"
              />
            </Field>
          </div>

          {/* WhatsApp connection */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-9 place-items-center rounded-full bg-[#25D366]/15 text-[#1c9e4d]">
                <MessageCircle className="size-5" />
              </span>
              <div>
                <p className="text-[15px] font-semibold">
                  {business.whatsapp_connected ? "WhatsApp is connected" : "WhatsApp not connected"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {business.whatsapp_number ?? "No number yet"}
                </p>
              </div>
            </div>
            {business.whatsapp_connected ? (
              <Button variant="secondary" size="sm" onClick={() => setConfirmDisconnect(true)}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" onClick={() => updateBusiness({ whatsapp_connected: true })}>
                Connect WhatsApp
              </Button>
            )}
          </div>
        </Section>

        {/* ---------------- Working hours ---------------- */}
        <Section title="Working hours" description="Your assistant uses these when customers ask when you're open.">
          <div className="flex flex-col divide-y divide-border">
            {DAYS.map((day) => {
              const value = business.hours[day.key];
              return (
                <div key={day.key} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-24 text-[15px] font-medium">{day.label}</span>
                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`open-${day.key}`}>
                      {day.label} opening time
                    </label>
                    <Input
                      id={`open-${day.key}`}
                      type="time"
                      value={value.open}
                      disabled={value.closed}
                      onChange={(event) =>
                        updateBusiness({
                          hours: {
                            ...business.hours,
                            [day.key]: { ...value, open: event.target.value },
                          },
                        })
                      }
                      className="h-11 w-[7.5rem]"
                    />
                    <span className="text-muted-foreground">to</span>
                    <label className="sr-only" htmlFor={`close-${day.key}`}>
                      {day.label} closing time
                    </label>
                    <Input
                      id={`close-${day.key}`}
                      type="time"
                      value={value.close}
                      disabled={value.closed}
                      onChange={(event) =>
                        updateBusiness({
                          hours: {
                            ...business.hours,
                            [day.key]: { ...value, close: event.target.value },
                          },
                        })
                      }
                      className="h-11 w-[7.5rem]"
                    />
                  </div>
                  <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={value.closed}
                      onChange={(event) =>
                        updateBusiness({
                          hours: {
                            ...business.hours,
                            [day.key]: { ...value, closed: event.target.checked },
                          },
                        })
                      }
                      className="size-5 accent-[var(--primary)]"
                    />
                    Closed
                  </label>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ---------------- Notifications ---------------- */}
        <Section title="Notifications" description="How we reach you on WhatsApp. We keep it quiet by default.">
          <div className="divide-y divide-border">
            <SwitchRow
              title="New booking"
              description="A message whenever your assistant books someone in."
              checked={business.notify_new_booking}
              onCheckedChange={(checked) => updateBusiness({ notify_new_booking: checked })}
            />
            <SwitchRow
              title="Customer needs you"
              description="When your assistant isn't sure and asks a person to follow up."
              checked={business.notify_escalation}
              onCheckedChange={(checked) => updateBusiness({ notify_escalation: checked })}
            />
            <SwitchRow
              title="Daily summary"
              description="One short message each evening with the day's numbers."
              checked={business.notify_daily_summary}
              onCheckedChange={(checked) => updateBusiness({ notify_daily_summary: checked })}
            />
          </div>
        </Section>

        {/* ---------------- Subscription ---------------- */}
        <Section title="Subscription plan" description="Change any time. Nothing is charged in this preview.">
          <div className="grid gap-3 sm:grid-cols-3">
            {PLANS.map((plan) => {
              const active = business.plan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    updateBusiness({ plan: plan.id });
                    toast.success(`You're on ${plan.name}`);
                  }}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors",
                    active
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold">{plan.name}</span>
                    {active ? (
                      <Badge tone="brand">
                        <Check className="size-3" /> Current
                      </Badge>
                    ) : null}
                  </span>
                  <span className="text-base font-semibold">
                    {formatKes(plan.price)}
                    <span className="text-sm font-normal text-muted-foreground"> / month</span>
                  </span>
                  <span className="text-sm text-muted-foreground">{plan.blurb}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Need something bigger? We&apos;re happy to help on WhatsApp.
          </p>
        </Section>

        {/* ---------------- Display & account ---------------- */}
        <Section title="Display and account" description="Small details, kept out of the way.">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-[15px] font-medium">Dark mode</p>
              <p className="text-sm text-muted-foreground">
                Light mode is easier to read outdoors.
              </p>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="text-[15px] font-medium">Your data stays yours</p>
                <p className="text-sm text-muted-foreground">
                  We only store phone numbers, messages and bookings.
                </p>
              </div>
            </div>
          </div>

          {demoMode ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex items-start gap-3">
                <Smartphone className="mt-0.5 size-5 text-muted-foreground" />
                <div>
                  <p className="text-[15px] font-medium">Sample data</p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;re exploring the demo salon. Changes stay on this device.
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)}>
                <RefreshCw /> Reset sample data
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div>
                <p className="text-[15px] font-medium">Sign out</p>
                <p className="text-sm text-muted-foreground">
                  Your assistant keeps working while you&apos;re away.
                </p>
              </div>
              <SignOutButton />
            </div>
          )}
        </Section>
      </div>

      <ConfirmDialog
        open={confirmDisconnect}
        onOpenChange={setConfirmDisconnect}
        title="Disconnect WhatsApp?"
        description="Customers will message your number and nobody will reply until you reconnect. You can reconnect any time."
        confirmLabel="Yes, disconnect"
        onConfirm={() => {
          updateBusiness({ whatsapp_connected: false });
          toast.success("WhatsApp disconnected");
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset sample data?"
        description="Any changes you made to the demo salon will be replaced with the original sample data."
        confirmLabel="Yes, reset it"
        onConfirm={resetDemo}
      />
    </>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-0.5 mb-4 text-sm text-muted-foreground">{description}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </Card>
  );
}

function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
        await getSupabaseBrowserClient()?.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      <LogOut /> Sign out
    </Button>
  );
}
