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

test("validatePublishPayload: accepts a reasonably-sized photo data URL", () => {
  // 60KB-ish — a typical 400x400 q0.82 JPEG
  const photo = "data:image/jpeg;base64," + "A".repeat(60_000);
  const res = validatePublishPayload({ resume: validResume, photoUrl: photo, themeId: "" });
  assert.equal(res.ok, true);
});

test("validatePublishPayload: rejects photoUrl exceeding per-field cap", () => {
  // 250KB string — under the 300KB total budget but over the photo cap.
  // Shrink resume so total stays below MAX_TOTAL_BYTES to isolate the photo check.
  const photo = "data:image/jpeg;base64," + "A".repeat(250_000);
  const res = validatePublishPayload({ resume: validResume, photoUrl: photo, themeId: "" });
  assert.equal(res.ok, false);
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

// --- discriminator: backward compat + new kinds ---

test("validatePublishPayload: missing kind defaults to 'resume' (backward compat with rows written before kinds existed)", () => {
  const res = validatePublishPayload({ resume: validResume, photoUrl: "", themeId: "" });
  assert.equal(res.ok, true);
  if (res.ok) assert.equal(res.payload.kind, "resume");
});

test("validatePublishPayload: explicit kind:'resume' validated the same way", () => {
  const res = validatePublishPayload({ kind: "resume", resume: validResume, photoUrl: "", themeId: "" });
  assert.equal(res.ok, true);
});

test("validatePublishPayload: unknown kind rejected", () => {
  const res = validatePublishPayload({ kind: "bogus", themeId: "" });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.reason, "bad_kind");
});

test("validatePublishPayload: kind:'developer' accepts a complete DevProfile payload", () => {
  const profile = {
    name: "Linus", headline: "Kernel hacker", summary: "Writes C.",
    githubUrl: "https://github.com/torvalds",
    profiles: ["torvalds"], links: [], repos: [], projects: [],
    experience: [], stack: ["C"], empty: false,
  };
  const res = validatePublishPayload({
    kind: "developer", profile, repos: [], themeId: "",
  });
  assert.equal(res.ok, true);
});

test("validatePublishPayload: kind:'developer' rejects missing profile fields", () => {
  const res = validatePublishPayload({ kind: "developer", profile: { name: "x" }, repos: [], themeId: "" });
  assert.equal(res.ok, false);
});

test("validatePublishPayload: kind:'github' accepts a complete GhProfile", () => {
  const profile = {
    username: "octocat", name: "Octocat", headline: "Mascot", about: "",
    avatarUrl: "https://example.com/a.png",
    githubUrl: "https://github.com/octocat",
    company: null, location: null,
    followers: 0, publicRepos: 1,
    topLanguages: ["JS"], stack: ["JS"], links: [],
    repos: [{ owner: "octocat", name: "Hello-World", url: "https://github.com/octocat/Hello-World" }],
    empty: false,
  };
  const res = validatePublishPayload({ kind: "github", profile, themeId: "" });
  assert.equal(res.ok, true);
});

test("validatePublishPayload: kind:'github' rejects malformed repos", () => {
  const profile = {
    username: "octocat", name: "Octocat", headline: "Mascot", about: "",
    avatarUrl: "https://example.com/a.png",
    githubUrl: "https://github.com/octocat",
    company: null, location: null,
    followers: 0, publicRepos: 1,
    topLanguages: [], stack: [], links: [],
    repos: [{ name: "no_owner" }],
    empty: false,
  };
  const res = validatePublishPayload({ kind: "github", profile, themeId: "" });
  assert.equal(res.ok, false);
});
