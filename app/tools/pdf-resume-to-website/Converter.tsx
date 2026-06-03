"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { parseResume, SAMPLE_RESUME_TEXT, type ResumeData } from "@/lib/resume";
import styles from "./converter.module.css";

const TOOL_SLUG = "pdf-resume-to-website";
const SIGNUP = `/signup?utm_source=tool&utm_campaign=${TOOL_SLUG}`;

type DataLayer = Array<Record<string, unknown>>;
function track(event: string, props: Record<string, unknown> = {}) {
  const payload = { tool_slug: TOOL_SLUG, ...props };
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.capture(event, payload);
  const w = window as unknown as { dataLayer?: DataLayer };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...payload });
}

/** Extract a resume's text layer in-browser. Groups text items into lines by y-position. */
async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const buf = await file.arrayBuffer();
  const task = pdfjs.getDocument({ data: buf });
  const doc = await task.promise;
  const out: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Bucket items by rounded y so words on the same visual line stay together.
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const item of content.items) {
      if (!("str" in item) || !item.str) continue;
      const tr = item.transform as number[];
      const y = Math.round(tr[5]);
      const x = tr[4];
      (rows.get(y) ?? rows.set(y, []).get(y)!).push({ x, s: item.str });
    }
    // y descends down the page; sort top-to-bottom, then left-to-right within a line.
    for (const y of [...rows.keys()].sort((a, b) => b - a)) {
      const line = rows.get(y)!.sort((a, b) => a.x - b.x).map((i) => i.s).join(" ");
      out.push(line.replace(/\s{2,}/g, " ").trim());
    }
    out.push(""); // page break
  }
  await task.destroy();
  return out.join("\n");
}

export default function Converter() {
  const [data, setData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function show(d: ResumeData) {
    setData(d);
    setError("");
    requestAnimationFrame(() =>
      document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = ""; // allow re-uploading the same file
    setError("");
    setLoading(true);
    track("tool_started");
    try {
      const text = await extractPdfText(f);
      const parsed = parseResume(text);
      if (parsed.empty) {
        setData(null);
        setError(
          "We couldn't find selectable text in this PDF. If it was scanned or saved as an image, re-export it as a normal text PDF from Word, Google Docs or your resume builder and try again."
        );
        track("tool_completed", { ok: false, reason: "no_text" });
      } else {
        show(parsed);
        track("tool_completed", { ok: true, sections: parsed.sections.length });
      }
    } catch {
      setData(null);
      setError("Something went wrong reading that PDF. Please make sure it's a valid, unencrypted PDF and try again.");
      track("tool_completed", { ok: false, reason: "error" });
    } finally {
      setLoading(false);
    }
  }

  function sample() {
    track("tool_started", { source: "sample" });
    const parsed = parseResume(SAMPLE_RESUME_TEXT);
    show(parsed);
    track("tool_completed", { ok: true, source: "sample", sections: parsed.sections.length });
  }

  function goSignup(placement: string) {
    track("cta_clicked", { placement });
    window.location.href = SIGNUP;
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <h1>PDF Resume to Website Converter</h1>
        <p>
          Upload your PDF resume and watch it become a clean, shareable <strong>personal website</strong> —
          instantly, in your browser. Nothing is uploaded to a server.
        </p>
      </header>

      {/* INPUT — one required action */}
      <section className={styles.card}>
        <label className={styles.label} htmlFor="pdf">Upload your resume (PDF)</label>
        <div className={styles.row}>
          <input
            id="pdf" type="file" accept="application/pdf"
            className={styles.file} onChange={onFile} disabled={loading}
          />
          <button className={`${styles.btn} ${styles.ghost}`} onClick={sample} disabled={loading}>
            Try a sample
          </button>
          {loading && <span className={styles.loading}>Reading your PDF…</span>}
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>

      {/* RESULT — the website preview */}
      {data && (
        <section className={styles.card} id="result">
          <div className={styles.resultHead}>
            <h2 className={styles.resultTitle}>Your resume as a website</h2>
            <span className={styles.resultSub}>Live preview · publish to get your own URL</span>
          </div>

          {/* a faux browser frame around the generated site */}
          <div className={styles.browser}>
            <div className={styles.browserBar}>
              <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
              <span className={styles.url}>vibe.resume/{slug(data.name)}</span>
            </div>
            <ResumeSite data={data} />
          </div>

          {/* evident primary action */}
          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.accent} ${styles.btnLg}`} onClick={() => goSignup("result_actions")}>
              Publish this website →
            </button>
          </div>

          {/* sticky CTA — only rendered after a result exists */}
          <div className={styles.cta}>
            <p>Your website is ready — publish it with your own URL in 1 click.</p>
            <button className={`${styles.btn} ${styles.primary}`} onClick={() => goSignup("sticky_result")}>
              Publish on Vibe Resume
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

/** The generated personal website — a single polished, responsive template. */
function ResumeSite({ data }: { data: ResumeData }) {
  return (
    <article className={styles.site}>
      <header className={styles.siteHero}>
        <div className={styles.avatar} aria-hidden>{initials(data.name)}</div>
        <div>
          <h1 className={styles.siteName}>{data.name}</h1>
          {data.title && <p className={styles.siteRole}>{data.title}</p>}
          {data.contactLines.length > 0 && (
            <p className={styles.siteContact}>{data.contactLines.join("  ·  ")}</p>
          )}
        </div>
      </header>

      {data.summary && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>About</h2>
          <p className={styles.siteSummary}>{data.summary}</p>
        </section>
      )}

      {data.skills.length > 0 && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>Skills</h2>
          <div className={styles.chips}>
            {data.skills.map((s, i) => <span key={i} className={styles.chip}>{s}</span>)}
          </div>
        </section>
      )}

      {data.sections.map((sec, i) => (
        <section key={i} className={styles.siteSection}>
          <h2 className={styles.siteH2}>{sec.heading}</h2>
          <ul className={styles.siteList}>
            {sec.items.map((it, n) => <li key={n}>{it}</li>)}
          </ul>
        </section>
      ))}
    </article>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·";
}
function slug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "you";
}
