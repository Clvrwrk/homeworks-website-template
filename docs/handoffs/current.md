# Project Handoff — Homeworks Website Template
**Project:** Homeworks Website Template
**Repo:** https://github.com/Clvrwrk/homeworks-website-template
**Production URL:** Template — not deployed directly
**Date:** 2026-04-01 19:00
**Agent:** Lead Orchestrator
**Reason:** End of session

---

## Accomplished This Session

### Modal Quote System (from HAWC project, ported with CSS var theming)

- `src/components/QuoteModal.astro`: Created global 2-step quote modal. Uses CSS custom properties (`var(--brand-primary)`, `var(--brand-secondary)`) instead of hardcoded HAWC colors so it works with any client's brand. Native `<dialog aria-modal="true">` with showModal(). Step 1: SERVICES pills (multi-select, 0-selection guard). Step 2: Name + Phone, fetch() POST with X-Requested-With: fetch. Inline success/error states — no page navigation. Commit: d1e3265d
- `src/components/SidebarCTA.astro`: Created sticky desktop sidebar (hidden lg:block). Props: `service?: string`. Orange Get a Quote button (`data-quote-modal data-service={service}`), brand-colored Call Now, divider, trust signals card (YEARS_EXPERIENCE, JOBS_COMPLETED, RESPONSE_TIME). All colors use CSS vars. Commit: 36fd44b4

### Layout & Global Wiring

- `src/layouts/Layout.astro`: Added QuoteModal import and `<QuoteModal />` before `</body>`. Modal renders globally on every page. Commit: 3ebb1063
- `src/components/Header.astro`: Added desktop "Get a Quote" button between `</nav>` and phone CTA. Uses `var(--brand-primary)` for border/text, no `data-service` (global context). Hidden on mobile. Commit: 3cc9e11b
- `src/components/Footer.astro`: Changed mobile bottom-nav center Quote pill from `<a href="/#estimate">` to `<button type="button" data-quote-modal>`. Added CSS resets to prevent browser button style bleed. Commit: 01c64804

### Service & Location Page Redesign

- `src/pages/services/[slug].astro`: Full replacement. Converted from broken `getStaticPaths()` to proper SSR dynamic route (`Astro.params.slug` + `SERVICES.find()`). Added Header/Footer, breadcrumb (`Home / Services / {name}`), two-column grid `lg:grid-cols-[1fr_300px]`, SidebarCTA on right. All CTA buttons now `data-quote-modal data-service={slug}` (removed `href="/contact"`). SITE_URL for canonical. Commit: cdf3d3f6
- `src/pages/locations/[slug].astro`: Full replacement. Same SSR conversion, Header/Footer, breadcrumb (`Home / Locations / City, State`), two-column grid, SidebarCTA (no service prop), services grid and FAQs in main column. Hero CTA → `data-quote-modal`. Commit: e3a9822d

### API Fix

- `src/pages/api/contact.ts`: Added AJAX detection via `X-Requested-With: fetch` header. Returns `{"success":true}` JSON for AJAX, `{"error":"phone_required"}` on validation fail for AJAX. Regular form POSTs still get 303 redirect. Fixed `request.url` → `SITE_URL` for Coolify proxy compatibility (request.url resolves to localhost behind Coolify). Commit: 13b0ef0b

---

## Git State
- **Branch:** main
- **Last commit:** `e3a9822d` — "feat: location pages — add Header/Footer/breadcrumb, 2-col layout, modal CTA, convert to SSR route"
- **Uncommitted changes:** none

---

## Task Cut Off
None — session ended at a clean boundary.

---

## Next Task — Start Here

**Task:** Test template with a new client build via `/build-website` skill
**What to check / do:**
1. The `/build-website` skill populates `src/config/site.ts` with client data (replaces `{{TEMPLATE_VARS}}`)
2. After build, verify service/location pages render correctly (Header, Footer, breadcrumb, sidebar, modal)
3. Verify the QuoteModal service pills populate from the client's SERVICES array
4. Verify mobile bottom-nav Quote pill opens modal (not navigates)
5. Verify AJAX contact form submission returns `{"success":true}`

**If modal pills are empty:** The client's SERVICES array in site.ts may still be `[]`. The `/build-website` skill needs to populate it from the client onboarding data.

**If sidebar trust signals show `{{TEMPLATE_VARS}}`:** The `/build-website` skill hasn't substituted YEARS_EXPERIENCE, JOBS_COMPLETED, RESPONSE_TIME. Add them to the skill's substitution list.

**Prompt to use:** "Read docs/handoffs/current.md in the homeworks-website-template repo. The QuoteModal, SidebarCTA, and service/location page redesign are now in the template. Test with the next client build."

---

## Decisions Made This Session

- **CSS vars instead of hardcoded colors in QuoteModal and SidebarCTA:** Template components must be client-agnostic. Using `var(--brand-primary)` and `var(--brand-secondary)` means any client's brand colors automatically apply without touching the component code.
- **SSR dynamic routes (no `getStaticPaths()`):** Template uses `output: "server"`. In Astro SSR mode, `getStaticPaths()` is ignored — the old template code was silently broken (accessing `Astro.props.service` when it's undefined). Fixed to use `Astro.params.slug` + `Array.find()` with redirect fallback.
- **SITE_URL for redirects, not request.url:** Coolify reverse proxy resolves `request.url` to `http://localhost:PORT`. All API redirect URLs must use `SITE_URL` from site.ts. This is now the template standard.
- **Modal is global in Layout — never per-page:** One `<QuoteModal />` in Layout.astro. Adding it per-page creates duplicate dialogs with conflicting JS.
- **`data-quote-modal` is the only trigger protocol:** Any button/link with this attribute opens the modal. No `href="/contact"` on quote CTAs.

---

## Blockers Requiring Human Action

1. **None** — Template is ready for the next client build.

---

## Verification Commands

After deploying a client build from this template:
1. `curl -s [client-url]/services/[any-slug] | grep -c 'data-quote-modal'` — should return 6+
2. `curl -s -X POST [client-url]/api/contact -H "X-Requested-With: fetch" -d "name=Test&phone=5555555555"` — should return `{"success":true}`
3. `curl -s [client-url]/services/[any-slug] | grep 'aria-label="Breadcrumb"'` — should return the breadcrumb nav

---

## Full Context

### What was built across ALL sessions (complete feature list)

**Previous sessions:**
- Full Astro 5 SSR site template with Tailwind v4
- Header (sticky nav, phone CTA, mobile hamburger), Footer (4-col desktop, 5-icon mobile sticky nav)
- Layout.astro with GA4, JSON-LD LocalBusiness schema, brand CSS vars, self-hosted fonts
- Dynamic services/locations/projects pages
- Contact form → Supabase → GHL CRM sync pipeline
- Brand variable system (all colors, fonts, content driven by site.ts `{{TEMPLATE_VARS}}`)
- MFP design system CSS classes merged in
- AI_AGENT_SOP, BRAND_VOICE_GUIDE, GHL_AUTOMATION_PLAN docs
- `/build-website` skill for client onboarding

**Session 2026-04-01:**
- QuoteModal component (2-step, CSS var themed, AJAX submit, inline success)
- SidebarCTA component (sticky desktop, trust signals, CSS var themed)
- Header desktop "Get a Quote" button → modal
- Footer mobile Quote pill → modal (was `/#estimate` link)
- Service pages: Header, Footer, breadcrumb, 2-col layout + sidebar, modal CTAs
- Location pages: Header, Footer, breadcrumb, 2-col layout + sidebar, modal CTA
- Contact API: AJAX-aware (JSON for fetch(), 303 redirect for forms)
- Fixed SSR dynamic route pattern (both slug pages now use Astro.params)
- Fixed Coolify proxy URL issue in contact API

### Architecture decisions

- **SSR mode (`output: "server"`)** with `@astrojs/node` standalone adapter
- **`getStaticPaths()` is NOT used** — all dynamic pages use `Astro.params` + Array.find()
- **`request.url` resolves to localhost in Coolify** — always use `SITE_URL` from site.ts
- **QuoteModal renders once globally in Layout.astro** — never per-page
- **`data-quote-modal` attribute delegation** — all quote CTAs use this, no navigation links
- **SidebarCTA is `hidden lg:block`** — mobile uses bottom-nav pill

### Design system

Template uses CSS custom properties driven by `src/config/site.ts`:
- `var(--brand-primary)` → client's primary CTA color (terracotta `#b05d45` in template default)
- `var(--brand-secondary)` → dark nav/header background
- `var(--brand-accent)` → accent/divider color
- Fonts: `var(--font-display)` (Plus Jakarta Sans), `var(--font-body)` (DM Sans)

### Key invariants (never violate)

- **All new components must use CSS vars, not hardcoded hex:** Components are shared across clients with different brand colors. Hardcoding `#ec5b13` (HAWC orange) in a template component would brand every client orange.
- **No `prerender = true` on any page:** Breaks with standalone Node adapter in Coolify.
- **No `getStaticPaths()` in SSR mode:** It's silently ignored — use Astro.params instead.
- **SITE_URL for all redirect URLs in API routes:** Never `request.url`.
- **`data-quote-modal` is the only quote trigger:** Maintains zero-redirect modal behavior across all pages.

### Service / deployment map

| Service | Detail |
|---------|--------|
| Template Repo | https://github.com/Clvrwrk/homeworks-website-template |
| Client deployment | Coolify — autodeploy on push to main |
| Supabase | One project per client, configured via env vars |
| GHL CRM | GHL_LOCATION_ID set per client in site.ts |
