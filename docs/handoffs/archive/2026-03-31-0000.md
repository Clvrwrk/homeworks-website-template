# Project Handoff — Homeworks Website Builder
**Project:** homeworks-website-template
**Repo:** https://github.com/Clvrwrk/homeworks-website-template (not yet pushed)
**Production URL:** not yet deployed
**Date:** 2026-03-31 00:00
**Agent:** Lead Orchestrator
**Reason:** User-requested end-of-session handoff

---

## Accomplished This Session

### Tasks 2–11 of 16 completed

- `src/config/site.ts`: All McKinney values replaced with `{{TEMPLATE_VAR}}` placeholders. Added `ServiceDef`, `LocationDef` types. Color system refactored from `COLORS` object to flat `COLOR_*` constants. Added `GHL_LOCATION_ID`, `SITE_SLUG`, social URL fields, trust signal fields. Commit `99441c4`.
- `src/types/content.ts`: `ServiceContent` + `LocationContent` interfaces + `CONTENT_PLACEHOLDER` constant. Commit `b34d42e`.
- `src/lib/rankability.ts`: Full Rankability Copywriter API client — `createJob`, `pollJob`, `getArtifacts`, `generateContent`, `getRankabilityKey`. Types for intent, tone, status, job, artifacts. Commit `44f5624`.
- `src/data/services.ts` + `src/data/locations.ts`: Placeholder data files with `_placeholder` entry. Overwritten by `/build-website` skill on each client build. Commit `3bf7a44`.
- `supabase/migrations/001_initial_schema.sql`: `contacts` + `projects` tables, RLS on both. Contacts: no anon SELECT (PII). Projects: anon SELECT on published rows only. Service role: full access. Commit `7f1dd24`.
- `astro.config.mjs`: Switched from Google Fonts API to local provider. Added `astro-icon` integration. Removed McKinney-specific sitemap `customPages`. Font files downloaded via `@fontsource` packages and copied to `public/fonts/` (9 files — weight 900 unavailable, max is 800). Commit `8c5c96b`.
- `src/styles/global.css`: Full rewrite — brand CSS vars via `@theme inline`, golden ratio type scale (base 17px, ratio 1.618), layout helpers, button system (5 variants), trust badge, pill chip, GSAP animation utilities (`.reveal-up`, `.icon-reveal`, `.line-draw`, `.cta-pulse-mobile`). Commit `a7f70a8`.
- `src/components/Icon.astro`: Thin astro-icon wrapper with consistent sizing and a11y props. Commit `267ff9f`.
- `src/layouts/Layout.astro`: Replaced `COLORS` import with `COLOR_*` constants. Added `define:vars` style block — brand CSS vars now flow from `site.ts` → `Layout.astro` → `:root` → `global.css`. Fixed `theme-color` meta to use `COLOR_SECONDARY`. Commit `fdf5719`.
- `src/pages/api/contact.ts`: Rewritten — Supabase insert → fire-and-forget `contact-sync`. Added `ContactRow` interface. `as any` casts on Supabase table ops (placeholder `Database = unknown` in supabase.ts). Commit `439e10f`.
- `src/pages/api/contact-sync.ts`: Created — GHL upsert with 3-retry logic, opportunity creation, note with services/timeline/zip, `needs_attention` alert email after max retries. Commit `439e10f`.

## Git State
- **Branch:** main (local only — not yet pushed to GitHub)
- **Last commit:** `439e10f` — "feat: contact form Supabase→GHL sync (mirrors onboarding pattern)"
- **Uncommitted changes:** `docs/` directory (untracked — handoff files only, not source code)

## Task Cut Off
Tasks 2–11 complete. Stopped at a clean boundary before starting Task 12 (Update [slug].astro pages).

## Next Task — Start Here

**Task:** Task 12 — Update `[slug].astro` pages to read from data files

**What to check / do:**
1. `cd "/Users/chussey/Documents/Claude Projects/homeworks-website-template"`
2. Read `docs/superpowers/plans/2026-03-30-template-repo.md` offset 1600 for full Task 12 content
3. Overwrite `src/pages/services/[slug].astro` with plan content
4. Overwrite `src/pages/locations/[slug].astro` with plan content
5. Run `npx tsc --noEmit 2>&1 | grep "slug"` — expect no errors
6. Commit: `git commit -m "feat: [slug].astro pages read from SERVICES_CONTENT + LOCATIONS_CONTENT"`
7. Continue Tasks 13–16

**Remaining tasks after 12:**
- Task 13: Update `.env.example`
- Task 14: Create MCP docs (`docs/mcps/`)
- Task 15: Overwrite `README.md`
- Task 16: Push to GitHub (`Clvrwrk/homeworks-website-template`)

**If TypeScript errors in slug pages:** The `SERVICES` and `LOCATIONS` arrays are empty in the template — `getStaticPaths` returns `[]`. This is expected and valid for SSR. No errors expected.

**Prompt to use:** "Read docs/handoffs/current.md. We're building homeworks-website-template. Tasks 2–11 are complete (last commit 439e10f). Start Task 12: overwrite src/pages/services/[slug].astro and src/pages/locations/[slug].astro from the plan at docs/superpowers/plans/2026-03-30-template-repo.md, then continue through Tasks 13–16."

## Decisions Made This Session

- **`COLORS` object replaced with flat `COLOR_*` constants:** Original McKinney used `COLORS.clay`, `COLORS.navy` etc. New template uses `COLOR_PRIMARY`, `COLOR_SECONDARY` etc. to match the CSS var naming convention in `define:vars`. Easier for `/build-website` skill to do single-value substitution.
- **Font weight 900 not available via @fontsource:** Max weight in the `@fontsource/plus-jakarta-sans` package is 800. `astro.config.mjs` updated to remove the 900 variant. Design system still works — 800 renders as the heaviest weight.
- **`as any` casts on Supabase table operations:** `supabase.ts` uses `Database = unknown` as a placeholder. TypeScript infers table rows as `never` without generated types. Pattern is documented in `supabase.ts` comments. Casts are scoped to insert/update calls only. Added `ContactRow` interface in `contact-sync.ts` for row reads.
- **`@fontsource` packages added to dependencies:** Font files sourced from `node_modules/@fontsource/*/files/` and copied to `public/fonts/`. The `@fontsource` packages remain in `package.json` — they're the reliable fallback if Google Fonts static URLs rotate.

## Blockers Requiring Human Action

1. **GitHub repo not yet created or pushed** — Run Task 16 when template is complete. Requires GITHUB_PERSONAL_ACCESS_TOKEN with `repo` + `org:read` scopes on Clvrwrk org.
2. **Rankability API key needed for HAWC build** — `RANKABILITY_API_KEY` must be set before running `/build-website` for HAWC. Get from rankability.com/developers.
3. **`OPERATOR_GHL_CONTACT_ID` in contact-sync.ts** — Hardcoded placeholder string at line ~157. Must be replaced with a real GHL contact ID per client before the alert email feature works.

## Verification Commands
1. `cd "/Users/chussey/Documents/Claude Projects/homeworks-website-template" && git log --oneline -5` — should show 5 commits ending with `d7a09ec` at bottom
2. `npx tsc --noEmit 2>&1 | wc -l` — should be low (expected errors from McKinney .astro pages not yet rewritten)
3. `ls public/fonts/ | wc -l` — should return `9`
4. `grep -c "ENABLE ROW LEVEL SECURITY" supabase/migrations/001_initial_schema.sql` — should return `2`

## Full Context

### What was built across ALL sessions (complete feature list)

**Session 1 (2026-03-30):**
- Cloned McKinney Fixit Pros as starting template
- Full brainstorming + design for Homeworks Website Builder system
- Design spec (11 sections), 3 implementation plans (template repo, build-website skill, HAWC execution)
- Updated project-handoff skill to OmniDrop format
- Added session-handoff-system reference doc
- Task 1 of 16: homeworks-website-template repo initialized with new dependencies

**Session 2 (2026-03-31):**
- Tasks 2–11: site.ts anonymized, content types, Rankability client, placeholder data files, Supabase migration, local fonts, global.css, Icon.astro, Layout.astro brand vars, contact API Supabase→GHL sync

### Architecture decisions

- **Single source of truth:** `src/config/site.ts` holds ALL client-specific constants as `{{TEMPLATE_VAR}}` strings. The `/build-website` skill does a single-pass replacement of this file. Nothing else in the codebase is client-specific.
- **Brand color injection:** `Layout.astro` uses Astro's `define:vars` to set `:root` CSS custom properties at build time. `global.css` consumes these via `var(--brand-primary)` etc. No CSS-in-JS, no runtime theming.
- **4-agent parallel Phase 1:** When `/build-website` runs, Agent A (GitHub), Agent B (Supabase), Agent C (Rankability content), Agent D (WCAG/design review) run in parallel. Phase 2 (populate + push files) waits for all four.
- **Contact sync is fire-and-forget:** `/api/contact` inserts to Supabase and returns 303 redirect immediately. GHL sync happens async in `/api/contact-sync`. If sync fails 3 times, status becomes `needs_attention` and an alert email fires via GHL.
- **Rankability content is 24 jobs for HAWC:** 15 service pages + 9 location pages, all parallel, poll every 10s, max 10 min timeout. Results stored as TypeScript data files.

### Design system

- **Fonts:** Plus Jakarta Sans (display/headings, `--font-display`) + DM Sans (body, `--font-sans`). Two fonts max — never add a third.
- **Type scale:** Golden ratio, base 17px, ratio 1.618. h1: clamp(2.75rem, 5.5vw, 4.5rem). h2: clamp(2rem, 3.75vw, 2.875rem).
- **Colors:** All via CSS vars — `--brand-primary` (CTA fill), `--brand-secondary` (nav/dark sections), `--brand-accent` (light section bg), `--brand-accent-2` (body text). Fixed neutrals: `--color-ink: #151d25`, `--color-muted: #567798`.
- **Animation:** GSAP ScrollTrigger for `.reveal-up` (opacity 0→1, y 24→0, 400ms, once:true). CSS-only `icon-enter` keyframe for icons. `cta-pulse-mobile` pulse (max scale 1.03, 2s, mobile only).
- **Buttons:** `.btn-primary`, `.btn-secondary`, `.btn-navy`, `.btn-ghost`, `.btn-submit` — all min-height 54px, font-display, 700 weight, border-radius 9999px.

### Key invariants (never violate)

- `SUPABASE_SERVICE_ROLE_KEY` is never `PUBLIC_SUPABASE_SERVICE_ROLE_KEY` — server-side only
- `GHL_API_KEY` is never `PUBLIC_GHL_API_KEY` — server-side only
- `RANKABILITY_API_KEY` is never `PUBLIC_RANKABILITY_API_KEY` — server-side only
- `PUBLIC_SUPABASE_URL` is correct (URL is not a secret)
- WCAG AA minimum 4.5:1 for normal text, 3:1 for large text/UI components — validate before shipping any brand color
- Max 2 fonts — Plus Jakarta Sans + DM Sans. Never add a third.
- Max animation scale: 1.03. No looping animations on page content. `once: true` on all ScrollTriggers.
- Contact form always writes to Supabase first, then fires GHL sync async. Never write directly to GHL only.

### Service / deployment map

| Service | Detail |
|---------|--------|
| GitHub org | Clvrwrk — all client repos created here as private repos |
| Supabase | One project per client — provisioned via MCP during `/build-website` |
| GoHighLevel | Per-client location ID, pipeline ID, stage ID — set in site.ts |
| Rankability | RANKABILITY_API_KEY env var — one key, multiple client_ids |
| Coolify | nixpacks deployment — port 4321, `node ./dist/server/entry.mjs` start command |
| Plans location | `/Users/chussey/Documents/Claude Projects/docs/superpowers/plans/` |
| Specs location | `/Users/chussey/Documents/Claude Projects/docs/superpowers/specs/` |
