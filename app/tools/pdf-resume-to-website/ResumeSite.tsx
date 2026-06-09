import type { ResumeData } from "@/lib/resume";
import { getTheme, themeStyle } from "@/lib/themes.ts";
import styles from "./converter.module.css";

/** The generated personal website — a single polished, responsive template.
 *  Pure render; consumed both by the in-browser Converter preview and by the
 *  server-rendered public profile at `app/[slug]/page.tsx`. */
export default function ResumeSite({
  data,
  photoUrl,
  themeId,
}: {
  data: ResumeData;
  photoUrl: string;
  themeId: string;
}) {
  const style = themeId ? (themeStyle(getTheme(themeId)) as React.CSSProperties) : undefined;
  return (
    <article className={styles.site} style={style}>
      <header className={styles.siteHero}>
        {photoUrl
          ? <img src={photoUrl} alt={data.name} className={styles.avatarPhoto} />
          : <div className={styles.avatar} aria-hidden>{initials(data.name)}</div>
        }
        <div>
          <h1 className={styles.siteName}>{data.name}</h1>
          {data.title && <p className={styles.siteRole}>{data.title}</p>}
          {data.contactLines.length > 0 && (
            <p className={styles.siteContact}>{data.contactLines.join("  ·  ")}</p>
          )}
        </div>
      </header>

      {data.summary && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>About</h2>
          <p className={styles.siteSummary}>{data.summary}</p>
        </section>
      )}

      {data.skills.length > 0 && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>Skills</h2>
          <div className={styles.chips}>
            {data.skills.map((s, i) => <span key={i} className={styles.chip}>{s}</span>)}
          </div>
        </section>
      )}

      {data.sections.map((sec, i) => (
        <section key={i} className={styles.siteSection}>
          <h2 className={styles.siteH2}>{sec.heading}</h2>
          {sec.entries ? (
            sec.entries.map((e, n) => (
              <div key={n} className={styles.siteEntry}>
                <div className={styles.siteEntryHead}>
                  {e.header && <span className={styles.siteEntryTitle}>{e.header}</span>}
                  {e.meta && <span className={styles.siteEntryMeta}>{e.meta}</span>}
                </div>
                {e.bullets.length > 0 && (
                  <ul className={styles.siteList}>
                    {e.bullets.map((b, k) => <li key={k}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))
          ) : (
            <ul className={styles.siteList}>
              {sec.items.map((it, n) => <li key={n}>{it}</li>)}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·";
}
