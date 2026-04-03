// src/pages/api/admin/services.ts
// Agency Admin only — POST/PUT/DELETE for services

import type { APIRoute } from "astro";
import { createAdminClient } from "@/lib/supabase";
import { validateSession, SESSION_COOKIE } from "@/lib/workos";
import { uniqueSlug } from "@/lib/slugify";

async function requireAgencyAdmin(cookies: any) {
  const session = cookies.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  const user = await validateSession(session);
  if (!user || user.role !== "agency_admin") return null;
  return user;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await requireAgencyAdmin(cookies);
  if (!user) return new Response(JSON.stringify({ error: "Agency Admin access required" }), { status: 403 });

  const body = await request.json() as Record<string, unknown>;
  if (!body.name) return new Response(JSON.stringify({ error: "Name is required" }), { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const slug = await uniqueSlug(body.name as string, async (s) => {
    const { data } = await supabase.from("services").select("id").eq("slug", s).single();
    return !!data;
  });

  const { data, error } = await supabase.from("services").insert({ ...body, slug }).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ slug: (data as any).slug }), { status: 201 });
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const user = await requireAgencyAdmin(cookies);
  if (!user) return new Response(JSON.stringify({ error: "Agency Admin access required" }), { status: 403 });

  const body = await request.json() as Record<string, unknown> & { id: string };
  const { id, ...fields } = body;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const { data, error } = await supabase.from("services").update(fields).eq("id", id).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ slug: (data as any).slug }), { status: 200 });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const user = await requireAgencyAdmin(cookies);
  if (!user) return new Response(JSON.stringify({ error: "Agency Admin access required" }), { status: 403 });

  const { id } = await request.json() as { id: string };
  const { error } = await createAdminClient().from("services").delete().eq("id", id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
