---
description: Monorepo dependency graph, foundational blocks vs leaves, and how to reason about blast radius before cross-package changes.
when-to-load: When a change spans more than one package, or before editing a package that many others depend on.
---

# Project Graph

This is the real dependency graph of the workspace packages, derived from their
`workspace:*` edges. Use it to reason about **blast radius** before editing.

## Edges

```mermaid
graph TD
  Web[apps/web] --> UI[@pumni/ui]
  Web --> Auth[@pumni/auth]
  Web --> Supabase[@pumni/supabase]
  Web --> Env[@pumni/env]
  Web --> Validators[@pumni/validators]
  Web --> Config[@pumni/config]
  Auth --> Supabase
  Supabase --> Env
  UI --> Config
```

## Foundational blocks (high fan-in)

These are depended on by many packages. A breaking change here has wide blast
radius — treat edits here as R1+ and verify the dependents:

- `@pumni/env` — depended on by `@pumni/supabase` (and indirectly `@pumni/auth`,
  `apps/web`). Env schema drift breaks every server entry point.
- `@pumni/config` — depended on by `@pumni/ui`. Shared lint/tsconfig base.

These have **no** workspace dependencies — they are leaves, safe to change in
isolation (still run the matching gate):

- `@pumni/validators`, `@pumni/features`, `@pumni/test-utils`.

## Bottlenecks

- `@pumni/supabase` — the app↔DB contract. Both browser and server clients plus
  the generated types live here. Changing client factories or the generated
  types ripples into `@pumni/auth` and every feature that reads/writes data.

## Cross-package change workflow

1. Identify every edge in the graph that the change touches.
2. Build only what changed, not the whole repo:
   `bun run build` runs the Turbo task graph with `dependsOn: ^build`, so
   upstream packages rebuild first automatically. For a targeted check use
   `bunx turbo run build --filter=web` (or the touched package).
3. Run `bun run typecheck` — type errors across a `workspace:*` edge are the most
   common silent breakage.
4. Run `bun run ai:check` if any AI context file or manifest edge moved.

## Import direction

Imports flow `apps/web -> packages/*` and `packages/* -> packages/*` along the
edges above only. `packages/ui` must never import server/auth/db packages (this
is also enforced statically by `checkUiPackageBoundaries` in `bun run ai:check`).
See `docs/architecture/overview.md` for the structural principles.
