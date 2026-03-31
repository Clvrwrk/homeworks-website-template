# Project Handoff — Homeworks Website Builder
**Project:** homeworks-website-template
**Repo:** https://github.com/Clvrwrk/homeworks-website-template
**Production URL:** not yet deployed
**Date:** 2026-03-30 23:59
**Agent:** Lead Orchestrator
**Reason:** User-requested end-of-session handoff

---

## Accomplished This Session

### Tasks 12–16 of 16 — TEMPLATE COMPLETE

- `src/pages/services/[slug].astro`: Fully rewritten — reads from `SERVICES_CONTENT[service.slug]` with `CONTENT_PLACEHOLDER` fallback, breadcrumb + FAQ JSON-LD schemas, GSAP reveal-up. Commit `5f4d04a`.
- `src/pages/locations/[slug].astro`: Fully rewritten — reads from `LOCATIONS_CONTENT[location.slug]`, services grid, FAQ accordion, GSAP reveals. Commit `5f4d04a`.
- `src/pages/media-kit.astro`: SSR page lists Supabase `press-kit` bucket, renders download grid with image previews or file-type badges. Commit `972e94a`.
- `.env.example`: Rewritten with all required vars, correct `PUBLIC_` prefix rules, `RETRY_SECRET` added. Commit `838c4ff`.
- `docs/mcps/supabase-mcp.md` + `github-mcp.md` + `ghl-mcp.md` + `coolify-mcp.md`: Full setup READMEs with auth, config, key tools, common patterns, troubleshooting. Commit `6788e67`.
- `astro.config.mjs`: Removed broken `experimental.fonts` block (API uses `variants` key which was unrecognized in Astro 5.18). Commit `7d76179`.
- `src/styles/global.css`: Added 9 `@font-face` declarations for Plus Jakarta Sans (400–800) and DM Sans (400–700) from `public/fonts/`. Fixed self-referencing CSS vars `--font-display` and `--font-sans`. Commit `7d76179`.
- `src/config/site.ts`: Added missing exports `JOBS_COMPLETED`, `YEARS_EXPERIENCE`, `RESPONSE_TIME`. Fixed duplicate `BUSINESS_HOURS` (was hardcoded `"Mon–Sat: 7am–7pm"`, now `"{{BUSINESS_HOURS}}"`). Commit `7d76179`.
- `src/components/Header.astro`: Removed unused `COLORS` import (leftover from McKinney). Commit `7d76179`.
- GitHub push: Repo created at `Clvrwrk/homeworks-website-template` (private). All commits pushed. Commit `31d7f31`.

## Git State
- **Branch:** main
- **Last commit:** `31d7f31` — "chore: final build verification — template ready for /build-website skill"
- **Uncommitted changes:** none — clean working tree, fully pushed

## Task Cut Off
None — all 16 tasks complete. Template is finished and pushed. Session ended at a clean boundary.

## Next Task — Start Here

**Task:** Build the `/build-website` skill

**What to check / do:**
1. Read `docs/superpowers/plans/` — look for the build-website skill plan (may be at `/Users/chussey/Documents/Claude Projects/docs/superpowers/plans/`)
2. The skill lives at `/Users/chussey/.claude/skills/build-website/` (create if not exists)
3. The skill must: (a) gather client intake data, (b) run 4 parallel agents (GitHub repo, Supabase project, Rankability content, WCAG review), (c) populate `src/config/site.ts` + `src/data/services.ts` + `src/data/locations.ts` with real client values, (d) push to GitHub, (e) deploy via Coolify
4. Reference `docs/mcps/` for MCP tool patterns

**Prompt to use:** "Read docs/handoffs/current.md. The homeworks-website-template is complete (all 16 tasks done, last commit 31d7f31, pushed to Clvrwrk/homeworks-website-template). Next session: build the /build-website skill. Check /Users/chussey/Documents/Claude Projects/docs/superpowers/plans/ for the build-website plan, then scaffold the skill."

## Decisions Made This Session

- **`Clvrwrk` is a personal GitHub account, not an org:** `mcp__plugin_github__create_repository` with `organization: "Clvrwrk"` returns 404. Use it without the `organization` param — the authenticated user IS Clvrwrk.
- **Astro `experimental.fonts` local provider is broken in 5.18:** The `variants` key is not recognized. Replaced with standard `@font-face` declarations in `global.css`. Font files serve from `public/fonts/` at `/fonts/*.woff2`. No Astro magic needed.
- **`--font-display: var(--font-display)` was self-referencing:** Fixed to `"Plus Jakarta Sans", system-ui, sans-serif`. Same issue with `--font-sans: var(--font-body)` — `--font-body` was never defined; fixed to `"DM Sans", system-ui, sans-serif`.
- **`BUSINESS_HOURS` was hardcoded:** Was `"Mon–Sat: 7am–7pm"` — changed to `"{{BUSINESS_HOURS}}"` so `/build-website` can substitute client hours.
- **`COLORS` import removed from Header.astro:** Was imported but never used in the template markup. Leftover from McKinney. Removal was safe.

## Blockers Requiring Human Action

1. **`OPERATOR_GHL_CONTACT_ID` in `src/pages/api/contact-sync.ts` ~line 157** — Hardcoded placeholder string. Must be replaced with a real GHL contact ID before the alert email feature works. Do this per-client during `/build-website`.
2. **Rankability API key** — `RANKABILITY_API_KEY` must be set before running `/build-website` for HAWC. Get from rankability.com/developers.
3. **Coolify MCP server** — `@coolify/mcp-server` package name in `docs/mcps/coolify-mcp.md` is placeholder. Verify actual package name before using.

## Verification Commands
1. `cd "/Users/chussey/Documents/Claude Projects/homeworks-website-template" && git log --oneline -5` — should show `31d7f31` at top
2. `npm run build 2>&1 | tail -5` — should complete with no errors
3. `ls dist/server/entry.mjs && echo "PASS"` — should return PASS
4. `grep -c "font-face" src/styles/global.css` — should return `9`
5. `git remote get-url origin` — should return `https://github.com/Clvrwrk/homeworks-website-template.git`

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

**Session 3 (2026-03-30 evening):**
- Tasks 12–16: [slug].astro pages, media-kit, .env.example, MCP docs, build verification, GitHub push
- Build fixes: experimental.fonts removal, @font-face CSS, missing site.ts exports

### Architecture decisions

- **Single source of truth:** `src/config/site.ts` holds ALL client-specific constants as `{{TEMPLATE_VAR}}` strings. The `/build-website` skill does a single-pass replacement of this file. Nothing else in the codebase is client-specific.
- **Brand color injection:** `Layout.astro` uses Astro's `define:vars` to set `:root` CSS custom properties at build time. `global.css` consumes these via `var(--brand-primary)` etc. No CSS-in-JS, no runtime theming.
- **4-agent parallel Phase 1:** When `/build-website` runs, Agent A (GitHub), Agent B (Supabase), Agent C (Rankability content), Agent D (WCAG/design review) run in parallel. Phase 2 (populate + push files) waits for all four.
- **Contact sync is fire-and-forget:** `/api/contact` inserts to Supabase and returns 303 redirect immediately. GHL sync happens async in `/api/contact-sync`. If sync fails 3 times, status becomes `needs_attention` and an alert email fires via GHL.
- **Rankability content is 24 jobs for HAWC:** 15 service pages + 9 location pages, all parallel, poll every 10s, max 10 min timeout. Results stored as TypeScript data files.
- **Clvrwrk is a personal GitHub account:** Not an org — create repos without `organization` param.

### Design system

- **Fonts:** Plus Jakarta Sans (display/headings, `--font-display`) + DM Sans (body, `--font-sans`). Two fonts max — never add a third.
- **Font files:** `public/fonts/*.woff2` — 9 files (Plus Jakarta Sans 400/500/600/700/800, DM Sans 400/500/600/700). Weight 900 not available in @fontsource.
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
- `Clvrwrk` GitHub = personal account, not org. Omit `organization` param on `create_repository`.

### Service / deployment map

| Service | Detail |
|---------|--------|
| GitHub | Clvrwrk/homeworks-website-template (private) — pushed, up to date |
| Supabase | One project per client — provisioned via MCP during `/build-website` |
| GoHighLevel | Per-client location ID, pipeline ID, stage ID — set in site.ts |
| Rankability | RANKABILITY_API_KEY env var — one key, multiple client_ids |
| Coolify | nixpacks deployment — port 4321, `node ./dist/server/entry.mjs` start command |
| Plans location | `/Users/chussey/Documents/Claude Projects/docs/superpowers/plans/` |
| Specs location | `/Users/chussey/Documents/Claude Projects/docs/superpowers/specs/` |
