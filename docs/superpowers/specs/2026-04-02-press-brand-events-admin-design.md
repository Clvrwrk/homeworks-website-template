# Design Spec — Press Hub, Brand Guidelines, Events System, Admin Interface
**Project:** Homeworks Website Template
**Date:** 2026-04-02
**Status:** Approved — ready for implementation planning

---

## Overview

Four interconnected features sharing a single Astro SSR + Supabase + WorkOS stack:

1. **Events System** — public-facing hub + detail pages
2. **Press/Media Hub** — enhanced media kit page
3. **Brand Guidelines Page** — full brand system reference
4. **Admin Interface** — WorkOS-authenticated CRUD for all content types

---

## 1. Data Model

### `projects` table
Migrates hardcoded project arrays from `projects/index.astro` and `projects/[slug].astro`.

| Column | Type | Required to Publish |
|---|---|---|
| `id` | uuid PK | — |
| `slug` | text unique | ✓ (auto-generated from title) |
| `status` | enum `draft\|published` | — |
| `title` | text | ✓ |
| `category` | enum `Drywall\|Painting\|Plumbing\|Electrical\|Carpentry\|Outdoor` | ✓ |
| `neighborhood` | text | ✓ |
| `location` | text | ✓ ("City, TX ZIP") |
| `community` | text | ✓ |
| `duration` | text | ✓ |
| `scope` | text | ✓ |
| `summary` | text | ✓ (card blurb) |
| `before_label` | text | ✓ |
| `after_label` | text | ✓ |
| `before_photo_url` | text | ✓ |
| `after_photo_url` | text | ✓ |
| `overview` | text | ✓ (narrative) |
| `challenge` | text | ✓ (narrative) |
| `result` | text | ✓ (narrative) |
| `scope_items` | text[] | ✓ (≥ 1 item) |
| `created_by` | uuid | — |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |
| `published_at` | timestamptz | — |

Storage bucket: `project-photos` — paths `{project_id}/before.{ext}` and `{project_id}/after.{ext}`.

---

### `events` table

| Column | Type | Required to Publish |
|---|---|---|
| `id` | uuid PK | — |
| `slug` | text unique | ✓ |
| `status` | enum `draft\|published` | — |
| `title` | text | ✓ |
| `event_type` | text | ✓ (Sponsor / Booth / Speaking / Community / Other) |
| `event_date` | timestamptz | ✓ |
| `end_date` | timestamptz | — (nullable, multi-day) |
| `location_name` | text | ✓ |
| `address` | text | ✓ (drives Google Maps embed) |
| `google_place_id` | text | — (nullable, improves Maps precision) |
| `description` | text | ✓ |
| `image_url` | text | ✓ (at least one photo before publish) |
| `website_url` | text | — (nullable) |
| `local_links` | jsonb | — (`[{label, url}]` — local SEO outbound links) |
| `created_by` | uuid | — |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

"Next event" = earliest published event where `event_date >= now()`.

---

### `press_mentions` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `url` | text | Admin enters URL only |
| `headline` | text | Auto-fetched from OG tags; admin can override |
| `publication` | text | Auto-fetched or admin-entered |
| `image_url` | text | Auto-fetched from OG image; falls back to `/public/og-default.jpg` placeholder |
| `summary` | text | Auto-fetched from OG description; **required 20–200 words if not found** |
| `published_date` | date | Auto-fetched or admin-entered |
| `created_at` | timestamptz | |

**Intake flow:** Admin enters a URL → server-side OG fetch attempts to populate `headline`, `publication`, `image_url`, `summary`. Any missing field surfaces as an editable input. `summary` blocks save if blank and is validated for 20–200 word count. `image_url` silently falls back to the site placeholder — no block.

---

### `media_items` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `type` | enum `youtube\|podcast` | |
| `title` | text | Required |
| `url` | text | YouTube URL or podcast episode URL |
| `thumbnail_url` | text | Auto-fetched via YouTube oEmbed for YouTube type; admin uploads for podcast |
| `description` | text | Optional |
| `published_date` | date | For ordering |
| `sort_order` | int | Manual ordering override |
| `created_at` | timestamptz | |

---

## 2. Auth & Roles (WorkOS)

| Role | Create / Edit | Publish | Manage Users |
|---|---|---|---|
| **Agency Admin** | ✓ all content | ✓ | All users across all orgs |
| **Client Admin** | ✓ all content | ✓ | Their team only (cannot modify agency accounts) |
| **Worker** | ✓ (saves as draft) | ✗ (Publish button hidden) | — |

**Publish button visibility:** Hidden entirely for Workers. Agency Admin and Client Admin see it; it is disabled (with tooltip) until all required fields pass validation.

**Profile page — Tasks to Complete:** Top section of every user's admin profile lists their own saved drafts that are not yet publish-ready, with a direct edit link and a readiness indicator (e.g. "7 / 12 fields complete"). For Admins, shows all incomplete drafts across the team.

---

## 3. Admin Interface (`/admin`)

### Structure
- `/admin` — redirects to `/admin/projects`
- `/admin/projects` — project list (draft / published tabs, search, sort by date)
- `/admin/projects/new` — new project form
- `/admin/projects/[slug]` — edit existing project
- `/admin/events` — event list
- `/admin/events/new` — new event form
- `/admin/events/[slug]` — edit existing event
- `/admin/press` — press mentions + media items management
- `/admin/press/mentions/new` — add press mention (URL intake)
- `/admin/press/media/new` — add YouTube / podcast item
- `/admin/users` — user list (Agency Admin only)
- `/admin/users/invite` — invite new user with role assignment
- `/admin/profile` — current user profile + Tasks to Complete

### Form Layout (all content types)
Single scrollable page with labeled sections. Dark sidebar nav persists across all routes.

**Persistent disclaimer banner (amber):**
> "All fields marked * must be complete before this record can be published. You can save and return at any time — incomplete records never appear on the live site."

**Publish readiness progress bar:** Shows `N / Total required fields complete`. Updates in real time as fields are filled.

**Save Draft button:** Always enabled. Saves current state immediately.

**Publish button:** Enabled only when all required fields pass validation. Hidden entirely for Workers.

### Project Form Sections
1. **Basics** — Title*, Category*, Neighborhood*, Location*, Community*, Duration*, Scope*
2. **Photos** — Before Photo* (upload), After Photo* (upload), Before Label*, After Label*
3. **Narrative** — Overview*, Challenge*, Result* (all textarea with min-height)
4. **Scope Items** — Dynamic list, add/remove rows, ≥ 1 item required*
5. **SEO Preview** — Auto-generated slug (editable), meta description preview

### Event Form Sections
1. **Basics** — Title*, Event Type*, Event Date*, End Date, Location Name*, Address*
2. **Photo** — Event Image* (at least one required to publish)
3. **Details** — Description*, Website URL, Google Place ID
4. **Local SEO Links** — Dynamic list of `{label, url}` pairs (add/remove rows)

### Press Mention Form
Single-field entry: URL → triggers server-side OG fetch → pre-populates all fields → admin reviews/overrides → Summary validates 20–200 words.

---

## 4. Events System (Public)

### Events Hub (`/events`)

**Hero (split layout):**
- Left: Next event title, type badge, date + location, short description, "Learn More" + "Get Directions" CTAs
- Right: Google Maps embed (address-based)
- If no upcoming events: hero shows a placeholder "Check back soon" message

**Events Grid:**
- Grouped by month with divider headings (`JUNE 2026 ──────── 3 events`)
- 3-column card grid on desktop, single column on mobile
- Next upcoming event card gets terracotta border highlight
- Past events shown in a collapsed "Past Events" section below upcoming
- Each card: event photo, type badge, date, title, location name, "Learn More" CTA

**Event card fields displayed:** image, event_type badge, event_date, title, location_name.

---

### Event Detail (`/events/[slug]`)

Centered card stack layout:
1. **Event photo** (hero image, full-width rounded top)
2. **Event info card** — type badge, title, date + time, location name, description, "Get Directions" + "Event Website" CTAs
3. **Google Maps embed** — full-width, driven by `address` field (falls back to `location_name` if no address match)
4. **"In the Neighborhood" section** — renders `local_links` jsonb as outbound links with `rel="noopener noreferrer"`. Labels written by admin. Each link opens in new tab. Min 1 recommended for local SEO.

**SEO notes:** Each event detail page includes LocalBusiness + Event schema markup. Local outbound links to neighborhood organizations, city pages, and venue sites support local authority signals.

---

## 5. Press/Media Hub (`/media-kit`)

Replaces and extends the existing `media-kit.astro` stub.

**Section order (editorial-first):**

1. **Hero** — dark gradient, "Press & Media" label, page title, subtitle with press contact CTA
2. **Stats row** — 4 key numbers (projects completed, years in business, avg rating, licensed state). Managed via `site.ts` config — not a database table.
3. **Boilerplate + Press Contact** — 2-column: company description paragraph (left), press contact name/email/phone + "Request Interview" mailto link (right). Managed via `site.ts`.
4. **Videos & Podcasts** — grid of `media_items` records. YouTube items show embedded thumbnail with play overlay. Podcast items show cover art + episode title + listen link. Admin can add/edit/delete/reorder.
5. **In the News** — press mention cards. Each card: publication name, headline, summary excerpt, thumbnail image (OG or placeholder), "Read →" link. Admin manages via URL intake. Sorted by `published_date` descending.
6. **Download Assets** — existing Supabase `press-kit` bucket listing (unchanged from current stub). Three fixed category tiles: Logo SVG, Photos, Brand Guide PDF.

---

## 6. Brand Guidelines (`/brand`)

Single scrolling page with sticky left side nav. Side nav highlights active section on scroll. Collapses to a horizontal anchor bar on mobile.

**Six sections:**

### Logo Usage
- Light and dark variants side by side (SVG renders)
- Clear space rule diagram
- "Don'ts" grid: don't stretch, recolor, add effects, rotate, place on busy backgrounds

### Color Palette
- Five swatches with hex codes and names: Ink `#151d25`, Terracotta `#b05d45`, Navy `#2c3e50`, Steel `#567798`, Snow `#f0f2f4`
- Accessible pairing examples (which colors work on which backgrounds, with contrast ratio)

### Typography
- Three typefaces: Syne (headings, 700/900), DM Mono (numbers/data, 400), DM Sans (body, 400/600)
- Type scale examples: H1 → H4, body, caption
- Usage rules: when to use each face

### Voice & Tone
- We are: Direct, Honest, Neighborly, Specific, Earned (not promised)
- We're not: Corporate, Salesy, Vague, Overpromising, Jargon-heavy
- 3–4 before/after copy examples showing correct vs incorrect voice
- Messaging do's and don'ts for common scenarios (reviews, estimates, project descriptions)

### Photography Style
- Subject guidelines: real work, real homes, natural light preferred
- Framing: before/after consistency (same angle, same distance)
- What to avoid: stock photos, over-edited images, cluttered backgrounds
- Approved filter/treatment style: natural tones, no heavy vignette

### Downloads
- Links to `press-kit` Supabase bucket assets (same as press hub download section)
- Brand PDF download (uploaded manually to press-kit bucket)
- Direct link to `/media-kit` for full asset library

---

## 7. GHL Custom Objects SOP

All items below must be created manually in the GoHighLevel dashboard under **Custom Objects** before any automation workflows can reference them.

### Custom Object: `Project`
**Purpose:** Mirror published projects for use in proposals, email campaigns, and pipeline automations.

| Field Label | Field Key | Type | Notes |
|---|---|---|---|
| Project Title | `project_title` | Text | |
| Category | `project_category` | Dropdown | Drywall, Painting, Plumbing, Electrical, Carpentry, Outdoor |
| Neighborhood | `project_neighborhood` | Text | |
| Location | `project_location` | Text | "City, TX ZIP" |
| Project URL | `project_url` | URL | `/projects/{slug}` |
| Before Photo URL | `project_before_photo` | URL | Supabase storage URL |
| After Photo URL | `project_after_photo` | URL | Supabase storage URL |
| Published Date | `project_published_date` | Date | |
| Status | `project_status` | Dropdown | Draft, Published |

**Automation trigger:** On Supabase `projects` row status change to `published` → webhook to GHL → upsert Custom Object record.

---

### Custom Object: `Event`
**Purpose:** Drive event reminder email sequences, SMS blasts, and post-event follow-up workflows.

| Field Label | Field Key | Type | Notes |
|---|---|---|---|
| Event Title | `event_title` | Text | |
| Event Type | `event_type` | Dropdown | Sponsor, Booth, Speaking, Community, Other |
| Event Date | `event_date` | Date/Time | Used for sequence scheduling |
| Event Location | `event_location_name` | Text | |
| Event Address | `event_address` | Text | |
| Event URL (detail page) | `event_url` | URL | `/events/{slug}` |
| Event Website | `event_website_url` | URL | External event site |
| Event Image URL | `event_image_url` | URL | |
| Status | `event_status` | Dropdown | Draft, Published |

**Automation triggers:**
- On publish → enroll contacts in "Upcoming Event" email sequence (reminder at 7 days, 1 day before)
- On `event_date` pass → trigger post-event follow-up sequence

---

### Custom Object: `Press Mention`
**Purpose:** Social proof automation — share press hits in newsletters, reputation workflows, and review request campaigns.

| Field Label | Field Key | Type | Notes |
|---|---|---|---|
| Headline | `press_headline` | Text | |
| Publication | `press_publication` | Text | |
| Article URL | `press_url` | URL | |
| Summary | `press_summary` | Text Area | |
| Image URL | `press_image_url` | URL | OG image or placeholder |
| Published Date | `press_published_date` | Date | |

**Automation trigger:** On new press mention added → notify agency admin via internal notification + optionally enqueue for newsletter inclusion.

---

### Custom Object: `Media Item`
**Purpose:** Embed videos/podcasts in GHL landing pages, email campaigns, and funnel steps without hardcoding URLs.

| Field Label | Field Key | Type | Notes |
|---|---|---|---|
| Title | `media_title` | Text | |
| Type | `media_type` | Dropdown | YouTube, Podcast |
| URL | `media_url` | URL | |
| Thumbnail URL | `media_thumbnail_url` | URL | |
| Description | `media_description` | Text Area | |
| Published Date | `media_published_date` | Date | |
| Sort Order | `media_sort_order` | Number | |

---

### GHL Setup Steps (per object)
1. In GHL dashboard → go to **Settings → Custom Objects**
2. Click **Create Object** → enter object name and plural label
3. Add each field using the table above — match field key exactly (used in webhook payloads)
4. Save the object schema
5. Set up a **Webhook Trigger** in GHL Automations to receive inbound data from the website (Supabase → GHL via webhook on status changes)
6. Map incoming webhook fields to Custom Object fields
7. Test with a sample publish action from the admin interface

**Note:** Custom Object records are linked to GHL Contacts via relationship fields where applicable (e.g., linking an Event to contacts who have expressed interest via a form submission).

---

## 8. Admin Profile Page (`/admin/profile`)

### Layout
Three stacked sections on a single page.

### Section 1 — Tasks to Complete (top, amber border)
- Shown to all roles
- Lists every draft record created by the current user that is not yet publish-ready
- Agency Admin and Client Admin see all incomplete drafts across their team
- Workers see only their own drafts
- Each row shows:
  - Record type badge (Project / Event / Press / Media)
  - Record title
  - Progress bar: `N / Total required fields` — red below 50%, amber 50–90%, green 90%+
  - Plain-English missing fields summary ("Missing: After photo, Challenge, Result")
  - **Edit →** button (links directly to the edit form)
  - **Delete** button (confirm dialog before delete)
- Sorted by progress bar descending (closest to complete first)

### Section 2 — Add New Record
- Four quick-add tiles: New Project, New Event, Press Mention, Video/Podcast
- Worker role: sees Project and Event tiles only — Press and Media tiles hidden
- Each tile links to the corresponding `/admin/{type}/new` form

### Section 3 — My Published Records
- Lists all published records created by the current user
- Columns: status badge (✓ Live), title, published date, Edit, Delete
- Edit on a published record sets status back to `draft` (unpublishes) and routes to edit form — admin must re-publish after changes
- Delete on a published record requires confirmation: "This will remove the record from the live site immediately."

---

## 9. Key Invariants

- Incomplete records (draft status) **never** appear on any public-facing page
- Publish button is **hidden** (not just disabled) for Workers
- All outbound links on event detail pages use `target="_blank" rel="noopener noreferrer"`
- OG fetch for press mentions runs **server-side only** — never expose fetch logic to the browser
- Google Maps embed uses the `address` field; if `google_place_id` is set it takes precedence
- `before_photo_url` and `after_photo_url` both required — a project with only one photo cannot publish
- Brand guidelines page is **static** — content is hardcoded in the Astro page, not database-driven
- Press stats (projects count, years, rating) live in `site.ts` alongside other business config — not a DB table
- Slug auto-generation must enforce uniqueness — check Supabase before saving, append `-2`, `-3` etc. if collision

---

## 10. Migration Plan

The existing hardcoded project data in `projects/index.astro` and `projects/[slug].astro` must be:
1. Migrated into Supabase `projects` table as published records
2. Before/after photos for existing projects: use the current single `image` value for `after_photo_url`; `before_photo_url` left blank and flagged as a draft gap (existing live projects are grandfathered — publish gate applies only to new records)
3. After migration, the hardcoded arrays in both Astro pages are replaced with Supabase queries

---

## 11. Open Questions (resolved during brainstorm)

| Question | Decision |
|---|---|
| Before/after photos | Two separate required photos per project |
| Publish gate | Draft/publish + required fields must pass — both (Option C) |
| Admin users | Three tiers: Agency Admin, Client Admin, Worker |
| Worker publish rights | Workers cannot publish — Publish button hidden entirely |
| Admin form layout | Single scrollable page with sectioned layout + readiness bar |
| Events hub layout | Split hero + month-grouped 3-column card grid |
| Event detail layout | Centered card stack (photo → info → map → local links) |
| Press hub layout | Editorial first (story → stats → contact → media → mentions → downloads) |
| Brand guidelines layout | Single scrolling page + sticky side nav |
| GHL integration | Custom Objects (not just custom fields) — full SOP included |
| Press mention intake | URL only → OG auto-fetch → placeholder image fallback → summary required (20–200 words) if not found |
| Event photo | At least one photo required to publish |
