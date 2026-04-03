-- supabase/migrations/003_services_locations.sql
-- Services and locations tables for Agency Admin management via admin UI.
-- Services/locations are managed exclusively by Agency Admin.
-- Public service and location pages query these tables (SSR).

-- ── Services ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS services (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        NOT NULL UNIQUE,
  name            TEXT        NOT NULL,
  description     TEXT        NOT NULL DEFAULT '',
  image_url       TEXT        NOT NULL DEFAULT '',
  cta             TEXT        NOT NULL DEFAULT 'Learn More',
  seo_title       TEXT        NOT NULL DEFAULT '',
  meta_description TEXT       NOT NULL DEFAULT '',
  h1              TEXT        NOT NULL DEFAULT '',
  body_html       TEXT        NOT NULL DEFAULT '',
  faq_items       JSONB       NOT NULL DEFAULT '[]',
  seo_doc_url     TEXT,       -- URL of uploaded SEO document (Supabase seo-documents bucket)
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  sort_order      INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Public can read active services
CREATE POLICY "services_public_read_active" ON services
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- service_role: full access (used by admin API routes)
CREATE POLICY "services_service_role_all" ON services
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Locations ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS locations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        NOT NULL UNIQUE,
  city            TEXT        NOT NULL,
  state           TEXT        NOT NULL DEFAULT 'TX',
  seo_title       TEXT        NOT NULL DEFAULT '',
  meta_description TEXT       NOT NULL DEFAULT '',
  h1              TEXT        NOT NULL DEFAULT '',
  body_html       TEXT        NOT NULL DEFAULT '',
  faq_items       JSONB       NOT NULL DEFAULT '[]',
  seo_doc_url     TEXT,       -- URL of uploaded SEO document
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  sort_order      INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_public_read_active" ON locations
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "locations_service_role_all" ON locations
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
