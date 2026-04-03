# Admin Interface + Services/Locations Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WorkOS-authenticated admin interface at `/admin` for CRUD of all content types (projects, events, press mentions, media items). Agency Admins additionally manage Services and Locations (with SEO document uploads). Publish transitions fire GHL Custom Object upserts.

**Architecture:** WorkOS AuthKit handles auth via a cookie-based session stored server-side. Astro middleware protects all `/admin/*` routes. Forms submit to Astro API endpoints (`src/pages/api/admin/*.ts`) that use `createAdminClient()` (service role, bypasses RLS). A vanilla-JS readiness progress bar tracks required field completeness client-side. Services and Locations move from hardcoded `site.ts` arrays to Supabase tables; their public-facing pages become SSR queries.

**Tech Stack:** `@workos-inc/node` for auth, Astro 5 SSR, Supabase (service role), Tailwind CSS 4, vanilla JS for interactive elements.

**Prerequisite:** Plan 1 must be complete (migration 002 applied, all tables exist, TypeScript types defined).

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/lib/workos.ts` | WorkOS client singleton + session helpers |
| Create | `src/lib/admin.ts` | Publish validation, readiness score, required fields |
| Create | `src/lib/__tests__/admin.test.ts` | Unit tests for admin helpers |
| Create | `src/middleware.ts` | Protect /admin/* routes, attach user to locals |
| Create | `src/pages/auth/login.astro` | Redirect to WorkOS login URL |
| Create | `src/pages/auth/callback.astro` | Exchange code for session, set cookie |
| Create | `src/pages/auth/logout.astro` | Clear session cookie, redirect to home |
| Create | `src/layouts/AdminLayout.astro` | Admin shell: sidebar nav + content area |
| Create | `src/pages/admin/index.astro` | Redirect to /admin/projects |
| Create | `src/pages/admin/projects/index.astro` | Project list (draft/published tabs) |
| Create | `src/pages/admin/projects/new.astro` | New project form |
| Create | `src/pages/admin/projects/[slug].astro` | Edit project form |
| Create | `src/pages/admin/events/index.astro` | Event list |
| Create | `src/pages/admin/events/new.astro` | New event form |
| Create | `src/pages/admin/events/[slug].astro` | Edit event form |
| Create | `src/pages/admin/press/index.astro` | Press mentions + media items list |
| Create | `src/pages/admin/press/mentions/new.astro` | URL intake → OG prefill form |
| Create | `src/pages/admin/press/media/new.astro` | YouTube/podcast add form |
| Create | `src/pages/admin/services/index.astro` | Services list (Agency Admin only) |
| Create | `src/pages/admin/services/new.astro` | New service form |
| Create | `src/pages/admin/services/[slug].astro` | Edit service form |
| Create | `src/pages/admin/locations/index.astro` | Locations list (Agency Admin only) |
| Create | `src/pages/admin/locations/new.astro` | New location form |
| Create | `src/pages/admin/locations/[slug].astro` | Edit location form |
| Create | `src/pages/admin/users/index.astro` | User list (Agency Admin only) |
| Create | `src/pages/admin/users/invite.astro` | Invite user with role assignment |
| Create | `src/pages/admin/profile.astro` | Tasks to Complete + published records |
| Create | `src/pages/api/admin/upload.ts` | Upload file to Supabase storage, return URL |
| Create | `src/pages/api/admin/og-fetch.ts` | Server-side OG scrape |
| Create | `src/pages/api/admin/oembed.ts` | YouTube oEmbed thumbnail fetch |
| Create | `src/pages/api/admin/projects.ts` | Create/update/delete project, publish gate |
| Create | `src/pages/api/admin/events.ts` | Create/update/delete event |
| Create | `src/pages/api/admin/press.ts` | Create/update/delete press mention |
| Create | `src/pages/api/admin/media.ts` | Create/update/delete media item |
| Create | `src/pages/api/admin/services.ts` | Create/update/delete service (Agency Admin) |
| Create | `src/pages/api/admin/locations.ts` | Create/update/delete location (Agency Admin) |
| Create | `src/pages/api/webhooks/ghl-notify.ts` | GHL Custom Object upsert on publish |
| Create | `supabase/migrations/003_services_locations.sql` | Services + locations tables |
| Modify | `src/pages/services/[slug].astro` | Query Supabase instead of SERVICES_CONTENT map |
| Modify | `src/pages/locations/[slug].astro` | Query Supabase instead of LOCATIONS_CONTENT map |

---

### Task 1: WorkOS dependencies + env vars

**Files:**
- Create: `src/lib/workos.ts`

- [ ] **Step 1: Install @workos-inc/node**

```bash
npm install @workos-inc/node
```

- [ ] **Step 2: Add env vars to .env.example**

Append to `.env.example`:

```
# WorkOS AuthKit
WORKOS_API_KEY=sk_...               # Server-only — WorkOS secret API key
WORKOS_CLIENT_ID=client_...         # OAuth app client ID (can be public)
WORKOS_COOKIE_PASSWORD=...          # 32+ char random secret for cookie signing
PUBLIC_APP_URL=http://localhost:4321 # Full URL of the app (used to build callback URL)
```

- [ ] **Step 3: Create src/lib/workos.ts**

```ts
// src/lib/workos.ts
// WorkOS AuthKit — session management for admin interface.
// All functions are server-only. Never import this in client-side code.

import WorkOS, { type User } from "@workos-inc/node";

// Role strings stored in WorkOS Organization membership
export type AdminRole = "agency_admin" | "client_admin" | "worker";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: AdminRole;
}

// Singleton WorkOS client
let _workos: WorkOS | null = null;

function getWorkOS(): WorkOS {
  if (!_workos) {
    const apiKey = import.meta.env.WORKOS_API_KEY as string;
    if (!apiKey) throw new Error("[WorkOS] WORKOS_API_KEY is not set");
    _workos = new WorkOS(apiKey);
  }
  return _workos;
}

export function getWorkOSClient(): WorkOS {
  return getWorkOS();
}

/**
 * Build the URL to redirect users to WorkOS AuthKit login.
 */
export function getAuthorizationUrl(): string {
  const workos = getWorkOS();
  const clientId     = import.meta.env.WORKOS_CLIENT_ID as string;
  const appUrl       = import.meta.env.PUBLIC_APP_URL as string;
  const redirectUri  = `${appUrl}/auth/callback`;

  return workos.userManagement.getAuthorizationUrl({
    provider: "authkit",
    clientId,
    redirectUri,
  });
}

/**
 * Exchange the OAuth code for a WorkOS session.
 * Returns the sealed session string to store in a cookie.
 */
export async function authenticateWithCode(code: string): Promise<{
  user: User;
  accessToken: string;
  refreshToken: string;
  sealedSession: string;
}> {
  const workos      = getWorkOS();
  const clientId    = import.meta.env.WORKOS_CLIENT_ID as string;
  const cookiePass  = import.meta.env.WORKOS_COOKIE_PASSWORD as string;
  const appUrl      = import.meta.env.PUBLIC_APP_URL as string;
  const redirectUri = `${appUrl}/auth/callback`;

  const result = await workos.userManagement.authenticateWithCode({
    code,
    clientId,
    session: {
      sealSession: true,
      cookiePassword: cookiePass,
    },
  });

  return {
    user:         result.user,
    accessToken:  result.accessToken,
    refreshToken: result.refreshToken ?? "",
    sealedSession: (result as any).sealedSession ?? result.accessToken,
  };
}

/**
 * Validate a sealed session from the cookie.
 * Returns null if invalid or expired.
 */
export async function validateSession(sealedSession: string): Promise<AdminUser | null> {
  try {
    const workos     = getWorkOS();
    const cookiePass = import.meta.env.WORKOS_COOKIE_PASSWORD as string;

    const { user, organizationId } = await workos.userManagement.authenticateWithSessionCookie({
      sessionData: sealedSession,
      cookiePassword: cookiePass,
    });

    // Fetch organization membership to get role
    let role: AdminRole = "worker";
    if (organizationId) {
      try {
        const memberships = await workos.userManagement.listOrganizationMemberships({
          userId: user.id,
          organizationId,
          limit: 1,
        });
        const membership = memberships.data[0];
        if (membership?.role?.slug) {
          const r = membership.role.slug.toLowerCase();
          if (r === "agency_admin" || r === "client_admin" || r === "worker") {
            role = r as AdminRole;
          }
        }
      } catch { /* role defaults to worker if membership fetch fails */ }
    }

    return {
      id:        user.id,
      email:     user.email,
      firstName: user.firstName ?? null,
      lastName:  user.lastName  ?? null,
      role,
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "hw_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
```

- [ ] **Step 4: Extend Astro locals type**

Create `src/env.d.ts` (or append if it exists):

```ts
// src/env.d.ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { AdminUser } from "@/lib/workos";

declare namespace App {
  interface Locals {
    user: AdminUser | null;
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/workos.ts src/env.d.ts .env.example package.json package-lock.json
git commit -m "feat: add WorkOS client and session helpers"
```

---

### Task 2: Admin helper functions + tests

**Files:**
- Create: `src/lib/admin.ts`
- Create: `src/lib/__tests__/admin.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/admin.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  getProjectReadiness,
  getEventReadiness,
  getPressMentionReadiness,
  wordCount,
  type ReadinessResult,
} from "../admin";

describe("wordCount", () => {
  it("counts words in a string", () => {
    expect(wordCount("hello world")).toBe(2);
  });

  it("handles extra whitespace", () => {
    expect(wordCount("  hello   world  ")).toBe(2);
  });

  it("returns 0 for empty string", () => {
    expect(wordCount("")).toBe(0);
  });
});

describe("getProjectReadiness", () => {
  const baseProject = {
    title: "Test Project",
    category: "Drywall",
    neighborhood: "Test Area",
    location: "City, TX 75001",
    community: "Test Community",
    duration: "1 day",
    scope: "Repair work",
    summary: "A brief summary",
    before_label: "Before state",
    after_label: "After state",
    before_photo_url: "/photo/before.jpg",
    after_photo_url: "/photo/after.jpg",
    overview: "Overview text",
    challenge: "Challenge text",
    result: "Result text",
    scope_items: ["Item 1", "Item 2"],
  };

  it("returns 100% for a complete project", () => {
    const r = getProjectReadiness(baseProject);
    expect(r.percent).toBe(100);
    expect(r.missing).toHaveLength(0);
    expect(r.canPublish).toBe(true);
  });

  it("flags missing title", () => {
    const r = getProjectReadiness({ ...baseProject, title: "" });
    expect(r.canPublish).toBe(false);
    expect(r.missing).toContain("Title");
  });

  it("flags empty scope_items", () => {
    const r = getProjectReadiness({ ...baseProject, scope_items: [] });
    expect(r.canPublish).toBe(false);
    expect(r.missing).toContain("Scope Items (at least 1)");
  });

  it("calculates partial completion", () => {
    const r = getProjectReadiness({
      ...baseProject,
      before_photo_url: "",
      after_photo_url: "",
    });
    expect(r.percent).toBeLessThan(100);
    expect(r.filled).toBe(r.total - 2);
  });
});

describe("getPressMentionReadiness", () => {
  it("blocks publish when summary is too short", () => {
    const r = getPressMentionReadiness({
      url: "https://example.com",
      headline: "Test Headline",
      publication: "Test Pub",
      summary: "Too short",
    });
    expect(r.canPublish).toBe(false);
    expect(r.missing).toContain("Summary (20–200 words required)");
  });

  it("allows publish when summary has 20–200 words", () => {
    const summary = Array(25).fill("word").join(" ");
    const r = getPressMentionReadiness({
      url: "https://example.com",
      headline: "Test Headline",
      publication: "Test Pub",
      summary,
    });
    expect(r.canPublish).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../admin'`

- [ ] **Step 3: Implement src/lib/admin.ts**

```ts
// src/lib/admin.ts
// Admin UI helpers: publish readiness validation + scoring.

export interface ReadinessResult {
  filled:     number;
  total:      number;
  percent:    number;
  missing:    string[];
  canPublish: boolean;
}

export function wordCount(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

// ── Projects ──────────────────────────────────────────────────────────────────

type ProjectFields = {
  title?: string;
  category?: string;
  neighborhood?: string;
  location?: string;
  community?: string;
  duration?: string;
  scope?: string;
  summary?: string;
  before_label?: string;
  after_label?: string;
  before_photo_url?: string;
  after_photo_url?: string;
  overview?: string;
  challenge?: string;
  result?: string;
  scope_items?: string[];
};

const PROJECT_REQUIRED: Array<[keyof ProjectFields, string, (v: ProjectFields) => boolean]> = [
  ["title",           "Title",                    (v) => !!v.title?.trim()],
  ["category",        "Category",                 (v) => !!v.category?.trim()],
  ["neighborhood",    "Neighborhood",             (v) => !!v.neighborhood?.trim()],
  ["location",        "Location",                 (v) => !!v.location?.trim()],
  ["community",       "Community",                (v) => !!v.community?.trim()],
  ["duration",        "Duration",                 (v) => !!v.duration?.trim()],
  ["scope",           "Scope",                    (v) => !!v.scope?.trim()],
  ["summary",         "Summary",                  (v) => !!v.summary?.trim()],
  ["before_label",    "Before Label",             (v) => !!v.before_label?.trim()],
  ["after_label",     "After Label",              (v) => !!v.after_label?.trim()],
  ["before_photo_url","Before Photo",             (v) => !!v.before_photo_url?.trim()],
  ["after_photo_url", "After Photo",              (v) => !!v.after_photo_url?.trim()],
  ["overview",        "Overview",                 (v) => !!v.overview?.trim()],
  ["challenge",       "Challenge",                (v) => !!v.challenge?.trim()],
  ["result",          "Result",                   (v) => !!v.result?.trim()],
  ["scope_items",     "Scope Items (at least 1)", (v) => (v.scope_items?.length ?? 0) >= 1],
];

export function getProjectReadiness(values: ProjectFields): ReadinessResult {
  const missing: string[] = [];
  let filled = 0;
  for (const [, label, check] of PROJECT_REQUIRED) {
    if (check(values)) { filled++; } else { missing.push(label); }
  }
  const total = PROJECT_REQUIRED.length;
  return {
    filled,
    total,
    percent:    Math.round((filled / total) * 100),
    missing,
    canPublish: missing.length === 0,
  };
}

// ── Events ────────────────────────────────────────────────────────────────────

type EventFields = {
  title?: string;
  event_type?: string;
  event_date?: string;
  location_name?: string;
  address?: string;
  description?: string;
  image_url?: string;
};

const EVENT_REQUIRED: Array<[keyof EventFields, string, (v: EventFields) => boolean]> = [
  ["title",         "Title",         (v) => !!v.title?.trim()],
  ["event_type",    "Event Type",    (v) => !!v.event_type?.trim()],
  ["event_date",    "Event Date",    (v) => !!v.event_date?.trim()],
  ["location_name", "Location Name", (v) => !!v.location_name?.trim()],
  ["address",       "Address",       (v) => !!v.address?.trim()],
  ["description",   "Description",   (v) => !!v.description?.trim()],
  ["image_url",     "Event Photo",   (v) => !!v.image_url?.trim()],
];

export function getEventReadiness(values: EventFields): ReadinessResult {
  const missing: string[] = [];
  let filled = 0;
  for (const [, label, check] of EVENT_REQUIRED) {
    if (check(values)) { filled++; } else { missing.push(label); }
  }
  const total = EVENT_REQUIRED.length;
  return {
    filled,
    total,
    percent:    Math.round((filled / total) * 100),
    missing,
    canPublish: missing.length === 0,
  };
}

// ── Press Mentions ────────────────────────────────────────────────────────────

type PressMentionFields = {
  url?: string;
  headline?: string;
  publication?: string;
  summary?: string;
};

export function getPressMentionReadiness(values: PressMentionFields): ReadinessResult {
  const checks: Array<[string, boolean]> = [
    ["URL",                        !!values.url?.trim()],
    ["Headline",                   !!values.headline?.trim()],
    ["Publication",                !!values.publication?.trim()],
    ["Summary (20–200 words required)", (() => {
      const wc = wordCount(values.summary ?? "");
      return wc >= 20 && wc <= 200;
    })()],
  ];
  const missing = checks.filter(([, ok]) => !ok).map(([label]) => label);
  const filled  = checks.filter(([, ok]) => ok).length;
  const total   = checks.length;
  return {
    filled,
    total,
    percent:    Math.round((filled / total) * 100),
    missing,
    canPublish: missing.length === 0,
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npm test
```

Expected: PASS — all tests in slugify.test.ts and admin.test.ts

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin.ts src/lib/__tests__/admin.test.ts
git commit -m "feat: add admin publish readiness validation helpers with tests"
```

---

### Task 3: Middleware + auth routes

**Files:**
- Create: `src/middleware.ts`
- Create: `src/pages/auth/login.astro`
- Create: `src/pages/auth/callback.astro`
- Create: `src/pages/auth/logout.astro`

- [ ] **Step 1: Create src/middleware.ts**

```ts
// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { validateSession, SESSION_COOKIE } from "@/lib/workos";

export const onRequest = defineMiddleware(async (context, next) => {
  // Only protect /admin/* routes
  if (!context.url.pathname.startsWith("/admin")) {
    context.locals.user = null;
    return next();
  }

  const sessionCookie = context.cookies.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return context.redirect("/auth/login");
  }

  const user = await validateSession(sessionCookie.value);

  if (!user) {
    // Invalid/expired session — clear cookie and redirect
    context.cookies.delete(SESSION_COOKIE, { path: "/" });
    return context.redirect("/auth/login");
  }

  context.locals.user = user;
  return next();
});
```

- [ ] **Step 2: Create src/pages/auth/login.astro**

```astro
---
// src/pages/auth/login.astro
// Immediately redirects to WorkOS AuthKit login URL.
import { getAuthorizationUrl } from "@/lib/workos";
return Astro.redirect(getAuthorizationUrl());
---
```

- [ ] **Step 3: Create src/pages/auth/callback.astro**

```astro
---
// src/pages/auth/callback.astro
// Exchanges the OAuth code for a session and sets a cookie.
import { authenticateWithCode, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/workos";

const code = Astro.url.searchParams.get("code");
if (!code) return Astro.redirect("/auth/login?error=missing_code");

let sealedSession: string;
try {
  const result = await authenticateWithCode(code);
  sealedSession = result.sealedSession;
} catch (err) {
  console.error("[auth/callback] Authentication failed:", err);
  return Astro.redirect("/auth/login?error=auth_failed");
}

Astro.cookies.set(SESSION_COOKIE, sealedSession, {
  path:     "/",
  httpOnly: true,
  secure:   import.meta.env.PROD,
  sameSite: "lax",
  maxAge:   SESSION_MAX_AGE_SECONDS,
});

return Astro.redirect("/admin");
---
```

- [ ] **Step 4: Create src/pages/auth/logout.astro**

```astro
---
// src/pages/auth/logout.astro
import { SESSION_COOKIE } from "@/lib/workos";
Astro.cookies.delete(SESSION_COOKIE, { path: "/" });
return Astro.redirect("/");
---
```

- [ ] **Step 5: Add WORKOS vars to .env (dev only)**

In your local `.env`, set:
```
WORKOS_API_KEY=sk_...          # From WorkOS dashboard → API Keys
WORKOS_CLIENT_ID=client_...    # From WorkOS dashboard → Applications
WORKOS_COOKIE_PASSWORD=<32-char-random-string>
PUBLIC_APP_URL=http://localhost:4321
```

In WorkOS dashboard → Applications → set Redirect URI: `http://localhost:4321/auth/callback`

- [ ] **Step 6: Verify middleware protects /admin**

```bash
npm run dev
```

Open `http://localhost:4321/admin` — should redirect to WorkOS login page (or show WorkOS UI).

- [ ] **Step 7: Commit**

```bash
git add src/middleware.ts src/pages/auth/login.astro src/pages/auth/callback.astro src/pages/auth/logout.astro
git commit -m "feat: add WorkOS middleware and auth routes (login/callback/logout)"
```

---

### Task 4: Admin Layout + Nav

**Files:**
- Create: `src/layouts/AdminLayout.astro`

- [ ] **Step 1: Create src/layouts/AdminLayout.astro**

```astro
---
// src/layouts/AdminLayout.astro
// Shared shell for all /admin/* pages.
// Assumes middleware has already validated auth (locals.user is set).

import { BUSINESS_NAME } from "@/config/site";

interface Props {
  title: string;
  activeSection?: "projects" | "events" | "press" | "services" | "locations" | "users" | "profile";
}

const { title, activeSection } = Astro.props;
const user = Astro.locals.user!;
const isAgencyAdmin = user.role === "agency_admin";

const navItems = [
  { href: "/admin/projects", label: "Projects",  section: "projects"  as const },
  { href: "/admin/events",   label: "Events",    section: "events"    as const },
  { href: "/admin/press",    label: "Press",     section: "press"     as const },
  ...(isAgencyAdmin ? [
    { href: "/admin/services",  label: "Services",  section: "services"  as const },
    { href: "/admin/locations", label: "Locations", section: "locations" as const },
    { href: "/admin/users",     label: "Users",     section: "users"     as const },
  ] : []),
  { href: "/admin/profile",  label: "Profile",   section: "profile"   as const },
];
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} — {BUSINESS_NAME} Admin</title>
  <meta name="robots" content="noindex, nofollow" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', system-ui, sans-serif; background: #f0f2f4; color: #151d25; min-height: 100vh; }
    .admin-shell { display: flex; min-height: 100vh; }
    .admin-sidebar { width: 220px; background: #151d25; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; height: 100vh; z-index: 50; overflow-y: auto; }
    .admin-main { flex: 1; margin-left: 220px; min-height: 100vh; display: flex; flex-direction: column; }
    @media (max-width: 768px) {
      .admin-sidebar { display: none; }
      .admin-main { margin-left: 0; }
    }
  </style>
</head>
<body>
  <div class="admin-shell">
    <!-- Sidebar nav -->
    <aside class="admin-sidebar">
      <div class="px-5 py-6 border-b border-white/10">
        <a href="/admin" class="block">
          <img src="/logo-horizontal-light.webp" alt={`${BUSINESS_NAME} admin`} class="h-8 w-auto" />
        </a>
      </div>

      <nav class="flex-1 px-3 py-4">
        <p class="text-white/30 text-[10px] font-black uppercase tracking-widest px-3 mb-3">Content</p>
        <ul class="flex flex-col gap-1 mb-6">
          {navItems.slice(0, 3).map(({ href, label, section }) => (
            <li>
              <a
                href={href}
                class={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  activeSection === section
                    ? "bg-[#b05d45] text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {isAgencyAdmin && (
          <>
            <p class="text-white/30 text-[10px] font-black uppercase tracking-widest px-3 mb-3">Agency Admin</p>
            <ul class="flex flex-col gap-1 mb-6">
              {navItems.slice(3, 6).map(({ href, label, section }) => (
                <li>
                  <a
                    href={href}
                    class={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                      activeSection === section
                        ? "bg-[#b05d45] text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <!-- User + logout -->
      <div class="px-3 py-4 border-t border-white/10">
        <a href="/admin/profile" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors mb-1">
          <div class="w-8 h-8 rounded-full bg-[#b05d45] flex items-center justify-center text-white text-[12px] font-black shrink-0">
            {(user.firstName?.[0] ?? user.email[0]).toUpperCase()}
          </div>
          <div class="min-w-0">
            <p class="text-white text-[12px] font-semibold truncate">{user.firstName ?? user.email.split("@")[0]}</p>
            <p class="text-white/40 text-[11px] truncate">{user.role.replace("_", " ")}</p>
          </div>
        </a>
        <a href="/auth/logout" class="flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-[12px] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Log Out
        </a>
      </div>
    </aside>

    <!-- Main content -->
    <main class="admin-main">
      <!-- Amber disclaimer banner -->
      <div class="bg-amber-50 border-b border-amber-200 px-6 py-3 text-amber-800 text-[13px]">
        <strong>Note:</strong> All fields marked <strong>*</strong> must be complete before a record can be published. You can save and return at any time — incomplete records never appear on the live site.
      </div>

      <!-- Page content -->
      <div class="flex-1 p-6 lg:p-8 max-w-[1200px]">
        <slot />
      </div>
    </main>
  </div>
</body>
</html>
```

- [ ] **Step 2: Create src/pages/admin/index.astro**

```astro
---
// src/pages/admin/index.astro
return Astro.redirect("/admin/projects");
---
```

- [ ] **Step 3: Verify admin index redirects**

```bash
npm run dev
```

After logging in, open `http://localhost:4321/admin` — should redirect to `/admin/projects`.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/AdminLayout.astro src/pages/admin/index.astro
git commit -m "feat: add admin layout with dark sidebar nav and disclaimer banner"
```

---

### Task 5: File upload API endpoint

**Files:**
- Create: `src/pages/api/admin/upload.ts`

Used by all admin forms that need image/document upload. Returns the public Supabase storage URL.

- [ ] **Step 1: Create the upload endpoint**

```ts
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
```

- [ ] **Step 2: Create the project-photos Supabase storage bucket**

In Supabase dashboard → Storage → New bucket:
- Name: `project-photos`
- Public: ✓ (images must be publicly accessible for the public-facing site)

Also create `seo-documents` bucket:
- Name: `seo-documents`
- Public: ✓

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/admin/upload.ts
git commit -m "feat: add file upload API endpoint for Supabase storage"
```

---

### Task 6: OG fetch + oEmbed API endpoints

**Files:**
- Create: `src/pages/api/admin/og-fetch.ts`
- Create: `src/pages/api/admin/oembed.ts`

- [ ] **Step 1: Create OG fetch endpoint**

```ts
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
```

- [ ] **Step 2: Create oEmbed endpoint**

```ts
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
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/admin/og-fetch.ts src/pages/api/admin/oembed.ts
git commit -m "feat: add server-side OG fetch and YouTube oEmbed API endpoints"
```

---

### Task 7: Project CRUD API + list page

**Files:**
- Create: `src/pages/api/admin/projects.ts`
- Create: `src/pages/admin/projects/index.astro`

- [ ] **Step 1: Create projects API endpoint**

```ts
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
```

- [ ] **Step 2: Create GHL notify helper**

```ts
// src/pages/api/admin/ghl-notify.ts
// Fire-and-forget GHL Custom Object upsert on publish.
// Called by all publish actions. Silently fails if GHL is unavailable.

export async function ghlNotifyPublish(type: "project" | "event" | "press_mention" | "media_item", record: Record<string, unknown>): Promise<void> {
  const apiKey     = import.meta.env.GHL_API_KEY as string;
  const locationId = import.meta.env.GHL_LOCATION_ID as string;
  if (!apiKey || !locationId) return; // Skip if GHL not configured

  const siteUrl = import.meta.env.PUBLIC_APP_URL as string;

  // Build Custom Object payload based on type
  let objectType: string;
  let fields: Record<string, unknown>;

  switch (type) {
    case "project":
      objectType = "project";
      fields = {
        project_title:        record.title,
        project_category:     record.category,
        project_neighborhood: record.neighborhood,
        project_location:     record.location,
        project_url:          `${siteUrl}/projects/${record.slug}`,
        project_before_photo: record.before_photo_url,
        project_after_photo:  record.after_photo_url,
        project_published_date: record.published_at,
        project_status:       "Published",
      };
      break;
    case "event":
      objectType = "event";
      fields = {
        event_title:         record.title,
        event_type:          record.event_type,
        event_date:          record.event_date,
        event_location_name: record.location_name,
        event_address:       record.address,
        event_url:           `${siteUrl}/events/${record.slug}`,
        event_website_url:   record.website_url,
        event_image_url:     record.image_url,
        event_status:        "Published",
      };
      break;
    case "press_mention":
      objectType = "press_mention";
      fields = {
        press_headline:      record.headline,
        press_publication:   record.publication,
        press_url:           record.url,
        press_summary:       record.summary,
        press_image_url:     record.image_url,
        press_published_date: record.published_date,
      };
      break;
    case "media_item":
      objectType = "media_item";
      fields = {
        media_title:        record.title,
        media_type:         record.type,
        media_url:          record.url,
        media_thumbnail_url: record.thumbnail_url,
        media_description:  record.description,
        media_published_date: record.published_date,
        media_sort_order:   record.sort_order,
      };
      break;
  }

  try {
    await fetch(`https://services.leadconnectorhq.com/custom-objects/`, {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Version":        "2021-07-28",
        "Content-Type":   "application/json",
      },
      body: JSON.stringify({
        locationId,
        objectType,
        fields,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error(`[ghl-notify] Failed to notify GHL for ${type}:`, err);
    // Silently fail — GHL sync should not block the admin UI
  }
}
```

- [ ] **Step 3: Create admin/projects/index.astro**

```astro
---
// src/pages/admin/projects/index.astro
import AdminLayout from "@/layouts/AdminLayout.astro";
import { createAdminClient } from "@/lib/supabase";
import type { ProjectRow } from "@/types/database";

const supabase = createAdminClient();

const { data: all } = await supabase
  .from("projects")
  .select("id, slug, title, category, status, updated_at, created_by")
  .order("updated_at", { ascending: false, nullsFirst: false });

const projects = (all ?? []) as Pick<ProjectRow, "id" | "slug" | "title" | "category" | "status" | "updated_at" | "created_by">[];
const drafts    = projects.filter(p => p.status === "draft");
const published = projects.filter(p => p.status === "published");

const tab = (Astro.url.searchParams.get("tab") ?? "published") as "published" | "draft";
const shown = tab === "draft" ? drafts : published;
---

<AdminLayout title="Projects" activeSection="projects">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-[#151d25] text-[28px] font-black tracking-tight">Projects</h1>
      <p class="text-[#567798] text-[14px] mt-1">{published.length} published · {drafts.length} drafts</p>
    </div>
    <a href="/admin/projects/new" class="inline-flex items-center gap-2 bg-[#b05d45] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl hover:bg-[#8d4a37] transition-colors">
      + New Project
    </a>
  </div>

  <!-- Tab switcher -->
  <div class="flex gap-1 p-1 bg-[#e8edf2] rounded-xl mb-6 w-fit">
    {(["published", "draft"] as const).map((t) => (
      <a
        href={`?tab=${t}`}
        class={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-colors ${tab === t ? "bg-white text-[#151d25] shadow-sm" : "text-[#567798] hover:text-[#151d25]"}`}
      >
        {t === "published" ? `Published (${published.length})` : `Drafts (${drafts.length})`}
      </a>
    ))}
  </div>

  <!-- Table -->
  {shown.length === 0 ? (
    <div class="text-center py-16 text-[#567798]">No {tab} projects yet.</div>
  ) : (
    <div class="bg-white rounded-2xl border border-[#cdd8e3] overflow-hidden">
      <table class="w-full text-[13px]">
        <thead class="bg-[#f0f2f4] border-b border-[#cdd8e3]">
          <tr>
            <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px]">Title</th>
            <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px] hidden sm:table-cell">Category</th>
            <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px] hidden lg:table-cell">Updated</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f0f2f4]">
          {shown.map((p) => (
            <tr class="hover:bg-[#f8fafc] transition-colors">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <span class={`w-2 h-2 rounded-full shrink-0 ${p.status === "published" ? "bg-[#22c55e]" : "bg-amber-400"}`}></span>
                  <span class="text-[#151d25] font-semibold">{p.title}</span>
                </div>
              </td>
              <td class="px-5 py-4 text-[#567798] hidden sm:table-cell">{p.category}</td>
              <td class="px-5 py-4 text-[#567798] hidden lg:table-cell">
                {p.updated_at ? new Date(p.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
              </td>
              <td class="px-5 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <a href={`/admin/projects/${p.slug}`} class="text-[#b05d45] font-semibold hover:underline">Edit</a>
                  {p.status === "published" && (
                    <a href={`/projects/${p.slug}`} target="_blank" rel="noopener noreferrer" class="text-[#567798] hover:text-[#151d25]">↗</a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</AdminLayout>
```

- [ ] **Step 4: Verify dev server**

After logging in, open `http://localhost:4321/admin/projects` — table renders with 6 seeded projects in the Published tab.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/admin/projects.ts src/pages/api/admin/ghl-notify.ts src/pages/admin/projects/index.astro
git commit -m "feat: add project CRUD API and admin projects list page"
```

---

### Task 8: Project form (new + edit)

**Files:**
- Create: `src/pages/admin/projects/new.astro`
- Create: `src/pages/admin/projects/[slug].astro`

The new and edit forms share identical structure. New starts empty; edit prefills from the DB record. The readiness bar is driven by vanilla JS.

- [ ] **Step 1: Create src/pages/admin/projects/new.astro**

```astro
---
// src/pages/admin/projects/new.astro
import AdminLayout from "@/layouts/AdminLayout.astro";
import { BUSINESS_NAME } from "@/config/site";

const user = Astro.locals.user!;
const canPublish = user.role !== "worker";
---

<AdminLayout title="New Project" activeSection="projects">
  <div class="mb-6">
    <a href="/admin/projects" class="text-[#567798] text-[13px] hover:text-[#151d25]">← Projects</a>
    <h1 class="text-[#151d25] text-[26px] font-black tracking-tight mt-2">New Project</h1>
  </div>

  <!-- Readiness bar -->
  <div class="bg-white rounded-2xl border border-[#cdd8e3] p-5 mb-6">
    <div class="flex items-center justify-between mb-2">
      <span class="text-[#151d25] text-[13px] font-bold">Publish Readiness</span>
      <span id="readiness-text" class="text-[#567798] text-[13px]">0 / 16 fields complete</span>
    </div>
    <div class="h-2 bg-[#e8edf2] rounded-full overflow-hidden">
      <div id="readiness-bar" class="h-full bg-[#ef4444] rounded-full transition-all duration-300" style="width: 0%"></div>
    </div>
    <p id="readiness-missing" class="text-[#567798] text-[12px] mt-2"></p>
  </div>

  <form id="project-form" class="flex flex-col gap-8">
    <!-- Section 1: Basics -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">1. Basics</h2>
      <div class="grid sm:grid-cols-2 gap-5">
        <div class="sm:col-span-2">
          <label class="admin-label" for="title">Title *</label>
          <input id="title" name="title" type="text" required class="admin-input" placeholder="Stonebridge Ranch Drywall Restoration" />
        </div>
        <div>
          <label class="admin-label" for="category">Category *</label>
          <select id="category" name="category" required class="admin-input">
            <option value="">Select category…</option>
            {["Drywall", "Painting", "Plumbing", "Electrical", "Carpentry", "Outdoor"].map(c => (
              <option value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label class="admin-label" for="neighborhood">Neighborhood *</label>
          <input id="neighborhood" name="neighborhood" type="text" required class="admin-input" placeholder="Stonebridge Ranch" />
        </div>
        <div>
          <label class="admin-label" for="location">Location *</label>
          <input id="location" name="location" type="text" required class="admin-input" placeholder="McKinney, TX 75069" />
        </div>
        <div>
          <label class="admin-label" for="community">Community *</label>
          <input id="community" name="community" type="text" required class="admin-input" placeholder="Stonebridge Ranch" />
        </div>
        <div>
          <label class="admin-label" for="duration">Duration *</label>
          <input id="duration" name="duration" type="text" required class="admin-input" placeholder="1 day" />
        </div>
        <div>
          <label class="admin-label" for="scope">Scope *</label>
          <input id="scope" name="scope" type="text" required class="admin-input" placeholder="Water-damaged drywall repair, texture match" />
        </div>
        <div class="sm:col-span-2">
          <label class="admin-label" for="summary">Summary * <span class="text-[#567798] font-normal">(card blurb)</span></label>
          <textarea id="summary" name="summary" required rows="3" class="admin-input" placeholder="Brief card description visible in project grid"></textarea>
        </div>
      </div>
    </section>

    <!-- Section 2: Photos -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">2. Photos</h2>
      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="admin-label" for="before_photo_file">Before Photo *</label>
          <input id="before_photo_file" name="before_photo_file" type="file" accept="image/*" class="admin-input" />
          <input id="before_photo_url" name="before_photo_url" type="hidden" value="" />
          <p id="before_photo_preview" class="text-[12px] text-[#567798] mt-1"></p>
        </div>
        <div>
          <label class="admin-label" for="after_photo_file">After Photo *</label>
          <input id="after_photo_file" name="after_photo_file" type="file" accept="image/*" class="admin-input" />
          <input id="after_photo_url" name="after_photo_url" type="hidden" value="" />
          <p id="after_photo_preview" class="text-[12px] text-[#567798] mt-1"></p>
        </div>
        <div>
          <label class="admin-label" for="before_label">Before Label *</label>
          <input id="before_label" name="before_label" type="text" required class="admin-input" placeholder="Water damage, sagging drywall" />
        </div>
        <div>
          <label class="admin-label" for="after_label">After Label *</label>
          <input id="after_label" name="after_label" type="text" required class="admin-input" placeholder="Seamless repair, ready to paint" />
        </div>
      </div>
    </section>

    <!-- Section 3: Narrative -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">3. Narrative</h2>
      <div class="flex flex-col gap-5">
        <div>
          <label class="admin-label" for="overview">Overview * <span class="text-[#567798] font-normal">(what happened and what we did)</span></label>
          <textarea id="overview" name="overview" required rows="5" class="admin-input" placeholder="Describe the project in detail…"></textarea>
        </div>
        <div>
          <label class="admin-label" for="challenge">Challenge * <span class="text-[#567798] font-normal">(what made this tricky)</span></label>
          <textarea id="challenge" name="challenge" required rows="3" class="admin-input" placeholder="The non-standard texture required…"></textarea>
        </div>
        <div>
          <label class="admin-label" for="result">Result * <span class="text-[#567798] font-normal">(the outcome)</span></label>
          <textarea id="result" name="result" required rows="3" class="admin-input" placeholder="The repaired area is completely invisible…"></textarea>
        </div>
      </div>
    </section>

    <!-- Section 4: Scope Items -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">4. Scope Items *</h2>
      <div id="scope-items-list" class="flex flex-col gap-3 mb-4"></div>
      <button type="button" id="add-scope-item" class="text-[#b05d45] text-[13px] font-semibold hover:underline">
        + Add scope item
      </button>
    </section>

    <!-- Section 5: SEO Preview -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">5. SEO Preview</h2>
      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="admin-label" for="slug-preview">Slug <span class="text-[#567798] font-normal">(auto-generated, editable)</span></label>
          <input id="slug-preview" name="slug_override" type="text" class="admin-input font-mono text-[13px]" placeholder="stonebridge-ranch-drywall" />
        </div>
        <div>
          <label class="admin-label">Meta Description Preview</label>
          <p id="meta-preview" class="text-[#567798] text-[13px] mt-1 leading-relaxed italic min-h-[3em]"></p>
        </div>
      </div>
    </section>

    <!-- Action buttons -->
    <div class="flex items-center justify-between pt-2">
      <button type="button" id="save-draft-btn" class="btn-secondary">
        Save Draft
      </button>
      {canPublish ? (
        <button type="button" id="publish-btn" class="bg-[#22c55e] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#16a34a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
          Publish
        </button>
      ) : (
        <div class="text-[#567798] text-[13px] italic">Workers cannot publish — submit for review instead.</div>
      )}
    </div>
  </form>
</AdminLayout>

<style>
  .admin-label {
    display: block;
    font-size: 0.8125rem;
    font-weight: 700;
    color: #151d25;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }
  .admin-input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1.5px solid #cdd8e3;
    border-radius: 0.625rem;
    font-size: 0.9375rem;
    color: #151d25;
    background: #fff;
    transition: border-color 0.15s ease;
  }
  .admin-input:focus {
    outline: none;
    border-color: #b05d45;
  }
  textarea.admin-input { resize: vertical; min-height: 80px; }
</style>

<script>
  import { toSlug } from "@/lib/slugify";

  // ── Required field IDs and their readiness labels ──────────────────────
  const REQUIRED_FIELDS = [
    { id: "title",            label: "Title" },
    { id: "category",         label: "Category" },
    { id: "neighborhood",     label: "Neighborhood" },
    { id: "location",         label: "Location" },
    { id: "community",        label: "Community" },
    { id: "duration",         label: "Duration" },
    { id: "scope",            label: "Scope" },
    { id: "summary",          label: "Summary" },
    { id: "before_label",     label: "Before Label" },
    { id: "after_label",      label: "After Label" },
    { id: "before_photo_url", label: "Before Photo" },
    { id: "after_photo_url",  label: "After Photo" },
    { id: "overview",         label: "Overview" },
    { id: "challenge",        label: "Challenge" },
    { id: "result",           label: "Result" },
  ];
  const TOTAL = REQUIRED_FIELDS.length + 1; // +1 for scope_items

  const bar     = document.getElementById("readiness-bar")!;
  const text    = document.getElementById("readiness-text")!;
  const missing = document.getElementById("readiness-missing")!;
  const publishBtn = document.getElementById("publish-btn") as HTMLButtonElement | null;

  function updateReadiness() {
    const missingLabels: string[] = [];
    let filled = 0;

    for (const { id, label } of REQUIRED_FIELDS) {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el?.value?.trim()) { filled++; } else { missingLabels.push(label); }
    }

    // Scope items check
    const scopeInputs = document.querySelectorAll<HTMLInputElement>(".scope-item-input");
    const hasScope = Array.from(scopeInputs).some(i => i.value.trim());
    if (hasScope) { filled++; } else { missingLabels.push("Scope Items (≥1 required)"); }

    const pct = Math.round((filled / TOTAL) * 100);
    bar.style.width  = `${pct}%`;
    bar.style.background = pct < 50 ? "#ef4444" : pct < 90 ? "#f59e0b" : "#22c55e";
    text.textContent = `${filled} / ${TOTAL} fields complete`;
    missing.textContent = missingLabels.length > 0
      ? `Missing: ${missingLabels.join(", ")}`
      : "";

    if (publishBtn) publishBtn.disabled = missingLabels.length > 0;
  }

  // Listen to all form inputs
  document.getElementById("project-form")!.addEventListener("input", updateReadiness);

  // ── Scope items dynamic list ─────────────────────────────────────────────
  const scopeList = document.getElementById("scope-items-list")!;
  let scopeCount  = 0;

  function addScopeItem(value = "") {
    scopeCount++;
    const row = document.createElement("div");
    row.className = "flex gap-2 items-center";
    row.innerHTML = `
      <input type="text" name="scope_items[]" class="admin-input scope-item-input flex-1" placeholder="Scope item ${scopeCount}" value="${value.replace(/"/g, '&quot;')}" />
      <button type="button" class="remove-scope text-[#ef4444] font-bold text-[18px] px-2 hover:text-[#dc2626] transition-colors" aria-label="Remove item">×</button>
    `;
    row.querySelector(".remove-scope")!.addEventListener("click", () => {
      row.remove();
      updateReadiness();
    });
    row.querySelector("input")!.addEventListener("input", updateReadiness);
    scopeList.appendChild(row);
    updateReadiness();
  }

  document.getElementById("add-scope-item")!.addEventListener("click", () => addScopeItem());
  addScopeItem(); // Start with one row

  // ── Slug auto-generation from title ────────────────────────────────────
  const titleInput = document.getElementById("title") as HTMLInputElement;
  const slugInput  = document.getElementById("slug-preview") as HTMLInputElement;
  let slugManuallyEdited = false;

  titleInput.addEventListener("input", () => {
    if (!slugManuallyEdited) {
      slugInput.value = toSlug(titleInput.value);
    }
    const summaryEl = document.getElementById("summary") as HTMLTextAreaElement;
    document.getElementById("meta-preview")!.textContent = summaryEl.value.slice(0, 155) || "";
  });

  slugInput.addEventListener("input", () => { slugManuallyEdited = true; });
  document.getElementById("summary")!.addEventListener("input", (e) => {
    document.getElementById("meta-preview")!.textContent = (e.target as HTMLTextAreaElement).value.slice(0, 155);
  });

  // ── Photo upload ───────────────────────────────────────────────────────
  async function uploadPhoto(fileInput: HTMLInputElement, urlInput: HTMLInputElement, previewEl: HTMLElement, fieldId: string) {
    const file = fileInput.files?.[0];
    if (!file) return;

    const projectSlug = slugInput.value || `temp-${Date.now()}`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "project-photos");
    fd.append("path", `${projectSlug}/${fieldId}`);

    previewEl.textContent = "Uploading…";
    try {
      const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string };
      if (json.url) {
        urlInput.value = json.url;
        previewEl.textContent = `✓ Uploaded: ${file.name}`;
        previewEl.className = "text-[12px] text-[#22c55e] mt-1";
        updateReadiness();
      } else {
        previewEl.textContent = `✗ Upload failed: ${json.error}`;
        previewEl.className = "text-[12px] text-[#ef4444] mt-1";
      }
    } catch (err) {
      previewEl.textContent = `✗ Upload error`;
      previewEl.className = "text-[12px] text-[#ef4444] mt-1";
    }
  }

  document.getElementById("before_photo_file")!.addEventListener("change", function(this: HTMLInputElement) {
    uploadPhoto(this, document.getElementById("before_photo_url") as HTMLInputElement, document.getElementById("before_photo_preview")!, "before");
  });

  document.getElementById("after_photo_file")!.addEventListener("change", function(this: HTMLInputElement) {
    uploadPhoto(this, document.getElementById("after_photo_url") as HTMLInputElement, document.getElementById("after_photo_preview")!, "after");
  });

  // ── Save / Publish ─────────────────────────────────────────────────────
  async function submitForm(status: "draft" | "published") {
    const form = document.getElementById("project-form") as HTMLFormElement;
    const scopeInputs = Array.from(form.querySelectorAll<HTMLInputElement>(".scope-item-input"));

    const payload = {
      title:            (form.querySelector<HTMLInputElement>("#title"))!.value.trim(),
      category:         (form.querySelector<HTMLSelectElement>("#category"))!.value,
      neighborhood:     (form.querySelector<HTMLInputElement>("#neighborhood"))!.value.trim(),
      location:         (form.querySelector<HTMLInputElement>("#location"))!.value.trim(),
      community:        (form.querySelector<HTMLInputElement>("#community"))!.value.trim(),
      duration:         (form.querySelector<HTMLInputElement>("#duration"))!.value.trim(),
      scope:            (form.querySelector<HTMLInputElement>("#scope"))!.value.trim(),
      summary:          (form.querySelector<HTMLTextAreaElement>("#summary"))!.value.trim(),
      before_label:     (form.querySelector<HTMLInputElement>("#before_label"))!.value.trim(),
      after_label:      (form.querySelector<HTMLInputElement>("#after_label"))!.value.trim(),
      before_photo_url: (form.querySelector<HTMLInputElement>("#before_photo_url"))!.value.trim(),
      after_photo_url:  (form.querySelector<HTMLInputElement>("#after_photo_url"))!.value.trim(),
      overview:         (form.querySelector<HTMLTextAreaElement>("#overview"))!.value.trim(),
      challenge:        (form.querySelector<HTMLTextAreaElement>("#challenge"))!.value.trim(),
      result:           (form.querySelector<HTMLTextAreaElement>("#result"))!.value.trim(),
      scope_items:      scopeInputs.map(i => i.value.trim()).filter(Boolean),
      status,
    };

    const res  = await fetch("/api/admin/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json() as { slug?: string; error?: string; missing?: string[] };

    if (res.ok && json.slug) {
      window.location.href = `/admin/projects/${json.slug}`;
    } else {
      alert(`Error: ${json.error ?? "Unknown error"}\n${json.missing?.join("\n") ?? ""}`);
    }
  }

  document.getElementById("save-draft-btn")!.addEventListener("click", () => submitForm("draft"));
  publishBtn?.addEventListener("click", () => submitForm("published"));

  updateReadiness();
</script>
```

- [ ] **Step 2: Create src/pages/admin/projects/[slug].astro**

The edit form is identical to the new form, but:
1. Fetches the existing record from Supabase at request time
2. Prefills all fields with existing values
3. Sends `PUT` to `/api/admin/projects` with `id` in the body
4. Shows a "Republish" or "Unpublish" button for published records

Create `src/pages/admin/projects/[slug].astro`:

```astro
---
// src/pages/admin/projects/[slug].astro
import AdminLayout from "@/layouts/AdminLayout.astro";
import { createAdminClient } from "@/lib/supabase";
import type { ProjectRow } from "@/types/database";
import { getProjectReadiness } from "@/lib/admin";

const { slug } = Astro.params;
const supabase = createAdminClient();
const { data, error } = await supabase.from("projects").select("*").eq("slug", slug).single();

if (error || !data) return Astro.redirect("/admin/projects");

const p = data as ProjectRow;
const user = Astro.locals.user!;
const canPublish = user.role !== "worker";
const readiness = getProjectReadiness(p as any);
const pct = readiness.percent;
const barColor = pct < 50 ? "#ef4444" : pct < 90 ? "#f59e0b" : "#22c55e";
---

<AdminLayout title={`Edit: ${p.title}`} activeSection="projects">
  <div class="mb-6">
    <a href="/admin/projects" class="text-[#567798] text-[13px] hover:text-[#151d25]">← Projects</a>
    <div class="flex items-center gap-3 mt-2">
      <h1 class="text-[#151d25] text-[26px] font-black tracking-tight">{p.title}</h1>
      <span class={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${p.status === "published" ? "bg-[#dcfce7] text-[#166534]" : "bg-amber-50 text-amber-700"}`}>
        {p.status}
      </span>
    </div>
  </div>

  <!-- Readiness bar (server-rendered initial state) -->
  <div class="bg-white rounded-2xl border border-[#cdd8e3] p-5 mb-6">
    <div class="flex items-center justify-between mb-2">
      <span class="text-[#151d25] text-[13px] font-bold">Publish Readiness</span>
      <span id="readiness-text" class="text-[#567798] text-[13px]">{readiness.filled} / {readiness.total} fields complete</span>
    </div>
    <div class="h-2 bg-[#e8edf2] rounded-full overflow-hidden">
      <div id="readiness-bar" class="h-full rounded-full transition-all duration-300" style={`width: ${pct}%; background: ${barColor};`}></div>
    </div>
    {readiness.missing.length > 0 && (
      <p id="readiness-missing" class="text-[#567798] text-[12px] mt-2">
        Missing: {readiness.missing.join(", ")}
      </p>
    )}
    {readiness.missing.length === 0 && (
      <p id="readiness-missing" class="text-[12px] mt-2"></p>
    )}
  </div>

  <!-- Same form as new.astro, but with data-record-id and prefilled values -->
  <form id="project-form" data-record-id={p.id} data-record-slug={p.slug} class="flex flex-col gap-8">

    <!-- Section 1: Basics (same HTML structure, prefilled values) -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">1. Basics</h2>
      <div class="grid sm:grid-cols-2 gap-5">
        <div class="sm:col-span-2">
          <label class="admin-label" for="title">Title *</label>
          <input id="title" name="title" type="text" required class="admin-input" value={p.title} />
        </div>
        <div>
          <label class="admin-label" for="category">Category *</label>
          <select id="category" name="category" required class="admin-input">
            {["Drywall", "Painting", "Plumbing", "Electrical", "Carpentry", "Outdoor"].map(c => (
              <option value={c} selected={p.category === c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label class="admin-label" for="neighborhood">Neighborhood *</label>
          <input id="neighborhood" name="neighborhood" type="text" required class="admin-input" value={p.neighborhood ?? ""} />
        </div>
        <div>
          <label class="admin-label" for="location">Location *</label>
          <input id="location" name="location" type="text" required class="admin-input" value={p.location ?? ""} />
        </div>
        <div>
          <label class="admin-label" for="community">Community *</label>
          <input id="community" name="community" type="text" required class="admin-input" value={p.community ?? ""} />
        </div>
        <div>
          <label class="admin-label" for="duration">Duration *</label>
          <input id="duration" name="duration" type="text" required class="admin-input" value={p.duration ?? ""} />
        </div>
        <div>
          <label class="admin-label" for="scope">Scope *</label>
          <input id="scope" name="scope" type="text" required class="admin-input" value={p.scope ?? ""} />
        </div>
        <div class="sm:col-span-2">
          <label class="admin-label" for="summary">Summary *</label>
          <textarea id="summary" name="summary" required rows="3" class="admin-input">{p.summary ?? ""}</textarea>
        </div>
      </div>
    </section>

    <!-- Section 2: Photos (same structure; shows existing URL thumbnails) -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">2. Photos</h2>
      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="admin-label" for="before_photo_file">Before Photo *</label>
          {p.before_photo_url && <img src={p.before_photo_url} alt="Current before photo" class="w-full h-32 object-cover rounded-lg mb-2" />}
          <input id="before_photo_file" name="before_photo_file" type="file" accept="image/*" class="admin-input" />
          <input id="before_photo_url" name="before_photo_url" type="hidden" value={p.before_photo_url ?? ""} />
          <p id="before_photo_preview" class="text-[12px] text-[#567798] mt-1">{p.before_photo_url ? "✓ Photo set" : "No photo yet"}</p>
        </div>
        <div>
          <label class="admin-label" for="after_photo_file">After Photo *</label>
          {p.after_photo_url && <img src={p.after_photo_url} alt="Current after photo" class="w-full h-32 object-cover rounded-lg mb-2" />}
          <input id="after_photo_file" name="after_photo_file" type="file" accept="image/*" class="admin-input" />
          <input id="after_photo_url" name="after_photo_url" type="hidden" value={p.after_photo_url ?? ""} />
          <p id="after_photo_preview" class="text-[12px] text-[#567798] mt-1">{p.after_photo_url ? "✓ Photo set" : "No photo yet"}</p>
        </div>
        <div>
          <label class="admin-label" for="before_label">Before Label *</label>
          <input id="before_label" name="before_label" type="text" required class="admin-input" value={p.before_label ?? ""} />
        </div>
        <div>
          <label class="admin-label" for="after_label">After Label *</label>
          <input id="after_label" name="after_label" type="text" required class="admin-input" value={p.after_label ?? ""} />
        </div>
      </div>
    </section>

    <!-- Section 3: Narrative -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">3. Narrative</h2>
      <div class="flex flex-col gap-5">
        <div>
          <label class="admin-label" for="overview">Overview *</label>
          <textarea id="overview" name="overview" required rows="5" class="admin-input">{p.overview ?? ""}</textarea>
        </div>
        <div>
          <label class="admin-label" for="challenge">Challenge *</label>
          <textarea id="challenge" name="challenge" required rows="3" class="admin-input">{p.challenge ?? ""}</textarea>
        </div>
        <div>
          <label class="admin-label" for="result">Result *</label>
          <textarea id="result" name="result" required rows="3" class="admin-input">{p.result ?? ""}</textarea>
        </div>
      </div>
    </section>

    <!-- Section 4: Scope Items (prefilled) -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">4. Scope Items *</h2>
      <div id="scope-items-list" class="flex flex-col gap-3 mb-4">
        {(p.scope_items ?? []).map((item) => (
          <div class="flex gap-2 items-center scope-item-row">
            <input type="text" name="scope_items[]" class="admin-input scope-item-input flex-1" value={item} />
            <button type="button" class="remove-scope text-[#ef4444] font-bold text-[18px] px-2">×</button>
          </div>
        ))}
      </div>
      <button type="button" id="add-scope-item" class="text-[#b05d45] text-[13px] font-semibold hover:underline">+ Add scope item</button>
    </section>

    <!-- Action buttons -->
    <div class="flex items-center justify-between pt-2">
      <div class="flex gap-3">
        <button type="button" id="save-draft-btn" class="btn-secondary">Save Draft</button>
        {p.status === "published" && (
          <button type="button" id="unpublish-btn" class="bg-[#f0f2f4] text-[#567798] font-bold px-5 py-3 rounded-xl hover:bg-[#e0e7ef] transition-colors text-[13px]">
            Unpublish
          </button>
        )}
      </div>
      {canPublish && (
        <button type="button" id="publish-btn" class="bg-[#22c55e] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#16a34a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!readiness.canPublish}>
          {p.status === "published" ? "Save & Republish" : "Publish"}
        </button>
      )}
    </div>
  </form>
</AdminLayout>

<style>
  .admin-label { display: block; font-size: 0.8125rem; font-weight: 700; color: #151d25; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .admin-input { width: 100%; padding: 0.625rem 0.875rem; border: 1.5px solid #cdd8e3; border-radius: 0.625rem; font-size: 0.9375rem; color: #151d25; background: #fff; transition: border-color 0.15s ease; }
  .admin-input:focus { outline: none; border-color: #b05d45; }
  textarea.admin-input { resize: vertical; min-height: 80px; }
</style>

<script>
  // Re-use same readiness + scope + upload + submit JS pattern as new.astro
  // Submit function sends PUT with record id instead of POST

  const form = document.getElementById("project-form") as HTMLFormElement;
  const recordId   = form.dataset.recordId!;
  const recordSlug = form.dataset.recordSlug!;

  // (Attach same readiness update logic as new.astro — omitted for brevity but identical)
  // (Attach same scope item add/remove logic with prefilled rows wired up)
  // (Attach same photo upload handler)

  async function submitForm(status: "draft" | "published" | "unpublished") {
    const scopeInputs = Array.from(form.querySelectorAll<HTMLInputElement>(".scope-item-input"));
    const payload = {
      id:               recordId,
      title:            (form.querySelector<HTMLInputElement>("#title"))!.value.trim(),
      category:         (form.querySelector<HTMLSelectElement>("#category"))!.value,
      neighborhood:     (form.querySelector<HTMLInputElement>("#neighborhood"))!.value.trim(),
      location:         (form.querySelector<HTMLInputElement>("#location"))!.value.trim(),
      community:        (form.querySelector<HTMLInputElement>("#community"))!.value.trim(),
      duration:         (form.querySelector<HTMLInputElement>("#duration"))!.value.trim(),
      scope:            (form.querySelector<HTMLInputElement>("#scope"))!.value.trim(),
      summary:          (form.querySelector<HTMLTextAreaElement>("#summary"))!.value.trim(),
      before_label:     (form.querySelector<HTMLInputElement>("#before_label"))!.value.trim(),
      after_label:      (form.querySelector<HTMLInputElement>("#after_label"))!.value.trim(),
      before_photo_url: (form.querySelector<HTMLInputElement>("#before_photo_url"))!.value.trim(),
      after_photo_url:  (form.querySelector<HTMLInputElement>("#after_photo_url"))!.value.trim(),
      overview:         (form.querySelector<HTMLTextAreaElement>("#overview"))!.value.trim(),
      challenge:        (form.querySelector<HTMLTextAreaElement>("#challenge"))!.value.trim(),
      result:           (form.querySelector<HTMLTextAreaElement>("#result"))!.value.trim(),
      scope_items:      scopeInputs.map(i => i.value.trim()).filter(Boolean),
      status:           status === "unpublished" ? "draft" : status,
    };

    const res  = await fetch("/api/admin/projects", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json() as { slug?: string; error?: string; missing?: string[] };

    if (res.ok) {
      window.location.reload();
    } else {
      alert(`Error: ${json.error}\n${json.missing?.join("\n") ?? ""}`);
    }
  }

  document.getElementById("save-draft-btn")!.addEventListener("click", () => submitForm("draft"));
  document.getElementById("publish-btn")?.addEventListener("click", () => submitForm("published"));
  document.getElementById("unpublish-btn")?.addEventListener("click", () => {
    if (confirm("This will remove the project from the live site immediately.")) submitForm("unpublished");
  });

  // Scope item remove buttons wired up for prefilled rows
  document.querySelectorAll<HTMLButtonElement>(".remove-scope").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest(".scope-item-row")?.remove();
    });
  });

  document.getElementById("add-scope-item")!.addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "flex gap-2 items-center scope-item-row";
    row.innerHTML = `<input type="text" name="scope_items[]" class="admin-input scope-item-input flex-1" placeholder="Scope item" /><button type="button" class="remove-scope text-[#ef4444] font-bold text-[18px] px-2">×</button>`;
    row.querySelector(".remove-scope")!.addEventListener("click", () => row.remove());
    document.getElementById("scope-items-list")!.appendChild(row);
  });
</script>
```

- [ ] **Step 3: Verify both pages render**

```bash
npm run dev
```

- `http://localhost:4321/admin/projects/new` — blank form, scope item row appears, readiness bar at 0%
- `http://localhost:4321/admin/projects/stonebridge-ranch-drywall` — all fields prefilled, readiness bar at ~60% (missing before_photo_url)

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/projects/new.astro src/pages/admin/projects/[slug].astro
git commit -m "feat: add project new and edit admin forms with readiness bar"
```

---

### Task 9: Events, Press, and Media admin pages

**Files:**
- Create: `src/pages/api/admin/events.ts`
- Create: `src/pages/api/admin/press.ts`
- Create: `src/pages/api/admin/media.ts`
- Create: `src/pages/admin/events/index.astro`
- Create: `src/pages/admin/events/new.astro`
- Create: `src/pages/admin/events/[slug].astro`
- Create: `src/pages/admin/press/index.astro`
- Create: `src/pages/admin/press/mentions/new.astro`
- Create: `src/pages/admin/press/media/new.astro`

These pages follow the exact same patterns established in Task 7 and Task 8. The list pages mirror the projects list; the forms mirror the project form. Complete each by adapting the project pattern for each content type's required fields (from `admin.ts`).

- [ ] **Step 1: Create src/pages/api/admin/events.ts**

Follow the same `POST/PUT/DELETE` pattern as `projects.ts`:
- Import `getEventReadiness` from `@/lib/admin`
- Import `ghlNotifyPublish` for event publish
- `uniqueSlug` from `@/lib/slugify` (based on `title`)
- Required fields per `EventRow`: `title`, `event_type`, `event_date`, `location_name`, `address`, `description`, `image_url`
- Workers cannot publish
- On publish → call `ghlNotifyPublish("event", data)`

```ts
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

  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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
```

- [ ] **Step 2: Create src/pages/api/admin/press.ts**

```ts
// src/pages/api/admin/press.ts
// POST/PUT/DELETE for press_mentions + media_items
// Route determined by `type` field in body: "mention" | "media"

import type { APIRoute } from "astro";
import { createAdminClient } from "@/lib/supabase";
import { validateSession, SESSION_COOKIE } from "@/lib/workos";
import { getPressMentionReadiness } from "@/lib/admin";
import { ghlNotifyPublish } from "./ghl-notify";

async function requireAuth(cookies: any) {
  const session = cookies.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  return validateSession(session);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await requireAuth(cookies);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await request.json() as Record<string, unknown> & { recordType: "mention" | "media" };
  const { recordType, ...fields } = body;

  const supabase = createAdminClient();

  if (recordType === "mention") {
    // Validate summary word count
    const r = getPressMentionReadiness(fields as any);
    if (!r.canPublish) return new Response(JSON.stringify({ error: "Invalid", missing: r.missing }), { status: 422 });

    const { data, error } = await supabase.from("press_mentions").insert(fields).select().single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    ghlNotifyPublish("press_mention", data as Record<string, unknown>).catch(console.error);
    return new Response(JSON.stringify({ id: (data as any).id }), { status: 201 });
  }

  if (recordType === "media") {
    const { data, error } = await supabase.from("media_items").insert(fields).select().single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    ghlNotifyPublish("media_item", data as Record<string, unknown>).catch(console.error);
    return new Response(JSON.stringify({ id: (data as any).id }), { status: 201 });
  }

  return new Response(JSON.stringify({ error: "Unknown recordType" }), { status: 400 });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const user = await requireAuth(cookies);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { id, recordType } = await request.json() as { id: string; recordType: "mention" | "media" };
  const table = recordType === "mention" ? "press_mentions" : "media_items";
  const { error } = await createAdminClient().from(table).delete().eq("id", id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
```

- [ ] **Step 3: Create admin/events/index.astro**

Mirror the projects list page. Query `events` table ordered by `event_date`. Show status badges and "Past" indicator for events where `event_date < now()`.

Key differences from projects list:
- Display: event_date, location_name instead of category
- No draft/published tab switch — show all in one table with status badge

```astro
---
// src/pages/admin/events/index.astro
import AdminLayout from "@/layouts/AdminLayout.astro";
import { createAdminClient } from "@/lib/supabase";
import type { EventRow } from "@/types/database";

const supabase = createAdminClient();
const { data } = await supabase
  .from("events")
  .select("id, slug, title, event_type, event_date, status, location_name")
  .order("event_date", { ascending: true });

const events = (data ?? []) as Pick<EventRow, "id" | "slug" | "title" | "event_type" | "event_date" | "status" | "location_name">[];
const now = new Date();
---

<AdminLayout title="Events" activeSection="events">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-[#151d25] text-[28px] font-black tracking-tight">Events</h1>
      <p class="text-[#567798] text-[14px] mt-1">{events.filter(e => e.status === "published").length} published · {events.filter(e => e.status === "draft").length} drafts</p>
    </div>
    <a href="/admin/events/new" class="inline-flex items-center gap-2 bg-[#b05d45] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl hover:bg-[#8d4a37] transition-colors">+ New Event</a>
  </div>

  {events.length === 0 ? (
    <div class="text-center py-16 text-[#567798]">No events yet.</div>
  ) : (
    <div class="bg-white rounded-2xl border border-[#cdd8e3] overflow-hidden">
      <table class="w-full text-[13px]">
        <thead class="bg-[#f0f2f4] border-b border-[#cdd8e3]">
          <tr>
            <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px]">Event</th>
            <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px] hidden sm:table-cell">Date</th>
            <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px] hidden lg:table-cell">Status</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f0f2f4]">
          {events.map((e) => {
            const isPast = new Date(e.event_date) < now;
            return (
              <tr class={`hover:bg-[#f8fafc] transition-colors${isPast ? " opacity-60" : ""}`}>
                <td class="px-5 py-4">
                  <p class="text-[#151d25] font-semibold">{e.title}</p>
                  <p class="text-[#567798] text-[12px]">{e.location_name}</p>
                </td>
                <td class="px-5 py-4 text-[#567798] hidden sm:table-cell">
                  {new Date(e.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {isPast && <span class="ml-2 text-[11px] text-[#567798] bg-[#f0f2f4] px-1.5 py-0.5 rounded">Past</span>}
                </td>
                <td class="px-5 py-4 hidden lg:table-cell">
                  <span class={`text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${e.status === "published" ? "bg-[#dcfce7] text-[#166534]" : "bg-amber-50 text-amber-700"}`}>{e.status}</span>
                </td>
                <td class="px-5 py-4 text-right">
                  <a href={`/admin/events/${e.slug}`} class="text-[#b05d45] font-semibold hover:underline">Edit</a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}
</AdminLayout>
```

- [ ] **Step 4: Create admin/events/new.astro and admin/events/[slug].astro**

Follow the same pattern as the project forms. Key differences:
- Fields: title, event_type (dropdown), event_date (datetime-local input), end_date (datetime-local, optional), location_name, address, description, image_url (upload), website_url, google_place_id, local_links (dynamic `{label, url}` pair list)
- Readiness uses `getEventReadiness`
- Submit sends JSON to `/api/admin/events`
- Local links dynamic rows: same add/remove pattern as scope_items but with two inputs per row (label + url)

The event detail edit form structure (identical to new except for prefilling from DB):

```astro
---
// src/pages/admin/events/new.astro
import AdminLayout from "@/layouts/AdminLayout.astro";
const user = Astro.locals.user!;
const canPublish = user.role !== "worker";
---

<AdminLayout title="New Event" activeSection="events">
  <div class="mb-6">
    <a href="/admin/events" class="text-[#567798] text-[13px] hover:text-[#151d25]">← Events</a>
    <h1 class="text-[#151d25] text-[26px] font-black tracking-tight mt-2">New Event</h1>
  </div>

  <!-- Readiness bar (same structure as project form) -->
  <div class="bg-white rounded-2xl border border-[#cdd8e3] p-5 mb-6">
    <div class="flex items-center justify-between mb-2">
      <span class="text-[#151d25] text-[13px] font-bold">Publish Readiness</span>
      <span id="readiness-text" class="text-[#567798] text-[13px]">0 / 7 fields complete</span>
    </div>
    <div class="h-2 bg-[#e8edf2] rounded-full overflow-hidden">
      <div id="readiness-bar" class="h-full bg-[#ef4444] rounded-full transition-all duration-300" style="width: 0%"></div>
    </div>
    <p id="readiness-missing" class="text-[#567798] text-[12px] mt-2"></p>
  </div>

  <form id="event-form" class="flex flex-col gap-8">

    <!-- Section 1: Basics -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">1. Basics</h2>
      <div class="grid sm:grid-cols-2 gap-5">
        <div class="sm:col-span-2">
          <label class="admin-label" for="title">Title *</label>
          <input id="title" name="title" type="text" required class="admin-input" placeholder="McKinney Home Show 2026" />
        </div>
        <div>
          <label class="admin-label" for="event_type">Event Type *</label>
          <select id="event_type" name="event_type" required class="admin-input">
            <option value="">Select type…</option>
            {["Sponsor", "Booth", "Speaking", "Community", "Other"].map(t => <option value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label class="admin-label" for="event_date">Event Date & Time *</label>
          <input id="event_date" name="event_date" type="datetime-local" required class="admin-input" />
        </div>
        <div>
          <label class="admin-label" for="end_date">End Date & Time <span class="text-[#567798] font-normal">(optional, multi-day)</span></label>
          <input id="end_date" name="end_date" type="datetime-local" class="admin-input" />
        </div>
        <div>
          <label class="admin-label" for="location_name">Venue Name *</label>
          <input id="location_name" name="location_name" type="text" required class="admin-input" placeholder="McKinney Performing Arts Center" />
        </div>
        <div class="sm:col-span-2">
          <label class="admin-label" for="address">Address * <span class="text-[#567798] font-normal">(drives Google Maps embed)</span></label>
          <input id="address" name="address" type="text" required class="admin-input" placeholder="111 N Tennessee St, McKinney, TX 75069" />
        </div>
      </div>
    </section>

    <!-- Section 2: Photo -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">2. Event Photo *</h2>
      <input id="image_file" type="file" accept="image/*" class="admin-input" />
      <input id="image_url" name="image_url" type="hidden" value="" />
      <p id="image_preview" class="text-[12px] text-[#567798] mt-2"></p>
    </section>

    <!-- Section 3: Details -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">3. Details</h2>
      <div class="flex flex-col gap-5">
        <div>
          <label class="admin-label" for="description">Description *</label>
          <textarea id="description" name="description" required rows="4" class="admin-input" placeholder="What's happening at this event and why we're there…"></textarea>
        </div>
        <div>
          <label class="admin-label" for="website_url">Event Website <span class="text-[#567798] font-normal">(optional)</span></label>
          <input id="website_url" name="website_url" type="url" class="admin-input" placeholder="https://mckinneyhomeshow.com" />
        </div>
        <div>
          <label class="admin-label" for="google_place_id">Google Place ID <span class="text-[#567798] font-normal">(optional — improves Maps precision)</span></label>
          <input id="google_place_id" name="google_place_id" type="text" class="admin-input" placeholder="ChIJ..." />
        </div>
      </div>
    </section>

    <!-- Section 4: Local SEO Links -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">4. Local SEO Links <span class="text-[#567798] text-[14px] font-normal">(min 1 recommended)</span></h2>
      <div id="local-links-list" class="flex flex-col gap-3 mb-4"></div>
      <button type="button" id="add-local-link" class="text-[#b05d45] text-[13px] font-semibold hover:underline">+ Add local link</button>
    </section>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-2">
      <button type="button" id="save-draft-btn" class="btn-secondary">Save Draft</button>
      {canPublish && (
        <button type="button" id="publish-btn" class="bg-[#22c55e] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#16a34a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>Publish</button>
      )}
    </div>
  </form>
</AdminLayout>

<style>
  .admin-label { display: block; font-size: 0.8125rem; font-weight: 700; color: #151d25; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .admin-input { width: 100%; padding: 0.625rem 0.875rem; border: 1.5px solid #cdd8e3; border-radius: 0.625rem; font-size: 0.9375rem; color: #151d25; background: #fff; transition: border-color 0.15s ease; }
  .admin-input:focus { outline: none; border-color: #b05d45; }
  textarea.admin-input { resize: vertical; min-height: 80px; }
</style>

<script>
  const REQUIRED = ["title", "event_type", "event_date", "location_name", "address", "description", "image_url"];
  const TOTAL = REQUIRED.length;
  const bar = document.getElementById("readiness-bar")!;
  const text = document.getElementById("readiness-text")!;
  const missingEl = document.getElementById("readiness-missing")!;
  const publishBtn = document.getElementById("publish-btn") as HTMLButtonElement | null;

  function updateReadiness() {
    const missingLabels: string[] = [];
    let filled = 0;
    for (const id of REQUIRED) {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el?.value?.trim()) { filled++; } else { missingLabels.push(id.replace(/_/g, " ")); }
    }
    const pct = Math.round((filled / TOTAL) * 100);
    bar.style.width = `${pct}%`;
    bar.style.background = pct < 50 ? "#ef4444" : pct < 90 ? "#f59e0b" : "#22c55e";
    text.textContent = `${filled} / ${TOTAL} fields complete`;
    missingEl.textContent = missingLabels.length > 0 ? `Missing: ${missingLabels.join(", ")}` : "";
    if (publishBtn) publishBtn.disabled = missingLabels.length > 0;
  }

  document.getElementById("event-form")!.addEventListener("input", updateReadiness);

  // Local links dynamic rows
  const linksList = document.getElementById("local-links-list")!;
  document.getElementById("add-local-link")!.addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "grid sm:grid-cols-2 gap-3 items-center local-link-row";
    row.innerHTML = `
      <input type="text" name="local_link_label[]" class="admin-input" placeholder="McKinney Performing Arts" />
      <div class="flex gap-2">
        <input type="url" name="local_link_url[]" class="admin-input flex-1" placeholder="https://mckinneypac.com" />
        <button type="button" class="remove-link text-[#ef4444] font-bold text-[18px] px-2 hover:text-[#dc2626]">×</button>
      </div>
    `;
    row.querySelector(".remove-link")!.addEventListener("click", () => row.remove());
    linksList.appendChild(row);
  });

  // Image upload
  document.getElementById("image_file")!.addEventListener("change", async function(this: HTMLInputElement) {
    const file = this.files?.[0];
    if (!file) return;
    const preview = document.getElementById("image_preview")!;
    preview.textContent = "Uploading…";
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "project-photos");
    fd.append("path", `events/${Date.now()}`);
    try {
      const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string };
      if (json.url) {
        (document.getElementById("image_url") as HTMLInputElement).value = json.url;
        preview.textContent = `✓ ${file.name}`;
        preview.className = "text-[12px] text-[#22c55e] mt-2";
        updateReadiness();
      } else {
        preview.textContent = `✗ ${json.error}`;
        preview.className = "text-[12px] text-[#ef4444] mt-2";
      }
    } catch { preview.textContent = "✗ Upload error"; }
  });

  // Submit
  async function submitForm(status: string) {
    const form = document.getElementById("event-form") as HTMLFormElement;
    const localLinks = Array.from(form.querySelectorAll<HTMLElement>(".local-link-row")).map(row => ({
      label: (row.querySelector<HTMLInputElement>("[name='local_link_label[]']"))!.value.trim(),
      url:   (row.querySelector<HTMLInputElement>("[name='local_link_url[]']"))!.value.trim(),
    })).filter(l => l.label && l.url);

    const payload = {
      title:          (form.querySelector<HTMLInputElement>("#title"))!.value.trim(),
      event_type:     (form.querySelector<HTMLSelectElement>("#event_type"))!.value,
      event_date:     (form.querySelector<HTMLInputElement>("#event_date"))!.value,
      end_date:       (form.querySelector<HTMLInputElement>("#end_date"))!.value || null,
      location_name:  (form.querySelector<HTMLInputElement>("#location_name"))!.value.trim(),
      address:        (form.querySelector<HTMLInputElement>("#address"))!.value.trim(),
      description:    (form.querySelector<HTMLTextAreaElement>("#description"))!.value.trim(),
      image_url:      (form.querySelector<HTMLInputElement>("#image_url"))!.value.trim(),
      website_url:    (form.querySelector<HTMLInputElement>("#website_url"))!.value.trim() || null,
      google_place_id:(form.querySelector<HTMLInputElement>("#google_place_id"))!.value.trim() || null,
      local_links:    localLinks,
      status,
    };

    const res  = await fetch("/api/admin/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json() as { slug?: string; error?: string; missing?: string[] };
    if (res.ok && json.slug) { window.location.href = `/admin/events/${json.slug}`; }
    else { alert(`Error: ${json.error}\n${json.missing?.join("\n") ?? ""}`); }
  }

  document.getElementById("save-draft-btn")!.addEventListener("click", () => submitForm("draft"));
  publishBtn?.addEventListener("click", () => submitForm("published"));
  updateReadiness();
</script>
```

- [ ] **Step 5: Create admin/events/[slug].astro**

Mirror `admin/projects/[slug].astro` — fetch event by slug, prefill all fields, send PUT. Same upload, readiness, and submit patterns.

- [ ] **Step 6: Create admin/press/index.astro**

Show two sub-sections: Press Mentions table + Media Items table. Each row has Edit (redirect to edit form or inline edit modal) and Delete buttons.

```astro
---
// src/pages/admin/press/index.astro
import AdminLayout from "@/layouts/AdminLayout.astro";
import { createAdminClient } from "@/lib/supabase";
import type { PressMentionRow, MediaItemRow } from "@/types/database";

const supabase = createAdminClient();
const { data: mentions } = await supabase.from("press_mentions").select("*").order("published_date", { ascending: false });
const { data: media }    = await supabase.from("media_items").select("*").order("sort_order").order("published_date", { ascending: false });
---

<AdminLayout title="Press & Media" activeSection="press">
  <div class="flex items-center justify-between mb-8">
    <h1 class="text-[#151d25] text-[28px] font-black tracking-tight">Press & Media</h1>
    <div class="flex gap-3">
      <a href="/admin/press/mentions/new" class="btn-secondary text-[13px]">+ Press Mention</a>
      <a href="/admin/press/media/new" class="inline-flex items-center gap-2 bg-[#b05d45] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl hover:bg-[#8d4a37] transition-colors">+ Video/Podcast</a>
    </div>
  </div>

  <!-- Press Mentions -->
  <section class="mb-10">
    <h2 class="text-[#151d25] font-black text-[18px] mb-4">In the News ({(mentions ?? []).length})</h2>
    {(mentions ?? []).length === 0 ? (
      <div class="text-center py-10 bg-white rounded-2xl border border-[#cdd8e3] text-[#567798]">
        No press mentions yet. <a href="/admin/press/mentions/new" class="text-[#b05d45] hover:underline">Add one</a>.
      </div>
    ) : (
      <div class="bg-white rounded-2xl border border-[#cdd8e3] overflow-hidden">
        <table class="w-full text-[13px]">
          <thead class="bg-[#f0f2f4] border-b border-[#cdd8e3]">
            <tr>
              <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px]">Headline</th>
              <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px] hidden sm:table-cell">Publication</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#f0f2f4]">
            {(mentions as PressMentionRow[]).map((m) => (
              <tr class="hover:bg-[#f8fafc]">
                <td class="px-5 py-4">
                  <p class="text-[#151d25] font-semibold truncate max-w-[300px]">{m.headline || "(untitled)"}</p>
                  <a href={m.url} target="_blank" rel="noopener noreferrer" class="text-[#567798] text-[12px] hover:underline truncate block max-w-[300px]">{m.url}</a>
                </td>
                <td class="px-5 py-4 text-[#567798] hidden sm:table-cell">{m.publication}</td>
                <td class="px-5 py-4 text-right">
                  <button
                    class="text-[#ef4444] text-[12px] font-semibold hover:underline delete-mention"
                    data-id={m.id}
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>

  <!-- Media Items -->
  <section>
    <h2 class="text-[#151d25] font-black text-[18px] mb-4">Videos & Podcasts ({(media ?? []).length})</h2>
    {(media ?? []).length === 0 ? (
      <div class="text-center py-10 bg-white rounded-2xl border border-[#cdd8e3] text-[#567798]">
        No media items yet. <a href="/admin/press/media/new" class="text-[#b05d45] hover:underline">Add one</a>.
      </div>
    ) : (
      <div class="bg-white rounded-2xl border border-[#cdd8e3] overflow-hidden">
        <table class="w-full text-[13px]">
          <thead class="bg-[#f0f2f4] border-b border-[#cdd8e3]">
            <tr>
              <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px]">Title</th>
              <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px] hidden sm:table-cell">Type</th>
              <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px] hidden lg:table-cell">Order</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#f0f2f4]">
            {(media as MediaItemRow[]).map((m) => (
              <tr class="hover:bg-[#f8fafc]">
                <td class="px-5 py-4 text-[#151d25] font-semibold">{m.title}</td>
                <td class="px-5 py-4 text-[#567798] hidden sm:table-cell capitalize">{m.type}</td>
                <td class="px-5 py-4 text-[#567798] hidden lg:table-cell">{m.sort_order}</td>
                <td class="px-5 py-4 text-right">
                  <button class="text-[#ef4444] text-[12px] font-semibold hover:underline delete-media" data-id={m.id}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
</AdminLayout>

<script>
  // Delete press mention
  document.querySelectorAll<HTMLButtonElement>(".delete-mention").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this press mention?")) return;
      const res = await fetch("/api/admin/press", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: btn.dataset.id, recordType: "mention" }),
      });
      if (res.ok) window.location.reload();
      else alert("Delete failed");
    });
  });

  // Delete media item
  document.querySelectorAll<HTMLButtonElement>(".delete-media").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this media item?")) return;
      const res = await fetch("/api/admin/press", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: btn.dataset.id, recordType: "media" }),
      });
      if (res.ok) window.location.reload();
      else alert("Delete failed");
    });
  });
</script>
```

- [ ] **Step 7: Create admin/press/mentions/new.astro (URL intake form)**

```astro
---
// src/pages/admin/press/mentions/new.astro
import AdminLayout from "@/layouts/AdminLayout.astro";
---

<AdminLayout title="Add Press Mention" activeSection="press">
  <div class="mb-6">
    <a href="/admin/press" class="text-[#567798] text-[13px] hover:text-[#151d25]">← Press</a>
    <h1 class="text-[#151d25] text-[26px] font-black tracking-tight mt-2">Add Press Mention</h1>
    <p class="text-[#567798] text-[14px] mt-1">Paste the article URL — we'll auto-fill headline, publication, and summary from the page.</p>
  </div>

  <div class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
    <!-- Step 1: URL input -->
    <div class="mb-6">
      <label class="admin-label" for="url">Article URL *</label>
      <div class="flex gap-3">
        <input id="url" name="url" type="url" required class="admin-input flex-1" placeholder="https://dallasnews.com/article..." />
        <button type="button" id="fetch-btn" class="bg-[#2c3e50] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl hover:bg-[#1a2533] transition-colors whitespace-nowrap">
          Fetch Details
        </button>
      </div>
      <p id="fetch-status" class="text-[12px] text-[#567798] mt-1"></p>
    </div>

    <!-- Auto-prefilled (and editable) fields -->
    <div id="mention-fields" class="flex flex-col gap-5">
      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="admin-label" for="headline">Headline *</label>
          <input id="headline" name="headline" type="text" required class="admin-input" placeholder="Article headline" />
        </div>
        <div>
          <label class="admin-label" for="publication">Publication *</label>
          <input id="publication" name="publication" type="text" required class="admin-input" placeholder="Dallas Morning News" />
        </div>
        <div>
          <label class="admin-label" for="published_date">Published Date</label>
          <input id="published_date" name="published_date" type="date" class="admin-input" />
        </div>
        <div>
          <label class="admin-label" for="image_url">
            Image URL
            <span class="text-[#567798] font-normal">(falls back to site placeholder automatically)</span>
          </label>
          <input id="image_url" name="image_url" type="url" class="admin-input" placeholder="https://..." />
        </div>
      </div>
      <div>
        <label class="admin-label" for="summary">
          Summary *
          <span class="text-[#567798] font-normal">(20–200 words required)</span>
        </label>
        <textarea id="summary" name="summary" required rows="5" class="admin-input" placeholder="Article summary…"></textarea>
        <p id="word-count-display" class="text-[12px] text-[#567798] mt-1">0 words</p>
      </div>
    </div>

    <div class="flex justify-end pt-6 border-t border-[#f0f2f4] mt-6">
      <button type="button" id="save-btn" class="bg-[#b05d45] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#8d4a37] transition-colors disabled:opacity-50" disabled>
        Save Press Mention
      </button>
    </div>
  </div>
</AdminLayout>

<style>
  .admin-label { display: block; font-size: 0.8125rem; font-weight: 700; color: #151d25; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .admin-input { width: 100%; padding: 0.625rem 0.875rem; border: 1.5px solid #cdd8e3; border-radius: 0.625rem; font-size: 0.9375rem; color: #151d25; background: #fff; transition: border-color 0.15s ease; }
  .admin-input:focus { outline: none; border-color: #b05d45; }
  textarea.admin-input { resize: vertical; min-height: 80px; }
</style>

<script>
  const fetchBtn  = document.getElementById("fetch-btn")!;
  const fetchStatus = document.getElementById("fetch-status")!;
  const saveBtn   = document.getElementById("save-btn") as HTMLButtonElement;
  const summaryEl = document.getElementById("summary") as HTMLTextAreaElement;
  const wcDisplay = document.getElementById("word-count-display")!;

  // Word count check
  function wordCount(s: string) { return s.trim() === "" ? 0 : s.trim().split(/\s+/).length; }

  function updateSaveState() {
    const wc = wordCount(summaryEl.value);
    const headlineOk     = !!(document.getElementById("headline") as HTMLInputElement)?.value.trim();
    const publicationOk  = !!(document.getElementById("publication") as HTMLInputElement)?.value.trim();
    const urlOk          = !!(document.getElementById("url") as HTMLInputElement)?.value.trim();
    const summaryOk      = wc >= 20 && wc <= 200;

    wcDisplay.textContent = `${wc} words${summaryOk ? " ✓" : wc > 0 ? ` (need 20–200)` : ""}`;
    wcDisplay.style.color = summaryOk ? "#22c55e" : wc > 0 ? "#ef4444" : "#567798";
    saveBtn.disabled = !(headlineOk && publicationOk && urlOk && summaryOk);
  }

  document.querySelectorAll("#headline, #publication, #url, #summary").forEach(el => {
    el.addEventListener("input", updateSaveState);
  });

  // OG auto-fetch
  fetchBtn.addEventListener("click", async () => {
    const url = (document.getElementById("url") as HTMLInputElement).value.trim();
    if (!url) return;
    fetchStatus.textContent = "Fetching…";
    fetchBtn.disabled = true;
    try {
      const res  = await fetch(`/api/admin/og-fetch?url=${encodeURIComponent(url)}`);
      const json = await res.json() as {
        headline?: string; publication?: string;
        image_url?: string; summary?: string; published_date?: string;
        error?: string;
      };

      if (json.error) { fetchStatus.textContent = `⚠ Fetch failed: ${json.error} — fill fields manually.`; }
      else { fetchStatus.textContent = "✓ Auto-filled from page. Review and edit as needed."; fetchStatus.style.color = "#22c55e"; }

      if (json.headline)       (document.getElementById("headline")      as HTMLInputElement).value = json.headline;
      if (json.publication)    (document.getElementById("publication")   as HTMLInputElement).value = json.publication;
      if (json.image_url)      (document.getElementById("image_url")     as HTMLInputElement).value = json.image_url;
      if (json.summary)        summaryEl.value = json.summary;
      if (json.published_date) (document.getElementById("published_date") as HTMLInputElement).value = json.published_date;

      updateSaveState();
    } catch {
      fetchStatus.textContent = "⚠ Network error — fill fields manually.";
    } finally {
      fetchBtn.disabled = false;
    }
  });

  // Save
  saveBtn.addEventListener("click", async () => {
    const payload = {
      recordType:     "mention",
      url:            (document.getElementById("url")          as HTMLInputElement).value.trim(),
      headline:       (document.getElementById("headline")     as HTMLInputElement).value.trim(),
      publication:    (document.getElementById("publication")  as HTMLInputElement).value.trim(),
      image_url:      (document.getElementById("image_url")    as HTMLInputElement).value.trim() || "/og-default.jpg",
      summary:        summaryEl.value.trim(),
      published_date: (document.getElementById("published_date") as HTMLInputElement).value || null,
    };

    const res  = await fetch("/api/admin/press", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json() as { id?: string; error?: string; missing?: string[] };
    if (res.ok) { window.location.href = "/admin/press"; }
    else { alert(`Error: ${json.error}\n${json.missing?.join("\n") ?? ""}`); }
  });
</script>
```

- [ ] **Step 8: Create admin/press/media/new.astro (YouTube/podcast form)**

```astro
---
// src/pages/admin/press/media/new.astro
import AdminLayout from "@/layouts/AdminLayout.astro";
---

<AdminLayout title="Add Video/Podcast" activeSection="press">
  <div class="mb-6">
    <a href="/admin/press" class="text-[#567798] text-[13px] hover:text-[#151d25]">← Press</a>
    <h1 class="text-[#151d25] text-[26px] font-black tracking-tight mt-2">Add Video or Podcast</h1>
  </div>

  <div class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
    <div class="grid sm:grid-cols-2 gap-5">
      <div>
        <label class="admin-label" for="type">Type *</label>
        <select id="type" class="admin-input">
          <option value="youtube">YouTube Video</option>
          <option value="podcast">Podcast Episode</option>
        </select>
      </div>
      <div>
        <label class="admin-label" for="url">URL *</label>
        <div class="flex gap-2">
          <input id="url" type="url" required class="admin-input flex-1" placeholder="https://youtube.com/watch?v=..." />
          <button type="button" id="fetch-thumb-btn" class="bg-[#2c3e50] text-white text-[13px] font-bold px-4 py-2.5 rounded-xl hover:bg-[#1a2533] whitespace-nowrap">Auto-fill</button>
        </div>
        <p id="thumb-status" class="text-[12px] text-[#567798] mt-1"></p>
      </div>
      <div class="sm:col-span-2">
        <label class="admin-label" for="title">Title *</label>
        <input id="title" type="text" required class="admin-input" placeholder="How We Handle Water Damage in McKinney Homes" />
      </div>
      <div>
        <label class="admin-label" for="thumbnail_url">Thumbnail URL</label>
        <input id="thumbnail_url" type="url" class="admin-input" placeholder="Auto-fetched for YouTube" />
        <p id="thumb-preview-text" class="text-[12px] text-[#567798] mt-1"></p>
      </div>
      <!-- Podcast only: thumbnail upload -->
      <div id="podcast-upload-section" class="hidden">
        <label class="admin-label">Podcast Cover Art</label>
        <input id="podcast_thumb_file" type="file" accept="image/*" class="admin-input" />
      </div>
      <div>
        <label class="admin-label" for="published_date">Published Date</label>
        <input id="published_date" type="date" class="admin-input" />
      </div>
      <div>
        <label class="admin-label" for="sort_order">Sort Order <span class="text-[#567798] font-normal">(0 = first)</span></label>
        <input id="sort_order" type="number" class="admin-input" value="0" min="0" />
      </div>
      <div class="sm:col-span-2">
        <label class="admin-label" for="description">Description <span class="text-[#567798] font-normal">(optional)</span></label>
        <textarea id="description" rows="3" class="admin-input"></textarea>
      </div>
    </div>

    <div class="flex justify-end pt-6 border-t border-[#f0f2f4] mt-6">
      <button type="button" id="save-btn" class="bg-[#b05d45] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#8d4a37] transition-colors">Save</button>
    </div>
  </div>
</AdminLayout>

<style>
  .admin-label { display: block; font-size: 0.8125rem; font-weight: 700; color: #151d25; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .admin-input { width: 100%; padding: 0.625rem 0.875rem; border: 1.5px solid #cdd8e3; border-radius: 0.625rem; font-size: 0.9375rem; color: #151d25; background: #fff; transition: border-color 0.15s ease; }
  .admin-input:focus { outline: none; border-color: #b05d45; }
  textarea.admin-input { resize: vertical; min-height: 80px; }
</style>

<script>
  const typeSelect = document.getElementById("type") as HTMLSelectElement;
  const podcastSection = document.getElementById("podcast-upload-section")!;

  typeSelect.addEventListener("change", () => {
    const isYt = typeSelect.value === "youtube";
    podcastSection.classList.toggle("hidden", isYt);
    (document.getElementById("fetch-thumb-btn") as HTMLButtonElement).textContent = isYt ? "Auto-fill" : "Auto-fill";
    (document.getElementById("url") as HTMLInputElement).placeholder = isYt ? "https://youtube.com/watch?v=..." : "https://podcasts.apple.com/...";
  });

  // YouTube oEmbed auto-fetch
  document.getElementById("fetch-thumb-btn")!.addEventListener("click", async () => {
    if (typeSelect.value !== "youtube") return;
    const url     = (document.getElementById("url") as HTMLInputElement).value.trim();
    const status  = document.getElementById("thumb-status")!;
    if (!url) return;
    status.textContent = "Fetching YouTube info…";
    try {
      const res  = await fetch(`/api/admin/oembed?url=${encodeURIComponent(url)}`);
      const json = await res.json() as { thumbnail_url?: string; title?: string; error?: string };
      if (json.thumbnail_url) (document.getElementById("thumbnail_url") as HTMLInputElement).value = json.thumbnail_url;
      if (json.title)         (document.getElementById("title")         as HTMLInputElement).value = json.title;
      status.textContent = "✓ Auto-filled from YouTube";
      status.style.color = "#22c55e";
    } catch { status.textContent = "⚠ Fetch failed — enter manually"; }
  });

  // Podcast thumbnail upload
  document.getElementById("podcast_thumb_file")!.addEventListener("change", async function(this: HTMLInputElement) {
    const file = this.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "project-photos");
    fd.append("path", `media/${Date.now()}`);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const json = await res.json() as { url?: string };
    if (json.url) {
      (document.getElementById("thumbnail_url") as HTMLInputElement).value = json.url;
      document.getElementById("thumb-preview-text")!.textContent = `✓ ${file.name}`;
    }
  });

  // Save
  document.getElementById("save-btn")!.addEventListener("click", async () => {
    const payload = {
      recordType:     "media",
      type:           typeSelect.value,
      title:          (document.getElementById("title")         as HTMLInputElement).value.trim(),
      url:            (document.getElementById("url")           as HTMLInputElement).value.trim(),
      thumbnail_url:  (document.getElementById("thumbnail_url") as HTMLInputElement).value.trim(),
      description:    (document.getElementById("description")   as HTMLTextAreaElement).value.trim() || null,
      published_date: (document.getElementById("published_date") as HTMLInputElement).value || null,
      sort_order:     parseInt((document.getElementById("sort_order") as HTMLInputElement).value) || 0,
    };
    const res  = await fetch("/api/admin/press", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json() as { id?: string; error?: string };
    if (res.ok) { window.location.href = "/admin/press"; }
    else { alert(`Error: ${json.error}`); }
  });
</script>
```

- [ ] **Step 9: Verify all press/events pages render and TypeScript passes**

```bash
npx astro check && npm test
```

Expected: 0 TypeScript errors, all tests pass.

- [ ] **Step 10: Commit**

```bash
git add src/pages/api/admin/events.ts src/pages/api/admin/press.ts \
        src/pages/admin/events/ src/pages/admin/press/
git commit -m "feat: add events and press/media admin CRUD pages"
```

---

### Task 10: Services & Locations management (Agency Admin)

**Files:**
- Create: `supabase/migrations/003_services_locations.sql`
- Create: `src/pages/api/admin/services.ts`
- Create: `src/pages/api/admin/locations.ts`
- Create: `src/pages/admin/services/index.astro`
- Create: `src/pages/admin/services/new.astro`
- Create: `src/pages/admin/services/[slug].astro`
- Create: `src/pages/admin/locations/index.astro`
- Create: `src/pages/admin/locations/new.astro`
- Create: `src/pages/admin/locations/[slug].astro`
- Modify: `src/pages/services/[slug].astro`
- Modify: `src/pages/locations/[slug].astro`

- [ ] **Step 1: Create supabase/migrations/003_services_locations.sql**

```sql
-- supabase/migrations/003_services_locations.sql
-- Services and locations tables for Agency Admin management via admin UI.
-- Services/locations are managed exclusively by Agency Admin.
-- Public service and location pages query these tables (SSR).

-- ── Services ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS services (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        NOT NULL UNIQUE,
  name            TEXT        NOT NULL,
  description     TEXT        NOT NULL DEFAULT '',
  image_url       TEXT        NOT NULL DEFAULT '',
  cta             TEXT        NOT NULL DEFAULT 'Learn More',
  seo_title       TEXT        NOT NULL DEFAULT '',
  meta_description TEXT       NOT NULL DEFAULT '',
  h1              TEXT        NOT NULL DEFAULT '',
  body_html       TEXT        NOT NULL DEFAULT '',
  faq_items       JSONB       NOT NULL DEFAULT '[]',
  seo_doc_url     TEXT,       -- URL of uploaded SEO document (Supabase seo-documents bucket)
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  sort_order      INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Public can read active services
CREATE POLICY "services_public_read_active" ON services
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- service_role: full access (used by admin API routes)
CREATE POLICY "services_service_role_all" ON services
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Locations ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS locations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        NOT NULL UNIQUE,
  city            TEXT        NOT NULL,
  state           TEXT        NOT NULL DEFAULT 'TX',
  seo_title       TEXT        NOT NULL DEFAULT '',
  meta_description TEXT       NOT NULL DEFAULT '',
  h1              TEXT        NOT NULL DEFAULT '',
  body_html       TEXT        NOT NULL DEFAULT '',
  faq_items       JSONB       NOT NULL DEFAULT '[]',
  seo_doc_url     TEXT,       -- URL of uploaded SEO document
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  sort_order      INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_public_read_active" ON locations
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "locations_service_role_all" ON locations
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

- [ ] **Step 2: Apply migration 003**

In Supabase dashboard → SQL Editor → paste and run `supabase/migrations/003_services_locations.sql`.

- [ ] **Step 3: Update src/types/database.ts — add ServiceRow and LocationRow**

Append to `src/types/database.ts`:

```ts
// ── Services ──────────────────────────────────────────────────────────────────

export interface ServiceRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  cta: string;
  seo_title: string;
  meta_description: string;
  h1: string;
  body_html: string;
  faq_items: Array<{ question: string; answer: string }>;
  seo_doc_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface ServiceInsert {
  slug: string;
  name: string;
  description?: string;
  image_url?: string;
  cta?: string;
  seo_title?: string;
  meta_description?: string;
  h1?: string;
  body_html?: string;
  faq_items?: Array<{ question: string; answer: string }>;
  seo_doc_url?: string;
  is_active?: boolean;
  sort_order?: number;
}

// ── Locations ─────────────────────────────────────────────────────────────────

export interface LocationRow {
  id: string;
  slug: string;
  city: string;
  state: string;
  seo_title: string;
  meta_description: string;
  h1: string;
  body_html: string;
  faq_items: Array<{ question: string; answer: string }>;
  seo_doc_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface LocationInsert {
  slug: string;
  city: string;
  state?: string;
  seo_title?: string;
  meta_description?: string;
  h1?: string;
  body_html?: string;
  faq_items?: Array<{ question: string; answer: string }>;
  seo_doc_url?: string;
  is_active?: boolean;
  sort_order?: number;
}
```

Also add services and locations to the `Database` interface in the same file:

```ts
// Inside Database.public.Tables, add:
services: {
  Row: ServiceRow;
  Insert: ServiceInsert;
  Update: Partial<ServiceInsert>;
};
locations: {
  Row: LocationRow;
  Insert: LocationInsert;
  Update: Partial<LocationInsert>;
};
```

- [ ] **Step 4: Create src/pages/api/admin/services.ts**

```ts
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

  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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
```

- [ ] **Step 5: Create src/pages/api/admin/locations.ts**

Mirror `services.ts` exactly, replacing `"services"` table with `"locations"` and `"name"` field check with `"city"`. The uniqueSlug is generated from `city`.

```ts
// src/pages/api/admin/locations.ts
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
  if (!body.city) return new Response(JSON.stringify({ error: "City is required" }), { status: 400 });
  const supabase = createAdminClient();
  const slug = await uniqueSlug(body.city as string, async (s) => {
    const { data } = await supabase.from("locations").select("id").eq("slug", s).single();
    return !!data;
  });
  const { data, error } = await supabase.from("locations").insert({ ...body, slug }).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ slug: (data as any).slug }), { status: 201 });
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const user = await requireAgencyAdmin(cookies);
  if (!user) return new Response(JSON.stringify({ error: "Agency Admin access required" }), { status: 403 });
  const { id, ...fields } = await request.json() as Record<string, unknown> & { id: string };
  const { data, error } = await createAdminClient().from("locations").update(fields).eq("id", id).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ slug: (data as any).slug }), { status: 200 });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const user = await requireAgencyAdmin(cookies);
  if (!user) return new Response(JSON.stringify({ error: "Agency Admin access required" }), { status: 403 });
  const { id } = await request.json() as { id: string };
  const { error } = await createAdminClient().from("locations").delete().eq("id", id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
```

- [ ] **Step 6: Create admin/services/index.astro**

```astro
---
// src/pages/admin/services/index.astro
import AdminLayout from "@/layouts/AdminLayout.astro";
import { createAdminClient } from "@/lib/supabase";
import type { ServiceRow } from "@/types/database";

// Agency Admin gate — enforce in middleware; double-check here
if (Astro.locals.user?.role !== "agency_admin") return Astro.redirect("/admin");

const { data } = await createAdminClient()
  .from("services")
  .select("id, slug, name, is_active, sort_order, seo_doc_url, updated_at")
  .order("sort_order");

const services = (data ?? []) as Pick<ServiceRow, "id" | "slug" | "name" | "is_active" | "sort_order" | "seo_doc_url" | "updated_at">[];
---

<AdminLayout title="Services" activeSection="services">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-[#151d25] text-[28px] font-black tracking-tight">Services</h1>
      <p class="text-[#567798] text-[14px] mt-1">Agency Admin only · {services.filter(s => s.is_active).length} active</p>
    </div>
    <a href="/admin/services/new" class="inline-flex items-center gap-2 bg-[#b05d45] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl hover:bg-[#8d4a37] transition-colors">+ New Service</a>
  </div>

  {services.length === 0 ? (
    <div class="text-center py-16 bg-white rounded-2xl border border-[#cdd8e3] text-[#567798]">No services yet.</div>
  ) : (
    <div class="bg-white rounded-2xl border border-[#cdd8e3] overflow-hidden">
      <table class="w-full text-[13px]">
        <thead class="bg-[#f0f2f4] border-b border-[#cdd8e3]">
          <tr>
            <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px]">Service</th>
            <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px] hidden sm:table-cell">Status</th>
            <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px] hidden lg:table-cell">SEO Doc</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f0f2f4]">
          {services.map((s) => (
            <tr class="hover:bg-[#f8fafc]">
              <td class="px-5 py-4">
                <p class="text-[#151d25] font-semibold">{s.name}</p>
                <p class="text-[#567798] text-[12px] font-mono">/services/{s.slug}</p>
              </td>
              <td class="px-5 py-4 hidden sm:table-cell">
                <span class={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${s.is_active ? "bg-[#dcfce7] text-[#166534]" : "bg-[#f0f2f4] text-[#567798]"}`}>
                  {s.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td class="px-5 py-4 hidden lg:table-cell">
                {s.seo_doc_url ? (
                  <a href={s.seo_doc_url} target="_blank" rel="noopener noreferrer" class="text-[#b05d45] text-[12px] hover:underline">View Doc ↗</a>
                ) : (
                  <span class="text-[#567798] text-[12px]">None</span>
                )}
              </td>
              <td class="px-5 py-4 text-right">
                <a href={`/admin/services/${s.slug}`} class="text-[#b05d45] font-semibold hover:underline">Edit</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</AdminLayout>
```

- [ ] **Step 7: Create admin/services/new.astro**

```astro
---
// src/pages/admin/services/new.astro
import AdminLayout from "@/layouts/AdminLayout.astro";
if (Astro.locals.user?.role !== "agency_admin") return Astro.redirect("/admin");
---

<AdminLayout title="New Service" activeSection="services">
  <div class="mb-6">
    <a href="/admin/services" class="text-[#567798] text-[13px] hover:text-[#151d25]">← Services</a>
    <h1 class="text-[#151d25] text-[26px] font-black tracking-tight mt-2">New Service</h1>
  </div>

  <form id="service-form" class="flex flex-col gap-8">

    <!-- Section 1: Basics -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">1. Basics</h2>
      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="admin-label" for="name">Service Name *</label>
          <input id="name" name="name" type="text" required class="admin-input" placeholder="Drywall Repair" />
        </div>
        <div>
          <label class="admin-label" for="cta">CTA Text *</label>
          <input id="cta" name="cta" type="text" required class="admin-input" placeholder="Get a Free Estimate" value="Get a Free Estimate" />
        </div>
        <div class="sm:col-span-2">
          <label class="admin-label" for="description">Short Description *</label>
          <textarea id="description" name="description" required rows="3" class="admin-input" placeholder="One-paragraph service description for cards and listings…"></textarea>
        </div>
      </div>
    </section>

    <!-- Section 2: Service Image -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">2. Service Image</h2>
      <input id="image_file" type="file" accept="image/*" class="admin-input mb-2" />
      <input id="image_url" name="image_url" type="hidden" value="" />
      <p id="image_preview" class="text-[12px] text-[#567798]"></p>
    </section>

    <!-- Section 3: SEO Content -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">3. SEO Content</h2>
      <div class="flex flex-col gap-5">
        <div>
          <label class="admin-label" for="seo_title">SEO Title</label>
          <input id="seo_title" name="seo_title" type="text" class="admin-input" placeholder="Drywall Repair McKinney TX | Business Name" />
        </div>
        <div>
          <label class="admin-label" for="meta_description">Meta Description</label>
          <textarea id="meta_description" name="meta_description" rows="2" class="admin-input" placeholder="155-char meta description…"></textarea>
        </div>
        <div>
          <label class="admin-label" for="h1">H1 Heading</label>
          <input id="h1" name="h1" type="text" class="admin-input" placeholder="Professional Drywall Repair in McKinney, TX" />
        </div>
        <div>
          <label class="admin-label" for="body_html">Page Body HTML</label>
          <textarea id="body_html" name="body_html" rows="8" class="admin-input font-mono text-[13px]" placeholder="<p>Full service page content…</p>"></textarea>
        </div>
      </div>
    </section>

    <!-- Section 4: FAQs -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">4. FAQs</h2>
      <div id="faq-list" class="flex flex-col gap-4 mb-4"></div>
      <button type="button" id="add-faq" class="text-[#b05d45] text-[13px] font-semibold hover:underline">+ Add FAQ</button>
    </section>

    <!-- Section 5: SEO Document Upload -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">5. SEO Document</h2>
      <p class="text-[#567798] text-[14px] mb-4">Upload a PDF or document (SEO brief, content strategy, keyword research).</p>
      <input id="seo_doc_file" type="file" accept=".pdf,.doc,.docx,.txt" class="admin-input mb-2" />
      <input id="seo_doc_url" name="seo_doc_url" type="hidden" value="" />
      <p id="seo_doc_preview" class="text-[12px] text-[#567798]"></p>
    </section>

    <!-- Settings -->
    <section class="bg-white rounded-2xl border border-[#cdd8e3] p-7">
      <h2 class="text-[#151d25] font-black text-[17px] mb-6 pb-4 border-b border-[#f0f2f4]">Settings</h2>
      <div class="flex items-center gap-4">
        <label class="flex items-center gap-3 cursor-pointer">
          <input id="is_active" name="is_active" type="checkbox" checked class="w-4 h-4 accent-[#b05d45]" />
          <span class="text-[14px] font-medium text-[#151d25]">Active (visible on public site)</span>
        </label>
        <div>
          <label class="admin-label inline" for="sort_order">Sort Order</label>
          <input id="sort_order" name="sort_order" type="number" class="admin-input w-24 ml-2" value="0" min="0" />
        </div>
      </div>
    </section>

    <div class="flex justify-between pt-2">
      <a href="/admin/services" class="btn-secondary">Cancel</a>
      <button type="button" id="save-btn" class="bg-[#b05d45] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#8d4a37] transition-colors">Create Service</button>
    </div>
  </form>
</AdminLayout>

<style>
  .admin-label { display: block; font-size: 0.8125rem; font-weight: 700; color: #151d25; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .admin-input { width: 100%; padding: 0.625rem 0.875rem; border: 1.5px solid #cdd8e3; border-radius: 0.625rem; font-size: 0.9375rem; color: #151d25; background: #fff; transition: border-color 0.15s ease; }
  .admin-input:focus { outline: none; border-color: #b05d45; }
  textarea.admin-input { resize: vertical; min-height: 80px; }
</style>

<script>
  // FAQ dynamic rows
  const faqList = document.getElementById("faq-list")!;
  let faqCount  = 0;

  document.getElementById("add-faq")!.addEventListener("click", () => {
    faqCount++;
    const row = document.createElement("div");
    row.className = "flex flex-col gap-2 p-4 border border-[#cdd8e3] rounded-xl faq-row";
    row.innerHTML = `
      <input type="text" name="faq_q[]" class="admin-input" placeholder="Question ${faqCount}" />
      <textarea name="faq_a[]" rows="2" class="admin-input" placeholder="Answer"></textarea>
      <button type="button" class="remove-faq text-[#ef4444] text-[12px] font-semibold text-right hover:underline">Remove</button>
    `;
    row.querySelector(".remove-faq")!.addEventListener("click", () => row.remove());
    faqList.appendChild(row);
  });

  // Image upload
  async function uploadFile(fileInput: HTMLInputElement, urlInput: HTMLInputElement, previewEl: HTMLElement, bucket: string, pathPrefix: string) {
    const file = fileInput.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", bucket);
    fd.append("path", `${pathPrefix}/${Date.now()}`);
    previewEl.textContent = "Uploading…";
    try {
      const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string };
      if (json.url) {
        urlInput.value = json.url;
        previewEl.textContent = `✓ ${file.name}`;
        previewEl.style.color = "#22c55e";
      } else {
        previewEl.textContent = `✗ ${json.error}`;
        previewEl.style.color = "#ef4444";
      }
    } catch { previewEl.textContent = "✗ Upload error"; previewEl.style.color = "#ef4444"; }
  }

  document.getElementById("image_file")!.addEventListener("change", function(this: HTMLInputElement) {
    uploadFile(this, document.getElementById("image_url") as HTMLInputElement, document.getElementById("image_preview")!, "project-photos", "services");
  });

  document.getElementById("seo_doc_file")!.addEventListener("change", function(this: HTMLInputElement) {
    uploadFile(this, document.getElementById("seo_doc_url") as HTMLInputElement, document.getElementById("seo_doc_preview")!, "seo-documents", "services");
  });

  // Save
  document.getElementById("save-btn")!.addEventListener("click", async () => {
    const faqs = Array.from(document.querySelectorAll<HTMLElement>(".faq-row")).map(row => ({
      question: (row.querySelector<HTMLInputElement>("[name='faq_q[]']"))!.value.trim(),
      answer:   (row.querySelector<HTMLTextAreaElement>("[name='faq_a[]']"))!.value.trim(),
    })).filter(f => f.question && f.answer);

    const payload = {
      name:             (document.getElementById("name")             as HTMLInputElement).value.trim(),
      cta:              (document.getElementById("cta")              as HTMLInputElement).value.trim(),
      description:      (document.getElementById("description")      as HTMLTextAreaElement).value.trim(),
      image_url:        (document.getElementById("image_url")        as HTMLInputElement).value.trim(),
      seo_title:        (document.getElementById("seo_title")        as HTMLInputElement).value.trim(),
      meta_description: (document.getElementById("meta_description") as HTMLTextAreaElement).value.trim(),
      h1:               (document.getElementById("h1")               as HTMLInputElement).value.trim(),
      body_html:        (document.getElementById("body_html")        as HTMLTextAreaElement).value.trim(),
      faq_items:        faqs,
      seo_doc_url:      (document.getElementById("seo_doc_url")      as HTMLInputElement).value.trim() || null,
      is_active:        (document.getElementById("is_active")        as HTMLInputElement).checked,
      sort_order:       parseInt((document.getElementById("sort_order") as HTMLInputElement).value) || 0,
    };

    const res  = await fetch("/api/admin/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json() as { slug?: string; error?: string };
    if (res.ok && json.slug) { window.location.href = `/admin/services/${json.slug}`; }
    else { alert(`Error: ${json.error}`); }
  });
</script>
```

- [ ] **Step 8: Create admin/services/[slug].astro**

Mirror the new form with Supabase prefill (same pattern as projects/[slug].astro):
- Fetch service by slug: `supabase.from("services").select("*").eq("slug", slug).single()`
- Prefill all fields
- FAQ rows prefilled from `s.faq_items` array
- Submit sends PUT with `{ id: s.id, ...fields }`
- Show existing SEO doc link with option to upload replacement
- Delete button with confirm dialog

- [ ] **Step 9: Create admin/locations/index.astro, new.astro, [slug].astro**

Mirror services pages exactly, with these field differences:
- `city` (text, required) instead of `name`
- `state` (text, default "TX") instead of `cta`
- No `image_url` field (locations don't have images in the spec)
- Same SEO fields (seo_title, meta_description, h1, body_html, faq_items, seo_doc_url)
- Same SEO document upload

- [ ] **Step 10: Update src/pages/services/[slug].astro to query Supabase**

The existing file uses `SERVICES_CONTENT[slug]` from `src/data/services.ts`. Replace with Supabase query:

```ts
// Replace the existing frontmatter in src/pages/services/[slug].astro

---
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
import { createServerClient } from "@/lib/supabase";
import type { ServiceRow } from "@/types/database";
import { BUSINESS_NAME, PHONE_RAW, PHONE_DISPLAY, SITE_URL } from "@/config/site";

const { slug } = Astro.params;
const supabase = createServerClient();
const { data, error } = await supabase
  .from("services")
  .select("*")
  .eq("slug", slug)
  .eq("is_active", true)
  .single();

if (error || !data) return Astro.redirect("/404");

const service = data as ServiceRow;

const breadcrumbSchema = { /* ... same as before, use service.seo_title */ };
const faqSchema = service.faq_items.length > 0 ? { /* FAQPage schema using service.faq_items */ } : null;
---
```

The HTML section should use `service.h1`, `service.body_html` (rendered with `set:html`), `service.description`, `service.faq_items`.

- [ ] **Step 11: Update src/pages/locations/[slug].astro to query Supabase**

Same pattern as services/[slug].astro — replace hardcoded/Rankability lookup with Supabase query on `locations` table.

- [ ] **Step 12: Run TypeScript check and tests**

```bash
npx astro check && npm test
```

Expected: 0 errors, all tests pass.

- [ ] **Step 13: Commit**

```bash
git add supabase/migrations/003_services_locations.sql \
        src/types/database.ts \
        src/pages/api/admin/services.ts src/pages/api/admin/locations.ts \
        src/pages/admin/services/ src/pages/admin/locations/ \
        src/pages/services/[slug].astro src/pages/locations/[slug].astro
git commit -m "feat: add services/locations DB tables and Agency Admin management interface"
```

---

### Task 11: Users management + Profile page

**Files:**
- Create: `src/pages/admin/users/index.astro`
- Create: `src/pages/admin/users/invite.astro`
- Create: `src/pages/admin/profile.astro`

- [ ] **Step 1: Create admin/users/index.astro (Agency Admin only)**

```astro
---
// src/pages/admin/users/index.astro
import AdminLayout from "@/layouts/AdminLayout.astro";
import { getWorkOSClient } from "@/lib/workos";
if (Astro.locals.user?.role !== "agency_admin") return Astro.redirect("/admin");

const workos = getWorkOSClient();

// List all users in the organization
// Note: requires WORKOS_ORGANIZATION_ID env var to be set
const orgId = import.meta.env.WORKOS_ORGANIZATION_ID as string | undefined;
let memberships: Array<{ userId: string; email: string; role: string }> = [];

if (orgId) {
  try {
    const result = await workos.userManagement.listOrganizationMemberships({ organizationId: orgId });
    memberships = await Promise.all(
      result.data.map(async (m) => {
        const user = await workos.userManagement.getUser(m.userId);
        return {
          userId: m.userId,
          email:  user.email,
          role:   m.role?.slug ?? "worker",
        };
      })
    );
  } catch (err) {
    console.error("[admin/users] Failed to list members:", err);
  }
}
---

<AdminLayout title="Users" activeSection="users">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-[#151d25] text-[28px] font-black tracking-tight">Users</h1>
      <p class="text-[#567798] text-[14px] mt-1">Agency Admin only · {memberships.length} members</p>
    </div>
    <a href="/admin/users/invite" class="inline-flex items-center gap-2 bg-[#b05d45] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl hover:bg-[#8d4a37] transition-colors">
      + Invite User
    </a>
  </div>

  {!orgId && (
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-800 text-[14px] mb-6">
      <strong>Setup needed:</strong> Add <code>WORKOS_ORGANIZATION_ID</code> to your environment variables to manage users.
    </div>
  )}

  {memberships.length === 0 ? (
    <div class="text-center py-16 bg-white rounded-2xl border border-[#cdd8e3] text-[#567798]">
      {orgId ? "No users yet." : "Set WORKOS_ORGANIZATION_ID to see users."}
    </div>
  ) : (
    <div class="bg-white rounded-2xl border border-[#cdd8e3] overflow-hidden">
      <table class="w-full text-[13px]">
        <thead class="bg-[#f0f2f4] border-b border-[#cdd8e3]">
          <tr>
            <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px]">Email</th>
            <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px]">Role</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f0f2f4]">
          {memberships.map((m) => (
            <tr class="hover:bg-[#f8fafc]">
              <td class="px-5 py-4 text-[#151d25] font-medium">{m.email}</td>
              <td class="px-5 py-4">
                <span class="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#f0f2f4] text-[#567798]">
                  {m.role.replace("_", " ")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</AdminLayout>
```

- [ ] **Step 2: Create admin/users/invite.astro**

```astro
---
// src/pages/admin/users/invite.astro
import AdminLayout from "@/layouts/AdminLayout.astro";
import { getWorkOSClient } from "@/lib/workos";
if (Astro.locals.user?.role !== "agency_admin") return Astro.redirect("/admin");

let successEmail = "";
let inviteError  = "";

if (Astro.request.method === "POST") {
  const form  = await Astro.request.formData();
  const email = form.get("email") as string;
  const role  = form.get("role")  as string;
  const orgId = import.meta.env.WORKOS_ORGANIZATION_ID as string;

  try {
    const workos = getWorkOSClient();
    await workos.userManagement.sendInvitation({
      email,
      organizationId: orgId,
      roleSlug:       role,
    });
    successEmail = email;
  } catch (err) {
    inviteError = (err as Error).message;
  }
}
---

<AdminLayout title="Invite User" activeSection="users">
  <div class="mb-6">
    <a href="/admin/users" class="text-[#567798] text-[13px] hover:text-[#151d25]">← Users</a>
    <h1 class="text-[#151d25] text-[26px] font-black tracking-tight mt-2">Invite User</h1>
  </div>

  {successEmail && (
    <div class="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-5 text-[#166534] mb-6">
      ✓ Invitation sent to <strong>{successEmail}</strong>
    </div>
  )}

  {inviteError && (
    <div class="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-5 text-[#991b1b] mb-6">
      ✗ {inviteError}
    </div>
  )}

  <form method="POST" class="bg-white rounded-2xl border border-[#cdd8e3] p-7 flex flex-col gap-5 max-w-[480px]">
    <div>
      <label class="admin-label" for="email">Email Address *</label>
      <input id="email" name="email" type="email" required class="admin-input" placeholder="worker@company.com" />
    </div>
    <div>
      <label class="admin-label" for="role">Role *</label>
      <select id="role" name="role" required class="admin-input">
        <option value="worker">Worker — can create drafts, cannot publish</option>
        <option value="client_admin">Client Admin — can publish, manage their team</option>
        <option value="agency_admin">Agency Admin — full access</option>
      </select>
    </div>
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-[13px]">
      The user will receive an email with a link to set up their account. Their role is set immediately upon acceptance.
    </div>
    <button type="submit" class="bg-[#b05d45] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#8d4a37] transition-colors">
      Send Invitation
    </button>
  </form>
</AdminLayout>

<style>
  .admin-label { display: block; font-size: 0.8125rem; font-weight: 700; color: #151d25; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .admin-input { width: 100%; padding: 0.625rem 0.875rem; border: 1.5px solid #cdd8e3; border-radius: 0.625rem; font-size: 0.9375rem; color: #151d25; background: #fff; transition: border-color 0.15s ease; }
  .admin-input:focus { outline: none; border-color: #b05d45; }
</style>
```

- [ ] **Step 3: Create admin/profile.astro**

```astro
---
// src/pages/admin/profile.astro
// Three sections: Tasks to Complete, Add New Record, My Published Records
import AdminLayout from "@/layouts/AdminLayout.astro";
import { createAdminClient } from "@/lib/supabase";
import { getProjectReadiness, getEventReadiness } from "@/lib/admin";
import type { ProjectRow, EventRow } from "@/types/database";

const user     = Astro.locals.user!;
const supabase = createAdminClient();
const isAdmin  = user.role === "agency_admin" || user.role === "client_admin";

// Fetch drafts
const [projectsRes, eventsRes] = await Promise.all([
  supabase.from("projects").select("*").eq("status", "draft")
    .order("updated_at", { ascending: false, nullsFirst: false }),
  supabase.from("events").select("*").eq("status", "draft")
    .order("updated_at", { ascending: false, nullsFirst: false }),
]);

let draftProjects = (projectsRes.data ?? []) as ProjectRow[];
let draftEvents   = (eventsRes.data ?? []) as EventRow[];

// Workers: filter to only their own drafts
if (!isAdmin) {
  draftProjects = draftProjects.filter(p => p.created_by === user.id);
  draftEvents   = draftEvents.filter(e => e.created_by === user.id);
}

// Compute readiness for each draft
const projectTasks = draftProjects.map(p => ({
  type:     "Project" as const,
  title:    p.title,
  slug:     p.slug,
  editUrl:  `/admin/projects/${p.slug}`,
  readiness: getProjectReadiness(p as any),
}));

const eventTasks = draftEvents.map(e => ({
  type:     "Event" as const,
  title:    e.title,
  slug:     e.slug,
  editUrl:  `/admin/events/${e.slug}`,
  readiness: getEventReadiness(e as any),
}));

const allTasks = [...projectTasks, ...eventTasks]
  .sort((a, b) => b.readiness.percent - a.readiness.percent); // closest to complete first

// My published records
const [pubProjectsRes, pubEventsRes] = await Promise.all([
  supabase.from("projects").select("id, slug, title, published_at, created_by").eq("status", "published")
    .order("published_at", { ascending: false }),
  supabase.from("events").select("id, slug, title, event_date, created_by").eq("status", "published")
    .order("event_date", { ascending: false }),
]);

const myPublishedProjects = (pubProjectsRes.data ?? [])
  .filter(p => isAdmin || p.created_by === user.id);
const myPublishedEvents   = (pubEventsRes.data ?? [])
  .filter(e => isAdmin || e.created_by === user.id);
---

<AdminLayout title="Profile" activeSection="profile">
  <div class="mb-8">
    <h1 class="text-[#151d25] text-[28px] font-black tracking-tight">
      {user.firstName ? `${user.firstName}'s Profile` : "My Profile"}
    </h1>
    <p class="text-[#567798] text-[14px] mt-1">{user.email} · {user.role.replace("_", " ")}</p>
  </div>

  <!-- ── Section 1: Tasks to Complete ─────────────────────────────────── -->
  <section class="mb-10">
    <h2 class="text-[#151d25] font-black text-[20px] mb-5 flex items-center gap-3">
      <span class="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-600 text-[14px] font-black">{allTasks.length}</span>
      Tasks to Complete
    </h2>

    {allTasks.length === 0 ? (
      <div class="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-8 text-center text-[#166534]">
        ✓ No incomplete drafts — you're all caught up!
      </div>
    ) : (
      <div class="flex flex-col gap-4">
        {allTasks.map(({ type, title, editUrl, readiness }) => {
          const pct   = readiness.percent;
          const color = pct < 50 ? "#ef4444" : pct < 90 ? "#f59e0b" : "#22c55e";
          return (
            <div class="bg-white rounded-2xl border-2 border-amber-200 p-5">
              <div class="flex items-start gap-4">
                <span class="text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#f0f2f4] text-[#567798] shrink-0 mt-0.5">
                  {type}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-[#151d25] font-semibold truncate">{title}</p>
                  <!-- Readiness bar -->
                  <div class="flex items-center gap-3 mt-2">
                    <div class="flex-1 h-1.5 bg-[#e8edf2] rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all" style={`width: ${pct}%; background: ${color};`}></div>
                    </div>
                    <span class="text-[12px] text-[#567798] whitespace-nowrap shrink-0">{readiness.filled}/{readiness.total}</span>
                  </div>
                  {readiness.missing.length > 0 && (
                    <p class="text-[#567798] text-[12px] mt-1">Missing: {readiness.missing.join(", ")}</p>
                  )}
                </div>
                <a href={editUrl} class="shrink-0 bg-[#b05d45] text-white text-[12px] font-bold px-4 py-2 rounded-lg hover:bg-[#8d4a37] transition-colors whitespace-nowrap">
                  Edit →
                </a>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </section>

  <!-- ── Section 2: Add New Record ─────────────────────────────────────── -->
  <section class="mb-10">
    <h2 class="text-[#151d25] font-black text-[20px] mb-5">Add New Record</h2>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: "New Project",     href: "/admin/projects/new", show: true },
        { label: "New Event",       href: "/admin/events/new",   show: true },
        { label: "Press Mention",   href: "/admin/press/mentions/new", show: isAdmin },
        { label: "Video/Podcast",   href: "/admin/press/media/new",   show: isAdmin },
      ].filter(t => t.show).map(({ label, href }) => (
        <a href={href} class="flex flex-col items-center justify-center gap-2 bg-white border-2 border-[#cdd8e3] rounded-2xl p-6 hover:border-[#b05d45] hover:shadow-md transition-all text-center group">
          <span class="w-10 h-10 rounded-full bg-[#f0f2f4] group-hover:bg-[#b05d45]/10 flex items-center justify-center text-[20px] transition-colors">+</span>
          <span class="text-[#151d25] text-[13px] font-bold">{label}</span>
        </a>
      ))}
    </div>
  </section>

  <!-- ── Section 3: My Published Records ──────────────────────────────── -->
  <section>
    <h2 class="text-[#151d25] font-black text-[20px] mb-5">
      {isAdmin ? "All Published Records" : "My Published Records"}
    </h2>

    {myPublishedProjects.length === 0 && myPublishedEvents.length === 0 ? (
      <div class="bg-[#f0f2f4] rounded-2xl p-8 text-center text-[#567798]">
        No published records yet.
      </div>
    ) : (
      <div class="bg-white rounded-2xl border border-[#cdd8e3] overflow-hidden">
        <table class="w-full text-[13px]">
          <thead class="bg-[#f0f2f4] border-b border-[#cdd8e3]">
            <tr>
              <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px]">Record</th>
              <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px] hidden sm:table-cell">Type</th>
              <th class="text-left px-5 py-3 text-[#567798] font-bold uppercase tracking-wider text-[11px] hidden lg:table-cell">Published</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#f0f2f4]">
            {myPublishedProjects.map(p => (
              <tr class="hover:bg-[#f8fafc]">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-[#22c55e] shrink-0"></span>
                    <span class="text-[#151d25] font-semibold">{p.title}</span>
                  </div>
                </td>
                <td class="px-5 py-4 text-[#567798] hidden sm:table-cell">Project</td>
                <td class="px-5 py-4 text-[#567798] hidden lg:table-cell">
                  {p.published_at ? new Date(p.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </td>
                <td class="px-5 py-4 text-right">
                  <a href={`/admin/projects/${p.slug}`} class="text-[#b05d45] font-semibold hover:underline text-[12px]">Edit</a>
                </td>
              </tr>
            ))}
            {myPublishedEvents.map(e => (
              <tr class="hover:bg-[#f8fafc]">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-[#22c55e] shrink-0"></span>
                    <span class="text-[#151d25] font-semibold">{e.title}</span>
                  </div>
                </td>
                <td class="px-5 py-4 text-[#567798] hidden sm:table-cell">Event</td>
                <td class="px-5 py-4 text-[#567798] hidden lg:table-cell">
                  {new Date(e.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td class="px-5 py-4 text-right">
                  <a href={`/admin/events/${e.slug}`} class="text-[#b05d45] font-semibold hover:underline text-[12px]">Edit</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
</AdminLayout>
```

- [ ] **Step 4: Verify TypeScript and tests**

```bash
npx astro check && npm test
```

Expected: 0 errors, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/users/ src/pages/admin/profile.astro
git commit -m "feat: add users management and profile page with Tasks to Complete"
```

---

## Self-Review

**Spec coverage:**
- ✅ WorkOS AuthKit middleware protects all /admin/* routes
- ✅ Three roles: agency_admin, client_admin, worker
- ✅ Publish button hidden for Workers (not just disabled)
- ✅ Publish gate enforced server-side in all CRUD endpoints
- ✅ Real-time readiness progress bar (vanilla JS, client-side)
- ✅ Amber disclaimer banner on every admin page
- ✅ Single scrollable page with sections for all forms
- ✅ Dark sidebar nav with agency_admin-only sections
- ✅ Projects: full form (5 sections), photo upload, scope items
- ✅ Events: full form (4 sections), photo upload, local links
- ✅ Press mentions: URL intake → OG auto-fetch → placeholder fallback → summary word count gate
- ✅ OG fetch runs server-side only
- ✅ Media items: YouTube oEmbed auto-fill, podcast thumbnail upload
- ✅ /admin/press lists both press mentions and media items
- ✅ Users: list members, invite with role assignment (Agency Admin only)
- ✅ Profile: Tasks to Complete (sorted by progress, closest first), Add New tiles, Published Records
- ✅ Profile: Workers see only own drafts; Admins see all
- ✅ File upload API supports images + PDFs, max 10MB
- ✅ GHL notify called fire-and-forget on all publish actions
- ✅ Services management (Agency Admin only): CRUD + SEO doc upload
- ✅ Locations management (Agency Admin only): CRUD + SEO doc upload
- ✅ /services/[slug] and /locations/[slug] updated to query Supabase
- ✅ Slug auto-generation with collision resolution
- ✅ Unpublish sets status back to draft (edit-then-republish pattern)

**Env vars required before deployment:**
- `WORKOS_API_KEY`
- `WORKOS_CLIENT_ID`
- `WORKOS_COOKIE_PASSWORD` (32+ chars)
- `WORKOS_ORGANIZATION_ID` (for user management)
- `PUBLIC_APP_URL` (full app URL)
- `PUBLIC_GOOGLE_MAPS_KEY` (for event maps)
- `PUBLIC_SUPABASE_ANON_KEY` (if not already set)

**GHL Custom Objects must be created manually** per spec Section 7 before the GHL notify endpoint will successfully upsert records.

**Storage buckets to create in Supabase:**
- `project-photos` (public)
- `seo-documents` (public)
