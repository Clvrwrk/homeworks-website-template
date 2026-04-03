// src/pages/api/admin/projects.ts
// POST /api/admin/projects — create
// PUT /api/admin/projects — update (id in body)
// DELETE /api/admin/projects — delete (id in body)
// Publish gate: status='published' only if all required fields pass.

import type { APIRoute } from "astro";
import { createAdminClient } from "@/lib/supabase";
import { validateSession, SESSION_COOKIE } from "@/lib/workos";
import { getProjectReadiness } from "@/lib/admin";
import { uniqueSlug } from "@/lib/slugify";
import type { ProjectInsert } from "@/types/database";
import { ghlNotifyPublish } from "./ghl-notify";

async function requireAuth(cookies: any) {
  const session = cookies.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  return validateSession(session);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await requireAuth(cookies);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await request.json() as ProjectInsert & { status?: string };
  const supabase = createAdminClient();

  // Generate unique slug from title
  const slug = await uniqueSlug(body.title, async (s) => {
    const { data } = await supabase.from("projects").select("id").eq("slug", s).single();
    return !!data;
  });

  // Enforce publish gate
  if (body.status === "published") {
    const readiness = getProjectReadiness(body as any);
    if (!readiness.canPublish) {
      return new Response(
        JSON.stringify({ error: "Cannot publish: missing required fields", missing: readiness.missing }),
        { status: 422 }
      );
    }
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...body,
      slug,
      created_by:   user.id,
      published_at: body.status === "published" ? new Date().toISOString() : undefined,
    })
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  // GHL notification on publish
  if (body.status === "published" && data) {
    ghlNotifyPublish("project", data).catch(console.error);
  }

  return new Response(JSON.stringify({ slug: data.slug }), { status: 201 });
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const user = await requireAuth(cookies);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await request.json() as Partial<ProjectInsert> & { id: string; status?: string };
  const supabase = createAdminClient();

  // Workers cannot publish
  if (body.status === "published" && user.role === "worker") {
    return new Response(JSON.stringify({ error: "Workers cannot publish records" }), { status: 403 });
  }

  if (body.status === "published") {
    const readiness = getProjectReadiness(body as any);
    if (!readiness.canPublish) {
      return new Response(
        JSON.stringify({ error: "Cannot publish: missing required fields", missing: readiness.missing }),
        { status: 422 }
      );
    }
  }

  const updatePayload: Record<string, unknown> = { ...body };
  delete updatePayload.id;
  if (body.status === "published") updatePayload.published_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("projects")
    .update(updatePayload)
    .eq("id", body.id)
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  if (body.status === "published" && data) {
    ghlNotifyPublish("project", data).catch(console.error);
  }

  return new Response(JSON.stringify({ slug: data.slug }), { status: 200 });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const user = await requireAuth(cookies);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { id } = await request.json() as { id: string };
  const supabase = createAdminClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
