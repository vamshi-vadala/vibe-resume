import Link from "next/link";
import { TOOLS } from "@/lib/tools.ts";
import styles from "./chrome.module.css";

// Server component — a static link mesh on every page (good for users and SEO).
export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.brand} aria-label="Vibe Resume home">
            <span className={styles.mark} aria-hidden />
            <span className={styles.brandName}>Vibe Resume</span>
          </Link>
          <p className={styles.footerTag}>Free tools to turn your resume and profile into a website.</p>
        </div>

        <nav className={styles.footerCol} aria-label="Tools">
          <span className={styles.footerHead}>Tools</span>
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className={styles.footerLink}>{t.name}</Link>
          ))}
        </nav>

        <nav className={styles.footerCol} aria-label="Vibe Resume">
          <span className={styles.footerHead}>Vibe Resume</span>
          <Link href="/" className={styles.footerLink}>Home</Link>
          <Link href="/signup?utm_source=nav&utm_campaign=footer" className={styles.footerLink}>Publish your resume</Link>
        </nav>
      </div>
      <div className={styles.footerBase}>© {new Date().getFullYear()} Vibe Resume</div>
    </footer>
  );
}
