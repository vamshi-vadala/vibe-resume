// Pure model for the Dev Portfolio Theme Picker (Tool #4 — ThemeDeck).
//
// A "theme" is just a named set of design tokens. The picker renders one fixed
// SAMPLE portfolio over and over, restyled by whichever theme is on top of the
// deck — so the tokens here, not any per-theme markup, are what makes each look
// distinct. Tokens are emitted as scoped `--t-*` CSS custom properties
// (see themeStyle) so a theme can never leak into the app's own --accent etc.
//
// All logic in this file is pure and framework-free so the Node test runner can
// cover it without a DOM.

/** The CSS custom-property names every theme must define. */
export const THEME_VAR_KEYS = [
  "bg",          // page background
  "surface",     // card / panel background
  "text",        // primary text
  "muted",       // secondary text
  "accent",      // links, headline, primary action
  "onAccent",    // text on top of an accent fill
  "border",      // hairlines and card borders
  "borderWidth", // 1px normally, heavier for brutalist looks
  "radius",      // corner rounding
  "font",        // body font stack
  "headingFont", // heading font stack (often == font)
  "headingWeight",
  "hero",        // hero band background (a solid or a gradient)
  "chip",        // skill-chip background
] as const;

export type ThemeVarKey = (typeof THEME_VAR_KEYS)[number];

export type Theme = {
  id: string;
  name: string;
  /** One-line "vibe" shown under the name in the deck. */
  vibe: string;
  /** Short descriptors used as filter-ish chips, e.g. ["dark", "monospace"]. */
  tags: string[];
  vars: Record<ThemeVarKey, string>;
};

// The deck, in display order. Designed to feel obviously different at a glance:
// light/dark, serif/sans/mono, sharp/rounded, flat/gradient.
export const THEMES: Theme[] = [
  {
    id: "midnight",
    name: "Midnight Pro",
    vibe: "Sleek dark UI with an electric-blue accent.",
    tags: ["dark", "modern"],
    vars: {
      bg: "#0b1020",
      surface: "#141a2e",
      text: "#e7ecf6",
      muted: "#8a94ad",
      accent: "#5b8cff",
      onAccent: "#07142e",
      border: "#232b45",
      borderWidth: "1px",
      radius: "14px",
      font: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      headingFont: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      headingWeight: "800",
      hero: "radial-gradient(120% 140% at 0% 0%, #1b2547 0%, #0b1020 60%)",
      chip: "#1b2240",
    },
  },
  {
    id: "paper",
    name: "Paper",
    vibe: "Editorial and clean — serif headings, lots of white.",
    tags: ["light", "minimal"],
    vars: {
      bg: "#ffffff",
      surface: "#ffffff",
      text: "#1a1a1a",
      muted: "#6b6b6b",
      accent: "#111111",
      onAccent: "#ffffff",
      border: "#e6e6e6",
      borderWidth: "1px",
      radius: "4px",
      font: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      headingFont: "Georgia, 'Times New Roman', serif",
      headingWeight: "700",
      hero: "#ffffff",
      chip: "#f3f3f3",
    },
  },
  {
    id: "terminal",
    name: "Terminal",
    vibe: "Monospace green-on-black for the command-line soul.",
    tags: ["dark", "monospace"],
    vars: {
      bg: "#0a0e0a",
      surface: "#0f150f",
      text: "#c8f7c5",
      muted: "#6f9e6c",
      accent: "#38d65b",
      onAccent: "#04230c",
      border: "#1d2a1d",
      borderWidth: "1px",
      radius: "2px",
      font: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
      headingFont: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
      headingWeight: "700",
      hero: "#0a0e0a",
      chip: "#12200f",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    vibe: "Warm gradient hero with a bold coral accent.",
    tags: ["dark", "gradient"],
    vars: {
      bg: "#1a1018",
      surface: "#251521",
      text: "#fdeef0",
      muted: "#c79aa6",
      accent: "#ff7a59",
      onAccent: "#2a0d06",
      border: "#3a2330",
      borderWidth: "1px",
      radius: "16px",
      font: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      headingFont: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      headingWeight: "800",
      hero: "linear-gradient(135deg, #ff7a59 0%, #ff3d77 55%, #7a2ff2 100%)",
      chip: "#34202d",
    },
  },
  {
    id: "pastel",
    name: "Pastel",
    vibe: "Soft, friendly and very rounded.",
    tags: ["light", "playful"],
    vars: {
      bg: "#faf7ff",
      surface: "#ffffff",
      text: "#2a2440",
      muted: "#655d82",
      accent: "#7c3aed",
      onAccent: "#ffffff",
      border: "#ece6fb",
      borderWidth: "1px",
      radius: "20px",
      font: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      headingFont: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      headingWeight: "700",
      hero: "linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)",
      chip: "#f1ecfe",
    },
  },
  {
    id: "brutalist",
    name: "Brutalist",
    vibe: "Stark black borders, hard corners, zero fuss.",
    tags: ["light", "bold"],
    vars: {
      bg: "#f5f3ea",
      surface: "#ffffff",
      text: "#111111",
      muted: "#555555",
      accent: "#c1410b",
      onAccent: "#ffffff",
      border: "#111111",
      borderWidth: "2px",
      radius: "0px",
      font: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      headingFont: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      headingWeight: "900",
      hero: "#c1410b",
      chip: "#ffffff",
    },
  },
];

/** Look a theme up by id, falling back to the first (default) theme. */
export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Next card in the deck (wraps around). */
export function nextIndex(i: number, len: number = THEMES.length): number {
  if (len <= 0) return 0;
  return (i + 1) % len;
}

/** Previous card in the deck (wraps around). */
export function prevIndex(i: number, len: number = THEMES.length): number {
  if (len <= 0) return 0;
  return (i - 1 + len) % len;
}

/**
 * A theme's tokens as a style object of scoped CSS custom properties
 * (`--t-bg`, `--t-accent`, …) to spread onto the preview's root element.
 * The preview's CSS module reads only these `--t-*` vars.
 */
export function themeStyle(theme: Theme): Record<string, string> {
  const style: Record<string, string> = {};
  for (const key of THEME_VAR_KEYS) {
    style[`--t-${cssVar(key)}`] = theme.vars[key];
  }
  return style;
}

/** camelCase token key → kebab-case CSS var suffix (onAccent → on-accent). */
function cssVar(key: ThemeVarKey): string {
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

// ---- The fixed sample portfolio rendered inside every theme ----------------

export type SampleProject = { name: string; desc: string; meta: string };

export type SampleProfile = {
  name: string;
  headline: string;
  about: string;
  stack: string[];
  projects: SampleProject[];
};

export const SAMPLE: SampleProfile = {
  name: "Jordan Rivera",
  headline: "Full-Stack Engineer · React, Node & Go",
  about:
    "I build fast, accessible web apps and the developer tools that make shipping them less painful. Currently into edge runtimes, type-safe APIs and design systems.",
  stack: ["TypeScript", "React", "Node.js", "Go", "PostgreSQL", "AWS"],
  projects: [
    { name: "ledger-cli", desc: "Double-entry accounting in a single plaintext file.", meta: "Go · ★ 1.2k" },
    { name: "wave", desc: "Realtime collaborative whiteboard over WebRTC.", meta: "TypeScript · ★ 840" },
    { name: "dotfiles", desc: "My terminal, editor and shell setup, one command away.", meta: "Shell · ★ 320" },
  ],
};
