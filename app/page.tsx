import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS } from "@/lib/tools.ts";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Vibe Resume — Free Tools to Turn Your Resume Into a Website",
  description:
    "Free, no-signup tools that turn resumes and profiles into shareable web pages — starting with the ATS Plain-Text Resume Converter.",
  alternates: { canonical: "/" },
};

const LIVE = TOOLS;

const SOON: { name: string; desc: string }[] = [];

export default function Home() {
  return (
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <h1>Turn your resume into a website — free</h1>
        <p>
          Small, no-signup tools that fix and publish your resume and profile online.
          Start with the one that&apos;s live today.
        </p>
      </header>

      <div className={styles.sectionTitle}>Available now</div>
      <div className={styles.grid}>
        {LIVE.map((t) => (
          <Link key={t.href} href={t.href} className={`${styles.card} ${styles.cardLive}`}>
            <div className={styles.cardHead}>
              <span className={styles.cardName}>{t.name}</span>
              <span className={`${styles.badge} ${styles.badgeLive}`}>Live</span>
            </div>
            <span className={styles.cardDesc}>{t.desc}</span>
          </Link>
        ))}
      </div>

      {SOON.length > 0 && (
        <>
          <div className={styles.sectionTitle}>Coming soon</div>
          <div className={styles.grid}>
            {SOON.map((t) => (
              <div key={t.name} className={`${styles.card} ${styles.cardSoon}`}>
                <div className={styles.cardHead}>
                  <span className={styles.cardName}>{t.name}</span>
                  <span className={`${styles.badge} ${styles.badgeSoon}`}>Soon</span>
                </div>
                <span className={styles.cardDesc}>{t.desc}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
