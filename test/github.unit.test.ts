// Pure unit tests for the shared GitHub primitives. Fast, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  usernameFromGitHubUrl, normalizeUsername, topReposFromApi, mergeRepos,
  type GitHubApiRepo, type Repo,
} from "../lib/github.ts";

const apiRepo = (over: Partial<GitHubApiRepo>): GitHubApiRepo => ({
  name: "repo", html_url: "https://github.com/u/repo", description: null,
  stargazers_count: 0, language: null, fork: false, archived: false,
  owner: { login: "u" }, ...over,
});

test("usernameFromGitHubUrl extracts the handle", () => {
  assert.equal(usernameFromGitHubUrl("https://github.com/jane"), "jane");
  assert.equal(usernameFromGitHubUrl("https://github.com/jane-doe/repo"), "jane-doe");
  assert.equal(usernameFromGitHubUrl(null), null);
});

test("normalizeUsername accepts handles, @handles, and profile URLs", () => {
  assert.equal(normalizeUsername("octocat"), "octocat");
  assert.equal(normalizeUsername("  @octocat "), "octocat");
  assert.equal(normalizeUsername("https://github.com/octocat/"), "octocat");
  assert.equal(normalizeUsername("github.com/jane-doe"), "jane-doe");
});

test("normalizeUsername rejects invalid handles", () => {
  assert.equal(normalizeUsername(""), null);
  assert.equal(normalizeUsername("-bad"), null);          // leading hyphen
  assert.equal(normalizeUsername("a--b"), null);          // consecutive hyphens
  assert.equal(normalizeUsername("has space"), null);
  assert.equal(normalizeUsername("a".repeat(40)), null);  // too long
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
  const a: Repo[] = [{ owner: "u", name: "x", url: "1" }, { owner: "u", name: "y", url: "2" }];
  const b: Repo[] = [{ owner: "U", name: "X", url: "dup" }, { owner: "u", name: "z", url: "3" }];
  const merged = mergeRepos(a, b, 6);
  assert.deepEqual(merged.map((r) => r.name), ["x", "y", "z"]);
  assert.equal(mergeRepos(a, b, 2).length, 2, "respects the cap");
});
