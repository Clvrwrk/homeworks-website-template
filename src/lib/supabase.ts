/**
 * Supabase client initialisation — Astro SSR
 *
 * Three client patterns for different contexts:
 *
 *  1. createServerClient()  — Astro pages / API endpoints (anon key, public ops)
 *  2. createAdminClient()   — Server-only privileged ops (service role key, bypasses RLS)
 *  3. getBrowserClient()    — Client-side <script> / framework islands (anon key, singleton)
 *
 * Env vars:
 *   PUBLIC_SUPABASE_URL          — safe to expose to the browser  ✓
 *   PUBLIC_SUPABASE_ANON_KEY     — safe to expose to the browser  ✓
 *   SUPABASE_SERVICE_ROLE_KEY    — NEVER expose to the browser    ✗
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// ─── Environment variable resolution ─────────────────────────────────────────
//
// Astro exposes `import.meta.env` on both server and client for PUBLIC_* vars.
// For server-only secrets, `import.meta.env` only works server-side; we also
// check `process.env` as a fallback for Node environments (e.g. `astro build`).

function getEnvVar(key: string, required = true): string {
  const value =
    // @ts-ignore — import.meta.env is typed by Astro but may not know custom keys
    (import.meta.env?.[key] as string | undefined) ??
    (typeof process !== "undefined" ? process.env[key] : undefined);

  if (required && !value) {
    throw new Error(
      `[Supabase] Missing required environment variable: "${key}". ` +
        `Add it to your .env file. See .env.example for all required variables.`,
    );
  }

  return value ?? "";
}

// ─── 1. Server client (anon key) ─────────────────────────────────────────────

/**
 * Creates a new Supabase client scoped to a single server request.
 *
 * Use this inside Astro `.astro` frontmatter or `src/pages/api/*.ts` endpoints.
 * Creates a fresh instance per call — intentional for SSR (no shared state
 * between requests).
 *
 * Respects Row Level Security (RLS) — operates as an anonymous/authenticated
 * user depending on the session token you attach via `setSession`.
 *
 * @example
 * ```ts
 * // src/pages/services.astro
 * ---
 * import { createServerClient } from "@/lib/supabase";
 * const supabase = createServerClient();
 * const { data, error } = await supabase.from("services").select("*");
 * ---
 * ```
 */
export function createServerClient(): SupabaseClient<Database> {
  const url     = getEnvVar("PUBLIC_SUPABASE_URL");
  const anonKey = getEnvVar("PUBLIC_SUPABASE_ANON_KEY");

  return createClient<Database>(url, anonKey, {
    auth: {
      // Disable auto-refresh and storage in SSR — no persistent session on server
      autoRefreshToken:    false,
      persistSession:      false,
      detectSessionInUrl:  false,
    },
  });
}

// ─── 2. Admin client (service role key) ──────────────────────────────────────

/**
 * Creates a privileged Supabase client that bypasses Row Level Security (RLS).
 *
 * ⚠️  SERVER-ONLY. Never import or call this from client-side code or Astro
 *     components that ship JavaScript to the browser. The service role key
 *     grants full database access.
 *
 * Use for:
 *   - Background jobs / cron endpoints
 *   - Admin-only API routes
 *   - Seeding / migrations at build time
 *   - Reading data that RLS would otherwise block for anonymous users
 *
 * @example
 * ```ts
 * // src/pages/api/admin/sync.ts
 * import { createAdminClient } from "@/lib/supabase";
 *
 * export const GET = async () => {
 *   const supabase = createAdminClient();
 *   const { data } = await supabase.from("locations").select("*");
 *   return new Response(JSON.stringify(data));
 * };
 * ```
 */
export function createAdminClient(): SupabaseClient<Database> {
  const url            = getEnvVar("PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken:    false,
      persistSession:      false,
      detectSessionInUrl:  false,
    },
    global: {
      headers: {
        // Explicitly tag requests from the admin client for logging/debugging
        "x-supabase-client": "admin",
      },
    },
  });
}

// ─── 3. Browser singleton (anon key) ─────────────────────────────────────────

/**
 * Returns a singleton Supabase client for use in client-side JavaScript.
 *
 * Safe to call in:
 *   - Astro `<script>` tags
 *   - React / Vue / Svelte islands that run in the browser
 *
 * Returns the same instance across calls — do not create per-component.
 *
 * @example
 * ```ts
 * // src/components/ContactForm.tsx  (React island)
 * import { getBrowserClient } from "@/lib/supabase";
 *
 * export function ContactForm() {
 *   const supabase = getBrowserClient();
 *   // ...
 * }
 * ```
 */
let _browserClient: SupabaseClient<Database> | null = null;

export function getBrowserClient(): SupabaseClient<Database> {
  if (_browserClient) return _browserClient;

  const url     = getEnvVar("PUBLIC_SUPABASE_URL");
  const anonKey = getEnvVar("PUBLIC_SUPABASE_ANON_KEY");

  _browserClient = createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken:   true,
      persistSession:     true,
      detectSessionInUrl: true,
    },
  });

  return _browserClient;
}

// ─── Convenience re-export ────────────────────────────────────────────────────

/**
 * Type helper: extract the Row type for a given table name.
 *
 * Once you have generated types from the Supabase CLI, replace the `Database`
 * type above and this helper will give you per-table row types automatically.
 *
 * @example
 * ```ts
 * type ProjectRow = TableRow<"projects">;
 * ```
 */
export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
