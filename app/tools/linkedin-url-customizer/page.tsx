import type { Metadata } from "next";
import Customizer from "./Customizer";
import styles from "./customizer.module.css";

const PRIMARY_KEYWORD = "LinkedIn URL Customizer";
const SLUG = "/tools/linkedin-url-customizer";

export const metadata: Metadata = {
  title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
  description:
    "Turn your name into a clean, professional custom LinkedIn URL. Get ranked linkedin.com/in/you ideas instantly — free, no signup — and the steps to set it.",
  alternates: { canonical: SLUG },
  openGraph: {
    title: `${PRIMARY_KEYWORD} — Free Tool by Vibe Resume`,
    description: "Type your name, get clean custom LinkedIn URL options you can claim in a minute.",
    url: SLUG,
    type: "website",
  },
};

const FAQ = [
  {
    q: "What is a custom LinkedIn URL?",
    a: "By default LinkedIn gives your profile a messy address like linkedin.com/in/jordan-rivera-8a4b21902. A custom (or “vanity”) URL replaces that with something clean like linkedin.com/in/jordan-rivera — easier to share, put on a resume, and remember.",
  },
  {
    q: "How do I change my LinkedIn URL to a custom one?",
    a: "On desktop, open your profile, click “Edit public profile & URL” at the top right, then under “Edit your custom URL” click the pencil, type your new handle, and Save. Your new linkedin.com/in/yourname is live immediately.",
  },
  {
    q: "What characters can a LinkedIn custom URL contain?",
    a: "Between 3 and 100 letters or numbers — no spaces, symbols or special characters, and it isn't case-sensitive. Every suggestion this tool generates already follows those rules.",
  },
  {
    q: "Why is my preferred URL taken?",
    a: "Custom URLs are first-come, first-served and can't be reused once claimed. That's why this tool gives you several professional variations — an initial-plus-surname or specialty version is usually still available.",
  },
  {
    q: "Is this tool free?",
    a: "Completely free, with no signup to generate and copy URLs. You can optionally claim a matching vibe.resume/yourname for a real personal website.",
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
      <Customizer />

      <div className={styles.wrap}>
        <section className={`${styles.card} ${styles.section}`}>
          <h2>How to change your LinkedIn URL</h2>
          <ol>
            <li>Generate and copy a clean handle above.</li>
            <li>On LinkedIn (desktop), open your profile and click <strong>Edit public profile &amp; URL</strong>.</li>
            <li>Under <strong>Edit your custom URL</strong>, click the pencil, paste your new handle and <strong>Save</strong>.</li>
            <li>Share your tidy <strong>linkedin.com/in/you</strong> everywhere — resume, email signature, business card.</li>
          </ol>
        </section>

        <section className={`${styles.card} ${styles.section}`}>
          <h2>Why your LinkedIn URL matters</h2>
          <p>
            Your profile URL is one of the first things a recruiter copies onto a shortlist and
            one of the few links you fully control. The default string of random digits looks
            unfinished and is impossible to dictate over a call; a clean, name-based handle reads
            as professional, ranks better for your name in search, and fits neatly on a one-page
            resume. It takes a minute to set and you only get to pick a great one before someone
            else does — so lock in a clean version of your name today.
          </p>
        </section>

        {/* cross-links to sibling tools in the cluster */}
        <section className={`${styles.card} ${styles.section}`}>
          <h2>Related tools</h2>
          <ul>
            <li><a href="/tools/pdf-resume-to-website">PDF Resume → Website Converter</a></li>
            <li><a href="/tools/github-to-portfolio">GitHub → Portfolio Generator</a></li>
            <li><a href="/tools/theme-picker">Dev Portfolio Theme Picker</a></li>
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
