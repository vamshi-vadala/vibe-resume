"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client.ts";

type State = "idle" | "submitting" | "sent" | "verifying" | "error";

export default function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function onSendEmail(e: React.FormEvent) {
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
      setMessage(error.message || "Couldn’t send the code — try again.");
      setState("error");
      return;
    }
    setState("sent");
  }

  async function onVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setState("verifying");
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setMessage(error.message || "That code didn’t work — double-check or send a new one.");
      setState("error");
      return;
    }
    router.push(next || "/account");
    router.refresh();
  }

  if (state === "sent" || state === "verifying" || (state === "error" && code)) {
    return (
      <>
        <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
          ✓ We sent a 6-digit code to <strong style={{ color: "var(--text)" }}>{email}</strong>.
          Enter it below (or click the link in the email).
        </p>
        <form
          onSubmit={onVerifyCode}
          style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}
        >
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            disabled={state === "verifying"}
            aria-label="6-digit sign-in code"
            style={{
              flex: "1 1 180px", padding: "12px 16px", borderRadius: 10, fontSize: 18,
              letterSpacing: 4, textAlign: "center", fontFamily: "ui-monospace, monospace",
              border: "1px solid var(--line)", background: "var(--panel2)", color: "var(--text)",
            }}
          />
          <button
            type="submit"
            disabled={state === "verifying" || code.length < 6}
            style={{
              padding: "12px 22px", borderRadius: 10, fontWeight: 700, fontSize: 15,
              background: "var(--accent2)", color: "var(--on-accent2)", border: 0,
              cursor: state === "verifying" ? "default" : "pointer",
              opacity: state === "verifying" || code.length < 6 ? 0.6 : 1,
            }}
          >
            {state === "verifying" ? "Verifying…" : "Sign in →"}
          </button>
        </form>
        {state === "error" && (
          <p role="alert" style={{ color: "var(--danger, #e5484d)", fontSize: 14, marginTop: 12 }}>
            {message}
          </p>
        )}
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 16 }}>
          <button
            type="button"
            onClick={() => { setState("idle"); setCode(""); setMessage(""); }}
            style={{ background: "none", border: 0, color: "var(--accent)", cursor: "pointer", textDecoration: "underline", padding: 0, font: "inherit" }}
          >
            Use a different email
          </button>
        </p>
      </>
    );
  }

  return (
    <>
      <form
        onSubmit={onSendEmail}
        style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}
      >
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
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
          {state === "submitting" ? "Sending…" : "Email me a code →"}
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
