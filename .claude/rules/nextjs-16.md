---
description: Next.js 16 project profile pointer — loaded when touching web app or feature files.
paths:
  - "apps/web/src/app/**/*.ts"
  - "apps/web/src/app/**/*.tsx"
  - "apps/web/src/features/**/actions.ts"
  - "apps/web/src/features/**/queries.ts"
---

# Next.js 16 Project Rules

Canonical: `docs/conventions/nextjs-project-profile.md`

- For framework API semantics, consult the installed Next.js documentation (`node_modules/next/dist/docs/`).
- Ensure request-time APIs are `await`ed and Cache Components follow project caching conventions.
