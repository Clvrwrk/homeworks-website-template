// src/pages/api/admin/upload.ts
// POST /api/admin/upload
// Body: multipart/form-data with fields: file (File), bucket (string), path (string)
// Returns: { url: string } or { error: string }

import type { APIRoute } from "astro";
import { createAdminClient } from "@/lib/supabase";
import { validateSession, SESSION_COOKIE } from "@/lib/workos";

export const POST: APIRoute = async ({ request, cookies }) => {
  // Auth check
  const session = cookies.get(SESSION_COOKIE)?.value;
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const user = await validateSession(session);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const formData = await request.formData();
  const file   = formData.get("file") as File | null;
  const bucket = (formData.get("bucket") as string) || "project-photos";
  const path   = formData.get("path") as string | null;

  if (!file || !(file instanceof File)) {
    return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return new Response(JSON.stringify({ error: `File type not allowed: ${file.type}` }), { status: 400 });
  }

  // Max 10 MB
  if (file.size > 10 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: "File too large (max 10 MB)" }), { status: 400 });
  }

  const ext        = file.name.split(".").pop() ?? "bin";
  const uploadPath = path ? `${path}.${ext}` : `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase  = createAdminClient();
  const arrayBuf  = await file.arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(uploadPath, arrayBuf, {
    contentType: file.type,
    upsert:      true,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string;
  const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${uploadPath}`;

  return new Response(JSON.stringify({ url }), {
    status:  200,
    headers: { "Content-Type": "application/json" },
  });
};
