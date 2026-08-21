# 0002. Next.js Cache API Rules — Scope and Limits

- **Status:** Accepted
- **Date:** 2026-06-18
- **Owner:** Engineering Team

## Context

Next.js cache APIs have placement, lifetime, tagging, and invalidation rules
whose mistakes can compile while producing incorrect freshness or isolation.
The repository also has valid examples that intentionally show API usage in
documentation and demos, so a broad text heuristic would be noisy and would
teach agents a private framework language.

## Decision

Keep cache guidance in `apps/web/AGENTS.md`, the relevant Next.js convention,
and focused feature tests. Let current Next.js TypeScript, ESLint,
build/runtime behavior, and focused feature tests own correctness. Do not
maintain a repository-wide cache parser, rule taxonomy, or allowlist.

Cache tags for user-owned data must include the identifying scope; Route
Handlers use the current two-argument `revalidateTag` API; `updateTag` remains
limited to Server Actions. These are project conventions backed by framework
validation and tests where the behavior is load-bearing.

## Consequences

The repository avoids false positives from strings, demos, and nested function
scopes, and framework upgrades remain owned by framework-native tooling. A new
cache invariant should be added to ESLint or a focused test only when a real
failure demonstrates that current owners cannot catch it.

## Alternatives considered

- Keep regex rules for every cache API shape — rejected because text matching
  cannot reliably model JavaScript scope or framework semantics.
- Rebuild the analyzer with a private AST rule catalog — rejected because
  standard Next.js/TypeScript/ESLint owners provide more precise feedback with
  less repository-specific machinery.
- Put full framework reference material in root context — rejected; load current
  framework documentation only for tasks that need it.
