/**
 * POST /api/contact-sync
 *
 * Internal endpoint called by /api/contact after a successful Supabase insert.
 * Mirrors the sync pattern from onboarding.homeworksadvantage.com/api/ghl-sync.
 *
 * Flow:
 *   1. Fetch contact row from Supabase by id
 *   2. Upsert GHL contact (PUT if ghl_contact_id exists, POST if new)
 *   3. Create GHL opportunity in pipeline → "New Lead" stage
 *   4. Add GHL note with services/timeline/zip details
 *   5a. Success → UPDATE sync_status='synced', ghl_contact_id=...
 *   5b. Failure → UPDATE sync_attempts+1, sync_last_error=...
 *        After 3 failures → sync_status='needs_attention' + alert email
 */

import type { APIRoute } from "astro";
import { createAdminClient } from "../../lib/supabase";
import { GHL_PIPELINE_ID, GHL_STAGE_ID, BUSINESS_NAME } from "../../config/site";

interface ContactRow {
  id:              string;
  first_name:      string;
  last_name:       string | null;
  phone:           string;
  email:           string | null;
  zip:             string | null;
  services:        string[] | null;
  timeline:        string | null;
  message:         string | null;
  ghl_contact_id:  string | null;
  ghl_location_id: string;
  sync_status:     string;
  sync_attempts:   number;
}

const GHL_BASE    = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
const MAX_RETRIES = 3;
const RETRY_DELAY = 15_000;

function ghlHeaders(apiKey: string) {
  return {
    "Authorization": `Bearer ${apiKey}`,
    "Version":       GHL_VERSION,
    "Content-Type":  "application/json",
    "Accept":        "application/json",
  };
}

function getEnv(key: string): string {
  return (
    (import.meta.env?.[key] as string | undefined) ??
    (typeof process !== "undefined" ? process.env[key] : undefined) ??
    ""
  );
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function ghlUpsertWithRetry(
  apiKey: string,
  locationId: string,
  contactPayload: Record<string, unknown>,
  existingContactId?: string | null,
  attempt = 1,
): Promise<string | null> {
  try {
    const url    = existingContactId
      ? `${GHL_BASE}/contacts/${existingContactId}`
      : `${GHL_BASE}/contacts/upsert`;
    const method = existingContactId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: ghlHeaders(apiKey),
      body:    JSON.stringify({ locationId, ...contactPayload }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        contact?: { id?: string };
        id?: string;
      };
      return data?.contact?.id ?? data?.id ?? null;
    }

    console.error(`[contact-sync] GHL upsert attempt ${attempt} failed ${res.status}`);
  } catch (err) {
    console.error(`[contact-sync] GHL upsert attempt ${attempt} error:`, err);
  }

  if (attempt < MAX_RETRIES) {
    await sleep(RETRY_DELAY);
    return ghlUpsertWithRetry(apiKey, locationId, contactPayload, existingContactId, attempt + 1);
  }

  return null;
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey     = getEnv("GHL_API_KEY");
  const locationId = getEnv("GHL_LOCATION_ID");

  let body: { contactRowId: string };
  try {
    body = await request.json() as { contactRowId: string };
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const { contactRowId } = body;
  if (!contactRowId) {
    return new Response("contactRowId required", { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch the contact row
  const { data: rawRow, error: fetchError } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactRowId)
    .single();

  const row = rawRow as ContactRow | null;

  if (fetchError || !row || !rawRow) {
    console.error("[contact-sync] Could not fetch contact row:", fetchError?.message);
    return new Response("Row not found", { status: 404 });
  }

  if (!apiKey || !locationId) {
    console.warn("[contact-sync] GHL credentials not configured — skipping (dev mode)");
    return new Response("OK (dev mode)", { status: 200 });
  }

  const bizTag = BUSINESS_NAME.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const contactPayload: Record<string, unknown> = {
    firstName: row.first_name,
    lastName:  row.last_name ?? "",
    phone:     row.phone,
    source:    "Website Form",
    tags:      ["website-lead", bizTag],
  };
  if (row.email) contactPayload.email      = row.email;
  if (row.zip)   contactPayload.postalCode = row.zip;

  // 1. Upsert GHL contact
  const ghlContactId = await ghlUpsertWithRetry(
    apiKey, locationId, contactPayload, row.ghl_contact_id,
  );

  if (!ghlContactId) {
    // All retries failed
    const newAttempts = (row.sync_attempts ?? 0) + 1;
    const status      = newAttempts >= MAX_RETRIES ? "needs_attention" : "pending";

    await (supabase.from("contacts") as any).update({
      sync_attempts:   newAttempts,
      sync_status:     status,
      sync_last_error: "GHL contact upsert failed after max retries",
    }).eq("id", contactRowId);

    if (status === "needs_attention") {
      try {
        await fetch(`${GHL_BASE}/conversations/messages`, {
          method:  "POST",
          headers: ghlHeaders(apiKey),
          body: JSON.stringify({
            type:      "Email",
            locationId,
            contactId: "OPERATOR_GHL_CONTACT_ID", // replace with real operator contact ID
            subject:   `⚠️ Website lead sync failed — ${row.first_name} ${row.last_name ?? ""}`,
            html:      `<p>Contact row ${contactRowId} needs attention. Phone: ${row.phone}</p>`,
          }),
        });
      } catch (alertErr) {
        console.error("[contact-sync] Failed to send alert email:", alertErr);
      }
    }

    return new Response("Sync failed", { status: 500 });
  }

  // 2. Create GHL opportunity
  const opportunityName =
    [row.first_name, row.last_name].filter(Boolean).join(" ") || row.phone;

  try {
    await fetch(`${GHL_BASE}/opportunities/`, {
      method:  "POST",
      headers: ghlHeaders(apiKey),
      body: JSON.stringify({
        locationId,
        pipelineId:      GHL_PIPELINE_ID,
        pipelineStageId: GHL_STAGE_ID,
        contactId:       ghlContactId,
        name:            opportunityName,
        status:          "open",
        source:          "Website Form",
      }),
    });
  } catch (err) {
    console.error("[contact-sync] GHL opportunity creation error:", err);
  }

  // 3. Add GHL note
  const noteLines = [
    row.message          ? `Project description: ${row.message}` : null,
    row.services?.length ? `Services requested: ${(row.services as string[]).join(", ")}` : null,
    row.timeline         ? `Preferred timeline: ${row.timeline}` : null,
    row.zip              ? `Zip code: ${row.zip}` : null,
    `Source: Website Form`,
  ].filter(Boolean) as string[];

  if (noteLines.length) {
    try {
      await fetch(`${GHL_BASE}/contacts/${ghlContactId}/notes`, {
        method:  "POST",
        headers: ghlHeaders(apiKey),
        body:    JSON.stringify({ body: noteLines.join("\n") }),
      });
    } catch (err) {
      console.error("[contact-sync] GHL note error:", err);
    }
  }

  // 4. Update Supabase row to synced
  await (supabase.from("contacts") as any).update({
    sync_status:     "synced",
    ghl_contact_id:  ghlContactId,
    sync_attempts:   (row.sync_attempts ?? 0) + 1,
    sync_last_error: null,
  }).eq("id", contactRowId);

  return new Response("OK", { status: 200 });
};
