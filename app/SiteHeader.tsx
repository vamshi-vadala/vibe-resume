"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOOLS } from "@/lib/tools.ts";
import ThemeToggle from "./ThemeToggle";
import styles from "./chrome.module.css";

const SIGNUP = "/signup?utm_source=nav&utm_campaign=header";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close the menu on route change, Escape, or an outside click.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onClick);
    };
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} aria-label="Vibe Resume home">
          <span className={styles.mark} aria-hidden />
          <span className={styles.brandName}>Vibe Resume</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <ThemeToggle />
          <div className={styles.menuWrap} ref={menuRef}>
            <button
              type="button"
              className={styles.menuBtn}
              aria-expanded={open}
              aria-haspopup="true"
              onClick={() => setOpen((v) => !v)}
            >
              Tools <span className={styles.caret} aria-hidden>▾</span>
            </button>
            {open && (
              <div className={styles.menu} role="menu">
                {TOOLS.map((t) => {
                  const active = pathname === t.href;
                  return (
                    <Link
                      key={t.href}
                      href={t.href}
                      role="menuitem"
                      className={`${styles.menuItem} ${active ? styles.menuItemActive : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className={styles.menuItemName}>{t.nav}</span>
                      <span className={styles.menuItemDesc}>{t.desc}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Link href={SIGNUP} className={styles.cta}>Get started</Link>
        </nav>
      </div>
    </header>
  );
}
