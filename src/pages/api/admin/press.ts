// src/pages/api/admin/press.ts
// POST/PUT/DELETE for press_mentions + media_items
// Route determined by `type` field in body: "mention" | "media"

import type { APIRoute } from "astro";
import { createAdminClient } from "@/lib/supabase";
import { validateSession, SESSION_COOKIE } from "@/lib/workos";
import { getPressMentionReadiness } from "@/lib/admin";
import { ghlNotifyPublish } from "./ghl-notify";

async function requireAuth(cookies: any) {
  const session = cookies.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  return validateSession(session);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await requireAuth(cookies);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await request.json() as Record<string, unknown> & { recordType: "mention" | "media" };
  const { recordType, ...fields } = body;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  if (recordType === "mention") {
    // Validate summary word count
    const r = getPressMentionReadiness(fields as any);
    if (!r.canPublish) return new Response(JSON.stringify({ error: "Invalid", missing: r.missing }), { status: 422 });

    const { data, error } = await supabase.from("press_mentions").insert(fields).select().single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    ghlNotifyPublish("press_mention", data as Record<string, unknown>).catch(console.error);
    return new Response(JSON.stringify({ id: (data as any).id }), { status: 201 });
  }

  if (recordType === "media") {
    const { data, error } = await supabase.from("media_items").insert(fields).select().single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    ghlNotifyPublish("media_item", data as Record<string, unknown>).catch(console.error);
    return new Response(JSON.stringify({ id: (data as any).id }), { status: 201 });
  }

  return new Response(JSON.stringify({ error: "Unknown recordType" }), { status: 400 });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const user = await requireAuth(cookies);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { id, recordType } = await request.json() as { id: string; recordType: "mention" | "media" };
  const table = recordType === "mention" ? "press_mentions" : "media_items";
  const { error } = await createAdminClient().from(table).delete().eq("id", id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
