-- ============================================================
-- Homeworks Website Template — Initial Schema
-- vibe-security-skill compliance:
--   • RLS enabled on ALL tables
--   • No USING (true) for anon/authenticated roles
--   • contacts: NO anon SELECT (PII protection)
--   • projects: anon SELECT on published rows only
--   • service_role: full access on both tables
-- ============================================================

-- ============================================================
-- CONTACTS — website form submissions
-- sync_status tracks Supabase→GHL sync (mirrors onboarding app)
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_name      TEXT        NOT NULL DEFAULT '',
  last_name       TEXT,
  phone           TEXT        NOT NULL,
  email           TEXT,
  zip             TEXT,
  services        TEXT[]      NOT NULL DEFAULT '{}',
  timeline        TEXT,
  message         TEXT,
  source          TEXT        NOT NULL DEFAULT 'website-form',
  ghl_contact_id  TEXT,
  ghl_location_id TEXT        NOT NULL,
  sync_status     TEXT        NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'needs_attention')),
  sync_attempts   INT         NOT NULL DEFAULT 0,
  sync_last_error TEXT
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- service_role: full access (used by /api/contact and /api/contact-sync)
CREATE POLICY "contacts_service_role_all" ON contacts
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- No anon/authenticated SELECT — contacts contain PII

-- Performance indexes
CREATE INDEX idx_contacts_sync_pending ON contacts(sync_status)
  WHERE sync_status = 'pending';
CREATE INDEX idx_contacts_ghl_location ON contacts(ghl_location_id);

-- ============================================================
-- PROJECTS — portfolio case studies
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  slug         TEXT        NOT NULL UNIQUE,
  title        TEXT        NOT NULL,
  description  TEXT,
  location     TEXT,
  category     TEXT,
  before_image TEXT,
  after_image  TEXT,
  is_published BOOLEAN     NOT NULL DEFAULT false
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Public can read published projects (portfolio display)
CREATE POLICY "projects_public_read_published" ON projects
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- service_role: full access
CREATE POLICY "projects_service_role_all" ON projects
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
