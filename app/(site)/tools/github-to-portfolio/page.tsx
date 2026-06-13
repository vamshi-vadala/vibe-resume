import type { Metadata } from "next";
import Converter from "./Converter";
import styles from "./converter.module.css";

const PRIMARY_KEYWORD = "GitHub to Portfolio Generator";
const SLUG = "/tools/github-to-portfolio";

export const metadata: Metadata = {
  title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
  description:
    "Turn a GitHub username into a portfolio website instantly. Enter your username and we pull your bio, top repositories and tech stack from GitHub — free, no signup.",
  alternates: { canonical: SLUG },
  openGraph: {
    title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
    description: "Type a GitHub username and get an instant portfolio — bio, top repos and tech stack, straight from GitHub.",
    url: SLUG,
    type: "website",
    siteName: "Vibe Resume",
  },
};

const FAQ = [
  {
    q: "How does the GitHub to portfolio generator work?",
    a: "Enter any GitHub username and the tool calls the public GitHub API for that user's profile and repositories, then lays out a portfolio: your name and bio, your most-starred projects, and a tech stack inferred from your repositories' languages. Nothing is stored — it runs in your browser.",
  },
  {
    q: "Do I need to sign in or give access to my GitHub?",
    a: "No. It only reads public data via the public GitHub API — no login, no OAuth, no token. Anything private stays private.",
  },
  {
    q: "Why are some repositories missing?",
    a: "Forks and archived repositories are filtered out, and the portfolio shows your top projects by stars. Private repositories are never visible to the public API, so they don't appear.",
  },
  {
    q: "Is this tool free?",
    a: "Yes, completely free. You can optionally publish the generated portfolio as a live web page on Vibe Resume.",
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
            <li>Type your GitHub username.</li>
            <li>We pull your bio, top repositories and language stack from GitHub.</li>
            <li>Preview the portfolio — or publish it as a live page with your own URL.</li>
          </ol>
        </section>

        {/* cross-links to sibling tools in the cluster */}
        <section className={styles.card}>
          <h2>Related tools</h2>
          <ul>
            <li><a href="/tools/developer-resume-to-portfolio">Developer Resume → Portfolio</a></li>
            <li><a href="/tools/pdf-resume-to-website">PDF Resume → Website Converter</a></li>
            <li><a href="/tools/ats-plain-text-converter">ATS Plain-Text Resume Converter</a></li>
            <li><a href="/tools/theme-picker">Browse portfolio themes</a></li>
            <li><a href="/tools/portfolio-handle-checker">Portfolio Handle Checker</a></li>
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
