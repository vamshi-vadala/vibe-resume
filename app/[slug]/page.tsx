import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin.ts";
import { validatePublishPayload, type PublishPayload } from "@/lib/publish.ts";
import { checkSlugLocal } from "@/lib/slugAvailability.ts";
import ResumeSite from "../tools/pdf-resume-to-website/ResumeSite";
import DevPortfolio from "../tools/developer-resume-to-portfolio/DevPortfolio";
import GhPortfolio from "../tools/github-to-portfolio/GhPortfolio";
import PrintButton from "./PrintButton";

// Public profile at viberesume.in/{slug}. Static segments under app/ (tools/,
// signup, account, etc.) and reserved slugs (lib/reservedSlugs.ts) win first
// — this only matches user-claimed handles. A valid-but-unclaimed slug
// renders a noindex "claim this handle" invite; claimed-but-unpublished or
// invalid slugs 404.
//
// Reads via the service-role client because the anon role no longer has SELECT
// on the `resume_data` column. This page itself filters `published_at IS NOT
// NULL`, so service-role usage is scoped to "render a public profile" and
// never returns draft data. Render dispatches on `payload.kind`:
//   "resume"    → ResumeSite (PDF-parsed resume)
//   "developer" → DevPortfolio (Developer Resume tool)
//   "github"    → GhPortfolio (GitHub username tool)

type Ctx = { params: Promise<{ slug: string }> };
type Loaded =
  | { kind: "profile"; slug: string; payload: PublishPayload }
  | { kind: "claimable"; slug: string } // valid, unreserved, unclaimed → invite
  | null;                               // invalid/reserved/claimed-but-hidden → 404

async function loadProfile(slug: string): Promise<Loaded> {
  if (checkSlugLocal(slug)) return null;
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("slugs")
    .select("slug, resume_data, published_at")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return { kind: "claimable", slug };
  if (!data.published_at || !data.resume_data) return null;
  const validated = validatePublishPayload(data.resume_data);
  if (!validated.ok) return null;
  return { kind: "profile", slug: data.slug, payload: validated.payload };
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
  if (loaded.kind === "claimable") {
    // Acquisition page for a free handle — useful to humans, noise to crawlers.
    return {
      title: `Claim viberesume.in/${slug} — Vibe Resume`,
      robots: { index: false, follow: false },
    };
  }
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

  if (loaded.kind === "claimable") {
    return (
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>
          viberesume.in/{slug} is available
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: 24 }}>
          Nobody has claimed this handle yet. Make it yours and publish your resume or portfolio here — free.
        </p>
        <a
          href={`/claim/${slug}`}
          style={{
            display: "inline-block", padding: "12px 22px", borderRadius: 10,
            fontWeight: 700, fontSize: 15, background: "var(--accent2)",
            color: "var(--on-accent2)", textDecoration: "none",
          }}
        >
          Claim viberesume.in/{slug} →
        </a>
        <p style={{ marginTop: 18, fontSize: 14 }}>
          <a href="/tools/portfolio-handle-checker" style={{ color: "var(--accent)" }}>
            Check a different handle →
          </a>
        </p>
      </main>
    );
  }

  const { payload } = loaded;
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "32px 16px" }} data-print-root>
      <div className="print-hide" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <PrintButton />
      </div>
      {payload.kind === "resume" && (
        <ResumeSite
          data={payload.resume}
          photoUrl={payload.photoUrl}
          themeId={payload.themeId}
          availability={payload.availability}
        />
      )}
      {payload.kind === "developer" && (
        <DevPortfolio data={payload.profile} repos={payload.repos} />
      )}
      {payload.kind === "github" && (
        <GhPortfolio profile={payload.profile} />
      )}
      <footer className="print-hide" style={{ textAlign: "center", marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
        <a href="/" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
          Made with <strong style={{ color: "var(--text)" }}>Vibe Resume</strong> · claim your free handle →
        </a>
      </footer>
    </main>
  );
}
