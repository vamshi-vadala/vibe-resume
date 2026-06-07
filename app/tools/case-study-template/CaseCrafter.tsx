"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { generateCaseStudy, toMarkdown, isValidTitle, type CaseStudy } from "@/lib/casestudy.ts";
import NextSteps from "../../NextSteps";
import styles from "./casecrafter.module.css";

const TOOL_SLUG = "case-study-template";
const SIGNUP = `/signup?utm_source=tool&utm_campaign=${TOOL_SLUG}`;

const SAMPLE = {
  title: "Checkout Redesign",
  client: "Acme Storefront",
  role: "Product Designer",
  timeline: "8 weeks · 2025",
  tools: "Figma, React, Maze",
  challenge: "Acme was losing a third of buyers at checkout. The flow had five steps, no guest option, and errors that only showed after submitting.",
  process: "Audited the funnel and watched 12 session recordings\nCut checkout from five steps to two\nAdded guest checkout and inline validation\nA/B tested the new flow against the old",
  outcome: "Cart abandonment dropped 32% and completed orders rose 21% in the first six weeks. Support tickets about checkout errors fell by half.",
};
const EMPTY = { title: "", client: "", role: "", timeline: "", tools: "", challenge: "", process: "", outcome: "" };

type Fields = typeof EMPTY;

type DataLayer = Array<Record<string, unknown>>;
function track(event: string, props: Record<string, unknown> = {}) {
  const payload = { tool_slug: TOOL_SLUG, ...props };
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.capture(event, payload);
  const w = window as unknown as { dataLayer?: DataLayer };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...payload });
}

export default function CaseCrafter() {
  const [f, setF] = useState<Fields>(EMPTY);
  const [study, setStudy] = useState<CaseStudy | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  function build(fields: Fields) {
    if (!isValidTitle(fields.title)) {
      setError("Give your project a title to get started.");
      setStudy(null);
      return;
    }
    setError("");
    track("tool_started");
    const cs = generateCaseStudy(fields);
    setStudy(cs);
    track("tool_completed", { metrics: cs?.metrics.length ?? 0 });
    requestAnimationFrame(() =>
      document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }

  async function copyText(id: string, text: string) {
    try { await navigator.clipboard?.writeText(text); } catch { /* still flip UI */ }
    setCopied(id);
    track("result_interacted", { action: "copy", part: id });
    window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 1600);
  }

  function goSignup(placement: string) {
    track("cta_clicked", { placement });
    window.location.href = SIGNUP;
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <h1>Case Study Template for Designers</h1>
        <p>
          The blank page is the hardest part of a portfolio case study. Fill in the
          essentials and get a structured, copy-paste write-up — free, no signup.
        </p>
      </header>

      {/* INPUT */}
      <section className={styles.card}>
        <form onSubmit={(e) => { e.preventDefault(); build(f); }}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="title">Project title</label>
            <input id="title" className={styles.input} value={f.title} onChange={set("title")} placeholder="Checkout Redesign" />
          </div>

          <div className={styles.grid3}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="client">Client <span className={styles.opt}>(optional)</span></label>
              <input id="client" className={styles.input} value={f.client} onChange={set("client")} placeholder="Acme" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="role">Your role <span className={styles.opt}>(optional)</span></label>
              <input id="role" className={styles.input} value={f.role} onChange={set("role")} placeholder="Product Designer" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="timeline">Timeline <span className={styles.opt}>(optional)</span></label>
              <input id="timeline" className={styles.input} value={f.timeline} onChange={set("timeline")} placeholder="8 weeks · 2025" />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="tools">Tools &amp; skills <span className={styles.opt}>(optional, comma-separated)</span></label>
            <input id="tools" className={styles.input} value={f.tools} onChange={set("tools")} placeholder="Figma, React, user research" />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="challenge">The challenge <span className={styles.opt}>(optional)</span></label>
            <textarea id="challenge" className={styles.textarea} value={f.challenge} onChange={set("challenge")} rows={2} placeholder="What problem were you solving, and why did it matter?" />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="process">Your approach <span className={styles.opt}>(optional, one step per line)</span></label>
            <textarea id="process" className={styles.textarea} value={f.process} onChange={set("process")} rows={3} placeholder={"Audited the funnel\nPrototyped a 2-step flow\nA/B tested it"} />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="outcome">The outcome <span className={styles.opt}>(optional — include numbers!)</span></label>
            <textarea id="outcome" className={styles.textarea} value={f.outcome} onChange={set("outcome")} rows={2} placeholder="Abandonment dropped 32% in six weeks." />
          </div>

          <div className={styles.row}>
            <button type="submit" className={`${styles.btn} ${styles.primary}`}>Build my case study →</button>
            <button type="button" className={`${styles.btn} ${styles.ghost}`} onClick={() => { setF(SAMPLE); build(SAMPLE); }}>Try a sample</button>
            <button type="button" className={`${styles.btn} ${styles.ghost}`} onClick={() => { setF(EMPTY); setStudy(null); setError(""); }}>Clear</button>
          </div>
        </form>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>

      {/* RESULT */}
      {study && (
        <section className={styles.card} id="result">
          <div className={styles.resultHead}>
            <h2 className={styles.resultTitle}>Your case study</h2>
            <button
              type="button"
              className={`${styles.copyBtn} ${copied === "md" ? styles.copied : ""}`}
              onClick={() => copyText("md", toMarkdown(study))}
              aria-label={copied === "md" ? "Copied case study as Markdown" : "Copy case study as Markdown"}
            >
              {copied === "md" ? "Copied ✓" : "Copy as Markdown"}
            </button>
          </div>

          <article className={styles.study}>
            <header className={styles.studyHero}>
              <h3 className={styles.studyTitle}>{study.title}</h3>
              {study.meta.length > 0 && (
                <dl className={styles.meta}>
                  {study.meta.map((m) => (
                    <div key={m.label} className={styles.metaItem}>
                      <dt>{m.label}</dt><dd>{m.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {study.metrics.length > 0 && (
                <div className={styles.metrics}>
                  {study.metrics.map((m) => <span key={m} className={styles.metric}>{m}</span>)}
                </div>
              )}
            </header>

            {study.sections.map((s) => (
              <section key={s.id} className={styles.studySection}>
                <div className={styles.sectionHead}>
                  <h4 className={styles.sectionLabel}>{s.label}</h4>
                  {!s.placeholder && (
                    <button
                      type="button"
                      className={`${styles.copyMini} ${copied === s.id ? styles.copied : ""}`}
                      onClick={() => copyText(s.id, s.steps?.length ? s.steps.map((x) => `• ${x}`).join("\n") : s.text)}
                      aria-label={copied === s.id ? `Copied ${s.label}` : `Copy ${s.label}`}
                    >
                      {copied === s.id ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
                {s.id === "approach" && s.steps && s.steps.length > 0 ? (
                  <ol className={styles.steps}>{s.steps.map((st, i) => <li key={i}>{st}</li>)}</ol>
                ) : (
                  <p className={s.placeholder ? styles.prompt : styles.sectionText}>{s.text}</p>
                )}
              </section>
            ))}
          </article>

          <button type="button" className={styles.aiBar} onClick={() => goSignup("ai_rewrite")}>
            <span className={styles.aiSpark} aria-hidden>✨</span>
            <span className={styles.aiText}><strong>Polish it with AI</strong> — tighten the writing and tailor it to a target client.</span>
            <span className={styles.aiGo} aria-hidden>→</span>
          </button>

          <NextSteps from="case-study-template" />
          <div className={styles.cta}>
            <p>Publish this as a <strong>portfolio case-study page</strong> with your own URL on Vibe Resume.</p>
            <button className={`${styles.btn} ${styles.accent}`} onClick={() => goSignup("sticky_result")}>Publish on Vibe Resume</button>
          </div>
        </section>
      )}
    </div>
  );
}
