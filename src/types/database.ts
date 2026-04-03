// src/types/database.ts
// Manual type definitions — regenerate with Supabase CLI after migrations:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts

export type ProjectStatus = "draft" | "published";
// Shared publish lifecycle for all content types
export type ContentStatus = "draft" | "published";
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
  status: ContentStatus;
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
  status?: ContentStatus;
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

// ── Services ──────────────────────────────────────────────────────────────────

export interface ServiceRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  cta: string;
  seo_title: string;
  meta_description: string;
  h1: string;
  body_html: string;
  faq_items: Array<{ question: string; answer: string }>;
  seo_doc_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface ServiceInsert {
  slug: string;
  name: string;
  description?: string;
  image_url?: string;
  cta?: string;
  seo_title?: string;
  meta_description?: string;
  h1?: string;
  body_html?: string;
  faq_items?: Array<{ question: string; answer: string }>;
  seo_doc_url?: string;
  is_active?: boolean;
  sort_order?: number;
}

// ── Locations ─────────────────────────────────────────────────────────────────

export interface LocationRow {
  id: string;
  slug: string;
  city: string;
  state: string;
  seo_title: string;
  meta_description: string;
  h1: string;
  body_html: string;
  faq_items: Array<{ question: string; answer: string }>;
  seo_doc_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface LocationInsert {
  slug: string;
  city: string;
  state?: string;
  seo_title?: string;
  meta_description?: string;
  h1?: string;
  body_html?: string;
  faq_items?: Array<{ question: string; answer: string }>;
  seo_doc_url?: string;
  is_active?: boolean;
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
        Relationships: [];
      };
      events: {
        Row: EventRow;
        Insert: EventInsert;
        Update: Partial<EventInsert>;
        Relationships: [];
      };
      press_mentions: {
        Row: PressMentionRow;
        Insert: PressMentionInsert;
        Update: Partial<PressMentionInsert>;
        Relationships: [];
      };
      media_items: {
        Row: MediaItemRow;
        Insert: MediaItemInsert;
        Update: Partial<MediaItemInsert>;
        Relationships: [];
      };
      services: {
        Row: ServiceRow;
        Insert: ServiceInsert;
        Update: Partial<ServiceInsert>;
        Relationships: [];
      };
      locations: {
        Row: LocationRow;
        Insert: LocationInsert;
        Update: Partial<LocationInsert>;
        Relationships: [];
      };
    };
  };
}
