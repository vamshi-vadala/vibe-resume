// Pure resume parsing — no DOM/PDF/React deps. Unit-testable.
// Takes already-extracted plain text (the PDF text layer) and turns it into the
// structured data a one-page personal website renders from. Tolerant by design:
// messy input degrades gracefully, never throws.

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
  // Headings are short. A 14-word "line" is prose, not a heading.
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
      if (s && s.length <= 40) out.push(s);
    }
  }
  // de-dupe, preserve order, cap to keep the preview tidy
  return [...new Set(out)].slice(0, 30);
}

/**
 * Parse extracted resume text into structured website data.
 * @param rawText newline-joined text from the PDF text layer (or pasted text).
 */
export function parseResume(rawText: string): ResumeData {
  const lines = String(rawText)
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/ /g, " ").trimEnd())
    .filter((l) => l.trim().length > 0);

  const empty: ResumeData = {
    name: "", title: "", contactLines: [], summary: "", sections: [], skills: [], empty: true,
  };
  if (lines.length === 0) return empty;

  // --- Header: name, title, contact — from the lines before the first section heading.
  let firstSectionIdx = lines.findIndex((l) => matchSection(l));
  const headerEnd = firstSectionIdx === -1 ? Math.min(lines.length, 6) : firstSectionIdx;
  const header = lines.slice(0, headerEnd);

  const contactLines: string[] = [];
  const headerText: string[] = [];
  for (const l of header) {
    if (isContact(l)) contactLines.push(l.trim());
    else headerText.push(l.trim());
  }

  // Name = first non-contact header line; strip trailing role after a separator.
  const nameLine = headerText[0] ?? lines[0].trim();
  const name = nameLine.split(/\s+[•|·–—]\s+/)[0].trim();
  // Title = the leftover of the name line, or the next header line.
  const afterName = nameLine.slice(name.length).replace(/^[\s•|·–—]+/, "").trim();
  const title = afterName || headerText[1] || "";

  // --- Body: walk lines, grouping under the current section heading.
  const sections: ResumeSection[] = [];
  let skills: string[] = [];
  let summary = "";
  let current: { label: string; skills: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    if (current.label === "Summary") {
      summary = current.items.join(" ").trim();
    } else if (current.skills) {
      skills = skills.concat(splitSkills(current.items));
    } else if (current.items.length) {
      sections.push({ heading: current.label, items: current.items });
    }
    current = null;
  };

  const bodyStart = firstSectionIdx === -1 ? headerEnd : firstSectionIdx;
  for (const line of lines.slice(bodyStart)) {
    const hit = matchSection(line);
    if (hit) {
      flush();
      current = { label: hit.label, skills: hit.skills, items: [] };
      continue;
    }
    if (!current) continue; // stray line before any heading
    const item = line.replace(BULLET_LEAD, "").trim();
    if (item) current.items.push(item);
  }
  flush();

  const skillsUnique = [...new Set(skills)].slice(0, 30);
  const hasContent = !!(name || summary || sections.length || skillsUnique.length);

  return {
    name: name || "Your Name",
    title,
    contactLines,
    summary,
    sections,
    skills: skillsUnique,
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
