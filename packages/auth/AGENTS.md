# @pumni/auth — package-scoped rules

Package delta; root AGENTS.md applies.

## Summary

High-level, server-only authentication helpers (`getCurrentUser`, `requireUser`)
built on `@pumni/supabase/server`. This is where request-scoped identity is
resolved before any privileged write.

## Architecture

- Keep the package server-only and preserve its `@pumni/supabase` dependency.
- Consumers are Server Components, Server Actions, and route handlers; client
  components must not import it.

## Pitfalls

- Mutating Server Actions must call `requireUser()` before any Supabase write.
- Browser identity flows through `@pumni/supabase/browser`; do not add a browser
  or `NEXT_PUBLIC_*` entry point here.
- Changing `requireUser`/`getCurrentUser` affects every protected route.
