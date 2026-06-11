import { test } from "node:test";
import assert from "node:assert/strict";
import { checkSlugLocal, suggestSlug, SLUG_MIN, SLUG_MAX } from "../lib/slugAvailability.ts";
import { isReservedSlug, RESERVED_SLUGS } from "../lib/reservedSlugs.ts";

test("checkSlugLocal: rejects too-short", () => {
  assert.deepEqual(checkSlugLocal("ab"), { status: "invalid", reason: "length" });
});

test("checkSlugLocal: rejects too-long", () => {
  const long = "a".repeat(SLUG_MAX + 1);
  assert.deepEqual(checkSlugLocal(long), { status: "invalid", reason: "length" });
});

test("checkSlugLocal: accepts minimum and maximum length", () => {
  assert.equal(checkSlugLocal("a".repeat(SLUG_MIN)), null);
  assert.equal(checkSlugLocal("a".repeat(SLUG_MAX)), null);
});

test("checkSlugLocal: rejects uppercase", () => {
  assert.deepEqual(checkSlugLocal("Jordan"), { status: "invalid", reason: "format" });
});

test("checkSlugLocal: rejects underscores and dots", () => {
  assert.deepEqual(checkSlugLocal("jordan_rivera"), { status: "invalid", reason: "format" });
  assert.deepEqual(checkSlugLocal("jordan.rivera"), { status: "invalid", reason: "format" });
});

test("checkSlugLocal: rejects leading/trailing/consecutive hyphens", () => {
  assert.deepEqual(checkSlugLocal("-jordan"), { status: "invalid", reason: "format" });
  assert.deepEqual(checkSlugLocal("jordan-"), { status: "invalid", reason: "format" });
  assert.deepEqual(checkSlugLocal("jordan--rivera"), { status: "invalid", reason: "format" });
});

test("checkSlugLocal: flags reserved tool slugs", () => {
  assert.deepEqual(checkSlugLocal("pdf-resume-to-website"), { status: "reserved" });
  assert.deepEqual(checkSlugLocal("portfolio-handle-checker"), { status: "reserved" });
});

test("checkSlugLocal: flags reserved static paths", () => {
  for (const s of ["signup", "account", "auth", "admin", "api", "tools", "blog"]) {
    assert.deepEqual(checkSlugLocal(s), { status: "reserved" }, `expected ${s} reserved`);
  }
});

test("checkSlugLocal: returns null for a valid available-looking slug", () => {
  assert.equal(checkSlugLocal("jordan"), null);
  assert.equal(checkSlugLocal("jordan-rivera"), null);
  assert.equal(checkSlugLocal("dev42"), null);
});

test("isReservedSlug: case-insensitive", () => {
  assert.equal(isReservedSlug("SIGNUP"), true);
  assert.equal(isReservedSlug("Signup"), true);
});

test("RESERVED_SLUGS: includes every tool slug", () => {
  // Sanity: at least the 10 tool slugs are present.
  assert.ok(RESERVED_SLUGS.size >= 10);
});

test("suggestSlug: name to handle", () => {
  assert.equal(suggestSlug("Jason Miller"), "jason-miller");
  assert.equal(suggestSlug("  José Álvarez "), "jose-alvarez");
  assert.equal(suggestSlug("X Æ"), "");
  assert.equal(suggestSlug(""), "");
});

test("suggestSlug: clamps long names at a hyphen boundary and stays valid", () => {
  const s = suggestSlug("Maximiliano Bartholomew Featherstonehaugh III");
  assert.ok(s.length <= SLUG_MAX, `len ${s.length}`);
  assert.equal(checkSlugLocal(s), null);
});
