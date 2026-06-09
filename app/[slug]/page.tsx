import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server.ts";
import { validatePublishPayload } from "@/lib/publish.ts";
import { checkSlugLocal } from "@/lib/slugAvailability.ts";
import ResumeSite from "../tools/pdf-resume-to-website/ResumeSite";

// Public profile at viberesume.in/{slug}. Static segments under app/ (tools/,
// signup, account, etc.) and reserved slugs (lib/reservedSlugs.ts) win first
// — this only matches user-claimed handles. notFound() if missing, unowned,
// or not yet published.

type Ctx = { params: Promise<{ slug: string }> };

async function loadProfile(slug: string) {
  if (checkSlugLocal(slug)) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("slugs")
    .select("slug, resume_data, published_at")
    .eq("slug", slug)
    .maybeSingle();
  if (!data || !data.published_at || !data.resume_data) return null;
  const validated = validatePublishPayload(data.resume_data);
  if (!validated.ok) return null;
  return { slug: data.slug, ...validated.payload };
}

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const profile = await loadProfile(slug);
  if (!profile) return { title: "Not found — Vibe Resume" };
  const name = profile.resume.name || slug;
  const title = profile.resume.title
    ? `${name} — ${profile.resume.title}`
    : `${name} · Vibe Resume`;
  const desc = profile.resume.summary?.slice(0, 160)
    || `${name}'s resume on Vibe Resume.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/${slug}` },
    openGraph: { title, description: desc, type: "profile" },
  };
}

export default async function PublicProfilePage({ params }: Ctx) {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const profile = await loadProfile(slug);
  if (!profile) notFound();

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "32px 16px" }}>
      <ResumeSite
        data={profile.resume}
        photoUrl={profile.photoUrl}
        themeId={profile.themeId}
      />
    </main>
  );
}
