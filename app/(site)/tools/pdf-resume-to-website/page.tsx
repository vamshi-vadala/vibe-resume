import type { Metadata } from "next";
import Converter from "./Converter";
import styles from "./converter.module.css";

const PRIMARY_KEYWORD = "PDF Resume to Website Converter";
const SLUG = "/tools/pdf-resume-to-website";

export const metadata: Metadata = {
  title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
  description:
    "Turn your PDF resume into a clean personal website in seconds. Upload your resume and instantly preview it as a live, mobile-friendly web page — free, no signup.",
  alternates: { canonical: SLUG },
  openGraph: {
    title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
    description:
      "Upload a PDF resume and watch it become a polished personal website preview — then publish it in one click.",
    url: SLUG,
    type: "website",
    siteName: "Vibe Resume",
  },
};

const FAQ = [
  {
    q: "How do I turn my PDF resume into a website?",
    a: "Upload your PDF on this page. Everything runs in your browser — we read the text layer of your resume, detect your name, contact details and sections (summary, experience, skills), and lay them out as a clean, responsive personal website you can preview instantly.",
  },
  {
    q: "Is my resume uploaded to a server?",
    a: "No. Parsing happens entirely client-side in your browser using a self-hosted PDF reader. Your file never leaves your device, so it's safe to use with a resume that contains personal contact information.",
  },
  {
    q: "My PDF didn't convert well — why?",
    a: "If your resume was scanned or exported as an image, it has no selectable text layer for the tool to read. Re-export it from Word, Google Docs or your resume builder as a normal text PDF and it will parse cleanly. Heavy multi-column layouts can also scramble the reading order.",
  },
  {
    q: "Is this free, and can I publish the site?",
    a: "The converter and preview are completely free with no signup. When you're happy with the preview you can publish it as a live, shareable page on Vibe Resume with your own URL.",
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
            <li>Upload your resume PDF (or click &ldquo;Try a sample&rdquo; to see it in action).</li>
            <li>We read the text in your browser and detect your name, contact info and sections.</li>
            <li>Preview your resume as a clean website — then publish it as a live page in one click.</li>
          </ol>
        </section>

        {/* cross-links to sibling tools in the cluster (internal-link mesh) */}
        <section className={styles.card}>
          <h2>Related tools</h2>
          <ul>
            <li><a href="/tools/ats-plain-text-converter">ATS Plain-Text Resume Converter</a></li>
            <li><a href="/tools/developer-resume-to-portfolio">Developer Resume → Portfolio</a></li>
            <li><a href="/tools/github-to-portfolio">GitHub → Portfolio Converter</a></li>
            <li><a href="/tools/theme-picker">Dev Portfolio Themes</a></li>
            <li><a href="/tools/linkedin-url-customizer">LinkedIn URL Customizer</a></li>
            <li><a href="/tools/resume-qr-code-generator">Resume QR Code Generator</a></li>
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
