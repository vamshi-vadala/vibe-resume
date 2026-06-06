// Pure model for the Portfolio "About Me" Generator (Tool #6 — AboutMeAI).
//
// A deterministic, tone-driven template engine: it turns a few fields (role,
// optional name/years/skills, tone) into several ready-to-paste "about me"
// variations. Deterministic in = deterministic out, so the Node test runner
// covers it fully. The generated text IS the product, so the phrasings are
// hand-written per tone rather than word-salad assembly.

export type Tone = "professional" | "friendly" | "confident" | "creative";

export const TONES: { id: Tone; label: string; hint: string }[] = [
  { id: "professional", label: "Professional", hint: "Polished and recruiter-ready" },
  { id: "friendly", label: "Friendly", hint: "Warm and approachable" },
  { id: "confident", label: "Confident", hint: "Bold and results-first" },
  { id: "creative", label: "Creative", hint: "Playful with a point of view" },
];

export type AboutInput = {
  name?: string;
  role: string;
  years?: number | string;
  skills?: string;
  tone?: Tone;
};

export type AboutVariant = {
  id: "oneliner" | "about" | "story" | "bio";
  /** Short human label for the card. */
  label: string;
  /** What it's good for. */
  use: string;
  text: string;
};

// ---- small text helpers --------------------------------------------------

const capFirst = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** "a" / "an" with an acronym guard so "UX designer" -> "a UX designer". */
function article(word: string): string {
  if (!word) return "a";
  const isAcronym = word.length >= 2 && word[0] === word[0].toUpperCase() && word[1] === word[1].toUpperCase();
  if (isAcronym) return "a";
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

/** Oxford-comma join: ["a","b","c"] -> "a, b, and c". */
function joinList(items: string[], conj = "and"): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conj} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${conj} ${items[items.length - 1]}`;
}

/** Short ampersand join of up to 3 items: "a, b & c". */
function joinAmp(items: string[]): string {
  const a = items.slice(0, 3);
  if (a.length <= 1) return a[0] ?? "";
  return `${a.slice(0, -1).join(", ")} & ${a[a.length - 1]}`;
}

/** Split a free-text skills field into clean, deduped entries (cap 6). */
export function parseSkills(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,/|\n]+/)) {
    const s = part.trim().replace(/\s+/g, " ");
    const key = s.toLowerCase();
    if (s && !seen.has(key)) { seen.add(key); out.push(s); }
    if (out.length >= 6) break;
  }
  return out;
}

/** Parse a years value to a sane positive integer, or null. */
function parseYears(raw: number | string | undefined): number | null {
  if (raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(Math.floor(n), 60);
}

export function isValidRole(role: string | undefined): boolean {
  return Boolean(role && /[a-z]/i.test(role));
}

// ---- generation context --------------------------------------------------

type Ctx = {
  name: string;
  firstName: string;
  role: string;        // as typed (trimmed)
  years: number | null;
  skills: string[];
  list: string;        // oxford-joined skills
  amp: string;         // short "&" joined skills
  yearsWith: string;   // " with 6+ years of experience" | ""
  yearsDot: string;    // " · 6+ years" | ""
};

function buildCtx(input: AboutInput): Ctx | null {
  const role = (input.role ?? "").trim();
  if (!isValidRole(role)) return null;
  const name = (input.name ?? "").trim();
  const skills = parseSkills(input.skills);
  const years = parseYears(input.years);
  return {
    name,
    firstName: name.split(/\s+/)[0] ?? "",
    role,
    years,
    skills,
    list: joinList(skills),
    amp: joinAmp(skills),
    yearsWith: years ? ` with ${years}+ years of experience` : "",
    yearsDot: years ? ` · ${years}+ years` : "",
  };
}

// ---- per-tone phrasing ---------------------------------------------------
// Each returns the three first-person variants. The third-person bio is shared.

type ToneRender = (c: Ctx) => { oneliner: string; about: string; storyExtra: string };

const RENDER: Record<Tone, ToneRender> = {
  professional: (c) => ({
    oneliner: `${capFirst(c.role)}${c.yearsDot} specializing in ${c.amp || "digital product design"}.`,
    about: `I'm ${article(c.role)} ${c.role}${c.yearsWith}, specializing in ${c.list || "designing digital products"}. I turn complex problems into clear, usable experiences that teams can actually ship.`,
    storyExtra: ` I care about the small details that make a product feel effortless, and I work closely with engineers and stakeholders so the final result holds up in the real world.`,
  }),
  friendly: (c) => ({
    oneliner: `${capFirst(c.role)} who loves ${c.amp || "making things people enjoy using"}.`,
    about: `Hey — I'm ${article(c.role)} ${c.role}${c.yearsWith} with a love for ${c.list || "design that feels human"}. I care about the people on the other side of the screen, and I try to make every project clear, kind and genuinely useful.`,
    storyExtra: ` Whether I'm sketching early ideas or polishing the last pixel, I like keeping things collaborative and low-ego — the best work happens when everyone feels heard.`,
  }),
  confident: (c) => ({
    oneliner: `${capFirst(c.role)}${c.yearsDot} shipping standout work in ${c.amp || "design"}.`,
    about: `I'm ${article(c.role)} ${c.role}${c.yearsWith} who builds standout work in ${c.list || "design"}. I take ideas from messy to shipped, and I sweat the details that separate good from forgettable.`,
    storyExtra: ` I'm at my best when the brief is ambitious and the stakes are real — hand me the hard problem and I'll bring back something sharp, considered and ready to launch.`,
  }),
  creative: (c) => ({
    oneliner: `Part ${c.role}, full-time maker — living at the intersection of ${c.amp || "design & ideas"}.`,
    about: `I'm ${article(c.role)} ${c.role}${c.yearsWith}, happiest at the intersection of ${c.list || "craft and curiosity"}. I like work with a point of view: bold where it counts, quiet where it should be, and always a little more thoughtful than it had to be.`,
    storyExtra: ` Give me a blank canvas and a real problem and I'll turn it into something people remember — then sweat every detail until it feels inevitable.`,
  }),
};

function thirdPerson(c: Ctx): string {
  const focus = c.list ? ` focused on ${c.list}` : "";
  const subj = c.firstName || "They";
  return `${c.name} is ${article(c.role)} ${c.role}${c.yearsWith}${focus}. ${subj} turns complex ideas into clear, polished work and partners closely with teams to ship it.`;
}

/**
 * Generate the about-me variants. Always returns the one-liner, about and
 * story; adds a third-person bio when a name is supplied. Returns [] if the
 * role is missing/invalid.
 */
export function generateAbout(input: AboutInput): AboutVariant[] {
  const c = buildCtx(input);
  if (!c) return [];
  const tone = (input.tone && RENDER[input.tone] ? input.tone : "professional") as Tone;
  const r = RENDER[tone](c);

  const variants: AboutVariant[] = [
    { id: "oneliner", label: "One-liner", use: "Hero tagline or profile headline", text: r.oneliner },
    { id: "about", label: "About section", use: "The intro paragraph on your portfolio", text: r.about },
    { id: "story", label: "Longer story", use: "An expanded bio or about page", text: r.about + r.storyExtra },
  ];
  if (c.name) {
    variants.push({ id: "bio", label: "Third-person bio", use: "Speaker bios, press and directories", text: thirdPerson(c) });
  }
  return variants;
}
