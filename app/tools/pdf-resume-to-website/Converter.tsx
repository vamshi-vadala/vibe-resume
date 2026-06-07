"use client";

import { useState, useEffect } from "react";
import posthog from "posthog-js";
import { parseResume, linesFromItems, SAMPLE_RESUME_TEXT, type ResumeData, type PositionedItem, type TextLine } from "@/lib/resume";
import { THEMES, getTheme, themeStyle } from "@/lib/themes.ts";
import NextSteps from "../../NextSteps";
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

interface PdfExtract { lines: TextLine[]; photoUrl: string }

/** Extract a resume's text layer in-browser as column-aware, font-size-tagged lines.
 *  Also attempts to pull the candidate's headshot from the first page. */
async function extractPdf(file: File): Promise<PdfExtract> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const buf = await file.arrayBuffer();
  const task = pdfjs.getDocument({ data: buf });
  const doc = await task.promise;
  const lines: TextLine[] = [];
  let photoUrl = "";

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const pageWidth = page.getViewport({ scale: 1 }).width;
    const content = await page.getTextContent();
    const items: PositionedItem[] = [];
    for (const item of content.items) {
      if (!("str" in item) || !item.str) continue;
      const tr = item.transform as number[];
      items.push({
        str: item.str,
        x: tr[4],
        y: tr[5],
        w: item.width ?? 0,
        size: Math.hypot(tr[1], tr[3]) || Math.abs(tr[3]),
      });
    }
    lines.push(...linesFromItems(items, pageWidth));
    // Attempt headshot extraction from the first page only.
    if (p === 1 && !photoUrl) photoUrl = await extractHeadshot(page as unknown as PdfPage);
  }
  await task.destroy();
  return { lines, photoUrl };
}

// Minimal shape of a pdfjs PDFPageProxy we actually use.
interface PdfPage {
  getOperatorList(): Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
  objs: { get(name: string, cb: (v: unknown) => void): void };
  commonObjs: { get(name: string, cb: (v: unknown) => void): void };
}

/** Pull the largest portrait/square image from a PDF page as a data URL.
 *  Returns "" when no suitable image is found or anything fails. */
async function extractHeadshot(page: PdfPage): Promise<string> {
  try {
    const pdfjs = await import("pdfjs-dist");
    const ops = await page.getOperatorList();
    type ImgCandidate = { url: string; area: number };
    const candidates: ImgCandidate[] = [];

    for (let i = 0; i < ops.fnArray.length; i++) {
      if (ops.fnArray[i] !== pdfjs.OPS.paintImageXObject) continue;
      const name = ops.argsArray[i][0] as string;

      // Images may live in page.objs or page.commonObjs depending on the PDF.
      type ImgObj = { width: number; height: number; data: Uint8ClampedArray; kind: number };
      const getObj = (store: { get(n: string, cb: (v: unknown) => void): void }, n: string) =>
        new Promise<unknown>((res, rej) => { try { store.get(n, res); } catch { rej(null); } });

      let imgObj: ImgObj | null = null;
      try { imgObj = await getObj(page.objs, name) as ImgObj; }
      catch { try { imgObj = await getObj(page.commonObjs, name) as ImgObj; } catch { continue; } }
      if (!imgObj?.width || !imgObj?.height || !imgObj.data) continue;

      const { width, height, data, kind } = imgObj;
      if (width < 40 || height < 40) continue;       // ignore tiny icons
      const ratio = width / height;
      if (ratio < 0.35 || ratio > 2.2) continue;     // skip banners / narrow strips

      // Convert pdfjs image data (RGB_24BPP=2 or RGBA_32BPP=3) to canvas.
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      const imgData = ctx.createImageData(width, height);
      if (kind === 3) {
        // RGBA — copy directly.
        imgData.data.set(data.slice(0, width * height * 4));
      } else if (kind === 2) {
        // RGB — expand to RGBA.
        for (let px = 0; px < width * height; px++) {
          imgData.data[px * 4]     = data[px * 3];
          imgData.data[px * 4 + 1] = data[px * 3 + 1];
          imgData.data[px * 4 + 2] = data[px * 3 + 2];
          imgData.data[px * 4 + 3] = 255;
        }
      } else continue; // skip grayscale/bitmask — unlikely to be a photo
      ctx.putImageData(imgData, 0, 0);
      candidates.push({ url: canvas.toDataURL("image/jpeg", 0.82), area: width * height });
    }

    // Largest qualifying image is the most likely headshot.
    candidates.sort((a, b) => b.area - a.area);
    return candidates[0]?.url ?? "";
  } catch { return ""; }
}

export default function Converter() {
  const [data, setData] = useState<ResumeData | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [themeId, setThemeId] = useState("");
  const [dragging, setDragging] = useState(false);

  // The Theme Picker tool hands off a look via ?theme=<id>; apply it if valid.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("theme");
    if (t && THEMES.some((x) => x.id === t)) setThemeId(t);
  }, []);

  function pickTheme(id: string) {
    setThemeId(id);
    track("result_interacted", { action: "theme", theme: id || "default" });
  }

  function show(d: ResumeData, photo = "") {
    setData(d);
    setPhotoUrl(photo);
    setError("");
    requestAnimationFrame(() =>
      document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }

  async function processFile(f: File) {
    setError("");
    setLoading(true);
    track("tool_started");
    try {
      const { lines, photoUrl: photo } = await extractPdf(f);
      const parsed = parseResume(lines);
      if (parsed.empty) {
        setData(null);
        setError(
          "We couldn't find selectable text in this PDF. If it was scanned or saved as an image, re-export it as a normal text PDF from Word, Google Docs or your resume builder and try again."
        );
        track("tool_completed", { ok: false, reason: "no_text" });
      } else {
        show(parsed, photo);
        track("tool_completed", { ok: true, sections: parsed.sections.length, hasPhoto: !!photo });
      }
    } catch {
      setData(null);
      setError("Something went wrong reading that PDF. Please make sure it's a valid, unencrypted PDF and try again.");
      track("tool_completed", { ok: false, reason: "error" });
    } finally {
      setLoading(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = ""; // allow re-uploading the same file
    processFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") { setError("That's not a PDF — drop a .pdf file."); return; }
    processFile(f);
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

      {/* INPUT — one unmistakable action: drop or browse for a PDF */}
      <section className={styles.card}>
        <label
          className={styles.dropzone}
          htmlFor="pdf"
          data-dragging={dragging || undefined}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <svg className={styles.dropIcon} width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 15V4M8 8l4-4 4 4" />
            <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
          </svg>
          <span className={styles.dropTitle}>{loading ? "Reading your PDF…" : "Drop your PDF resume here"}</span>
          <span className={styles.dropHint}>or <strong>click to browse</strong> — your file never leaves your browser</span>
          <input id="pdf" type="file" accept="application/pdf" className={styles.fileHidden} onChange={onFile} disabled={loading} />
        </label>

        <div className={styles.sampleRow}>
          <span className={styles.sampleText}>No PDF handy?</span>
          <button className={`${styles.btn} ${styles.ghost}`} onClick={sample} disabled={loading}>Try a sample</button>
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

          {/* theme switcher — pre-selected from the Theme Picker's ?theme= handoff */}
          <div className={styles.themeBar} role="group" aria-label="Preview theme">
            <span className={styles.themeBarLabel}>Theme</span>
            <button type="button" className={`${styles.themeChip} ${!themeId ? styles.themeChipOn : ""}`} aria-pressed={!themeId} onClick={() => pickTheme("")}>Default</button>
            {THEMES.map((t) => (
              <button key={t.id} type="button" className={`${styles.themeChip} ${themeId === t.id ? styles.themeChipOn : ""}`} aria-pressed={themeId === t.id} onClick={() => pickTheme(t.id)}>{t.name}</button>
            ))}
          </div>

          {/* a faux browser frame around the generated site */}
          <div className={styles.browser}>
            <div className={styles.browserBar}>
              <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
              <span className={styles.url}>viberesume.in/{slug(data.name)}</span>
            </div>
            <ResumeSite data={data} photoUrl={photoUrl} themeId={themeId} />
          </div>

          {/* evident primary action */}
          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.accent} ${styles.btnLg}`} onClick={() => goSignup("result_actions")}>
              Publish this website →
            </button>
          </div>

          {/* sticky CTA — only rendered after a result exists */}
          <NextSteps from="pdf-resume-to-website" />
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
function ResumeSite({ data, photoUrl, themeId }: { data: ResumeData; photoUrl: string; themeId: string }) {
  const style = themeId ? (themeStyle(getTheme(themeId)) as React.CSSProperties) : undefined;
  return (
    <article className={styles.site} style={style}>
      <header className={styles.siteHero}>
        {photoUrl
          ? <img src={photoUrl} alt={data.name} className={styles.avatarPhoto} />
          : <div className={styles.avatar} aria-hidden>{initials(data.name)}</div>
        }
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
          {sec.entries ? (
            sec.entries.map((e, n) => (
              <div key={n} className={styles.siteEntry}>
                <div className={styles.siteEntryHead}>
                  {e.header && <span className={styles.siteEntryTitle}>{e.header}</span>}
                  {e.meta && <span className={styles.siteEntryMeta}>{e.meta}</span>}
                </div>
                {e.bullets.length > 0 && (
                  <ul className={styles.siteList}>
                    {e.bullets.map((b, k) => <li key={k}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))
          ) : (
            <ul className={styles.siteList}>
              {sec.items.map((it, n) => <li key={n}>{it}</li>)}
            </ul>
          )}
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
