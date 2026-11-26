import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Friendly, plain-language empty state with a single helpful next action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/60 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
        <Icon className="size-6" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-base text-muted-foreground">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
