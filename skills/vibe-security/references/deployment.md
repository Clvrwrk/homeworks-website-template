# Deployment Security

- Disable debug mode in production.
- Disable source maps in production.
- Verify `.git` is not accessible at your production URL.
- Never use production keys in preview/staging deployments.
- Set security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
- Never use `Access-Control-Allow-Origin: *` on authenticated endpoints.
