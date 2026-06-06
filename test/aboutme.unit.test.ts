// Pure unit tests for the about-me generator. Fast, no DOM.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateAbout, parseSkills, isValidRole, TONES, type Tone,
} from "../lib/aboutme.ts";

// ---- parseSkills ---------------------------------------------------------

test("parseSkills splits, trims, dedupes and caps", () => {
  assert.deepEqual(parseSkills("UX research, design systems , UX research"), ["UX research", "design systems"]);
  assert.deepEqual(parseSkills("a/b|c\nd"), ["a", "b", "c", "d"]);
  assert.equal(parseSkills("1,2,3,4,5,6,7,8").length, 6);
  assert.deepEqual(parseSkills(""), []);
  assert.deepEqual(parseSkills(undefined), []);
});

// ---- isValidRole ---------------------------------------------------------

test("isValidRole requires a letter", () => {
  assert.equal(isValidRole("Designer"), true);
  assert.equal(isValidRole(""), false);
  assert.equal(isValidRole("123"), false);
  assert.equal(isValidRole(undefined), false);
});

// ---- generateAbout: structure -------------------------------------------

test("returns one-liner, about and story; adds a bio only with a name", () => {
  const noName = generateAbout({ role: "Product Designer", skills: "design systems, UX" });
  assert.deepEqual(noName.map((v) => v.id), ["oneliner", "about", "story"]);

  const withName = generateAbout({ name: "Jordan Rivera", role: "Product Designer", skills: "design systems" });
  assert.deepEqual(withName.map((v) => v.id), ["oneliner", "about", "story", "bio"]);
  assert.ok(withName.find((v) => v.id === "bio")!.text.startsWith("Jordan Rivera is "));
});

test("invalid role yields no variants", () => {
  assert.deepEqual(generateAbout({ role: "" }), []);
  assert.deepEqual(generateAbout({ role: "   " }), []);
});

// ---- generateAbout: content ---------------------------------------------

test("weaves in years and an oxford-joined skill list", () => {
  const [, about] = generateAbout({ role: "UX Designer", years: 6, skills: "research, design systems, branding" });
  assert.match(about.text, /6\+ years/);
  assert.match(about.text, /research, design systems, and branding/);
});

test("article logic: 'a UX Designer' (acronym), 'an Art Director' (vowel)", () => {
  const ux = generateAbout({ role: "UX Designer" })[1].text;
  assert.match(ux, /I'm a UX Designer/);
  const art = generateAbout({ role: "Art Director" })[1].text;
  assert.match(art, /I'm an Art Director/);
});

test("degrades gracefully with no skills and no years", () => {
  const v = generateAbout({ role: "Designer" });
  for (const x of v) {
    assert.ok(x.text.length > 0);
    assert.ok(!/undefined|NaN|\bnull\b/.test(x.text), `leaked placeholder: ${x.text}`);
    assert.ok(!/\byears\b/.test(x.text), `should omit years: ${x.text}`);
  }
});

test("years value is sanitized (0/garbage dropped, huge clamped)", () => {
  assert.ok(!/years/.test(generateAbout({ role: "Designer", years: 0 })[1].text));
  assert.ok(!/years/.test(generateAbout({ role: "Designer", years: "abc" })[1].text));
  assert.match(generateAbout({ role: "Designer", years: 999 })[1].text, /60\+ years/);
});

// ---- tones ---------------------------------------------------------------

test("each tone produces a distinct about paragraph", () => {
  const texts = new Set<string>();
  for (const t of TONES) {
    const v = generateAbout({ role: "Product Designer", skills: "design systems", tone: t.id });
    texts.add(v[1].text);
  }
  assert.equal(texts.size, TONES.length, "tones should not collide");
});

test("unknown tone falls back to professional without throwing", () => {
  const bad = generateAbout({ role: "Designer", tone: "zzz" as Tone });
  const pro = generateAbout({ role: "Designer", tone: "professional" });
  assert.equal(bad[1].text, pro[1].text);
});

test("generation is deterministic", () => {
  const input = { name: "Jordan Rivera", role: "Brand Designer", years: 4, skills: "logos, identity", tone: "creative" as Tone };
  assert.deepEqual(generateAbout(input), generateAbout(input));
});
