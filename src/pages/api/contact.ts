/**
 * POST /api/contact
 *
 * Receives form submissions from both the homepage hero form and the
 * /contact page form, creates a Contact + Opportunity in GoHighLevel,
 * then redirects to /contact/success.
 *
 * GHL credentials (API key + Location ID) live in .env — never hardcoded.
 * Pipeline / Stage IDs are imported from src/config/site.ts.
 *
 * Fields accepted:
 *   name        — full name (homepage hero form)
 *   firstName   — first name (contact page form)
 *   lastName    — last name  (contact page form)
 *   phone       — REQUIRED — primary identifier in GHL
 *   email       — optional
 *   zip         — zip code
 *   message     — description of work needed
 *   services[]  — checkbox values (contact page)
 *   timeline    — preferred timeline (contact page)
 */

import type { APIRoute } from "astro";
import { GHL_PIPELINE_ID, GHL_STAGE_ID, BUSINESS_NAME } from "../../config/site";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_VERSION  = "2021-07-28";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getEnv(key: string): string {
  return (
    (import.meta.env?.[key] as string | undefined) ??
    (typeof process !== "undefined" ? process.env[key] : undefined) ??
    ""
  );
}

function ghlHeaders(apiKey: string) {
  return {
    "Authorization": `Bearer ${apiKey}`,
    "Version":       GHL_VERSION,
    "Content-Type":  "application/json",
    "Accept":        "application/json",
  };
}

// ── Handler ──────────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request }) => {
  const apiKey     = getEnv("GHL_API_KEY");
  const locationId = getEnv("GHL_LOCATION_ID");

  // ── Parse form body ────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Normalise name fields — homepage sends `name`, contact page sends firstName/lastName
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

  // ── Validate ───────────────────────────────────────────────────────────────
  if (!phone) {
    return Response.redirect(new URL("/contact?error=phone_required", request.url), 303);
  }

  // ── Skip GHL push in dev mode (no credentials) ────────────────────────────
  if (!apiKey || !locationId) {
    console.warn("[contact] GHL credentials not configured — skipping CRM push (dev mode)");
    return Response.redirect(new URL("/contact/success", request.url), 303);
  }

  // ── Build note body ───────────────────────────────────────────────────────
  const noteLines = [
    message             ? `Project description: ${message}` : null,
    services.length > 0 ? `Services requested: ${services.join(", ")}` : null,
    timeline            ? `Preferred timeline: ${timeline}` : null,
    zip                 ? `Zip code: ${zip}` : null,
    `Source: Website Form`,
  ].filter(Boolean) as string[];

  const noteBody        = noteLines.join("\n");
  const opportunityName = [firstName, lastName].filter(Boolean).join(" ") || phone;

  // Derive a slug-safe tag from the business name (e.g. "mckinney-fixit-pros")
  const bizTag = BUSINESS_NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // ── 1. Upsert Contact ──────────────────────────────────────────────────────
  let contactId: string | null = null;

  try {
    const contactPayload: Record<string, unknown> = {
      locationId,
      firstName,
      lastName,
      phone,
      source: "Website Form",
      tags:   ["website-lead", bizTag],
    };
    if (email) contactPayload.email      = email;
    if (zip)   contactPayload.postalCode = zip;

    const res = await fetch(`${GHL_BASE_URL}/contacts/upsert`, {
      method:  "POST",
      headers: ghlHeaders(apiKey),
      body:    JSON.stringify(contactPayload),
    });

    if (res.ok) {
      const data = (await res.json()) as { contact?: { id?: string }; id?: string };
      contactId = data?.contact?.id ?? data?.id ?? null;
      console.log(`[contact] GHL contact upserted: ${contactId}`);
    } else {
      console.error(`[contact] GHL upsert contact failed ${res.status}:`, await res.text());
    }
  } catch (err) {
    console.error("[contact] GHL contact upsert error:", err);
  }

  // ── 2. Create Opportunity in "New Lead" stage ─────────────────────────────
  if (contactId) {
    try {
      const oppPayload: Record<string, unknown> = {
        locationId,
        pipelineId:      GHL_PIPELINE_ID,
        pipelineStageId: GHL_STAGE_ID,
        contactId,
        name:   opportunityName,
        status: "open",
        source: "Website Form",
      };

      const oppRes = await fetch(`${GHL_BASE_URL}/opportunities/`, {
        method:  "POST",
        headers: ghlHeaders(apiKey),
        body:    JSON.stringify(oppPayload),
      });

      if (oppRes.ok) {
        const oppData = (await oppRes.json()) as { opportunity?: { id?: string } };
        console.log(`[contact] GHL opportunity created: ${oppData?.opportunity?.id}`);
      } else {
        console.error(`[contact] GHL create opportunity failed ${oppRes.status}:`, await oppRes.text());
      }
    } catch (err) {
      console.error("[contact] GHL opportunity error:", err);
    }

    // ── 3. Add project details as a note ──────────────────────────────────
    if (noteBody) {
      try {
        const noteRes = await fetch(`${GHL_BASE_URL}/contacts/${contactId}/notes`, {
          method:  "POST",
          headers: ghlHeaders(apiKey),
          body:    JSON.stringify({ body: noteBody }),
        });
        if (!noteRes.ok) {
          console.warn("[contact] GHL add note failed:", await noteRes.text());
        }
      } catch (err) {
        console.error("[contact] GHL note error:", err);
      }
    }
  }

  // ── Always redirect to success — GHL failure must not block UX ───────────
  return Response.redirect(new URL("/contact/success", request.url), 303);
};
