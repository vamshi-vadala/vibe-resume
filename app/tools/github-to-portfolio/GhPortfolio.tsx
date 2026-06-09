import type { GhProfile } from "@/lib/ghportfolio.ts";
import styles from "./converter.module.css";

// Render component for the GitHub portfolio. Used by both the in-browser
// preview in Converter.tsx and the server-rendered public profile in
// app/[slug]/page.tsx (when stored payload kind is "github").

export default function GhPortfolio({ profile }: { profile: GhProfile }) {
  const stats = [
    profile.publicRepos ? `${profile.publicRepos.toLocaleString()} repos` : null,
    profile.followers ? `${profile.followers.toLocaleString()} followers` : null,
    profile.location,
    profile.company,
  ].filter(Boolean) as string[];

  return (
    <article className={styles.site}>
      <header className={styles.siteHero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.avatar} src={profile.avatarUrl} alt={profile.name} width={88} height={88} />
        <div className={styles.heroBody}>
          <h1 className={styles.siteName}>{profile.name}</h1>
          <p className={styles.headline}>{profile.headline}</p>
          {stats.length > 0 && <p className={styles.stats}>{stats.join("  ·  ")}</p>}
          <div className={styles.linkRow}>
            <a className={styles.link} href={profile.githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>
            {profile.links.map((l, i) => (
              <a key={i} className={styles.link} href={l.url} target="_blank" rel="noopener noreferrer">
                {l.kind === "twitter" ? "Twitter" : "Website"}
              </a>
            ))}
          </div>
        </div>
      </header>

      {profile.about && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>About</h2>
          <p className={styles.about}>{profile.about}</p>
        </section>
      )}

      {profile.stack.length > 0 && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>Tech stack</h2>
          <div className={styles.chips}>
            {profile.stack.map((s, i) => <span key={i} className={styles.chip}>{s}</span>)}
          </div>
        </section>
      )}

      {profile.repos.length > 0 && (
        <section className={styles.siteSection}>
          <h2 className={styles.siteH2}>Featured projects</h2>
          <div className={styles.repos}>
            {profile.repos.map((r, i) => (
              <article key={i} className={styles.repoCard}>
                {r.thumbnail && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img className={styles.repoThumb} src={r.thumbnail} alt="" loading="lazy" />
                )}
                <div className={styles.repoBody}>
                  <a className={styles.repoName} href={r.url} target="_blank" rel="noopener noreferrer">{r.name}</a>
                  {r.description && <p className={styles.repoDesc}>{r.description}</p>}
                  {r.topics && r.topics.length > 0 && (
                    <div className={styles.topics}>
                      {r.topics.slice(0, 4).map((t, k) => <span key={k} className={styles.topic}>{t}</span>)}
                    </div>
                  )}
                  <div className={styles.repoMeta}>
                    {r.language && <span>{r.language}</span>}
                    {typeof r.stars === "number" && r.stars > 0 && <span>★ {r.stars.toLocaleString()}</span>}
                    <span className={styles.repoLinks}>
                      {r.homepage && <a href={r.homepage} target="_blank" rel="noopener noreferrer">Live demo ↗</a>}
                      <a href={r.url} target="_blank" rel="noopener noreferrer">Code ↗</a>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
