import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin.ts";
import { validatePublishPayload, type PublishPayload } from "@/lib/publish.ts";
import { checkSlugLocal } from "@/lib/slugAvailability.ts";
import ResumeSite from "../tools/pdf-resume-to-website/ResumeSite";
import DevPortfolio from "../tools/developer-resume-to-portfolio/DevPortfolio";
import GhPortfolio from "../tools/github-to-portfolio/GhPortfolio";

// Public profile at viberesume.in/{slug}. Static segments under app/ (tools/,
// signup, account, etc.) and reserved slugs (lib/reservedSlugs.ts) win first
// — this only matches user-claimed handles. notFound() if missing, unowned,
// or not yet published.
//
// Reads via the service-role client because the anon role no longer has SELECT
// on the `resume_data` column. This page itself filters `published_at IS NOT
// NULL`, so service-role usage is scoped to "render a public profile" and
// never returns draft data. Render dispatches on `payload.kind`:
//   "resume"    → ResumeSite (PDF-parsed resume)
//   "developer" → DevPortfolio (Developer Resume tool)
//   "github"    → GhPortfolio (GitHub username tool)

type Ctx = { params: Promise<{ slug: string }> };
type Loaded = { slug: string; payload: PublishPayload };

async function loadProfile(slug: string): Promise<Loaded | null> {
  if (checkSlugLocal(slug)) return null;
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("slugs")
    .select("slug, resume_data, published_at")
    .eq("slug", slug)
    .not("published_at", "is", null)
    .maybeSingle();
  if (!data || !data.resume_data) return null;
  const validated = validatePublishPayload(data.resume_data);
  if (!validated.ok) return null;
  return { slug: data.slug, payload: validated.payload };
}

function nameForMeta(p: PublishPayload): string {
  if (p.kind === "github") return p.profile.name;
  if (p.kind === "developer") return p.profile.name;
  return p.resume.name;
}
function descForMeta(p: PublishPayload): string {
  if (p.kind === "github") return p.profile.about || p.profile.headline;
  if (p.kind === "developer") return p.profile.summary || p.profile.headline;
  return p.resume.summary || `${p.resume.name}'s resume on Vibe Resume.`;
}
function titleForMeta(p: PublishPayload): string {
  const name = nameForMeta(p);
  const subtitle = p.kind === "resume" ? p.resume.title
    : p.kind === "developer" ? p.profile.headline
    : p.profile.headline;
  return subtitle ? `${name} — ${subtitle}` : `${name} · Vibe Resume`;
}

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const loaded = await loadProfile(slug);
  if (!loaded) return { title: "Not found — Vibe Resume" };
  const title = titleForMeta(loaded.payload);
  const desc = descForMeta(loaded.payload).slice(0, 160);
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
  const loaded = await loadProfile(slug);
  if (!loaded) notFound();

  const { payload } = loaded;
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "32px 16px" }}>
      {payload.kind === "resume" && (
        <ResumeSite data={payload.resume} photoUrl={payload.photoUrl} themeId={payload.themeId} />
      )}
      {payload.kind === "developer" && (
        <DevPortfolio data={payload.profile} repos={payload.repos} />
      )}
      {payload.kind === "github" && (
        <GhPortfolio profile={payload.profile} />
      )}
    </main>
  );
}
