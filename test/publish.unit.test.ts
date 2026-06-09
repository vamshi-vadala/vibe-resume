import { test } from "node:test";
import assert from "node:assert/strict";
import { validatePublishPayload } from "../lib/publish.ts";
import type { ResumeData } from "../lib/resume.ts";

const validResume: ResumeData = {
  name: "Ada Lovelace",
  title: "Mathematician",
  contactLines: ["ada@example.com"],
  summary: "First programmer.",
  sections: [
    {
      heading: "Experience",
      items: ["Analytical Engine"],
      entries: [{ header: "Analyst, BIS", meta: "1842-1843", bullets: ["Wrote notes"] }],
    },
  ],
  skills: ["algorithms"],
  empty: false,
};

test("validatePublishPayload: accepts a complete payload", () => {
  const res = validatePublishPayload({ resume: validResume, photoUrl: "", themeId: "midnight" });
  assert.equal(res.ok, true);
});

test("validatePublishPayload: empty themeId is allowed", () => {
  const res = validatePublishPayload({ resume: validResume, photoUrl: "", themeId: "" });
  assert.equal(res.ok, true);
});

test("validatePublishPayload: rejects non-object", () => {
  assert.equal(validatePublishPayload(null).ok, false);
  assert.equal(validatePublishPayload("nope").ok, false);
});

test("validatePublishPayload: rejects missing resume", () => {
  const res = validatePublishPayload({ photoUrl: "", themeId: "" });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.reason, "bad_resume");
});

test("validatePublishPayload: rejects bad theme type", () => {
  const res = validatePublishPayload({ resume: validResume, photoUrl: "", themeId: 123 });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.reason, "bad_theme");
});

test("validatePublishPayload: rejects oversized payload", () => {
  const huge = "x".repeat(400_000);
  const res = validatePublishPayload({ resume: validResume, photoUrl: huge, themeId: "" });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.reason, "too_large");
});

test("validatePublishPayload: rejects malformed resume sections", () => {
  const bad = { ...validResume, sections: [{ heading: 1, items: [] }] };
  const res = validatePublishPayload({ resume: bad, photoUrl: "", themeId: "" });
  assert.equal(res.ok, false);
});

test("validatePublishPayload: rejects bad entry shape", () => {
  const bad = {
    ...validResume,
    sections: [{
      heading: "Experience",
      items: [],
      entries: [{ header: 1, bullets: [] }],
    }],
  };
  const res = validatePublishPayload({ resume: bad, photoUrl: "", themeId: "" });
  assert.equal(res.ok, false);
});
