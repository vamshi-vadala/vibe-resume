# Vibe Resume

A suite of free, SEO-driven micro-tools that turn resumes and profiles into shareable web pages — each tool an indexed landing page that funnels to the Vibe Resume product.

This repo is the implementation of that programmatic-SEO plan. **One tool is built so far**, plus the reusable patterns (SEO metadata, JSON-LD, conversion tracking, theming, e2e tests) the rest of the cluster will reuse.

## Built so far

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
lib/
  ats.ts                              # pure ATS analysis logic
e2e/
  theme.spec.ts                       # computed-style + axe contrast tests
playwright.config.ts                  # runs tests in light & dark schemes
```

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

## Roadmap

Next tools in the cluster (priority order): PDF Resume → Website (flagship), Developer Resume → Portfolio, ThemeDeck, GitHub → Portfolio, and others — all built on the template above with an internal-link mesh between them.
