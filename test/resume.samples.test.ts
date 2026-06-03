// Regression tests against real-world resume PDFs. The sample files live OUTSIDE
// the repo (they're third-party templates we don't redistribute), so these tests
// auto-skip when the directory is absent — e.g. in CI. Run locally to guard the
// header-extraction quality we tuned the parser to on actual templates.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseResume, linesFromItems, type PositionedItem } from "../lib/resume.ts";

const here = dirname(fileURLToPath(import.meta.url));
const SAMPLES = join(here, "..", "..", "sample pdf resumes");
const present = existsSync(SAMPLES);

// Expected header extraction per sample (title omitted where the source PDF
// genuinely destroys it via uniform letter-spacing — a clean blank is correct).
const EXPECT: Record<string, { name: string; title?: string; hasSections?: boolean }> = {
  "Dublin-Resume-Template-Modern.pdf": { name: "Esther Scott", title: "", hasSections: true },
  "Moscow-Creative-Resume-Template.pdf": { name: "MICHELLE LOPEZ", title: "Fashion Designer", hasSections: true },
  "New-York-Resume-Template-Creative.pdf": { name: "ROBERT COOPER", title: "", hasSections: true },
  "Personal-trainer-resume-example-3.pdf": { name: "Charly Dolman", title: "Personal Trainer", hasSections: true },
  "Stockholm-Resume-Template-Simple.pdf": { name: "Jason Miller", title: "Amazon Associate", hasSections: true },
  "Sydney-Resume-Template-Modern.pdf": { name: "Kristen Connelly", title: "", hasSections: true },
  "Ux-designer-resume-example-5.pdf": { name: "John Huber", title: "UX Designer" },
};

async function extractLines(path: string) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(readFileSync(path));
  const doc = await pdfjs.getDocument({ data }).promise;
  const lines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const pageWidth = page.getViewport({ scale: 1 }).width;
    const content = await page.getTextContent();
    const items: PositionedItem[] = [];
    for (const it of content.items) {
      if (!("str" in it) || !it.str) continue;
      const tr = it.transform;
      items.push({ str: it.str, x: tr[4], y: tr[5], w: it.width ?? 0, size: Math.hypot(tr[1], tr[3]) || Math.abs(tr[3]) });
    }
    lines.push(...linesFromItems(items, pageWidth));
  }
  return lines;
}

for (const [file, exp] of Object.entries(EXPECT)) {
  test(`sample: ${file}`, { skip: present ? false : "sample PDFs not present" }, async () => {
    const d = parseResume(await extractLines(join(SAMPLES, file)));
    assert.equal(d.name, exp.name, "name");
    if (exp.title !== undefined) assert.equal(d.title, exp.title, "title");
    assert.equal(d.empty, false, "should not be empty");
    if (exp.hasSections) assert.ok(d.sections.length > 0, "should have at least one section");
    // Skills must never contain date ranges or obvious fragments.
    assert.ok(!d.skills.some((s) => /[—–]/.test(s) || /\b(19|20)\d{2}\b/.test(s)), "no date ranges in skills");
    assert.ok(!d.skills.some((s) => /^\s*[a-z]/.test(s)), "no lowercase-start fragments in skills");
  });
}
