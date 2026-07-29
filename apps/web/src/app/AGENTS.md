# Web routes — Next.js App Router

Root and `apps/web/AGENTS.md` apply. Read `docs/conventions/nextjs-project-profile.md`
before changing framework behavior.

- Route files compose feature APIs and shared UI; keep domain logic in features.
- Keep route-segment config, `"use cache"`, and request-time APIs in Server
  Components and follow the project cache conventions.
- Route handlers and Server Actions must enforce authentication and RLS through
  the owning server/auth modules; UI visibility is not authorization.
- Verify route/config changes with `bun run lint`, `bun run typecheck`, and
  `bun run build`.
