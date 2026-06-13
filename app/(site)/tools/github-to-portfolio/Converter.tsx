"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { normalizeUsername } from "@/lib/github.ts";
import { buildGhProfile, type GhProfile } from "@/lib/ghportfolio.ts";
import NextSteps from "../../NextSteps";
import GhPortfolio from "./GhPortfolio";
import styles from "./converter.module.css";

const TOOL_SLUG = "github-to-portfolio";
const SIGNUP = `/signup?utm_source=tool&utm_campaign=${TOOL_SLUG}`;
const PUBLISH_STASH_KEY = "vr.publish.pending";
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

function goPublish(placement: string, profile: GhProfile | null) {
  track("cta_clicked", { placement });
  if (!profile) { window.location.href = SIGNUP; return; }
  try {
    sessionStorage.setItem(
      PUBLISH_STASH_KEY,
      JSON.stringify({ kind: "github", profile, themeId: "" }),
    );
  } catch {
    window.location.href = SIGNUP;
    return;
  }
  window.location.href = "/account/publish";
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
            <GhPortfolio profile={profile} />
          </div>

          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.accent} ${styles.btnLg}`} onClick={() => goPublish("result_actions", profile)}>
              Publish this portfolio →
            </button>
          </div>

          <NextSteps from="github-to-portfolio" />
          <div className={styles.cta}>
            <p>Your portfolio is ready — publish it with your own URL in 1 click.</p>
            <button className={`${styles.btn} ${styles.primary}`} onClick={() => goPublish("sticky_result", profile)}>
              Publish on Vibe Resume
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

