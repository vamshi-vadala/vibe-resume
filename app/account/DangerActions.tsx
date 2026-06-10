"use client";

import { useState } from "react";

// Owner-only destructive actions for /account. Both confirm before acting and
// hard-navigate afterwards so the server component re-reads fresh state.

export function ReleaseHandleButton({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false);

  async function release() {
    const ok = window.confirm(
      `Release viberesume.in/${slug}?\n\nThis permanently deletes the page and its data, and anyone will be able to claim the handle. This can't be undone.`
    );
    if (!ok) return;
    setBusy(true);
    const res = await fetch(`/api/slugs/${slug}?release=1`, { method: "DELETE" });
    if (res.ok) window.location.href = `/account?released=${slug}`;
    else {
      setBusy(false);
      window.alert("Couldn't release the handle — try again.");
    }
  }

  return (
    <button
      type="button"
      onClick={release}
      disabled={busy}
      style={{
        background: "none", border: "none", padding: 0, cursor: "pointer",
        color: "var(--muted)", fontSize: 13, textDecoration: "underline",
      }}
    >
      {busy ? "Releasing…" : "Release handle"}
    </button>
  );
}

export function DeleteAccountButton() {
  const [busy, setBusy] = useState(false);

  async function purge() {
    const ok = window.confirm(
      "Delete your account?\n\nThis permanently deletes every handle you've reserved, every published page, and your sign-in. This can't be undone."
    );
    if (!ok) return;
    setBusy(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) window.location.href = "/";
    else {
      setBusy(false);
      window.alert("Couldn't delete the account — try again.");
    }
  }

  return (
    <button
      type="button"
      onClick={purge}
      disabled={busy}
      style={{
        padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 14,
        background: "transparent", color: "var(--danger, #e5484d)",
        border: "1px solid var(--danger, #e5484d)", fontWeight: 600,
      }}
    >
      {busy ? "Deleting…" : "Delete account & data"}
    </button>
  );
}
