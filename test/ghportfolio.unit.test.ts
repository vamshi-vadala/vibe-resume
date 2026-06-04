// Pure unit tests for the GitHub → Portfolio view model. Fast, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildGhProfile, stackFromRepos, rankReposForPortfolio, headlineFromLanguages, extractReadmeIntro,
  type GitHubApiUser,
} from "../lib/ghportfolio.ts";
import type { GitHubApiRepo } from "../lib/github.ts";

const repo = (over: Partial<GitHubApiRepo>): GitHubApiRepo => ({
  name: "repo", html_url: "https://github.com/u/repo", description: null,
  stargazers_count: 0, language: null, fork: false, archived: false,
  owner: { login: "u" }, ...over,
});

const user = (over: Partial<GitHubApiUser>): GitHubApiUser => ({
  login: "octocat", name: "The Octocat", bio: "I cat.", avatar_url: "https://avatars/octocat.png",
  html_url: "https://github.com/octocat", blog: "https://octo.dev", company: "@github",
  location: "SF", followers: 1000, public_repos: 8, twitter_username: "octo", ...over,
});

// ---- stackFromRepos ------------------------------------------------------

test("stackFromRepos ranks languages by repo count, ignoring forks/archived/null", () => {
  const stack = stackFromRepos([
    repo({ language: "Go" }),
    repo({ language: "Go" }),
    repo({ language: "TypeScript" }),
    repo({ language: "Rust", fork: true }),     // forks ignored
    repo({ language: "C", archived: true }),    // archived ignored
    repo({ language: null }),                   // no language ignored
  ]);
  assert.deepEqual(stack, ["Go", "TypeScript"]);
});

// ---- buildGhProfile ------------------------------------------------------

test("buildGhProfile shapes user + repos into a portfolio", () => {
  const p = buildGhProfile(user({}), [
    repo({ name: "popular", stargazers_count: 200, language: "Go" }),
    repo({ name: "mid", stargazers_count: 20, language: "Go" }),
    repo({ name: "aFork", stargazers_count: 999, fork: true }),
  ]);
  assert.equal(p.empty, false);
  assert.equal(p.username, "octocat");
  assert.equal(p.name, "The Octocat");
  assert.equal(p.headline, "I cat.");
  assert.equal(p.githubUrl, "https://github.com/octocat");
  assert.deepEqual(p.repos.map((r) => r.name), ["popular", "mid"], "forks dropped, ranked by stars");
  assert.deepEqual(p.stack, ["Go"]);
  assert.ok(p.links.some((l) => l.kind === "website" && l.url === "https://octo.dev"));
  assert.ok(p.links.some((l) => l.kind === "twitter" && l.url === "https://twitter.com/octo"));
});

test("falls back to the handle when name is missing and prefixes a bare blog url", () => {
  const p = buildGhProfile(user({ name: null, blog: "octo.dev", twitter_username: null }), []);
  assert.equal(p.name, "octocat");
  assert.ok(p.links.some((l) => l.kind === "website" && l.url === "https://octo.dev"));
  assert.equal(p.links.some((l) => l.kind === "twitter"), false);
});

test("a brand-new empty account is reported empty", () => {
  const p = buildGhProfile(user({ name: null, bio: null, blog: null, twitter_username: null }), []);
  assert.equal(p.empty, true);
});

test("headline falls back to top languages when there is no bio", () => {
  const p = buildGhProfile(user({ bio: null }), [repo({ language: "Go" }), repo({ language: "Rust" })]);
  assert.equal(p.headline, "Go & Rust developer");
  assert.equal(headlineFromLanguages([]), "Software developer");
});

// ---- rankReposForPortfolio -----------------------------------------------

test("ranks a polished 0-star project above a blank one", () => {
  const ranked = rankReposForPortfolio([
    repo({ name: "blank" }),
    repo({ name: "polished", description: "Does a real thing", homepage: "https://x.dev", topics: ["cli"], pushed_at: new Date().toISOString() }),
  ]);
  assert.deepEqual(ranked.map((r) => r.name), ["polished", "blank"]);
  // view-model enrichment is carried through
  assert.equal(ranked[0].homepage, "https://x.dev");
  assert.deepEqual(ranked[0].topics, ["cli"]);
  assert.match(ranked[0].thumbnail!, /opengraph\.githubassets\.com\/1\/u\/polished/);
});

test("stars still dominate when projects are otherwise comparable", () => {
  const ranked = rankReposForPortfolio([
    repo({ name: "small", stargazers_count: 2, description: "x" }),
    repo({ name: "big", stargazers_count: 5000, description: "y" }),
  ]);
  assert.deepEqual(ranked.map((r) => r.name), ["big", "small"]);
});

// ---- extractReadmeIntro --------------------------------------------------

test("extractReadmeIntro pulls the first prose paragraph, stripping noise", () => {
  const md = [
    "# Hi there 👋",
    "",
    "![badge](https://img.shields.io/x) ![ci](https://img.shields.io/y)",
    "",
    "I'm a backend engineer who loves **distributed systems** and [open source](https://x).",
    "I build reliable tools.",
    "",
    "## Projects",
    "- thing one",
  ].join("\n");
  const intro = extractReadmeIntro(md);
  assert.match(intro, /^I'm a backend engineer who loves distributed systems and open source\./);
  assert.ok(!intro.includes("badge"), "badges stripped");
  assert.ok(!intro.includes("**"), "emphasis marks stripped");
  assert.ok(!intro.includes("Projects"), "stops at the first paragraph");
});

test("extractReadmeIntro handles empty/missing input and caps length", () => {
  assert.equal(extractReadmeIntro(null), "");
  assert.equal(extractReadmeIntro(""), "");
  const long = extractReadmeIntro("word ".repeat(200), 50);
  assert.ok(long.length <= 51 && long.endsWith("…"));
});
