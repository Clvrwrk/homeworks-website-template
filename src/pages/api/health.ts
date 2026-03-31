/**
 * GET /api/health
 *
 * Lightweight health-check endpoint for Coolify's uptime monitoring.
 * Returns 200 + JSON so Coolify knows the container is alive.
 */
import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({
      status:    "ok",
      timestamp: new Date().toISOString(),
      service:   "mckinney-fixit-pros",
    }),
    {
      status:  200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
