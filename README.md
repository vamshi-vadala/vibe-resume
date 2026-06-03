# Vibe Resume

A suite of free, SEO-driven micro-tools that turn resumes and profiles into shareable web pages — each tool an indexed landing page that funnels to the Vibe Resume product.

This repo is the implementation of that programmatic-SEO plan. **Two tools are built so far**, plus the reusable patterns (SEO metadata, JSON-LD, conversion tracking, theming, e2e tests) the rest of the cluster will reuse.

## Built so far

### PDF Resume → Website — `/tools/pdf-resume-to-website`

The flagship. Upload a PDF resume and instantly preview it as a clean, responsive personal website.

- **100% client-side parsing** — the PDF's text layer is read in the browser with a
  self-hosted [pdf.js](https://mozilla.github.io/pdf.js/) worker; the file never leaves the
  device (safe for a resume full of personal contact info).
- **Structured extraction** — `lib/resume.ts` is a pure, dependency-free parser that turns
  raw text into `{ name, title, contactLines, summary, sections, skills }` using
  heading-keyword + contact-regex heuristics, grouping PDF text items into lines by
  y-position.
- **Polished website preview** — name + avatar initials, role, contact, About, skill chips
  and section lists, rendered inside a faux browser frame. All surfaces use the shared
  semantic theme tokens (WCAG-AA in light & dark).
- **Graceful failure** — scanned/image-only PDFs (no text layer) get a friendly re-export
  message instead of a crash.
- **Result-gated CTA + tracking** — same funnel events (`tool_started`, `tool_completed`,
  `result_interacted`, `cta_clicked`) and UTM-tagged "Publish on Vibe Resume" CTAs as the
  ATS tool, stamped with `tool_slug: "pdf-resume-to-website"`.

### ATS Plain-Text Resume Converter — `/tools/ats-plain-text-converter`

Shows a resume the way an Applicant Tracking System (ATS) actually parses it, side by side with what the human wrote, and scores how ATS-friendly it is.

- **Human view vs Robot view** — paste resume text (or upload a `.txt`) and see the cleaned plain-text an ATS would read.
- **ATS conversion** — strips smart quotes, em-dashes, non-breaking/zero-width spaces; normalizes decorative bullets to `-`; flattens multi-column/table layouts; flags emoji/non-ASCII.
- **0–100 score + grade** with weighted, prioritized recommendations, visually split into:
  - **✓ Done for you** — fixes already applied to the copyable output.
  - **✎ Edit your resume** — structural issues to fix in your source file (missing email/phone, weak section headings, columns, missing dates).
- **Result-gated CTA** — "Publish on Vibe Resume" appears only after a result exists, UTM-tagged.
- **Conversion tracking** — `page_view`, `tool_started`, `tool_completed`, `result_interacted`, `cta_clicked` pushed to `dataLayer`, each stamped with `tool_slug`.

### Reusable foundations (applied here, reused by future tools)

- **SEO template** — exact-match `<h1>`, `/tools/{kebab-keyword}` slug, OpenGraph, canonical, and `SoftwareApplication` + `FAQPage` JSON-LD (XSS-sanitized).
- **Light/dark theming** — semantic color tokens with adaptive on-color tokens, all WCAG-AA (4.5:1) verified.
- **Pure, testable logic** — `lib/ats.ts` holds the analysis as a dependency-free function.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19, TypeScript
- CSS Modules + CSS custom properties for theming
- [Playwright](https://playwright.dev) + [axe-core](https://github.com/dequelabs/axe-core) for theme/contrast e2e tests

## Project structure

```
app/
  globals.css                         # theme tokens (light + dark)
  tools/ats-plain-text-converter/
    page.tsx                          # server component: SEO metadata + JSON-LD + FAQ
    Converter.tsx                     # client component: UI, scoring, tracking
    converter.module.css
  tools/pdf-resume-to-website/
    page.tsx                          # server component: SEO metadata + JSON-LD + FAQ
    Converter.tsx                     # client component: PDF extract, preview, tracking
    converter.module.css
lib/
  ats.ts                              # pure ATS analysis logic
  resume.ts                           # pure resume text → structured website data
public/
  pdf.worker.min.mjs                  # self-hosted pdf.js worker (see note below)
e2e/
  theme.spec.ts                       # ATS: computed-style + axe contrast tests
  pdf-tool.spec.ts                    # PDF→website: computed-style + axe contrast tests
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

Open [http://localhost:3000/tools/ats-plain-text-converter](http://localhost:3000/tools/ats-plain-text-converter) and click **"Try a sample"**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run test:e2e` | Playwright theme + contrast tests (light & dark) |

## Analytics

PostHog captures pageviews and the tool's funnel events (`tool_started`, `tool_completed`,
`result_interacted`, `cta_clicked` — each tagged with `tool_slug`). Wiring lives in
`app/providers.tsx`; the `track()` helper in `Converter.tsx` forwards events.

It's gated on an env var, so the app runs fine without it (events become no-ops). To enable:

| Variable | Example | Where |
|----------|---------|-------|
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_...` (PostHog project key) | Vercel env (Production + Preview) + local `.env.local` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | same |

`NEXT_PUBLIC_*` vars are embedded at build time; the CI workflow's `vercel pull` fetches them from
the Vercel project before building, so set them in Vercel for production/preview.

> ⚠️ **Do not mark these as "Sensitive" in Vercel.** Sensitive vars are withheld from the build,
> which silently breaks `NEXT_PUBLIC_` inlining (the key won't reach the browser and PostHog won't
> load). Add them as normal plaintext vars. Sensitive can't be toggled off — delete and re-add.
> The `phc_` project key is publishable/client-side by design, so this is safe.

## Roadmap

Next tools in the cluster (priority order): Developer Resume → Portfolio, ThemeDeck, GitHub → Portfolio, and others — all built on the template above with an internal-link mesh between them. (PDF Resume → Website and the ATS Converter are live.)
