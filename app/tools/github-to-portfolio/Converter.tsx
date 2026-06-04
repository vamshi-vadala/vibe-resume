"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { normalizeUsername } from "@/lib/github.ts";
import { buildGhProfile, type GhProfile } from "@/lib/ghportfolio.ts";
import styles from "./converter.module.css";

const TOOL_SLUG = "github-to-portfolio";
const SIGNUP = `/signup?utm_source=tool&utm_campaign=${TOOL_SLUG}`;
const SAMPLE_USER = "sindresorhus";

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

/** Fetch the user + their repos from GitHub (client-side → visitor's own rate limit). */
async function fetchGhProfile(username: string): Promise<Result> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  const opts = { headers: { Accept: "application/vnd.github+json" }, signal: ctrl.signal };
  try {
    const [uRes, rRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, opts),
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`, opts),
    ]);
    if (uRes.status === 404) return { ok: false, message: `No GitHub user “${username}” found. Check the spelling.` };
    if (uRes.status === 403 || rRes.status === 403)
      return { ok: false, message: "GitHub’s rate limit was hit — please try again in a few minutes." };
    if (!uRes.ok) return { ok: false, message: "Couldn’t reach GitHub — please try again." };
    const userJson = await uRes.json();
    const reposJson = rRes.ok ? await rRes.json() : [];
    const profile = buildGhProfile(userJson, Array.isArray(reposJson) ? reposJson : []);
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
          Type a <strong>GitHub username</strong> and get an instant portfolio — bio, top
          repositories and tech stack, pulled straight from GitHub.
        </p>
      </header>

      {/* INPUT — a single field */}
      <section className={styles.card}>
        <label className={styles.label} htmlFor="user">GitHub username</label>
        <form
          className={styles.row}
          onSubmit={(e) => { e.preventDefault(); run(input); }}
        >
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
  const meta = [profile.company, profile.location, profile.followers ? `${profile.followers.toLocaleString()} followers` : null]
    .filter(Boolean) as string[];
  return (
    <article className={styles.site}>
      <header className={styles.siteHero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.avatar} src={profile.avatarUrl} alt={profile.name} width={72} height={72} />
        <div>
          <h1 className={styles.siteName}>{profile.name}</h1>
          {profile.bio && <p className={styles.siteBio}>{profile.bio}</p>}
          {meta.length > 0 && <p className={styles.siteMeta}>{meta.join(" · ")}</p>}
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
          <h2 className={styles.siteH2}>Top projects</h2>
          <div className={styles.repos}>
            {profile.repos.map((r, i) => (
              <a key={i} className={styles.repoCard} href={r.url} target="_blank" rel="noopener noreferrer">
                <div className={styles.repoName}>{r.name}</div>
                {r.description && <div className={styles.repoDesc}>{r.description}</div>}
                <div className={styles.repoMeta}>
                  {r.language && <span>{r.language}</span>}
                  {typeof r.stars === "number" && r.stars > 0 && <span>★ {r.stars.toLocaleString()}</span>}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
