"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/badge";
import { useOcto } from "@/lib/store";

/** Keeps the owner inside the app once onboarding is done, and vice versa. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ready, workspace } = useOcto();
  const router = useRouter();

  React.useEffect(() => {
    if (ready && !workspace.onboarded_at) router.replace("/onboarding");
  }, [ready, router, workspace.onboarded_at]);

  if (!ready) return <AppSkeleton />;

  return <AppShell>{children}</AppShell>;
}

/** Shown for the first few hundred milliseconds while data loads. */
function AppSkeleton() {
  return (
    <div className="min-h-dvh bg-background md:pl-64">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-10">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-5 w-80 max-w-full" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}
