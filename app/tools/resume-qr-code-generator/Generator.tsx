"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { normalizeUrl, isValidQrInput, qrFilename } from "@/lib/qr.ts";
import NextSteps from "../../NextSteps";
import styles from "./generator.module.css";

const TOOL_SLUG = "resume-qr-code-generator";
const SIGNUP = `/signup?utm_source=tool&utm_campaign=${TOOL_SLUG}`;
const SAMPLE = "linkedin.com/in/jordan-rivera";

const COLORS = [
  { id: "ink", label: "Ink", dark: "#0b0d10" },
  { id: "blue", label: "Blue", dark: "#1d4ed8" },
  { id: "emerald", label: "Emerald", dark: "#047857" },
  { id: "violet", label: "Violet", dark: "#7c3aed" },
];

type DataLayer = Array<Record<string, unknown>>;
function track(event: string, props: Record<string, unknown> = {}) {
  const payload = { tool_slug: TOOL_SLUG, ...props };
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.capture(event, payload);
  const w = window as unknown as { dataLayer?: DataLayer };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...payload });
}

/** Render the QR as an SVG string (crisp, scalable, themeable). */
async function renderSvg(text: string, dark: string): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toString(text, {
    type: "svg", errorCorrectionLevel: "M", margin: 1,
    color: { dark, light: "#ffffff" },
  });
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

export default function Generator() {
  const [input, setInput] = useState("");
  const [color, setColor] = useState(COLORS[0].dark);
  const [encoded, setEncoded] = useState<string | null>(null);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(raw: string, dark: string, started = true) {
    if (!isValidQrInput(raw)) {
      setError("Enter a link or text to turn into a QR code.");
      setEncoded(null); setSvg("");
      return;
    }
    setError("");
    setBusy(true);
    const text = normalizeUrl(raw);
    if (started) track("tool_started");
    try {
      const markup = await renderSvg(text, dark);
      setEncoded(text);
      setSvg(markup);
      if (started) {
        track("tool_completed");
        requestAnimationFrame(() =>
          document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" })
        );
      }
    } catch {
      setError("That was too long to fit in a QR code — try a shorter link.");
      setEncoded(null); setSvg("");
    } finally {
      setBusy(false);
    }
  }

  function pickColor(dark: string) {
    setColor(dark);
    if (encoded) { run(input || SAMPLE, dark, false); track("result_interacted", { action: "color", color: dark }); }
  }

  async function downloadPng() {
    if (!encoded) return;
    const QRCode = (await import("qrcode")).default;
    const url = await QRCode.toDataURL(encoded, { width: 1024, margin: 2, errorCorrectionLevel: "M", color: { dark: color, light: "#ffffff" } });
    triggerDownload(url, qrFilename(input, "png"));
    track("result_interacted", { action: "download", format: "png" });
  }

  function downloadSvg() {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, qrFilename(input, "svg"));
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    track("result_interacted", { action: "download", format: "svg" });
  }

  function goSignup(placement: string) {
    track("cta_clicked", { placement });
    window.location.href = SIGNUP;
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <h1>Resume QR Code Generator</h1>
        <p>
          Turn your portfolio, LinkedIn or resume link into a clean <strong>QR code</strong> —
          put it on your CV, business card or slides. Free, no signup, downloads instantly.
        </p>
      </header>

      {/* INPUT */}
      <section className={styles.card}>
        <label className={styles.label} htmlFor="link">Your link</label>
        <form className={styles.row} onSubmit={(e) => { e.preventDefault(); run(input, color); }}>
          <input
            id="link" className={styles.input}
            value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="linkedin.com/in/yourname" autoCapitalize="none" autoCorrect="off" spellCheck={false}
            inputMode="url"
          />
          <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={busy}>
            {busy ? "Generating…" : "Generate QR →"}
          </button>
          <button
            type="button" className={`${styles.btn} ${styles.ghost}`} disabled={busy}
            onClick={() => { setInput(SAMPLE); run(SAMPLE, color); }}
          >
            Try a sample
          </button>
        </form>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>

      {/* RESULT */}
      {encoded && svg && (
        <section className={styles.card} id="result">
          <div className={styles.resultGrid}>
            <div className={styles.qrFrame} role="img" aria-label={`QR code linking to ${encoded}`} dangerouslySetInnerHTML={{ __html: svg }} />

            <div className={styles.resultSide}>
              <h2 className={styles.resultTitle}>Your QR code</h2>
              <p className={styles.encoded}>Points to <a href={encoded} target="_blank" rel="noopener noreferrer">{encoded}</a></p>

              <span className={styles.label} id="color-label">Color</span>
              <div className={styles.swatches} role="group" aria-labelledby="color-label">
                {COLORS.map((c) => (
                  <button
                    key={c.id} type="button"
                    className={`${styles.swatch} ${color === c.dark ? styles.swatchOn : ""}`}
                    style={{ background: c.dark }}
                    aria-label={`${c.label} QR color`} aria-pressed={color === c.dark}
                    title={c.label}
                    onClick={() => pickColor(c.dark)}
                  />
                ))}
              </div>

              <div className={styles.downloads}>
                <button className={`${styles.btn} ${styles.primary}`} onClick={downloadPng}>Download PNG</button>
                <button className={`${styles.btn} ${styles.ghost}`} onClick={downloadSvg}>Download SVG</button>
              </div>
              <p className={styles.tip}>PNG for documents &amp; slides · SVG for print at any size.</p>
            </div>
          </div>

          <NextSteps from="resume-qr-code-generator" />
          <div className={styles.cta}>
            <p>Make your QR point to <strong>one URL you own</strong> — claim your vibe.resume link so it never breaks.</p>
            <button className={`${styles.btn} ${styles.accent}`} onClick={() => goSignup("sticky_result")}>
              Claim on Vibe Resume
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
