import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS, TOOL_GROUPS } from "@/lib/tools.ts";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Vibe Resume — Free Tools to Turn Your Resume Into a Website",
  description:
    "Free, no-signup tools that turn resumes and profiles into shareable web pages — grouped by what you want to do: get online, polish your portfolio, and own your personal brand.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <h1>Turn your resume into a website — free</h1>
        <p>
          Small, no-signup tools for every step — get your resume online, make your
          portfolio shine, and own your personal brand.
        </p>
      </header>

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
