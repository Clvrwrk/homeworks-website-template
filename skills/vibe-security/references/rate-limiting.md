# Rate Limiting & Abuse Prevention

Required on: auth endpoints, AI API calls, email/SMS sending, file processing, webhook-like endpoints.

Do NOT store rate limit counters in public Supabase tables — users can reset them via the REST API. Use Upstash Redis, a private schema table, or middleware-level limiting.

Combine per-IP and per-user limits. Set hard spending caps on all AI API providers.
