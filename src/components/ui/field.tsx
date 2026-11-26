import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Form primitives. All inputs are 48px tall with 16px text so iOS does not
 * zoom and thumbs can hit them easily.
 */

export function Label({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("text-base font-medium text-foreground", className)}
      {...props}
    />
  );
}

export function FieldHint({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm font-medium text-accent">
      {children}
    </p>
  );
}

const fieldBase =
  "w-full rounded-md border border-input bg-card px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground/80 outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-60 aria-invalid:border-accent aria-invalid:ring-2 aria-invalid:ring-accent/20";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(fieldBase, "h-12", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBase, "min-h-24 resize-y leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        fieldBase,
        "h-12 appearance-none bg-[length:18px] bg-[right_0.9rem_center] bg-no-repeat pr-10",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2218%22 height=%2218%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2355655f%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

/** A labelled field with an optional hint or inline error. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <FieldError>{error}</FieldError> : hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}
