// Pure unit tests for the resume parser. No PDF/browser needed — fast, deterministic,
// and the safety net that lets us refactor lib/resume.ts without silent regressions.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseResume, linesFromItems, formatBarePhones, type PositionedItem, type TextLine } from "../lib/resume.ts";

const L = (text: string, size = 0): TextLine => ({ text, size });
const item = (str: string, x: number, y: number, w = 50, size = 12): PositionedItem => ({ str, x, y, w, size });

// ---- parseResume: string (paste) path ------------------------------------

test("parses a simple single-column resume", () => {
  const d = parseResume(
    "Jane Doe\nSenior Designer\njane@email.com\n\nSummary\nGreat designer.\n\nSkills\nFigma, Sketch"
  );
  assert.equal(d.name, "Jane Doe");
  assert.equal(d.title, "Senior Designer");
  assert.equal(d.empty, false);
  assert.match(d.summary, /Great designer/);
  assert.deepEqual(d.skills, ["Figma", "Sketch"]);
  assert.ok(d.contactLines.includes("jane@email.com"));
});

test("blank / whitespace input is reported empty", () => {
  assert.equal(parseResume("").empty, true);
  assert.equal(parseResume("   \n  \t ").empty, true);
});

// ---- parseResume: TextLine[] (font-size aware) path ----------------------

test("name is the largest-font name-looking line, not the first line", () => {
  const d = parseResume([
    L("Profile", 10),
    L("Some summary text that runs fairly long across the page", 9),
    L("Esther Scott", 22),
    L("Travel things", 9),
  ]);
  assert.equal(d.name, "Esther Scott");
});

test("splits 'NAME, Title' on the same line", () => {
  const d = parseResume([L("MICHELLE LOPEZ, Fashion Designer", 20), L("email@email.com", 8)]);
  assert.equal(d.name, "MICHELLE LOPEZ");
  assert.equal(d.title, "Fashion Designer");
});

test("never uses a sidebar label, address, or letter-spacing run-on as the title", () => {
  const d = parseResume([
    L("Esther Scott", 22),
    L("Details", 9),            // sidebar label
    L("1515 Pacific Ave", 9),   // address (digits)
    L("TRAVELAGENT", 12),       // collapsed letter-spacing (9+ caps run)
  ]);
  assert.equal(d.title, "");
});

test("collects contacts globally and keeps skills fragment-free", () => {
  const d = parseResume([
    L("Jane Doe", 20),
    L("Skills", 10),
    L("Leadership, goals., Adobe Photoshop, an overly long clause that is clearly not a chip", 9),
    L("linkedin.com/in/jane", 8),
  ]);
  assert.ok(d.contactLines.some((c) => c.includes("linkedin")));
  assert.ok(d.skills.includes("Leadership"));
  assert.ok(d.skills.includes("Adobe Photoshop"));
  assert.ok(!d.skills.includes("goals."), "trailing-period fragment rejected");
  assert.ok(!d.skills.some((s) => s.split(/\s+/).length > 5), "long clause rejected");
});

// ---- linesFromItems: reading-order reconstruction ------------------------

test("single column: items become lines top-to-bottom, left-to-right", () => {
  const lines = linesFromItems(
    [item("World", 140, 700), item("Hello", 40, 700), item("Second", 40, 680)],
    600
  );
  assert.equal(lines[0].text, "Hello World");
  assert.equal(lines[1].text, "Second");
});

test("two-column layout: sidebar and main column are not interleaved", () => {
  const items: PositionedItem[] = [];
  for (let i = 0; i < 10; i++) {
    const y = 700 - i * 20;
    items.push(item(`L${i}`, 40, y, 100));   // left column
    items.push(item(`R${i}`, 320, y, 100));  // right column
  }
  const lines = linesFromItems(items, 600).map((l) => l.text);
  assert.ok(!lines.some((t) => t.includes("L0") && t.includes("R0")), "rows not glued across the gutter");
  assert.ok(lines.indexOf("L9") < lines.indexOf("R0"), "left column read fully before right");
});

test("letter-spaced date line is recovered to readable text", () => {
  const [line] = linesFromItems(
    [item("J A N U A R Y 2 0 2 0 — F E B R U A R Y 2 0 2 2", 40, 600, 220, 8)],
    600
  );
  assert.equal(line.text, "JANUARY 2020 — FEBRUARY 2022");
});

test("normal prose is left untouched by letter-spacing recovery", () => {
  const [line] = linesFromItems([item("Led a team of four designers across web", 40, 600, 300, 11)], 600);
  assert.equal(line.text, "Led a team of four designers across web");
});

// ---- #4a: heading glued to first content item ----------------------------

test("heading glued to content is split: heading starts a new section, remainder is first item", () => {
  const d = parseResume([
    L("Jane Doe", 18),
    L("Employment History Senior Fashion Designer at Escada, Milan", 12),
    L("Designed key product lines.", 10),
  ]);
  const exp = d.sections.find((s) => s.heading === "Experience");
  assert.ok(exp, "Experience section detected");
  assert.ok(exp!.items.some((i) => i.includes("Senior Fashion Designer")), "first item recovered");
});

test("heading-only line still starts a section normally", () => {
  const d = parseResume([L("Jane Doe", 18), L("Experience", 12), L("Built things.", 10)]);
  const exp = d.sections.find((s) => s.heading === "Experience");
  assert.ok(exp, "Experience section detected");
  assert.equal(exp!.items[0], "Built things.");
});

// ---- #4b: skills-sidebar noise -------------------------------------------

test("date ranges are rejected from skills chips", () => {
  const d = parseResume([
    L("Jane Doe", 18),
    L("Skills", 12),
    L("Figma, July 2021 — Present, January 2015 — June 2017, Adobe", 10),
  ]);
  assert.ok(d.skills.includes("Figma"), "Figma kept");
  assert.ok(d.skills.includes("Adobe"), "Adobe kept");
  assert.ok(!d.skills.some((s) => s.includes("2021") || s.includes("2017")), "date ranges rejected");
});

test("standalone place names and short fragments are rejected from skills chips", () => {
  const d = parseResume([
    L("Jane Doe", 18),
    L("Skills", 12),
    L("Design Systems, boosting, San Jacinto, of $67, User Research", 10),
  ]);
  assert.ok(d.skills.includes("Design Systems"), "Design Systems kept");
  assert.ok(d.skills.includes("User Research"), "User Research kept");
  assert.ok(!d.skills.includes("boosting"), "lowercase fragment rejected");
  assert.ok(!d.skills.some((s) => s.startsWith("of ")), "prepositional fragment rejected");
});

// ---- Experience: multi-job sub-grouping ----------------------------------

test("experience splits into per-role entries with date on its own line", () => {
  const d = parseResume([
    L("Jane Doe", 20),
    L("Experience", 13),
    L("Senior Designer, Acme Corp", 11),
    L("Jan 2020 — Present", 10),
    L("• Led the design system", 10),
    L("• Shipped the marketing redesign", 10),
    L("Designer, Beta Inc", 11),
    L("2017 — 2019", 10),
    L("• Built the component library", 10),
  ]);
  const exp = d.sections.find((s) => s.heading === "Experience");
  assert.ok(exp?.entries, "Experience has entries");
  assert.equal(exp!.entries!.length, 2);
  assert.equal(exp!.entries![0].header, "Senior Designer, Acme Corp");
  assert.equal(exp!.entries![0].meta, "Jan 2020 — Present");
  assert.deepEqual(exp!.entries![0].bullets, ["Led the design system", "Shipped the marketing redesign"]);
  assert.equal(exp!.entries![1].header, "Designer, Beta Inc");
  assert.equal(exp!.entries![1].meta, "2017 — 2019");
  assert.deepEqual(exp!.entries![1].bullets, ["Built the component library"]);
  // flat items still populated for backward compatibility
  assert.ok(exp!.items.includes("Led the design system"));
});

test("date range embedded in the header line is pulled into meta", () => {
  const d = parseResume([
    L("Jane Doe", 20),
    L("Experience", 13),
    L("Product Manager, Globex (May 2021 — Aug 2022)", 11),
    L("• Owned the roadmap", 10),
  ]);
  const exp = d.sections.find((s) => s.heading === "Experience");
  assert.equal(exp!.entries!.length, 1);
  assert.equal(exp!.entries![0].header, "Product Manager, Globex");
  assert.equal(exp!.entries![0].meta, "May 2021 — Aug 2022");
  assert.deepEqual(exp!.entries![0].bullets, ["Owned the roadmap"]);
});

test("achievement lines without bullet markers attach to the role, not as new roles", () => {
  const d = parseResume([
    L("Jane Doe", 20),
    L("Experience", 13),
    L("Lead Designer — Acme Corp", 11),
    L("2021 — Present", 10),
    L("Drove a 32% lift in activation through an onboarding redesign.", 10),
    L("Built and led a team of 4 designers.", 10),
    L("Product Designer — Globex", 11),
    L("2018 — 2021", 10),
    L("Shipped a design system across 12 surfaces.", 10),
  ]);
  const exp = d.sections.find((s) => s.heading === "Experience");
  assert.equal(exp!.entries!.length, 2, "two roles, not six");
  assert.equal(exp!.entries![0].header, "Lead Designer — Acme Corp");
  assert.equal(exp!.entries![0].meta, "2021 — Present");
  assert.equal(exp!.entries![0].bullets.length, 2);
  assert.equal(exp!.entries![1].header, "Product Designer — Globex");
  assert.equal(exp!.entries![1].bullets.length, 1);
});

test("plain-hyphen numeric date ranges are not dropped as phone numbers", () => {
  const d = parseResume([
    L("Jane Doe", 20),
    L("Experience", 13),
    L("Staff Engineer, Acme", 11),
    L("2020 - Present", 10),
    L("Led the platform team.", 10),
    L("Senior Engineer, Globex", 11),
    L("2016 - 2020", 10),          // plain hyphen, all digits — must survive
    L("Built the pipeline.", 10),
  ]);
  const exp = d.sections.find((s) => s.heading === "Experience");
  assert.equal(exp!.entries!.length, 2, "both roles kept");
  assert.equal(exp!.entries![1].header, "Senior Engineer, Globex");
  assert.equal(exp!.entries![1].meta, "2016 - 2020");
});

test("only the Experience section gets entries; others stay flat", () => {
  const d = parseResume([
    L("Jane Doe", 20),
    L("Education", 13),
    L("B.A. Design, State University", 11),
    L("2013 — 2017", 10),
  ]);
  const edu = d.sections.find((s) => s.heading === "Education");
  assert.ok(edu, "Education section exists");
  assert.equal(edu!.entries, undefined, "non-Experience section has no entries");
});

// ---- template-branding noise + phone display ------------------------------

test("drops resume-builder template branding lines from sections", () => {
  const d = parseResume(
    "Jane Doe\nDesigner\n\nProjects\nPortfolio redesign\nResume Templates\nBuild this template\nPowered by resume.io"
  );
  const proj = d.sections.find((s) => s.heading === "Projects");
  assert.ok(proj, "Projects section exists");
  assert.ok(proj.items.includes("Portfolio redesign"));
  assert.ok(!proj.items.includes("Resume Templates"), "template-gallery link dropped");
  assert.ok(!proj.items.includes("Build this template"), "builder CTA dropped");
  assert.ok(!proj.items.some((i) => /powered by/i.test(i)), "builder branding dropped");
});

test("formats bare 10-digit phone numbers in contact lines", () => {
  const d = parseResume("Jane Doe\nDesigner\n3868683442 · jane@email.com");
  assert.ok(
    d.contactLines.some((l) => l.includes("(386) 868-3442")),
    `formatted phone expected, got: ${JSON.stringify(d.contactLines)}`
  );
});

test("formatBarePhones leaves zips, years and formatted numbers alone", () => {
  assert.equal(formatBarePhones("Los Angeles, CA 90291"), "Los Angeles, CA 90291");
  assert.equal(formatBarePhones("2016 - 2020"), "2016 - 2020");
  assert.equal(formatBarePhones("(415) 555-0192"), "(415) 555-0192");
  assert.equal(formatBarePhones("call 3868683442 now"), "call (386) 868-3442 now");
});
