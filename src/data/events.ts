// Add events here when scheduled. Used by src/pages/events/index.astro and [slug].astro.
export interface EventDef {
  slug: string;
  title: string;
  event_type: string;
  event_date: string;      // ISO 8601 e.g. "2026-06-14T10:00:00"
  end_date?: string;
  location_name: string;
  address: string;
  description: string;
  image_url?: string;
  google_place_id?: string;
  website_url?: string;
  local_links?: { label: string; url: string }[];
}

export const EVENTS: EventDef[] = [
  // No events scheduled yet.
];
