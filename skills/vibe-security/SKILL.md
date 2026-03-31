---
name: vibe-security
description: Audits codebases for common security vulnerabilities that AI coding assistants introduce in "vibe-coded" applications. Checks for exposed API keys, broken access control (Supabase RLS, Firebase rules), missing auth validation, client-side trust issues, insecure payment flows, and more. Use this skill whenever the user asks about security, wants a code review, mentions "vibe coding", or when you're writing or reviewing code that handles authentication, payments, database access, API keys, secrets, or user data — even if they don't explicitly mention security. Also trigger when the user says things like "is this safe?", "check my code", "audit this", "review for vulnerabilities", or "can someone hack this?".
license: MIT
metadata:
  author: Chris Raroque
  version: "1.0"
---

Audit code for security vulnerabilities commonly introduced by AI code generation. These issues are prevalent in "vibe-coded" apps — projects built rapidly with AI assistance where security fundamentals get skipped.

AI assistants consistently get these patterns wrong, leading to real breaches, stolen API keys, and drained billing accounts. This skill exists to catch those mistakes before they ship.

## The Core Principle

Never trust the client. Every price, user ID, role, subscription status, feature flag, and rate limit counter must be validated or enforced server-side. If it exists only in the browser, mobile bundle, or request body, an attacker controls it.

## Audit Process

Examine the codebase systematically. For each step, load the relevant reference file only if the codebase uses that technology or pattern. Skip steps that aren't relevant.

1. **Secrets & Environment Variables** — See `references/secrets-and-env.md`.
2. **Database Access Control** — See `references/database-security.md`.
3. **Authentication & Authorization** — See `references/authentication.md`.
4. **Rate Limiting & Abuse Prevention** — See `references/rate-limiting.md`.
5. **Payment Security** — See `references/payments.md`.
6. **Mobile Security** — See `references/mobile.md`.
7. **AI / LLM Integration** — See `references/ai-integration.md`.
8. **Deployment Configuration** — See `references/deployment.md`.
9. **Data Access & Input Validation** — See `references/data-access.md`.

## Core Instructions

- Report only genuine security issues. Do not nitpick style or non-security concerns.
- When multiple issues exist, prioritize by exploitability and real-world impact.
- If the codebase doesn't use a particular technology (e.g., no Supabase), skip that section entirely.
- If you find a critical issue (exposed secrets, disabled RLS, auth bypass), flag it immediately at the top of your response.

## Output Format

Organize findings by severity: **Critical** → **High** → **Medium** → **Low**.

For each issue: state the file/line, name the vulnerability, explain the concrete impact, show a before/after fix.

Skip areas with no issues. End with a prioritized summary.

## References

- `references/secrets-and-env.md`
- `references/database-security.md`
- `references/authentication.md`
- `references/rate-limiting.md`
- `references/payments.md`
- `references/mobile.md`
- `references/ai-integration.md`
- `references/deployment.md`
- `references/data-access.md`
