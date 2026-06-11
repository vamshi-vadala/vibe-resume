import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS, TOOL_GROUPS } from "@/lib/tools.ts";
import HomeAccountBand from "./HomeAccountBand";
import ToolIcon from "./ToolIcon";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Vibe Resume — Free Tools to Turn Your Resume Into a Website",
  description:
    "Free, no-signup tools that turn resumes and profiles into shareable web pages — grouped by what you want to do: get online, polish your portfolio, and own your personal brand.",
  alternates: { canonical: "/" },
};

const STEPS = [
  { n: "1", title: "Pick a tool", body: "Choose the one that matches what you're trying to do." },
  { n: "2", title: "Paste or upload", body: "Drop in a resume, a link or a GitHub username — it all runs in your browser." },
  { n: "3", title: "Copy, download or publish", body: "Take the result anywhere, or claim your viberesume.in handle to host it." },
];

const TRUST = [
  "100% in your browser — nothing uploaded",
  "Free · no signup",
];

const REPO = "https://github.com/vamshi-vadala/vibe-resume";

export default function Home() {
  return (
    <div className={styles.wrap}>
      <HomeAccountBand />
      <header className={styles.hero}>
        <h1>Turn your resume into a website you own — free</h1>
        <p>
          Upload a resume or connect GitHub, claim <strong>viberesume.in/your-name</strong>,
          and share one clean link everywhere. Free tools for every step — no signup needed
          to try them.
        </p>
      </header>

      {/* how it works */}
      <ol className={styles.steps}>
        {STEPS.map((s) => (
          <li key={s.n} className={styles.step}>
            <span className={styles.stepNum}>{s.n}</span>
            <span className={styles.stepTitle}>{s.title}</span>
            <span className={styles.stepBody}>{s.body}</span>
          </li>
        ))}
      </ol>

      {/* honest trust signals */}
      <ul className={styles.trust}>
        {TRUST.map((t) => <li key={t} className={styles.trustItem}>{t}</li>)}
        <li className={styles.trustItem}>
          <a href={REPO} target="_blank" rel="noopener noreferrer">Open source ↗</a>
        </li>
        <li className={styles.trustItem}>
          <Link href="/example">See a live example ↗</Link>
        </li>
      </ul>

      {TOOL_GROUPS.map((g) => {
        const tools = TOOLS.filter((t) => t.group === g.id);
        return (
          <section key={g.id} className={styles.group} aria-labelledby={`group-${g.id}`}>
            <div className={styles.groupHead}>
              <h2 id={`group-${g.id}`} className={styles.groupTitle}>{g.title}</h2>
              <p className={styles.groupGoal}>{g.goal}</p>
            </div>
            <div className={styles.grid}>
              {tools.map((t) => (
                <Link key={t.href} href={t.href} className={`${styles.card} ${styles.cardLive}`}>
                  <span className={styles.cardIcon}><ToolIcon name={t.icon} /></span>
                  <span className={styles.cardName}>{t.name}</span>
                  <span className={styles.cardDesc}>{t.desc}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
