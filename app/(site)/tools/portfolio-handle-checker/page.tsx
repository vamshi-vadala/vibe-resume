import type { Metadata } from "next";
import HandleChecker from "./HandleChecker";
import styles from "./handle.module.css";

const PRIMARY_KEYWORD = "Portfolio Handle Checker";
const SLUG = "/tools/portfolio-handle-checker";

export const metadata: Metadata = {
  title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
  description:
    "Check whether your personal handle is free across GitHub and the web, and claim a matching portfolio URL. Free, no signup — a live GitHub username check plus quick links to every platform.",
  alternates: { canonical: SLUG },
  openGraph: {
    title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
    description: "See where @yourhandle is still available across the web and claim your portfolio URL.",
    url: SLUG,
    type: "website",
  },
};

const FAQ = [
  {
    q: "How does the handle checker work?",
    a: "Type the handle you want and the tool checks GitHub live via its public API — a 404 means the username is free, a match means it's taken. For platforms that don't allow automated checks (LinkedIn, X, Instagram and others), it gives you a one-tap link to check each yourself, rather than guessing.",
  },
  {
    q: "Why can't it auto-check LinkedIn, X or Instagram?",
    a: "Those sites block automated username lookups from the browser, both technically (CORS) and in their terms of service. Rather than show you a fake “available” badge, we link you straight to each profile URL so you can confirm in a click — honestly.",
  },
  {
    q: "Why does a consistent handle matter?",
    a: "Using the same handle everywhere makes you easy to find and remember, and it stops someone else from claiming your name on a platform you'll want later. It's the difference between “I'm @jordanrivera everywhere” and a different scrambled username on each site.",
  },
  {
    q: "What if my handle is already taken?",
    a: "Try a short, professional variation — add your field or an initial. The LinkedIn URL Customizer can generate clean alternatives, and you can still claim your preferred name as a Vibe Resume portfolio URL.",
  },
  {
    q: "Is this tool free?",
    a: "Yes, completely free with no signup to check. You can optionally claim your handle as a portfolio URL on Vibe Resume.",
  },
];

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: PRIMARY_KEYWORD,
        applicationCategory: "UtilitiesApplication",
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
      <HandleChecker />

      <div className={styles.wrap}>
        <section className={`${styles.card} ${styles.section}`}>
          <h2>How it works</h2>
          <ol>
            <li>Type the handle you want to use across the web.</li>
            <li>We check GitHub live and link you to every other platform to confirm.</li>
            <li>Claim your handle as a portfolio URL before someone else does.</li>
          </ol>
        </section>

        <section className={`${styles.card} ${styles.section}`}>
          <h2>Why claim your handle early</h2>
          <p>
            A handle is first-come, first-served, and the good ones go fast. Locking in the same
            name across GitHub, your socials and your portfolio URL makes you instantly findable
            and consistent — recruiters and clients can guess where to find you. Leave it too long
            and you're stuck with a scrambled username on the platform that matters most, or paying
            someone to hand it back. A two-minute check now saves that headache later.
          </p>
        </section>

        {/* cross-links to the identity cluster */}
        <section className={`${styles.card} ${styles.section}`}>
          <h2>Related tools</h2>
          <ul>
            <li><a href="/tools/linkedin-url-customizer">LinkedIn URL Customizer</a></li>
            <li><a href="/tools/github-to-portfolio">GitHub → Portfolio Generator</a></li>
            <li><a href="/tools/resume-qr-code-generator">Resume QR Code Generator</a></li>
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
