"use client";

import { useEffect, useState } from "react";
import styles from "./chrome.module.css";

type Mode = "system" | "light" | "dark";

const OPTIONS: { mode: Mode; label: string; Icon: () => React.ReactElement }[] = [
  { mode: "system", label: "System theme", Icon: MonitorIcon },
  { mode: "light", label: "Light theme", Icon: SunIcon },
  { mode: "dark", label: "Dark theme", Icon: MoonIcon },
];

/** Apply a mode to the document + persist it. System clears the override. */
function apply(mode: Mode) {
  const root = document.documentElement;
  try {
    if (mode === "system") {
      root.removeAttribute("data-theme");
      localStorage.removeItem("theme");
    } else {
      root.setAttribute("data-theme", mode);
      localStorage.setItem("theme", mode);
    }
  } catch { /* storage blocked — still reflect on the document */
    if (mode === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
  }
}

export default function ThemeToggle() {
  // Server renders "system"; the real saved value is read after mount to avoid
  // a hydration mismatch (the actual theme is already applied by the init script).
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    let saved: Mode = "system";
    try {
      const t = localStorage.getItem("theme");
      if (t === "light" || t === "dark") saved = t;
    } catch { /* ignore */ }
    setMode(saved);
  }, []);

  function choose(next: Mode) {
    apply(next);
    setMode(next);
  }

  return (
    <div className={styles.themeToggle} role="group" aria-label="Theme">
      {OPTIONS.map(({ mode: m, label, Icon }) => (
        <button
          key={m}
          type="button"
          className={`${styles.themeBtn} ${mode === m ? styles.themeBtnOn : ""}`}
          aria-label={label}
          aria-pressed={mode === m}
          title={label}
          onClick={() => choose(m)}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}

/* ---- icons (16px, inherit currentColor) ---- */
const svg = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

function SunIcon() {
  return (
    <svg {...svg}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg {...svg}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
function MonitorIcon() {
  return (
    <svg {...svg}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}
