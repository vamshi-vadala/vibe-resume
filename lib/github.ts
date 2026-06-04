// Shared GitHub primitives used by both the dev-resume → portfolio and the
// github → portfolio tools. Pure and dependency-free — the network calls live
// in the client components; this module only shapes and ranks the data.

/** A repo as the portfolio UIs consume it. */
export interface Repo {
  owner: string;
  name: string;
  url: string;
  description?: string | null;
  stars?: number;
  language?: string | null;
}

/** The subset of GitHub's `/users/:u/repos` response we use. */
export interface GitHubApiRepo {
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  archived?: boolean;
  owner: { login: string };
}

/** Extract the GitHub username from a profile URL like https://github.com/jane. */
export function usernameFromGitHubUrl(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/github\.com\/([A-Za-z0-9-]+)/i);
  return m ? m[1] : null;
}

/** GitHub handle rules: 1–39 chars, alphanumeric or single hyphens, no edge hyphen. */
const HANDLE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

/** Normalize freeform input (handle, @handle, or profile URL) to a bare username. */
export function normalizeUsername(input: string): string | null {
  let s = input.trim();
  if (!s) return null;
  const fromUrl = usernameFromGitHubUrl(s);
  if (fromUrl) s = fromUrl;
  s = s.replace(/^@/, "").replace(/\/+$/, "");
  return HANDLE.test(s) ? s : null;
}

/**
 * Rank a user's GitHub repos for a portfolio: drop forks and archived repos,
 * then sort by stars (desc), breaking ties by name for determinism.
 */
export function topReposFromApi(apiRepos: GitHubApiRepo[], limit = 6): Repo[] {
  return apiRepos
    .filter((r) => !r.fork && !r.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((r) => ({
      owner: r.owner.login,
      name: r.name,
      url: r.html_url,
      description: r.description,
      stars: r.stargazers_count,
      language: r.language,
    }));
}

/** Merge two repo lists, de-duping by owner/name (first list wins), capped. */
export function mergeRepos(primary: Repo[], extra: Repo[], limit = 6): Repo[] {
  const out: Repo[] = [];
  const seen = new Set<string>();
  for (const r of [...primary, ...extra]) {
    const key = `${r.owner}/${r.name}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}
