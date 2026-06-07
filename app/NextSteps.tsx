import Link from "next/link";
import { TOOLS } from "@/lib/tools.ts";
import ToolIcon from "./ToolIcon";
import styles from "./nextsteps.module.css";

// Contextual "what's next" per tool (slug -> suggested next tool slugs), so a
// result nudges the visitor along a natural workflow instead of dead-ending.
const NEXT: Record<string, string[]> = {
  "pdf-resume-to-website": ["theme-picker", "resume-qr-code-generator", "portfolio-about-me-generator"],
  "github-to-portfolio": ["theme-picker", "portfolio-about-me-generator", "resume-qr-code-generator"],
  "developer-resume-to-portfolio": ["theme-picker", "github-to-portfolio", "resume-qr-code-generator"],
  "ats-plain-text-converter": ["pdf-resume-to-website", "linkedin-url-customizer"],
  "theme-picker": ["pdf-resume-to-website", "portfolio-about-me-generator"],
  "portfolio-about-me-generator": ["case-study-template", "theme-picker", "pdf-resume-to-website"],
  "case-study-template": ["portfolio-about-me-generator", "theme-picker", "pdf-resume-to-website"],
  "portfolio-handle-checker": ["linkedin-url-customizer", "resume-qr-code-generator", "pdf-resume-to-website"],
  "linkedin-url-customizer": ["portfolio-handle-checker", "resume-qr-code-generator"],
  "resume-qr-code-generator": ["portfolio-handle-checker", "pdf-resume-to-website"],
};

export default function NextSteps({ from }: { from: string }) {
  const items = (NEXT[from] ?? [])
    .map((slug) => TOOLS.find((t) => t.href === `/tools/${slug}`))
    .filter((t): t is (typeof TOOLS)[number] => Boolean(t));
  if (items.length === 0) return null;

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Next step</span>
      <div className={styles.grid}>
        {items.map((t) => (
          <Link key={t.href} href={t.href} className={styles.item}>
            <span className={styles.icon}><ToolIcon name={t.icon} size={18} /></span>
            <span>{t.nav}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
