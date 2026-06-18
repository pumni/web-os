# @pumni/test-utils — package-scoped rules

Path-scoped contract for `packages/test-utils`. Read when adding shared test
helpers, fixtures, or builders.

## Summary

Framework-agnostic test helpers shared across the monorepo. Current public API is
`createTestId`; future helpers should stay deterministic and avoid live services.

## Architecture

- `src/index.ts` exports pure helpers by default.
- Put runner-specific helpers behind dedicated entry points if Vitest or
  Playwright dependencies are ever added.
- Prefer builders, fixtures, and deterministic utilities that do not change app
  runtime behavior.

## Stack

TypeScript only at present. No live Supabase, network, browser, or test-runner
dependency in the default entry point.

## Commands

- `bun --filter @pumni/test-utils typecheck`
- `bun run test` when helpers affect test behavior

## Pitfalls

- Do not import production server-only modules, env secrets, or live service
  clients.
- Avoid nondeterminism in shared helpers unless the helper name makes it
  explicit and tests do not depend on stable output.
- Keep this package out of application runtime imports.
