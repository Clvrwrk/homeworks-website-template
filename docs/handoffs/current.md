# Project Handoff — Homeworks Website Template
**Project:** Homeworks Website Template
**Repo:** https://github.com/Clvrwrk/homeworks-website-template
**Production URL:** Not yet deployed for this feature set
**Date:** 2026-04-02 16:27
**Agent:** Lead Orchestrator (Subagent-Driven Development)
**Reason:** End of session / User-requested

---

## Accomplished This Session

### WorkOS Configuration Guide

- `docs/workos-setup.md`: Created complete WorkOS setup guide — create app + collect API keys, register redirect URIs (local/testing/prod), create organization, create three roles (`agency_admin`, `client_admin`, `worker`), invite first user, generate cookie password, set env vars locally and in Coolify, verification checklist, troubleshooting table.

### Plan 1 — Data Foundation: ALL 6 TASKS COMPLETE (Subagent-Driven)

- `vitest.config.ts`: Created — Vitest config with `environment: "node"`, `include: ["src/**/*.test.ts"]`, `@` alias to `/src`. Commit: `ea38cde`
- `src/lib/slugify.ts`: Created — exports `toSlug`, `appendSuffix`, `uniqueSlug` (async, dependency-injection pattern for checkExists). Commit: `ea38cde`
- `src/lib/__tests__/slugify.test.ts`: Created — 9 tests (4 × toSlug, 2 × appendSuffix, 3 × uniqueSlug). All passing. Commits: `ea38cde`, `126ab91`
- `package.json`: Added `"test": "vitest run"` and `"test:watch": "vitest"` scripts; vitest v4.1.2 in devDependencies.
- `src/types/database.ts`: Created — full typed interfaces for all 4 tables (ProjectRow, ProjectInsert, EventRow, EventInsert, PressMentionRow, PressMentionInsert, MediaItemRow, MediaItemInsert), plus `ProjectStatus`, `ContentStatus`, `ProjectCategory`, `EventType`, `MediaType` types, and `Database` shape with `Relationships: []` on all tables. Commits: `2bd59ed`, `5c68cb9`
- `src/lib/supabase.ts`: Updated — replaced `type Database = unknown` with typed import; updated `TableRow<T>` helper from `Record<string, unknown>` to properly constrained generic. Commit: `2bd59ed`
- `supabase/migrations/002_content_tables.sql`: Created — alters projects table (status, renames, new columns, trigger, RLS), creates events/press_mentions/media_items tables with RLS and service_role policies, partial index on events. **NOT applied — human must apply via Supabase SQL Editor.** Commit: `1537da8`
- `supabase/seed.sql`: Created — 6 project INSERTs (all published, before_photo_url='', ON CONFLICT DO NOTHING). **NOT applied — human must apply after migration 002.** Commit: `5096367`
- `src/pages/projects/index.astro`: Migrated — replaced hardcoded `projects` array with Supabase query (`createServerClient`, select 9 fields, filter published, order by published_at desc). Updated field names: beforeLabel→before_label, afterLabel→after_label, image→after_photo_url. Commit: `498c596`
- `src/pages/projects/[slug].astro`: Migrated — replaced `allCaseStudies.find()` with Supabase `.single()` query. Added `if (!slug)` guard. heroImage uses `cs.after_photo_url` with category fallback map. Updated `cs.scopeItems` → `(cs.scope_items ?? [])`. Commit: `4e1ac41`

---

## Git State

- **Branch:** `feature/plan-1-data-foundation` (worktree at `~/.config/superpowers/worktrees/homeworks-website-template/plan-1-data-foundation`)
- **Last commit:** `4e1ac41` — "feat: migrate projects/[slug].astro from hardcoded array to Supabase query"
- **Uncommitted changes:** `package-lock.json` modified (vitest install side effect — safe to commit or ignore)

| File | Status | Note |
|------|--------|------|
| `package-lock.json` | Modified | Result of `npm install -D vitest` — commit or leave |
| `docs/workos-setup.md` | Untracked | Created this session — not yet committed |

---

## Task Cut Off

None — all 6 Plan 1 tasks completed at a clean boundary. Plans 2 and 3 are ready to execute in parallel once migration 002 and seed are applied.

---

## Next Task — Start Here

**Task:** Apply migration 002 + seed to Supabase, then merge branch and execute Plans 2 & 3 in parallel

**What to do:**
1. Open Supabase project → SQL Editor
2. Paste contents of `supabase/migrations/002_content_tables.sql` → Run
3. Verify: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('events', 'press_mentions', 'media_items');` — expect 3 rows
4. Paste contents of `supabase/seed.sql` → Run
5. Verify: `SELECT slug, status FROM projects ORDER BY created_at;` — expect 6 rows, all published
6. Merge `feature/plan-1-data-foundation` into `main` (or push and PR)
7. Start Plans 2 and 3 in parallel using `superpowers:subagent-driven-development`

**If migration fails with "column already exists":** The `ADD COLUMN IF NOT EXISTS` clauses handle this — check for a different error. Most likely the `RENAME COLUMN` statements will fail if columns were already renamed in a prior migration. Inspect `001_initial_schema.sql` to confirm original column names.

**If seed fails:** Run `SELECT slug FROM projects;` first — if slugs already exist the `ON CONFLICT (slug) DO NOTHING` clause will silently skip them, which is correct behavior.

**Prompt to use:** "Read `docs/handoffs/current.md`. Migration 002 and seed have been applied to Supabase. Merge `feature/plan-1-data-foundation` into main, then execute Plans 2 and 3 in parallel using subagent-driven development. Plans are at `docs/superpowers/plans/2026-04-02-plan-2-public-pages.md` and `docs/superpowers/plans/2026-04-02-plan-3-admin-interface.md`."

---

## Decisions Made This Session

- **`ContentStatus` separate from `ProjectStatus`:** Both are `"draft" | "published"` today, but naming them separately prevents future divergence from silently coupling the two tables. `EventRow` uses `ContentStatus`, `ProjectRow` uses `ProjectStatus`.
- **`Relationships: []` added to all Database table entries:** Required by Supabase `GenericTable` constraint. Without it, the typed client silently falls back to `any`. Not in the original plan — added during code quality review.
- **`uniqueSlug` tests added:** Plan only specified 6 slugify tests but code quality review flagged zero coverage on the most complex function. 3 tests added covering no-collision, single-collision, and multi-collision paths.
- **`if (!slug) return Astro.redirect("/404")` guard in [slug].astro:** TypeScript flags `slug` as `string | undefined` from `Astro.params`. Guard added before the Supabase query to satisfy the type checker without casting.
- **Subagent-Driven Development used for all 6 Plan 1 tasks:** Each task dispatched as a fresh subagent with two-stage review (spec compliance → code quality). All fixes applied before moving to next task.
- **Worktree at global location:** `~/.config/superpowers/worktrees/homeworks-website-template/plan-1-data-foundation` (user chose option 2 — global, not project-local).

---

## Blockers Requiring Human Action

1. **Apply migration 002** — Supabase SQL Editor: paste `supabase/migrations/002_content_tables.sql` and run. Required before any content pages can be tested.
2. **Apply seed SQL** — paste `supabase/seed.sql` after migration 002 is applied. Seeds 6 existing projects.
3. **WorkOS org setup** — follow `docs/workos-setup.md` checklist. Required before Plan 3 (admin interface) can be tested. Code can be written without it.
4. **Supabase storage buckets** — create `project-photos` (public) and `seo-documents` (public) before photo/doc upload can be tested.
5. **Google Maps API key** — `PUBLIC_GOOGLE_MAPS_KEY` env var needed for Events pages (Plan 2).
6. **GHL Custom Objects** — manual creation per design spec Section 7 before GHL notify fires.
7. **Merge branch** — `feature/plan-1-data-foundation` → `main`.

---

## Verification Commands

1. `cd ~/.config/superpowers/worktrees/homeworks-website-template/plan-1-data-foundation && npm test` — should return `9 passed (9)`
2. `npx astro check` (from worktree) — should return 13 errors (all pre-existing, 0 new)
3. After migration: `SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' ORDER BY ordinal_position;` — should include `status`, `scope_items`, `before_photo_url`, `after_photo_url`, `published_at`
4. After seed: `SELECT slug, status FROM projects;` — 6 rows, all `published`

---

## Full Context

### What was built across ALL sessions (complete feature list)

**Sessions 1–3 (pre-2026-04-02):**
- Full Astro 5 SSR website template (16 tasks) — home, services, locations, projects, contact, about, process, privacy, terms, 404
- GHL contact form integration
- Supabase integration (`press-kit` bucket, services/locations content)
- SEO: schema markup, sitemap, robots.txt, OG tags
- Image optimization pipeline (scripts)
- Rankability content integration
- `media-kit.astro` stub (will be replaced in Plan 2)
- Header sticky nav + mobile hamburger + phone CTA
- Footer 4-column desktop + mobile sticky bottom nav

**Session 2026-04-02 (before this session):**
- Full approved design spec for Events, Press Hub, Brand Guidelines, Admin Interface
- Three complete TDD implementation plans written (Plans 1, 2, 3)

**This session (2026-04-02):**
- WorkOS configuration guide (`docs/workos-setup.md`)
- Plan 1 — Data Foundation: all 6 tasks complete (Vitest, types, migration SQL, seed SQL, projects pages migrated to Supabase)

### Architecture decisions

- **Astro SSR (`output: "server"`)** with `@astrojs/node` standalone adapter. Coolify deploys the Node.js server directly.
- **No React** — all interactivity is vanilla JS `<script>` tags + GSAP. The brainstorm previously mentioned React islands — this was reversed after reading the codebase.
- **Three Supabase client patterns:**
  - `createServerClient()` — anon key, respects RLS, public pages
  - `createAdminClient()` — service role key, bypasses RLS, server-side admin API routes only
  - `getBrowserClient()` — singleton, anon key, browser only
- **`created_by` is TEXT** — WorkOS user IDs are strings like `user_01ABCDEF`, not UUIDs.
- **`ContentStatus` vs `ProjectStatus`** — separate named types for events vs projects even though values are identical today.
- **`Relationships: []` on all Database table entries** — required by Supabase `GenericTable` constraint.
- **`uniqueSlug` uses dependency injection** — `checkExists` callback, never imports DB directly, fully testable.

### Design system

- **Fonts:** Syne (headings) + DM Mono (data) + DM Sans (body)
- **Palette:** `#151d25` ink, `#b05d45` terracotta, `#2c3e50` navy, `#567798` steel, `#f0f2f4` snow
- **Admin sidebar:** `#151d25` dark, amber disclaimer banner at top

### Key invariants (never violate)

- **Draft records never appear on public pages** — always filter `status = 'published'`
- **No `prerender = true`** — breaks in this Coolify/standalone-node SSR setup
- **`createAdminClient()` is server-side only** — never in browser scripts or hydrated components
- **`created_by` is TEXT** — WorkOS user IDs are strings, not UUIDs
- **`before_photo_url` AND `after_photo_url` both required to publish** — enforced in Plan 3 API route (not yet built)
- **Publish button hidden (not just disabled) for Worker role** — checked via `user.role === 'worker'`
- **Server-side OG fetch only** — never in browser
- **GHL notify is fire-and-forget** — never throws, never blocks admin UI

### Service / deployment map

| Service | Detail |
|---------|--------|
| Supabase | `press-kit` bucket exists; `project-photos` and `seo-documents` buckets need creation |
| WorkOS | Needs new org created for this site — see `docs/workos-setup.md` |
| GHL | Custom Objects need manual creation per design spec Section 7 |
| Google Maps | `PUBLIC_GOOGLE_MAPS_KEY` env var needed for Events pages |
| Hosting | Coolify (per new-project skill) — not yet deployed for this feature set |
| Worktree | `~/.config/superpowers/worktrees/homeworks-website-template/plan-1-data-foundation` |

### Plan execution status

| Plan | File | Status |
|------|------|--------|
| Plan 1 — Data Foundation | `docs/superpowers/plans/2026-04-02-plan-1-data-foundation.md` | ✅ Complete |
| Plan 2 — Public Pages | `docs/superpowers/plans/2026-04-02-plan-2-public-pages.md` | ⏳ Not started |
| Plan 3 — Admin Interface | `docs/superpowers/plans/2026-04-02-plan-3-admin-interface.md` | ⏳ Not started |
