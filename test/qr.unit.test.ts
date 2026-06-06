// Pure unit tests for the QR helpers. Fast, no DOM.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeUrl, isValidQrInput, qrFilename } from "../lib/qr.ts";

// ---- normalizeUrl --------------------------------------------------------

test("normalizeUrl leaves a full URL untouched", () => {
  assert.equal(normalizeUrl("https://jordan.dev"), "https://jordan.dev");
  assert.equal(normalizeUrl("http://x.io/a"), "http://x.io/a");
});

test("normalizeUrl preserves non-http schemes", () => {
  assert.equal(normalizeUrl("mailto:me@x.com"), "mailto:me@x.com");
  assert.equal(normalizeUrl("tel:+15551234567"), "tel:+15551234567");
});

test("normalizeUrl prepends https:// to a bare domain", () => {
  assert.equal(normalizeUrl("jordan.dev"), "https://jordan.dev");
  assert.equal(normalizeUrl("linkedin.com/in/jordan-rivera"), "https://linkedin.com/in/jordan-rivera");
  assert.equal(normalizeUrl("www.site.com"), "https://www.site.com");
});

test("normalizeUrl leaves plain text alone and trims", () => {
  assert.equal(normalizeUrl("  Jordan Rivera  "), "Jordan Rivera");
  assert.equal(normalizeUrl("hello"), "hello");
  assert.equal(normalizeUrl(""), "");
  assert.equal(normalizeUrl(undefined), "");
});

// ---- isValidQrInput ------------------------------------------------------

test("isValidQrInput requires non-empty, bounded text", () => {
  assert.equal(isValidQrInput("https://x.io"), true);
  assert.equal(isValidQrInput("   "), false);
  assert.equal(isValidQrInput(""), false);
  assert.equal(isValidQrInput(undefined), false);
  assert.equal(isValidQrInput("a".repeat(2001)), false);
});

// ---- qrFilename ----------------------------------------------------------

test("qrFilename derives a clean name from a URL", () => {
  assert.equal(qrFilename("https://linkedin.com/in/jordan-rivera", "png"), "resume-qr-linkedin-com-in-jordan-rivera.png");
  assert.equal(qrFilename("www.jordan.dev", "svg"), "resume-qr-jordan-dev.svg");
});

test("qrFilename falls back gracefully for plain text", () => {
  assert.equal(qrFilename("Jordan Rivera", "png"), "resume-qr-jordan-rivera.png");
  assert.equal(qrFilename("!!!", "svg"), "resume-qr-code.svg");
});

test("qrFilename caps length and trims trailing hyphens", () => {
  const f = qrFilename("https://example.com/" + "a".repeat(80), "png");
  assert.ok(f.length <= "resume-qr-".length + 40 + ".png".length);
  assert.ok(!/-\.png$/.test(f), `trailing hyphen: ${f}`);
});
