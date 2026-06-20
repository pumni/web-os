---
name: zod-validator
description: Author shared Zod 4 input schemas and inferred types in @pumni/validators, reused by forms, Server Actions, and tests. Use when adding or changing a schema in packages/validators/src, or naming an input contract shared across the client/server boundary.
---

# Zod Validator

`@pumni/validators` is the single source of truth for input shapes. One schema is
consumed by the form (`zodResolver`), the Server Action (`safeParse`), and tests.
Keep it framework-agnostic so it crosses the client/server boundary cleanly.

## Rules

- Read `packages/validators/AGENTS.md` before editing.
- One feature file per area under `src/` (e.g. `profile.ts`); re-export it from
  `src/index.ts`.
- Use Zod 4 top-level format validators (`z.url()`, `z.email()`, `z.uuid()`)
  rather than the chained `z.string().url()` forms.
- Export the schema **and** its inferred input type:
  `export type ProfileInput = z.infer<typeof profileSchema>`.
- Schemas are deterministic and side-effect free: no database reads, auth checks,
  env access, `server-only` imports, app aliases (`@/`), or React/Next/Supabase
  dependencies.
- Validate input shape only. Authorization lives in server code and RLS owners,
  never in a schema.
- Renaming an exported schema or changing an inferred type is a breaking change —
  update every consumer (actions, forms, tests) in the same change.

## Checklist

- [ ] Schema is in its feature file under `src/` and re-exported from `index.ts`.
- [ ] Inferred input type is exported alongside the schema.
- [ ] Zod 4 top-level format validators used where applicable.
- [ ] No `server-only` imports, DB/auth/env access, or `@/` aliases.
- [ ] No authorization logic embedded in the schema.
- [ ] All consumers updated when an exported name or inferred type changed.
- [ ] `bun --filter @pumni/validators typecheck` and `bun run typecheck` pass.
