import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server.ts";
import PublishClient from "./PublishClient";

export const metadata: Metadata = {
  title: "Publish — Vibe Resume",
  robots: { index: false, follow: false },
};

// Landing for the PDF-tool "Publish" CTA. Reads the resume stashed in
// sessionStorage on the client, picks (or asks the user to pick) which
// claimed handle to publish it to, then PATCHes /api/slugs/[slug].

export default async function PublishLandingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signup?next=/account/publish");

  const { data: slugs } = await supabase
    .from("slugs")
    .select("slug, published_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const handles = slugs ?? [];

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "64px 24px", fontFamily: "inherit" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Publish your resume</h1>
      {handles.length === 0 ? (
        <>
          <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
            You haven’t reserved a viberesume.in handle yet. Pick one first — then come back to publish.
          </p>
          <Link
            href="/tools/portfolio-handle-checker"
            style={{ color: "var(--accent)", fontWeight: 600 }}
          >
            Check a handle →
          </Link>
        </>
      ) : (
        <PublishClient handles={handles.map((h) => ({ slug: h.slug, isLive: !!h.published_at }))} />
      )}
    </main>
  );
}
