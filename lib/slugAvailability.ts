// Single source of truth for "is this slug available?". Used by the GET
// /api/slugs/[slug] endpoint, the handle checker (via that endpoint), and the
// claim path (via the same endpoint). Keep all rules here so the DB constraint,
// the reserved list and the format check can't drift.

import { isReservedSlug } from "./reservedSlugs.ts";

export type SlugStatus =
  | { status: "available" }
  | { status: "invalid"; reason: "format" | "length" }
  | { status: "reserved" }
  | { status: "taken" };

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLUG_MIN = 3;
export const SLUG_MAX = 30;

/** Format/length/reserved checks — pure, no DB. */
export function checkSlugLocal(slug: string): SlugStatus | null {
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) {
    return { status: "invalid", reason: "length" };
  }
  if (!SLUG_RE.test(slug)) return { status: "invalid", reason: "format" };
  if (isReservedSlug(slug)) return { status: "reserved" };
  return null;
}
