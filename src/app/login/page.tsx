"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Sparkles } from "lucide-react";
import { supabaseConfigured, getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useOcto } from "@/lib/store";
import { OctoMark } from "@/components/octo-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

/**
 * Sign in. With Supabase configured this sends a magic link — no passwords to
 * forget. Without keys, the page becomes a friendly door into the demo.
 */
export default function LoginPage() {
  const router = useRouter();
  const { loadSampleData } = useOcto();
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = React.useState<string | null>(null);

  async function sendLink(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("That email doesn't look right. Please check it.");
      return;
    }
    setError(null);
    setState("sending");
    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase!.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/home` },
    });
    if (authError) {
      setError("We couldn't send the link. Please try again in a moment.");
      setState("idle");
      return;
    }
    setState("sent");
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <OctoMark className="size-12 rounded-2xl" />
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to Octo</h1>
          <p className="text-base text-muted-foreground">
            Your WhatsApp assistant, set up in minutes.
          </p>
        </div>

        <Card className="p-5 sm:p-6">
          {!supabaseConfigured ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-md bg-primary-soft px-4 py-3 text-sm text-primary">
                You&apos;re viewing a preview without accounts. Everything works on
                sample data, saved on this device.
              </div>
              <Button size="lg" onClick={() => router.push("/onboarding")}>
                Set up my business
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={async () => {
                  await loadSampleData();
                  router.push("/home");
                }}
              >
                <Sparkles /> Explore with sample data
              </Button>
            </div>
          ) : state === "sent" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
                <Mail className="size-6" />
              </span>
              <h2 className="text-lg font-semibold">Check your email</h2>
              <p className="text-base text-muted-foreground">
                We sent a sign-in link to <strong>{email}</strong>. Open it on this
                phone or computer.
              </p>
            </div>
          ) : (
            <form onSubmit={sendLink} className="flex flex-col gap-4">
              <Field
                label="Your email"
                htmlFor="email"
                hint="We'll send you a link. No password needed."
                error={error ?? undefined}
              >
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
              <Button type="submit" size="lg" disabled={state === "sending"}>
                {state === "sending" ? (
                  <>
                    <Loader2 className="animate-spin" /> Sending…
                  </>
                ) : (
                  "Send me a sign-in link"
                )}
              </Button>
            </form>
          )}
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Need a hand? Tap &ldquo;Need help?&rdquo; inside the app to message us on
          WhatsApp.
        </p>
      </div>
    </main>
  );
}
