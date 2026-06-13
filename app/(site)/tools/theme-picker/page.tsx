import type { Metadata } from "next";
import Deck from "./Deck";
import styles from "./deck.module.css";

const PRIMARY_KEYWORD = "Dev Portfolio Theme Picker";
const SLUG = "/tools/theme-picker";

export const metadata: Metadata = {
  title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
  description:
    "Swipe through developer portfolio themes and find your look in seconds. A live, no-signup theme gallery — keep the one you like and take it straight to your resume site.",
  alternates: { canonical: SLUG },
  openGraph: {
    title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
    description: "Tinder-style swipe through portfolio themes. Skip what you don't like, keep the look you love.",
    url: SLUG,
    type: "website",
  },
};

const FAQ = [
  {
    q: "What is the dev portfolio theme picker?",
    a: "It's a swipeable gallery of developer portfolio designs. Each card shows the same sample portfolio re-skinned in a different theme — colors, fonts, spacing and corners — so you can compare looks side by side and quickly settle on the one that fits you. Skip what you don't like and keep the one you do.",
  },
  {
    q: "How do I choose a theme?",
    a: "Use the Skip and Keep buttons, or the ← and → arrow keys, to flip through the deck. When you keep a theme, a full-size preview appears and you can carry that look over to the PDF Resume → Website tool to apply it to your own content.",
  },
  {
    q: "Can I use one of these themes on my own resume?",
    a: "Yes. Keep a theme, then click “Use this theme on my resume” to jump into the resume-to-website converter with that look pre-selected. Publishing it as a live page with your own URL is a free Vibe Resume account away.",
  },
  {
    q: "Are the themes responsive and accessible?",
    a: "Every theme is built on the same responsive layout and is checked for color contrast, so your portfolio reads well on phones and desktops alike — in light and dark looks.",
  },
  {
    q: "Is this tool free?",
    a: "Completely free, and there's no signup to browse and preview themes. You only create an account when you want to publish your themed site.",
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
      <Deck />

      <div className={styles.wrap}>
        <section className={`${styles.card} ${styles.section}`}>
          <h2>How it works</h2>
          <ol>
            <li>Swipe through the deck of portfolio themes — skip or keep each one.</li>
            <li>Keep a theme to see it full-size on a sample developer portfolio.</li>
            <li>Carry your favorite look into the resume converter and publish it with your own URL.</li>
          </ol>
        </section>

        <section className={`${styles.card} ${styles.section}`}>
          <h2>Why a theme picker beats a blank page</h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
            Most developers can build the portfolio — they just stall on how it should
            <em> look</em>. A wall of CSS options is paralyzing; a one-at-a-time deck is not.
            By showing one finished, opinionated design per card on real portfolio content —
            an intro, a tech stack and a few projects — you judge the whole vibe in a glance
            instead of tweaking variables. From minimalist editorial and pastel-soft to a
            monospace terminal look or a bold brutalist grid, each theme is a complete,
            responsive, contrast-checked starting point. Find the one that feels like you,
            then spend your energy on the writing, not the color wheel.
          </p>
        </section>

        {/* cross-links to sibling tools in the cluster */}
        <section className={`${styles.card} ${styles.section}`}>
          <h2>Related tools</h2>
          <ul>
            <li><a href="/tools/pdf-resume-to-website">PDF Resume → Website Converter</a></li>
            <li><a href="/tools/developer-resume-to-portfolio">Developer Resume → Portfolio</a></li>
            <li><a href="/tools/github-to-portfolio">GitHub → Portfolio Generator</a></li>
            <li><a href="/tools/portfolio-about-me-generator">Portfolio About Me Generator</a></li>
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
