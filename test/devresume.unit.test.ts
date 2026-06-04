// Pure unit tests for the developer-resume → portfolio logic. Fast, no browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeDevResume, detectStack, detectGitHub, detectLinks, SAMPLE_DEV_RESUME,
  usernameFromGitHubUrl, topReposFromApi, mergeRepos, type GitHubApiRepo, type DevRepo,
} from "../lib/devresume.ts";

const apiRepo = (over: Partial<GitHubApiRepo>): GitHubApiRepo => ({
  name: "repo", html_url: "https://github.com/u/repo", description: null,
  stargazers_count: 0, language: null, fork: false, archived: false,
  owner: { login: "u" }, ...over,
});

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
  const { githubUrl, profiles, repos } = detectGitHub("no links here, just text");
  assert.equal(githubUrl, null);
  assert.equal(profiles.length, 0);
  assert.equal(repos.length, 0);
});

test("collects every distinct GitHub profile, not just the first", () => {
  const { githubUrl, profiles } = detectGitHub(
    "github.com/alexrivera and github.com/vamshi-vadala/ plus github.com/alexrivera/portfolio"
  );
  assert.deepEqual(profiles, ["alexrivera", "vamshi-vadala"], "both profiles, de-duped");
  assert.equal(githubUrl, "https://github.com/alexrivera", "first is the hero profile");
});

// ---- detectLinks ---------------------------------------------------------

test("collects linkedin and a personal .dev site, ignoring known hosts", () => {
  const links = detectLinks("linkedin.com/in/jane-doe and my site jane.dev plus github.com/jane");
  assert.ok(links.some((l) => l.kind === "linkedin" && l.url === "https://linkedin.com/in/jane-doe"));
  assert.ok(links.some((l) => l.kind === "website" && l.url === "https://jane.dev"));
  assert.ok(!links.some((l) => l.kind === "website" && l.label.includes("github")), "github not treated as website");
});

// ---- GitHub API repo ranking & merge -------------------------------------

test("usernameFromGitHubUrl extracts the handle", () => {
  assert.equal(usernameFromGitHubUrl("https://github.com/jane"), "jane");
  assert.equal(usernameFromGitHubUrl("https://github.com/jane-doe/repo"), "jane-doe");
  assert.equal(usernameFromGitHubUrl(null), null);
});

test("topReposFromApi drops forks/archived and ranks by stars", () => {
  const repos = topReposFromApi([
    apiRepo({ name: "popular", stargazers_count: 120, language: "Go" }),
    apiRepo({ name: "aFork", stargazers_count: 999, fork: true }),
    apiRepo({ name: "old", stargazers_count: 5, archived: true }),
    apiRepo({ name: "mid", stargazers_count: 30 }),
  ], 6);
  assert.deepEqual(repos.map((r) => r.name), ["popular", "mid"]);
  assert.equal(repos[0].stars, 120);
  assert.equal(repos[0].language, "Go");
});

test("mergeRepos de-dupes by owner/name and caps the count", () => {
  const a: DevRepo[] = [{ owner: "u", name: "x", url: "1" }, { owner: "u", name: "y", url: "2" }];
  const b: DevRepo[] = [{ owner: "U", name: "X", url: "dup" }, { owner: "u", name: "z", url: "3" }];
  const merged = mergeRepos(a, b, 6);
  assert.deepEqual(merged.map((r) => r.name), ["x", "y", "z"]);
  assert.equal(mergeRepos(a, b, 2).length, 2, "respects the cap");
});

// ---- analyzeDevResume (integration) --------------------------------------

test("the built-in sample produces a complete profile", () => {
  const p = analyzeDevResume(SAMPLE_DEV_RESUME);
  assert.equal(p.empty, false);
  assert.equal(p.name, "Alex Rivera");
  assert.equal(p.headline, "Senior Software Engineer");
  assert.equal(p.githubUrl, "https://github.com/alexrivera");
  assert.deepEqual(p.profiles, ["alexrivera"]);
  assert.ok(p.stack.includes("TypeScript") && p.stack.includes("Go") && p.stack.includes("Kubernetes"));
  assert.equal(p.repos.length, 2);
  assert.ok(p.repos.some((r) => r.name === "ratelimit-go"));
  assert.ok(p.links.some((l) => l.kind === "linkedin"));
  assert.ok(p.links.some((l) => l.kind === "website" && l.label === "alexrivera.dev"));
  // experience must be carried through, not dropped
  assert.equal(p.experience.length, 2);
  assert.equal(p.experience[0].header, "Senior Software Engineer — Stripe");
  assert.ok(p.experience[0].bullets.length >= 1);
});

test("work experience and prose projects survive into the profile", () => {
  const p = analyzeDevResume(
    `Priya Sharma
Backend Engineer

Skills
Java, Spring Boot, Kafka

Experience
Staff Engineer, Acme Payments
2020 - Present
Designed a ledger service.
Mentored a team of 6.

Senior Engineer, Globex
2016 - 2020
Built the notifications platform.

Projects
Built an open-source rate limiter.
Created a CLI tool for migrations.
`
  );
  assert.equal(p.experience.length, 2, "both roles kept, incl. the plain-hyphen-dated one");
  assert.equal(p.experience[1].header, "Senior Engineer, Globex");
  assert.deepEqual(p.projects, [
    "Built an open-source rate limiter.",
    "Created a CLI tool for migrations.",
  ]);
  // "Spring Boot" present → redundant "Spring" suppressed
  assert.ok(p.stack.includes("Spring Boot"));
  assert.ok(!p.stack.includes("Spring"));
});

test("blank input is reported empty", () => {
  assert.equal(analyzeDevResume("").empty, true);
  assert.equal(analyzeDevResume("   \n  ").empty, true);
});
