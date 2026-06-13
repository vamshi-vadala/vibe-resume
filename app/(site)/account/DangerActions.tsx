"use client";

import { useState } from "react";

// Owner-only destructive actions for /account. Instead of window.confirm,
// each uses an inline two-step confirm: first click arms the button (label
// swaps to the consequence + a Cancel appears), second click executes. All
// hard-navigate afterwards so the server component re-reads fresh state.

const linkBtn: React.CSSProperties = {
  background: "none", border: "none", padding: 0, cursor: "pointer",
  fontSize: 13, textDecoration: "underline",
};

function useAction(run: () => Promise<Response>, onOk: () => void, failMsg: string) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function click() {
    if (!armed) { setArmed(true); return; }
    setBusy(true);
    setError("");
    const res = await run().catch(() => null);
    if (res?.ok) onOk();
    else {
      setBusy(false);
      setArmed(false);
      setError(failMsg);
    }
  }
  return { armed, busy, error, click, cancel: () => setArmed(false) };
}

export function UnpublishHandleButton({ slug }: { slug: string }) {
  const a = useAction(
    () => fetch(`/api/slugs/${slug}`, { method: "DELETE" }),
    () => { window.location.href = `/account?unpublished=${slug}`; },
    "Couldn’t unpublish — try again."
  );
  return (
    <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
      <button type="button" onClick={a.click} disabled={a.busy}
        style={{ ...linkBtn, color: a.armed ? "var(--text)" : "var(--muted)", fontWeight: a.armed ? 600 : 400 }}>
        {a.busy ? "Unpublishing…" : a.armed ? "Take the page down? Data is kept" : "Unpublish"}
      </button>
      {a.armed && !a.busy && (
        <button type="button" onClick={a.cancel} style={{ ...linkBtn, color: "var(--muted)" }}>Cancel</button>
      )}
      {a.error && <span role="alert" style={{ color: "var(--danger, #e5484d)", fontSize: 13 }}>{a.error}</span>}
    </span>
  );
}

export function ReleaseHandleButton({ slug }: { slug: string }) {
  const a = useAction(
    () => fetch(`/api/slugs/${slug}?release=1`, { method: "DELETE" }),
    () => { window.location.href = `/account?released=${slug}`; },
    "Couldn’t release the handle — try again."
  );
  return (
    <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
      <button type="button" onClick={a.click} disabled={a.busy}
        style={{ ...linkBtn, color: a.armed ? "var(--danger, #e5484d)" : "var(--muted)", fontWeight: a.armed ? 600 : 400 }}>
        {a.busy ? "Releasing…" : a.armed ? "Permanently delete page + data and free the handle?" : "Release handle"}
      </button>
      {a.armed && !a.busy && (
        <button type="button" onClick={a.cancel} style={{ ...linkBtn, color: "var(--muted)" }}>Cancel</button>
      )}
      {a.error && <span role="alert" style={{ color: "var(--danger, #e5484d)", fontSize: 13 }}>{a.error}</span>}
    </span>
  );
}

export function DeleteAccountButton() {
  const a = useAction(
    () => fetch("/api/account", { method: "DELETE" }),
    () => { window.location.href = "/"; },
    "Couldn’t delete the account — try again."
  );
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <button type="button" onClick={a.click} disabled={a.busy}
        style={{
          padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600,
          background: a.armed ? "var(--danger, #e5484d)" : "transparent",
          color: a.armed ? "#fff" : "var(--danger, #e5484d)",
          border: "1px solid var(--danger, #e5484d)",
        }}>
        {a.busy ? "Deleting…" : a.armed ? "Permanently delete everything — confirm" : "Delete account & data"}
      </button>
      {a.armed && !a.busy && (
        <button type="button" onClick={a.cancel} style={{ ...linkBtn, color: "var(--muted)", fontSize: 14 }}>Cancel</button>
      )}
      {a.error && <span role="alert" style={{ color: "var(--danger, #e5484d)", fontSize: 13 }}>{a.error}</span>}
    </div>
  );
}
