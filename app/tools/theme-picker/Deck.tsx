"use client";

import { useCallback, useEffect, useState } from "react";
import posthog from "posthog-js";
import {
  THEMES, getTheme, nextIndex, prevIndex, themeStyle, SAMPLE, type Theme,
} from "@/lib/themes.ts";
import NextSteps from "../../NextSteps";
import styles from "./deck.module.css";

const TOOL_SLUG = "theme-picker";
const SIGNUP = `/signup?utm_source=tool&utm_campaign=${TOOL_SLUG}`;
// The cluster mechanic: a chosen theme hands off to the flagship PDF tool.
const buildHref = (themeId: string) =>
  `/tools/pdf-resume-to-website?theme=${themeId}&utm_source=tool&utm_campaign=${TOOL_SLUG}`;

type DataLayer = Array<Record<string, unknown>>;
function track(event: string, props: Record<string, unknown> = {}) {
  const payload = { tool_slug: TOOL_SLUG, ...props };
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.capture(event, payload);
  const w = window as unknown as { dataLayer?: DataLayer };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...payload });
}

export default function Deck() {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [liked, setLiked] = useState<string[]>([]);
  const [started, setStarted] = useState(false);

  const theme = THEMES[index];

  const begin = useCallback(() => {
    setStarted((s) => {
      if (!s) track("tool_started");
      return true;
    });
  }, []);

  const skip = useCallback(() => {
    begin();
    track("result_interacted", { action: "skip", theme: THEMES[index].id });
    setIndex((i) => nextIndex(i));
  }, [begin, index]);

  const like = useCallback(() => {
    begin();
    const picked = THEMES[index];
    setLiked((l) => (l.includes(picked.id) ? l : [...l, picked.id]));
    setChosen(picked.id);
    track("tool_completed", { theme: picked.id });
    setIndex((i) => nextIndex(i));
    requestAnimationFrame(() =>
      document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }, [begin, index]);

  // Tinder-style keyboard control: ← skip, → like.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") skip();
      else if (e.key === "ArrowRight") like();
      else if (e.key === "ArrowUp") { begin(); setIndex((i) => prevIndex(i)); }
      else if (e.key === "ArrowDown") { begin(); setIndex((i) => nextIndex(i)); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip, like, begin]);

  function goSignup(placement: string) {
    track("cta_clicked", { placement, theme: chosen ?? undefined });
    window.location.href = SIGNUP;
  }
  function useTheme(placement: string) {
    if (!chosen) return;
    track("cta_clicked", { placement, theme: chosen, destination: "pdf-resume-to-website" });
    window.location.href = buildHref(chosen);
  }

  const chosenTheme = chosen ? getTheme(chosen) : null;

  return (
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <h1>Dev Portfolio Theme Picker</h1>
        <p>
          Swipe through portfolio themes like a deck of cards. <strong>Skip</strong> what
          you don&apos;t like, <strong>keep</strong> the one you do — then take it straight to your resume.
        </p>
      </header>

      {/* DECK — one themed sample portfolio at a time */}
      <section className={styles.card}>
        <div className={styles.deckHead}>
          <div className={styles.deckTitle}>
            <span className={styles.themeName}>{theme.name}</span>
            <span className={styles.themeVibe}>{theme.vibe}</span>
          </div>
          <span className={styles.counter} aria-live="polite">
            {index + 1} / {THEMES.length}
          </span>
        </div>

        <div className={styles.stage}>
          <span className={`${styles.ghostCard} ${styles.ghost2}`} aria-hidden />
          <span className={`${styles.ghostCard} ${styles.ghost1}`} aria-hidden />
          <div className={styles.topCard} key={theme.id}>
            <ThemePreview theme={theme} />
          </div>
        </div>

        <div className={styles.tags}>
          {theme.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
        </div>

        <div className={styles.controls}>
          <button
            type="button" className={`${styles.swipeBtn} ${styles.skip}`}
            onClick={skip} aria-label={`Skip the ${theme.name} theme`}
          >
            ✕ Skip
          </button>
          <button
            type="button" className={`${styles.swipeBtn} ${styles.keep}`}
            onClick={like} aria-label={`Keep the ${theme.name} theme`}
          >
            ♥ Keep this
          </button>
        </div>
        <p className={styles.hint}>Tip: use ← and → arrow keys to swipe.</p>
      </section>

      {/* RESULT — only once a theme has been kept */}
      {chosenTheme && (
        <section className={styles.card} id="result">
          <div className={styles.resultHead}>
            <h2 className={styles.resultTitle}>Your theme: {chosenTheme.name}</h2>
            <span className={styles.resultSub}>
              {liked.length > 1 ? `${liked.length} kept · ` : ""}live preview
            </span>
          </div>

          <div className={styles.browser}>
            <div className={styles.browserBar}>
              <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
              <span className={styles.url}>vibe.resume/jordan</span>
            </div>
            <ThemePreview theme={chosenTheme} large />
          </div>

          <div className={styles.actions}>
            <button
              className={`${styles.btn} ${styles.primary} ${styles.btnLg}`}
              onClick={() => useTheme("result_primary")}
            >
              Use this theme on my resume →
            </button>
            <button
              className={`${styles.btn} ${styles.ghost}`}
              onClick={() => { setChosen(null); document.getElementById("deck-top")?.scrollIntoView(); }}
            >
              Keep browsing
            </button>
          </div>

          <NextSteps from="theme-picker" />
          <div className={styles.cta}>
            <p>Love this look? Publish your resume with the <strong>{chosenTheme.name}</strong> theme on Vibe Resume.</p>
            <button className={`${styles.btn} ${styles.accent}`} onClick={() => goSignup("sticky_result")}>
              Publish on Vibe Resume
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

/** The fixed sample portfolio, restyled by a theme's scoped --t-* tokens. */
function ThemePreview({ theme, large = false }: { theme: Theme; large?: boolean }) {
  const initials = SAMPLE.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  return (
    <article
      className={`${styles.site} ${large ? styles.siteLarge : ""}`}
      style={themeStyle(theme) as React.CSSProperties}
      id={large ? undefined : "deck-top"}
    >
      <span className={styles.cover} aria-hidden />
      <header className={styles.siteHero}>
        <span className={styles.avatar} aria-hidden>{initials}</span>
        <div>
          <h3 className={styles.siteName}>{SAMPLE.name}</h3>
          <p className={styles.headline}>{SAMPLE.headline}</p>
        </div>
      </header>

      <p className={styles.about}>{SAMPLE.about}</p>

      <div className={styles.chips}>
        {SAMPLE.stack.map((s) => <span key={s} className={styles.chip}>{s}</span>)}
      </div>

      <div className={styles.projects}>
        {SAMPLE.projects.map((p) => (
          <div key={p.name} className={styles.project}>
            <span className={styles.projectName}>{p.name}</span>
            <span className={styles.projectDesc}>{p.desc}</span>
            <span className={styles.projectMeta}>{p.meta}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
