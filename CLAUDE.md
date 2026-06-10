@AGENTS.md

# Vibe Resume

Static-first Next.js 16 (App Router) site — 10 free resume/portfolio tools + real publish flow (Supabase auth, `viberesume.in/{slug}`). Live at https://viberesume.in. **README.md is the source of truth** — read the relevant section before changing product behavior, and update it (without being asked) as part of every shipped change.

## Commands
- `npm run build` — REQUIRED locally before every push (no TS gate in CI; Vercel build is conditional)
- `npm run test:unit` — Node built-in test runner (`--experimental-strip-types`)
- `npm run test:e2e` — Playwright; needs special local setup → use the `local-e2e` skill before running locally
- Stack: Next 16.2 / React 19 / TS, pdfjs-dist, Supabase (`@supabase/ssr`), PostHog, Playwright + axe. **No new npm deps without good reason.**

## Hard rules (violations have bitten us in CI)
1. **Global-chrome client islands** (anything mounted in `app/layout.tsx`, `SiteHeader`, `SiteFooter`) MUST guard `NEXT_PUBLIC_*` env vars: read the var first, render anonymous/fallback state if missing, never throw. CI e2e runs with `.env.local` removed — `createBrowserClient(url!, key!)` throws and tanks every spec.
2. **No copy-coupled e2e selectors.** Never `:text('literal copy')` for visual/structural assertions — it silently re-binds when the target is removed. Use `data-testid` or `getByRole({ name })`; rely on the axe pass (already in every spec) for contrast.
3. **Contrast: never put accent/warn colored text on a same-hue `color-mix` tint** — local Windows Chromium false-passes axe while CI Linux fails it. Use solid token surfaces (`--panel`/`--panel2`) under colored text; keep ≥4.6:1 margin by design.
4. **lib→lib imports need the `.ts` extension** (ESM strip-types test runner; `allowImportingTsExtensions` is on).
5. TDD for `lib/resume.ts` parser changes: failing test first.
6. Commit messages: imperative, specific, include a "Verified: build + tests" line.
7. After any `pdfjs-dist` upgrade: re-copy the worker — `cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/`.

## On-demand skills (don't duplicate their content here)
- `local-e2e` — the only reliable recipe for running Playwright locally
- `new-tool` — checklist for adding a tool page (registry, spec, docs)
