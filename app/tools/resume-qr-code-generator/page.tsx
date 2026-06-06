import type { Metadata } from "next";
import Generator from "./Generator";
import styles from "./generator.module.css";

const PRIMARY_KEYWORD = "Resume QR Code Generator";
const SLUG = "/tools/resume-qr-code-generator";

export const metadata: Metadata = {
  title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
  description:
    "Make a QR code for your resume, portfolio or LinkedIn in seconds. Enter a link, pick a color, and download a crisp PNG or SVG — free, no signup.",
  alternates: { canonical: SLUG },
  openGraph: {
    title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
    description: "Turn your resume or portfolio link into a downloadable QR code. Free and instant.",
    url: SLUG,
    type: "website",
  },
};

const FAQ = [
  {
    q: "How do I make a QR code for my resume?",
    a: "Paste the link you want it to open — your portfolio, LinkedIn profile or an online resume — pick a color, and download the QR as a PNG or SVG. Add it to your CV, business card, slides or email signature so anyone can scan straight through to you.",
  },
  {
    q: "What should the QR code point to?",
    a: "Point it at a single page you control and won't move — ideally your own portfolio URL. Linking to a profile you might change later (or a file that gets re-uploaded) risks a dead QR. A permanent personal URL keeps the code working forever.",
  },
  {
    q: "PNG or SVG — which should I download?",
    a: "Use the PNG for documents, slides and the web. Use the SVG when you're printing — business cards, posters or anything large — because it stays razor-sharp at any size.",
  },
  {
    q: "Will the QR code expire or stop working?",
    a: "No. The code is generated in your browser and simply encodes your link directly — there's no redirect or account that can lapse. It works as long as the destination URL works.",
  },
  {
    q: "Is this tool free?",
    a: "Completely free, with no signup to generate and download your QR code. You can optionally claim a permanent vibe.resume URL so your code always points to an address you own.",
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
      <Generator />

      <div className={styles.wrap}>
        <section className={`${styles.card} ${styles.section}`}>
          <h2>How it works</h2>
          <ol>
            <li>Paste the link you want the QR code to open.</li>
            <li>Pick a color that fits your resume or brand.</li>
            <li>Download a PNG for documents or an SVG for print — and put it anywhere.</li>
          </ol>
        </section>

        <section className={`${styles.card} ${styles.section}`}>
          <h2>Why put a QR code on your resume</h2>
          <p>
            A printed resume is a dead end — a recruiter can read it, but they can't click it.
            A QR code bridges that gap: one scan takes them from paper to your live portfolio,
            where your work actually shines. It also turns every business card, conference badge
            and slide into a pointer back to your domain. The trick is to make it point somewhere
            permanent and yours, so the code keeps working long after you've changed jobs or
            redesigned your site.
          </p>
        </section>

        {/* cross-links to sibling tools in the cluster */}
        <section className={`${styles.card} ${styles.section}`}>
          <h2>Related tools</h2>
          <ul>
            <li><a href="/tools/pdf-resume-to-website">PDF Resume → Website Converter</a></li>
            <li><a href="/tools/linkedin-url-customizer">LinkedIn URL Customizer</a></li>
            <li><a href="/tools/portfolio-about-me-generator">Portfolio About Me Generator</a></li>
            <li><a href="/tools/portfolio-handle-checker">Portfolio Handle Checker</a></li>
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
