// src/pages/api/admin/oembed.ts
// GET /api/admin/oembed?url=<encoded_youtube_url>
// Fetches YouTube oEmbed to get the video thumbnail URL.
// Returns: { thumbnail_url: string, title: string }

import type { APIRoute } from "astro";
import { validateSession, SESSION_COOKIE } from "@/lib/workos";

export const GET: APIRoute = async ({ url, cookies }) => {
  const session = cookies.get(SESSION_COOKIE)?.value;
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const user = await validateSession(session);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const videoUrl = url.searchParams.get("url");
  if (!videoUrl) return new Response(JSON.stringify({ error: "Missing url" }), { status: 400 });

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`YouTube oEmbed returned ${res.status}`);
    const data = await res.json() as { thumbnail_url?: string; title?: string };
    return new Response(
      JSON.stringify({
        thumbnail_url: data.thumbnail_url ?? "",
        title:         data.title ?? "",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 502 });
  }
};
