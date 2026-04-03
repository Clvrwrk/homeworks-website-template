# Payment Security (Stripe)

Never trust client-submitted prices. Always look up prices server-side using Stripe Price IDs.

Verify webhook signatures using the raw request body (`request.text()`, not `request.json()`).

Check subscription status server-side on every protected request — your database (kept in sync via webhooks) is the source of truth, not cached session values or client-side flags.
