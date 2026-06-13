# Vibe Resume

> Turn your resume PDF into a personal website at `viberesume.in/your-name` — free, no signup to try.

**🔗 Live: [viberesume.in](https://viberesume.in)** · [Try the PDF → Website tool](https://viberesume.in/tools/pdf-resume-to-website) · [See a live example](https://viberesume.in/example)

[![Live site](https://img.shields.io/badge/live-viberesume.in-047857?style=flat-square)](https://viberesume.in)
[![Built with Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Stars](https://img.shields.io/github/stars/vamshi-vadala/vibe-resume?style=flat-square)](https://github.com/vamshi-vadala/vibe-resume/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[![Vibe Resume — a resume rendered as a clean personal website](docs/example.png)](https://viberesume.in)

Upload a resume PDF (or connect GitHub) and get a clean, shareable personal site — it reads your resume, so you write nothing. Plus **10 free, no-signup tools** for every step: PDF→website, GitHub→portfolio, LinkedIn URL cleaner, resume QR codes, ATS plain-text, about-me generator, and more.

**Why it's different:** built from your existing PDF (zero writing) · runs in your browser (your file is never uploaded) · your own URL you control · free & open source.

---

## The tools

The landing page groups all ten by user goal, driven from `lib/tools.ts` (so the header dropdown and footer mesh stay in sync). Every tool's analysis/generation lives in a dependency-free, unit-tested `lib/*.ts`; the React layer is a thin client component.

### 🌐 Get your resume online

- **PDF Resume → Website** — `/tools/pdf-resume-to-website` — the flagship. Upload a PDF and preview it as a clean, responsive site. 100% client-side parsing (self-hosted pdf.js worker; the file never leaves the device); `lib/resume.ts` is a pure parser with column-aware extraction, letter-spacing recovery, date-anchored per-role experience grouping, and headshot extraction.
- **GitHub → Portfolio** — `/tools/github-to-portfolio` — one username → a portfolio built from the public GitHub API. `lib/ghportfolio.ts` ranks repos by a portfolio-worthiness score and derives a tech stack + About.
- **Developer Resume → Portfolio** — `/tools/developer-resume-to-portfolio` — paste a dev resume; `lib/devresume.ts` adds tech-stack detection (80+ terms) and GitHub profile/repo detection, then live-pulls real repos.
- **ATS Plain-Text Converter** — `/tools/ats-plain-text-converter` — human view vs. how an ATS parses it, plus a 0–100 score and prioritized fixes (`lib/ats.ts`).

### ✨ Make your portfolio shine

- **Dev Portfolio Theme Picker** — `/tools/theme-picker` — a swipe deck of 6 WCAG-AA themes as scoped `--t-*` token sets (`lib/themes.ts`); keep one and it hands off to the PDF tool with `?theme={id}`, which actually applies it.
- **Portfolio About Me Generator** — `/tools/portfolio-about-me-generator` — deterministic, tone-driven copy (`lib/aboutme.ts`); it structures, never fabricates.
- **Case Study Template** — `/tools/case-study-template` — structures a project into Overview → Challenge → Approach → Outcome, extracts metrics, exports Markdown (`lib/casestudy.ts`).

### 🔗 Own your personal brand

- **Portfolio Handle Checker** — `/tools/portfolio-handle-checker` — truthfully checks GitHub availability live; other platforms are clearly-labelled "check yourself ↗" links, never faked (`lib/handle.ts`).
- **LinkedIn URL Customizer** — `/tools/linkedin-url-customizer` — ranked, LinkedIn-legal custom-URL ideas from your name (`lib/slug.ts`).
- **Resume QR Code Generator** — `/tools/resume-qr-code-generator` — QR on an always-white frame (scans in any theme), PNG + SVG export; the `qrcode` lib is dynamic-imported (`lib/qr.ts`).

## How publishing works

The three site-producing tools (PDF, Developer Resume, GitHub) can publish to a real URL at `viberesume.in/{handle}`. Tools themselves are static and client-side; publishing adds a thin server layer (Supabase Auth + Postgres + a few route handlers).

**Sign in & claim.** Sign-in is a **6-digit email code** (`/signup` → `signInWithOtp` → `verifyOtp`). The magic link in the same email is only a fallback — email scanners (Outlook/Gmail safe-links, corporate AV) pre-fetch single-use PKCE links and consume them before the user clicks, which surfaces as "link expired"; a code can't be pre-clicked. Handles are reserved against a verified email and capped at 5 per user (`lib/claims.ts`).

**Publish funnel.** Clicking **Publish** on a tool result stashes the payload in `sessionStorage` (`vr.publish.pending`) and routes to `/account/publish`, carrying funnel context through sign-in. Zero-handle users get an inline claim step (handle prefilled via `suggestSlug`, debounced availability check, single "Claim & publish" button). Submit `PATCH`es `/api/slugs/[slug]`, which validates server-side via `lib/publish.ts` (300KB cap, deep shape check, owner check) and writes `resume_data` + `published_at`. A `PendingPublishNudge` lets a user who detoured mid-funnel resume in one click.

**`/api/slugs/[slug]`** is the canonical REST resource: `GET` availability · `POST` claim · `PATCH` publish/update (10s min interval between re-publishes; first publish never throttled) · `DELETE` unpublish (keeps reservation + data) · `DELETE ?release=1` deletes the row and frees the handle.

**The `/account` dashboard** shows each handle as a card with a Live/Unpublished/Reserved badge, owner name, copy-link + View-live, and a primary action (Edit / Publish / Re-publish). Destructive actions sit behind a per-card "Manage handle" disclosure and use an inline two-step confirm. A state-driven **Journey strip** (Generate → Claim → Publish → Share) tracks progress; a **"⚠ Demo data"** badge and a publish-time warning prevent putting the sample "Jane Doe" resume on a real URL. When the optional PostHog read vars are set, each live card shows a pageview count (see [Environment](#environment)).

**The public profile** (`app/[slug]/page.tsx`) is a dynamic catch-all that sits *behind* every static route and reserved slug, so handles never collide with platform paths. It reads via the service-role client (scoped to `published_at IS NOT NULL`), re-validates the stored JSONB defensively, and dispatches on `PublishPayload.kind` (`resume` / `developer` / `github`) to the shared render components (`ResumeSite` / `DevPortfolio` / `GhPortfolio`) — the same components the in-browser previews use, so preview === live. A valid-but-unclaimed slug renders a noindex "claim this handle" invite instead of a 404.

### The live profile page

The published page is a *document whose job is to get the owner contacted*, so it's deliberately minimal — no platform header or 10-tool footer (chrome lives in the `app/(site)/` route group; `app/[slug]` sits outside it). It adds, over a static PDF:

- **Availability + "Get in touch" CTA** — optional `availability` line (edited in settings) + a `mailto:` button to the first email in the resume (`primaryEmail()`).
- **Clickable contacts** — `parseContactLine()` turns contact lines into real `mailto:`/`tel:`/`https` links.
- **Download PDF** — `PrintButton` + a `@media print` block that strips chrome to a clean white resume; no deps, nothing stored server-side.
- **Discoverability** — `Person` JSON-LD (name, jobTitle, url, email, `sameAs` from contact URLs) and a per-profile OG share card (`opengraph-image.tsx`, Satori). Loader + metadata are centralised in `app/[slug]/profile.ts`.
- **Owner-only bar** — `OwnerBar` (env-guarded client island) shows "This is your live site · Edit · Copy link · Account" only to the signed-in owner; everyone else sees a clean profile with just a one-line "Made with Vibe Resume" viral footer.

### Editing

`/account/[slug]/settings` (resume-kind only) edits photo, name, headline, availability, summary, contact links, skills, and theme, with a live preview rendered by the real `ResumeSite`. Structured sections (Experience/Education/Projects) are read-only — re-uploading the PDF is the edit path for those. Developer/GitHub profiles re-publish from their source tool to change.

## Platform foundations

- **Goal-grouped landing page** from `lib/tools.ts`; each tool result ends with a contextual `NextSteps` block that funnels to a logical follow-up tool.
- **Global navigation** — sticky `SiteHeader` (wordmark, Tools dropdown, theme toggle, auth-aware `UserMenu`) + `SiteFooter`, both reading the single `lib/tools.ts` registry so they can't drift. `UserMenu` is a deliberate client-only island: putting session state in the server layout would convert every static page to dynamic (a `cookies()` call in a layout poisons the static cache beneath it), so it renders the anon "Sign in" CTA, then swaps to the account pill once Supabase reads the session client-side.
- **System / Light / Dark theme** — a 3-state `ThemeToggle` persisted to `localStorage`; a blocking inline script in `layout.tsx` applies the saved theme before first paint (no flash). `prefers-color-scheme` only applies when no manual choice is set.
- **SEO** — exact-match `<h1>`, unique meta per page, `/tools/{kebab-keyword}` slugs, OpenGraph (+ per-tool `opengraph-image`), canonical, and `SoftwareApplication` + `FAQPage` JSON-LD (XSS-sanitized). Site-wide: `metadataBase`, `Organization` + `WebSite` JSON-LD on the homepage, `sitemap.ts` (includes published profiles, hourly revalidate), `robots.ts`, `manifest.ts`.
- **Privacy by design** — resume content is processed in the browser and never uploaded; the only stored personal data is the sign-in email + reserved handles, plus anonymous PostHog analytics. Privacy / Terms / Contact pages linked in the footer.
- **Conversion tracking** — funnel events (`page_view`, `tool_started`, `tool_completed`, `result_interacted`, `cta_clicked`) to PostHog, stamped with `tool_slug`.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19, TypeScript
- CSS Modules + CSS custom properties (semantic theme tokens, WCAG-AA in light & dark)
- [Supabase](https://supabase.com) (Postgres + Auth + RLS) via `@supabase/supabase-js` + `@supabase/ssr`
- [`qrcode`](https://www.npmjs.com/package/qrcode) (dynamic-imported) for the QR tool
- Node's built-in test runner for pure-logic unit tests; [Playwright](https://playwright.dev) + [axe-core](https://github.com/dequelabs/axe-core) for render + contrast e2e (light & dark)

## Project structure

```
app/
  layout.tsx                  # root: html/body + no-FOUC theme init + Analytics ONLY (no chrome)
  globals.css                 # theme tokens (light + dark + data-theme overrides) + @media print
  providers.tsx               # PostHog analytics wiring
  SiteHeader.tsx SiteFooter.tsx ThemeToggle.tsx UserMenu.tsx chrome.module.css   # global nav
  sitemap.ts robots.ts manifest.ts icon.svg   # SEO/PWA metadata routes + brand icon
  (site)/                     # route group: everything WITH platform chrome (URLs unchanged)
    layout.tsx                #   renders SiteHeader + SiteFooter around its children
    page.tsx page.module.css  #   goal-grouped landing page
    HomeAccountBand.tsx ToolIcon.tsx NextSteps.tsx   # home/tool shared islands
    privacy/ terms/ contact/  #   legal + contact pages (legal.module.css)
    signup/                   #   OTP sign-in (server component + SignInForm client island)
    claim/[slug]/page.tsx     #   server-side slug claim landing (auth-gates + inserts)
    account/                  #   signed-in dashboard; account/publish/; account/[slug]/settings/
    tools/<slug>/             #   one dir per tool (page + <Client> + *.module.css + opengraph-image)
  [slug]/                     # public profile — OUTSIDE (site), so NO platform chrome:
    page.tsx                  #   SSR profile + Person JSON-LD (CTA, clickable contacts)
    profile.ts                #   shared loader + metadata/JSON-LD derivation (server-only)
    opengraph-image.tsx       #   per-profile share card (Satori)
    PrintButton.tsx OwnerBar.tsx   # Download-PDF + owner-only Edit/Share island
  auth/callback/route.ts      # OTP/magic-link return — exchanges code for session, redirects to ?next
  api/slugs/[slug]/route.ts   # GET availability / POST claim / PATCH publish / DELETE unpublish
lib/
  tools.ts                    # single source of truth: TOOLS registry + goal groups
  ats.ts resume.ts            # ATS + PDF-resume parsers
  github.ts devresume.ts ghportfolio.ts   # GitHub primitives + the two portfolio tools
  themes.ts slug.ts aboutme.ts qr.ts casestudy.ts handle.ts   # the remaining tools
  supabase/{client,server,admin}.ts   # SSR-aware Supabase clients (browser anon / server cookies / service-role)
  reservedSlugs.ts slugAvailability.ts # slug denylist + pure availability check
  publish.ts                  # PublishPayload type + pure validator for PATCH body
  posthog.ts                  # server-only cached HogQL pageview counts for /account
  photo.ts                    # browser-only photo resize + pure type/size validators
public/
  pdf.worker.min.mjs          # self-hosted pdf.js worker (see note below)
test/                         # *.unit.test.ts — pure-logic unit tests (Node runner)
e2e/                          # *.spec.ts — Playwright render + axe (light & dark)
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

Open [http://localhost:3000](http://localhost:3000) and pick a tool, or click **"Try a sample"**. The tools work with no env vars; only the publish flow needs Supabase (see below).

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

`.github/workflows/deploy.yml` runs on every push to `main`: unit tests → `next build` → Playwright e2e (light + dark + axe contrast, a hard gate) → Vercel build & deploy.

- **Run `npm run build` locally before pushing** — it's the only TS gate, and `test/sitemap.unit.test.ts` also fails the build if the sitemap and `lib/tools.ts` drift apart.
- **Contrast is enforced.** Every result is axe-checked in both themes. **CI's Linux Chromium is the source of truth** — local Windows/macOS Chromium can *false-pass* borderline values (`< ~4.6:1`). Never put colored text on a same-hue `color-mix` tint; use a solid token surface (`--panel`/`--panel2`) or the solid accent pairing (`--accent2`/`--on-accent2`), keeping margin over 4.5:1.

## Environment

`NEXT_PUBLIC_*` vars are embedded at build time; CI's `vercel pull` fetches them before building, so set them in Vercel for production/preview.

### Analytics (PostHog) — optional

Gated on an env var, so the app runs fine without it (events become no-ops).

| Variable | Example | Where |
|----------|---------|-------|
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_...` | Vercel env (Production + Preview) + local `.env.local` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | same |

> ⚠️ **Do not mark the `NEXT_PUBLIC_POSTHOG_*` vars "Sensitive" in Vercel.** Sensitive vars are
> withheld from the build, which silently breaks `NEXT_PUBLIC_` inlining. Add them as normal
> plaintext vars (the `phc_` key is publishable/client-side by design).

#### Profile view counts on /account — optional, read path

`/account` shows a pageview count per published handle when these **server-only** vars are set
(`lib/posthog.ts`; with either missing it returns `{}` and no counts render, so dev/CI are
unaffected). Cached HogQL query (`$pageview` by `$pathname`, 1-hour revalidate).

| Variable | Example | Sensitive in Vercel? |
|----------|---------|----------------------|
| `POSTHOG_PERSONAL_API_KEY` | `phx_...` — personal key scoped to **`query:read`** | **Yes** |
| `POSTHOG_PROJECT_ID` | `12345` — numeric project id | No |

> ⚠️ **Server-only** — do **not** add a `NEXT_PUBLIC_` prefix, or the read key leaks into the
> browser bundle. The personal key needs the **`query:read`** scope (a `phc_` project key can't
> read). The query API uses the app host (`us.posthog.com`), derived from `NEXT_PUBLIC_POSTHOG_HOST`
> by dropping the `.i.` ingestion subdomain. Redeploy after adding them.

### Supabase (auth + handle reservations)

The anon key is public by design (protected by RLS); the service-role key bypasses RLS and is server-only.

| Variable | Description | Sensitive in Vercel? |
|----------|-------------|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, e.g. `https://<ref>.supabase.co` | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable (`sb_publishable_...`) — used by `client.ts` + `server.ts` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret (`sb_secret_...`) — used only by `admin.ts` | **Yes** |
| `CRON_SECRET` | Auth for the daily slug-reap cron (`/api/cron/reap-slugs`); any long random string | server-only (Production scope, redeploy to take effect) |

> ⚠️ Add `https://viberesume.in/auth/callback` (and `http://localhost:3000/auth/callback` for dev)
> to **Supabase → Authentication → URL Configuration → Redirect URLs**, and set the **Site URL** to
> `https://viberesume.in`. Without this, the auth redirect bounces to a generic Supabase page.

#### Data model & one-time migration

- **`users`** mirrors `auth.users` (via the `on_auth_user_created` trigger).
- **`slugs`** — reservations: `slug` PK, `user_id` FK, `created_at`, a CHECK on `[a-z0-9-]{3,30}`, plus `resume_data jsonb`, `theme_id text`, `published_at timestamptz`, `updated_at timestamptz`. RLS on: anon SELECTs `slug` (availability + public profiles read via service-role); INSERT/UPDATE/DELETE are owner-only.
- **Lock down draft data on a fresh project** — the public profile reads `resume_data` via service-role, so revoke it from anon:
  ```sql
  REVOKE SELECT (resume_data) ON public.slugs FROM anon;
  ```

#### Supabase auth gotchas (the ones that cost a session to debug)

- **Email OTP Length must be 6.** `Authentication → Sign In/Providers → Email → Email OTP Length` is 6–10; `SignInForm` has `maxLength={6}`. Change one, change both.
- **Update BOTH email templates** (`Authentication → Emails → Templates`): **Magic Link** (returning users) *and* **Confirm signup** (first-time emails — easy to miss because new test addresses keep hitting it). Both should use `{{ .Token }}`.
- **Built-in SMTP cap = 2 emails/hour per project** (not per recipient — bites in testing). Wired to **Resend** (`smtp.resend.com:465`, sender `noreply@viberesume.in`, domain verified via SPF/DKIM/DMARC). With custom SMTP on, bump `Authentication → Rate Limits → Emails per hour`.
- **PKCE links die to email scanners** — they pre-fetch `/auth/callback?code=...` and consume the single-use code, so the primary path is the 6-digit code verified client-side; the link is a fallback.

## Status

All 10 tools and the full publish flow (sign-in, claim, publish, edit, unpublish, release, account deletion, public profile) are **live**. Remaining work is **distribution**, not features: Search Console indexing + backlinks (Show HN, Product Hunt, r/resumes, the GitHub repo), and growth experiments. View counts on `/account` activate once the optional PostHog read vars are set.

## License

[MIT](LICENSE) © Vamshi Vadala
