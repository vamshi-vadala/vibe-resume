"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { analyzeDevResume, SAMPLE_DEV_RESUME, type DevProfile } from "@/lib/devresume.ts";
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

export default function Converter() {
  const [src, setSrc] = useState("");
  const [data, setData] = useState<DevProfile | null>(null);
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
            <Portfolio data={data} />
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
function Portfolio({ data }: { data: DevProfile }) {
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

      {data.repos.length > 0 && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>Projects</h2>
          <div className={styles.repos}>
            {data.repos.map((r, i) => (
              <a key={i} className={styles.repoCard} href={r.url} target="_blank" rel="noopener noreferrer">
                <div className={styles.repoName}>{r.name}</div>
                <div className={styles.repoOwner}>{r.owner}/{r.name}</div>
              </a>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
