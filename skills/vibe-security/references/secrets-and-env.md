# Secrets & Environment Variables

Never hardcode API keys, tokens, passwords, or credentials in source code. If a secret was ever committed to Git history, consider it compromised — rotate it immediately.

## Client-Side Prefixes (bundle = public)

| Framework | Client Prefix |
|-----------|---------------|
| Next.js | `NEXT_PUBLIC_` |
| Vite | `VITE_` |
| Expo | `EXPO_PUBLIC_` |
| CRA | `REACT_APP_` |

**Never client-side:** `service_role` key, Stripe secret key, DB connection strings, JWT secrets, OAuth secrets.

## .gitignore

Ensure `.env`, `.env.local`, `.env.*.local` are in `.gitignore` before the first commit.
