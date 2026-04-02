# Project Handoff — Homeworks Website Template
**Project:** Homeworks Website Template
**Repo:** https://github.com/Clvrwrk/homeworks-website-template
**Production URL:** Not yet deployed for this feature set
**Date:** 2026-04-02 11:30
**Agent:** Lead Orchestrator
**Reason:** User-requested end of session

---

## Accomplished This Session

### Full brainstorm and approved design spec for 4 major features

- `docs/superpowers/specs/2026-04-02-press-brand-events-admin-design.md`: Complete approved design spec covering Events System, Press/Media Hub, Brand Guidelines page, and Admin Interface — committed to main at `aff8a29`

**Visual mockups produced and approved (in `.superpowers/brainstorm/`):**
- Events hub: split hero + month-grouped 3-column card grid
- Event detail: centered card stack (photo → info → map → local SEO links)
- Admin interface: single-scroll sectioned form + readiness progress bar
- Press/media hub: editorial-first layout
- Brand guidelines: scrolling page + sticky side nav
- Admin/worker profile page: tasks to complete + add new + published records

## Git State
- **Branch:** `main`
- **Last commit:** `aff8a29` — "docs: add design spec for press hub, brand guidelines, events system, and admin interface"
- **Uncommitted changes:** none

## Task Cut Off
Design phase complete. No code written yet. Implementation planning is the next step.

## Next Task — Start Here

**Task:** Generate implementation plan from the approved design spec
**What to do:**
1. Read `docs/superpowers/specs/2026-04-02-press-brand-events-admin-design.md` in full
2. Invoke the `superpowers:writing-plans` skill
3. Plan phases: Supabase migrations → WorkOS auth → Admin interface (React islands) → Public events pages → Press hub → Brand guidelines → GHL SOP execution
4. Each phase should be independently deployable

**Prompt to use:** "Read `docs/superpowers/specs/2026-04-02-press-brand-events-admin-design.md`. Then invoke the writing-plans skill to create an implementation plan for all four features."

## Decisions Made This Session

- **Astro SSR + React islands for admin** — same stack, no new deployment
- **WorkOS for auth** — net-new to this site; same pattern as OmniDrop AI
- **Three roles: Agency Admin, Client Admin, Worker** — Agency manages all users; Client manages their team only; Workers draft-only, Publish button hidden entirely
- **Draft/publish + required fields gate** — all narrative fields required for EEAT/local SEO before publish
- **Before AND after photos required** — two separate uploads per project
- **Events hub** — split hero (next event + Google Maps) + month-grouped 3-column grid
- **Event detail** — centered card stack: photo → info card → map → local SEO outbound links
- **Admin form** — single scrollable page, amber disclaimer banner, readiness progress bar
- **Press hub** — editorial-first order: Hero → Stats → Boilerplate + Contact → Videos/Podcasts → Press Mentions → Downloads
- **Brand guidelines** — scrolling page, sticky left side nav, 6 sections
- **Press mention intake** — URL-only → server-side OG fetch → placeholder image fallback → required 20–200 word summary if no OG description
- **Profile page** — top section shows incomplete drafts (admins see all team drafts, workers see own only). Edit → unpublishes live records. Delete requires confirm.
- **GHL Custom Objects** (not custom fields) — full SOP in spec Section 7 covering Projects, Events, Press Mentions, Media Items
- **Brand guidelines page is static** — hardcoded Astro, no DB dependency
- **Press stats in `site.ts`** — not a DB table
- **Existing projects grandfathered** — publish gate applies to new records only

## Blockers Requiring Human Action

1. **WorkOS org** — needs a new WorkOS organization created for this site (separate from OmniDrop AI)
2. **GHL Custom Objects** — must be created manually per spec Section 7 SOP before automation workflows can fire
3. **Supabase `project-photos` bucket** — `press-kit` already exists; `project-photos` needs to be created before implementation begins
4. **Spec review** — read `docs/superpowers/specs/2026-04-02-press-brand-events-admin-design.md` and confirm before implementation planning starts

## Verification Commands
1. `cd "/Users/chussey/Documents/Claude Projects/homeworks-website-template" && git log --oneline -3` — should show `aff8a29` as most recent
2. `ls docs/superpowers/specs/` — should show the spec file

## Full Context

### What was built across ALL sessions (complete feature list)
- Full Astro SSR website template (16 tasks across 3 prior sessions)
- All core pages: Home, About, Services, Projects, Locations, Process, Contact, Privacy, Terms, 404
- GHL contact form integration
- Supabase integration (press-kit bucket, services/locations content)
- SEO: schema markup, sitemap, robots.txt, OG tags
- Image optimization pipeline (scripts)
- Rankability content integration
- `media-kit.astro` stub (pulls from Supabase press-kit bucket — will be replaced by press hub)
- **This session:** Full approved design spec for Events, Press Hub, Brand Guidelines, Admin Interface

### Architecture decisions
- Astro SSR (not static) — required for Supabase queries and WorkOS auth
- React islands for admin form interactivity (file upload, dynamic lists, readiness bar)
- WorkOS authkitMiddleware pattern (same as OmniDrop AI)
- Supabase service role key server-side only
- OG fetch for press mentions runs server-side only

### Design system
- Font: Syne (headings) + DM Mono (data) + DM Sans (body)
- Palette: `#151d25` ink, `#b05d45` terracotta, `#2c3e50` navy, `#567798` steel, `#f0f2f4` snow
- Admin: `#151d25` top bar, `#1e2a35` sidebar

### Key invariants (never violate)
- Draft records never appear on public-facing pages
- Publish button hidden (not just disabled) for Worker role
- Server-side OG fetch only — never in browser
- `before_photo_url` AND `after_photo_url` both required for projects to publish
- Brand guidelines page is static — do not add a DB dependency
- All outbound event links: `target="_blank" rel="noopener noreferrer"`

### Service / deployment map
| Service | Detail |
|---|---|
| Supabase | `press-kit` bucket exists; `project-photos` bucket needs creation |
| WorkOS | Needs new org created for this site (separate from OmniDrop AI org) |
| GHL | Custom Objects need manual creation per spec Section 7 |
| Hosting | Coolify (per new-project skill) |
