import "server-only";
import { unstable_cache } from "next/cache";

// Server-side profile pageview counts for /account, read from PostHog via a
// personal API key + HogQL. Off by default: with either env var missing this
// returns {} and the dashboard simply shows no counts — so local dev and CI
// (no key) behave exactly as before. Never throws.
//
// Required env (server-only, NOT NEXT_PUBLIC):
//   POSTHOG_PERSONAL_API_KEY  — personal key scoped to `query:read`, Sensitive
//   POSTHOG_PROJECT_ID        — numeric project id
// Reuses NEXT_PUBLIC_POSTHOG_HOST for the region; the query API lives on the
// app host (us.posthog.com), not the ingestion host (us.i.posthog.com).

const INGEST_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const API_HOST = INGEST_HOST.replace(".i.posthog.com", ".posthog.com");

async function fetchViews(slugs: string[]): Promise<Record<string, number>> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!key || !projectId || slugs.length === 0) return {};

  // Slugs are validated [a-z0-9-]{3,30}, so direct interpolation is injection-safe.
  const paths = slugs.map((s) => `'/${s}'`).join(", ");
  const query =
    `SELECT properties.$pathname AS path, count() AS views ` +
    `FROM events WHERE event = '$pageview' AND properties.$pathname IN (${paths}) ` +
    `GROUP BY path`;

  try {
    const res = await fetch(`${API_HOST}/api/projects/${projectId}/query/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    });
    if (!res.ok) return {};
    const json = (await res.json()) as { results?: Array<[string, number]> };
    const out: Record<string, number> = {};
    for (const [path, views] of json.results ?? []) {
      if (typeof path === "string" && path.startsWith("/")) out[path.slice(1)] = Number(views) || 0;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Pageview counts keyed by slug for the given published slugs. Cached for an
 * hour (per slug-set) so a busy /account doesn't hammer the PostHog query API.
 * Missing slugs simply have no entry (treat as 0).
 */
export async function getProfileViews(slugs: string[]): Promise<Record<string, number>> {
  if (!process.env.POSTHOG_PERSONAL_API_KEY || !process.env.POSTHOG_PROJECT_ID) return {};
  const sorted = [...slugs].sort();
  if (sorted.length === 0) return {};
  const cached = unstable_cache(
    () => fetchViews(sorted),
    ["profile-views", sorted.join(",")],
    { revalidate: 3600 }
  );
  return cached();
}
