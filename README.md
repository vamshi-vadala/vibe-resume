# Vibe Resume

A suite of free, SEO-driven micro-tools that turn resumes and profiles into shareable web pages — each tool an indexed landing page that funnels to the Vibe Resume product.

This repo is the implementation of that programmatic-SEO plan. **All 10 tools in the cluster are live**, plus a goal-grouped landing page, global navigation, a System/Light/Dark theme toggle, magic-link sign-in with handle reservations, and the reusable patterns (SEO metadata, JSON-LD, conversion tracking, theming, e2e tests) every tool shares.

Every **tool** runs client-side and static. The publish surface adds a thin server layer: Supabase Auth + Postgres for sign-in and handle reservations, and three small route handlers (`/auth/callback`, `/api/slugs/[slug]`, `/claim/[slug]`) plus two dynamic server pages (`/signup`, `/account`).

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
- It **structures, never fabricates** — the free engine is honest; an "✨ Make it sharper with AI" CTA is reserved for a planned AI-rewrite upgrade (not built yet).

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

### Account + handle claim — `/signup` + `/account` + `/api/slugs/[slug]` (Phase 1 of the publish epic)

The real Phase-1 surface behind every "Publish" CTA: sign in with a 6-digit email code and reserve your `viberesume.in/{handle}` URL.

- **OTP-code sign-in** — `/signup` is a server component that redirects already-signed-in users to `/account` and otherwise mounts a `SignInForm` client island. Submitting an email calls Supabase's `signInWithOtp`; the user then enters the 6-digit `{{ .Token }}` from the email and we call `verifyOtp({ type: "email" })` client-side. The magic link in the same email still works as a fallback via `/auth/callback`, but the primary flow is the code — link scanners (Outlook/Gmail safe-links, corporate AV) pre-fetch single-use PKCE links and consume them before the user clicks, which surfaces as "link expired" within seconds; a code can't be pre-clicked.
- **Slug claim flow** — the handle checker (`/tools/portfolio-handle-checker`) shows truthful Vibe Resume availability alongside the GitHub row by calling `GET /api/slugs/[slug]`. The "Claim viberesume.in/{handle}" CTA routes through `/claim/[slug]` — a server component that auth-gates with `?next=/claim/{slug}`, runs the insert via the service-role client, and redirects to `/account?claimed={slug}` with a success banner (or `?error=taken|reserved|invalid` if it can't).
- **REST resource** — `/api/slugs/[slug]` is the canonical resource: `GET` returns availability (`available` / `taken` / `reserved` / `invalid`); `POST` claims for the signed-in user. `PATCH` (Phase 2: publish + update `resume_data`/`theme_id`) and `DELETE` (Phase 3: unpublish/release) are noted stubs so the route shape never has to be renamed.
- **Reserved slugs** — `lib/reservedSlugs.ts` derives a denylist from `lib/tools.ts` + static framework / auth / marketing / system paths; checked at the app layer so adding a tool slug never needs a migration. `lib/slugAvailability.ts` is the pure shared format/length/reserved check (`SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/`, `SLUG_MIN=3`, `SLUG_MAX=30`) used by both the GET endpoint and any future caller.
- **Account page** — `/account` lists reserved handles with a "View live →" link for each published slug (and a "Publish →" link for any reserved-but-not-yet-published one), plus a sign-out button; `robots: { index: false }`. Both `/account` and `/claim/` are also disallowed in `robots.ts` (belt-and-suspenders against crawl-budget waste); `/claim/[slug]` carries the same `robots: { index: false, follow: false }` metadata as defense in depth even though it only ever returns redirects.

### Publish flow — `/account/publish` + `app/[slug]/page.tsx` (Phase 2 slice 1)

The minimum-viable publish path. From the PDF tool's result, clicking **Publish** stashes `{ resume, photoUrl, themeId }` in `sessionStorage` (key `vr.publish.pending`) and routes to `/account/publish`. That page is auth-gated: if there are no claimed handles it sends the user to the handle checker; if there's one it offers a single-button publish; if multiple, a radio picker. Submit `PATCH`es `/api/slugs/[slug]` with the payload, server-side validates via `lib/publish.ts` (300KB cap, deep shape check, must own the row), and writes `resume_data` + `published_at`/`updated_at`. On success the stash is cleared and the user lands at `/account?published={slug}` with a success banner.

The public profile lives at `app/[slug]/page.tsx`. It's a dynamic catch-all whose match order sits *behind* every static segment (`tools/`, `signup`, `account`, etc.) plus every entry in `RESERVED_SLUGS`, so user handles never collide with platform routes. It re-runs `validatePublishPayload` against the stored JSONB (defensive — schemas drift), returns `notFound()` if missing / unpublished / invalid, and renders via the shared `ResumeSite` component (extracted from `Converter.tsx` so the in-browser preview and the live page are the exact same render). Per-profile `<title>` / OG / canonical metadata are generated from `resume.name + title`.

The only edit path today is re-publish (overwrites). Settings panel, unpublish, theme switching from `/account`, and rate-limiting `PATCH` are deferred to slice 2+.

### Slice 2A — settings + unpublish + tightened reads

- **`/account/[slug]/settings`** is a server component that loads the slug row, redirects non-owners to `/account`, redirects "reserved but never published" handles to `/account/publish`, and mounts `SettingsClient` with the validated `PublishPayload`. The client form edits photo, name, headline, summary, contact links, skills, and theme; on save it sends the full payload (preserving `sections` from the loaded row) to `PATCH /api/slugs/[slug]`. Bullet-level editing of structured sections (Experience entries, Education, Projects) is intentionally not in scope — re-uploading the PDF is the edit path for those.
- **`DELETE /api/slugs/[slug]`** is owner-only and sets `published_at = null` (keeps the reservation + `resume_data` so the user can re-publish later). Releasing the handle entirely is a Phase 3 affordance.
- **Tightened anon SELECT**: the `resume_data` column has been revoked from the `anon` role so a draft profile can't be read by anyone with the publishable key. The public profile page now reads via the service-role client (it scopes itself to `published_at IS NOT NULL`, so service-role usage stays narrow). Handle availability checks are unaffected — they only select `slug`. **The accompanying SQL migration that ships with this slice MUST be applied in the Supabase dashboard:**

  ```sql
  -- Lock down resume_data on anon reads. The public profile page now reads via
  -- service-role (server-side, scoped to published_at IS NOT NULL).
  REVOKE SELECT (resume_data) ON public.slugs FROM anon;
  ```

### Supabase data model

- **`users`** mirrors `auth.users` (auto-populated by the `on_auth_user_created` trigger on insert into `auth.users`).
- **`slugs`** holds reservations: `slug` as PK, `user_id` FK, `created_at`, plus a CHECK constraint enforcing the `[a-z0-9-]{3,30}` format. **Phase-2 columns** (`resume_data jsonb`, `theme_id text`, `published_at timestamptz`, `updated_at timestamptz`) are already on the table as nullable, so Phase 2 ships with zero migration.
- **RLS is on**: anon can SELECT slugs (for the public availability check + future public profiles); only the owning user can INSERT against themselves; DELETE is also owner-only. No UPDATE policy yet — Phase 2 adds one scoped to `resume_data`/`theme_id`.

## Platform foundations

- **Goal-grouped landing page** — the 10 tools are grouped by intent ("Get your resume online" / "Make your portfolio shine" / "Own your personal brand") from `lib/tools.ts` (a `group` field + `TOOL_GROUPS`). Each card has a monoline `ToolIcon`; the page leads with a 3-step "how it works" strip and honest trust signals (in-browser / no-signup / open-source).
- **Cross-tool funnel** — every tool's result ends with a contextual `NextSteps` block ("Next step" chips) that nudges the visitor to a logical follow-up tool instead of dead-ending.
- **Global navigation** — a sticky `SiteHeader` (wordmark → home, accessible Tools dropdown, theme toggle, auth-aware `UserMenu`) and a `SiteFooter` link mesh, both reading the **single tool registry** `lib/tools.ts` so they can't drift. Add a new tool there and it appears everywhere. The `UserMenu` is a deliberate client-only island — pulling session state into the server layout would convert every static page in the app to dynamic rendering (a `cookies()` call in a layout poisons the static cache for everything beneath it). It renders the anon "Sign in" CTA during loading, then swaps to an avatar+email pill (linking to `/account`) once Supabase JS reads the session from localStorage. Brief first-paint flicker for signed-in users is the deliberate trade for keeping every marketing/tool page statically prerendered. Sign-out lives on `/account` — no popover until we have ≥3 menu items to justify one.
- **System / Light / Dark theme toggle** — a 3-state header control (`ThemeToggle`) persisted to `localStorage`. `:root` is light, `:root[data-theme="dark"]` is explicit dark, and `prefers-color-scheme` only applies when no manual choice is set (so System follows the OS but a pick always wins). A blocking inline script in `layout.tsx` applies the saved theme **before first paint** (no flash of the wrong theme).
- **SEO template** — exact-match `<h1>`, unique keyword-rich meta description per page, `/tools/{kebab-keyword}` slug, OpenGraph (+ per-tool `opengraph-image`), canonical, and `SoftwareApplication` + `FAQPage` JSON-LD (XSS-sanitized). Site-wide: `metadataBase` (so OG/canonical URLs resolve to the production origin), `app/sitemap.ts`, `app/robots.ts`, and `app/manifest.ts` + `app/icon.svg`. Tools cross-link siblings; the footer links all ten from every page.
- **Trust & legal** — Privacy, Terms and Contact pages (`/privacy`, `/terms`, `/contact`), linked in the footer. The privacy policy is honest about the model: resume content is processed in the browser and never uploaded; the only personal data we store is your sign-in email + any handles you reserve, plus anonymous PostHog analytics.
- **Conversion tracking** — funnel events (`page_view`, `tool_started`, `tool_completed`, `result_interacted`, `cta_clicked`) pushed to `dataLayer` + PostHog, each stamped with `tool_slug`. Result-gated, UTM-tagged CTAs.
- **Pure, testable logic** — every tool's analysis/generation lives in a dependency-free `lib/*.ts` covered by the Node test runner; the React layer is a thin client component.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19, TypeScript
- CSS Modules + CSS custom properties (semantic theme tokens, WCAG-AA in light & dark)
- [`qrcode`](https://www.npmjs.com/package/qrcode) for the QR tool (dynamic-imported)
- [Supabase](https://supabase.com) (Postgres + Auth + RLS) for sign-in and handle reservations, via `@supabase/supabase-js` + `@supabase/ssr`
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
  signup/                     # magic-link sign-in (server component + SignInForm client island)
  auth/callback/route.ts      # magic-link return — exchanges code for session, redirects to ?next
  claim/[slug]/page.tsx       # server-side slug claim landing (auth-gates + inserts)
  account/                    # signed-in user dashboard (handles + sign-out)
  account/publish/            # Phase 2 publish landing (reads sessionStorage stash + PATCHes)
  account/[slug]/settings/    # Phase 2 editor (name/title/summary/contacts/theme + unpublish)
  [slug]/page.tsx             # public profile route — SSR-renders published resume_data
  api/slugs/[slug]/route.ts   # GET availability / POST claim / PATCH publish / DELETE unpublish
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
  supabase/{client,server,admin}.ts   # SSR-aware Supabase clients (browser anon / server cookies / service-role)
  reservedSlugs.ts slugAvailability.ts # slug denylist + pure availability check (format/length/reserved)
  publish.ts                  # PublishPayload type + pure validator for PATCH /api/slugs/[slug] body
  photo.ts                    # browser-only photo resize (400×400 q0.82 JPEG → base64) + pure type/size validators
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

### Supabase (auth + handle reservations)

Replaces the deleted `/api/waitlist` Upstash setup. The anon key is public by design (it's protected by RLS in the browser); the service-role key bypasses RLS and is server-only.

| Variable | Description | Sensitive in Vercel? |
|----------|-------------|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, e.g. `https://<ref>.supabase.co` | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable (`sb_publishable_...`) — used by `lib/supabase/client.ts` + `server.ts` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret (`sb_secret_...`) — used only by `lib/supabase/admin.ts` for owner-checked inserts | **Yes** |

> ⚠️ Add `https://viberesume.in/auth/callback` (and `http://localhost:3000/auth/callback` for dev)
> to **Supabase → Authentication → URL Configuration → Redirect URLs**, and set the **Site URL**
> to `https://viberesume.in`. Without this, the magic-link redirect bounces to a generic Supabase
> page instead of completing sign-in.

### Supabase auth gotchas (the ones that cost a session to debug)

- **Email OTP Length must be 6.** `Authentication → Sign In/Providers → Email → Email OTP Length` is configurable 6–10. The `SignInForm` input has `maxLength={6}` and rejects shorter/longer values as "invalid code." If you ever change this, also update the input.
- **Update BOTH email templates** — `Authentication → Emails → Templates`:
  - **Magic Link** (fires for returning users)
  - **Confirm signup** (fires for *first-time* emails — easy to miss in testing because you keep using new addresses, then assume the template "didn't save")
  Both should use `{{ .Token }}` in the body (link as a fallback is fine). Same for Invite / Reset Password / Change Email if you use them.
- **Built-in SMTP cap = 2 emails/hour per project** (not per recipient — bites in testing). The project is wired to **Resend** (`smtp.resend.com:465`, user `resend`, password = `re_...` API key, sender `noreply@viberesume.in`). The sending domain is verified in Resend via DNS (SPF + DKIM + DMARC TXT records). Once custom SMTP is on, bump `Authentication → Rate Limits → Emails per hour` from the default 2.
- **PKCE links die to email scanners** — Outlook / Gmail safe-links / corporate AV pre-fetch the `/auth/callback?code=...` URL to scan it, consuming the single-use code before the user clicks → "link expired" within seconds. This is why the primary sign-in path is the 6-digit `{{ .Token }}` verified client-side via `verifyOtp({ type: "email" })`; the link is just a fallback.

## Roadmap

All 10 cluster tools are shipped. What's next is the publish epic in phases:

1. **Phase 1 — Auth + handle claim (LIVE).** OTP-code sign-in (Resend SMTP, 6-digit `{{ .Token }}`, magic link as fallback), slug reservations against verified emails, handle checker wired to truthful availability, claim CTA routed through `/claim/[slug]`, `/account` + `/claim/` blocked in both `robots.ts` and per-page metadata. Shipped 2026-06-09.
2. **Phase 2 — The actual published page.** **Slice 1 LIVE:** dynamic `app/[slug]/page.tsx` rendering stored `resume_data` via the shared `ResumeSite` component; PDF tool's "Publish" wired to `PATCH /api/slugs/[slug]` via a `sessionStorage` stash → `/account/publish`; account page shows View-live / Publish links per handle. **Slice 2A LIVE:** settings editor (name/headline/summary/contacts/theme), unpublish via DELETE, anon `resume_data` SELECT revoked. **Slice 2B LIVE:** photo upload + replace (browser-side resize to 400×400 q0.82 JPEG, stored inline as base64 — no Supabase Storage yet, migration trigger documented in `lib/photo.ts`); Skills chip editor; structured sections (Experience / Education / Projects) shown read-only with a "re-upload your PDF to edit" affordance — deliberately *not* a partial editor to avoid the UX inconsistency of "can edit Experience but not Education". **Slice 3:** generic structured-section editor (when needed), rate-limiting `PATCH` via Upstash, sitemap inclusion for published profiles, slug squat TTL.
3. **Phase 3 — Hardening.** Owner-only delete/unpublish, rate-limit `POST`/`PATCH` via Upstash, sitemap inclusion for published profiles, robots block on `/account` + `/claim`, GDPR one-click purge, slug squat TTL.
4. **SEO & distribution.** GSC + IndexNow submitted (2026-06-08). Per-launch distribution per the plan: IH, r/resumes, r/cscareerquestions, Show HN, Product Hunt.
