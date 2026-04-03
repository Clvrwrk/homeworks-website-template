// src/pages/api/admin/events.ts
// POST/PUT/DELETE — same pattern as projects.ts but for EventRow

import type { APIRoute } from "astro";
import { createAdminClient } from "@/lib/supabase";
import { validateSession, SESSION_COOKIE } from "@/lib/workos";
import { getEventReadiness } from "@/lib/admin";
import { uniqueSlug } from "@/lib/slugify";
import { ghlNotifyPublish } from "./ghl-notify";

async function requireAuth(cookies: any) {
  const session = cookies.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  return validateSession(session);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await requireAuth(cookies);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  if (body.status === "published" && user.role === "worker") {
    return new Response(JSON.stringify({ error: "Workers cannot publish" }), { status: 403 });
  }
  if (body.status === "published") {
    const r = getEventReadiness(body as any);
    if (!r.canPublish) return new Response(JSON.stringify({ error: "Missing required fields", missing: r.missing }), { status: 422 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const slug = await uniqueSlug(body.title as string, async (s) => {
    const { data } = await supabase.from("events").select("id").eq("slug", s).single();
    return !!data;
  });

  const { data, error } = await supabase.from("events").insert({ ...body, slug, created_by: user.id }).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (body.status === "published" && data) ghlNotifyPublish("event", data).catch(console.error);
  return new Response(JSON.stringify({ slug: data.slug }), { status: 201 });
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const user = await requireAuth(cookies);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await request.json() as Record<string, unknown> & { id: string };
  if (body.status === "published" && user.role === "worker") {
    return new Response(JSON.stringify({ error: "Workers cannot publish" }), { status: 403 });
  }
  if (body.status === "published") {
    const r = getEventReadiness(body as any);
    if (!r.canPublish) return new Response(JSON.stringify({ error: "Missing required fields", missing: r.missing }), { status: 422 });
  }

  const { id, ...fields } = body;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const { data, error } = await supabase.from("events").update(fields).eq("id", id).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (body.status === "published" && data) ghlNotifyPublish("event", data).catch(console.error);
  return new Response(JSON.stringify({ slug: (data as any).slug }), { status: 200 });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const user = await requireAuth(cookies);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const { id } = await request.json() as { id: string };
  const { error } = await createAdminClient().from("events").delete().eq("id", id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
