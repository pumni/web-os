---
name: react-hook-form
description: Build client forms with react-hook-form, a Zod resolver, the @pumni/ui Form primitives, and a Server Action mutation. Use when adding or changing a client form component (e.g. features/<feature>/*-form.tsx), wiring useForm/zodResolver, or surfacing client validation and submit errors. For the server-side mutation logic, use server-action.
---

# React Hook Form

Wire a `"use client"` form to a shared Zod schema and a Server Action. The form
owns view state; the Server Action owns the write and authorization. Keep the
two seams clean so validation, submission, and cache refresh stay predictable.

## Rules

- Read `apps/web/AGENTS.md` and `docs/conventions/feature-module.md` before
  adding a form.
- The form file is `"use client"` and lives in the owning feature module.
- Resolve with `zodResolver(schema)` using a schema imported from
  `@pumni/validators` — never redefine the shape client-side. Type the form with
  the inferred input type (`useForm<ProfileInput>`).
- Render fields through `@pumni/ui` `Form`/`FormField`/`FormItem`/`FormLabel`/
  `FormControl`/`FormMessage`; submit with `SubmitButton`. Do not hand-roll field
  markup or error display — `FormMessage` shows the resolver error.
- Submit a Server Action; never write to Supabase from the form. The action
  re-derives the user and revalidates — the client is not trusted for auth.
- When you need pending/optimistic/cache behavior, drive submission through
  TanStack `useMutation`; in `mutationFn` throw on `!result.ok` so `onError`
  fires. Otherwise call the action directly in `handleSubmit`.
- Report outcome with `sonner` `toast`; after a mutation that changed
  server-rendered data call `router.refresh()` (the action's `updateTag`/
  `revalidateTag` handles cache, `refresh` re-pulls the RSC tree).
- Disable inputs and `SubmitButton` while pending; never submit twice.

## Checklist

- [ ] File is `"use client"` and inside the touched feature module.
- [ ] Schema imported from `@pumni/validators`, not duplicated in the component.
- [ ] `zodResolver` wires that schema; form typed by its inferred input type.
- [ ] Fields render through `@pumni/ui` Form primitives; errors via `FormMessage`.
- [ ] Submission calls a Server Action, not a direct browser Supabase write.
- [ ] `mutationFn` throws on `!result.ok`; success/error shown via `toast`.
- [ ] Server-data mutation is followed by `router.refresh()` or query invalidation.
- [ ] Pending state disables inputs and submit.
- [ ] `bun run typecheck` and `bun run test` pass.

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Submit error not visible | `FormMessage` missing; or action failure caught silently in `handleSubmit`. | Ensure `FormMessage` is inside the `FormItem`; throw in `mutationFn` so `onError` captures it. |
| Stale data after submit | `updateTag` missing in action; or `router.refresh()` missing in client. | Add `updateTag` to the Server Action and `router.refresh()` to the form success handler. |
| Double submission | `SubmitButton` not disabled during `isPending`. | Pass `isPending` to the `SubmitButton` or disable it explicitly in the `Form` footer. |
