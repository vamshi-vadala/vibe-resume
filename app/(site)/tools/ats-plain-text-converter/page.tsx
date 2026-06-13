import type { Metadata } from "next";
import Converter from "./Converter";
import styles from "./converter.module.css";

const PRIMARY_KEYWORD = "ATS Plain-Text Resume Converter";
const SLUG = "/tools/ats-plain-text-converter";

export const metadata: Metadata = {
  title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
  description:
    "See how applicant tracking systems read your resume. Get a 0–100 ATS score, spot parsing issues, and copy a clean plain-text version — free, no signup.",
  alternates: { canonical: SLUG },
  openGraph: {
    title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
    description: "Paste your resume, see the human view vs the ATS robot view, and fix parsing issues instantly.",
    url: SLUG,
    type: "website",
    siteName: "Vibe Resume",
  },
};

const FAQ = [
  {
    q: "What is an ATS plain-text view?",
    a: "An Applicant Tracking System (ATS) strips your resume's formatting and reads it as plain text. This tool shows you exactly that text, so you can spot what the robot mis-reads before a recruiter ever sees it.",
  },
  {
    q: "Why does my resume look broken in the robot view?",
    a: "Columns, tables, text boxes, fancy bullets and special characters often scramble when an ATS linearizes your document. The issue list flags each one and the converter outputs a clean, single-column version.",
  },
  {
    q: "Is this tool free?",
    a: "Yes. The converter is completely free. You can optionally publish your cleaned resume as a live web page on Vibe Resume.",
  },
];

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: PRIMARY_KEYWORD,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Converter />

      <div className={styles.wrap}>
        <section className={styles.card}>
          <h2>How it works</h2>
          <ol>
            <li>Paste your resume text (or upload a .txt export).</li>
            <li>We strip formatting the way an ATS does and flag parsing risks.</li>
            <li>Copy the clean plain-text version — or publish it as a live page.</li>
          </ol>
        </section>

        {/* cross-links to sibling tools in the cluster */}
        <section className={styles.card}>
          <h2>Related tools</h2>
          <ul>
            <li><a href="/tools/pdf-resume-to-website">PDF Resume → Website Converter</a></li>
            <li><a href="/tools/developer-resume-to-portfolio">Developer Resume → Portfolio</a></li>
            <li><a href="/tools/github-to-portfolio">GitHub → Portfolio Converter</a></li>
            <li><a href="/tools/linkedin-url-customizer">Custom LinkedIn URL Generator</a></li>
          </ul>
        </section>

        <section className={`${styles.card} ${styles.faq}`}>
          <h2>FAQ</h2>
          {FAQ.map((f, i) => (
            <details key={i}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        <footer className={styles.footer}>Free tool by Vibe Resume</footer>
      </div>
    </>
  );
}
