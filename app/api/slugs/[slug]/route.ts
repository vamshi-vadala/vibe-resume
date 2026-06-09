import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server.ts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin.ts";
import { checkSlugLocal, type SlugStatus } from "@/lib/slugAvailability.ts";
import { validatePublishPayload } from "@/lib/publish.ts";

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

// PATCH: publish or update resume_data on an owned slug. Body is the full
// PublishPayload (resume + photoUrl + themeId). Sets published_at on first
// publish; always bumps updated_at.
export async function PATCH(req: Request, ctx: Ctx): Promise<NextResponse> {
  const { slug: raw } = await ctx.params;
  const slug = raw.toLowerCase();

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }

  const validated = validatePublishPayload(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.reason }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // Confirm ownership before any write.
  const { data: row, error: lookupErr } = await supabase
    .from("slugs")
    .select("user_id, published_at")
    .eq("slug", slug)
    .maybeSingle();
  if (lookupErr) return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (row.user_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error: updErr } = await admin
    .from("slugs")
    .update({
      resume_data: validated.payload,
      theme_id: validated.payload.themeId || null,
      published_at: row.published_at ?? now,
      updated_at: now,
    })
    .eq("slug", slug);

  if (updErr) return NextResponse.json({ error: "update_failed" }, { status: 500 });
  return NextResponse.json({ status: "published", slug });
}

// DELETE: unpublish — clears published_at but KEEPS the reservation and
// resume_data so the user can re-publish later. Releasing the handle entirely
// (actual row delete) is a separate Phase 3 affordance.
export async function DELETE(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { slug: raw } = await ctx.params;
  const slug = raw.toLowerCase();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { data: row, error: lookupErr } = await supabase
    .from("slugs")
    .select("user_id")
    .eq("slug", slug)
    .maybeSingle();
  if (lookupErr) return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (row.user_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { error: updErr } = await admin
    .from("slugs")
    .update({ published_at: null, updated_at: new Date().toISOString() })
    .eq("slug", slug);

  if (updErr) return NextResponse.json({ error: "unpublish_failed" }, { status: 500 });
  return NextResponse.json({ status: "unpublished", slug });
}
