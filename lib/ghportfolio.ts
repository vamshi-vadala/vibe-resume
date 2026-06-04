// Pure logic for the GitHub → Portfolio tool. No DOM/React/network deps.
// Shapes GitHub's user + repos API responses into a portfolio view model.
// The fetching (and its error handling) lives in the client component.

import { topReposFromApi, type GitHubApiRepo, type Repo } from "./github.ts";

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
  bio: string;
  avatarUrl: string;
  githubUrl: string;
  company: string | null;
  location: string | null;
  followers: number;
  links: GhLink[];       // blog/website + twitter
  stack: string[];       // languages aggregated across repos, most-used first
  repos: Repo[];         // top repos by stars
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

/** Build the portfolio view model from a GitHub user and their repos. */
export function buildGhProfile(user: GitHubApiUser, apiRepos: GitHubApiRepo[]): GhProfile {
  const links: GhLink[] = [];
  if (user.blog && user.blog.trim()) {
    links.push({ kind: "website", label: user.blog.replace(/^https?:\/\//i, ""), url: absolute(user.blog.trim()) });
  }
  if (user.twitter_username) {
    links.push({ kind: "twitter", label: `@${user.twitter_username}`, url: `https://twitter.com/${user.twitter_username}` });
  }

  const repos = topReposFromApi(apiRepos, 6);
  const stack = stackFromRepos(apiRepos);

  return {
    username: user.login,
    name: user.name?.trim() || user.login,
    bio: user.bio?.trim() || "",
    avatarUrl: user.avatar_url,
    githubUrl: user.html_url || `https://github.com/${user.login}`,
    company: user.company?.trim() || null,
    location: user.location?.trim() || null,
    followers: user.followers ?? 0,
    links,
    stack,
    repos,
    empty: repos.length === 0 && stack.length === 0 && !user.bio && !user.name,
  };
}
