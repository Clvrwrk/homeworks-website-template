// src/pages/api/admin/ghl-notify.ts
// Fire-and-forget GHL Custom Object upsert on publish.
// Called by all publish actions. Silently fails if GHL is unavailable.

export async function ghlNotifyPublish(type: "project" | "event" | "press_mention" | "media_item", record: Record<string, unknown>): Promise<void> {
  const apiKey     = import.meta.env.GHL_API_KEY as string;
  const locationId = import.meta.env.GHL_LOCATION_ID as string;
  if (!apiKey || !locationId) return; // Skip if GHL not configured

  const siteUrl = import.meta.env.PUBLIC_APP_URL as string;

  // Build Custom Object payload based on type
  let objectType: string;
  let fields: Record<string, unknown>;

  switch (type) {
    case "project":
      objectType = "project";
      fields = {
        project_title:        record.title,
        project_category:     record.category,
        project_neighborhood: record.neighborhood,
        project_location:     record.location,
        project_url:          `${siteUrl}/projects/${record.slug}`,
        project_before_photo: record.before_photo_url,
        project_after_photo:  record.after_photo_url,
        project_published_date: record.published_at,
        project_status:       "Published",
      };
      break;
    case "event":
      objectType = "event";
      fields = {
        event_title:         record.title,
        event_type:          record.event_type,
        event_date:          record.event_date,
        event_location_name: record.location_name,
        event_address:       record.address,
        event_url:           `${siteUrl}/events/${record.slug}`,
        event_website_url:   record.website_url,
        event_image_url:     record.image_url,
        event_status:        "Published",
      };
      break;
    case "press_mention":
      objectType = "press_mention";
      fields = {
        press_headline:      record.headline,
        press_publication:   record.publication,
        press_url:           record.url,
        press_summary:       record.summary,
        press_image_url:     record.image_url,
        press_published_date: record.published_date,
      };
      break;
    case "media_item":
      objectType = "media_item";
      fields = {
        media_title:        record.title,
        media_type:         record.type,
        media_url:          record.url,
        media_thumbnail_url: record.thumbnail_url,
        media_description:  record.description,
        media_published_date: record.published_date,
        media_sort_order:   record.sort_order,
      };
      break;
  }

  try {
    await fetch(`https://services.leadconnectorhq.com/custom-objects/`, {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Version":        "2021-07-28",
        "Content-Type":   "application/json",
      },
      body: JSON.stringify({
        locationId,
        objectType,
        fields,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error(`[ghl-notify] Failed to notify GHL for ${type}:`, err);
    // Silently fail — GHL sync should not block the admin UI
  }
}
