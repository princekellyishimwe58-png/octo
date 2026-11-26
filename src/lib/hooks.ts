"use client";

import * as React from "react";

/**
 * True only after React has hydrated in the browser.
 *
 * Used to keep device-only state (a saved onboarding draft, for example) out of
 * the server render, so hydration always matches and we never need to call
 * setState from an effect.
 */
const subscribe = () => () => {};

export function useHydrated() {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
