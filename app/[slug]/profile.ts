import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin.ts";
import { validatePublishPayload, type PublishPayload } from "@/lib/publish.ts";
import { checkSlugLocal } from "@/lib/slugAvailability.ts";

// Shared profile loader + metadata derivation for the public profile route.
// Used by page.tsx (render + generateMetadata + JSON-LD) and opengraph-image.tsx
// so they agree on what a slug resolves to and how its name/title read.
//
// Reads via the service-role client because anon no longer has SELECT on
// resume_data; every read here is scoped to published_at IS NOT NULL.

export type Loaded =
  | { kind: "profile"; slug: string; payload: PublishPayload }
  | { kind: "claimable"; slug: string } // valid, unreserved, unclaimed → invite
  | null;                               // invalid/reserved/claimed-but-hidden → 404

export async function loadProfile(slug: string): Promise<Loaded> {
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

export function nameForMeta(p: PublishPayload): string {
  if (p.kind === "github") return p.profile.name;
  if (p.kind === "developer") return p.profile.name;
  return p.resume.name;
}

export function subtitleForMeta(p: PublishPayload): string {
  return p.kind === "resume" ? p.resume.title
    : p.kind === "developer" ? p.profile.headline
    : p.profile.headline;
}

export function descForMeta(p: PublishPayload): string {
  if (p.kind === "github") return p.profile.about || p.profile.headline;
  if (p.kind === "developer") return p.profile.summary || p.profile.headline;
  return p.resume.summary || `${p.resume.name}'s resume on Vibe Resume.`;
}

export function titleForMeta(p: PublishPayload): string {
  const name = nameForMeta(p);
  const subtitle = subtitleForMeta(p);
  return subtitle ? `${name} — ${subtitle}` : `${name} · Vibe Resume`;
}

const URL_RE = /\bhttps?:\/\/\S+|\b(?:www\.)?[a-z0-9-]+\.(?:com|io|dev|me|net|org|co|ai)(?:\/\S*)?/i;

/** Profile/social URLs to expose as schema.org `sameAs`, derived from the
 *  resume's contact lines (LinkedIn, GitHub, personal site, etc.). */
function sameAsFromContacts(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    for (const tok of line.split(/\s*[·•|]\s*|\s{2,}/)) {
      if (tok.includes("@")) continue;            // emails handled separately
      const m = tok.match(URL_RE);
      if (!m) continue;
      const u = /^https?:\/\//i.test(m[0]) ? m[0] : `https://${m[0]}`;
      if (!out.includes(u)) out.push(u);
    }
  }
  return out;
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

/** schema.org Person JSON-LD for a published profile — helps the page rank for
 *  the owner's name. Only fields we actually have are emitted. */
export function personJsonLd(p: PublishPayload, slug: string): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: nameForMeta(p),
    url: `https://viberesume.in/${slug}`,
  };
  const subtitle = subtitleForMeta(p);
  if (subtitle) ld.jobTitle = subtitle;

  if (p.kind === "resume") {
    const email = p.resume.contactLines.map((l) => l.match(EMAIL_RE)?.[0]).find(Boolean);
    if (email) ld.email = email;
    const sameAs = sameAsFromContacts(p.resume.contactLines);
    if (sameAs.length) ld.sameAs = sameAs;
  } else {
    const gh = p.kind === "github" ? p.profile.githubUrl : p.profile.githubUrl;
    if (gh) ld.sameAs = [gh];
  }
  return ld;
}
