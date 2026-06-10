import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin.ts";

// Slug-squat TTL (Vercel cron, see vercel.json). Frees handles that were
// claimed but never used: never published AND no resume_data AND older than
// 30 days. Reservations with draft data or a publish history are never reaped
// — deleting a user's work over inactivity would be hostile.
// Vercel invokes this with `Authorization: Bearer ${CRON_SECRET}` when the
// CRON_SECRET env var is set on the project.
export async function GET(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("slugs")
    .delete()
    .is("published_at", null)
    .is("resume_data", null)
    .lt("created_at", cutoff)
    .select("slug");

  if (error) return NextResponse.json({ error: "reap_failed" }, { status: 500 });
  return NextResponse.json({ status: "ok", reaped: data?.length ?? 0 });
}
