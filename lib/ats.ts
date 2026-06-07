// Pure ATS analysis logic — no DOM/React deps. Unit-testable.

export type IssueLevel = "ok" | "info" | "warn" | "bad";
export interface Issue { lvl: IssueLevel; msg: string; points: number; fixed: boolean }
export interface AtsResult { text: string; issues: Issue[]; score: number }

/** Score at/above which a resume is considered ATS-friendly. */
export const TARGET_SCORE = 85;

const WEIGHTS: Record<IssueLevel, number> = { bad: 22, warn: 9, info: 2, ok: 0 };

/**
 * Split recommendations into what the converter already cleaned ("done for you",
 * applied to the copied text) vs what the user must change in their source resume.
 * Each list is sorted highest-impact first.
 */
export function recommendations(result: AtsResult): { autoFixed: Issue[]; toEdit: Issue[] } {
  const fixable = result.issues.filter((i) => i.lvl !== "ok" && i.points > 0);
  const byImpact = (a: Issue, b: Issue) => b.points - a.points;
  return {
    autoFixed: fixable.filter((i) => i.fixed).sort(byImpact),
    toEdit: fixable.filter((i) => !i.fixed).sort(byImpact),
  };
}

const SECTION_HINTS = [
  /\bEXPERIENCE\b/i, /\bWORK HISTORY\b/i, /\bEMPLOYMENT\b/i,
  /\bEDUCATION\b/i, /\bSKILLS\b/i, /\bPROJECTS\b/i, /\bSUMMARY\b/i,
];
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /(\+?\d[\d\s().-]{7,}\d)/;
const DATE_RANGE = /\b(19|20)\d{2}\b.{0,6}(present|current|(19|20)\d{2})/i;

/** Clean raw resume text into the plain text an ATS would parse. */
export function analyzeResume(raw: string): AtsResult {
  const issues: Issue[] = [];
  const add = (lvl: IssueLevel, msg: string, fixed = false) =>
    issues.push({ lvl, msg, points: WEIGHTS[lvl], fixed });

  let t = String(raw).replace(/\r\n?/g, "\n");

  // 1. Special / typographic characters
  if (/[“”‘’–—… ​-‍﻿]/.test(t)) {
    add("warn", "Special characters (smart quotes, em-dashes, non-breaking/zero-width spaces) — these often garble in ATS parsers. Replaced with plain equivalents.", true);
  }
  t = t
    .replace(/[​-‍﻿]/g, "")
    .replace(/ /g, " ")
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-").replace(/…/g, "...");

  // 2. Bullet glyphs -> "- "
  if (/[•▪●◦‣·∙]/.test(t)) {
    add("info", "Decorative bullets normalized to plain dashes (-) for reliable parsing.", true);
  }
  t = t.replace(/^[ \t]*[•▪●◦‣·∙]\s*/gm, "- ").replace(/[•▪●◦‣·∙]/g, " ");

  // 3. Multi-column / table layout
  const colLines = t.split("\n").filter(l => (l.match(/\S {3,}\S/g) || []).length >= 1).length;
  if (colLines >= 2) {
    add("bad", `Column or table layout detected on ${colLines} line(s). ATS reads left-to-right, so columns get scrambled. Flatten to a single column.`);
  }
  t = t.replace(/[ \t]{2,}/g, " ");

  // 4. Remaining non-ASCII
  const nonAscii = t.match(/[^\x00-\x7F]/g);
  if (nonAscii && nonAscii.length) {
    add("warn", `${nonAscii.length} non-standard character(s) remain (emoji/symbols). ATS may read these as noise — consider removing.`);
  }

  // 5. Contact info
  if (!EMAIL.test(t)) add("bad", "No email address found. ATS often keys candidate records off a parseable email.");
  if (!PHONE.test(t)) add("warn", "No phone number detected in a standard format.");

  // 6. Section headings
  const hits = SECTION_HINTS.filter(re => re.test(t)).length;
  if (hits < 2) add("warn", "Few standard section headings (EXPERIENCE, EDUCATION, SKILLS…). ATS uses these to bucket your content — name sections plainly.");

  // 7. Date ranges
  if (!DATE_RANGE.test(t)) add("info", "No clear date ranges (e.g. 2021–Present) found. Dates help ATS build your work timeline.");

  // collapse whitespace / blank lines
  t = t.split("\n").map(l => l.trimEnd()).join("\n").replace(/\n{3,}/g, "\n\n").trim();

  const penalty = issues.reduce((s, i) => s + i.points, 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  if (!issues.length) add("ok", "No major parsing risks found — this resume reads cleanly as plain text.");

  return { text: t, issues, score };
}

export function grade(score: number): { label: string; tone: IssueLevel } {
  if (score >= 85) return { label: "ATS-friendly", tone: "ok" };
  if (score >= 60) return { label: "Needs minor fixes", tone: "warn" };
  return { label: "ATS risk — fix before applying", tone: "bad" };
}

export const SAMPLE_RESUME = `JANE DOE  •  Senior Product Designer
San Francisco, CA | jane@example.com | (415) 555-0192

EXPERIENCE
●  Acme Corp — Lead Designer        2021–Present
   ▪ Drove a 32% lift in activation through onboarding redesign
   ▪ Managed a team of 4 designers
●  Globex — Product Designer         2018–2021
   – Shipped a design system used across 12 products

EDUCATION
●  BFA Design — 2014

SKILLS
Figma     Sketch     Prototyping     User Research`;
