// Pure unit tests for the GitHub → Portfolio view model. Fast, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGhProfile, stackFromRepos, type GitHubApiUser } from "../lib/ghportfolio.ts";
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
  assert.equal(p.bio, "I cat.");
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
