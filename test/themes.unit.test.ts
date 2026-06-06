// Pure unit tests for the theme picker model. Fast, no DOM.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  THEMES, THEME_VAR_KEYS, getTheme, nextIndex, prevIndex, themeStyle, SAMPLE,
} from "../lib/themes.ts";

// ---- theme integrity -----------------------------------------------------

test("there is a non-trivial deck of themes", () => {
  assert.ok(THEMES.length >= 4, `expected at least 4 themes, got ${THEMES.length}`);
});

test("theme ids are unique and url-safe", () => {
  const ids = THEMES.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate theme id");
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/, `id not url-safe: ${id}`);
});

test("every theme defines every required token, non-empty", () => {
  for (const theme of THEMES) {
    assert.ok(theme.name && theme.vibe, `${theme.id} missing name/vibe`);
    assert.ok(theme.tags.length > 0, `${theme.id} has no tags`);
    for (const key of THEME_VAR_KEYS) {
      const v = theme.vars[key];
      assert.ok(typeof v === "string" && v.length > 0, `${theme.id} missing token "${key}"`);
    }
  }
});

// ---- getTheme ------------------------------------------------------------

test("getTheme returns the matching theme", () => {
  assert.equal(getTheme("terminal").id, "terminal");
});

test("getTheme falls back to the first theme for unknown/empty ids", () => {
  assert.equal(getTheme("nope").id, THEMES[0].id);
  assert.equal(getTheme(null).id, THEMES[0].id);
  assert.equal(getTheme(undefined).id, THEMES[0].id);
});

// ---- deck navigation -----------------------------------------------------

test("nextIndex advances and wraps", () => {
  assert.equal(nextIndex(0, 3), 1);
  assert.equal(nextIndex(2, 3), 0);
});

test("prevIndex retreats and wraps", () => {
  assert.equal(prevIndex(0, 3), 2);
  assert.equal(prevIndex(2, 3), 1);
});

test("nav defaults to the real deck length and never throws on empty", () => {
  assert.equal(nextIndex(THEMES.length - 1), 0);
  assert.equal(nextIndex(0, 0), 0);
  assert.equal(prevIndex(0, 0), 0);
});

// ---- themeStyle ----------------------------------------------------------

test("themeStyle emits a scoped --t-* var for every token", () => {
  const style = themeStyle(getTheme("midnight"));
  assert.equal(Object.keys(style).length, THEME_VAR_KEYS.length);
  // camelCase tokens become kebab-case vars
  assert.equal(style["--t-on-accent"], getTheme("midnight").vars.onAccent);
  assert.equal(style["--t-border-width"], getTheme("midnight").vars.borderWidth);
  assert.equal(style["--t-bg"], getTheme("midnight").vars.bg);
  // every var key is namespaced
  for (const k of Object.keys(style)) assert.match(k, /^--t-/);
});

// ---- sample data ---------------------------------------------------------

test("SAMPLE portfolio is populated enough to show a theme off", () => {
  assert.ok(SAMPLE.name && SAMPLE.headline && SAMPLE.about);
  assert.ok(SAMPLE.stack.length >= 3, "sample needs a few skills");
  assert.ok(SAMPLE.projects.length >= 2, "sample needs a couple projects");
  for (const p of SAMPLE.projects) assert.ok(p.name && p.desc && p.meta);
});
