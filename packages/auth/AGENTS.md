# @pumni/auth — package-scoped rules

Package delta; root AGENTS.md applies.

## Summary

High-level, server-only authentication helpers (`getCurrentUser`, `requireUser`) built on `@pumni/supabase/server`. This is where request-scoped identity is resolved before any privileged write.

## Architecture

- Server-only package (security invariant, see [supabase-security.md](../../docs/conventions/supabase-security.md)). Keep "server-only" declarations.
- Consumers: `apps/web` Server Components, Server Actions, and route handlers. Client components must never import from here.
- Workspace dep: `@pumni/supabase`.

## Stack

`@supabase/ssr`, `@pumni/supabase`, `next`, `server-only`.

## Commands

- `bun --filter @pumni/auth typecheck`
- `bun run typecheck`
- `bun run policy:check` (`server-action-missing-auth`, `service-role-client`, `server-only-in-client` govern consumption)

## Pitfalls

- Mutating Server Actions must call `requireUser()` (or an equivalent auth check) **before** any Supabase write.
- Do not add a browser/`NEXT_PUBLIC_*` entry point here. Browser identity flows through `@pumni/supabase/browser` and Supabase Auth, not this package.
- Changing `requireUser`/`getCurrentUser` affects every protected route.
