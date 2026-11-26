"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border !border-border !bg-card !text-foreground !shadow-lift !text-base",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
        },
      }}
    />
  );
}
