"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { normalizeHandle, isValidHandle, buildTargets, githubApiUrl, type Target } from "@/lib/handle.ts";
import NextSteps from "../../NextSteps";
import styles from "./handle.module.css";

const TOOL_SLUG = "portfolio-handle-checker";
const SAMPLE = "octocat"; // GitHub's official demo account — not a real individual

type DataLayer = Array<Record<string, unknown>>;
function track(event: string, props: Record<string, unknown> = {}) {
  const payload = { tool_slug: TOOL_SLUG, ...props };
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.capture(event, payload);
  const w = window as unknown as { dataLayer?: DataLayer };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...payload });
}

type GhStatus = "available" | "taken" | "unknown";
type VrStatus = "available" | "taken" | "reserved" | "invalid" | "unknown";

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

/** viberesume.in/{handle} availability via our REST resource. */
async function checkViberesume(handle: string): Promise<VrStatus> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`/api/slugs/${encodeURIComponent(handle)}`, { signal: ctrl.signal });
    if (!res.ok && res.status !== 409) return "unknown";
    const data = (await res.json()) as { status?: VrStatus };
    return data.status ?? "unknown";
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
  const [vr, setVr] = useState<VrStatus | null>(null);
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
    setVr(null);
    setChecking(true);
    track("tool_started");
    requestAnimationFrame(() =>
      document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
    const [ghStatus, vrStatus] = await Promise.all([checkGithub(h), checkViberesume(h)]);
    setGh(ghStatus);
    setVr(vrStatus);
    setChecking(false);
    track("tool_completed", { github: ghStatus, viberesume: vrStatus });
  }

  function claim(placement: string) {
    track("cta_clicked", { placement, handle: handle ?? undefined });
    if (!handle) return;
    window.location.href = `/claim/${encodeURIComponent(handle)}`;
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

          {/* viberesume.in — the namespace we own; truthful DB lookup */}
          <div data-row="viberesume" className={`${styles.gh} ${vr === "available" ? styles.ghFree : (vr === "taken" || vr === "reserved") ? styles.ghTaken : ""}`}>
            <div className={styles.ghMain}>
              <span className={styles.ghLabel}>Vibe Resume</span>
              <span className={styles.ghUrl}>viberesume.in/{handle}</span>
            </div>
            <div className={styles.ghStatus} aria-live="polite">
              {vr === null && <span className={styles.statusChecking}>Checking…</span>}
              {vr === "available" && <span className={styles.statusFree}>✓ Available</span>}
              {vr === "taken" && <span className={styles.statusTaken}>✗ Taken</span>}
              {vr === "reserved" && <span className={styles.statusTaken}>✗ Reserved</span>}
              {vr === "invalid" && <span className={styles.statusUnknown}>Invalid format</span>}
              {vr === "unknown" && <span className={styles.statusUnknown}>Couldn’t check</span>}
            </div>
          </div>

          {/* GitHub — the one we can truthfully check */}
          <div data-row="github" className={`${styles.gh} ${gh === "available" ? styles.ghFree : gh === "taken" ? styles.ghTaken : ""}`}>
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
          <NextSteps from="portfolio-handle-checker" />
          {vr === "available" && (
            <div className={styles.cta}>
              <p>Lock in <strong>viberesume.in/{handle}</strong> as your portfolio URL before someone else does.</p>
              <button className={`${styles.btn} ${styles.accent}`} onClick={() => claim("sticky_result")}>
                Claim viberesume.in/{handle}
              </button>
            </div>
          )}
          {(vr === "taken" || vr === "reserved") && (
            <div className={styles.cta}>
              <p><strong>viberesume.in/{handle}</strong> is taken — try a variation above.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
