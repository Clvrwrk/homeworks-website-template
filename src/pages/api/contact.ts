/**
 * POST /api/contact
 *
 * 1. Validates phone (required)
 * 2. Inserts row into Supabase contacts table (sync_status: "pending")
 * 3. For AJAX (X-Requested-With: fetch): returns JSON {success: true}
 * 4. For regular form POST: redirects to /contact/success (303)
 * 5. Fires async POST to /api/contact-sync with the new row id (non-blocking)
 *
 * GHL sync happens in contact-sync.ts — UX never waits on CRM.
 */

import type { APIRoute } from "astro";
import { createAdminClient } from "../../lib/supabase";
import { GHL_LOCATION_ID, SITE_URL } from "../../config/site";

export const POST: APIRoute = async ({ request }) => {
  const isAjax = request.headers.get("X-Requested-With") === "fetch";

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const rawName   = (formData.get("name")      as string | null)?.trim() ?? "";
  const firstName = (formData.get("firstName") as string | null)?.trim()
    || (rawName ? rawName.split(" ")[0] : "");
  const lastName  = (formData.get("lastName")  as string | null)?.trim()
    || (rawName ? rawName.split(" ").slice(1).join(" ") : "");
  const phone     = (formData.get("phone")     as string | null)?.trim() ?? "";
  const email     = (formData.get("email")     as string | null)?.trim() ?? "";
  const zip       = (formData.get("zip")       as string | null)?.trim() ?? "";
  const message   = (formData.get("message")   as string | null)?.trim() ?? "";
  const timeline  = (formData.get("timeline")  as string | null)?.trim() ?? "";
  const services  = formData.getAll("services").map((s) => String(s).trim()).filter(Boolean);

  if (!phone) {
    if (isAjax) return Response.json({ error: "phone_required" }, { status: 400 });
    return Response.redirect(new URL("/contact?error=phone_required", SITE_URL), 303);
  }

  const supabase = createAdminClient();

  const { data, error } = await (supabase.from("contacts") as any)
    .insert([{
      first_name:      firstName,
      last_name:       lastName || null,
      phone,
      email:           email || null,
      zip:             zip || null,
      services,
      timeline:        timeline || null,
      message:         message || null,
      source:          "website-form",
      ghl_location_id: GHL_LOCATION_ID,
      sync_status:     "pending",
      sync_attempts:   0,
    }])
    .select("id")
    .single();

  if (error || !data) {
    console.error("[contact] Supabase insert failed:", error?.message);
    // Still respond with success — don't expose DB errors to visitors
  } else {
    // Fire-and-forget GHL sync (non-blocking)
    const syncUrl = new URL("/api/contact-sync", SITE_URL);
    fetch(syncUrl.toString(), {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ contactRowId: data.id }),
    }).catch((err) => {
      console.error("[contact] Failed to fire contact-sync:", err);
    });
  }

  if (isAjax) {
    return Response.json({ success: true }, { status: 200 });
  }
  return Response.redirect(new URL("/contact/success", SITE_URL), 303);
};
