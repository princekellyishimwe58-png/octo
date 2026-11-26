"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useOcto } from "@/lib/store";
import { OctoMark } from "@/components/octo-mark";

/** Send first-timers into the wizard, and everyone else straight to the dashboard. */
export default function Home() {
  const router = useRouter();
  const { ready, workspace } = useOcto();

  React.useEffect(() => {
    if (!ready) return;
    router.replace(workspace.onboarded_at ? "/home" : "/onboarding");
  }, [ready, router, workspace.onboarded_at]);

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <OctoMark className="size-14 rounded-2xl" />
        <p className="text-lg font-semibold">Getting your assistant ready…</p>
        <p className="text-base text-muted-foreground">
          This takes a moment on a slow connection.
        </p>
      </div>
    </main>
  );
}
