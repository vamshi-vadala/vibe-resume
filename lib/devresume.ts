// Pure logic for the Developer Resume → Portfolio tool. No DOM/React deps.
// Builds on the base resume parser (name/headline/summary) and adds the
// developer-specific signals a portfolio leads with: GitHub, profile links,
// project repos, and a detected tech stack. Tolerant by design — never throws.

import { parseResume } from "./resume.ts";

export type LinkKind = "github" | "linkedin" | "website" | "stackoverflow" | "twitter" | "gitlab" | "devpost";

export interface DevLink {
  kind: LinkKind;
  label: string; // human label, e.g. "github.com/jane"
  url: string;   // absolute https URL
}
export interface DevRepo {
  owner: string;
  name: string;
  url: string;
}
export interface DevProfile {
  name: string;
  headline: string;     // job title, e.g. "Senior Software Engineer"
  summary: string;
  githubUrl: string | null;
  links: DevLink[];
  repos: DevRepo[];
  stack: string[];      // canonical-cased tech keywords found in the text
  empty: boolean;
}

// --- tech dictionary ------------------------------------------------------
// [pattern, display]. Matched as whole tokens, case-insensitive — except the
// short ambiguous ones (Go, R) which require exact case to avoid matching the
// English words "go"/"r". Order here is the display order in the UI.
const TECH: Array<[string, string]> = [
  ["typescript", "TypeScript"], ["javascript", "JavaScript"], ["python", "Python"],
  ["java", "Java"], ["kotlin", "Kotlin"], ["swift", "Swift"], ["rust", "Rust"],
  ["ruby", "Ruby"], ["php", "PHP"], ["scala", "Scala"], ["elixir", "Elixir"],
  ["dart", "Dart"], ["c\\+\\+", "C++"], ["c#", "C#"], ["objective-c", "Objective-C"],
  ["solidity", "Solidity"], ["sql", "SQL"], ["golang", "Go"], ["bash", "Bash"],
  ["react native", "React Native"], ["react", "React"], ["next\\.js", "Next.js"],
  ["vue", "Vue"], ["nuxt", "Nuxt"], ["angular", "Angular"], ["svelte", "Svelte"],
  ["redux", "Redux"], ["tailwind css", "Tailwind CSS"], ["tailwind", "Tailwind"],
  ["sass", "Sass"], ["vite", "Vite"], ["webpack", "Webpack"], ["graphql", "GraphQL"],
  ["node\\.js", "Node.js"], ["nodejs", "Node.js"], ["express", "Express"],
  ["nestjs", "NestJS"], ["django", "Django"], ["flask", "Flask"], ["fastapi", "FastAPI"],
  ["spring boot", "Spring Boot"], ["spring", "Spring"], ["ruby on rails", "Ruby on Rails"],
  ["rails", "Rails"], ["laravel", "Laravel"], ["asp\\.net", "ASP.NET"], ["\\.net", ".NET"],
  ["flutter", "Flutter"], ["android", "Android"], ["ios", "iOS"],
  ["tensorflow", "TensorFlow"], ["pytorch", "PyTorch"], ["scikit-learn", "scikit-learn"],
  ["pandas", "Pandas"], ["numpy", "NumPy"], ["spark", "Spark"], ["kafka", "Kafka"],
  ["postgresql", "PostgreSQL"], ["postgres", "PostgreSQL"], ["mysql", "MySQL"],
  ["mongodb", "MongoDB"], ["redis", "Redis"], ["sqlite", "SQLite"],
  ["dynamodb", "DynamoDB"], ["elasticsearch", "Elasticsearch"], ["firebase", "Firebase"],
  ["supabase", "Supabase"], ["prisma", "Prisma"],
  ["aws", "AWS"], ["gcp", "GCP"], ["azure", "Azure"], ["docker", "Docker"],
  ["kubernetes", "Kubernetes"], ["terraform", "Terraform"], ["ansible", "Ansible"],
  ["jenkins", "Jenkins"], ["github actions", "GitHub Actions"], ["nginx", "Nginx"],
  ["linux", "Linux"], ["vercel", "Vercel"], ["netlify", "Netlify"],
  ["jest", "Jest"], ["cypress", "Cypress"], ["playwright", "Playwright"],
  ["storybook", "Storybook"], ["figma", "Figma"],
];
// Short, English-word-colliding terms: match only with exact case.
const CASE_SENSITIVE: Array<[string, string]> = [["Go", "Go"], ["R", "R"]];

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Detect tech-stack keywords as whole tokens, returned in dictionary order. */
export function detectStack(text: string): string[] {
  const found = new Map<string, true>(); // display -> seen
  for (const [pattern, display] of TECH) {
    // Token boundaries that treat +, #, ., - as part of a tech word.
    const re = new RegExp(`(?<![A-Za-z0-9.+#-])${pattern}(?![A-Za-z0-9+#-])`, "i");
    if (re.test(text)) found.set(display, true);
  }
  for (const [pattern, display] of CASE_SENSITIVE) {
    const re = new RegExp(`(?<![A-Za-z0-9.+#-])${esc(pattern)}(?![A-Za-z0-9+#-])`);
    if (re.test(text)) found.set(display, true);
  }
  return [...found.keys()].slice(0, 28);
}

const GITHUB_PATH = /github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38})?)(?:\/([A-Za-z0-9._-]+))?/gi;

/** Pull the GitHub profile URL (if any) and any owner/repo links out of the text. */
export function detectGitHub(text: string): { githubUrl: string | null; repos: DevRepo[] } {
  let githubUrl: string | null = null;
  const repos: DevRepo[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(GITHUB_PATH)) {
    const owner = m[1];
    const repo = m[2];
    if (repo) {
      const key = `${owner}/${repo}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        repos.push({ owner, name: repo, url: `https://github.com/${owner}/${repo}` });
      }
    } else if (!githubUrl) {
      githubUrl = `https://github.com/${owner}`;
    }
  }
  // A repo owner also implies the profile, if no bare profile link was present.
  if (!githubUrl && repos.length) githubUrl = `https://github.com/${repos[0].owner}`;
  return { githubUrl, repos };
}

const LINK_PATTERNS: Array<{ kind: LinkKind; re: RegExp }> = [
  { kind: "linkedin", re: /linkedin\.com\/(?:in|pub)\/[A-Za-z0-9-]+/i },
  { kind: "stackoverflow", re: /stackoverflow\.com\/users\/\d+(?:\/[A-Za-z0-9-]+)?/i },
  { kind: "gitlab", re: /gitlab\.com\/[A-Za-z0-9-]+/i },
  { kind: "twitter", re: /(?:twitter\.com|x\.com)\/[A-Za-z0-9_]+/i },
  { kind: "devpost", re: /devpost\.com\/[A-Za-z0-9-]+/i },
];
// A personal site: a bare domain on common dev TLDs, not one of the known hosts.
const WEBSITE = /\b((?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:dev|io|me|app|tech|codes|page))\b(\/\S*)?/i;
const KNOWN_HOST = /github|linkedin|gitlab|stackoverflow|twitter|x\.com|devpost|vercel\.app|netlify\.app/i;

function absolute(u: string): string {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

/** Collect profile/portfolio links (excluding GitHub, handled separately). */
export function detectLinks(text: string): DevLink[] {
  const links: DevLink[] = [];
  const seen = new Set<LinkKind>();
  for (const { kind, re } of LINK_PATTERNS) {
    const m = text.match(re);
    if (m && !seen.has(kind)) {
      seen.add(kind);
      links.push({ kind, label: m[0].replace(/^https?:\/\//i, ""), url: absolute(m[0]) });
    }
  }
  const w = text.match(WEBSITE);
  if (w && !KNOWN_HOST.test(w[0])) {
    links.push({ kind: "website", label: w[0].replace(/^https?:\/\//i, ""), url: absolute(w[0]) });
  }
  return links;
}

export function analyzeDevResume(input: string): DevProfile {
  const base = parseResume(input);
  const text = input;
  const { githubUrl, repos } = detectGitHub(text);
  const links = detectLinks(text);
  const stack = detectStack(text);

  const empty = base.empty && !githubUrl && repos.length === 0 && stack.length === 0 && links.length === 0;

  return {
    name: base.name,
    headline: base.title,
    summary: base.summary,
    githubUrl,
    links,
    repos,
    stack,
    empty,
  };
}

export const SAMPLE_DEV_RESUME = `Alex Rivera
Senior Software Engineer
alex@example.com  •  github.com/alexrivera  •  linkedin.com/in/alexrivera  •  alexrivera.dev

Summary
Full-stack engineer who ships. I build fast, accessible products and love
turning gnarly problems into clean, well-tested systems.

Skills
TypeScript, React, Next.js, Node.js, GraphQL, PostgreSQL, Redis, Docker,
Kubernetes, AWS, Terraform, Go, Python, Jest, Playwright

Experience
Senior Software Engineer — Stripe
2021 — Present
Led the migration of the payments dashboard to Next.js and GraphQL.
Cut p95 latency 40% by introducing Redis caching and query batching.

Software Engineer — Datadog
2018 — 2021
Built a real-time metrics pipeline in Go processing 2M events/sec.
Shipped the React component library used across 30+ internal apps.

Projects
github.com/alexrivera/ratelimit-go — a tiny, allocation-free rate limiter
github.com/alexrivera/portfolio — this site, built with Next.js + Tailwind
`;
