"use client";

import { useState } from "react";
import posthog from "posthog-js";
import {
  generateAbout, isValidRole, TONES, type Tone, type AboutVariant,
} from "@/lib/aboutme.ts";
import NextSteps from "../../NextSteps";
import styles from "./generator.module.css";

const TOOL_SLUG = "portfolio-about-me-generator";
const SIGNUP = `/signup?utm_source=tool&utm_campaign=${TOOL_SLUG}`;
const SAMPLE = { name: "Jordan Rivera", role: "Product Designer", years: "6", skills: "design systems, UX research, branding" };

type DataLayer = Array<Record<string, unknown>>;
function track(event: string, props: Record<string, unknown> = {}) {
  const payload = { tool_slug: TOOL_SLUG, ...props };
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.capture(event, payload);
  const w = window as unknown as { dataLayer?: DataLayer };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...payload });
}

export default function Generator() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [years, setYears] = useState("");
  const [skills, setSkills] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [variants, setVariants] = useState<AboutVariant[] | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  function build(input: { name: string; role: string; years: string; skills: string; tone: Tone }, started = true) {
    if (!isValidRole(input.role)) {
      setError("Tell us your role, e.g. Product Designer.");
      setVariants(null);
      return;
    }
    setError("");
    if (started) track("tool_started");
    const result = generateAbout(input);
    setVariants(result);
    if (started) {
      track("tool_completed", { tone: input.tone, has_name: Boolean(input.name), has_skills: Boolean(input.skills.trim()) });
      requestAnimationFrame(() =>
        document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
  }

  function submit() {
    build({ name, role, years, skills, tone });
  }

  // Switching tone after results exist re-generates instantly — no re-submit.
  function pickTone(t: Tone) {
    setTone(t);
    if (variants) {
      build({ name, role, years, skills, tone: t }, false);
      track("result_interacted", { action: "tone", tone: t });
    }
  }

  async function copy(v: AboutVariant) {
    try { await navigator.clipboard?.writeText(v.text); } catch { /* clipboard blocked — still flip UI */ }
    setCopied(v.id);
    track("result_interacted", { action: "copy", variant: v.id });
    window.setTimeout(() => setCopied((c) => (c === v.id ? null : c)), 1600);
  }

  function goSignup(placement: string) {
    track("cta_clicked", { placement, tone });
    window.location.href = SIGNUP;
  }

  function loadSample() {
    setName(SAMPLE.name); setRole(SAMPLE.role); setYears(SAMPLE.years); setSkills(SAMPLE.skills);
    build({ ...SAMPLE, tone });
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <h1>Portfolio “About Me” Generator</h1>
        <p>
          Stuck on your bio? Drop in your <strong>role</strong> and a few skills and get
          polished, copy-paste “about me” lines in the tone you want — free, no signup.
        </p>
      </header>

      {/* INPUT */}
      <section className={styles.card}>
        <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="role">Your role</label>
            <input
              id="role" className={styles.input}
              value={role} onChange={(e) => setRole(e.target.value)}
              placeholder="Product Designer"
            />
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">Name <span className={styles.opt}>(optional)</span></label>
              <input
                id="name" className={styles.input}
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Jordan Rivera" autoComplete="name"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="years">Years of experience <span className={styles.opt}>(optional)</span></label>
              <input
                id="years" className={styles.input} inputMode="numeric"
                value={years} onChange={(e) => setYears(e.target.value)}
                placeholder="6"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="skills">Skills or focus areas <span className={styles.opt}>(optional, comma-separated)</span></label>
            <input
              id="skills" className={styles.input}
              value={skills} onChange={(e) => setSkills(e.target.value)}
              placeholder="design systems, UX research, branding"
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label} id="tone-label">Tone</span>
            <div className={styles.tones} role="group" aria-labelledby="tone-label">
              {TONES.map((t) => (
                <button
                  key={t.id} type="button"
                  className={`${styles.tone} ${tone === t.id ? styles.toneOn : ""}`}
                  aria-pressed={tone === t.id}
                  onClick={() => pickTone(t.id)}
                  title={t.hint}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.row}>
            <button type="submit" className={`${styles.btn} ${styles.primary}`}>Write my about me →</button>
            <button type="button" className={`${styles.btn} ${styles.ghost}`} onClick={loadSample}>Try a sample</button>
          </div>
        </form>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>

      {/* RESULT */}
      {variants && variants.length > 0 && (
        <section className={styles.card} id="result">
          <div className={styles.resultHead}>
            <h2 className={styles.resultTitle}>Your “about me”, {toneLabel(tone)} tone</h2>
            <span className={styles.resultSub}>Switch tone above to rewrite instantly</span>
          </div>

          <div className={styles.variants}>
            {variants.map((v) => (
              <article key={v.id} className={styles.variant}>
                <div className={styles.variantHead}>
                  <div>
                    <span className={styles.variantLabel}>{v.label}</span>
                    <span className={styles.variantUse}>{v.use}</span>
                  </div>
                  <button
                    type="button"
                    className={`${styles.copyBtn} ${copied === v.id ? styles.copied : ""}`}
                    onClick={() => copy(v)}
                    aria-label={copied === v.id ? `Copied the ${v.label}` : `Copy the ${v.label}`}
                  >
                    {copied === v.id ? "Copied ✓" : "Copy"}
                  </button>
                </div>
                <p className={styles.variantText}>{v.text}</p>
              </article>
            ))}
          </div>

          {/* gated "AI" upsell — matches the plan's premium-behind-signup strategy */}
          <button type="button" className={styles.aiBar} onClick={() => goSignup("ai_rewrite")}>
            <span className={styles.aiSpark} aria-hidden>✨</span>
            <span className={styles.aiText}>
              <strong>Make it sharper with AI</strong> — tailor your about me to a specific job or brand.
            </span>
            <span className={styles.aiGo} aria-hidden>→</span>
          </button>

          <NextSteps from="portfolio-about-me-generator" />
          <div className={styles.cta}>
            <p>Turn this into a real <strong>portfolio site</strong> with your own URL on Vibe Resume.</p>
            <button className={`${styles.btn} ${styles.accent}`} onClick={() => goSignup("sticky_result")}>
              Publish on Vibe Resume
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function toneLabel(t: Tone): string {
  return TONES.find((x) => x.id === t)?.label.toLowerCase() ?? t;
}
