import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publish Your Resume — Vibe Resume",
  description: "Publish your resume as a live personal website with your own URL. Coming soon.",
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "80px 24px", textAlign: "center", fontFamily: "inherit" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>
        Your website is almost live
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 17, lineHeight: 1.6, marginBottom: 32 }}>
        We&apos;re putting the finishing touches on publishing. Drop your email and
        you&apos;ll be first to get your own <strong>vibe.resume/yourname</strong> URL.
      </p>
      <form
        action="https://app.posthog.com/capture/"
        method="GET"
        style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}
      >
        <input
          type="email"
          name="email"
          required
          placeholder="you@email.com"
          style={{
            flex: "1 1 220px", padding: "12px 16px", borderRadius: 10, fontSize: 15,
            border: "1px solid var(--line)", background: "var(--panel2)", color: "var(--text)",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "12px 22px", borderRadius: 10, fontWeight: 700, fontSize: 15,
            background: "var(--accent2)", color: "var(--on-accent2)", border: 0, cursor: "pointer",
          }}
        >
          Notify me →
        </button>
      </form>
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 20 }}>
        No spam. One email when it&apos;s ready.{" "}
        <a href="/" style={{ color: "var(--accent)" }}>← Back to tools</a>
      </p>
    </main>
  );
}
