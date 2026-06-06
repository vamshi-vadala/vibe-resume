// Pure unit tests for the LinkedIn URL slug generator. Fast, no DOM.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slugify, sanitizeSlug, isValidName, generateSlugs, linkedinUrl, vibeUrl,
} from "../lib/slug.ts";

const LEGAL = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ---- slugify -------------------------------------------------------------

test("slugify lowercases, hyphenates and strips punctuation", () => {
  assert.equal(slugify("Jordan Rivera"), "jordan-rivera");
  assert.equal(slugify("  Multiple   spaces "), "multiple-spaces");
});

test("slugify strips accents/diacritics", () => {
  assert.equal(slugify("José Núñez"), "jose-nunez");
  assert.equal(slugify("Renée Östberg"), "renee-ostberg");
});

test("slugify removes apostrophes and dots without leaving hyphens", () => {
  assert.equal(slugify("O'Brien"), "obrien");
  assert.equal(slugify("J.R. Smith"), "jr-smith");
});

test("sanitizeSlug collapses and trims hyphens", () => {
  assert.equal(sanitizeSlug("--a--b--"), "a-b");
});

// ---- isValidName ---------------------------------------------------------

test("isValidName accepts real names, rejects empty/symbol-only", () => {
  assert.equal(isValidName("Jordan"), true);
  assert.equal(isValidName("   "), false);
  assert.equal(isValidName("123 !!!"), false);
});

// ---- generateSlugs -------------------------------------------------------

test("first suggestion is the clean hyphenated full name", () => {
  const s = generateSlugs("Jordan Rivera");
  assert.equal(s[0].slug, "jordan-rivera");
  assert.ok(s.length >= 3);
});

test("every generated slug is LinkedIn-legal, >=3 chars and unique", () => {
  const s = generateSlugs("Jordan Michael Rivera", "Staff Engineer");
  const slugs = s.map((x) => x.slug);
  for (const slug of slugs) {
    assert.match(slug, LEGAL, `illegal slug: ${slug}`);
    assert.ok(slug.length >= 3, `too short: ${slug}`);
  }
  assert.equal(new Set(slugs).size, slugs.length, "duplicate slug emitted");
});

test("a keyword adds a specialty variant; absent keyword does not", () => {
  const withKw = generateSlugs("Jordan Rivera", "UX Designer");
  assert.ok(withKw.some((x) => x.slug === "jordan-rivera-ux-designer"));
  const without = generateSlugs("Jordan Rivera");
  assert.ok(!without.some((x) => x.slug.includes("designer")));
});

test("three-part name offers a first-and-last-only variant", () => {
  const s = generateSlugs("Jordan Michael Rivera").map((x) => x.slug);
  assert.ok(s.includes("jordan-michael-rivera")); // full
  assert.ok(s.includes("jordan-rivera"));         // middle dropped
});

test("single-word name still yields usable suggestions", () => {
  const s = generateSlugs("Cher");
  assert.ok(s.length >= 1);
  for (const x of s) assert.match(x.slug, LEGAL);
  assert.ok(s.some((x) => x.slug === "cher-portfolio"));
});

test("garbage input yields no suggestions", () => {
  assert.deepEqual(generateSlugs("!!! ???"), []);
});

// ---- url helpers ---------------------------------------------------------

test("url helpers build full profile URLs", () => {
  assert.equal(linkedinUrl("jordan-rivera"), "https://www.linkedin.com/in/jordan-rivera");
  assert.equal(vibeUrl("jordan-rivera"), "https://vibe.resume/jordan-rivera");
});
