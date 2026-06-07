// Pure model for the LinkedIn URL Customizer (Tool #5).
//
// Turns a person's name (plus an optional role/keyword) into a ranked set of
// clean, professional, LinkedIn-legal custom-URL slugs. No framework, no DOM —
// fully covered by the Node test runner.
//
// LinkedIn custom URL rules we honor: 3–100 chars, lowercase letters, digits and
// hyphens only, no leading/trailing hyphen, no doubled hyphens.

const LINKEDIN_BASE = "https://www.linkedin.com/in/";
const VIBE_BASE = "https://viberesume.in/";

// Combining diacritical marks (U+0300–U+036F), left over after NFKD decomposition.
const DIACRITICS = /[̀-ͯ]/g;
// Punctuation we delete outright so "O'Brien" -> "obrien", "J.R." -> "jr".
const DROP = /['’.]/g;

/** Lowercase, strip accents, drop anything but [a-z0-9], collapse to hyphens. */
export function slugify(input: string): string {
  return sanitizeSlug(
    input
      .normalize("NFKD")
      .replace(DIACRITICS, "")
      .toLowerCase()
      .replace(DROP, "")
      .replace(/[^a-z0-9]+/g, "-") // any run of others -> a hyphen
  );
}

/** Enforce the LinkedIn-legal shape: collapse/trim hyphens. */
export function sanitizeSlug(s: string): string {
  return s.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

/** Split a display name into clean lowercase alphanumeric parts. */
function nameParts(name: string): string[] {
  return name
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(DROP, "").replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
}

/** A name is usable if it yields at least one alphabetic character. */
export function isValidName(name: string): boolean {
  return /[a-z]/i.test(name) && nameParts(name).length > 0;
}

export const linkedinUrl = (slug: string): string => LINKEDIN_BASE + slug;
export const vibeUrl = (slug: string): string => VIBE_BASE + slug;

export type SlugSuggestion = {
  slug: string;
  /** Short human label for the variant. */
  label: string;
  /** Why this one is worth considering. */
  note: string;
};

/**
 * Build a ranked list of slug suggestions. The first is LinkedIn's own
 * recommendation (full name, hyphenated). Variants degrade gracefully for
 * single-word names and only include a keyword variant when a keyword is given.
 */
export function generateSlugs(name: string, keyword = ""): SlugSuggestion[] {
  const parts = nameParts(name);
  if (parts.length === 0) return [];

  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const kw = slugify(keyword);

  const out: SlugSuggestion[] = [];
  const push = (slug: string, label: string, note: string) => {
    const clean = sanitizeSlug(slug);
    if (clean.length >= 3) out.push({ slug: clean, label, note });
  };

  // 1. Full name, hyphenated — LinkedIn's recommendation.
  push(parts.join("-"), "Clean & classic", "LinkedIn recommends your full name, hyphenated — clear and search-friendly.");

  // 2. Concatenated, no separators.
  push(parts.join(""), "Compact", "No separators — short, tidy and easy to say out loud.");

  // 3. Keyword / specialty (only when provided).
  if (kw) {
    const base = last ? `${first}-${last}` : first;
    push(`${base}-${kw}`, "With your specialty", "Adds your field so recruiters searching that term land on you.");
  }

  if (last) {
    // 4. First initial + surname — the classic professional handle.
    push(`${first[0]}${last}`, "Initial + surname", "The newspaper-byline look: a tidy, professional handle.");
    // 5. First name + surname initial.
    push(`${first}-${last[0]}`, "First name forward", "Leads with your first name when your surname is long or common.");
    // 6. Drop the middle name(s), if any.
    if (parts.length > 2) push(`${first}-${last}`, "First & last only", "Skips middle names for a shorter, cleaner URL.");
  } else {
    // Single-word name fallback.
    push(`${first}-portfolio`, "Name + portfolio", "Pairs a single name with a descriptor so it reads as a profile.");
  }

  return dedupe(out);
}

/** Drop suggestions whose slug repeats an earlier one, preserving order. */
function dedupe(list: SlugSuggestion[]): SlugSuggestion[] {
  const seen = new Set<string>();
  return list.filter((s) => (seen.has(s.slug) ? false : (seen.add(s.slug), true)));
}
