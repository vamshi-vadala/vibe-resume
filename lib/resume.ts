// Pure resume parsing — no DOM/PDF/React deps. Unit-testable.
// Turns a PDF's positioned text (or pasted text) into the structured data a
// one-page personal website renders from. Tolerant by design: messy input
// degrades gracefully, never throws.

export interface ResumeSection {
  heading: string;
  items: string[];
}
export interface ResumeData {
  name: string;
  title: string;
  contactLines: string[];
  summary: string;
  sections: ResumeSection[];
  skills: string[];
  /** true when we found almost nothing usable (e.g. a scanned/image-only PDF). */
  empty: boolean;
}

/** A single positioned text run from the PDF (one page's coordinate space). */
export interface PositionedItem {
  str: string;
  x: number;    // left edge, PDF points (origin bottom-left)
  y: number;    // baseline y, PDF points (higher = nearer the top)
  w: number;    // run width, PDF points
  size: number; // glyph height (font size), PDF points
}
/** A reconstructed line of text plus the largest font size on it. */
export interface TextLine {
  text: string;
  size: number;
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /(\+?\d[\d\s().-]{7,}\d)/;
const URL = /\b((https?:\/\/)?(www\.)?[a-z0-9-]+\.(com|io|dev|me|net|org|co|ai)(\/\S*)?)\b/i;
const LINKEDIN = /linkedin\.com\/\S+/i;
const GITHUB = /github\.com\/\S+/i;

const CONTACT_RE = [EMAIL, PHONE, LINKEDIN, GITHUB, URL];

// Section keywords -> canonical display heading. Order matters only for matching.
const SECTION_MAP: Array<{ re: RegExp; label: string; skills?: boolean }> = [
  { re: /^(professional\s+)?summary\b|^profile\b|^about( me)?\b|^objective\b/i, label: "Summary" },
  { re: /^(work\s+)?experience\b|^employment\b|^work history\b|^professional experience\b/i, label: "Experience" },
  { re: /^education\b|^academics?\b/i, label: "Education" },
  { re: /^projects?\b/i, label: "Projects" },
  { re: /^(technical\s+)?skills\b|^technologies\b|^competencies\b|^expertise\b/i, label: "Skills", skills: true },
  { re: /^certifications?\b|^licenses?\b/i, label: "Certifications" },
  { re: /^awards?\b|^honors?\b|^achievements?\b/i, label: "Awards" },
  { re: /^publications?\b/i, label: "Publications" },
  { re: /^languages?\b/i, label: "Languages", skills: true },
  { re: /^volunteer(ing)?\b|^community\b/i, label: "Volunteering" },
  { re: /^interests?\b|^hobbies\b/i, label: "Interests", skills: true },
];

const BULLET_LEAD = /^[\s•▪●◦‣·∙*\-–—]+/;

function matchSection(line: string): { label: string; skills: boolean } | null {
  const trimmed = line.trim();
  // Headings are short. A 6+-word "line" is prose, not a heading.
  if (trimmed.split(/\s+/).length > 5) return null;
  for (const s of SECTION_MAP) {
    if (s.re.test(trimmed)) return { label: s.label, skills: !!s.skills };
  }
  return null;
}

function isContact(line: string): boolean {
  return CONTACT_RE.some((re) => re.test(line));
}

/** Split a skills blob into discrete chips on common separators. */
function splitSkills(items: string[]): string[] {
  const out: string[] = [];
  for (const raw of items) {
    for (const piece of raw.split(/[,|•·▪●◦‣∙/]|\s{2,}|\s•\s/)) {
      const s = piece.replace(BULLET_LEAD, "").trim();
      // Keep short, label-like chips; reject sentence fragments (trailing period,
      // too long, or ending in a comma-less clause).
      if (s && s.length <= 32 && !/[.;]$/.test(s) && s.split(/\s+/).length <= 5) out.push(s);
    }
  }
  return [...new Set(out)].slice(0, 30);
}

// ----- Column-aware line reconstruction ------------------------------------

const Y_TOL = 3; // points; items within this vertical distance are the same line

/**
 * Find a vertical gutter splitting a two-column page, or null for single column.
 * Looks for a near-empty vertical strip in the central region with populated text
 * on both sides (a real sidebar layout, not just a wide margin).
 */
function findGutter(items: PositionedItem[], pageWidth: number): number | null {
  if (pageWidth <= 0 || items.length < 8) return null;
  const BINS = 60;
  const binW = pageWidth / BINS;
  const rowKey = (y: number) => Math.round(y / Y_TOL);
  const rowCount = new Set(items.map((i) => rowKey(i.y))).size;

  // For each x-bin, how many distinct rows have text overlapping it.
  const cover: Array<Set<number>> = Array.from({ length: BINS }, () => new Set<number>());
  for (const it of items) {
    const start = Math.max(0, Math.floor(it.x / binW));
    const end = Math.min(BINS - 1, Math.floor((it.x + it.w) / binW));
    for (let b = start; b <= end; b++) cover[b].add(rowKey(it.y));
  }
  const counts = cover.map((s) => s.size);

  // Lowest-coverage bin in the central region is the gutter candidate.
  const lo = Math.floor(BINS * 0.22), hi = Math.ceil(BINS * 0.78);
  let best = -1, bestVal = Infinity;
  for (let b = lo; b <= hi; b++) if (counts[b] < bestVal) { bestVal = counts[b]; best = b; }
  if (best < 0 || bestVal > rowCount * 0.1) return null; // gutter not empty enough

  const gx = best * binW + binW / 2;
  const left = new Set<number>(), right = new Set<number>();
  for (const it of items) (it.x + it.w / 2 < gx ? left : right).add(rowKey(it.y));
  // Both sides must be substantially populated to count as two columns.
  if (left.size < rowCount * 0.2 || right.size < rowCount * 0.2) return null;
  return gx;
}

/** Group a set of items (already column-scoped) into top-to-bottom lines. */
function rowsToLines(items: PositionedItem[]): TextLine[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: PositionedItem[][] = [];
  for (const it of sorted) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last[0].y - it.y) <= Y_TOL) last.push(it);
    else rows.push([it]);
  }
  const lines: TextLine[] = [];
  for (const row of rows) {
    const cells = row.sort((a, b) => a.x - b.x);
    let text = cells.map((c) => c.str).join(" ").replace(/\s{2,}/g, " ").trim();
    // Some templates letter-space whole lines ("J A N U A R Y 2 0 2 0"); collapse
    // the per-glyph spacing back into readable words where possible.
    if (isLetterSpaced(text)) text = deLetterSpace(text);
    if (text) lines.push({ text, size: Math.max(...cells.map((c) => c.size)) });
  }
  return lines;
}

/** A line is letter-spaced when most whitespace-separated tokens are single chars. */
function isLetterSpaced(text: string): boolean {
  const toks = text.split(/\s+/);
  if (toks.length < 6) return false;
  const singles = toks.filter((t) => t.length === 1).length;
  return singles / toks.length >= 0.6;
}

/**
 * Collapse uniform per-glyph spacing back into words. The word boundary between
 * two all-letter words is lost when the template uses equal advances (so
 * "T R A V E L  A G E N T" can only become "TRAVELAGENT"), but boundaries at
 * digit↔letter transitions and around dashes survive — which recovers the
 * common case: letter-spaced date ranges in experience entries.
 */
function deLetterSpace(text: string): string {
  const merged: string[] = [];
  let buf = "";
  for (const tok of text.split(" ")) {
    if (tok.length === 1) buf += tok;
    else { if (buf) { merged.push(buf); buf = ""; } merged.push(tok); }
  }
  if (buf) merged.push(buf);
  return merged.join(" ")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/\s*([—–])\s*/g, " $1 ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Reconstruct reading-ordered lines from one page's positioned text items.
 * Detects a two-column (sidebar) layout and reads each column in full rather
 * than gluing sidebar + main-column text that happens to share a y-coordinate.
 */
export function linesFromItems(items: PositionedItem[], pageWidth: number): TextLine[] {
  const usable = items.filter((i) => i.str && i.str.trim());
  if (usable.length === 0) return [];
  const gutter = findGutter(usable, pageWidth);
  if (gutter == null) return rowsToLines(usable);
  const left = usable.filter((i) => i.x + i.w / 2 < gutter);
  const right = usable.filter((i) => i.x + i.w / 2 >= gutter);
  return [...rowsToLines(left), ...rowsToLines(right)];
}

// ----- Name detection -------------------------------------------------------

const NAME_SEP = /\s*(?:[,|·•]|\s[–—-]\s)\s*/; // splits "JANE DOE, Title" / "Jane | Role"

// Sidebar labels that must never be mistaken for a job title.
const SIDEBAR_LABEL = /^(details|contact|address|phone|e-?mail|links?|nationality|references?|date|place of birth|driving licen[sc]e|profile)$/i;

/** Does this line look like a person's name (2–4 capitalized words, no digits)? */
function looksLikeName(line: string): boolean {
  const t = line.split(NAME_SEP)[0].trim();
  if (!t || /[\d@]/.test(t)) return false;
  if (matchSection(t)) return false;
  const words = t.split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  // Title Case (Jane Doe) or ALL CAPS (JANE DOE); allow ., ', -
  return /^[A-Z][A-Za-z.'’-]*(\s+[A-Z][A-Za-z.'’-]*){1,3}$/.test(t);
}

function toLines(input: string | TextLine[]): TextLine[] {
  if (typeof input !== "string") {
    return input
      .map((l) => ({ text: l.text.replace(/ /g, " ").trim(), size: l.size }))
      .filter((l) => l.text.length > 0);
  }
  return input
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((t) => ({ text: t.replace(/ /g, " ").trim(), size: 0 }))
    .filter((l) => l.text.length > 0);
}

interface NameMatch { line: TextLine; name: string; idx: number }

/** Name = largest-font name-looking line near the top; falls back to the first
 *  non-contact, non-heading line when font sizes are unavailable (paste path). */
function detectName(lines: TextLine[]): NameMatch {
  const top = lines.slice(0, Math.max(8, Math.ceil(lines.length * 0.4)));
  let best: TextLine | undefined;
  for (const l of top) {
    if (looksLikeName(l.text) && (!best || l.size > best.size)) best = l;
  }
  const line = best ?? top.find((l) => !isContact(l.text) && !matchSection(l.text)) ?? lines[0];
  return { line, name: line.text.split(NAME_SEP)[0].trim(), idx: lines.indexOf(line) };
}

/** Title = leftover after the name on its own line, else the next short,
 *  non-contact, non-heading, non-address line just below the name. */
function detectTitle(lines: TextLine[], { line, name, idx }: NameMatch): string {
  const sameLine = line.text.slice(name.length).replace(/^[\s,|·•–—-]+/, "").trim();
  if (sameLine) return sameLine;
  for (let i = idx + 1; i < Math.min(lines.length, idx + 4); i++) {
    const t = lines[i].text;
    if (isContact(t) || matchSection(t) || SIDEBAR_LABEL.test(t)) continue;
    if (/\d/.test(t)) continue;        // job titles don't contain digits (addresses/dates)
    if (/[A-Z]{9,}/.test(t)) continue; // run-on from collapsed letter-spacing ("TRAVELAGENT")
    if (t.split(/\s+/).length <= 8 && t.length <= 60) return t;
  }
  return "";
}

/** Contact lines, collected from anywhere (sidebars place them far from the name). */
function collectContacts(lines: TextLine[], nameLine: TextLine): string[] {
  return [...new Set(
    lines.filter((l) => l !== nameLine && isContact(l.text)).map((l) => l.text.trim())
  )].slice(0, 4);
}

interface Body { summary: string; sections: ResumeSection[]; skills: string[] }

/** Walk the lines below the header, grouping them under their section headings. */
function extractBody(lines: TextLine[], name: string, nameIdx: number): Body {
  const sections: ResumeSection[] = [];
  let skills: string[] = [];
  let summary = "";
  let current: { label: string; skills: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    if (current.label === "Summary") summary = (summary ? summary + " " : "") + current.items.join(" ").trim();
    else if (current.skills) skills = skills.concat(splitSkills(current.items));
    else if (current.items.length) sections.push({ heading: current.label, items: current.items });
    current = null;
  };

  const firstSectionIdx = lines.findIndex((l) => matchSection(l.text));
  const bodyStart = firstSectionIdx === -1 ? nameIdx + 1 : firstSectionIdx;
  for (const line of lines.slice(bodyStart)) {
    const hit = matchSection(line.text);
    if (hit) {
      flush();
      current = { label: hit.label, skills: hit.skills, items: [] };
      continue;
    }
    if (!current) continue;              // stray line before any heading
    if (isContact(line.text)) continue;  // keep contact noise out of sections
    const item = line.text.replace(BULLET_LEAD, "").trim();
    if (item && item !== name) current.items.push(item);
  }
  flush();
  return { summary, sections, skills: [...new Set(skills)].slice(0, 30) };
}

/**
 * Parse extracted resume content into structured website data.
 * @param input either newline-joined text, or font-size-tagged lines from
 *   `linesFromItems` (which enables largest-font name detection).
 */
export function parseResume(input: string | TextLine[]): ResumeData {
  const lines = toLines(input);
  if (lines.length === 0) {
    return { name: "", title: "", contactLines: [], summary: "", sections: [], skills: [], empty: true };
  }

  const nm = detectName(lines);
  const title = detectTitle(lines, nm);
  const contactLines = collectContacts(lines, nm.line);
  const { summary, sections, skills } = extractBody(lines, nm.name, nm.idx);
  const hasContent = !!(summary || sections.length || skills.length);

  return {
    name: nm.name || "Your Name",
    title,
    contactLines,
    summary,
    sections,
    skills,
    empty: !hasContent,
  };
}

/** Demo resume text so "Try a sample" works with no upload (and e2e needs no fixture). */
export const SAMPLE_RESUME_TEXT = `Jane Doe
Senior Product Designer
San Francisco, CA · jane@email.com · (415) 555-0192 · linkedin.com/in/janedoe

Summary
Product designer with 8+ years shipping consumer and B2B products end to end.
I turn fuzzy problems into simple, measurable experiences and love mentoring teams.

Experience
Lead Designer — Acme Corp (2021–Present)
Drove a 32% lift in activation through an onboarding redesign.
Built and led a team of 4 designers across web and mobile.
Product Designer — Globex (2018–2021)
Shipped a design system adopted across 12 product surfaces.
Partnered with research to cut support tickets by 18%.

Education
BFA, Design — Rhode Island School of Design (2014)

Skills
Figma, Sketch, Prototyping, Design Systems, User Research, HTML/CSS, Accessibility`;
