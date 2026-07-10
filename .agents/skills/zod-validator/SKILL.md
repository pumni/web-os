---
name: zod-validator
description: Author shared Zod 4 input schemas and inferred types in @pumni/validators, reused by forms, Server Actions, and tests. Use when adding or changing a schema definition in packages/validators/src, or naming an input contract shared across the client/server boundary. For wiring a schema into a form, use react-hook-form.
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
  rather than the chained `z.string().url()` forms — see Notes for version drift.
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

## Notes

- The `z.url()` / `z.email()` / `z.uuid()` top-level forms are the Zod 4 shape.
  If the catalog moves to Zod 5 and the top-level helpers are renamed, re-read
  the installed `zod` package exports before editing — this rule names the
  intended API, not a pin.

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Import error in browser | Schema imports `server-only`, `@pumni/env`, or a database helper. | Remove the import; keep schemas pure and side-effect free. |
| Type drift across boundary | Schema changed but inferred type was not updated in the Server Action or Form. | Always use `z.infer` to export a single type; use it in both Form and Action. |
| Validation too strict | Schema uses `z.string().min(1)` for an optional field that sends empty string. | Use `.optional()` or `.transform(v => v === "" ? null : v)` for empty strings. |
