# WorkOS Setup Guide — Homeworks Website Template

Complete this checklist before testing Plan 3 (Admin Interface). Code can be written without it, but auth will not work until all steps are done.

---

## Step 1 — Create WorkOS Application

1. Log in at [dashboard.workos.com](https://dashboard.workos.com)
2. Click **Create Application**
3. Name: `Homeworks Website Template` (or the client's brand name)
4. Type: **Web application**
5. Click **Create**

### Collect API Keys

From **API Keys** in the sidebar:

| Variable | Where to find it |
|----------|-----------------|
| `WORKOS_API_KEY` | "Secret Key" — starts with `sk_live_` |
| `WORKOS_CLIENT_ID` | "Client ID" — starts with `client_` |

---

## Step 2 — Register Redirect URIs

In **Redirects** → **Sign-in callback URIs**, add all three:

| Environment | URI |
|-------------|-----|
| Local | `http://localhost:4321/callback` |
| Testing/Staging | `https://testing.yourdomain.com/callback` |
| Production | `https://yourdomain.com/callback` |

In **Redirects** → **Sign-out URIs**, add:

| Environment | URI |
|-------------|-----|
| Local | `http://localhost:4321` |
| Staging | `https://testing.yourdomain.com` |
| Production | `https://yourdomain.com` |

---

## Step 3 — Create Organization

1. In the sidebar click **Organizations** → **Create Organization**
2. Name: client's company name (e.g., `Homeworks Advantage`)
3. Domains: add their email domain (e.g., `homeworksadvantage.com`)
4. Note the **Organization ID** — you'll need it for seeding users

---

## Step 4 — Create Roles

WorkOS AuthKit supports custom roles. Create these three:

1. In the sidebar click **User Management** → **Roles** → **Create Role**

| Role slug | Display name | Purpose |
|-----------|-------------|---------|
| `agency_admin` | Agency Admin | Full access — publish, delete, manage all content |
| `client_admin` | Client Admin | Can publish and edit, cannot delete |
| `worker` | Worker | Read-only + upload only, no publish button |

> The publish button is **hidden** (not disabled) for the `worker` role — enforced in the admin UI.

---

## Step 5 — Invite First User

1. **User Management** → **Users** → **Invite User**
2. Enter email address
3. Select the organization created in Step 3
4. Assign role: `agency_admin` for the first admin
5. Send invite

---

## Step 6 — Generate Cookie Password

WorkOS AuthKit uses a cookie-based session. Generate a strong 32+ character random string:

```bash
openssl rand -base64 32
```

Set this as `WORKOS_COOKIE_PASSWORD` in your `.env` and in Coolify.

---

## Step 7 — Set Environment Variables

### Local (`.env`)

```
WORKOS_API_KEY=sk_live_...
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD=<generated above>
```

### Coolify

In your Coolify service → **Environment Variables**, add the same three variables.

> Never use `PUBLIC_` prefix on any WorkOS variable — all are server-side secrets.

---

## Step 8 — Verification Checklist

- [ ] Visit `http://localhost:4321` — redirects to WorkOS login page (not a blank screen or 500)
- [ ] Log in with invited user — lands on `/dashboard/c-suite` (agency_admin) or `/dashboard/ops` (worker)
- [ ] Visit `/callback` directly — returns 400 "Missing code" (not a 500 — means the route exists)
- [ ] Log out — redirects back to login page
- [ ] Worker role user: publish button is hidden on admin content pages

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Invalid redirect URI" on login | Add exact URI (including `/callback`) to WorkOS dashboard Redirects |
| Cookie not persisting between requests | Check `WORKOS_COOKIE_PASSWORD` is set and is 32+ chars |
| User lands on wrong dashboard after login | Check role assignment in WorkOS User Management |
| `authkitMiddleware` not protecting routes | Verify `middleware.ts` is at `src/middleware.ts` (Astro convention) |
| 500 on `/callback` | Check `WORKOS_API_KEY` and `WORKOS_CLIENT_ID` are set correctly in `.env` |
| Organization not found | Confirm user was invited to the correct organization (not just created as a standalone user) |
