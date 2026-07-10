# @pumni/test-utils — package-scoped rules

Package delta; root AGENTS.md applies.

## Summary

Shared test helpers, builders, and fixtures. Current API includes `createTestId`. Keep helpers deterministic with no live services.

## Pitfalls

- Do not import production server-only modules, env secrets, or live service clients.
- Keep this package out of application runtime imports.
- Avoid introducing live test runner (Vitest/Playwright) dependencies in the default entry point.
