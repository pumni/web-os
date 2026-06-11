# Testing Convention

Keep tests focused on behavior that protects the starter contract.

## Unit Tests

Unit tests should be deterministic and not require Supabase or a running Next.js
server. Good targets:

- Zod validators
- Pure helpers
- Client form behavior with mocked actions

Run with:

```bash
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

```bash
bun run typecheck
```

## End-To-End Tests

Playwright tests live in `apps/web/e2e`. They may require the app server and
local Supabase depending on the flow.

Run from `apps/web`:

```bash
bunx playwright test
```

Keep root `bun run test` limited to fast tests that can run during local
development and CI without external services.
