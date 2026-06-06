import type { Metadata } from "next";
import Generator from "./Generator";
import styles from "./generator.module.css";

const PRIMARY_KEYWORD = "Portfolio About Me Generator";
const SLUG = "/tools/portfolio-about-me-generator";

export const metadata: Metadata = {
  title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
  description:
    "Write your portfolio “about me” in seconds. Enter your role and skills, pick a tone, and copy polished bio options for designers and creatives — free, no signup.",
  alternates: { canonical: SLUG },
  openGraph: {
    title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
    description: "Enter your role, pick a tone, and copy a polished portfolio about-me in seconds.",
    url: SLUG,
    type: "website",
  },
};

const FAQ = [
  {
    q: "How does the about me generator work?",
    a: "You give it your role and, optionally, your name, years of experience and a few skills. It assembles several ready-to-paste “about me” options — a one-liner, a portfolio paragraph, a longer story and a third-person bio — written in the tone you choose. Everything runs in your browser; nothing is stored.",
  },
  {
    q: "What should a portfolio “about me” include?",
    a: "Keep it short and human: who you are (your role), what you do best (a few focus areas or skills), and a line of personality or what you care about. Lead with the work, not your life story. This tool drafts exactly that shape so you can tweak the wording to sound like you.",
  },
  {
    q: "Can I change the tone?",
    a: "Yes — switch between Professional, Friendly, Confident and Creative and the text rewrites instantly so you can compare and pick the voice that fits your work.",
  },
  {
    q: "Is the text written by AI?",
    a: "The free generator uses a curated writing engine, so it's instant and private with no signup. If you want it tailored to a specific job or brand by AI, that's a feature you can join the waitlist for.",
  },
  {
    q: "Is this tool free?",
    a: "Completely free, with no signup to generate and copy your about me. You can optionally publish it as a real portfolio site with your own URL on Vibe Resume.",
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
      <Generator />

      <div className={styles.wrap}>
        <section className={`${styles.card} ${styles.section}`}>
          <h2>How it works</h2>
          <ol>
            <li>Enter your role, plus any skills, years or your name.</li>
            <li>Pick a tone — Professional, Friendly, Confident or Creative.</li>
            <li>Copy the version you like, tweak a word or two, and paste it into your portfolio.</li>
          </ol>
        </section>

        <section className={`${styles.card} ${styles.section}`}>
          <h2>Why your “about me” matters</h2>
          <p>
            The about section is the one place on your portfolio where you talk directly to a
            hiring manager or client — and it's the part most people leave blank or fill with a
            stiff job description. A clear, well-pitched bio frames everything else they see:
            it tells them what you do, who you do it for, and whether you'll be a pleasure to
            work with. The hardest part is the blank page, so this tool hands you a strong first
            draft in the right shape and tone; you keep the version that sounds most like you.
          </p>
        </section>

        {/* cross-links to sibling tools in the cluster */}
        <section className={`${styles.card} ${styles.section}`}>
          <h2>Related tools</h2>
          <ul>
            <li><a href="/tools/pdf-resume-to-website">PDF Resume → Website Converter</a></li>
            <li><a href="/tools/theme-picker">Dev Portfolio Theme Picker</a></li>
            <li><a href="/tools/linkedin-url-customizer">LinkedIn URL Customizer</a></li>
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
