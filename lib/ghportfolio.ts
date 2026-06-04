// Pure logic for the GitHub → Portfolio tool. No DOM/React/network deps.
// Shapes GitHub's user + repos (+ profile README) into a portfolio view model.
// The fetching (and its error handling) lives in the client component.

import { toRepo, type GitHubApiRepo, type Repo } from "./github.ts";

/** The subset of GitHub's `/users/:username` response we use. */
export interface GitHubApiUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  blog: string | null;
  company: string | null;
  location: string | null;
  followers: number;
  public_repos: number;
  twitter_username: string | null;
}

export interface GhLink {
  kind: "website" | "twitter";
  label: string;
  url: string;
}

export interface GhProfile {
  username: string;
  name: string;          // display name, falls back to the handle
  headline: string;      // bio, or one generated from the top languages
  about: string;         // intro prose pulled from the profile README (may be "")
  avatarUrl: string;
  githubUrl: string;
  company: string | null;
  location: string | null;
  followers: number;
  publicRepos: number;
  topLanguages: string[];
  links: GhLink[];       // blog/website + twitter
  stack: string[];       // languages aggregated across repos, most-used first
  repos: Repo[];         // top repos, ranked for a portfolio
  empty: boolean;        // true when the user has nothing portfolio-worthy
}

function absolute(u: string): string {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

/** Aggregate repo languages into a stack, ranked by how many repos use each. */
export function stackFromRepos(repos: GitHubApiRepo[], limit = 12): string[] {
  const counts = new Map<string, number>();
  for (const r of repos) {
    if (r.fork || r.archived || !r.language) continue;
    counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([lang]) => lang);
}

/**
 * A "portfolio-worthiness" score. Stars matter most (log-scaled so a handful
 * still counts), but real-project signals — a description, a live homepage,
 * topics, and recent activity — let a polished 0-star project beat a stale,
 * blank one. This is what makes the *best* work lead for a typical account.
 */
export function repoScore(r: GitHubApiRepo, now: number = Date.now()): number {
  let score = Math.log2(r.stargazers_count + 1) * 3;
  if (r.description && r.description.trim()) score += 2;
  if (r.homepage && r.homepage.trim()) score += 2;
  if (r.topics && r.topics.length) score += 1.5;
  if (r.pushed_at) {
    const months = (now - Date.parse(r.pushed_at)) / (1000 * 60 * 60 * 24 * 30);
    if (months < 6) score += 1.5;
    else if (months < 18) score += 0.5;
  }
  return score;
}

/** Rank a user's repos for a portfolio: drop forks/archived, best work first. */
export function rankReposForPortfolio(apiRepos: GitHubApiRepo[], limit = 6, now?: number): Repo[] {
  return apiRepos
    .filter((r) => !r.fork && !r.archived)
    .map((r) => ({ r, s: repoScore(r, now) }))
    .sort((a, b) => b.s - a.s || a.r.name.localeCompare(b.r.name))
    .slice(0, limit)
    .map(({ r }) => toRepo(r));
}

/** Build a one-line headline from the top languages, when there's no bio. */
export function headlineFromLanguages(langs: string[]): string {
  if (langs.length === 0) return "Software developer";
  const top = langs.slice(0, 2).join(" & ");
  return `${top} developer`;
}

/**
 * Pull an intro out of a profile README. Real READMEs are noisy (badges,
 * images, HTML, headings, tables), so we strip all of that and return the
 * first couple of prose sentences as plain text — a safe, readable "About".
 */
export function extractReadmeIntro(markdown: string | null | undefined, maxLen = 320): string {
  if (!markdown) return "";
  const lines = markdown.replace(/\r/g, "").split("\n");
  const prose: string[] = [];
  let inFence = false;
  let inHtml = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (/^```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    // Skip HTML blocks (e.g. <p align="center">…</p>, <img>, <div>).
    if (/^<\/?(p|div|table|h\d|picture|a|center|br|hr)\b/i.test(line)) { inHtml = /<(p|div|table|center|picture)\b/i.test(line) && !/\/>/.test(line); continue; }
    if (inHtml) { if (/<\/(p|div|table|center|picture)>/i.test(line)) inHtml = false; continue; }
    if (!line) { if (prose.length) break; else continue; } // blank ends the first paragraph
    if (/^#{1,6}\s/.test(line)) continue;          // headings
    if (/^[-*+>]\s/.test(line)) continue;          // list items / quotes
    if (/^\|/.test(line)) continue;                // table rows
    if (/^!\[/.test(line)) continue;               // standalone images
    // A line that is only badges/links/images is not prose.
    const stripped = line.replace(/!?\[[^\]]*\]\([^)]*\)/g, "").replace(/<[^>]+>/g, "").trim();
    if (!stripped || /^[#>*\-=_|]+$/.test(stripped)) continue;
    prose.push(line);
  }
  let text = prose.join(" ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")          // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")        // links → their text
    .replace(/<[^>]+>/g, "")                         // inline HTML
    .replace(/[*_`~]/g, "")                          // emphasis/code marks
    .replace(/\s+/g, " ")
    .trim();
  if (text.length > maxLen) {
    text = text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
  }
  return text;
}

/** Build the portfolio view model from a GitHub user, their repos, and README. */
export function buildGhProfile(
  user: GitHubApiUser,
  apiRepos: GitHubApiRepo[],
  readme?: string | null,
): GhProfile {
  const links: GhLink[] = [];
  if (user.blog && user.blog.trim()) {
    links.push({ kind: "website", label: user.blog.replace(/^https?:\/\//i, ""), url: absolute(user.blog.trim()) });
  }
  if (user.twitter_username) {
    links.push({ kind: "twitter", label: `@${user.twitter_username}`, url: `https://twitter.com/${user.twitter_username}` });
  }

  const topLanguages = stackFromRepos(apiRepos);
  const repos = rankReposForPortfolio(apiRepos);
  const bio = user.bio?.trim() || "";
  const about = extractReadmeIntro(readme);

  return {
    username: user.login,
    name: user.name?.trim() || user.login,
    headline: bio || headlineFromLanguages(topLanguages),
    about,
    avatarUrl: user.avatar_url,
    githubUrl: user.html_url || `https://github.com/${user.login}`,
    company: user.company?.trim() || null,
    location: user.location?.trim() || null,
    followers: user.followers ?? 0,
    publicRepos: user.public_repos ?? 0,
    topLanguages,
    links,
    stack: topLanguages,
    repos,
    empty: repos.length === 0 && topLanguages.length === 0 && !bio && !about && !user.name,
  };
}
