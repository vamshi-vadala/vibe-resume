import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server.ts";
import { validatePublishPayload } from "@/lib/publish.ts";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Edit profile — Vibe Resume",
  robots: { index: false, follow: false },
};

type Ctx = { params: Promise<{ slug: string }> };

export default async function SettingsPage({ params }: Ctx) {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/signup?next=/account/${slug}/settings`);

  const { data: row } = await supabase
    .from("slugs")
    .select("slug, user_id, published_at, resume_data")
    .eq("slug", slug)
    .maybeSingle();

  if (!row) notFound();
  if (row.user_id !== user.id) redirect("/account");

  // No resume_data yet → user reserved but never published. Send them to the
  // publish flow rather than showing an empty form.
  if (!row.resume_data) redirect("/account/publish");

  const validated = validatePublishPayload(row.resume_data);
  if (!validated.ok) {
    // Stored row is somehow malformed — back to /account with an error rather
    // than crashing the editor.
    redirect("/account?error=bad_data&slug=" + slug);
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "inherit" }}>
      <header style={{ marginBottom: 24 }}>
        <Link href="/account" style={{ color: "var(--accent)", fontSize: 14, fontWeight: 600 }}>
          ← Back to account
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 8, marginBottom: 4 }}>
          Edit viberesume.in/{row.slug}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          {row.published_at
            ? <>Live — changes go out as soon as you save. <Link href={`/${row.slug}`} style={{ color: "var(--accent)" }}>View live →</Link></>
            : <>Unpublished — saving re-publishes.</>}
        </p>
      </header>
      <SettingsClient slug={row.slug} initial={validated.payload} isLive={!!row.published_at} />
    </main>
  );
}
