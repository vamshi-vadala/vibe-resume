// Pure unit tests for the CaseCrafter engine. Fast, no DOM.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateCaseStudy, toMarkdown, parseList, parseSteps, extractMetrics, isValidTitle,
} from "../lib/casestudy.ts";

// ---- small parsers -------------------------------------------------------

test("parseList splits, dedupes, caps", () => {
  assert.deepEqual(parseList("Figma, React , Figma"), ["Figma", "React"]);
  assert.equal(parseList("a,b,c,d,e,f,g,h,i,j").length, 8);
  assert.deepEqual(parseList(undefined), []);
});

test("parseSteps handles newlines and strips bullet markers", () => {
  assert.deepEqual(parseSteps("- Research\n- Wireframe\n2. Ship"), ["Research", "Wireframe", "Ship"]);
});

test("parseSteps falls back to sentence splitting for prose", () => {
  assert.deepEqual(parseSteps("Did research. Then built it."), ["Did research.", "Then built it."]);
});

test("extractMetrics pulls percentages, multipliers, money and rank", () => {
  assert.deepEqual(
    extractMetrics("Grew signups +32% and revenue 2x, hit $1.2M, ranked #1"),
    ["+32%", "2X", "$1.2M", "#1"],
  );
  assert.deepEqual(extractMetrics("no numbers here"), []);
});

test("isValidTitle requires non-empty", () => {
  assert.equal(isValidTitle("Redesign"), true);
  assert.equal(isValidTitle("   "), false);
  assert.equal(isValidTitle(undefined), false);
});

// ---- generateCaseStudy ---------------------------------------------------

test("returns null without a title", () => {
  assert.equal(generateCaseStudy({ title: "" }), null);
});

test("builds the four-section framework with meta and metrics", () => {
  const cs = generateCaseStudy({
    title: "Checkout Redesign", client: "Acme", role: "Product Designer", timeline: "2025",
    tools: "Figma, React", challenge: "Cart abandonment was high.",
    process: "Audited funnel\nPrototyped\nA/B tested", outcome: "Abandonment dropped 32% in 6 weeks.",
  })!;
  assert.equal(cs.sections.map((s) => s.id).join(","), "overview,challenge,approach,outcome");
  assert.deepEqual(cs.meta.map((m) => m.value), ["Acme", "Product Designer", "2025"]);
  assert.deepEqual(cs.tools, ["Figma", "React"]);
  assert.deepEqual(cs.metrics, ["32%"]);
  assert.deepEqual(cs.sections.find((s) => s.id === "approach")!.steps, ["Audited funnel", "Prototyped", "A/B tested"]);
  assert.ok(cs.sections.every((s) => !s.placeholder), "all sections filled");
});

test("empty sections become guiding prompts, not fabricated prose", () => {
  const cs = generateCaseStudy({ title: "Brand Refresh" })!;
  const challenge = cs.sections.find((s) => s.id === "challenge")!;
  assert.equal(challenge.placeholder, true);
  assert.match(challenge.text, /problem/i);
  // overview never claims facts that weren't given
  const overview = cs.sections.find((s) => s.id === "overview")!;
  assert.equal(overview.text, "Brand Refresh.");
});

test("overview uses correct article for role", () => {
  const ux = generateCaseStudy({ title: "X", role: "UX Designer" })!;
  assert.match(ux.sections[0].text, /As a UX Designer/);
  const ad = generateCaseStudy({ title: "Y", role: "Art Director" })!;
  assert.match(ad.sections[0].text, /As an Art Director/);
});

// ---- toMarkdown ----------------------------------------------------------

test("toMarkdown emits only filled sections, as headings + bullets", () => {
  const cs = generateCaseStudy({
    title: "Checkout Redesign", client: "Acme",
    process: "Audited funnel\nPrototyped", outcome: "Dropped 32%.",
  })!;
  const md = toMarkdown(cs);
  assert.match(md, /^# Checkout Redesign/);
  assert.match(md, /\*\*Client:\*\* Acme/);
  assert.match(md, /## The Approach\n- Audited funnel\n- Prototyped/);
  assert.match(md, /## The Outcome\nDropped 32%\./);
  assert.ok(!/What problem were you solving/.test(md), "placeholder prompts excluded from markdown");
});

test("toMarkdown is deterministic", () => {
  const input = { title: "Z", client: "A", outcome: "Up 2x." };
  assert.equal(toMarkdown(generateCaseStudy(input)!), toMarkdown(generateCaseStudy(input)!));
});
