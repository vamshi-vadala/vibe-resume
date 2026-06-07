"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { normalizeUsername } from "@/lib/github.ts";
import { buildGhProfile, type GhProfile } from "@/lib/ghportfolio.ts";
import NextSteps from "../../NextSteps";
import styles from "./converter.module.css";

const TOOL_SLUG = "github-to-portfolio";
const SIGNUP = `/signup?utm_source=tool&utm_campaign=${TOOL_SLUG}`;
// octocat is GitHub's official demo/mascot account — safe to showcase (not a
// private individual). The tool fetches real public API data for it.
const SAMPLE_USER = "octocat";

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

type Result = { ok: true; profile: GhProfile } | { ok: false; message: string };

/** Decode a GitHub contents-API base64 payload to UTF-8 text (emoji-safe). */
function decodeBase64(content: string): string {
  const bytes = Uint8Array.from(atob(content.replace(/\s/g, "")), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Fetch the user, their repos, and their profile README from GitHub (client-side). */
async function fetchGhProfile(username: string): Promise<Result> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  const opts = { headers: { Accept: "application/vnd.github+json" }, signal: ctrl.signal };
  const base = `https://api.github.com`;
  try {
    const [uRes, rRes, readmeRes] = await Promise.all([
      fetch(`${base}/users/${encodeURIComponent(username)}`, opts),
      fetch(`${base}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`, opts),
      // Profile README lives in a repo named after the user (404 when absent).
      fetch(`${base}/repos/${encodeURIComponent(username)}/${encodeURIComponent(username)}/readme`, opts),
    ]);
    if (uRes.status === 404) return { ok: false, message: `No GitHub user “${username}” found. Check the spelling.` };
    if (uRes.status === 403 || rRes.status === 403)
      return { ok: false, message: "GitHub’s rate limit was hit — please try again in a few minutes." };
    if (!uRes.ok) return { ok: false, message: "Couldn’t reach GitHub — please try again." };

    const userJson = await uRes.json();
    const reposJson = rRes.ok ? await rRes.json() : [];
    let readme: string | null = null;
    if (readmeRes.ok) {
      try {
        const j = await readmeRes.json();
        if (j?.content) readme = decodeBase64(j.content);
      } catch { /* ignore a malformed README */ }
    }

    const profile = buildGhProfile(userJson, Array.isArray(reposJson) ? reposJson : [], readme);
    if (profile.empty)
      return { ok: false, message: `“${username}” has no public repos to build a portfolio from yet.` };
    return { ok: true, profile };
  } catch {
    return { ok: false, message: "Something went wrong reaching GitHub — please try again." };
  } finally {
    clearTimeout(timer);
  }
}

export default function Converter() {
  const [input, setInput] = useState("");
  const [profile, setProfile] = useState<GhProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run(raw: string) {
    const username = normalizeUsername(raw);
    if (!username) {
      setError("Enter a valid GitHub username (e.g. octocat).");
      return;
    }
    setError("");
    setProfile(null);
    setLoading(true);
    track("tool_started");
    const result = await fetchGhProfile(username);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setProfile(result.profile);
    track("tool_completed", { stack: result.profile.stack.length, repos: result.profile.repos.length });
    requestAnimationFrame(() =>
      document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <h1>GitHub → Portfolio</h1>
        <p>
          Type a <strong>GitHub username</strong> and get an instant portfolio — your intro,
          top projects with previews, and tech stack, pulled straight from GitHub.
        </p>
      </header>

      {/* INPUT — a single field */}
      <section className={styles.card}>
        <label className={styles.label} htmlFor="user">GitHub username</label>
        <form className={styles.row} onSubmit={(e) => { e.preventDefault(); run(input); }}>
          <div className={styles.inputWrap}>
            <span className={styles.at}>@</span>
            <input
              id="user" className={styles.input}
              value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="octocat" autoCapitalize="none" autoCorrect="off" spellCheck={false}
            />
          </div>
          <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={loading}>
            {loading ? "Building…" : "Build my portfolio →"}
          </button>
          <button
            type="button" className={`${styles.btn} ${styles.ghost}`} disabled={loading}
            onClick={() => { setInput(SAMPLE_USER); run(SAMPLE_USER); }}
          >
            Try a sample
          </button>
        </form>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>

      {/* RESULT — the portfolio preview */}
      {profile && (
        <section className={styles.card} id="result">
          <div className={styles.resultHead}>
            <h2 className={styles.resultTitle}>Your portfolio</h2>
            <span className={styles.resultSub}>Live preview · publish to get your own URL</span>
          </div>

          <div className={styles.browser}>
            <div className={styles.browserBar}>
              <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
              <span className={styles.url}>vibe.dev/{profile.username}</span>
            </div>
            <Portfolio profile={profile} />
          </div>

          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.accent} ${styles.btnLg}`} onClick={() => goSignup("result_actions")}>
              Publish this portfolio →
            </button>
          </div>

          <NextSteps from="github-to-portfolio" />
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

/** The generated portfolio — a single polished, responsive template. */
function Portfolio({ profile }: { profile: GhProfile }) {
  const stats = [
    profile.publicRepos ? `${profile.publicRepos.toLocaleString()} repos` : null,
    profile.followers ? `${profile.followers.toLocaleString()} followers` : null,
    profile.location,
    profile.company,
  ].filter(Boolean) as string[];

  return (
    <article className={styles.site}>
      <header className={styles.siteHero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.avatar} src={profile.avatarUrl} alt={profile.name} width={88} height={88} />
        <div className={styles.heroBody}>
          <h1 className={styles.siteName}>{profile.name}</h1>
          <p className={styles.headline}>{profile.headline}</p>
          {stats.length > 0 && <p className={styles.stats}>{stats.join("  ·  ")}</p>}
          <div className={styles.linkRow}>
            <a className={styles.link} href={profile.githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>
            {profile.links.map((l, i) => (
              <a key={i} className={styles.link} href={l.url} target="_blank" rel="noopener noreferrer">
                {l.kind === "twitter" ? "Twitter" : "Website"}
              </a>
            ))}
          </div>
        </div>
      </header>

      {profile.about && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>About</h2>
          <p className={styles.about}>{profile.about}</p>
        </section>
      )}

      {profile.stack.length > 0 && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>Tech stack</h2>
          <div className={styles.chips}>
            {profile.stack.map((s, i) => <span key={i} className={styles.chip}>{s}</span>)}
          </div>
        </section>
      )}

      {profile.repos.length > 0 && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>Featured projects</h2>
          <div className={styles.repos}>
            {profile.repos.map((r, i) => (
              <article key={i} className={styles.repoCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.repoThumb} src={r.thumbnail} alt="" loading="lazy" />
                <div className={styles.repoBody}>
                  <a className={styles.repoName} href={r.url} target="_blank" rel="noopener noreferrer">{r.name}</a>
                  {r.description && <p className={styles.repoDesc}>{r.description}</p>}
                  {r.topics && r.topics.length > 0 && (
                    <div className={styles.topics}>
                      {r.topics.slice(0, 4).map((t, k) => <span key={k} className={styles.topic}>{t}</span>)}
                    </div>
                  )}
                  <div className={styles.repoMeta}>
                    {r.language && <span>{r.language}</span>}
                    {typeof r.stars === "number" && r.stars > 0 && <span>★ {r.stars.toLocaleString()}</span>}
                    <span className={styles.repoLinks}>
                      {r.homepage && <a href={r.homepage} target="_blank" rel="noopener noreferrer">Live demo ↗</a>}
                      <a href={r.url} target="_blank" rel="noopener noreferrer">Code ↗</a>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
