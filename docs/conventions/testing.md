---
description: Test scope (unit vs e2e), determinism rules, and which command owns which tests. Use when adding tests or deciding whether work belongs in unit tests or Playwright e2e.
---

# Testing Convention

Keep tests focused on behavior that protects the starter contract.

## Unit Tests

Unit tests should be deterministic and not require Supabase or a running Next.js
server. Good targets:

- Zod validators
- Pure helpers
- Client form behavior with mocked actions

Run with:

```pwsh
bun run test
```

## Type Checking

Every TypeScript package must expose:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

Run all package type checks with:

```pwsh
bun run typecheck
```

## End-To-End Tests

Playwright tests live in `apps/web/e2e`. They may require the app server and
local Supabase depending on the flow.

Run from `apps/web`:

```pwsh
bunx playwright test
```

Keep root `bun run test` limited to fast tests that can run during local
development and CI without external services.
