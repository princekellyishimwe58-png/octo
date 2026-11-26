"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { useOcto } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Tiny "Saved" confirmation. It appears for a couple of seconds after an
 * autosave so the owner knows their edit is safe, then gets out of the way.
 *
 * Visibility is derived (no state churn): we simply remember which save we
 * have already hidden again.
 */
export function SavedPill({ className }: { className?: string }) {
  const { saving, savedAt } = useOcto();
  const [hiddenSave, setHiddenSave] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!savedAt) return;
    const timer = setTimeout(() => setHiddenSave(savedAt), 2600);
    return () => clearTimeout(timer);
  }, [savedAt]);

  const showSaved = Boolean(savedAt) && hiddenSave !== savedAt;
  if (!saving && !showSaved) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        saving ? "bg-muted text-muted-foreground" : "bg-success-soft text-primary",
        "animate-in fade-in slide-in-from-top-1 duration-200",
        className,
      )}
    >
      {saving ? (
        <>
          <Loader2 className="size-3.5 animate-spin" /> Saving
        </>
      ) : (
        <>
          <Check className="size-3.5" /> Saved
        </>
      )}
    </span>
  );
}
