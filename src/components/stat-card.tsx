import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Big, glanceable number card for the dashboard. One number, one label, one
 * reassuring sentence — readable at arm's length on a phone.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "brand",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  tone?: "brand" | "alert" | "neutral";
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[15px] font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full",
            tone === "alert"
              ? "bg-accent-soft text-accent"
              : tone === "neutral"
                ? "bg-muted text-muted-foreground"
                : "bg-primary-soft text-primary",
          )}
        >
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="text-[34px] font-semibold leading-none tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
