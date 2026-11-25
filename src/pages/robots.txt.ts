import type { APIRoute } from "astro";
export const prerender = false;
export const GET: APIRoute = ({ site }) => {
  const preview = (process.env.HWA_ENV ?? "") === "preview";
  const body = preview
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\n\nSitemap: ${new URL("/sitemap-index.xml", site).href}\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
