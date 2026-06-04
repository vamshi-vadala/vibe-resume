// Pure unit tests for the developer-resume → portfolio logic. Fast, no browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeDevResume, detectStack, detectGitHub, detectLinks, SAMPLE_DEV_RESUME,
} from "../lib/devresume.ts";

// ---- detectStack ---------------------------------------------------------

test("detects tech keywords with canonical casing, including special chars", () => {
  const s = detectStack("Built with typescript, React, next.js, Node.js, PostgreSQL and C++.");
  assert.ok(s.includes("TypeScript"));
  assert.ok(s.includes("React"));
  assert.ok(s.includes("Next.js"));
  assert.ok(s.includes("Node.js"));
  assert.ok(s.includes("PostgreSQL"));
  assert.ok(s.includes("C++"));
});

test("returns stack in dictionary order and de-duplicates", () => {
  const s = detectStack("React react REACT and python");
  assert.deepEqual(s, ["Python", "React"]); // dictionary order: Python before React
});

test("does not match tech names embedded in longer words", () => {
  const s = detectStack("I went reactor shopping and felt goofy in javascripting class");
  assert.ok(!s.includes("React"), "'reactor' must not match React");
  assert.ok(!s.includes("Go"), "'goofy' must not match Go");
  assert.ok(!s.includes("JavaScript"), "'javascripting' must not match JavaScript");
});

test("ambiguous short terms (Go, R) require exact case", () => {
  assert.ok(detectStack("Strong in Go and R for analysis").includes("Go"));
  assert.ok(detectStack("Strong in Go and R for analysis").includes("R"));
  assert.ok(!detectStack("please go to the store and rest").includes("Go"), "lowercase 'go' is not Go");
});

// ---- detectGitHub --------------------------------------------------------

test("separates a GitHub profile from repo links", () => {
  const { githubUrl, repos } = detectGitHub(
    "Find me at github.com/jane and github.com/jane/cool-repo, github.com/acme/lib"
  );
  assert.equal(githubUrl, "https://github.com/jane");
  assert.equal(repos.length, 2);
  assert.deepEqual(repos[0], { owner: "jane", name: "cool-repo", url: "https://github.com/jane/cool-repo" });
  assert.equal(repos[1].owner, "acme");
});

test("infers the profile from a repo owner when no bare profile link exists", () => {
  const { githubUrl, repos } = detectGitHub("see github.com/jane/proj for the code");
  assert.equal(githubUrl, "https://github.com/jane");
  assert.equal(repos.length, 1);
});

test("no GitHub anywhere yields null profile and empty repos", () => {
  const { githubUrl, repos } = detectGitHub("no links here, just text");
  assert.equal(githubUrl, null);
  assert.equal(repos.length, 0);
});

// ---- detectLinks ---------------------------------------------------------

test("collects linkedin and a personal .dev site, ignoring known hosts", () => {
  const links = detectLinks("linkedin.com/in/jane-doe and my site jane.dev plus github.com/jane");
  assert.ok(links.some((l) => l.kind === "linkedin" && l.url === "https://linkedin.com/in/jane-doe"));
  assert.ok(links.some((l) => l.kind === "website" && l.url === "https://jane.dev"));
  assert.ok(!links.some((l) => l.kind === "website" && l.label.includes("github")), "github not treated as website");
});

// ---- analyzeDevResume (integration) --------------------------------------

test("the built-in sample produces a complete profile", () => {
  const p = analyzeDevResume(SAMPLE_DEV_RESUME);
  assert.equal(p.empty, false);
  assert.equal(p.name, "Alex Rivera");
  assert.equal(p.headline, "Senior Software Engineer");
  assert.equal(p.githubUrl, "https://github.com/alexrivera");
  assert.ok(p.stack.includes("TypeScript") && p.stack.includes("Go") && p.stack.includes("Kubernetes"));
  assert.equal(p.repos.length, 2);
  assert.ok(p.repos.some((r) => r.name === "ratelimit-go"));
  assert.ok(p.links.some((l) => l.kind === "linkedin"));
  assert.ok(p.links.some((l) => l.kind === "website" && l.label === "alexrivera.dev"));
});

test("blank input is reported empty", () => {
  assert.equal(analyzeDevResume("").empty, true);
  assert.equal(analyzeDevResume("   \n  ").empty, true);
});
