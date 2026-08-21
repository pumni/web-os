# Phase 1 — Unhobble Persistent Context

## Goal

Reduce always-on and path-scoped doctrine to high-signal project-specific context while preserving real security and architecture contracts.

This phase should be primarily deletion, consolidation, pointer correction, and ownership cleanup. Do not add a new context framework.

## Files in scope

- `AGENTS.md`
- nested `AGENTS.md` files
- `CLAUDE.md` shims and their sync logic (validate, do not redesign unless broken)
- `.github/copilot-instructions.md`
- `scripts/context-lint.mjs`
- `docs/architecture/overview.md`
- `docs/conventions/nextjs-project-profile.md`
- former generic AI rulebook under `docs/ai/` (delete when no unique knowledge remains)
- stale/meta content in `docs/conventions/design-system.md`
- any references broken by the changes

## 1. Root `AGENTS.md`

### Keep

- one-sentence repository/stack identity;
- Supabase RLS authorization boundary;
- server-only secret boundary;
- committed migration immutability;
- the few cross-repo architecture boundaries whose violation is high-consequence;
- JIT navigation table;
- focused-to-broad validation escalation;
- source/tests/types/framework evidence as preferred task-specific truth.

### Remove or rewrite

Review every sentence in `Working contract` and `Done` using this test:

> If a capable model can infer this from normal engineering judgment, the user request, or repository/tool feedback, why is it consuming persistent attention?

Candidates for deletion or softening include generic instructions such as:

- inspect first;
- preserve public behavior unless requested otherwise;
- prefer focused diffs;
- prefer existing patterns;
- introduce abstractions only after a second caller;
- generic completion statements duplicated by validation gates.

Do not delete a statement merely for being short/long. Delete it because it has low marginal signal.

### Target shape

The root file should read as:

1. repository identity;
2. hard boundaries;
3. small architecture map;
4. JIT lookup table;
5. validation path.

No persona, no reasoning boilerplate, no generic style guide.

## 2. Nested `AGENTS.md`

Audit every nested `AGENTS.md` and classify each line:

- `KEEP_LOCAL`: non-obvious fact that changes within this subtree;
- `MOVE_REFERENCE`: rationale/detail belongs in a convention/ADR/source pointer;
- `MECHANICAL_OWNER`: remove prose after confirming a linter/test/type/build owns it;
- `DELETE_DUPLICATE`: already stated by an ancestor;
- `DELETE_GENERIC`: normal engineering judgment.

Specific known cleanup candidates:

### `apps/web/AGENTS.md`

Keep framework-local structure and genuinely project-specific React Compiler/cache behavior. Remove repetition of root security/data rules when a JIT pointer is sufficient.

### `apps/web/src/app/AGENTS.md`

Keep route-layer composition and the build proof when route/config behavior changes. Avoid re-explaining global auth doctrine.

### `apps/web/src/features/AGENTS.md`

Keep public-entry-point boundaries and server/client barrel split if these are not completely obvious from ESLint. Prefer pointing at mechanical import enforcement over repeating implementation philosophy.

### `packages/ui/AGENTS.md`

Keep package purity, public subpath contract, generated exports workflow, and non-obvious token-source ownership. Remove prose that simply restates rules already rejected mechanically by ESLint unless the rationale affects design choices.

### `packages/auth/AGENTS.md` and `packages/supabase/AGENTS.md`

Deduplicate command lists and root security doctrine. Keep the few package-specific boundaries and affected blast radius.

### `apps/catalog/AGENTS.md`

Shorten the explanation of why catalog gates are separate. Keep the operational fact and point to ADR-0031 for rationale.

### `supabase/migrations/AGENTS.md`

Keep only migration-local activation/navigation and the few critical local constraints. Detailed RLS/function doctrine belongs to the security convention and migration skill, with executable tests as proof.

## 3. Provider adapters

### `CLAUDE.md`

Retain `@AGENTS.md` if current Claude Code discovery still requires this adapter.

### nested Claude shims

Retain generated thin shims when they are required for nearest-scope discovery. Do not hand-edit policy into them.

### Copilot instructions

Keep only a pointer to canonical guidance and at most one verification hint. It must not become a third policy body.

## 4. `context-lint`

### Remove the hard byte budget

Delete the current `AGENTS.md > 4096B` failure rule.

Reason: byte count is not a correctness property and creates the wrong optimization target. Signal density should be achieved by review, ownership, and deletion of duplication—not a magic number.

If useful, a non-blocking informational size report is acceptable, but do not fail CI on arbitrary size thresholds.

### Keep structural integrity only

`context:lint` should own:

- required discovery files;
- root/nearest Claude shim integrity;
- generated skill shim drift;
- skill metadata validity;
- references/commands that are part of the active context discovery surface;
- obvious encoding corruption.

It should not become a semantic rule parser or project architecture analyzer.

## 5. Remove the generic AI rulebook under `docs/ai/`

Disposition:

- delete generic "premature abstraction" advice;
- migrate any still-useful concrete database gotcha to the canonical Supabase reference or, preferably, encode it in focused tests/examples already owned by the subsystem;
- update all references;
- delete the file when no unique durable knowledge remains.

The repository should not maintain a special handbook of mistakes merely because the worker is an AI.

## 6. Fix documentation ownership drift

### `docs/architecture/overview.md`

Correct any claim that `bun run policy:check` generally proves workspace dependency edges. The actual owners are workspace manifests, ESLint import restrictions where present, TypeScript, tests, and build behavior. Describe `policy:check` only for checks it actually runs.

### `docs/conventions/nextjs-project-profile.md`

Remove duplicated facts that should be read from `package.json` or `next.config.ts` unless the project-specific consequence is important.

Target content:

- project-specific Next.js mode/decisions;
- pointers to exact installed version/config;
- non-obvious local framework consequences;
- pointer to installed framework docs/source for version-sensitive semantics.

Do not maintain a mini Next.js manual.

### `docs/conventions/design-system.md`

Remove stale manual-review/freshness dates unless an automated owner exists. Do not replace them with a new calendar process.

Leave deeper design-system restructuring to Phase 2.

## 7. Verification

During work, use focused checks. Before completing Phase 1, run:

```sh
bun run context:lint
bun run policy:check
bun run verify
```

If the refactor changes only docs/context scripts and a broad build failure is clearly unrelated, investigate and document the existing failure rather than weakening gates.

## Acceptance criteria

- Root persistent context is materially smaller because low-value doctrine was removed, not because important invariants were compressed into ambiguity.
- Nested files are true deltas.
- No provider adapter contains independent policy.
- No arbitrary byte/token correctness gate remains.
- `context:lint` has a narrow structural responsibility.
- no generic AI-mistake handbook remains unless a concrete, unique reason is demonstrated during implementation.
- architecture/Next.js docs point to authoritative sources instead of duplicating them.
- all context discovery references remain valid.
- `bun run verify` is green.
