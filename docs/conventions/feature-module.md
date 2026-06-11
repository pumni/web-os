# Feature Module Convention

Start product features inside `apps/web/src/features/<feature-name>`.

Use this shape by default:

```text
src/features/profile/
  actions.ts
  queries.ts
  profile-form.tsx
```

## Server Reads

Put request-scoped reads in `queries.ts`. Use Server Components for initial page
loads and call `@pumni/supabase/server` from server-only code.

## Mutations

Put mutations in `actions.ts` as Server Actions when the caller is a React form
or client component. Validate inputs with schemas from `@pumni/validators`
before writing to Supabase.

## Client Components

Use `"use client"` only for interactivity:

- Form state
- Event handlers
- Optimistic UI
- Local view state

Do not move database reads into Client Components just to avoid passing props.

## Shared Packages

Promote code out of `apps/web` only when it is genuinely reusable:

- `@pumni/validators` for shared schemas and inferred types.
- `@pumni/ui` for framework-neutral UI primitives.
- `@pumni/auth` for server-only auth helpers.
- `@pumni/supabase` for Supabase client factories.

Avoid creating placeholder packages before a real reuse boundary exists.
