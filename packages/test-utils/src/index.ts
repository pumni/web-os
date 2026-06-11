/**
 * Framework-agnostic test utilities shared across the monorepo.
 *
 * Pure helpers (fixtures, id factories, builders) live here so unit and e2e
 * suites can reuse them. Add runner-specific helpers (Vitest, Playwright) in
 * dedicated entry points to avoid pulling those deps into every consumer.
 */

/** Generate a stable-ish unique id for use in test fixtures. */
export function createTestId(prefix = "test"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
