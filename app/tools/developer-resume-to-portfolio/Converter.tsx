"use client";

import { useState } from "react";
import posthog from "posthog-js";
import {
  analyzeDevResume, SAMPLE_DEV_RESUME, usernameFromGitHubUrl, topReposFromApi, mergeRepos,
  type DevProfile, type DevRepo,
} from "@/lib/devresume.ts";
import styles from "./converter.module.css";

const TOOL_SLUG = "developer-resume-to-portfolio";
const SIGNUP = `/signup?utm_source=tool&utm_campaign=${TOOL_SLUG}`;

type DataLayer = Array<Record<string, unknown>>;
function track(event: string, props: Record<string, unknown> = {}) {
  const payload = { tool_slug: TOOL_SLUG, ...props };
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.capture(event, payload);
  const w = window as unknown as { dataLayer?: DataLayer };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...payload });
}

function goSignup(placement: string) {
  track("cta_clicked", { placement });
  window.location.href = SIGNUP;
}

function slug(name: string) {
  return (name || "you").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "you";
}

/** Fetch a user's public repos from GitHub (client-side → visitor's own rate limit). */
async function fetchUserRepos(username: string): Promise<DevRepo[] | null> {
  // Bound the wait — on a slow/blocked network we fall back rather than hang.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`,
      { headers: { Accept: "application/vnd.github+json" }, signal: ctrl.signal }
    );
    if (!res.ok) return null; // 404 / rate-limited → fall back to resume-listed repos
    const json = await res.json();
    return Array.isArray(json) ? topReposFromApi(json, 6) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Resume-listed repos first (the candidate's pick), enriched from the live data. */
function combineRepos(textRepos: DevRepo[], liveRepos: DevRepo[]): DevRepo[] {
  const key = (r: DevRepo) => `${r.owner}/${r.name}`.toLowerCase();
  const live = new Map(liveRepos.map((r) => [key(r), r]));
  const chosen = textRepos.map((t) => live.get(key(t)) ?? t); // enrich if GitHub knows it
  const chosenKeys = new Set(textRepos.map(key));
  const rest = liveRepos.filter((r) => !chosenKeys.has(key(r)));
  return mergeRepos(chosen, rest, 8);
}

export default function Converter() {
  const [src, setSrc] = useState("");
  const [data, setData] = useState<DevProfile | null>(null);
  const [liveRepos, setLiveRepos] = useState<DevRepo[]>([]);
  const [error, setError] = useState("");

  function run(text: string) {
    if (!text.trim()) return;
    track("tool_started");
    const profile = analyzeDevResume(text);
    if (profile.empty) {
      setData(null);
      setError("We couldn't read a developer profile from that. Paste your resume text — include your GitHub, tech stack, and a project or two.");
      return;
    }
    setError("");
    setData(profile);
    setLiveRepos([]);
    // Deliver "repos pulled out automatically": if a GitHub profile is present,
    // fetch the real repos and fold them in. Fire-and-forget — the preview shows
    // immediately and never blocks on the network.
    const user = usernameFromGitHubUrl(profile.githubUrl);
    if (user) {
      fetchUserRepos(user).then((repos) => {
        if (repos && repos.length) setLiveRepos(repos);
      });
    }
    track("tool_completed", { stack: profile.stack.length, repos: profile.repos.length });
    requestAnimationFrame(() =>
      document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <h1>Developer Resume → Portfolio</h1>
        <p>
          Paste your resume and watch it become a <strong>developer portfolio</strong> —
          your GitHub, project repos and tech stack, pulled out and laid out automatically.
        </p>
      </header>

      {/* INPUT */}
      <section className={styles.card}>
        <label className={styles.label} htmlFor="src">Paste your resume text</label>
        <textarea
          id="src" className={styles.textarea}
          value={src} onChange={(e) => setSrc(e.target.value)}
          placeholder="Paste your developer resume here — include your GitHub, skills and projects…"
        />
        <div className={styles.row}>
          <button className={`${styles.btn} ${styles.primary}`} onClick={() => run(src)}>
            Flip to portfolio →
          </button>
          <button className={`${styles.btn} ${styles.ghost}`} onClick={() => { setSrc(SAMPLE_DEV_RESUME); run(SAMPLE_DEV_RESUME); }}>
            Try a sample
          </button>
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>

      {/* RESULT — the portfolio preview */}
      {data && (
        <section className={styles.card} id="result">
          <div className={styles.resultHead}>
            <h2 className={styles.resultTitle}>Your portfolio</h2>
            <span className={styles.resultSub}>Live preview · publish to get your own URL</span>
          </div>

          <div className={styles.browser}>
            <div className={styles.browserBar}>
              <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
              <span className={styles.url}>vibe.dev/{slug(data.name)}</span>
            </div>
            <Portfolio data={data} repos={combineRepos(data.repos, liveRepos)} />
          </div>

          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.accent} ${styles.btnLg}`} onClick={() => goSignup("result_actions")}>
              Publish this portfolio →
            </button>
          </div>

          <div className={styles.cta}>
            <p>Your portfolio is ready — publish it with your own URL in 1 click.</p>
            <button className={`${styles.btn} ${styles.primary}`} onClick={() => goSignup("sticky_result")}>
              Publish on Vibe Resume
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

const LINK_LABEL: Record<string, string> = {
  github: "GitHub", linkedin: "LinkedIn", website: "Website",
  stackoverflow: "Stack Overflow", twitter: "Twitter", gitlab: "GitLab", devpost: "Devpost",
};

/** The generated developer portfolio — a single polished, responsive template. */
function Portfolio({ data, repos }: { data: DevProfile; repos: DevRepo[] }) {
  const allLinks = [
    ...(data.githubUrl ? [{ kind: "github", label: data.githubUrl.replace(/^https?:\/\//, ""), url: data.githubUrl }] : []),
    ...data.links,
  ];
  return (
    <article className={styles.site}>
      <header className={styles.siteHero}>
        <h1 className={styles.siteName}>{data.name || "Your Name"}</h1>
        {data.headline && <p className={styles.siteRole}>{data.headline}</p>}
        {data.summary && <p className={styles.siteSummary}>{data.summary}</p>}
        {allLinks.length > 0 && (
          <div className={styles.linkRow}>
            {allLinks.map((l, i) => (
              <a key={i} className={styles.link} href={l.url} target="_blank" rel="noopener noreferrer">
                {LINK_LABEL[l.kind] ?? "Link"}
              </a>
            ))}
          </div>
        )}
      </header>

      {data.stack.length > 0 && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>Tech stack</h2>
          <div className={styles.chips}>
            {data.stack.map((s, i) => <span key={i} className={styles.chip}>{s}</span>)}
          </div>
        </section>
      )}

      {data.experience.length > 0 && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>Experience</h2>
          {data.experience.map((e, i) => (
            <div key={i} className={styles.entry}>
              <div className={styles.entryHead}>
                {e.header && <span className={styles.entryTitle}>{e.header}</span>}
                {e.meta && <span className={styles.entryMeta}>{e.meta}</span>}
              </div>
              {e.bullets.length > 0 && (
                <ul className={styles.entryList}>
                  {e.bullets.map((b, k) => <li key={k}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {(repos.length > 0 || data.projects.length > 0) && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>Projects</h2>
          {repos.length > 0 && (
            <div className={styles.repos}>
              {repos.map((r, i) => (
                <a key={i} className={styles.repoCard} href={r.url} target="_blank" rel="noopener noreferrer">
                  <div className={styles.repoName}>{r.name}</div>
                  {r.description && <div className={styles.repoDesc}>{r.description}</div>}
                  <div className={styles.repoMeta}>
                    {r.language && <span>{r.language}</span>}
                    {typeof r.stars === "number" && r.stars > 0 && <span>★ {r.stars}</span>}
                    <span className={styles.repoOwner}>{r.owner}/{r.name}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
          {data.projects.length > 0 && (
            <ul className={styles.entryList} style={{ marginTop: repos.length ? 14 : 0 }}>
              {data.projects.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          )}
        </section>
      )}
    </article>
  );
}
