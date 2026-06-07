# Vibe Resume

A suite of free, SEO-driven micro-tools that turn resumes and profiles into shareable web pages — each tool an indexed landing page that funnels to the Vibe Resume product.

This repo is the implementation of that programmatic-SEO plan. **All 10 tools in the cluster are live**, plus a goal-grouped landing page, global navigation, a System/Light/Dark theme toggle, an email waitlist with a real backend, and the reusable patterns (SEO metadata, JSON-LD, conversion tracking, theming, e2e tests) every tool shares.

Everything runs **client-side and static** — the only server function is the waitlist route.

## The tools

The landing page groups all ten by user goal (driven from `lib/tools.ts`, so the header dropdown and footer mesh stay in sync):

### 🌐 Get your resume online

#### PDF Resume → Website — `/tools/pdf-resume-to-website`

The flagship. Upload a PDF resume and instantly preview it as a clean, responsive personal website.

- **100% client-side parsing** — the PDF's text layer is read in the browser with a self-hosted [pdf.js](https://mozilla.github.io/pdf.js/) worker; the file never leaves the device.
- **Structured extraction** — `lib/resume.ts` is a pure, dependency-free parser → `{ name, title, contactLines, summary, sections, skills }` with column-aware (gutter) extraction, letter-spacing recovery, date-anchored per-role **experience grouping**, and best-effort **headshot extraction**.
- **Polished preview** inside a faux browser frame; graceful message for scanned/image-only PDFs.

#### GitHub → Portfolio — `/tools/github-to-portfolio`

One field — a GitHub username — and out comes a portfolio, pulled straight from GitHub.

- **Live profile + repos** — client fetches `/users/:u` and `/users/:u/repos` from the public API (no auth), with 404 / 403-rate-limit / network handling and an 8s `AbortController`.
- **Portfolio view model** — `lib/ghportfolio.ts` (pure, tested): top repos by stars (forks/archived dropped), a tech stack from repo languages, and an **About** from the profile README. Project cards lead with the repo's GitHub social-preview image; repos ranked by a portfolio-worthiness score.

#### Developer Resume → Portfolio — `/tools/developer-resume-to-portfolio`

Paste a developer resume and flip it into a portfolio: GitHub, project repos and tech stack, pulled out automatically.

- **Dev-specific extraction** — `lib/devresume.ts` adds tech-stack detection (80+ terms, canonical casing), GitHub profile/repo detection, and profile-link detection on top of `lib/resume.ts`.
- **Live GitHub repo-pull** — when the resume names a profile, fetches that user's real repos client-side (5s `AbortController`), from **every** profile found.

#### ATS Plain-Text Resume Converter — `/tools/ats-plain-text-converter`

Shows a resume the way an Applicant Tracking System parses it, side by side with the human version, and scores it.

- **Human view vs Robot view** — strips smart quotes/em-dashes/zero-width spaces, normalizes bullets, flattens columns, flags non-ASCII.
- **0–100 score + grade** with prioritized recommendations split into *✓ Done for you* (applied to the output) and *✎ Edit your resume* (structural fixes). Logic in `lib/ats.ts`.

### ✨ Make your portfolio shine

#### Dev Portfolio Theme Picker (ThemeDeck) — `/tools/theme-picker`

A Tinder-style swipe deck of dev-portfolio themes — skip what you don't like, keep the look you do.

- **`lib/themes.ts`** (pure, tested) — 6 opinionated themes (midnight / paper / terminal / sunset / pastel / brutalist) as **scoped `--t-*` token sets** so a theme never leaks into the app's own tokens, a fixed sample portfolio, and wrap-around deck navigation.
- Keep a theme → the result hands off to the PDF tool with `?theme={id}`, **which actually applies it**: the PDF preview reads the same `--t-*` tokens (with app-token fallbacks) and has its own theme switcher. Every theme is hand-tuned to WCAG AA; both tools' e2e run axe across all six.

#### Portfolio About Me Generator (AboutMeAI) — `/tools/portfolio-about-me-generator`

Enter your role, pick a tone, and copy a polished "about me" in seconds.

- **`lib/aboutme.ts`** (pure, tested) — a deterministic, tone-driven template engine producing a one-liner, an about paragraph, a longer story, and a third-person bio, shaped by tone (Professional / Friendly / Confident / Creative). Switching tone rewrites instantly.
- It **structures, never fabricates** — the free engine is honest; an "✨ Make it sharper with AI" CTA gates a future AI rewrite behind the waitlist.

#### Case Study Template (CaseCrafter) — `/tools/case-study-template`

Turn a project into a structured, portfolio-ready case study.

- **`lib/casestudy.ts`** (pure, tested) — structures inputs into the proven **Overview → Challenge → Approach → Outcome** framework, **extracts metrics** (`+32%`, `2x`, `$1.2M`, `#1`) into highlights, and serializes clean **Markdown**. Empty sections become guiding prompts (excluded from the export) — no invented claims.

### 🔗 Own your personal brand

#### Portfolio Handle Checker — `/tools/portfolio-handle-checker`

Check where `@yourhandle` is still free across the web, and claim your portfolio URL.

- **Honest by design.** The only platform truthfully checkable from the browser is **GitHub** (public API 404 = free) — done live with an 8s `AbortController`. LinkedIn / X / Instagram / Dribbble / Dev.to are CORS/ToS-blocked, so they're clearly-labelled "check yourself ↗" links, **not faked** results. No backend.
- `lib/handle.ts` (pure, tested) — handle normalization/validation and per-platform URL builders.

#### LinkedIn URL Customizer — `/tools/linkedin-url-customizer`

Turn your name into clean, professional custom profile URLs.

- **`lib/slug.ts`** (pure, tested) — `slugify` (NFKD + diacritic/punctuation stripping) and `generateSlugs` → ranked, deduped, **LinkedIn-legal** variants (3–100 chars) each with a label and rationale; graceful single-word fallback. Copy-to-clipboard + real "how to change your LinkedIn URL" steps.

#### Resume QR Code Generator — `/tools/resume-qr-code-generator`

Turn your portfolio/resume link into a downloadable QR code.

- **`lib/qr.ts`** (pure, tested) — `normalizeUrl` (bare domain → `https://`), validation, filename. The QR itself uses the [`qrcode`](https://www.npmjs.com/package/qrcode) library, **dynamic-imported** in the handlers so it never runs during SSR or bloats the initial bundle.
- SVG QR on an **always-white frame** (scans in any site theme), color presets that re-render instantly, and **PNG + SVG** downloads.

### Email waitlist — `/signup` + `/api/waitlist`

Every tool's "Publish" CTA lands on `/signup`, a waitlist capture for the upcoming publish-your-resume feature.

- **Real capture** — the form POSTs to `/api/waitlist`, a Route Handler that validates the email and `SADD`s it to an **Upstash Redis** set via the REST API (dependency-free `fetch`). De-dupes automatically.
- **Admin read** — `GET /api/waitlist` returns `{ count, emails }` only with the `WAITLIST_ADMIN_TOKEN` secret; otherwise `401`.

## Platform foundations

- **Goal-grouped landing page** — the 10 tools are grouped by intent ("Get your resume online" / "Make your portfolio shine" / "Own your personal brand") from `lib/tools.ts` (a `group` field + `TOOL_GROUPS`). Each card has a monoline `ToolIcon`; the page leads with a 3-step "how it works" strip and honest trust signals (in-browser / no-signup / open-source).
- **Cross-tool funnel** — every tool's result ends with a contextual `NextSteps` block ("Next step" chips) that nudges the visitor to a logical follow-up tool instead of dead-ending.
- **Global navigation** — a sticky `SiteHeader` (wordmark → home, accessible Tools dropdown, theme toggle, Get-started CTA) and a `SiteFooter` link mesh, both reading the **single tool registry** `lib/tools.ts` so they can't drift. Add a new tool there and it appears everywhere.
- **System / Light / Dark theme toggle** — a 3-state header control (`ThemeToggle`) persisted to `localStorage`. `:root` is light, `:root[data-theme="dark"]` is explicit dark, and `prefers-color-scheme` only applies when no manual choice is set (so System follows the OS but a pick always wins). A blocking inline script in `layout.tsx` applies the saved theme **before first paint** (no flash of the wrong theme).
- **SEO template** — exact-match `<h1>`, unique keyword-rich meta description per page, `/tools/{kebab-keyword}` slug, OpenGraph (+ per-tool `opengraph-image`), canonical, and `SoftwareApplication` + `FAQPage` JSON-LD (XSS-sanitized). Site-wide: `metadataBase` (so OG/canonical URLs resolve to the production origin), `app/sitemap.ts`, `app/robots.ts`, and `app/manifest.ts` + `app/icon.svg`. Tools cross-link siblings; the footer links all ten from every page.
- **Trust & legal** — Privacy, Terms and Contact pages (`/privacy`, `/terms`, `/contact`), linked in the footer. The privacy policy is honest about the model: resume content is processed in the browser and never uploaded; only a waitlist email (if given) and anonymous PostHog analytics are collected.
- **Conversion tracking** — funnel events (`page_view`, `tool_started`, `tool_completed`, `result_interacted`, `cta_clicked`) pushed to `dataLayer` + PostHog, each stamped with `tool_slug`. Result-gated, UTM-tagged CTAs.
- **Pure, testable logic** — every tool's analysis/generation lives in a dependency-free `lib/*.ts` covered by the Node test runner; the React layer is a thin client component.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19, TypeScript
- CSS Modules + CSS custom properties (semantic theme tokens, WCAG-AA in light & dark)
- [`qrcode`](https://www.npmjs.com/package/qrcode) for the QR tool (dynamic-imported)
- [Upstash Redis](https://upstash.com) (REST) for the waitlist
- Node's built-in test runner for pure-logic unit tests
- [Playwright](https://playwright.dev) + [axe-core](https://github.com/dequelabs/axe-core) for render + contrast e2e (light & dark)

## Project structure

```
app/
  layout.tsx                  # html shell, header/footer, no-FOUC theme init script
  globals.css                 # theme tokens (light + dark + data-theme overrides)
  page.tsx  page.module.css   # goal-grouped landing page
  providers.tsx               # PostHog analytics wiring
  SiteHeader.tsx SiteFooter.tsx ThemeToggle.tsx chrome.module.css   # global nav + theme toggle
  sitemap.ts robots.ts manifest.ts icon.svg   # SEO/PWA metadata routes + brand icon
  privacy/ terms/ contact/    # legal + contact pages (legal.module.css)
  signup/                     # waitlist landing + client form
  api/waitlist/route.ts       # POST add email / GET admin read (Upstash)
  tools/<slug>/               # one dir per tool:
    page.tsx                  #   metadata + JSON-LD + how-it-works + cross-links + FAQ
    <Client>.tsx              #   "use client" tool UI (Converter / Deck / Generator / …)
    *.module.css              #   tool styles (semantic tokens)
    opengraph-image.tsx       #   per-tool OG image
lib/
  tools.ts                    # single source of truth: TOOLS registry + goal groups
  ats.ts resume.ts            # ATS + PDF-resume parsers
  github.ts devresume.ts ghportfolio.ts   # GitHub primitives + the two portfolio tools
  themes.ts slug.ts aboutme.ts qr.ts casestudy.ts handle.ts   # tools #4,#5,#6,#8,#9,#10
public/
  pdf.worker.min.mjs          # self-hosted pdf.js worker (see note below)
test/                         # *.unit.test.ts — pure-logic unit tests (Node runner)
e2e/                          # *.spec.ts — Playwright render + axe (light & dark):
                              #   per-tool specs, nav.spec, theme-toggle.spec, home.spec
playwright.config.ts          # runs every spec in light & dark color schemes
```

> **pdf.js worker:** `public/pdf.worker.min.mjs` is copied from `node_modules/pdfjs-dist/build/`
> so its version matches the installed API. Self-hosted (no CDN) to keep parsing fully local.
> **Re-copy after upgrading `pdfjs-dist`:** `cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/`

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and pick a tool, or jump to one and click **"Try a sample"**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (run locally before every push — it's the only TS gate) |
| `npm start` | Serve the production build |
| `npm run test:unit` | Pure-logic unit tests (Node test runner, fast) |
| `npm run test:e2e` | Playwright render + contrast tests (light & dark) |
| `npm test` | `test:unit` then `test:e2e` |

## Testing & CI

`.github/workflows/deploy.yml` runs on every push to `main`: unit tests → `next build` (TS/build gate) → Playwright e2e (light + dark + axe contrast, a hard gate) → Vercel build & deploy (when `VERCEL_TOKEN` is set).

- **Still run `npm run build` locally before pushing** — it's faster to catch a TS error there than to wait for CI. A unit test (`test/sitemap.unit.test.ts`) also fails the build if the sitemap and the `lib/tools.ts` registry drift apart.
- **Contrast is enforced.** Every tool's result is axe-checked in both themes. Note: **CI's Linux Chromium is the source of truth for color-contrast** — local (Windows/macOS) Chromium can *false-pass* borderline values (`< ~4.6:1`). The convention: never put colored text on a same-hue `color-mix` tint (it lands ~4.4:1); use a solid token surface (`--panel`/`--panel2`) or the solid accent pairing (`--accent2`/`--on-accent2`), keeping a comfortable margin over 4.5:1.

## Environment

All `NEXT_PUBLIC_*` vars are embedded at build time; the CI workflow's `vercel pull` fetches them from the Vercel project before building, so set them in Vercel for production/preview.

### Analytics (PostHog)

Gated on an env var, so the app runs fine without it (events become no-ops).

| Variable | Example | Where |
|----------|---------|-------|
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_...` | Vercel env (Production + Preview) + local `.env.local` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | same |

> ⚠️ **Do not mark the PostHog vars "Sensitive" in Vercel.** Sensitive vars are withheld from
> the build, which silently breaks `NEXT_PUBLIC_` inlining. Add them as normal plaintext vars
> (the `phc_` key is publishable/client-side by design).

### Waitlist (Upstash Redis)

Server-side only — **never** prefix these with `NEXT_PUBLIC_`.

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint for the waitlist set |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `WAITLIST_ADMIN_TOKEN` | Secret required to read collected emails via `GET /api/waitlist` |

> Export the list any time: `SMEMBERS waitlist` in the Upstash console, or
> `curl -H "Authorization: Bearer $WAITLIST_ADMIN_TOKEN" https://<host>/api/waitlist`.

## Roadmap

All 10 cluster tools are shipped. What's next isn't more tools:

1. **The "publish" epic** — the real product behind every "Publish" CTA: accounts/auth + a database + dynamic hosting for `{name}` URLs + slug claiming (ties into the Handle Checker). It needs a **real domain** — note that `.resume` is *not* a registerable TLD, so the `vibe.resume/{slug}` shown in previews is branding only.
2. **SEO & distribution** — submit the sitemap to GSC + IndexNow, internal-link/word-count audits, and per-launch distribution.
