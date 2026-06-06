// Guard against sitemap / tool-registry drift. If a tool is added to lib/tools.ts
// but not app/sitemap.ts (or vice-versa), this fails. Pure, no DOM.
import { test } from "node:test";
import assert from "node:assert/strict";
import sitemap from "../app/sitemap.ts";
import { TOOLS } from "../lib/tools.ts";

test("sitemap includes every tool exactly once, with no stale entries", () => {
  const urls = sitemap().map((e) => e.url);

  // every registered tool's route is in the sitemap
  for (const t of TOOLS) {
    assert.ok(urls.some((u) => u.endsWith(t.href)), `sitemap is missing ${t.href}`);
  }

  // and the sitemap has no extra/stale /tools/ entries
  const toolUrls = urls.filter((u) => u.includes("/tools/"));
  assert.equal(toolUrls.length, TOOLS.length, "sitemap /tools count != TOOLS count");

  // sitemap urls are absolute and unique
  assert.equal(new Set(urls).size, urls.length, "duplicate sitemap url");
  for (const u of urls) assert.match(u, /^https:\/\//, `non-absolute sitemap url: ${u}`);
});
