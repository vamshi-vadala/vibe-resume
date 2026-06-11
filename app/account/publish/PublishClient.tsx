"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { checkSlugLocal, suggestSlug, SLUG_MAX } from "@/lib/slugAvailability.ts";
import { looksLikeSampleResume } from "@/lib/resume";

const PUBLISH_STASH_KEY = "vr.publish.pending";

type Handle = { slug: string; isLive: boolean };
type State = "idle" | "publishing" | "done" | "error";
type Availability = "unknown" | "checking" | "available" | "taken" | "reserved" | "invalid";

/** Pull a person/profile name out of the stashed PublishPayload, any kind. */
function nameFromStash(raw: string): string {
  try {
    const p = JSON.parse(raw);
    return p?.resume?.name || p?.profile?.name || "";
  } catch {
    return "";
  }
}

export default function PublishClient({ handles }: { handles: Handle[] }) {
  const router = useRouter();
  const [hasStash, setHasStash] = useState<boolean | null>(null);
  const [selected, setSelected] = useState(handles[0]?.slug ?? "");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  // Inline claim step (first-time users arrive here with zero handles — don't
  // bounce them to the handle-checker tool page and lose the publish thread).
  const needsClaim = handles.length === 0;
  const [slugInput, setSlugInput] = useState("");
  const [availability, setAvailability] = useState<Availability>("unknown");
  const checkSeq = useRef(0);

  // Demo-data tripwire: publishing the unmodified "Try a sample" resume to a
  // real handle puts Jane Doe on the user's public URL. Require one explicit
  // extra confirmation instead of blocking (previewing the full flow with the
  // sample is legitimate).
  const [isSample, setIsSample] = useState(false);
  const [sampleConfirmed, setSampleConfirmed] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PUBLISH_STASH_KEY);
      setHasStash(!!raw);
      if (raw && needsClaim) setSlugInput(suggestSlug(nameFromStash(raw)));
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.resume && looksLikeSampleResume(p.resume)) setIsSample(true);
      }
    } catch {
      setHasStash(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // First publish click on sample data arms the warning instead of publishing.
  function sampleGate(): boolean {
    if (isSample && !sampleConfirmed) {
      setSampleConfirmed(true);
      return true;
    }
    return false;
  }

  // Debounced availability check on the claim input.
  useEffect(() => {
    if (!needsClaim || !slugInput) { setAvailability("unknown"); return; }
    const local = checkSlugLocal(slugInput);
    if (local) {
      setAvailability(local.status === "reserved" ? "reserved" : "invalid");
      return;
    }
    setAvailability("checking");
    const seq = ++checkSeq.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/slugs/${slugInput}`);
        const j = await res.json();
        if (seq !== checkSeq.current) return; // stale response
        setAvailability(j.status === "available" ? "available" : "taken");
      } catch {
        if (seq === checkSeq.current) setAvailability("unknown");
      }
    }, 350);
    return () => clearTimeout(t);
  }, [slugInput, needsClaim]);

  async function publishTo(slug: string) {
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
    const res = await fetch(`/api/slugs/${slug}`, {
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
    router.push(`/account?published=${slug}`);
    router.refresh();
  }

  async function publish() {
    if (sampleGate()) return;
    setError("");
    setState("publishing");
    await publishTo(selected);
  }

  async function claimAndPublish(e: React.FormEvent) {
    e.preventDefault();
    if (sampleGate()) return;
    setError("");
    setState("publishing");
    const res = await fetch(`/api/slugs/${slugInput}`, { method: "POST" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(
        res.status === 409
          ? `viberesume.in/${slugInput} was just taken — try another handle.`
          : res.status === 429
            ? "You've reached the handle limit — release one from your account first."
            : j.error || `claim failed (${res.status})`
      );
      setAvailability(res.status === 409 ? "taken" : availability);
      setState("error");
      return;
    }
    await publishTo(slugInput);
  }

  if (hasStash === null) return null;
  if (hasStash === false && needsClaim) {
    return (
      <>
        <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
          No website to publish in this browser yet. Generate one from your resume
          first — it takes under a minute — then hit Publish on the result.
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

  // First-time path: pick a handle and publish, one screen, one button.
  if (needsClaim) {
    const ok = availability === "available";
    const statusLine: Record<Availability, string> = {
      unknown: " ",
      checking: "Checking availability…",
      available: `✓ viberesume.in/${slugInput} is yours`,
      taken: "Taken — try a variation.",
      reserved: "That name is reserved on Vibe Resume.",
      invalid: "3–30 chars: lowercase letters, numbers, hyphens.",
    };
    return (
      <form onSubmit={claimAndPublish}>
        <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
          Last step: choose the URL your website will live at.
        </p>
        <label htmlFor="handle" style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
          Your handle
        </label>
        <div style={{
          display: "flex", alignItems: "center", gap: 0, marginBottom: 6,
          border: "1px solid var(--line)", borderRadius: 10, background: "var(--panel2)",
          padding: "2px 2px 2px 14px", maxWidth: 420,
        }}>
          <span style={{ color: "var(--muted)", fontSize: 15, whiteSpace: "nowrap" }}>viberesume.in/</span>
          <input
            id="handle"
            type="text"
            value={slugInput}
            maxLength={SLUG_MAX}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="your-name"
            style={{
              flex: 1, minWidth: 0, padding: "10px 12px 10px 2px", fontSize: 15,
              border: 0, background: "transparent", color: "var(--text)", outline: "none",
            }}
          />
        </div>
        <p
          role="status"
          style={{
            fontSize: 13, minHeight: 18, marginBottom: 18,
            color: ok ? "var(--accent)" : availability === "checking" || availability === "unknown" ? "var(--muted)" : "var(--danger, #e5484d)",
          }}
        >
          {statusLine[availability]}
        </p>
        <button
          type="submit"
          disabled={!ok || state === "publishing"}
          style={{
            padding: "12px 22px", borderRadius: 10, fontWeight: 700, fontSize: 15,
            background: "var(--accent2)", color: "var(--on-accent2)", border: 0,
            cursor: ok && state !== "publishing" ? "pointer" : "default",
            opacity: ok && state !== "publishing" ? 1 : 0.6,
          }}
        >
          {state === "publishing"
            ? "Publishing…"
            : isSample && sampleConfirmed
              ? "Publish the demo anyway →"
              : `Claim & publish${ok ? ` viberesume.in/${slugInput}` : ""} →`}
        </button>
        {isSample && sampleConfirmed && state !== "publishing" && (
          <p role="alert" style={{ color: "var(--muted)", fontSize: 14, marginTop: 12, maxWidth: 460 }}>
            ⚠ This is the <strong style={{ color: "var(--text)" }}>sample resume (Jane Doe)</strong>, not yours.
            Anyone visiting your URL will see demo data. Upload your own PDF first, or click again to publish the demo.
          </p>
        )}
        {state === "error" && (
          <p role="alert" style={{ color: "var(--danger, #e5484d)", fontSize: 14, marginTop: 12 }}>
            {error}
          </p>
        )}
      </form>
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
        {state === "publishing"
          ? "Publishing…"
          : isSample && sampleConfirmed
            ? "Publish the demo anyway →"
            : `Publish to viberesume.in/${selected} →`}
      </button>

      {isSample && sampleConfirmed && state !== "publishing" && (
        <p role="alert" style={{ color: "var(--muted)", fontSize: 14, marginTop: 12, maxWidth: 460 }}>
          ⚠ This is the <strong style={{ color: "var(--text)" }}>sample resume (Jane Doe)</strong>, not yours.
          Anyone visiting your URL will see demo data. Upload your own PDF first, or click again to publish the demo.
        </p>
      )}

      {state === "error" && (
        <p role="alert" style={{ color: "var(--danger, #e5484d)", fontSize: 14, marginTop: 12 }}>
          {error}
        </p>
      )}
    </>
  );
}
