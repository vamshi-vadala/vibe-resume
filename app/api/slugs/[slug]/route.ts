import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server.ts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin.ts";
import { checkSlugLocal, type SlugStatus } from "@/lib/slugAvailability.ts";

// REST resource for a single slug. Phase 1 uses GET + POST. Phase 2 will add
// PATCH (publish / update resume_data + theme_id). Phase 3 will add DELETE
// (unpublish / release the reservation). Keeping the route shape stable now
// avoids renaming callers later.

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { slug: raw } = await ctx.params;
  const slug = raw.toLowerCase();

  const local = checkSlugLocal(slug);
  if (local) return NextResponse.json(local);

  // Anon SELECT is allowed by RLS (slugs_select_all); the browser could also
  // call Supabase directly, but routing through here keeps the contract single.
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("slugs")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "lookup_failed" },
      { status: 500 }
    );
  }

  const result: SlugStatus = data ? { status: "taken" } : { status: "available" };
  return NextResponse.json(result);
}

export async function POST(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { slug: raw } = await ctx.params;
  const slug = raw.toLowerCase();

  const local = checkSlugLocal(slug);
  if (local) return NextResponse.json(local, { status: 409 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Use admin client for the insert: we already verified the user above and
  // we want a clean unique-violation error path, not RLS noise.
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("slugs")
    .insert({ slug, user_id: user.id });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ status: "taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ status: "reserved", slug }, { status: 201 });
}

// PATCH: Phase 2 — publish or update resume_data/theme_id on an owned slug.
// DELETE: Phase 3 — unpublish or release reservation (RLS slugs_delete_own
//   already permits this once the handler is added).
