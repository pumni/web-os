# Execution and Acceptance Protocol

## Purpose

This document defines how a coding agent should execute the Context Layer v3 refactor without turning the work into an unreviewable mega-change.

The coding agent is authorized to delete, rewrite, move, or create context/documentation/tooling files when that is required by the target state. Preserve product/security behavior unless a separate user request explicitly changes it.

## Required PR sequence

Use three implementation PRs. Do not combine them unless repository state proves they are inseparable.

### PR 1 — Unhobble persistent context

Primary scope:

- root/nested `AGENTS.md` cleanup;
- provider adapter validation;
- `context-lint` byte-budget removal and scope cleanup;
- `common-mistakes.md` migration/deletion;
- Next.js/architecture ownership corrections;
- stale design-system freshness metadata removal.

Do not rewrite large skills/design docs in this PR unless necessary to keep references valid.

### PR 2 — Reference-driven skills/docs

Primary scope:

- rewrite canonical skills;
- regenerate Claude skill pointers;
- consolidate Supabase security ownership;
- reshape design-system documentation;
- remove duplicated rule narration.

Do not add new harness infrastructure beyond what is required to validate these changes.

### PR 3 — Harness v3

Primary scope:

- introduce `docs:lint`;
- wire command ownership into `package.json`/CI;
- add Context Layer v3 ADR;
- final obsolete-context hygiene pass;
- document optional fresh-context reviewer/subagent technique without adding required LLM CI.

## Agent workflow for each PR

### 1. Re-audit current state

Before editing, inspect every file named in that phase. Search for new references and recent changes that landed after this plan.

Do not mechanically execute stale line-by-line instructions from this plan.

### 2. Build an ownership table

For each rule/claim being changed, identify its strongest owner:

```text
claim
→ source/config?
→ type/lint/build?
→ focused test?
→ security convention?
→ scoped AGENTS?
→ skill procedure?
→ ADR rationale?
```

If two prose files both claim canonical ownership, consolidate.

### 3. Edit by deletion first

Before adding explanatory text, try these in order:

1. delete generic/duplicated text;
2. replace copied facts with a source pointer;
3. replace prose correctness with an existing mechanical owner;
4. strengthen a focused mechanical owner if it has reliable signal;
5. only then add concise project-specific prose where judgment is genuinely required.

### 4. Keep security explicit

Do not over-apply the deletion philosophy to security boundaries.

Keep clear statements for high-consequence invariants such as:

- RLS is authorization, UI visibility is not;
- service-role/secret material is server-only;
- committed migrations are immutable history;
- security boundaries may not be weakened as implementation shortcuts.

These can coexist with mechanical enforcement because missing them early can cause expensive/unsafe agent decisions.

### 5. Verify narrowly while iterating

Use the smallest command that can disprove the current change.

Examples:

- context-only structural change → `bun run context:lint`;
- lint ownership change → affected package lint + focused characterization test;
- skill shim change → sync/check command + context lint;
- migration/security doc ownership change → focused migration/security tests if implementation semantics were touched;
- web route/framework context change → web typecheck/build when relevant.

Do not repeatedly run the full repository gate after every text edit.

### 6. Run broad proof before PR completion

For PR 1 and PR 2:

```sh
bun run context:lint
bun run policy:check
bun run verify
```

For PR 3 after `docs:lint` exists:

```sh
bun run context:lint
bun run docs:lint
bun run policy:check
bun run verify
```

Run additional focused tests for any mechanical rule changed.

### 7. Inspect the final diff as an evaluator

Use a fresh review pass (human or optional fresh-context agent) and ask:

- Did we remove useful project knowledge by mistake?
- Did we merely move duplication instead of deleting it?
- Did any adapter become a new policy owner?
- Does any doc claim a proof that the named command does not provide?
- Did we create a new meta-framework to solve a documentation problem?
- Are security boundaries still obvious before deep retrieval?
- Can a fresh agent discover the correct reference without reading archives/research?
- Did `verify` remain the canonical broad gate?

Independent model review is optional evidence, never a substitute for mechanical proof.

## Commit/PR quality

Each PR should tell one coherent architectural story. Avoid unrelated code cleanup.

PR description should contain:

- problem being removed;
- ownership model before/after;
- important deletions;
- mechanical owners retained/added;
- verification commands and results;
- any intentional deviation from this handoff and why current repository evidence required it.

## Stop conditions

Pause the refactor direction and reassess if any of these occur:

- removing an instruction causes a real security or architecture regression not caught by the harness;
- a proposed deterministic check produces material false positives;
- current Claude/Codex discovery behavior contradicts the planned shim architecture;
- a referenced source/test no longer exists because architecture changed substantially;
- the plan would require changing product behavior unrelated to context engineering.

In those cases, prefer current repository truth and document the deviation.

## Final acceptance rubric

### A. Persistent context quality

Pass only if:

- root `AGENTS.md` is a map/contract rather than a manual;
- all always-on rules are project-specific and high-signal;
- generic model-control boilerplate is absent;
- nested instructions are true local deltas.

### B. Retrieval quality

Pass only if:

- task-specific detail is reachable via clear JIT pointers;
- archives/research are not normal discovery dependencies;
- source/tests/config are preferred over duplicated prose inventories;
- skills point at authoritative evidence.

### C. Harness quality

Pass only if:

- mechanically expressible invariants have clear mechanical owners;
- `context:lint` checks context structure, not arbitrary semantics;
- `docs:lint` checks deterministic docs integrity with low false positives;
- `policy:check` remains focused;
- `verify` is one canonical broad gate.

### D. Provider portability

Pass only if:

- `AGENTS.md` remains canonical;
- Claude/Copilot adapters are thin;
- canonical skill bodies are provider-neutral;
- no duplicated Codex/Claude doctrine exists.

### E. Modern model compatibility

Pass only if:

- ordinary implementation choices are left to model judgment and repository evidence;
- hard rules correspond to real contracts, not habits from weaker model generations;
- optional context isolation/independent reviewers are permitted;
- no permanent agent fleet, prompt registry, or uncalibrated LLM-eval bureaucracy exists.

### F. Repository health

Pass only if:

- all changed references resolve;
- generated shims are synchronized;
- focused tests for changed mechanical owners are green;
- `bun run verify` is green;
- CI confirms the same broad proof in its environment.

## End-of-project cleanup

When all implementation PRs merge:

1. update the final v3 ADR status/links if needed;
2. delete this folder if the surviving ADRs and resulting repository state fully capture durable knowledge;
3. remove its active-plan link from `docs/plans/README.md`;
4. do not leave this handoff as permanent always-relevant context.
