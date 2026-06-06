// Pure unit tests for the handle checker model. Fast, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeHandle, isValidHandle, buildTargets, githubApiUrl, PLATFORMS,
} from "../lib/handle.ts";

// ---- normalizeHandle -----------------------------------------------------

test("normalizeHandle strips @, lowercases and removes spaces/illegal chars", () => {
  assert.equal(normalizeHandle("@Jordan Rivera"), "jordanrivera");
  assert.equal(normalizeHandle("  John.Doe_99 "), "john.doe_99");
  assert.equal(normalizeHandle("a!!!b"), "ab");
});

test("normalizeHandle trims leading/trailing separators", () => {
  assert.equal(normalizeHandle("-jordan-"), "jordan");
  assert.equal(normalizeHandle("__x__"), "x");
});

// ---- isValidHandle -------------------------------------------------------

test("isValidHandle enforces 1–39 chars after normalizing", () => {
  assert.equal(isValidHandle("jordan"), true);
  assert.equal(isValidHandle("@@@"), false);          // nothing left
  assert.equal(isValidHandle("   "), false);
  assert.equal(isValidHandle("a".repeat(40)), false); // over GitHub's max
  assert.equal(isValidHandle("a".repeat(39)), true);
});

// ---- buildTargets --------------------------------------------------------

test("buildTargets produces a profile URL per platform", () => {
  const t = buildTargets("jordan");
  assert.equal(t.length, PLATFORMS.length);
  const byId = Object.fromEntries(t.map((x) => [x.id, x]));
  assert.equal(byId.github.url, "https://github.com/jordan");
  assert.equal(byId.linkedin.url, "https://www.linkedin.com/in/jordan");
  assert.equal(byId.x.url, "https://x.com/jordan");
});

test("only GitHub is flagged as a live (truthful) check", () => {
  const live = buildTargets("jordan").filter((t) => t.live).map((t) => t.id);
  assert.deepEqual(live, ["github"]);
});

// ---- githubApiUrl --------------------------------------------------------

test("githubApiUrl points at the public users API", () => {
  assert.equal(githubApiUrl("jordan"), "https://api.github.com/users/jordan");
});
