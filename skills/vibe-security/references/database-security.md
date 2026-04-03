# Database Access Control

This is the #1 source of critical vulnerabilities in vibe-coded apps.

## Supabase RLS

Tables have RLS **disabled by default**. Enable it on every table. Never use `USING (true)` or `USING (auth.uid() IS NOT NULL)` — these expose all rows. Always scope to row owner. Always include `WITH CHECK` on INSERT/UPDATE policies. Storage buckets need their own policies.

## Firebase

Never ship `allow read, write: if true` or `allow read, write: if request.auth != null`. Validate ownership and field-level changes. Subcollections are NOT secured by parent rules.

## Convex

Every public query/mutation must call `ctx.auth.getUserIdentity()`. Internal-only functions must use `internalQuery`/`internalMutation`.
