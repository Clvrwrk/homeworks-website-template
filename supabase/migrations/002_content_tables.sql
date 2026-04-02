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
