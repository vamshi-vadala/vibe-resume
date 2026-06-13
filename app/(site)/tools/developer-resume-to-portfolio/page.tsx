import type { Metadata } from "next";
import Converter from "./Converter";
import styles from "./converter.module.css";

const PRIMARY_KEYWORD = "Developer Resume to Portfolio Converter";
const SLUG = "/tools/developer-resume-to-portfolio";

export const metadata: Metadata = {
  title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
  description:
    "Turn your developer resume into a portfolio website instantly. Paste your resume and we pull out your GitHub, project repos and tech stack — free.",
  alternates: { canonical: SLUG },
  openGraph: {
    title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
    description: "Paste your developer resume and flip it into a clean portfolio with your GitHub, projects and tech stack.",
    url: SLUG,
    type: "website",
    siteName: "Vibe Resume",
  },
};

const FAQ = [
  {
    q: "How does the developer resume to portfolio converter work?",
    a: "Paste your resume text and the tool scans it for the things a developer portfolio leads with: your GitHub profile, project repositories, links (LinkedIn, personal site) and a tech stack. It lays them out as a clean portfolio preview — no account needed.",
  },
  {
    q: "What does it detect from my resume?",
    a: "Your name and headline, a short summary, your GitHub profile and any github.com/owner/repo project links, profile links like LinkedIn and your personal site, and a tech stack matched from 80+ languages, frameworks and tools (TypeScript, React, Go, Docker, AWS and more).",
  },
  {
    q: "Is this tool free?",
    a: "Yes. The converter is completely free and runs in your browser. You can optionally publish the generated portfolio as a live web page on Vibe Resume.",
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
            <li>Paste your developer resume text.</li>
            <li>We pull out your GitHub, project repos, links and tech stack.</li>
            <li>Preview the portfolio — or publish it as a live page with your own URL.</li>
          </ol>
        </section>

        {/* cross-links to sibling tools in the cluster */}
        <section className={styles.card}>
          <h2>Related tools</h2>
          <ul>
            <li><a href="/tools/pdf-resume-to-website">PDF Resume → Website Converter</a></li>
            <li><a href="/tools/ats-plain-text-converter">ATS Plain-Text Resume Converter</a></li>
            <li><a href="/tools/github-to-portfolio">GitHub → Portfolio Converter</a></li>
            <li><a href="/tools/theme-picker">Portfolio Theme Picker</a></li>
            <li><a href="/tools/linkedin-url-customizer">Customize your LinkedIn URL</a></li>
            <li><a href="/tools/case-study-template">Case Study Template</a></li>
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
