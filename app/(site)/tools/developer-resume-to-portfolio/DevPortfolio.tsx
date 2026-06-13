import type { DevProfile } from "@/lib/devresume.ts";
import type { Repo } from "@/lib/github.ts";
import styles from "./converter.module.css";

// Render component for the developer portfolio. Used by both the in-browser
// preview in Converter.tsx and the server-rendered public profile in
// app/[slug]/page.tsx (when stored payload kind is "developer").

const LINK_LABEL: Record<string, string> = {
  github: "GitHub", linkedin: "LinkedIn", website: "Website",
  stackoverflow: "Stack Overflow", twitter: "Twitter", gitlab: "GitLab", devpost: "Devpost",
};

export default function DevPortfolio({ data, repos }: { data: DevProfile; repos: Repo[] }) {
  const allLinks = [
    ...(data.githubUrl ? [{ kind: "github", label: data.githubUrl.replace(/^https?:\/\//, ""), url: data.githubUrl }] : []),
    ...data.links,
  ];
  return (
    <article className={styles.site}>
      <header className={styles.siteHero}>
        <h1 className={styles.siteName}>{data.name || "Your Name"}</h1>
        {data.headline && <p className={styles.siteRole}>{data.headline}</p>}
        {data.summary && <p className={styles.siteSummary}>{data.summary}</p>}
        {allLinks.length > 0 && (
          <div className={styles.linkRow}>
            {allLinks.map((l, i) => (
              <a key={i} className={styles.link} href={l.url} target="_blank" rel="noopener noreferrer">
                {LINK_LABEL[l.kind] ?? "Link"}
              </a>
            ))}
          </div>
        )}
      </header>

      {data.stack.length > 0 && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>Tech stack</h2>
          <div className={styles.chips}>
            {data.stack.map((s, i) => <span key={i} className={styles.chip}>{s}</span>)}
          </div>
        </section>
      )}

      {data.experience.length > 0 && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>Experience</h2>
          {data.experience.map((e, i) => (
            <div key={i} className={styles.entry}>
              <div className={styles.entryHead}>
                {e.header && <span className={styles.entryTitle}>{e.header}</span>}
                {e.meta && <span className={styles.entryMeta}>{e.meta}</span>}
              </div>
              {e.bullets.length > 0 && (
                <ul className={styles.entryList}>
                  {e.bullets.map((b, k) => <li key={k}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {(repos.length > 0 || data.projects.length > 0) && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>Projects</h2>
          {repos.length > 0 && (
            <div className={styles.repos}>
              {repos.map((r, i) => (
                <a key={i} className={styles.repoCard} href={r.url} target="_blank" rel="noopener noreferrer">
                  <div className={styles.repoName}>{r.name}</div>
                  {r.description && <div className={styles.repoDesc}>{r.description}</div>}
                  <div className={styles.repoMeta}>
                    {r.language && <span>{r.language}</span>}
                    {typeof r.stars === "number" && r.stars > 0 && <span>★ {r.stars}</span>}
                    <span className={styles.repoOwner}>{r.owner}/{r.name}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
          {data.projects.length > 0 && (
            <ul className={styles.entryList} style={{ marginTop: repos.length ? 14 : 0 }}>
              {data.projects.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          )}
        </section>
      )}
    </article>
  );
}
