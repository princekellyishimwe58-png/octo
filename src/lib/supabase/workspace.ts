import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Booking,
  Business,
  Conversation,
  Faq,
  Message,
  Service,
  Workspace,
} from "../types";

/**
 * Loads and saves a whole workspace through Supabase.
 *
 * Row-level security does the access control: every query below is already
 * limited to the signed-in owner by the policies in `supabase/schema.sql`.
 * The write is an "upsert everything, delete what disappeared" sync, which is
 * plenty for the small amount of data one business has.
 */

const CHILD_TABLES = [
  { table: "services", key: "services" },
  { table: "faqs", key: "faqs" },
  { table: "conversations", key: "conversations" },
  { table: "messages", key: "messages" },
  { table: "bookings", key: "bookings" },
] as const;

export async function loadSupabaseWorkspace(
  supabase: SupabaseClient,
): Promise<{ workspace: Workspace | null; error?: string }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { workspace: null };

  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (error) return { workspace: null, error: error.message };
  if (!business) return { workspace: null };

  const [services, faqs, conversations, messages, bookings] = await Promise.all([
    supabase.from("services").select("*").eq("business_id", business.id),
    supabase.from("faqs").select("*").eq("business_id", business.id),
    supabase.from("conversations").select("*").eq("business_id", business.id),
    supabase.from("messages").select("*").eq("business_id", business.id),
    supabase.from("bookings").select("*").eq("business_id", business.id),
  ]);

  return {
    workspace: {
      business: business as Business,
      services: (services.data ?? []) as Service[],
      faqs: (faqs.data ?? []) as Faq[],
      conversations: (conversations.data ?? []) as Conversation[],
      messages: (messages.data ?? []) as Message[],
      bookings: (bookings.data ?? []) as Booking[],
      onboarded_at: business.onboarded_at ?? null,
    },
  };
}

export async function saveSupabaseWorkspace(
  supabase: SupabaseClient,
  workspace: Workspace,
): Promise<{ error?: string }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Please sign in again." };

  const businessRow = {
    ...workspace.business,
    owner_id: auth.user.id,
    onboarded_at: workspace.onboarded_at,
  };

  const { error: businessError } = await supabase
    .from("businesses")
    .upsert(businessRow, { onConflict: "id" });
  if (businessError) return { error: businessError.message };

  for (const { table, key } of CHILD_TABLES) {
    const rows = workspace[key] as unknown as Record<string, unknown>[];
    if (rows.length) {
      const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
      if (error) return { error: error.message };
    }
    // Remove rows the owner deleted in the UI.
    const ids = rows.map((row) => row.id as string);
    const deleteQuery = supabase
      .from(table)
      .delete()
      .eq("business_id", workspace.business.id);
    const { error: deleteError } = ids.length
      ? await deleteQuery.not("id", "in", `(${ids.join(",")})`)
      : await deleteQuery;
    if (deleteError) return { error: deleteError.message };
  }

  return {};
}
