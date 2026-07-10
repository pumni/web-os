---
name: testing-template
description: Add focused deterministic unit and component tests through stable public interfaces with no live services. Use when adding or updating tests for web feature behavior, or running a red-green-refactor loop.
---

# Testing Template

Use this skill when adding or updating unit or component tests in the web
monorepo.

## Loop

Work in vertical red-green-refactor slices:

1. Pick one behavior that matters at the public interface.
2. Write one failing test for that behavior.
3. Add only enough implementation to make it pass.
4. Repeat for the next behavior.
5. Refactor only after the suite is green.

Do not write a bulk set of imagined tests before implementation. Tests written
too far ahead tend to lock onto implementation shape instead of observable
behavior.

Scaffold one behavior at a time from
[scripts/feature.test.template.ts](/.agents/skills/testing-template/scripts/feature.test.template.ts).

## Rules

- Read `docs/conventions/testing.md` before adding tests.
- Root `bun run test` must stay deterministic and must not require a running
  Next.js server or external Supabase service.
- Test behavior, not implementation details.
- Test through the highest stable public interface available for the change.
- Prefer tests that survive internal refactors. If renaming or extracting a
  private helper breaks the test while behavior is unchanged, the test is too
  coupled.

  Pair (concrete, abbreviated):

  ```text
  ❌ expect(wrapper.find('Button').props().onClick).toBe(onClick);
  ✅ await user.click(screen.getByRole('button', { name: /submit/i }));
  ```

  The first test breaks when the `Button` element is renamed or moved; the
  second asserts the user-observable behavior.
- Cover the happy path and at least one failure or boundary path for meaningful
  logic changes.
- Mock Server Actions, Supabase clients, and network boundaries at the module
  edge.
- Keep Playwright/e2e tests separate under `apps/web` and run them explicitly
  from that app when needed.

## Checklist

- [ ] Test belongs to the touched feature/package.
- [ ] No test depends on live Supabase, network, or a running app server.
- [ ] Each new test describes one observable behavior.
- [ ] Test crosses a public interface, not private implementation details.
- [ ] Happy path is covered.
- [ ] Failure or boundary path is covered.
- [ ] Mocks are local and explicit.
- [ ] Assertions describe user-visible behavior or stable contract behavior.
- [ ] Refactoring, if any, happened only after tests were green.
- [ ] `bun run test` passes.
- [ ] `bun run typecheck` passes when TypeScript test code changed.

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Flaky tests | Shared state between tests; or reliance on system time/randomness without seeds. | Reset mocks/state in `beforeEach`; use deterministic seeds or mock `Date.now()`. |
| Brittle tests | Tests point to private functions or specific HTML tag structures. | Test through the public interface; use `getByRole` or `getByText` instead of `nth-child`. |
| Slow test suite | Unnecessary mocking of large libraries; or too many component renders. | Use focused unit tests for logic; use component tests only for UI interactions. |
