# Docs Tree Disposition

## Goal

Reduce `docs/` to a current knowledge surface. Historical implementation plans, old research, retired ADRs, and generic glossary material should not compete with source/current conventions during repository search.

## Root documentation

### `docs/README.md` — REWRITE

Current problems:

- it still anchors the docs entry path to ADR-0027 even though ADR-0030 is the current context-layer decision;
- it describes only architecture/conventions and omits the actual purpose/lifecycle of ADRs and plans;
- it does not state the intended working-tree-vs-Git-history boundary.

Target content should be short and explain only:

- agents normally enter through root `AGENTS.md`;
- `architecture/` = current structural map;
- `conventions/` = current operating decisions;
- `adr/` = durable current rationale only;
- `plans/` = temporary active implementation state only;
- history/rejected work is recovered through Git, not preserved as searchable current docs.

Do not turn `docs/README.md` into another navigation index that duplicates `AGENTS.md`.

## `docs/architecture/`

### `architecture/overview.md` — KEEP, SMALL CLEANUP

Keep package responsibilities and dependency-direction explanation. Verify every named package and boundary against workspace manifests/current source.

Update references from ADR-0010 to the new ADR-0031. Avoid listing implementation facts that are already obvious from package manifests unless the responsibility itself is important.

## `docs/conventions/`

### `billing.md` — KEEP

Current high-signal content: personal tenancy, webhook trust boundary, atomic quota/data-integrity ownership, billing identity semantics. Ensure links point to surviving ADR-0028/0029 and focused executable examples.

### `data-fetching.md` — KEEP, OPTIONAL SLIM

Keep the project-specific ownership split between Server Components, TanStack Query, and Zustand. Remove examples that are generic rather than project-specific if they add noise. Version-sensitive Next.js cache mechanics should be references to project config/current framework docs, not copied API manuals.

### `design-system.md` — KEEP

The refactor already improved this file. Keep the token/source ownership map and durable product decisions. Update ADR-0010 references to ADR-0031. Continue preferring lint/tests/source for exact forbidden utilities and token inventories.

### `nextjs-project-profile.md` — KEEP

Keep only project-specific flags/modes and where to retrieve current framework semantics. Do not add version inventories that package manifests already own.

### `supabase-security.md` — KEEP

High-consequence security doctrine legitimately remains explicit. Preserve RLS, service-role, grants/function safety, and verification ownership. Verify any named test/file owner after mass deletions.

### `testing.md` — KEEP, SLIM IF POSSIBLE

Keep test-location and fast-vs-e2e ownership. Reconsider prose like "every TypeScript package must expose typecheck" if package manifests/Turbo already make that requirement obvious and enforceable. The document should explain test strategy, not restate every package script.

### `transpile-packages.md` — DELETE

Reason: this is a volatile framework/tooling snapshot centered on the current absence of `transpilePackages` and Turbopack behavior. The durable rule is simply to change Next config when current framework/build evidence requires it. `apps/web/next.config.ts`, installed Next.js docs/source, and `bun --filter web build` are stronger owners.

Before deleting, search for live references. Replace with `nextjs-project-profile.md` only if a current pointer is genuinely needed.

## `docs/ai/`

### `ai/mcp.md` — KEEP

This is narrow, project-specific runtime tooling guidance. It correctly distinguishes optional local MCP runtime inspection from CI/filesystem/database authority and includes a trust boundary.

Keep it concise. Version pin remains owned by `.mcp.json`; avoid duplicating an exact version number in prose.

## Product documentation

### `product/glossary.md` — DELETE by default

The current glossary mixes:

- real project concepts;
- state/security rules already owned by conventions;
- generic software-engineering terms such as vertical slice, seam, adapter, deep module, and feedback loop;
- volatile implementation details such as cache naming/entitlement mechanics.

That makes it more likely to steer model vocabulary than to expose unique product truth.

Before deletion, inspect for any genuinely unique user-facing/domain term not represented in source or current billing/watch docs. Migrate only such unique domain meaning to the owning convention or feature documentation. Do not preserve generic vocabulary merely to keep the glossary alive.

If no unique durable product language remains, remove the product documentation directory.

## Research corpus — DELETE FROM WORKING TREE

Current directory contains date-stamped research including large context-layer audits/architecture studies and glass standards research. Their conclusions have already flowed into current context/design decisions.

Action:

1. confirm no current runtime/build/docs dependency consumes these files;
2. migrate any truly unique still-current external-source rationale into the surviving ADR/convention in concise form;
3. delete all research Markdown and the directory from the working tree;
4. do not create a replacement archive folder.

Git history remains the retrieval path for past research.

## Completed-plan archive — DELETE FROM WORKING TREE

This directory contains many completed plans, including multiple generations of context-layer and design/glass refactors. Labeling them non-normative does not prevent search/retrieval noise.

Action:

- delete the archive contents and directory;
- change `docs/plans/README.md` policy from "completed plans belong under archive" to "completed plans are deleted from the working tree; Git history preserves them";
- ensure no active docs link to archived plans;
- do not move them to a new history folder.

This is expected to be a large deletion-only diff. Large deletion count is not itself a problem; review should focus on whether any unique current knowledge was lost.

## `docs/plans/context-layer-v3/`

Keep active until the Context Layer v3 PR and this documentation cleanup are accepted. After final merge, delete it from the working tree rather than moving it to an archive directory.

## `docs/plans/docs-knowledge-prune/`

Keep this plan only while the cleanup is active. After acceptance, delete it from the working tree. Do not archive it.

## ADR directory

Follow `01-adr-disposition.md`. Retired/superseded ADRs are removed after the surviving current ADR set is self-contained and all repository references are fixed.

Update `docs/adr/README.md` lifecycle language so it explicitly states that Git history is the record for retired ADRs and numbers remain burned after deletion.

## Docs-lint after pruning

Once historical research/archive/retired ADR material is removed, simplify `scripts/docs-lint.mjs`.

Desired model:

```text
all Markdown remaining in the working tree
→ relative-link integrity
→ explicit repository-path integrity
→ bun-script reference integrity
→ encoding integrity
```

Strongly prefer removing these special cases if no historical corpus remains:

- `isRetiredEvidence()` / research/archive exclusions;
- deprecated/superseded ADR filtering;
- blanket skip of inline repository-path checking for ADRs.

Surviving ADRs should be current enough that explicit repository paths in them resolve. If an ADR needs to discuss a historical path, phrase it as historical prose rather than making a stale path look like a current repository reference.

Do not add semantic fact checking or generated documentation indexes.

## Docs health workflow

Review `.github/workflows/docs-health.yml` after deletion. It should scan the surviving documentation surfaces and not contain patterns for directories that no longer exist. External-link checking remains separate from deterministic local `docs:lint`.

## Expected result

The working tree should have a small, obvious knowledge hierarchy:

- current structure;
- current operating rules;
- a handful of load-bearing ADRs;
- active plans only;
- no historical research/archive corpus competing in search.
