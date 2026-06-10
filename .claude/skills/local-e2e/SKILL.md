---
name: local-e2e
description: Run vibe-resume Playwright e2e locally without flakes. Use whenever running, debugging, or fixing e2e tests on this machine (CI behaves differently — offline, no .env.local).
---

# Running e2e locally (the only reliable recipe)

`.env.local` has a live `phc_` PostHog key that is **inlined at build time**. With it present, posthog.init loads a remote script that blocks the browser `load` event → all `page.goto` timeouts. Moving the file aside is NOT enough — you must rebuild without it.

## Sequence (PowerShell)

1. Kill anything on :3000 — stale servers serve OLD builds → new routes 404, confusing failures:
   ```powershell
   Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | % { Stop-Process -Id $_.OwningProcess -Force }
   ```
2. `Move-Item .env.local .env.local.bak`
3. `npm run build`
4. `npm start` (prod server — instant, no dev compile latency; Playwright `reuseExistingServer:true` reuses it). Confirm `✓ Ready` in the log before testing.
5. `npx playwright test <spec> --workers=1` — the 4-worker run flakes locally with goto timeouts under box contention (not a code bug); CI at 4 workers is fine.
6. Restore: `Move-Item .env.local.bak .env.local` and rebuild before any deploy-related work.

## CI differences to remember
- CI runs against `npm run dev`, truly offline, with no `.env.local` — every `NEXT_PUBLIC_*` is undefined in the browser bundle. Hence the global-chrome env-guard rule in CLAUDE.md.
- To reproduce CI contrast failures, run against `npm run dev` with env aside — but local Windows Chromium may still false-pass axe contrast that Linux fails, so design with ≥4.6:1 margin instead of trusting a local pass.
