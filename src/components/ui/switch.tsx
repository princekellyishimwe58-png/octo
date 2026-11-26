"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

/** 44px tall toggle — comfortable on a phone. */
export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-6 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitive.Root>
  );
}

/** A switch plus explanation, used across Settings and Replies. */
export function SwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
  id,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <label htmlFor={fieldId} className="cursor-pointer">
        <span className="block text-base font-medium">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
        ) : null}
      </label>
      <Switch id={fieldId} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
