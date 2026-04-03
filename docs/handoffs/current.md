# Project Handoff — Homeworks Website Template
**Project:** Homeworks Website Template
**Repo:** https://github.com/Clvrwrk/homeworks-website-template
**Production URL:** Not yet deployed
**Date:** 2026-04-02 20:00
**Agent:** Lead Orchestrator
**Reason:** User-requested end-of-session handoff

---

## Accomplished This Session

### Supabase Setup

- Created Supabase project `ohodmfxpgdwdfkvyxjbr` (homeworks-website-template, us-west-1)
- Applied migration 001 (contacts + projects tables with RLS)
- Applied migration 002 (events, press_mentions, media_items + projects schema upgrade) — fixed RLS policy drop-before-alter order bug during apply
- Seeded 6 published projects from hardcoded arrays
- Created storage buckets `project-photos` (public) and `seo-documents` (public)
- Fixed missing `PUBLIC_SUPABASE_ANON_KEY` in `.env.example` (vibe-security audit catch — critical runtime bug)
- Recreated `docs/workos-setup.md` (was never committed from prior session)
- `.env` created with real Supabase URL + anon key + service role key

### Supabase Consolidation + Vibe-Security Audit

- Audited 3 existing projects (`javgazqcrsffzodssopn`, `jnsytduclvvoccmnliqo`, `nqdqvhzojogrzlnhizox`)
- Decision: Did NOT consolidate — HAWC has 4 live contacts (separate client), AIA4 Tier B has 10 live onboarding submissions (separate product)
- `javgazqcrsffzodssopn` (AIA4 Tier 1) is empty — user should pause it to save $10/mo
- `ohodmfxpgdwdfkvyxjbr` confirmed as the canonical template Supabase instance

### Plan 1 — Data Foundation (complete, merged to main)

- `vitest.config.ts`, `src/lib/slugify.ts`, `src/lib/__tests__/slugify.test.ts`: Vitest setup + slugify utilities (9 tests)
- `src/types/database.ts`: Full typed interfaces for all 4 tables + `Database` shape
- `src/lib/supabase.ts`: Typed with Database generic; `TableRow<T>` helper updated
- `supabase/migrations/002_content_tables.sql`: Schema upgrade SQL (applied)
- `supabase/seed.sql`: 6 project INSERTs (applied)
- `src/pages/projects/index.astro` + `[slug].astro`: Migrated to Supabase queries
- `docs/workos-setup.md`: 8-step WorkOS setup guide with troubleshooting table

### Plan 2 — Public Pages (complete, merged to main)

- `src/pages/events/index.astro`: Events hub — next-event dark hero with Google Maps embed, month-grouped upcoming grid, past events collapse
- `src/pages/events/[slug].astro`: Event detail — photo hero, info card, Google Maps embed, local SEO outbound links
- `src/pages/media-kit.astro`: Full 6-section press hub (hero stats, boilerplate, videos/podcasts, in-the-news, download assets)
- `src/pages/brand.astro`: Static brand guidelines — 6 sections, sticky desktop nav, mobile anchor bar

### Plan 3 — Admin Interface (complete, merged to main)

- `src/lib/workos.ts`: WorkOS client singleton + session helpers (`getAuthorizationUrl`, `authenticateWithCode`, `validateSession`)
- `src/lib/admin.ts`: `computeReadiness()`, `isPublishable()`, `getRequiredFields()` — field-level validation per content type
- `src/lib/__tests__/admin.test.ts`: 18 unit tests for admin helpers
- `src/middleware.ts`: WorkOS middleware — protects all `/admin/*` routes, attaches user to `Astro.locals`
- `src/env.d.ts`: `Locals` type declaration
- `src/pages/auth/login.astro`, `callback.astro`, `logout.astro`: WorkOS AuthKit flow
- `src/layouts/AdminLayout.astro`: Dark sidebar + amber disclaimer banner + role-aware nav
- `src/pages/admin/projects/` (index, new, [slug]): Project CRUD, readiness bar, before/after photo gate, publish hidden for worker
- `src/pages/admin/events/` (index, new, [slug]): Events CRUD
- `src/pages/admin/press/` (index, mentions/new, media/new): Press mentions + media items
- `src/pages/admin/services/` (index, new, [slug]): Agency Admin only
- `src/pages/admin/locations/` (index, new, [slug]): Agency Admin only
- `src/pages/admin/users/` (index, invite): User management — Agency Admin only
- `src/pages/admin/profile.astro`: Tasks to Complete + published records summary
- `src/pages/api/admin/upload.ts`: Supabase storage upload (service role)
- `src/pages/api/admin/og-fetch.ts`: Server-side OG scrape for press mention prefill
- `src/pages/api/admin/oembed.ts`: YouTube oEmbed thumbnail fetch
- `src/pages/api/admin/projects.ts`, `events.ts`, `press.ts`, `media.ts`, `services.ts`, `locations.ts`: CRUD API endpoints with publish gates
- `src/pages/api/admin/ghl-notify.ts`: GHL Custom Object upsert on publish (fire-and-forget)
- `supabase/migrations/003_services_locations.sql`: Services + locations tables with RLS (applied)
- `src/pages/services/[slug].astro` + `src/pages/locations/[slug].astro`: Migrated from hardcoded `site.ts` maps to Supabase queries

---

## Git State
- **Branch:** `main`
- **Last commit:** `64941f3` — "feat: Plan 3 — Admin Interface complete"
- **Uncommitted changes:** `.superpowers/` directory (untracked — not needed in git)

---

## Task Cut Off

None — all three plans complete at a clean boundary.

---

## Next Task — Start Here

**Task:** Push to GitHub, deploy to Coolify, configure WorkOS, seed services/locations

**What to check / do:**
1. `git push origin main` — 31 commits ahead of origin
2. Complete WorkOS setup per `docs/workos-setup.md` — collect `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, generate `WORKOS_COOKIE_PASSWORD` (`openssl rand -base64 32`), invite first user
3. Seed `services` and `locations` tables in Supabase (`ohodmfxpgdwdfkvyxjbr`) — tables exist (migration 003 applied) but are empty. Public `/services/[slug]` and `/locations/[slug]` pages 404 until populated.
4. Deploy via Coolify using the `/new-project` skill
5. Set all env vars in Coolify: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_COOKIE_PASSWORD`, `PUBLIC_APP_URL`, `PUBLIC_GOOGLE_MAPS_KEY`, `GHL_API_KEY`, `GHL_LOCATION_ID`, `RANKABILITY_API_KEY`, `RANKABILITY_CLIENT_ID`, `PUBLIC_GA4_ID`, `RETRY_SECRET`, `PORT=4321`

**If services/locations pages 404 after deploy:** The tables are empty — need to write + run INSERT statements for all services/locations from the `site.ts` content arrays.

**Prompt to use:** "Read `docs/handoffs/current.md`. All three plans are complete and merged to main. Next: push to GitHub with `git push origin main`, then deploy to Coolify and configure WorkOS."

---

## Decisions Made This Session

- **Did NOT consolidate Supabase projects:** HAWC has 4 live client contacts, AIA4 Tier B has 10 live onboarding submissions — mixing separate clients into one DB is a compliance risk.
- **`ohodmfxpgdwdfkvyxjbr` is the canonical template instance:** All future website template builds use this project.
- **Fixed RLS policy drop order in migration 002:** `projects_public_read_published` policy referenced `is_published` column — had to drop policy before dropping column. Plan had wrong order; fixed during apply.
- **`PUBLIC_SUPABASE_ANON_KEY` was missing from .env.example:** Critical bug — every `createServerClient()` call would throw at runtime. Fixed in commit `10cbcbd`.
- **`created_by` is TEXT not UUID:** WorkOS user IDs are strings (`user_01ABCDEF`). Enforced throughout admin interface.
- **GHL notify is fire-and-forget:** Never throws, never blocks admin UI — background fetch in publish API routes.
- **Publish button hidden (not disabled) for worker role:** All admin CRUD pages enforce this.
- **`createAdminClient() as any` on inserts:** Supabase strict generics produce `never` on dynamic payloads — cast to `any` at API boundary only.
- **`[slug].astro` params cast:** `as { slug: string }` required because Astro params are `string | undefined` by default.

---

## Blockers Requiring Human Action

1. **Push to GitHub** — `git push origin main` (31 commits ahead)
2. **WorkOS setup** — Follow `docs/workos-setup.md`. Required before `/admin` is testable.
3. **Seed services/locations tables** — Tables are empty. Public pages 404 until seeded.
4. **Coolify deployment** — Use `/new-project` skill. Set all env vars listed above.
5. **Fill in `PUBLIC_GOOGLE_MAPS_KEY`** in `.env` (key exists, not yet set)
6. **Pause `javgazqcrsffzodssopn`** (AIA4 Tier 1 — empty Supabase project, saves $10/mo)
7. **GHL Custom Objects** — Manual creation per design spec Section 7 before GHL notify fires

---

## Verification Commands

1. `cd "/Users/chussey/Documents/Claude Projects/homeworks-website-template" && npm test` — should return `18 passed (18)`
2. `cd "/Users/chussey/Documents/Claude Projects/homeworks-website-template" && npx astro check 2>&1 | grep "error" | wc -l` — should return 11 (all pre-existing)
3. After push: `git log --oneline origin/main | head -1` — should match `64941f3`
4. After deploy: `curl -I https://<your-domain>/events` — should return `200 OK`
5. After WorkOS: visit `/admin` — should redirect to WorkOS login page

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
- Header sticky nav + mobile hamburger + phone CTA
- Footer 4-column desktop + mobile sticky bottom nav

**Session 2026-04-02 morning:**
- Full approved design spec for Events, Press Hub, Brand Guidelines, Admin Interface (`docs/superpowers/specs/2026-04-02-press-brand-events-admin-design.md`)
- Three complete TDD implementation plans written (Plans 1, 2, 3)

**Session 2026-04-02 (this session):**
- Supabase project created + all migrations applied + seed data in
- Vibe-security audit (1 critical fix)
- Plan 1 — Data Foundation: all complete + merged
- Plan 2 — Public Pages: all complete + merged
- Plan 3 — Admin Interface: all complete + merged
- 18/18 tests passing

### Architecture decisions

- **Astro SSR (`output: "server"`)** with `@astrojs/node` standalone adapter — Coolify deploys Node.js server directly
- **No React** — all interactivity is vanilla JS `<script>` tags + GSAP
- **Three Supabase client patterns:**
  - `createServerClient()` — anon key, respects RLS, public pages
  - `createAdminClient()` — service role key, bypasses RLS, server-side admin API routes only
  - `getBrowserClient()` — singleton, anon key, browser only
- **`created_by` is TEXT** — WorkOS user IDs are strings like `user_01ABCDEF`, not UUIDs
- **`ContentStatus` vs `ProjectStatus`** — separate named types even though values are identical today
- **`Relationships: []` on all Database table entries** — required by Supabase `GenericSchema` constraint
- **`uniqueSlug` uses dependency injection** — `checkExists` callback, never imports DB directly, fully testable
- **GHL notify is fire-and-forget** — background fetch, never blocks response

### Design system

- **Fonts:** Syne (headings) + DM Mono (data) + DM Sans (body)
- **Palette:** `#151d25` ink, `#b05d45` terracotta, `#2c3e50` navy, `#567798` steel, `#f0f2f4` snow
- **Admin sidebar:** `#151d25` dark, amber disclaimer banner at top
- **CSS classes:** `section-padding`, `site-container`, `section-label`, `section-label-light`, `section-heading`, `accent-divider-center`, `card-base`, `btn-primary`, `btn-secondary-dark`, `reveal-item`

### Key invariants (never violate)

- **Draft records never appear on public pages** — always filter `status = 'published'`
- **No `prerender = true`** — breaks Coolify/standalone-node SSR setup
- **`createAdminClient()` is server-side only** — never in browser scripts or hydrated components
- **`created_by` is TEXT** — WorkOS user IDs are strings, not UUIDs
- **`before_photo_url` AND `after_photo_url` both required to publish a project** — enforced in `isPublishable()`
- **Publish button hidden (not just disabled) for Worker role** — checked via `user.role === 'worker'`
- **Server-side OG fetch only** — never in browser
- **GHL notify is fire-and-forget** — never throws, never blocks admin UI

### Service / deployment map

| Service | Detail |
|---------|--------|
| Supabase | Project `ohodmfxpgdwdfkvyxjbr` — `https://ohodmfxpgdwdfkvyxjbr.supabase.co` |
| Supabase buckets | `project-photos` (public), `seo-documents` (public), `press-kit` (public, existing) |
| WorkOS | Needs org + roles + users — see `docs/workos-setup.md` |
| GHL | Custom Objects need manual creation per design spec Section 7 |
| Google Maps | `PUBLIC_GOOGLE_MAPS_KEY` env var — key exists, not yet set in .env |
| Coolify | Not yet deployed — use `/new-project` skill |
| GitHub | `git push origin main` pending — 31 commits ahead of origin |

### Plan execution status

| Plan | File | Status |
|------|------|--------|
| Plan 1 — Data Foundation | `docs/superpowers/plans/2026-04-02-plan-1-data-foundation.md` | ✅ Complete + merged |
| Plan 2 — Public Pages | `docs/superpowers/plans/2026-04-02-plan-2-public-pages.md` | ✅ Complete + merged |
| Plan 3 — Admin Interface | `docs/superpowers/plans/2026-04-02-plan-3-admin-interface.md` | ✅ Complete + merged |
