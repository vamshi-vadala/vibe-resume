"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CopyLinkButton from "./CopyLinkButton";

const PUBLISH_STASH_KEY = "vr.publish.pending";

/** The signed-in journey, made visible: Generate → Claim → Publish → Share.
 *  Steps 1–3 are computed from server state (plus the client-side stash for
 *  "generated"); Share renders as real actions against the user's live URL.
 *  This is the "where am I, what's next" answer for a returning user. */
export default function JourneyStrip({
  generated,
  claimed,
  publishedSlug,
  personName,
  needsPhoto,
}: {
  generated: boolean;       // any handle already has site data
  claimed: boolean;         // at least one handle reserved
  publishedSlug: string;    // first live slug, or "" if none
  personName: string;       // name on the live site (for LinkedIn prefill)
  needsPhoto: boolean;      // live resume site has no photo
}) {
  // The stash also counts as "generated" — it's a website waiting to publish.
  const [hasStash, setHasStash] = useState(false);
  useEffect(() => {
    try { setHasStash(!!sessionStorage.getItem(PUBLISH_STASH_KEY)); } catch {}
  }, []);

  const published = !!publishedSlug;
  const steps = [
    {
      label: "Generate",
      done: generated || hasStash,
      href: "/tools/pdf-resume-to-website",
      hint: "Turn your resume or GitHub into a website",
    },
    {
      label: "Claim",
      done: claimed,
      href: claimed ? "/account" : "/account/publish",
      hint: "Reserve viberesume.in/your-name",
    },
    {
      label: "Publish",
      done: published,
      href: "/account/publish",
      hint: "Put it live at your handle",
    },
    {
      label: "Share",
      done: false, // sharing is never "done" — it's the payoff loop
      href: "",
      hint: "Get it in front of people",
    },
  ];
  const nextIdx = steps.findIndex((s) => !s.done);
  const liveUrl = published ? `https://viberesume.in/${publishedSlug}` : "";

  return (
    <section
      aria-label="Your journey"
      style={{
        marginBottom: 24, padding: "16px 20px", borderRadius: 12,
        border: "1px solid var(--line)", background: "var(--panel)",
      }}
    >
      <ol style={{ listStyle: "none", display: "flex", gap: 8, padding: 0, margin: 0, flexWrap: "wrap" }}>
        {steps.map((s, i) => {
          const isNext = i === nextIdx;
          const inner = (
            <>
              <span
                aria-hidden
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 22, height: 22, borderRadius: 999, fontSize: 12, fontWeight: 800,
                  background: s.done ? "var(--accent2)" : isNext ? "var(--accent)" : "var(--panel2)",
                  color: s.done ? "var(--on-accent2)" : isNext ? "var(--on-accent)" : "var(--muted)",
                  border: s.done || isNext ? "0" : "1px solid var(--line)",
                  flex: "0 0 auto",
                }}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <span style={{ fontWeight: isNext ? 700 : 600, fontSize: 14, color: s.done || isNext ? "var(--text)" : "var(--muted)" }}>
                {s.label}
              </span>
            </>
          );
          return (
            <li key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 auto", minWidth: 0 }}>
              {s.href && !s.done ? (
                <Link
                  href={s.href}
                  title={s.hint}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "inherit" }}
                >
                  {inner}
                </Link>
              ) : (
                <span title={s.hint} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {inner}
                </span>
              )}
              {i < steps.length - 1 && (
                <span aria-hidden style={{ flex: "1 1 12px", height: 1, background: "var(--line)", minWidth: 12 }} />
              )}
            </li>
          );
        })}
      </ol>

      {/* The next-step line: one sentence + the action that matters now. */}
      <div style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", fontSize: 14 }}>
        {!published ? (
          <>
            <span style={{ color: "var(--muted)" }}>
              {nextIdx === 0 && "Start by generating a website from your resume — under a minute, free."}
              {nextIdx === 1 && "Next: claim your viberesume.in handle so your site has a home."}
              {nextIdx === 2 && (hasStash
                ? "Your website is generated and waiting — publish it now."
                : "Next: publish a website to your handle.")}
            </span>
            <Link
              href={nextIdx === 0 ? "/tools/pdf-resume-to-website" : "/account/publish"}
              style={{ color: "var(--accent)", fontWeight: 700 }}
            >
              {nextIdx === 0 ? "Generate a website →" : nextIdx === 1 ? "Claim a handle →" : "Publish it →"}
            </Link>
          </>
        ) : (
          <>
            <span style={{ color: "var(--muted)" }}>Your site is live — put it to work:</span>
            <CopyLinkButton url={liveUrl} />
            <Link href={`/tools/resume-qr-code-generator?url=${encodeURIComponent(liveUrl)}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
              QR for your resume →
            </Link>
            {personName && (
              <Link href={`/tools/linkedin-url-customizer?name=${encodeURIComponent(personName)}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
                Match your LinkedIn URL →
              </Link>
            )}
            {needsPhoto && (
              <Link href={`/account/${publishedSlug}/settings`} style={{ color: "var(--accent)", fontWeight: 600 }}>
                Add a photo →
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}
