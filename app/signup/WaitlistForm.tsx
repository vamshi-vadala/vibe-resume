"use client";

import { useState } from "react";

type State = "idle" | "submitting" | "done" | "error";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Something went wrong — try again.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setMessage("Network error — check your connection and try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p style={{ fontSize: 17, fontWeight: 600, color: "var(--accent)", lineHeight: 1.6 }}>
        ✓ You&apos;re on the list. We&apos;ll email you the moment publishing is live.
      </p>
    );
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}
      >
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          disabled={state === "submitting"}
          style={{
            flex: "1 1 220px", padding: "12px 16px", borderRadius: 10, fontSize: 15,
            border: "1px solid var(--line)", background: "var(--panel2)", color: "var(--text)",
          }}
        />
        <button
          type="submit"
          disabled={state === "submitting"}
          style={{
            padding: "12px 22px", borderRadius: 10, fontWeight: 700, fontSize: 15,
            background: "var(--accent2)", color: "var(--on-accent2)", border: 0,
            cursor: state === "submitting" ? "default" : "pointer", opacity: state === "submitting" ? 0.7 : 1,
          }}
        >
          {state === "submitting" ? "Adding…" : "Notify me →"}
        </button>
      </form>
      {state === "error" && (
        <p role="alert" style={{ color: "var(--danger, #e5484d)", fontSize: 14, marginTop: 12 }}>
          {message}
        </p>
      )}
    </>
  );
}
