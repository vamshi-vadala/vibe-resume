---
name: new-tool
description: Checklist for adding a new tool page to vibe-resume (registry, lib, e2e spec, docs). Use when creating a new /tools/* page or significantly extending an existing one.
---

# Adding a new tool

Follow the existing pattern — look at a recent tool (e.g. `app/tools/case-study-template/` + `lib/casestudy.ts`) before writing anything.

## Architecture
- **Pure, testable logic in `lib/<tool>.ts`** (no React, no browser APIs) + a client component for the page. TDD the lib: failing unit test in `test/` first.
- Register the tool in `lib/tools.ts` with the right `group` (`online` / `portfolio` / `brand`) — homepage sections, header, and footer all auto-sync from this registry. Don't hand-edit nav.

## Required before "done"
1. Unit tests for the lib (Node built-in runner; lib→lib imports use `.ts` extension).
2. **Its own e2e spec in `e2e/`** — CI only gates what has a spec. Include light + dark + an `AxeBuilder` pass (every existing spec does). No `:text('copy')` selectors — use `data-testid` / `getByRole`.
3. Contrast: colored text only on solid token surfaces (`--panel`/`--panel2`), ≥4.6:1 margin (local axe false-passes what CI fails).
4. `npm run build` green locally.
5. Update `README.md` (source of truth) in the same task — tool entry, any new env/setup notes.
6. Commit: imperative message + "Verified: build + tests" line.

## Gotchas
- If the tool touches global chrome (header/footer/layout), the `NEXT_PUBLIC_*` env-guard rule applies (see CLAUDE.md rule 1).
- No new npm deps without good reason.
