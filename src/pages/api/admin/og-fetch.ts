// src/pages/api/admin/og-fetch.ts
// GET /api/admin/og-fetch?url=<encoded_url>
// Fetches a URL server-side and parses OG meta tags.
// Returns: { headline, publication, image_url, summary, published_date }

import type { APIRoute } from "astro";
import { validateSession, SESSION_COOKIE } from "@/lib/workos";

function extractMeta(html: string, property: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim();
  }
  return "";
}

function extractTitle(html: string): string {
  const og = extractMeta(html, "title");
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() ?? "";
}

function extractPublishedDate(html: string): string {
  const patterns = [
    /property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
    /name=["']pubdate["'][^>]+content=["']([^"']+)["']/i,
    /itemprop=["']datePublished["'][^>]+content=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const d = new Date(m[1]);
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    }
  }
  return "";
}

export const GET: APIRoute = async ({ request, url, cookies }) => {
  // Auth check
  const session = cookies.get(SESSION_COOKIE)?.value;
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const user = await validateSession(session);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const targetUrl = url.searchParams.get("url");
  if (!targetUrl) return new Response(JSON.stringify({ error: "Missing url param" }), { status: 400 });

  let parsed: URL;
  try { parsed = new URL(targetUrl); } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), { status: 400 });
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return new Response(JSON.stringify({ error: "Protocol not allowed" }), { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HomeworksBot/1.0; +https://homeworksdfw.com)" },
      signal:  AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const hostname = parsed.hostname.replace(/^www\./, "");
    const publication = hostname.split(".")[0];

    return new Response(
      JSON.stringify({
        headline:       extractTitle(html),
        publication:    publication.charAt(0).toUpperCase() + publication.slice(1),
        image_url:      extractMeta(html, "image") || "",
        summary:        extractMeta(html, "description") || "",
        published_date: extractPublishedDate(html),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
};
