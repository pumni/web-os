---
name: testing-template
description: Add focused deterministic tests for web feature behavior without external service dependencies.
---

# Testing Template

Use this skill when adding or updating unit or component tests in the web
monorepo.

## Rules

- Read `docs/conventions/testing.md` before adding tests.
- Root `bun run test` must stay deterministic and must not require a running
  Next.js server or external Supabase service.
- Test behavior, not implementation details.
- Cover the happy path and at least one failure or boundary path for meaningful
  logic changes.
- Mock Server Actions, Supabase clients, and network boundaries at the module
  edge.
- Keep Playwright/e2e tests separate under `apps/web` and run them explicitly
  from that app when needed.

## Checklist

- [ ] Test belongs to the touched feature/package.
- [ ] No test depends on live Supabase, network, or a running app server.
- [ ] Happy path is covered.
- [ ] Failure or boundary path is covered.
- [ ] Mocks are local and explicit.
- [ ] Assertions describe user-visible behavior or stable contract behavior.
- [ ] `bun run test` passes.
- [ ] `bun run typecheck` passes when TypeScript test code changed.
