"use client";

import { useState } from "react";

/** Copy-to-clipboard for a live profile URL. Copied state is mirrored into
 *  the aria-label (not only the visible text) per the project a11y rule. */
export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — the URL is visible to select manually */ }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Link copied" : `Copy link ${url}`}
      style={{
        padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
        background: copied ? "var(--accent2)" : "transparent",
        color: copied ? "var(--on-accent2)" : "var(--accent)",
        border: "1px solid " + (copied ? "var(--accent2)" : "var(--line)"),
        cursor: "pointer",
      }}
    >
      {copied ? "✓ Copied" : "Copy link"}
    </button>
  );
}
