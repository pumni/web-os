# Next.js routes — local delta

Root and `apps/web/AGENTS.md` apply.

- Route files, layouts, pages, and handlers are framework entry points; compose
  feature APIs and shared UI instead of growing domain logic here.
- For request-time APIs, cache semantics, route-segment config, or `"use cache"`,
  consult `docs/conventions/nextjs-project-profile.md` and installed Next.js
  docs/source before changing behavior.
- Run `bun --filter web build` when route/config behavior can affect the bundle
  or framework compilation.
