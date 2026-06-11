"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const PUBLISH_STASH_KEY = "vr.publish.pending";

/** Shown on /account when a generated-but-unpublished website is still
 *  stashed in this browser (user got sidetracked mid-funnel, e.g. via the
 *  claim path). One click resumes the publish instead of dead-ending. */
export default function PendingPublishNudge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try { setShow(!!sessionStorage.getItem(PUBLISH_STASH_KEY)); }
    catch { /* sessionStorage unavailable — nothing to nudge about */ }
  }, []);

  if (!show) return null;
  return (
    <div
      role="status"
      style={{
        marginBottom: 20, padding: "12px 16px", borderRadius: 10,
        background: "var(--panel)", border: "1px solid var(--accent)", color: "var(--text)",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}
    >
      <span>Your generated website is ready and waiting in this browser.</span>
      <Link href="/account/publish" style={{ color: "var(--accent)", fontWeight: 700, whiteSpace: "nowrap" }}>
        Finish publishing →
      </Link>
    </div>
  );
}
