---
description: Next.js 16 Cache Components rules — path-scoped pointer; loaded only when touching app or feature query/action files.
paths:
  - "apps/web/src/app/**/*.ts"
  - "apps/web/src/app/**/*.tsx"
  - "apps/web/src/features/**/actions.ts"
  - "apps/web/src/features/**/queries.ts"
---

# Next.js 16 Cache Components (pointer)

Canonical: `docs/conventions/nextjs-16.md` — read before writing Next.js 16 code.

- `'use cache'` must be placed in the function body that directly fetches — never inside a wrapper/HOF.
- `cacheLife` minimum is `'minutes'`; `'seconds'` silently breaks PPR.
- `cacheTag(...)` must always be parameterized (e.g. `cacheTag(\`profile:${userId}\`)`).
- `updateTag(...)` is Server Actions only — throws in a Route Handler.
- `revalidateTag(tag, profile)` requires two arguments; single-arg form is invalid in Next 16.
- Wrap every dynamic component in `<Suspense>`; never render protected content in the fallback.
