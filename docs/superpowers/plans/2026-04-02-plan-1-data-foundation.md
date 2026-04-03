# Data Foundation + Projects Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the minimal `projects` table with the full spec schema, add `events`, `press_mentions`, and `media_items` tables, migrate the 6 hardcoded projects to Supabase, and update both projects pages to query the database.

**Architecture:** One new SQL migration (`002`) alters `projects` and creates the 3 new tables. A seed file inserts the 6 existing hardcoded projects as `published` records. The two projects pages become SSR Supabase queries instead of hardcoded arrays. A shared `src/types/database.ts` provides typed row interfaces consumed by `src/lib/supabase.ts`.

**Tech Stack:** Astro 5 SSR, Supabase (PostgreSQL + RLS), TypeScript strict, Vitest for unit tests.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `vitest.config.ts` | Vitest config |
| Create | `src/lib/slugify.ts` | Slug generation + uniqueness helper |
| Create | `src/lib/__tests__/slugify.test.ts` | Unit tests for slug helper |
| Create | `supabase/migrations/002_content_tables.sql` | Alter projects + add 3 new tables |
| Create | `supabase/seed.sql` | INSERT the 6 hardcoded projects |
| Create | `src/types/database.ts` | Typed row/insert interfaces for all 4 tables |
| Modify | `src/lib/supabase.ts` | Import `Database` type, update `TableRow` helper |
| Modify | `src/pages/projects/index.astro` | Replace hardcoded array with Supabase query |
| Modify | `src/pages/projects/[slug].astro` | Replace hardcoded array with Supabase query |

---

### Task 1: Vitest setup

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/slugify.ts`
- Create: `src/lib/__tests__/slugify.test.ts`

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest
```

Expected: `vitest` appears in `package.json` devDependencies.

- [ ] **Step 2: Create vitest.config.ts**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write the failing test**

Create `src/lib/__tests__/slugify.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { toSlug, appendSuffix } from "../slugify";

describe("toSlug", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(toSlug("Crown Molding Installation")).toBe("crown-molding-installation");
  });

  it("strips special characters except hyphens", () => {
    expect(toSlug("Allen, TX — Home Theater!")).toBe("allen-tx-home-theater");
  });

  it("collapses multiple hyphens", () => {
    expect(toSlug("  double   spaced  ")).toBe("double-spaced");
  });

  it("trims leading/trailing hyphens", () => {
    expect(toSlug("--leading--")).toBe("leading");
  });
});

describe("appendSuffix", () => {
  it("appends -2 when given base slug", () => {
    expect(appendSuffix("crown-molding", 2)).toBe("crown-molding-2");
  });

  it("appends -5 for fifth collision", () => {
    expect(appendSuffix("allen-tv-mounting", 5)).toBe("allen-tv-mounting-5");
  });
});
```

- [ ] **Step 5: Run to verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../slugify'`

- [ ] **Step 6: Implement src/lib/slugify.ts**

```ts
// src/lib/slugify.ts

/**
 * Convert a title string to a URL slug.
 * "Crown Molding Installation" → "crown-molding-installation"
 */
export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")  // strip non-alphanumeric except spaces/hyphens
    .replace(/[\s-]+/g, "-")        // collapse spaces and hyphens
    .replace(/^-+|-+$/g, "");       // trim leading/trailing hyphens
}

/**
 * Append a numeric suffix for collision resolution.
 * appendSuffix("my-slug", 2) → "my-slug-2"
 */
export function appendSuffix(base: string, n: number): string {
  return `${base}-${n}`;
}

/**
 * Generate a unique slug by checking existing slugs and appending -N if needed.
 * Pass a checkExists function that returns true if the slug is already taken.
 */
export async function uniqueSlug(
  title: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = toSlug(title);
  if (!(await checkExists(base))) return base;

  let n = 2;
  while (await checkExists(appendSuffix(base, n))) {
    n++;
  }
  return appendSuffix(base, n);
}
```

- [ ] **Step 7: Run to verify tests pass**

```bash
npm test
```

Expected: PASS — 6 tests in slugify.test.ts

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts package.json src/lib/slugify.ts src/lib/__tests__/slugify.test.ts
git commit -m "feat: add vitest setup and slugify utility"
```

---

### Task 2: TypeScript database types

**Files:**
- Create: `src/types/database.ts`

- [ ] **Step 1: Create src/types/database.ts**

```ts
// src/types/database.ts
// Manual type definitions — regenerate with Supabase CLI after migrations:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts

export type ProjectStatus = "draft" | "published";
export type ProjectCategory =
  | "Drywall"
  | "Painting"
  | "Plumbing"
  | "Electrical"
  | "Carpentry"
  | "Outdoor";

export type EventType =
  | "Sponsor"
  | "Booth"
  | "Speaking"
  | "Community"
  | "Other";

export type MediaType = "youtube" | "podcast";

// ── Projects ──────────────────────────────────────────────────────────────────

export interface ProjectRow {
  id: string;
  slug: string;
  status: ProjectStatus;
  title: string;
  category: ProjectCategory;
  neighborhood: string | null;
  community: string | null;
  location: string | null;
  summary: string | null;
  before_label: string | null;
  after_label: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  overview: string | null;
  challenge: string | null;
  result: string | null;
  scope_items: string[];
  duration: string | null;
  scope: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  published_at: string | null;
}

export interface ProjectInsert {
  slug: string;
  status?: ProjectStatus;
  title: string;
  category: ProjectCategory;
  neighborhood?: string;
  community?: string;
  location?: string;
  summary?: string;
  before_label?: string;
  after_label?: string;
  before_photo_url?: string;
  after_photo_url?: string;
  overview?: string;
  challenge?: string;
  result?: string;
  scope_items?: string[];
  duration?: string;
  scope?: string;
  created_by?: string;
}

// ── Events ────────────────────────────────────────────────────────────────────

export interface EventRow {
  id: string;
  slug: string;
  status: ProjectStatus;
  title: string;
  event_type: EventType;
  event_date: string;
  end_date: string | null;
  location_name: string;
  address: string;
  google_place_id: string | null;
  description: string;
  image_url: string;
  website_url: string | null;
  local_links: Array<{ label: string; url: string }>;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface EventInsert {
  slug: string;
  status?: ProjectStatus;
  title: string;
  event_type: EventType;
  event_date: string;
  end_date?: string;
  location_name: string;
  address: string;
  google_place_id?: string;
  description?: string;
  image_url?: string;
  website_url?: string;
  local_links?: Array<{ label: string; url: string }>;
  created_by?: string;
}

// ── Press Mentions ────────────────────────────────────────────────────────────

export interface PressMentionRow {
  id: string;
  url: string;
  headline: string;
  publication: string;
  image_url: string;
  summary: string;
  published_date: string | null;
  created_at: string;
}

export interface PressMentionInsert {
  url: string;
  headline?: string;
  publication?: string;
  image_url?: string;
  summary?: string;
  published_date?: string;
}

// ── Media Items ───────────────────────────────────────────────────────────────

export interface MediaItemRow {
  id: string;
  type: MediaType;
  title: string;
  url: string;
  thumbnail_url: string;
  description: string | null;
  published_date: string | null;
  sort_order: number;
  created_at: string;
}

export interface MediaItemInsert {
  type: MediaType;
  title: string;
  url: string;
  thumbnail_url?: string;
  description?: string;
  published_date?: string;
  sort_order?: number;
}

// ── Supabase Database shape (for typed client) ────────────────────────────────

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: ProjectInsert;
        Update: Partial<ProjectInsert>;
      };
      events: {
        Row: EventRow;
        Insert: EventInsert;
        Update: Partial<EventInsert>;
      };
      press_mentions: {
        Row: PressMentionRow;
        Insert: PressMentionInsert;
        Update: Partial<PressMentionInsert>;
      };
      media_items: {
        Row: MediaItemRow;
        Insert: MediaItemInsert;
        Update: Partial<MediaItemInsert>;
      };
    };
  };
}
```

- [ ] **Step 2: Update src/lib/supabase.ts to use the Database type**

In `src/lib/supabase.ts`, replace the top section:

```ts
// Replace:
type Database = unknown;

// With:
import type { Database } from "@/types/database";
```

Also replace the `TableRow` helper at the bottom:

```ts
// Replace:
export type TableRow<_T extends string> = Record<string, unknown>;

// With:
export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx astro check
```

Expected: 0 errors (the generic Database type now flows through the Supabase clients)

- [ ] **Step 4: Commit**

```bash
git add src/types/database.ts src/lib/supabase.ts
git commit -m "feat: add typed database interfaces for all four content tables"
```

---

### Task 3: Write migration 002

**Files:**
- Create: `supabase/migrations/002_content_tables.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/002_content_tables.sql
-- ============================================================
-- Alters projects table to match full spec schema.
-- Adds: events, press_mentions, media_items tables.
-- ============================================================

-- ── Helper: auto-update updated_at on row changes ────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Projects: migrate to full spec schema ────────────────────────────────────

-- Add status column (replaces is_published)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published'));

-- Migrate existing boolean flag to status string
UPDATE projects SET status = 'published' WHERE is_published = true;

-- Drop old boolean column
ALTER TABLE projects DROP COLUMN IF EXISTS is_published;

-- Rename photo columns to match spec
ALTER TABLE projects RENAME COLUMN before_image TO before_photo_url;
ALTER TABLE projects RENAME COLUMN after_image  TO after_photo_url;

-- Rename description → summary (card blurb per spec)
ALTER TABLE projects RENAME COLUMN description TO summary;

-- Add all new columns from spec (nullable to allow gradual migration)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS neighborhood  TEXT,
  ADD COLUMN IF NOT EXISTS community     TEXT,
  ADD COLUMN IF NOT EXISTS duration      TEXT,
  ADD COLUMN IF NOT EXISTS scope         TEXT,
  ADD COLUMN IF NOT EXISTS before_label  TEXT,
  ADD COLUMN IF NOT EXISTS after_label   TEXT,
  ADD COLUMN IF NOT EXISTS overview      TEXT,
  ADD COLUMN IF NOT EXISTS challenge     TEXT,
  ADD COLUMN IF NOT EXISTS result        TEXT,
  ADD COLUMN IF NOT EXISTS scope_items   TEXT[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by    TEXT,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at  TIMESTAMPTZ;

-- Add category CHECK constraint
ALTER TABLE projects
  ADD CONSTRAINT projects_category_check
  CHECK (category IN ('Drywall', 'Painting', 'Plumbing', 'Electrical', 'Carpentry', 'Outdoor'));

-- Trigger: auto-set updated_at
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Update RLS policy (was is_published=true, now status='published')
DROP POLICY IF EXISTS "projects_public_read_published" ON projects;
CREATE POLICY "projects_public_read_published" ON projects
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- ── Events table ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        NOT NULL UNIQUE,
  status          TEXT        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft', 'published')),
  title           TEXT        NOT NULL,
  event_type      TEXT        NOT NULL
                              CHECK (event_type IN ('Sponsor', 'Booth', 'Speaking', 'Community', 'Other')),
  event_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ,
  location_name   TEXT        NOT NULL,
  address         TEXT        NOT NULL,
  google_place_id TEXT,
  description     TEXT        NOT NULL DEFAULT '',
  image_url       TEXT        NOT NULL DEFAULT '',
  website_url     TEXT,
  local_links     JSONB       NOT NULL DEFAULT '[]',
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_read_published" ON events
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "events_service_role_all" ON events
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Index for "next upcoming event" query
CREATE INDEX IF NOT EXISTS idx_events_date_published
  ON events(event_date)
  WHERE status = 'published';

-- ── Press Mentions table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS press_mentions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  url             TEXT        NOT NULL,
  headline        TEXT        NOT NULL DEFAULT '',
  publication     TEXT        NOT NULL DEFAULT '',
  image_url       TEXT        NOT NULL DEFAULT '/og-default.jpg',
  summary         TEXT        NOT NULL DEFAULT '',
  published_date  DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE press_mentions ENABLE ROW LEVEL SECURITY;

-- Press mentions are public (no PII)
CREATE POLICY "press_mentions_public_read" ON press_mentions
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "press_mentions_service_role_all" ON press_mentions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── Media Items table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS media_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT        NOT NULL CHECK (type IN ('youtube', 'podcast')),
  title           TEXT        NOT NULL,
  url             TEXT        NOT NULL,
  thumbnail_url   TEXT        NOT NULL DEFAULT '',
  description     TEXT,
  published_date  DATE,
  sort_order      INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_items_public_read" ON media_items
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "media_items_service_role_all" ON media_items
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Apply migration via Supabase dashboard**

Option A — Supabase CLI (if configured):
```bash
npx supabase db push
```

Option B — Dashboard: open Supabase project → SQL Editor → paste contents of `supabase/migrations/002_content_tables.sql` → Run.

- [ ] **Step 3: Verify migration in SQL Editor**

Run this verification query in Supabase SQL Editor:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;
```

Expected columns present: `slug`, `status`, `neighborhood`, `community`, `overview`, `challenge`, `result`, `scope_items`, `before_photo_url`, `after_photo_url`, `before_label`, `after_label`, `published_at`.

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('events', 'press_mentions', 'media_items');
```

Expected: 3 rows returned.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/002_content_tables.sql
git commit -m "feat: add events/press_mentions/media_items tables, migrate projects to full spec schema"
```

---

### Task 4: Seed the 6 existing projects

**Files:**
- Create: `supabase/seed.sql`

- [ ] **Step 1: Create supabase/seed.sql**

```sql
-- supabase/seed.sql
-- Seeds the 6 hardcoded projects from projects/index.astro and projects/[slug].astro
-- into the Supabase projects table.
--
-- Grandfathered: these 6 records are published despite before_photo_url being empty.
-- before_photo_url = '' (not null) — publish gate only applies to new records.

INSERT INTO projects (
  slug, status, title, category, neighborhood, community, location,
  summary, before_label, after_label, before_photo_url, after_photo_url,
  overview, challenge, result, scope_items, duration, scope, published_at
) VALUES

(
  'stonebridge-ranch-drywall',
  'published',
  'Stonebridge Ranch Drywall Restoration',
  'Drywall',
  'Stonebridge Ranch',
  'Stonebridge Ranch',
  'McKinney, TX 75069',
  'Water-damaged drywall in master bedroom — cut out, replaced, and textured to match.',
  'Water damage, sagging drywall',
  'Seamless repair, ready to paint',
  '',
  '/services/drywall.webp',
  'The homeowner noticed a soft, discolored section on the master bedroom ceiling following a slow roof leak. The damaged area had grown over several months before being addressed. We assessed the damage, identified and confirmed the leak source was fixed, then removed the compromised drywall, treated for mold, installed new drywall, applied joint compound in multiple coats, matched the original orange-peel texture, and primed — all in a single day.',
  'The original texture was a custom blend between orange-peel and knockdown — not a standard pattern. Matching it required testing three samples before landing on the right technique.',
  'The repaired area is completely invisible. The homeowner was unable to identify where the repair was made during the final walkthrough.',
  ARRAY['Removed 14 sq ft of water-damaged drywall', 'Mold treatment and prevention spray', 'New 5/8" drywall installed', 'Three-coat joint compound application', 'Orange-peel texture match', 'Primer coat applied, ready for paint'],
  '1 day',
  'Water-damaged drywall repair, texture match, prime',
  now()
),

(
  'craig-ranch-living-room',
  'published',
  'Craig Ranch Living Room Refresh',
  'Painting',
  'Craig Ranch',
  'Craig Ranch',
  'McKinney, TX 75070',
  'Full living room repaint with new accent wall, fresh trim, and updated fixtures.',
  'Dated paint, scuffed walls',
  'Clean, modern finish throughout',
  '',
  '/services/painting.webp',
  'This Craig Ranch family was ready to move on from the builder beige that came with their home. We prepped all surfaces — filled nail holes, caulked gaps at trim and ceiling, lightly sanded — then applied fresh primer before a full two-coat paint across walls and ceiling, plus a deep navy accent wall behind the sofa.',
  'The existing baseboard had numerous paint drips from prior work and needed sanding down before repainting. The accent wall color required three coats for full opacity.',
  'The room was transformed from builder standard to a polished, intentional space. The family said it felt like moving into a new home.',
  ARRAY['Surface prep: filling, caulking, sanding', 'Primer coat on all walls and ceiling', 'Two-coat wall paint (Sherwin-Williams Accessible Beige)', 'Three-coat deep navy accent wall', 'Trim and baseboard repainting', 'Touch-ups and final inspection'],
  '2 days',
  'Full room paint, accent wall, trim and baseboard repaint',
  now()
),

(
  'eldorado-bathroom-fixtures',
  'published',
  'Eldorado Master Bath Fixture Upgrade',
  'Plumbing',
  'Historic Downtown',
  'Eldorado',
  'McKinney, TX 75072',
  'All-new faucets, mirrors, light fixtures, and towel bars installed across master bath.',
  'Builder-grade fixtures',
  'Upgraded, cohesive look',
  '',
  '/services/plumbing.webp',
  'The homeowner had already selected all new fixtures — they just needed a skilled hand to install everything in one clean visit. We replaced both vanity faucets, installed a new frameless mirror, swapped out the light bar for a new matte black fixture, and installed coordinating towel bars, robe hooks, and toilet paper holders throughout.',
  'The existing light bar wiring was set at a non-standard height, requiring a new junction box to properly center the new fixture. The mirror weight also required stud location and appropriate wall anchors.',
  'A complete bathroom upgrade completed in a single day. The matte black hardware throughout the room creates a cohesive, intentional look.',
  ARRAY['Dual vanity faucet replacement', 'Frameless mirror installation (60x36)', 'Matte black vanity light bar install', 'New junction box for light centering', '6-piece hardware set install (towel bar, hooks, TP holder)', 'Cleanup and final inspection'],
  '1 day',
  'Faucet replacement, mirror installation, light fixtures, hardware',
  now()
),

(
  'allen-tv-mounting',
  'published',
  'Allen Home Theater Setup',
  'Electrical',
  'Westridge',
  'Twin Creeks',
  'Allen, TX 75013',
  '85" TV mounted on stone fireplace wall with full in-wall cable concealment.',
  'No TV mount, loose cables',
  'Clean wall-mount, zero visible cables',
  '',
  '/services/tv-mount.webp',
  'Mounting a large TV on a stone fireplace requires masonry anchors rated for the load, proper placement above the firebox, and careful planning for cable routing. We used a full-motion mount with masonry anchors, routed power and HDMI through the wall to an existing outlet below, and installed an in-wall cable management kit.',
  'The stone surface had uneven texture requiring custom shim plates to keep the mount perfectly level. The cable routing also needed to avoid a cross-brace inside the wall.',
  'An 85" TV perfectly positioned on a stone fireplace with zero visible cables — the installation looks custom-built.',
  ARRAY['Masonry anchor installation in stone', 'Full-motion mount (rated to 200 lbs)', 'In-wall HDMI and power routing', 'Custom shim plates for level installation', 'AV component shelf installation', 'Final calibration and test'],
  'Half day',
  '85" TV mount on stone fireplace, in-wall cable concealment',
  now()
),

(
  'frisco-crown-molding',
  'published',
  'Frisco Crown Molding Installation',
  'Carpentry',
  'Stonebridge Ranch',
  'Newman Village',
  'Frisco, TX 75034',
  'Crown molding installed throughout main floor — kitchen, dining, living, and hallways.',
  'No crown, flat walls',
  'Custom trim throughout',
  '',
  '/services/door.webp',
  'This Frisco homeowner wanted to elevate their builder-grade home with crown molding throughout the main living areas. We selected a 3.5" colonial profile to complement the 9-foot ceilings, cut all miters and copes precisely, installed with construction adhesive and finish nails, filled and caulked all joints, and left everything sanded and primer-ready.',
  'The hallways had multiple 45-degree turns that required compound miter cuts. One ceiling had a slight bow requiring careful scribing to keep the molding flush.',
  'The main floor feels custom and complete. Several guests assumed the molding was original to the home.',
  ARRAY['180 linear feet of 3.5" colonial crown', 'Coped joints at all inside corners', 'Mitered joints at all outside corners', 'Construction adhesive + 15-gauge finish nails', 'All joints filled, caulked, and sanded', 'Ready for paint'],
  '3 days',
  'Crown molding throughout main floor — kitchen, dining, living, hallways',
  now()
),

(
  'prosper-deck-restoration',
  'published',
  'Prosper Backyard Deck Restoration',
  'Outdoor',
  'Craig Ranch',
  'Windsong Ranch',
  'Prosper, TX 75078',
  'Pressure washed, repaired rotted boards, sanded, and stained a 400 sq ft cedar deck.',
  'Weathered, grey, damaged boards',
  'Restored, stained, and protected',
  '',
  '/services/painting.webp',
  'After 8 years of North Texas sun and rain, this cedar deck had gone grey, with several boards showing signs of rot and splitting. We pressure washed at appropriate pressure for wood, replaced 12 damaged boards, sanded the entire surface, and applied a semi-transparent cedar-tone deck stain.',
  'The deck had been stained previously with a solid color stain that needed to be fully stripped before the new semi-transparent stain could penetrate. This required an additional chemical stripping step.',
  'The deck looks better than it did when new. The homeowners said they''ll actually use it again now — they had been avoiding it.',
  ARRAY['Full deck pressure wash (appropriate PSI for cedar)', 'Chemical stain strip for old solid stain', '12 cedar board replacements', 'Full deck sanding (60 then 120 grit)', 'Two-coat semi-transparent cedar deck stain', 'Hardware tightening and inspection'],
  '2 days',
  'Pressure wash, board replacement, sand, stain entire 400 sq ft deck',
  now()
)

ON CONFLICT (slug) DO NOTHING;
```

- [ ] **Step 2: Apply seed via Supabase SQL Editor**

Open Supabase project → SQL Editor → paste `supabase/seed.sql` → Run.

- [ ] **Step 3: Verify seed in SQL Editor**

```sql
SELECT slug, status, title, category FROM projects ORDER BY created_at;
```

Expected: 6 rows, all `status = 'published'`.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat: seed 6 existing projects into Supabase"
```

---

### Task 5: Update projects/index.astro to use Supabase

**Files:**
- Modify: `src/pages/projects/index.astro`

Replace the hardcoded `const projects = [...]` array and everything after the comment block with a Supabase query. Keep all HTML and scripts identical — only change the data source.

- [ ] **Step 1: Replace the frontmatter data source in projects/index.astro**

Replace lines 1–113 (the entire frontmatter) with:

```ts
---
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
import { createServerClient } from "@/lib/supabase";
import type { ProjectRow } from "@/types/database";
import {
  BUSINESS_NAME,
  PHONE_DISPLAY,
  PHONE_RAW,
  PRIMARY_CITY,
  PRIMARY_STATE,
  REVIEW_COUNT,
  SITE_URL,
} from "@/config/site";

const telHref = `tel:${PHONE_RAW}`;

const serviceFilters = ["All Projects", "Drywall", "Painting", "Plumbing", "Electrical", "Carpentry", "Outdoor"];

// ── Fetch published projects from Supabase ─────────────────────────────────
const supabase = createServerClient();
const { data, error } = await supabase
  .from("projects")
  .select("slug, title, category, neighborhood, location, summary, before_label, after_label, after_photo_url")
  .eq("status", "published")
  .order("published_at", { ascending: false });

if (error) {
  console.error("[projects/index] Supabase query failed:", error.message);
}

const projects = (data ?? []) as Pick<
  ProjectRow,
  "slug" | "title" | "category" | "neighborhood" | "location" | "summary" | "before_label" | "after_label" | "after_photo_url"
>[];

/* Derive area list from actual data */
const areaFilters = Array.from(new Set(projects.map(p => p.neighborhood ?? ""))).filter(Boolean).sort();

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
    { "@type": "ListItem", "position": 2, "name": "Projects", "item": `${SITE_URL}/projects` }
  ]
};

const collectionPageSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": `Projects & Case Studies | ${BUSINESS_NAME}`,
  "url": `${SITE_URL}/projects`,
  "description": `Browse real home repair projects by ${BUSINESS_NAME} — before and after photos of drywall, painting, plumbing, carpentry, and more in ${PRIMARY_CITY}, ${PRIMARY_STATE}.`
};
---
```

- [ ] **Step 2: Update the project card image reference in the HTML**

In the HTML section, find the `<img>` inside the card that currently uses `image`:

```astro
<!-- Replace: -->
{projects.map(({ slug, title, category, neighborhood, location, summary, beforeLabel, afterLabel, image }) => (
  ...
  <img src={image} alt={`${title} — ${BUSINESS_NAME}`} ... />
  ...
  <span class="text-[#567798]"><strong class="text-[#151d25]">Before:</strong> {beforeLabel}</span>
  ...
  <span class="text-[#567798]"><strong class="text-[#151d25]">After:</strong> {afterLabel}</span>
```

```astro
<!-- With: -->
{projects.map(({ slug, title, category, neighborhood, location, summary, before_label, after_label, after_photo_url }) => (
  ...
  <img src={after_photo_url ?? "/og-default.jpg"} alt={`${title} — ${BUSINESS_NAME}`} ... />
  ...
  <span class="text-[#567798]"><strong class="text-[#151d25]">Before:</strong> {before_label}</span>
  ...
  <span class="text-[#567798]"><strong class="text-[#151d25]">After:</strong> {after_label}</span>
```

Also update the `data-neighborhood` attribute:
```astro
<!-- Replace: -->
data-category={category}
data-neighborhood={neighborhood}

<!-- With (no change needed — same field names): -->
data-category={category}
data-neighborhood={neighborhood ?? ""}
```

Also update the result count display — replace `projects.length` hardcoded references with the dynamic value (it will still be `projects.length` but now `projects` comes from Supabase):

The `Showing X of Y projects` line and JS `totalCount` remain correct as-is since `projects.length` still refers to the fetched array.

- [ ] **Step 3: Verify dev server renders correctly**

```bash
npm run dev
```

Open `http://localhost:4321/projects` — verify 6 project cards render with the same data as before.

Expected: identical visual output (category images still used as after_photo_url, before/after labels show, filters work).

- [ ] **Step 4: Commit**

```bash
git add src/pages/projects/index.astro
git commit -m "feat: migrate projects/index.astro from hardcoded array to Supabase query"
```

---

### Task 6: Update projects/[slug].astro to use Supabase

**Files:**
- Modify: `src/pages/projects/[slug].astro`

- [ ] **Step 1: Replace the frontmatter in projects/[slug].astro**

Replace lines 1–139 (entire frontmatter) with:

```ts
---
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
import { createServerClient } from "@/lib/supabase";
import type { ProjectRow } from "@/types/database";
import {
  BUSINESS_NAME,
  PHONE_DISPLAY,
  PHONE_RAW,
  SITE_URL,
} from "@/config/site";

const telHref = `tel:${PHONE_RAW}`;

// ── Fetch project from Supabase ────────────────────────────────────────────
const { slug } = Astro.params;

const supabase = createServerClient();
const { data, error } = await supabase
  .from("projects")
  .select("*")
  .eq("slug", slug)
  .eq("status", "published")
  .single();

if (error || !data) return Astro.redirect("/404");

const cs = data as ProjectRow;

const heroImage = cs.after_photo_url || (() => {
  const map: Record<string, string> = {
    Drywall: "/services/drywall.webp",
    Painting: "/services/painting.webp",
    Plumbing: "/services/plumbing.webp",
    Electrical: "/services/tv-mount.webp",
    Carpentry: "/services/door.webp",
    Outdoor: "/services/painting.webp",
  };
  return map[cs.category] ?? "/truck-image.webp";
})();

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
    { "@type": "ListItem", "position": 2, "name": "Projects", "item": `${SITE_URL}/projects` },
    { "@type": "ListItem", "position": 3, "name": cs.title, "item": `${SITE_URL}/projects/${cs.slug}` }
  ]
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": cs.title,
  "description": cs.overview ?? cs.summary ?? "",
  "image": `${SITE_URL}${heroImage}`,
  "author": {
    "@type": "Organization",
    "name": BUSINESS_NAME,
    "url": SITE_URL
  },
  "publisher": {
    "@type": "Organization",
    "name": BUSINESS_NAME,
    "logo": {
      "@type": "ImageObject",
      "url": `${SITE_URL}/logo-horizontal-dark.webp`
    }
  }
};
---
```

- [ ] **Step 2: Update HTML references from camelCase to snake_case**

In the HTML section, update all references to match the new field names from `ProjectRow`:

| Old | New |
|---|---|
| `cs.community` | `cs.community` (unchanged) |
| `cs.duration` | `cs.duration` (unchanged) |
| `cs.location` | `cs.location` (unchanged) |
| `cs.overview` | `cs.overview` |
| `cs.challenge` | `cs.challenge` |
| `cs.result` | `cs.result` |
| `cs.scopeItems.map(...)` | `(cs.scope_items ?? []).map(...)` |

Find and replace `cs.scopeItems` → `(cs.scope_items ?? [])`.

Also update the Layout description:
```astro
<!-- Replace: -->
description={`Case study: ${cs.overview.slice(0, 140)}...`}

<!-- With: -->
description={`Case study: ${(cs.overview ?? cs.summary ?? "").slice(0, 140)}...`}
```

- [ ] **Step 3: Verify dev server renders correctly**

```bash
npm run dev
```

Open `http://localhost:4321/projects/stonebridge-ranch-drywall` — verify the detail page renders with all sections: hero, overview, challenge, result, scope of work sidebar.

Check 404 behavior: open `http://localhost:4321/projects/does-not-exist` — should redirect to `/404`.

- [ ] **Step 4: Run TypeScript check**

```bash
npx astro check
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/projects/[slug].astro
git commit -m "feat: migrate projects/[slug].astro from hardcoded array to Supabase query"
```

---

## Self-Review

**Spec coverage:**
- ✅ `projects` table altered to full spec schema (all 19 columns)
- ✅ `events` table created with all spec columns
- ✅ `press_mentions` table created with all spec columns
- ✅ `media_items` table created with all spec columns
- ✅ RLS policies: anon can read published records, service_role has full access
- ✅ TypeScript types defined for all tables
- ✅ `supabase.ts` updated with typed Database
- ✅ 6 hardcoded projects seeded as published records
- ✅ `projects/index.astro` queries Supabase, same visual output
- ✅ `projects/[slug].astro` queries Supabase, 404 on missing slug
- ✅ `slugify.ts` helper with tests for Plan 3 admin use
- ✅ `updated_at` trigger function created (shared by all tables)

**Not in this plan (by design):**
- Events/media-kit/brand pages → Plan 2
- Admin interface + WorkOS → Plan 3
- `project-photos` Supabase storage bucket → Plan 3 (needed for photo uploads)
