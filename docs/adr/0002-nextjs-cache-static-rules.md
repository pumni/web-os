# 0002. Next.js Cache API Static Rules — Scope and Limits

- **Status:** Accepted
- **Date:** 2026-06-18
- **Owner:** AI context layer (see root `AGENTS.md`)

## Context

Next.js 16.2.10's Cache Components API has five documented "silent bugs that
compile fine" (see `apps/web/AGENTS.md` → Cache Components, and
`docs/ai/common-mistakes.md` §10, §13–16):

1. `'use cache'` placed inside a wrapper function (silently becomes dynamic).
2. `cacheLife('seconds')` (punches a dynamic hole in the PPR static shell).
3. `updateTag()` called outside a Server Action (runtime throw).
4. `revalidateTag()` called with one argument (legacy invalidation).
5. `cacheTag()` with a non-parameterized literal (cross-user collision).

Before this ADR, the static analyzer (`scripts/check-review-gate-rules.mjs`)
covered none of these — only `revalidateTag|updateTag` appeared as a *presence
signal* inside `server-action-missing-revalidation`, which catches "missing"
but not "misused". Audit item A5 flagged this as the highest-value coverage gap
because cache misuse is the most likely Next.js hallucination vector.

The analyzer is regex-over-raw-text, one function per rule, with path-gating
(see `docs/adr/` README and `scripts/check-review-gate-rules.mjs` header).
Regex cannot do lexical-scope or AST analysis reliably.

## Decision

Implement the two cache rules that regex can catch with low false-positive risk.
Document the other two as out-of-scope for the current analyzer and require an
AST-based tool (or human review) instead.

**Implemented (2):**

- `cache-life-too-short` — matches `cacheLife('seconds')` and
  `cacheLife("seconds")` only. Single/double-quoted literal, no template
  literals (those can't be statically resolved). Severity B2.
- `cache-tag-unparameterized` — matches `cacheTag('literal')` /
  `cacheTag("literal")` where the literal contains no `:` separator (namespaced
  static tags like `cacheTag('posts:featured')` are acceptable shared tags).
  Template literals (`cacheTag(\`profile:${id}\`)`) are not matched. Severity B1.

**Deliberately skipped (2):**

- `use-cache-placement` — detecting `'use cache'` inside a wrapper function
  requires identifying nested function bodies and their enclosing scope. Regex
  cannot distinguish `function withCache() { async function inner() { 'use cache' } }`
  from a valid top-level `async function getPost() { 'use cache' }` reliably
  without brace-matching heuristics that produce false positives on legitimate
  closures. Left to `apps/web/AGENTS.md` guidance + human review.
- `update-tag-scope` — detecting `updateTag()` outside a Server Action requires
  lexical-scope tracking of the nearest enclosing `'use server'` boundary.
  Regex can find the call but cannot determine whether it sits inside a
  `'use server'` function. False-positive risk is unacceptably high.

`revalidateTag()` argument count (item 4) is already partially covered by
`server-action-missing-revalidation`; adding a strict arity check is deferred
until a real failure mode is observed.

## Consequences

**Positive:**

- Two of the five silent cache bugs are now caught deterministically, before CI.
- Self-test covers both rules (16/16 rule types fire in the fixture bundle).
- A real-world false positive was found immediately in
  `apps/web/src/app/(app)/nextjs-ecosystem/page.tsx` (a `<CodeBlock>` demo
  string) and suppressed via `scripts/ai-review-rule-allowlist.json` with a
  documented reason — demonstrating the allowlist escape hatch works as
  designed for educational/anti-pattern strings.

**Negative / costs:**

- Three of five cache pitfalls remain un-enforced (placement, update-tag scope,
  revalidateTag arity). These stay as doc-level guidance in
  `apps/web/AGENTS.md` and `docs/ai/common-mistakes.md` §10, §13, §15.
- Regex-based cache rules will keep hitting string literals in doc/example
  files. The allowlist is the documented escape hatch; each entry must carry a
  specific reason (≥ 12 chars), enforced by `loadAllowlist`.

**Neutral:**

- If a future AST-based analyzer (e.g., a ts-morph or eslint plugin) is added,
  the two skipped rules become straightforward and this ADR should be
  superseded by one that moves them from "doc-only" to "static".

## Alternatives considered

- **Implement all four rules with loose regex and accept high FP rate.**
  Rejected: false positives on a B1/B2 gate erode trust in the analyzer and
  train reviewers to ignore findings. The allowlist is for genuine exceptions,
  not for absorbing systematic noise.

- **Defer all cache rules until an AST tool exists.** Rejected: two of the five
  bugs are trivially catchable now with zero FP risk; deferring them leaves a
  known gap with no timeline. Partial enforcement is better than none when the
  missed parts are documented.

- **Convert the analyzer to ts-morph / eslint now.** Rejected for scope: it
  would re-architect the enforcement plane and risk regressions across all 14
  existing rules. Worth doing eventually, but not bundled with a cache-coverage
  task.

## References

- `apps/web/AGENTS.md` → Cache Components (canonical owner of the rules).
- `docs/ai/common-mistakes.md` §10, §13–16 (❌/✅ pairs mapped to rule ids).
- `.agents/workflows/review-gate.md` → Static Rule Inventory.
- `scripts/ai-review-rule-allowlist.json` (allowlist for the one known FP).
