"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client.ts";

type State = "idle" | "submitting" | "sent" | "error";

export default function SignInForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`
        : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setMessage(error.message || "Couldn’t send the link — try again.");
      setState("error");
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <p style={{ fontSize: 17, fontWeight: 600, color: "var(--accent)", lineHeight: 1.6 }}>
        ✓ Check your inbox. We sent a one-tap sign-in link to <strong>{email}</strong>.
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
          {state === "submitting" ? "Sending…" : "Email me a link →"}
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
