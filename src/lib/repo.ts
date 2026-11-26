"use client";

import type { Workspace } from "./types";
import { createSampleWorkspace } from "./sample-data";
import { getSupabaseBrowserClient, supabaseConfigured } from "./supabase/client";
import {
  loadSupabaseWorkspace,
  saveSupabaseWorkspace,
} from "./supabase/workspace";

/**
 * One place that decides where data lives.
 *
 *  - With Supabase keys: Postgres + row-level security, per signed-in owner.
 *  - Without keys: the browser's localStorage, seeded with the demo salon, so
 *    the whole product is usable before any accounts are created.
 */

const LOCAL_KEY = "octo.workspace.v1";

export const demoMode = !supabaseConfigured;

export async function loadWorkspace(): Promise<Workspace | null> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { workspace } = await loadSupabaseWorkspace(supabase);
    return workspace;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw) as Workspace;
  } catch {
    // Corrupt or unavailable storage falls back to fresh demo data.
  }
  return null;
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { error } = await saveSupabaseWorkspace(supabase, workspace);
    if (error) throw new Error(error);
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(workspace));
  } catch {
    throw new Error("We could not save your changes. Please check your connection.");
  }
}

/** Seed the demo salon on first run. */
export async function seedDemoWorkspace(): Promise<Workspace> {
  const workspace = createSampleWorkspace();
  await saveWorkspace(workspace);
  return workspace;
}

/** Wipe local edits and start the demo again (Settings → Reset sample data). */
export async function resetDemoWorkspace(): Promise<Workspace> {
  window.localStorage.removeItem(LOCAL_KEY);
  const workspace = createSampleWorkspace();
  await saveWorkspace(workspace);
  return workspace;
}
