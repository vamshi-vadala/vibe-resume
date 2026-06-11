"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import {
  generateSlugs, isValidName, linkedinUrl, vibeUrl, type SlugSuggestion,
} from "@/lib/slug.ts";
import NextSteps from "../../NextSteps";
import styles from "./customizer.module.css";

const TOOL_SLUG = "linkedin-url-customizer";
const SIGNUP = `/signup?utm_source=tool&utm_campaign=${TOOL_SLUG}`;
const SAMPLE = { name: "Jordan Rivera", keyword: "Full-Stack Engineer" };

type DataLayer = Array<Record<string, unknown>>;
function track(event: string, props: Record<string, unknown> = {}) {
  const payload = { tool_slug: TOOL_SLUG, ...props };
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.capture(event, payload);
  const w = window as unknown as { dataLayer?: DataLayer };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...payload });
}

export default function Customizer() {
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<SlugSuggestion[] | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // ?name= handoff (e.g. from the /account journey strip): prefill and
  // generate immediately so suggestions are ready on arrival.
  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("name");
    if (n) { setName(n); run(n, ""); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function run(rawName: string, rawKeyword: string) {
    if (!isValidName(rawName)) {
      setError("Enter your name (letters), e.g. Jordan Rivera.");
      setSuggestions(null);
      return;
    }
    setError("");
    track("tool_started");
    const result = generateSlugs(rawName, rawKeyword);
    setSuggestions(result);
    track("tool_completed", { count: result.length, has_keyword: Boolean(rawKeyword.trim()) });
    requestAnimationFrame(() =>
      document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }

  async function copy(slug: string) {
    const url = linkedinUrl(slug);
    try { await navigator.clipboard?.writeText(url); } catch { /* clipboard blocked — still flip UI */ }
    setCopied(slug);
    track("result_interacted", { action: "copy", slug });
    window.setTimeout(() => setCopied((c) => (c === slug ? null : c)), 1600);
  }

  function goClaim(placement: string, slug?: string) {
    track("cta_clicked", { placement, slug });
    // /claim/[slug] is the real reservation flow — auth-gates with ?next
    // and inserts when the user signs in. No slug? fall back to handle
    // checker so they can pick one.
    window.location.href = slug ? `/claim/${encodeURIComponent(slug)}` : "/tools/portfolio-handle-checker";
  }

  const best = suggestions?.[0]?.slug;

  return (
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <h1>LinkedIn URL Customizer</h1>
        <p>
          Your default LinkedIn URL is a mess of numbers. Type your name and get
          clean, professional <strong>linkedin.com/in/you</strong> options you can set in a minute.
        </p>
      </header>

      {/* INPUT — one required field (name) + one optional (keyword) */}
      <section className={styles.card}>
        <form onSubmit={(e) => { e.preventDefault(); run(name, keyword); }}>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">Your name</label>
              <input
                id="name" className={styles.input}
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Jordan Rivera" autoComplete="name"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="kw">Role or specialty <span className={styles.opt}>(optional)</span></label>
              <input
                id="kw" className={styles.input}
                value={keyword} onChange={(e) => setKeyword(e.target.value)}
                placeholder="UX designer, data engineer…"
              />
            </div>
          </div>
          <div className={styles.row}>
            <button type="submit" className={`${styles.btn} ${styles.primary}`}>Customize my URL →</button>
            <button
              type="button" className={`${styles.btn} ${styles.ghost}`}
              onClick={() => { setName(SAMPLE.name); setKeyword(SAMPLE.keyword); run(SAMPLE.name, SAMPLE.keyword); }}
            >
              Try a sample
            </button>
          </div>
        </form>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>

      {/* RESULT — ranked slug suggestions */}
      {suggestions && (
        <section className={styles.card} id="result">
          {suggestions.length === 0 ? (
            <p className={styles.empty}>We couldn&apos;t build a URL from that — try your name in plain letters.</p>
          ) : (
            <>
              <div className={styles.resultHead}>
                <h2 className={styles.resultTitle}>Your custom URL options</h2>
                <span className={styles.resultSub}>Tap to copy · {suggestions.length} ideas</span>
              </div>

              <ul className={styles.list}>
                {suggestions.map((s, i) => (
                  <li key={s.slug} className={`${styles.item} ${i === 0 ? styles.itemBest : ""}`}>
                    <div className={styles.itemMain}>
                      <div className={styles.urlLine}>
                        <span className={styles.urlBase}>linkedin.com/in/</span>
                        <span className={styles.urlSlug}>{s.slug}</span>
                        {i === 0 && <span className={styles.bestTag}>Recommended</span>}
                      </div>
                      <p className={styles.itemNote}><span className={styles.itemLabel}>{s.label}.</span> {s.note}</p>
                    </div>
                    <button
                      type="button"
                      className={`${styles.copyBtn} ${copied === s.slug ? styles.copied : ""}`}
                      onClick={() => copy(s.slug)}
                      aria-label={copied === s.slug ? `Copied linkedin.com/in/${s.slug}` : `Copy linkedin.com/in/${s.slug}`}
                    >
                      {copied === s.slug ? "Copied ✓" : "Copy"}
                    </button>
                  </li>
                ))}
              </ul>

              <div className={styles.actions}>
                <button
                  className={`${styles.btn} ${styles.accent} ${styles.btnLg}`}
                  onClick={() => goClaim("result_primary", best)}
                >
                  Claim {best ? `viberesume.in/${best}` : "your own URL"} →
                </button>
              </div>

              <NextSteps from="linkedin-url-customizer" />
              <div className={styles.cta}>
                <p>Want this as a <strong>real personal site</strong>, not just a LinkedIn slug? Claim your {best ? <code>{vibeUrl(best).replace("https://", "")}</code> : "own URL"} on Vibe Resume.</p>
                <button className={`${styles.btn} ${styles.primary}`} onClick={() => goClaim("sticky_result", best)}>
                  Claim on Vibe Resume
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
