---
description: Next.js 16 async request API rules — path-scoped pointer; loaded only when touching app or feature files.
paths:
  - "apps/web/src/app/**/*.ts"
  - "apps/web/src/app/**/*.tsx"
  - "apps/web/src/features/**/actions.ts"
  - "apps/web/src/features/**/queries.ts"
---

# Next.js 16 Async Request APIs (pointer)

Canonical: `docs/conventions/nextjs-16.md` — read before writing Next.js 16 code.

- Every request-time API (`params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`) must be `await`ed — sync form throws at runtime.
- Generate `PageProps`/`RouteContext` types with `bunx next typegen`; never hand-write them.
- Use the async function signature: `params: Promise<{ slug: string }>`.
