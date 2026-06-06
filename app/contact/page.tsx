import type { Metadata } from "next";
import styles from "../legal.module.css";

const REPO = "https://github.com/vamshi-vadala/vibe-resume";

export const metadata: Metadata = {
  title: "Contact — Vibe Resume",
  description: "Get in touch with Vibe Resume — questions, feedback and bug reports.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className={styles.wrap}>
      <h1>Contact</h1>
      <p className={styles.updated}>We&apos;d love your feedback.</p>

      <p>
        Found a bug, have an idea, or want a tool to do something it doesn&apos;t yet? The fastest
        way to reach us is on GitHub:
      </p>
      <ul>
        <li><a href={`${REPO}/issues`} target="_blank" rel="noopener noreferrer">Open an issue or feature request →</a></li>
        <li><a href={REPO} target="_blank" rel="noopener noreferrer">Browse the project on GitHub →</a></li>
      </ul>

      <h2>Product updates</h2>
      <p>
        Want to know when you can publish your resume as a hosted site? <a href="/signup">Join the
        waitlist</a> and we&apos;ll email you once — no spam.
      </p>

      <h2>Data requests</h2>
      <p>
        To have your waitlist email removed, open a request via the GitHub link above. See our{" "}
        <a href="/privacy">Privacy Policy</a> for what we do and don&apos;t collect.
      </p>
    </main>
  );
}
