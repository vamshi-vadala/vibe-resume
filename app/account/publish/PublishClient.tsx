"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PUBLISH_STASH_KEY = "vr.publish.pending";

type Handle = { slug: string; isLive: boolean };
type State = "idle" | "publishing" | "done" | "error";

export default function PublishClient({ handles }: { handles: Handle[] }) {
  const router = useRouter();
  const [hasStash, setHasStash] = useState<boolean | null>(null);
  const [selected, setSelected] = useState(handles[0]?.slug ?? "");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    try { setHasStash(!!sessionStorage.getItem(PUBLISH_STASH_KEY)); }
    catch { setHasStash(false); }
  }, []);

  async function publish() {
    setError("");
    setState("publishing");
    let body: string;
    try {
      const raw = sessionStorage.getItem(PUBLISH_STASH_KEY);
      if (!raw) throw new Error("nothing to publish");
      body = raw;
    } catch (e) {
      setError(e instanceof Error ? e.message : "no resume to publish");
      setState("error");
      return;
    }

    const res = await fetch(`/api/slugs/${selected}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || `publish failed (${res.status})`);
      setState("error");
      return;
    }
    try { sessionStorage.removeItem(PUBLISH_STASH_KEY); } catch {}
    setState("done");
    router.push(`/account?published=${selected}`);
    router.refresh();
  }

  if (hasStash === null) return null;
  if (hasStash === false) {
    return (
      <>
        <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
          No resume to publish in this browser. Generate a website from your PDF first, then click the Publish button on that page.
        </p>
        <Link
          href="/tools/pdf-resume-to-website"
          style={{ color: "var(--accent)", fontWeight: 600 }}
        >
          Open the PDF tool →
        </Link>
      </>
    );
  }

  return (
    <>
      <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
        {handles.length === 1
          ? <>This will publish your resume to <strong>viberesume.in/{selected}</strong>.{handles[0].isLive && " It’ll overwrite the current live version."}</>
          : "Pick which handle to publish to:"}
      </p>

      {handles.length > 1 && (
        <fieldset style={{ border: 0, padding: 0, margin: "0 0 20px" }}>
          <legend className="sr-only">Choose a handle</legend>
          <div style={{ display: "grid", gap: 10 }}>
            {handles.map((h) => (
              <label
                key={h.slug}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", border: "1px solid var(--line)",
                  borderRadius: 10, background: "var(--panel)", cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="slug"
                  value={h.slug}
                  checked={selected === h.slug}
                  onChange={() => setSelected(h.slug)}
                />
                <span><strong>viberesume.in/{h.slug}</strong>{h.isLive && <span style={{ color: "var(--muted)", marginLeft: 8, fontSize: 13 }}>(will overwrite live)</span>}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <button
        onClick={publish}
        disabled={state === "publishing" || !selected}
        style={{
          padding: "12px 22px", borderRadius: 10, fontWeight: 700, fontSize: 15,
          background: "var(--accent2)", color: "var(--on-accent2)", border: 0,
          cursor: state === "publishing" ? "default" : "pointer",
          opacity: state === "publishing" ? 0.7 : 1,
        }}
      >
        {state === "publishing" ? "Publishing…" : `Publish to viberesume.in/${selected} →`}
      </button>

      {state === "error" && (
        <p role="alert" style={{ color: "var(--danger, #e5484d)", fontSize: 14, marginTop: 12 }}>
          {error}
        </p>
      )}
    </>
  );
}
