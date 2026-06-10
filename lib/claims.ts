import { createSupabaseAdminClient } from "./supabase/admin.ts";

// Server-only. Single claim path shared by /claim/[slug] (page) and
// POST /api/slugs/[slug] so the per-user cap can't be bypassed via one of them.
export const MAX_HANDLES_PER_USER = 5;

export type ClaimResult = "reserved" | "taken" | "limit" | "failed";

export async function claimSlug(userId: string, slug: string): Promise<ClaimResult> {
  const admin = createSupabaseAdminClient();

  const { count, error: countErr } = await admin
    .from("slugs")
    .select("slug", { count: "exact", head: true })
    .eq("user_id", userId);
  if (countErr) return "failed";
  if ((count ?? 0) >= MAX_HANDLES_PER_USER) return "limit";

  const { error } = await admin.from("slugs").insert({ slug, user_id: userId });
  if (error) return error.code === "23505" ? "taken" : "failed";
  return "reserved";
}
