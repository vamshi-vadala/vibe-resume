// Pure model for CaseCrafter — the case-study builder (Tool #9).
//
// It STRUCTURES a freelancer's raw inputs into the proven case-study framework
// (Overview → Challenge → Approach → Outcome) and exports clean Markdown. It
// deliberately does not invent claims — empty sections become guiding prompts,
// not fabricated prose. Deterministic in → deterministic out, fully testable.

export type CaseInput = {
  title: string;
  client?: string;
  role?: string;
  timeline?: string;
  tools?: string;
  challenge?: string;
  process?: string;
  outcome?: string;
};

export type CaseSection = {
  id: "overview" | "challenge" | "approach" | "outcome";
  label: string;
  text: string;
  /** True when the user left it blank and we're showing a guiding prompt. */
  placeholder: boolean;
  /** For the approach section, the process broken into steps. */
  steps?: string[];
};

export type CaseStudy = {
  title: string;
  meta: { label: string; value: string }[];
  tools: string[];
  metrics: string[];
  sections: CaseSection[];
  readingMinutes: number;
};

const clean = (s: string | undefined): string => (s ?? "").trim().replace(/\s+/g, " ");

export function isValidTitle(title: string | undefined): boolean {
  return clean(title).length > 0;
}

/** Split a comma/pipe/newline list into clean, deduped entries (cap 8). */
export function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,/|\n]+/)) {
    const s = part.trim().replace(/\s+/g, " ");
    const key = s.toLowerCase();
    if (s && !seen.has(key)) { seen.add(key); out.push(s); }
    if (out.length >= 8) break;
  }
  return out;
}

/** Split a process field into ordered steps (one per line or sentence). */
export function parseSteps(raw: string | undefined): string[] {
  if (!raw) return [];
  const byLine = raw.split(/\r?\n+/).map((l) => l.replace(/^\s*[-*\d.)]+\s*/, "").trim()).filter(Boolean);
  const parts = byLine.length > 1 ? byLine : raw.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  return parts.slice(0, 8);
}

/** Pull headline metrics ("+32%", "2x", "$1.2M", "#1") out of the outcome text. */
export function extractMetrics(outcome: string | undefined): string[] {
  const text = outcome ?? "";
  const re = /(?:[+\-]?\d[\d,.]*\s?%|\b\d+(?:\.\d+)?x\b|\$\s?\d[\d,.]*\s?[kmb]?\b|#\s?\d+)/gi;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of text.match(re) ?? []) {
    const v = m.replace(/\s+/g, "").toUpperCase();
    if (!seen.has(v)) { seen.add(v); out.push(v.replace(/^\+?/, (s) => s)); }
    if (out.length >= 4) break;
  }
  return out;
}

const wordCount = (s: string): number => (s.trim() ? s.trim().split(/\s+/).length : 0);

export function generateCaseStudy(input: CaseInput): CaseStudy | null {
  const title = clean(input.title);
  if (!title) return null;

  const client = clean(input.client);
  const role = clean(input.role);
  const timeline = clean(input.timeline);
  const tools = parseList(input.tools);
  const challenge = clean(input.challenge);
  const steps = parseSteps(input.process);
  const outcome = clean(input.outcome);
  const metrics = extractMetrics(input.outcome);

  const meta = [
    client && { label: "Client", value: client },
    role && { label: "Role", value: role },
    timeline && { label: "Timeline", value: timeline },
  ].filter(Boolean) as { label: string; value: string }[];

  // Overview is a light, factual lead built only from what was provided.
  const overviewBits = [
    role ? `As ${aOrAn(role)} ${role}` : "",
    client ? `for ${client}` : "",
  ].filter(Boolean).join(" ");
  const overview = [
    overviewBits ? `${title} — ${overviewBits}.` : `${title}.`,
    outcome ? firstSentence(outcome) : "",
  ].filter(Boolean).join(" ").trim();

  const sections: CaseSection[] = [
    {
      id: "overview", label: "Overview", placeholder: false,
      text: overview,
    },
    {
      id: "challenge", label: "The Challenge",
      placeholder: !challenge,
      text: challenge || "What problem were you solving, and why did it matter? Set the stakes in a sentence or two.",
    },
    {
      id: "approach", label: "The Approach",
      placeholder: steps.length === 0,
      text: steps.length === 0 ? "Walk through what you did — research, decisions, iterations. One step per line." : "",
      steps,
    },
    {
      id: "outcome", label: "The Outcome",
      placeholder: !outcome,
      text: outcome || "What changed? Lead with results — numbers if you have them, plus what the client gained.",
    },
  ];

  const bodyWords = wordCount(overview) + wordCount(challenge) + steps.reduce((n, s) => n + wordCount(s), 0) + wordCount(outcome);
  const readingMinutes = Math.max(1, Math.round(bodyWords / 200));

  return { title, meta, tools, metrics, sections, readingMinutes };
}

/** Serialize a case study to clean Markdown (only the parts the user filled in). */
export function toMarkdown(cs: CaseStudy): string {
  const lines: string[] = [`# ${cs.title}`, ""];
  if (cs.meta.length) lines.push(cs.meta.map((m) => `**${m.label}:** ${m.value}`).join("  ·  "), "");
  if (cs.tools.length) lines.push(`**Tools:** ${cs.tools.join(", ")}`, "");
  if (cs.metrics.length) lines.push(cs.metrics.join("  ·  "), "");
  for (const s of cs.sections) {
    if (s.placeholder) continue;
    lines.push(`## ${s.label}`);
    if (s.id === "approach" && s.steps?.length) {
      for (const step of s.steps) lines.push(`- ${step}`);
    } else if (s.text) {
      lines.push(s.text);
    }
    lines.push("");
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

// ---- helpers -------------------------------------------------------------

function aOrAn(word: string): string {
  if (!word) return "a";
  const acronym = word.length >= 2 && word[0] === word[0].toUpperCase() && word[1] === word[1].toUpperCase();
  if (acronym) return "a";
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function firstSentence(s: string): string {
  const m = s.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : s).trim();
}
