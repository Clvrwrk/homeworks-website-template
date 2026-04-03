// src/lib/workos.ts
// WorkOS AuthKit — session management for admin interface.
// All functions are server-only. Never import this in client-side code.

import { WorkOS, type User } from "@workos-inc/node";

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

    const result = await workos.userManagement.authenticateWithSessionCookie({
      sessionData: sealedSession,
      cookiePassword: cookiePass,
    });
    const { user, organizationId } = result as any;

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
