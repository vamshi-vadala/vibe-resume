# Vibe Resume

A suite of free, SEO-driven micro-tools that turn resumes and profiles into shareable web pages — each tool an indexed landing page that funnels to the Vibe Resume product.

This repo is the implementation of that programmatic-SEO plan. **Three tools are built so far**, plus an email waitlist with a real backend and the reusable patterns (SEO metadata, JSON-LD, conversion tracking, theming, e2e tests) the rest of the cluster reuses.

## Built so far

### PDF Resume → Website — `/tools/pdf-resume-to-website`

The flagship. Upload a PDF resume and instantly preview it as a clean, responsive personal website.

- **100% client-side parsing** — the PDF's text layer is read in the browser with a
  self-hosted [pdf.js](https://mozilla.github.io/pdf.js/) worker; the file never leaves the
  device (safe for a resume full of personal contact info).
- **Structured extraction** — `lib/resume.ts` is a pure, dependency-free parser that turns
  raw text into `{ name, title, contactLines, summary, sections, skills }` using
  heading-keyword + contact-regex heuristics, grouping PDF text items into lines by
  y-position. Includes column-aware (gutter) extraction, letter-spacing recovery, per-role
  **experience grouping** (date-anchored), and best-effort **headshot extraction**.
- **Polished website preview** — name + avatar (photo or initials), role, contact, About,
  skill chips and per-role experience blocks, rendered inside a faux browser frame. All
  surfaces use the shared semantic theme tokens (WCAG-AA in light & dark).
- **Graceful failure** — scanned/image-only PDFs (no text layer) get a friendly re-export
  message instead of a crash.
- **Result-gated CTA + tracking** — funnel events (`tool_started`, `tool_completed`,
  `result_interacted`, `cta_clicked`) and UTM-tagged "Publish on Vibe Resume" CTAs, stamped
  with `tool_slug: "pdf-resume-to-website"`.

### ATS Plain-Text Resume Converter — `/tools/ats-plain-text-converter`

Shows a resume the way an Applicant Tracking System (ATS) actually parses it, side by side with what the human wrote, and scores how ATS-friendly it is.

- **Human view vs Robot view** — paste resume text (or upload a `.txt`) and see the cleaned plain-text an ATS would read.
- **ATS conversion** — strips smart quotes, em-dashes, non-breaking/zero-width spaces; normalizes decorative bullets to `-`; flattens multi-column/table layouts; flags emoji/non-ASCII.
- **0–100 score + grade** with weighted, prioritized recommendations, visually split into:
  - **✓ Done for you** — fixes already applied to the copyable output.
  - **✎ Edit your resume** — structural issues to fix in your source file (missing email/phone, weak section headings, columns, missing dates).
- **Result-gated CTA** — "Publish on Vibe Resume" appears only after a result exists, UTM-tagged.
- **Conversion tracking** — `page_view`, `tool_started`, `tool_completed`, `result_interacted`, `cta_clicked` pushed to `dataLayer`, each stamped with `tool_slug`.

### Developer Resume → Portfolio — `/tools/developer-resume-to-portfolio`

Paste a developer resume and flip it into a portfolio: GitHub, project repos and tech stack, pulled out and laid out automatically.

- **Dev-specific extraction** — `lib/devresume.ts` builds on `lib/resume.ts` and adds:
  - **tech stack** detection (80+ languages/frameworks/tools, whole-token, canonical casing,
    with redundant-term suppression like *Spring* vs *Spring Boot*);
  - **GitHub** detection — every distinct profile handle plus `owner/repo` links;
  - **profile links** — LinkedIn, Stack Overflow, GitLab, personal site, etc.
- **Live GitHub repo-pull** — when the resume names a GitHub profile, the tool fetches that
  user's real public repos from the GitHub API **client-side** (the visitor's own rate
  limit; keeps the app static), ranks them by stars (forks/archived dropped), and renders
  rich cards with description, language and ★ stars. Bounded by a 5s `AbortController` so a
  slow/blocked network falls back to resume-listed repos instead of hanging. Repos are
  pulled from **every** profile found, not just the first.
- **Full portfolio** — hero (name, headline, summary, links), tech-stack chips, per-role
  **Experience**, and a **Projects** section (live + resume-listed repos).
- **Result-gated CTA + tracking** — same funnel, stamped `tool_slug: "developer-resume-to-portfolio"`.

### Email waitlist — `/signup` + `/api/waitlist`

Every tool's "Publish" CTA lands on `/signup`, a waitlist capture for the upcoming publish-your-resume feature.

- **Real capture** — the form POSTs to `/api/waitlist`, a Next.js Route Handler that
  validates the email and `SADD`s it to an **Upstash Redis** set via the REST API
  (dependency-free `fetch`, no backend server). De-dupes automatically.
- **Admin read** — `GET /api/waitlist` returns `{ count, emails }`, but only when the
  request carries the `WAITLIST_ADMIN_TOKEN` secret (`Authorization: Bearer <token>` or
  `?key=<token>`); otherwise `401`. Prevents public harvesting of collected emails.
- Requires `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (see [Environment](#environment)).

### Reusable foundations (applied here, reused by future tools)

- **SEO template** — exact-match `<h1>`, `/tools/{kebab-keyword}` slug, OpenGraph (+ per-tool
  `opengraph-image`), canonical, `app/sitemap.ts`, and `SoftwareApplication` + `FAQPage`
  JSON-LD (XSS-sanitized).
- **Light/dark theming** — semantic color tokens with adaptive on-color tokens, all WCAG-AA (4.5:1) verified.
- **Pure, testable logic** — `lib/ats.ts`, `lib/resume.ts`, `lib/devresume.ts` hold the
  analysis as dependency-free functions, covered by the Node test runner.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19, TypeScript
- CSS Modules + CSS custom properties for theming
- [Upstash Redis](https://upstash.com) (REST) for the waitlist
- Node's built-in test runner for pure-logic unit tests
- [Playwright](https://playwright.dev) + [axe-core](https://github.com/dequelabs/axe-core) for theme/contrast e2e tests

## Project structure

```
app/
  globals.css                         # theme tokens (light + dark)
  sitemap.ts                          # lists all live tool URLs
  signup/
    page.tsx                          # waitlist landing
    WaitlistForm.tsx                  # client form → POST /api/waitlist
  api/waitlist/route.ts               # POST add email / GET admin read (Upstash)
  tools/ats-plain-text-converter/
    page.tsx Converter.tsx converter.module.css opengraph-image.tsx
  tools/pdf-resume-to-website/
    page.tsx Converter.tsx converter.module.css opengraph-image.tsx
  tools/developer-resume-to-portfolio/
    page.tsx Converter.tsx converter.module.css opengraph-image.tsx
lib/
  ats.ts                              # pure ATS analysis logic
  resume.ts                           # pure resume text → structured website data
  devresume.ts                        # pure dev-resume → portfolio logic (stack, GitHub, links)
public/
  pdf.worker.min.mjs                  # self-hosted pdf.js worker (see note below)
test/
  resume.unit.test.ts                 # resume parser unit + (CI-skipped) sample regressions
  devresume.unit.test.ts              # dev-resume logic unit tests
e2e/
  theme.spec.ts                       # ATS: computed-style + axe contrast tests
  pdf-tool.spec.ts                    # PDF→website: computed-style + axe contrast tests
  devresume-tool.spec.ts              # Dev→portfolio: render + axe (stubs the GitHub API)
playwright.config.ts                  # runs tests in light & dark schemes
```

> **pdf.js worker:** `public/pdf.worker.min.mjs` is copied from
> `node_modules/pdfjs-dist/build/` so its version matches the installed `pdfjs-dist` API.
> It's self-hosted (not loaded from a CDN) to avoid a third-party runtime script and keep
> parsing fully local. **Re-copy it after upgrading `pdfjs-dist`:**
> `cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/`

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000/tools/developer-resume-to-portfolio](http://localhost:3000/tools/developer-resume-to-portfolio) and click **"Try a sample"**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (run locally before every push — it's the only TS gate) |
| `npm start` | Serve the production build |
| `npm run test:unit` | Pure-logic unit tests (Node test runner, fast) |
| `npm run test:e2e` | Playwright theme + contrast tests (light & dark) |
| `npm test` | `test:unit` then `test:e2e` |

## Environment

All `NEXT_PUBLIC_*` vars are embedded at build time; the CI workflow's `vercel pull` fetches
them from the Vercel project before building, so set them in Vercel for production/preview.

### Analytics (PostHog)

PostHog captures pageviews and the funnel events (each tagged with `tool_slug`). Wiring lives
in `app/providers.tsx`; the `track()` helper in each `Converter.tsx` forwards events. Gated on
an env var, so the app runs fine without it (events become no-ops).

| Variable | Example | Where |
|----------|---------|-------|
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_...` (PostHog project key) | Vercel env (Production + Preview) + local `.env.local` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | same |

> ⚠️ **Do not mark the PostHog vars as "Sensitive" in Vercel.** Sensitive vars are withheld
> from the build, which silently breaks `NEXT_PUBLIC_` inlining (the key won't reach the
> browser and PostHog won't load). Add them as normal plaintext vars. The `phc_` project key
> is publishable/client-side by design, so this is safe.

### Waitlist (Upstash Redis)

Server-side only — **never** prefix these with `NEXT_PUBLIC_`. Create a Redis database at
[console.upstash.com](https://console.upstash.com) and copy its **REST** URL + token.

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint for the waitlist set |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `WAITLIST_ADMIN_TOKEN` | Secret required to read the collected emails via `GET /api/waitlist` |

> Export the list any time: `SMEMBERS waitlist` in the Upstash console, or
> `curl -H "Authorization: Bearer $WAITLIST_ADMIN_TOKEN" https://<host>/api/waitlist`.

## Roadmap

Next tools in the cluster (priority order): **ThemeDeck** (portfolio theme picker),
**GitHub → Portfolio** (username → live repos), Profile URL Slug Generator, AboutMeAI,
Resume QR, CaseCrafter, Portfolio Handle Checker — all built on the template above with an
internal-link mesh between them. (PDF Resume → Website, the ATS Converter, and Developer
Resume → Portfolio are live.)
