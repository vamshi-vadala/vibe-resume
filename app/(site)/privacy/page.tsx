import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy — Vibe Resume",
  description: "How Vibe Resume handles your data: resume content is processed in your browser and never uploaded to our servers.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className={styles.wrap}>
      <h1>Privacy Policy</h1>
      <p className={styles.updated}>Last updated: 7 June 2026</p>

      <p className={styles.note}>
        The short version: the tools run entirely in your browser. Your resume and the files you
        open are <strong>never uploaded to our servers</strong>. The only personal data we ever
        store is the email you choose to give us when signing in to claim a handle.
      </p>

      <h2>Your resume stays on your device</h2>
      <p>
        Every tool processes your content <strong>locally, in your browser</strong>. When you upload
        a PDF or paste resume text, it is parsed and rendered on your device — it is not sent to,
        stored on, or seen by our servers.
      </p>

      <h2>Public data you look up</h2>
      <p>
        Tools that read a GitHub username or check a handle call the relevant public API
        (for example GitHub&apos;s) <strong>directly from your browser</strong>. We don&apos;t proxy
        those requests and we don&apos;t store the results.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account email</strong> — only if you sign in to claim a handle. We use Supabase to send a one-tap magic link to the email you provide and to associate any handles you reserve with your account. No password is stored.</li>
        <li><strong>Reserved handles</strong> — any <code>viberesume.in/&#123;handle&#125;</code> slug you claim is stored against your account.</li>
        <li><strong>Anonymous usage analytics</strong> — via PostHog, we collect which pages and tools are used (and approximate, IP-derived location/device) to improve the product. It isn&apos;t tied to your resume content.</li>
        <li><strong>Local preferences</strong> — your light/dark theme choice is saved in your browser&apos;s <code>localStorage</code>; PostHog may set cookies.</li>
      </ul>

      <h2>What we don&apos;t do</h2>
      <ul>
        <li>We don&apos;t upload, read or store your resume content.</li>
        <li>We don&apos;t sell or rent your data.</li>
        <li>We don&apos;t require an account to use any tool.</li>
      </ul>

      <h2>Your choices</h2>
      <p>
        Don&apos;t sign in if you&apos;d rather not share an email — every tool works without one.
        You can clear cookies and <code>localStorage</code> at any time, and ask us to delete your
        account and any reserved handles via the <a href="/contact">contact page</a>.
      </p>

      <h2>Changes</h2>
      <p>We may update this policy as the product evolves; the date above reflects the latest version.</p>
    </main>
  );
}
