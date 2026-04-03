# Authentication & Authorization

- Use `jwt.verify()`, never `jwt.decode()` alone.
- Explicitly reject `"alg": "none"`.
- Next.js middleware is NOT a reliable sole auth layer (CVE-2025-29927). Always verify auth in Server Actions, Route Handlers, and data access functions.
- Server Actions are public POST endpoints — validate input, authenticate, and authorize at the top of every one.
- Never pass entire DB objects to Client Components. Select only needed fields.
- Store tokens in `HttpOnly + Secure + SameSite=Lax` cookies, not localStorage.
