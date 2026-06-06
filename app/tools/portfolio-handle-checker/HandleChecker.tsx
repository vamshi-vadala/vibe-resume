"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { normalizeHandle, isValidHandle, buildTargets, githubApiUrl, type Target } from "@/lib/handle.ts";
import styles from "./handle.module.css";

const TOOL_SLUG = "portfolio-handle-checker";
const SAMPLE = "jordanrivera";

type DataLayer = Array<Record<string, unknown>>;
function track(event: string, props: Record<string, unknown> = {}) {
  const payload = { tool_slug: TOOL_SLUG, ...props };
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.capture(event, payload);
  const w = window as unknown as { dataLayer?: DataLayer };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...payload });
}

type GhStatus = "available" | "taken" | "unknown";

/** Live, truthful GitHub availability check (404 = free, 200 = taken). */
async function checkGithub(handle: string): Promise<GhStatus> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(githubApiUrl(handle), { headers: { Accept: "application/vnd.github+json" }, signal: ctrl.signal });
    if (res.status === 404) return "available";
    if (res.status === 200) return "taken";
    return "unknown"; // 403 rate-limit / network hiccup — don't guess
  } catch {
    return "unknown";
  } finally {
    clearTimeout(timer);
  }
}

export default function HandleChecker() {
  const [input, setInput] = useState("");
  const [handle, setHandle] = useState<string | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [gh, setGh] = useState<GhStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  async function run(raw: string) {
    if (!isValidHandle(raw)) {
      setError("Enter a handle — letters, numbers, dots, dashes or underscores.");
      setHandle(null);
      return;
    }
    const h = normalizeHandle(raw);
    setError("");
    setHandle(h);
    setTargets(buildTargets(h));
    setGh(null);
    setChecking(true);
    track("tool_started");
    requestAnimationFrame(() =>
      document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
    const status = await checkGithub(h);
    setGh(status);
    setChecking(false);
    track("tool_completed", { github: status });
  }

  function claim(placement: string) {
    track("cta_clicked", { placement, handle: handle ?? undefined });
    const slug = handle ? `&slug=${encodeURIComponent(handle)}` : "";
    window.location.href = `/signup?utm_source=tool&utm_campaign=${TOOL_SLUG}${slug}`;
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <h1>Portfolio Handle Checker</h1>
        <p>
          Your name is your brand. Check where <strong>@yourhandle</strong> is still free across
          the web — and claim it before someone else does. Free, no signup.
        </p>
      </header>

      {/* INPUT */}
      <section className={styles.card}>
        <label className={styles.label} htmlFor="handle">Your handle</label>
        <form className={styles.row} onSubmit={(e) => { e.preventDefault(); run(input); }}>
          <div className={styles.inputWrap}>
            <span className={styles.at}>@</span>
            <input
              id="handle" className={styles.input}
              value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="jordanrivera" autoCapitalize="none" autoCorrect="off" spellCheck={false}
            />
          </div>
          <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={checking}>
            {checking ? "Checking…" : "Check availability →"}
          </button>
          <button type="button" className={`${styles.btn} ${styles.ghost}`} disabled={checking}
            onClick={() => { setInput(SAMPLE); run(SAMPLE); }}>
            Try a sample
          </button>
        </form>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>

      {/* RESULT */}
      {handle && (
        <section className={styles.card} id="result">
          <div className={styles.resultHead}>
            <h2 className={styles.resultTitle}>Results for <span className={styles.handle}>@{handle}</span></h2>
          </div>

          {/* GitHub — the one we can truthfully check */}
          <div className={`${styles.gh} ${gh === "available" ? styles.ghFree : gh === "taken" ? styles.ghTaken : ""}`}>
            <div className={styles.ghMain}>
              <span className={styles.ghLabel}>GitHub</span>
              <span className={styles.ghUrl}>github.com/{handle}</span>
            </div>
            <div className={styles.ghStatus} aria-live="polite">
              {gh === null && <span className={styles.statusChecking}>Checking…</span>}
              {gh === "available" && <span className={styles.statusFree}>✓ Available</span>}
              {gh === "taken" && <span className={styles.statusTaken}>✗ Taken</span>}
              {gh === "unknown" && <span className={styles.statusUnknown}>Couldn’t check — open ↗</span>}
            </div>
            <a className={styles.ghOpen} href={`https://github.com/${handle}`} target="_blank" rel="noopener noreferrer">Open ↗</a>
          </div>

          {/* The rest — honest "check it yourself" links (CORS/ToS block real checks) */}
          <p className={styles.gridNote}>We can only verify GitHub automatically. Tap to check the rest yourself:</p>
          <div className={styles.grid}>
            {targets.filter((t) => !t.live).map((t) => (
              <a key={t.id} className={styles.tile} href={t.url} target="_blank" rel="noopener noreferrer"
                onClick={() => track("result_interacted", { action: "open", platform: t.id })}>
                <span className={styles.tileLabel}>{t.label}</span>
                <span className={styles.tileGo}>Check ↗</span>
              </a>
            ))}
          </div>

          {/* claim CTA — the Vibe Resume namespace is new, so it's honestly yours to take */}
          <div className={styles.cta}>
            <p>Lock in <strong>{handle}</strong> as your portfolio URL on Vibe Resume before it’s taken.</p>
            <button className={`${styles.btn} ${styles.accent}`} onClick={() => claim("sticky_result")}>
              Claim @{handle}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
