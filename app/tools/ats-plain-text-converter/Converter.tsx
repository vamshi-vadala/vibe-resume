"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { analyzeResume, grade, recommendations, SAMPLE_RESUME, TARGET_SCORE, type AtsResult } from "@/lib/ats";
import styles from "./converter.module.css";

const TOOL_SLUG = "ats-plain-text-converter";

type DataLayer = Array<Record<string, unknown>>;
function track(event: string, props: Record<string, unknown> = {}) {
  const payload = { tool_slug: TOOL_SLUG, ...props };
  // Send to PostHog when configured (no-op without a key).
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.capture(event, payload);
  // Keep dataLayer too, for any GTM consumer / local debugging.
  const w = window as unknown as { dataLayer?: DataLayer };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...payload });
}

export default function Converter() {
  const [src, setSrc] = useState("");
  const [result, setResult] = useState<AtsResult | null>(null);
  const [copied, setCopied] = useState(false);

  function run(text: string) {
    if (!text.trim()) return;
    track("tool_started");
    const r = analyzeResume(text);
    setResult(r);
    track("tool_completed", { score: r.score });
    requestAnimationFrame(() =>
      document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      setSrc(text);
      run(text);
    };
    reader.readAsText(f);
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.text);
    track("result_interacted", { action: "copy" });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const g = result ? grade(result.score) : null;
  const recs = result ? recommendations(result) : { autoFixed: [], toEdit: [] };
  const gap = result ? Math.max(0, TARGET_SCORE - result.score) : 0;
  const recoverable = [...recs.autoFixed, ...recs.toEdit].reduce((s, r) => s + r.points, 0);
  const atTarget = result ? result.score >= TARGET_SCORE : false;

  return (
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <h1>ATS Plain-Text Resume Converter</h1>
        <p>
          Recruiters see your design. The <strong>ATS robot</strong> sees plain text — and that&apos;s
          what decides if you get read. Paste your resume to see both views.
        </p>
      </header>

      {/* INPUT — max one required field */}
      <section className={styles.card}>
        <label className={styles.label} htmlFor="src">Paste your resume text</label>
        <textarea
          id="src" className={styles.textarea}
          value={src} onChange={(e) => setSrc(e.target.value)}
          placeholder="Paste your resume here (or upload a .txt file below)…"
        />
        <div className={styles.row}>
          <button className={`${styles.btn} ${styles.primary}`} onClick={() => run(src)}>
            See the robot&apos;s view →
          </button>
          <button className={`${styles.btn} ${styles.ghost}`} onClick={() => { setSrc(SAMPLE_RESUME); run(SAMPLE_RESUME); }}>
            Try a sample
          </button>
          <input type="file" accept=".txt" className={styles.file} onChange={onFile} />
        </div>
      </section>

      {/* RESULT */}
      {result && g && (
        <section className={styles.card} id="result">
          <div className={styles.scoreBar}>
            <span className={`${styles.scoreNum} ${styles["tone" + cap(g.tone)]}`}>{result.score}</span>
            <div>
              <div className={`${styles.scoreLabel} ${styles["tone" + cap(g.tone)]}`}>{g.label}</div>
              {!atTarget && (
                <div className={styles.scoreSub}>
                  <strong className={styles.toneOk}>+{Math.min(recoverable, gap || recoverable)} points</strong> available — reach {TARGET_SCORE} to be ATS-friendly.
                </div>
              )}
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.pane}>
              <h3>Human view <span className={`${styles.tag} ${styles.tagHuman}`}>what you wrote</span></h3>
              <pre className={styles.pre}>{src}</pre>
            </div>
            <div className={styles.pane}>
              <h3>Robot view <span className={`${styles.tag} ${styles.tagRobot}`}>what the ATS parses</span></h3>
              <pre className={styles.pre}>{result.text}</pre>
            </div>
          </div>

          {/* path to target — split into auto-fixed vs manual edits */}
          {!atTarget && (recs.autoFixed.length > 0 || recs.toEdit.length > 0) && (
            <div className={styles.recPanel}>
              <h3 className={styles.recTitle}>How to reach {TARGET_SCORE} (ATS-friendly)</h3>

              {recs.autoFixed.length > 0 && (
                <>
                  <div className={`${styles.recGroup} ${styles.toneOk}`}>✓ Done for you — applied in the copied text</div>
                  <ol className={styles.recs}>
                    {recs.autoFixed.map((r, n) => (
                      <li key={n} className={`${styles["lvl" + r.lvl]} ${styles.recDone}`}>
                        <span className={styles.recPts}>+{r.points}</span>
                        <span>{r.msg}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}

              {recs.toEdit.length > 0 && (
                <>
                  <div className={`${styles.recGroup} ${styles.toneWarn}`}>✎ Edit your resume — fix these in your source file</div>
                  <ol className={styles.recs}>
                    {recs.toEdit.map((r, n) => (
                      <li key={n} className={styles["lvl" + r.lvl]}>
                        <span className={styles.recPts}>+{r.points}</span>
                        <span>{r.msg}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          )}
          {atTarget && (
            <p className={`${styles.allClear} ${styles.toneOk}`}>✓ This resume parses cleanly — you&apos;re ATS-friendly.</p>
          )}

          {/* evident primary actions */}
          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.primary} ${styles.btnLg}`} onClick={copy}>
              {copied ? "Copied ✓" : "Copy ATS-clean text"}
            </button>
            <button
              className={`${styles.btn} ${styles.accent} ${styles.btnLg}`}
              onClick={() => {
                track("cta_clicked", { placement: "result_actions" });
                window.location.href = `/signup?utm_source=tool&utm_campaign=${TOOL_SLUG}`;
              }}
            >
              Publish on Vibe Resume →
            </button>
          </div>

          {/* sticky CTA — only rendered after a result exists */}
          <div className={styles.cta}>
            <p>Your cleaned resume is ready — publish it as a live page in 1 click.</p>
            <button
              className={`${styles.btn} ${styles.primary}`}
              onClick={() => {
                track("cta_clicked", { placement: "sticky_result" });
                window.location.href = `/signup?utm_source=tool&utm_campaign=${TOOL_SLUG}`;
              }}
            >
              Publish on Vibe Resume
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
