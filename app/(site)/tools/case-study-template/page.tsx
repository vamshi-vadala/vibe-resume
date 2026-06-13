import type { Metadata } from "next";
import CaseCrafter from "./CaseCrafter";
import styles from "./casecrafter.module.css";

const PRIMARY_KEYWORD = "Case Study Template for Designers";
const SLUG = "/tools/case-study-template";

export const metadata: Metadata = {
  title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
  description:
    "A free case study template and generator for designers. Fill in the project, challenge, process and outcome and get a structured, copy-paste case study — plus Markdown export.",
  alternates: { canonical: SLUG },
  openGraph: {
    title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
    description: "Turn a project into a structured portfolio case study in minutes. Free, no signup.",
    url: SLUG,
    type: "website",
    siteName: "Vibe Resume",
  },
};

const FAQ = [
  {
    q: "What should a design case study include?",
    a: "A strong case study follows a simple arc: a short overview (what, who for, your role), the challenge you faced, the approach you took (your process and key decisions), and the outcome — ideally with numbers. This tool lays your inputs out in exactly that structure so nothing important is missing.",
  },
  {
    q: "How long should a portfolio case study be?",
    a: "Long enough to show your thinking, short enough to keep attention — usually 300–700 words per project. Lead with the outcome, keep the process scannable (bullets beat paragraphs), and cut anything that doesn't show a decision you made.",
  },
  {
    q: "Can I export the case study?",
    a: "Yes. Copy the whole thing as Markdown to paste into Notion, your portfolio CMS or a README, or copy any single section. Only the parts you filled in are exported — empty prompts are left out.",
  },
  {
    q: "Does it write the case study for me?",
    a: "It structures and formats what you provide rather than inventing claims about your work — your results stay truthful. An AI-tightened version (tailored to a specific client) is a planned upgrade — not built yet.",
  },
  {
    q: "Is this tool free?",
    a: "Completely free, with no signup to build and copy your case study. You can optionally publish it as a portfolio page with your own URL on Vibe Resume.",
  },
];

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: PRIMARY_KEYWORD,
        applicationCategory: "DesignApplication",
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
      <CaseCrafter />

      <div className={styles.wrap}>
        <section className={`${styles.card} ${styles.section}`}>
          <h2>How it works</h2>
          <ol>
            <li>Fill in the project basics, the challenge, your approach and the outcome.</li>
            <li>Get a structured case study with your results pulled out as highlights.</li>
            <li>Copy it as Markdown or section by section — then publish or paste it anywhere.</li>
          </ol>
        </section>

        <section className={`${styles.card} ${styles.section}`}>
          <h2>Why case studies win design work</h2>
          <p>
            Clients don't hire the prettiest screens — they hire the designer who can show how
            they think. A case study is the proof: it turns a finished project into a story about
            a problem you understood, the decisions you made, and the result you delivered. Most
            portfolios stall here because writing one from a blank page is daunting, so the work
            never gets shown. Starting from a proven structure — challenge, approach, outcome —
            gets a credible draft on the page fast, so you can spend your time sharpening the story
            instead of inventing the format.
          </p>
        </section>

        {/* cross-links to sibling tools in the cluster */}
        <section className={`${styles.card} ${styles.section}`}>
          <h2>Related tools</h2>
          <ul>
            <li><a href="/tools/portfolio-about-me-generator">Portfolio About Me Generator</a></li>
            <li><a href="/tools/theme-picker">Dev Portfolio Theme Picker</a></li>
            <li><a href="/tools/pdf-resume-to-website">PDF Resume → Website Converter</a></li>
          </ul>
        </section>

        <section className={`${styles.card} ${styles.faq} ${styles.section}`}>
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
