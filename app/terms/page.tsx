import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Terms of Service — Vibe Resume",
  description: "The terms for using Vibe Resume's free resume and portfolio tools.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className={styles.wrap}>
      <h1>Terms of Service</h1>
      <p className={styles.updated}>Last updated: 7 June 2026</p>

      <p>
        By using Vibe Resume (the &quot;Service&quot;) you agree to these terms. If you don&apos;t
        agree, please don&apos;t use the tools.
      </p>

      <h2>The Service</h2>
      <p>
        Vibe Resume offers free, browser-based tools that help you turn a resume or profile into
        web-ready content. The tools are provided <strong>&quot;as is&quot; and &quot;as available&quot;</strong>,
        without warranties of any kind. The &quot;publish your resume&quot; feature referenced in the
        tools is upcoming — joining the waitlist does not guarantee access or a delivery date.
      </p>

      <h2>Your content and output</h2>
      <p>
        You keep ownership of everything you put in and the output you generate. You&apos;re
        responsible for ensuring your content is lawful and accurate, and for how you use the
        results. We don&apos;t claim any rights over your resume or generated material.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Don&apos;t use the Service for unlawful purposes or to infringe others&apos; rights.</li>
        <li>Don&apos;t attempt to disrupt, attack, scrape abusively, or reverse-engineer the Service.</li>
        <li>Don&apos;t misuse third-party data the tools surface (e.g. respect GitHub&apos;s and other platforms&apos; terms).</li>
      </ul>

      <h2>Availability and changes</h2>
      <p>
        We may add, change, or discontinue tools at any time, and we may update these terms as the
        product evolves. Continued use after a change means you accept the updated terms.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Vibe Resume is not liable for any indirect,
        incidental, or consequential damages arising from your use of the Service.
      </p>

      <h2>Contact</h2>
      <p>Questions about these terms? See the <a href="/contact">contact page</a>.</p>
    </main>
  );
}
