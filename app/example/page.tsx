import type { Metadata } from "next";
import Link from "next/link";
import { parseResume, SAMPLE_RESUME_TEXT } from "@/lib/resume";
import ResumeSite from "../tools/pdf-resume-to-website/ResumeSite";

export const metadata: Metadata = {
  title: "Example resume website — Vibe Resume",
  description:
    "A live example of a resume published as a personal website with Vibe Resume. Make yours free from a PDF in under a minute.",
  alternates: { canonical: "/example" },
};

// A real, always-up example profile a stranger can inspect BEFORE trusting us
// with their resume. Fully static: the same sample the PDF tool's "Try a
// sample" uses, rendered through the same ResumeSite component that powers
// every published viberesume.in/{slug} page — so it is exactly what you get.

export default function ExamplePage() {
  const data = parseResume(SAMPLE_RESUME_TEXT);
  return (
    <main>
      <div
        style={{
          maxWidth: 760, margin: "0 auto", padding: "28px 20px 0",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: 12, flexWrap: "wrap",
        }}
      >
        <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
          An example website generated from a PDF resume — this is what publishing looks like.
        </p>
        <Link
          href="/tools/pdf-resume-to-website"
          style={{
            padding: "10px 18px", borderRadius: 10, fontWeight: 700, fontSize: 14,
            background: "var(--accent2)", color: "var(--on-accent2)", whiteSpace: "nowrap",
          }}
        >
          Make yours free →
        </Link>
      </div>
      <div
        style={{
          maxWidth: 760, margin: "18px auto 48px", border: "1px solid var(--line)",
          borderRadius: 12, overflow: "hidden", background: "var(--background)",
        }}
      >
        <ResumeSite data={data} photoUrl="" themeId="" />
      </div>
    </main>
  );
}
