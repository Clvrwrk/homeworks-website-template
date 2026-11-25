/** Preview-only smoke sink for the HWA view beacon. Real jobs post to the n8n view webhook. */
import type { APIRoute } from "astro";
export const POST: APIRoute = async ({ request }) => {
  if ((process.env.HWA_ENV ?? "") !== "preview") return new Response(null, { status: 404 });
  const body = await request.text();
  console.log("[hwa-view]", request.headers.get("user-agent") ?? "", body.slice(0, 500));
  return new Response(null, { status: 204 });
};
