# Regression checklist

End-to-end functional flow checks for vibe-resume. Two tiers:

- **[Smoke](#smoke-10-min)** — run before every release. The critical
  paths that, if broken, ship-block.
- **[Full](#full-30-min)** — run on milestone releases (Phase ships,
  Vercel infra changes, Supabase plan upgrades, dependency major bumps).

Each item is tagged:

- 🤖 **auto** — already gated by unit or e2e; don't re-test by hand
  unless you suspect drift between the gate and reality.
- 👁 **manual** — must be eyeballed; no automation yet.
- 🎯 **next** — call-out for the automation backlog (see
  [appendix](#worth-automating-next)).

Test against **production** (viberesume.in) after Vercel deploys, not
local. Local can lie about CDN caching, OG image generation, Supabase
network paths, and Resend SMTP. Use a fresh email for any sign-in
test so OTP rate limits don't bite.

---

## Smoke (≤10 min)

Run before every `git push` to main that touches anything user-facing.

### 0. Public-slug surfaces (≤1 min)
- 👁 A published profile shows the "Made with Vibe Resume · claim
  your free handle" footer linking home.
- 👁 Contacts on a published profile are clickable: email → mail
  client, phone → dialer, URL → new tab (not dead joined text).
- 👁 **Download PDF** (top-right) opens the print dialog; the
  preview/saved file is the resume only — no header/footer/button,
  white background even if the site theme is dark.
- 👁 If the owner set an availability line, it shows at the top with
  a **Get in touch** button that opens a `mailto:` to their email.
- 👁 A published profile has **no platform header / 10-tool footer** —
  just the resume + the one-line "Made with Vibe Resume" footer.
  (Every other page still has the full header + footer.)
- 👁 Signed in as the owner, the profile shows a slim **"This is your
  live site · Edit · Copy link · Account"** bar at the top. Signed out
  / as anyone else, that bar is absent.
- 👁 An unclaimed valid slug (e.g. `/definitely-free-handle-xyz`)
  shows the "this handle is available — claim it" invite (noindex),
  NOT a bare 404. A claimed-but-unpublished slug still 404s.

### 1. Anonymous homepage loads (≤30s)
- 👁 Visit https://viberesume.in/ in a clean browser tab.
- 👁 Header shows "Sign in" (not avatar). Three tool group sections
  render with tool cards.
- 🤖 Theme toggle visible and clickable (`e2e/theme-toggle.spec.ts`).
- 🤖 No console errors on landing (`e2e/home.spec.ts` axe).
- 🤖 "See a live example ↗" trust link → `/example` renders the sample
  resume site with a "Make yours free →" CTA (`e2e/example.spec.ts`).

### 2. Sign in via 6-digit code (≤2 min)
- 👁 Click **Sign in** → `/signup`. Submit a fresh email.
- 👁 Email arrives from `noreply@viberesume.in` within 30s with a
  6-digit code + fallback link.
- 👁 Enter code → land on `/account`. Header now shows avatar+email
  pill.
- 👁 `/account` opens with the journey strip (Generate → Claim →
  Publish → Share); completed steps show ✓, the next step is
  highlighted with a one-line nudge. With a live site, the strip shows
  the Share row (Copy link / QR / LinkedIn / Add a photo).
- 👁 Homepage while signed in shows the "Your site … Manage your
  site →" band above the hero; signed out it must NOT appear.
- 👁 **Hard fail signal:** if email arrives from
  `noreply@mail.app.supabase.io`, custom SMTP regressed — Resend
  config in Supabase Dashboard → Auth → SMTP got reset.

### 3. PDF publish round-trip (≤3 min)
- 👁 New tab → `/tools/pdf-resume-to-website`. Upload a sample PDF (or
  click "Try a sample" if you don't have one handy).
- 👁 Result renders inside the faux browser frame with name, theme
  chips, and an extracted photo (if the PDF had one).
- 👁 Result shows exactly ONE publish button ("Publish this website →")
  plus a "See a live example ↗" link. No sticky CTA band below.
- 👁 Click **Publish this website →**. Signed out: `/signup` heading
  reads "Your website is ready 🎉" (saved-in-browser reassurance), NOT
  the generic sign-in copy. Signed in: straight to `/account/publish`.
- 👁 If you already have a claimed handle, single-button publish
  fires. With NO handle: an inline claim step appears on the same page
  (input prefilled from your parsed name, live availability line,
  one **Claim & publish → ** button) — it must NOT bounce you to the
  handle-checker tool page.
- 👁 If you used "Try a sample": the first publish click must ARM a
  "⚠ This is the sample resume (Jane Doe)" warning and swap the button
  to **Publish the demo anyway →** — only the second click publishes.
  (Skip this check when testing with a real PDF.)
- 👁 Publish → land on `/account?published=<slug>` with the "🎉 Your
  website is live" banner: big URL link, **Copy link** (flips to
  ✓ Copied), **Make a QR code →** (QR tool opens with the URL already
  rendered), and **Edit profile →**.
- 👁 Click View live → public profile at `/{slug}` renders the
  resume site. Reload — still there (real, not ephemeral).
- 👁 (Prod only, if `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID`
  are set) the live card on `/account` shows "N views" next to the
  kind label. Absent those env vars, no count renders (not an error).

### 4. Edit reflects on live (≤2 min)
- 👁 From `/account`, click **Edit →** on the published handle.
- 👁 Settings page shows the live preview at the top.
- 👁 Change the name or click a different theme → preview updates
  inline.
- 👁 Set the **Availability / what you want** field → preview shows
  the line + a **Get in touch** button; clearing it hides the block.
- 👁 **Save changes** → success message → click **View live ↗** →
  live profile reflects the change. Reload to confirm it's persisted.

### 5. Unpublish + re-publish (≤2 min)
- 👁 In settings, click **Unpublish** → confirm dialog → land on
  `/account?unpublished=<slug>`.
- 👁 Open the public URL `/{slug}` — should 404.
- 👁 `/account` row now reads "Unpublished" with an **Edit →** link
  (not Publish — keeps the data).
- 👁 Click Edit → Save (no changes needed) → re-publishes → live URL
  works again.

### 6. Sign out (≤30s)
- 👁 `/account` → **Sign out** button. Header reverts to "Sign in".
- 👁 Refresh `/account` → bounces to `/signup`.

---

## Full (≤30 min)

Run before any milestone release: a Phase ship, a Vercel infra change
(node version, region), a Supabase plan upgrade, a major dependency
bump (Next, React, Supabase JS, pdfjs-dist), or before a public launch
(Lane B post).

Includes everything in [Smoke](#smoke-10-min), plus:

### 7. DevResume publish (≤3 min)
- 👁 `/tools/developer-resume-to-portfolio` → paste a sample (or use
  "Try a sample"). Tech stack chips and live GitHub repo cards render.
- 👁 Click **Publish this portfolio →** → `/account/publish` (or
  handle checker if no handle yet).
- 👁 Live URL renders `DevPortfolio` — repos with stars/lang/owner
  visible, not the resume layout. Confirms `app/[slug]/page.tsx` is
  dispatching on `kind: "developer"`.

### 8. GitHub publish (≤3 min)
- 👁 `/tools/github-to-portfolio` → type `octocat` → Build.
- 👁 Result shows avatar, About from README, repo cards with
  thumbnails + topics.
- 👁 Publish → live URL renders `GhPortfolio` with the avatar in the
  hero, repo thumbnails, etc. Confirms `kind: "github"` dispatch.

### 9. /account dispatch by kind (≤1 min)
- 👁 After steps 3, 7, 8 you should have 3 handles in `/account`.
- 👁 Resume-kind row shows **Edit →** (in-app editor).
- 👁 Developer + GitHub kind rows show **Re-publish from tool →** —
  *not* Edit. (The settings page only handles `kind: "resume"`.)
- 👁 Each kind row's label includes "Resume site" / "Developer
  portfolio" / "GitHub portfolio" so you can tell which is which.

### 10. Cross-tool funnels (≤2 min)
- 👁 `/tools/theme-picker` → swipe themes → **Keep** → click **Use
  this theme on my resume**. Should route to
  `/tools/pdf-resume-to-website?theme=<id>` and the theme pre-applies
  in the PDF result chip strip when you generate.
- 👁 `/tools/linkedin-url-customizer` → enter a name → click **Claim
  viberesume.in/{slug} →**. Should route to `/claim/{slug}`, not
  `/signup` directly. If signed in, claim runs and lands on
  `/account?claimed={slug}`.
- 👁 `/tools/resume-qr-code-generator` → result CTA **Claim a
  viberesume.in handle →** routes to `/tools/portfolio-handle-checker`,
  not `/signup`.
- 👁 `/tools/portfolio-handle-checker` → enter a free handle → Claim
  → flow as above.

### 11. Tools that should NOT publish (≤1 min)
Verify the de-decoy sweep stuck. None of these tools should render a
**Publish on Vibe Resume** CTA anywhere in their result section:

- 👁 `/tools/ats-plain-text-converter` → no publish CTA after running.
- 👁 `/tools/theme-picker` → no publish CTA after Keep.
- 👁 `/tools/portfolio-about-me-generator` → no publish CTA.
- 👁 `/tools/case-study-template` → no publish CTA.

(LinkedIn URL Customizer + Resume QR + Handle Checker DO have
"claim" CTAs, by design — see step 10.)

### 12. Theme toggle persistence (≤1 min)
- 👁 Click theme toggle to Dark → reload → still dark.
- 👁 Toggle to System → reload → follows OS preference.
- 🤖 Light/dark axe contrast (`e2e/theme-toggle.spec.ts`).

### 13. Mobile viewport (≤3 min)
- 👁 Open DevTools → device toolbar → iPhone 14 (390×844).
- 👁 Header collapses email (avatar-only), Tools dropdown still
  opens/closes, theme toggle visible.
- 👁 Homepage cards stack vertically.
- 👁 Settings live preview stacks above the form. Photo upload
  block readable.
- 👁 Public profile (`/{slug}`) is single-column readable.

### 14. SEO metadata on a published profile (≤2 min)
- 👁 View source on a published `/{slug}` page. Confirm:
  - `<title>` = "{name} — {title or headline}" (per kind)
  - `<meta name="description">` from summary/about, truncated to 160
  - `<link rel="canonical" href="https://viberesume.in/{slug}">`
  - `<meta property="og:title">` + `og:description` match
  - `og:image` points at `/{slug}/opengraph-image` — open it: a
    branded card with the person's name + headline renders (1200×630).
  - a `<script type="application/ld+json">` Person block with `name`,
    `jobTitle`, `url`, and `sameAs`/`email` when present.
- 👁 `viberesume.in/sitemap.xml` — loads, lists tools + legal
  pages + published profiles (Phase 3; hourly revalidate, so a
  just-published profile can take up to an hour to appear).
- 👁 `viberesume.in/robots.txt` — disallows `/api/`, `/account`,
  `/auth/`, `/claim/`.

### 15. RLS boundary check (≤2 min)
This is the kind of check that's awkward to automate but catches a
real-leak class.

- 👁 In a private browser window (no auth cookies), open DevTools
  console and run:
  ```js
  fetch('https://<your-supabase-ref>.supabase.co/rest/v1/slugs?select=resume_data&limit=1', {
    headers: { apikey: '<NEXT_PUBLIC_SUPABASE_ANON_KEY>' }
  }).then(r => r.json()).then(console.log)
  ```
- 👁 Response should be `permission denied for column resume_data`
  or an empty/null `resume_data` field — **never** the actual JSON.
  If you see real `resume_data` returned, the slice 2A
  `REVOKE SELECT (resume_data) ... FROM anon` migration got reverted
  in Supabase.

### 16. Tool result preview after-state (≤2 min)
Spot-check each tool's primary result has not broken. (e2e covers a lot
of this, but does it on a stub.)
- 🤖 Each tool's primary "Try a sample" → result renders
  (`e2e/<tool>-tool.spec.ts`).
- 🤖 No axe color-contrast violations (each spec's axe pass).
- 👁 Manually click through #5 LinkedIn / #6 About Me / #9 Case Study
  to confirm CTAs land where they should after the slice-2C copy
  changes.

### 17. Quick sanity on the publish flow stash (≤1 min)
- 👁 Open `/tools/pdf-resume-to-website`, generate a result, click
  **Publish this website →** while signed out.
- 👁 Should land on `/signup?next=/account/publish` (or the handle
  checker if you have no claimed slug). Sign in.
- 👁 The stashed resume should still be in sessionStorage and the
  publish should complete on /account/publish. Confirms the
  signin-detour preserves the publish intent.

### 18. Phase 3 destructive actions (≤3 min)
Use a throwaway handle for this — these delete real data.
- 👁 All destructive buttons use a **two-step inline confirm**: first
  click arms (label states the consequence + Cancel appears), second
  click executes. No native dialogs anywhere.
- 👁 `/account` → published rows show **Unpublish** (all kinds, not
  just resume) AND **Release handle**; unpublish keeps the row,
  release deletes it.
- 👁 `/account` → **Release handle** on an unneeded slug → arm +
  confirm → banner "Released viberesume.in/{slug}". The public URL now
  shows the **claim invite** (released = unclaimed); handle checker
  shows it available again.
- 👁 **Unpublish vs release are distinct:** unpublish (step 5) keeps
  the row + data; release deletes it. Verify an unpublished handle
  still shows Edit, not Claim.
- 👁 With a second throwaway account: **Danger zone → Delete account
  & data** → confirm → lands on `/`. Signing in again with that email
  creates a fresh empty account (no handles).
- 👁 Claim cap: an account at 5 handles gets the "handle limit"
  error banner on a 6th claim, not a silent failure.
- 👁 Cron auth: `curl -s -o /dev/null -w "%{http_code}" \
  https://viberesume.in/api/cron/reap-slugs` → **401** (unauthenticated
  callers always rejected). Vercel → Settings → Cron Jobs shows the
  daily 04:00 UTC job; its last run is green.

---

## Worth automating next

In priority order — these are the items where manual cost is highest
and automation would catch a real-regression class. Each becomes a new
Playwright spec when picked up.

1. **Authenticated end-to-end publish journey.** Real Supabase test
   tenant (or local supabase via `supabase start`) + an email stub
   (Inbucket or MailHog). Spec walks signup → claim → publish (any
   kind) → assert `/{slug}` renders. This is the biggest gap in CI
   today; everything else in this checklist is downstream of it.
   *Catches:* PATCH endpoint regressions, sessionStorage stash schema
   drift, `/account/publish` routing breakage, OTP flow regressions.
2. **Per-kind dispatch on `/[slug]`.** Stub three rows in Supabase
   (one of each kind), visit each public URL, assert the right
   component renders. Faster + cheaper than the full publish journey
   above; can be a unit-ish test against a mocked Supabase client.
   *Catches:* `validatePublishPayload` regressions, dispatch logic
   in `app/[slug]/page.tsx`, render-component imports.
3. **Settings edit → public profile reflects.** With the test tenant,
   PATCH a known slug from the test, then GET the public URL and
   assert the change appears. *Catches:* the SettingsClient → PATCH
   payload shape, RLS regressions on `slugs` UPDATE, render
   component prop wiring.
4. **RLS regression — anon SELECT on `resume_data` returns null /
   denied.** A direct REST call from the test runner with the anon
   key, asserting either error or null. *Catches:* the slice-2A
   migration being silently reverted (this happened in someone's
   real prod once, painful to debug). Two-line test.
5. **Email template + OTP-length sanity.** Boot supabase locally,
   call `signInWithOtp`, parse the dev-inbox email, assert it
   contains a 6-digit number AND `{{ .Token }}` was substituted (not
   left literal). *Catches:* template field name drift, OTP-length
   config drift.

---

## Notes on running this

- **Reuse one fresh-email handle.** Steps 2 + 3 + 4 + 5 + 6 can all
  run against the same signed-in session with the same claimed
  handle. The whole smoke run takes one email account.
- **CI doesn't catch everything in here.** The Playwright gate runs
  per-tool axe + interaction tests; the multi-tool publish journey
  isn't automated. That's the gap this checklist exists to cover.
- **Don't update this doc during an incident.** If something here
  breaks, fix the code first, then update the doc only if the *step*
  was wrong (not because the *result* was wrong).
