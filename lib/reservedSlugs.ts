// Slugs that may never be claimed as a published profile (viberesume.in/{slug}).
// Covers: existing routes, framework reserved paths, generic high-value names,
// and any future auth/dashboard surfaces. Keep alphabetised within each group.
//
// The DB also enforces slug FORMAT (lowercase, 3-30 chars, [a-z0-9-]). This
// list enforces COLLISION with real routes — which is app-level, not DB-level.

import { TOOLS } from "./tools.ts";

const TOOL_SLUGS = TOOLS.map((t) => t.href.replace(/^\/tools\//, ""));

const STATIC_RESERVED = [
  // top-level routes that exist today
  "tools", "signup", "contact", "privacy", "terms", "example",
  // framework / hosting
  "_next", "api", "favicon.ico", "icon.svg", "manifest.webmanifest",
  "robots.txt", "sitemap.xml",
  // auth surfaces (Phase 1)
  "auth", "callback", "login", "logout", "signin", "signout",
  // dashboard / account surfaces (reserved for Phase 2-3)
  "account", "admin", "dashboard", "settings", "profile", "billing",
  // marketing surfaces likely to ship later
  "about", "blog", "changelog", "docs", "help", "pricing", "support",
  // legal / brand
  "legal", "press", "security",
  // status / system
  "404", "500", "health", "status",
  // generic high-value handles to keep available
  "claim", "edit", "new", "search", "share",
];

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  ...STATIC_RESERVED,
  ...TOOL_SLUGS,
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
