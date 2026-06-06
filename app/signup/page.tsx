import type { Metadata } from "next";
import WaitlistForm from "./WaitlistForm";

export const metadata: Metadata = {
  title: "Publish Your Resume — Vibe Resume",
  description: "Publish your resume as a live personal website with your own URL. Coming soon.",
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "80px 24px", textAlign: "center", fontFamily: "inherit" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>
        Publishing is coming soon
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 17, lineHeight: 1.6, marginBottom: 32 }}>
        Every Vibe Resume tool is <strong>free to use right now</strong>. The one thing that
        isn&apos;t live yet is publishing — hosting your resume as a website at your own URL.
        Drop your email and you&apos;ll be the first to know when it launches.
      </p>
      <WaitlistForm />
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 20 }}>
        No spam — just one email when it&apos;s ready.{" "}
        <a href="/" style={{ color: "var(--accent)" }}>← Explore the free tools</a>
      </p>
    </main>
  );
}
