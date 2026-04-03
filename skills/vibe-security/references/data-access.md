# Data Access & Input Validation

Always use parameterized queries. Never concatenate user input into SQL.

With Prisma: validate input with Zod before passing to queries. Never use `$queryRawUnsafe` or `$executeRawUnsafe` with user input.

Validate all external input at system boundaries with a runtime schema validator (Zod, Yup, Joi). TypeScript types provide zero runtime protection.

Don't spread request bodies directly into DB operations (mass assignment).
