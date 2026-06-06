// Pure model for the Portfolio Handle Checker (Tool #10).
//
// Honesty matters here: the only platform we can *actually* check from the
// browser is GitHub (its public API returns 404 for a free username, and is
// CORS-open — we already use it in tools #3/#7). Everything else is CORS- and
// ToS-blocked, so we never fake a result: those become "open to check" links.

export type Platform = {
  id: string;
  label: string;
  /** Profile URL for a handle. */
  url: (h: string) => string;
  /** True only when we can truthfully check availability from the browser. */
  live: boolean;
};

export const PLATFORMS: Platform[] = [
  { id: "github", label: "GitHub", url: (h) => `https://github.com/${h}`, live: true },
  { id: "linkedin", label: "LinkedIn", url: (h) => `https://www.linkedin.com/in/${h}`, live: false },
  { id: "x", label: "X (Twitter)", url: (h) => `https://x.com/${h}`, live: false },
  { id: "instagram", label: "Instagram", url: (h) => `https://www.instagram.com/${h}`, live: false },
  { id: "dribbble", label: "Dribbble", url: (h) => `https://dribbble.com/${h}`, live: false },
  { id: "devto", label: "Dev.to", url: (h) => `https://dev.to/${h}`, live: false },
];

/** Lowercase, strip a leading @, keep only handle-legal characters. */
export function normalizeHandle(raw: string | undefined): string {
  return (raw ?? "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "");
}

/** A handle is usable if it normalizes to 1–39 chars (GitHub's max). */
export function isValidHandle(raw: string | undefined): boolean {
  const h = normalizeHandle(raw);
  return h.length >= 1 && h.length <= 39;
}

export type Target = { id: string; label: string; url: string; live: boolean };

/** Build the per-platform targets for a (already normalized) handle. */
export function buildTargets(handle: string): Target[] {
  return PLATFORMS.map((p) => ({ id: p.id, label: p.label, url: p.url(handle), live: p.live }));
}

export const githubApiUrl = (handle: string): string =>
  `https://api.github.com/users/${encodeURIComponent(handle)}`;
