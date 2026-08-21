# Execution and Acceptance

## Delivery strategy

Treat this as a documentation/knowledge-system cleanup, not a product refactor. Prefer one focused cleanup PR after Context Layer v3 is stable, or a branch based on the accepted Context Layer v3 head. Do not mix unrelated product refactors into the deletion diff.

If this work is executed before PR #10 merges, keep PR #10 draft and make the relationship explicit. Do not declare Context Layer v3 complete while this cleanup is still an active acceptance requirement.

## Step 1 — Re-audit before deletion

Before deleting any file:

1. inspect current source/config/tests that own the same subject;
2. search the repository for references to the file and its ADR number/name;
3. identify any unique current claim not represented elsewhere;
4. migrate only that current claim to the correct surviving owner;
5. delete the stale/historical document rather than copying its full content elsewhere.

A large historical file must not survive simply because extracting one useful sentence feels inconvenient.

## Step 2 — Resolve ADRs first

Execute `01-adr-disposition.md` before deleting research/plans so current durable rationale has a clean home.

Required sequence:

1. verify 0011, 0028, 0029, and 0030 against current source/tests;
2. create compact ADR-0031 from the still-current decisions in 0010/0021;
3. compact surviving ADRs without changing their durable decision;
4. make ADR-0030 self-contained without requiring ADR-0027;
5. update all live references to surviving ADR IDs;
6. delete obsolete ADR files;
7. search again for deleted ADR IDs and inspect every remaining match.

Do not leave an Accepted ADR that contradicts current source merely to retain chronology.

## Step 3 — Prune non-operational docs

Follow `02-docs-tree-disposition.md`.

Deletion-first targets:

- `docs/plans/archive/`;
- `docs/research/`;
- `docs/product/glossary.md` unless unique current domain meaning is proven;
- `docs/conventions/transpile-packages.md`;
- obsolete ADRs from the disposition table.

Then fix references and rewrite the small surviving docs where needed.

## Step 4 — Simplify documentation policy

Update:

- `docs/README.md`;
- `docs/plans/README.md`;
- `docs/adr/README.md`.

The final policy should be simple:

```text
current docs stay in the working tree
active plans stay temporarily
completed/retired material is removed
git history is the archive
```

Do not retain a second set of historical-document lifecycle rules after adopting this policy.

## Step 5 — Simplify `docs:lint`

After historical material is removed, make the linter reflect the simpler corpus.

Acceptance target:

- every remaining Markdown file is considered current enough to validate;
- local links resolve;
- explicit repository paths resolve;
- `bun run <script>` references point to real scripts;
- encoding is clean;
- no natural-language policy parsing;
- no exclusions whose only purpose was tolerating stale archive/research/retired ADR content.

Keep helper extraction only where it actually reduces complexity/duplication. Re-run Fallow because changing the linter itself can introduce code-quality findings.

## Required repository searches

Use `rg`/equivalent and inspect results, not just exit codes.

### Deleted ADR references

Search for all IDs planned for deletion:

```text
ADR-0002
ADR-0003
ADR-0010
ADR-0021
ADR-0022
ADR-0025
ADR-0026
ADR-0027
```

Historical references may remain only in Git history, not current source/docs/comments unless there is a strong reason to cite a burned historical ID without needing its file.

### Historical-tree references

Search for:

```text
docs/plans/archive
docs/research
docs/product/glossary
docs/conventions/transpile-packages
```

There should be no current operational dependency on removed paths.

### Missing/stale ADR references

Specifically search for known stale references such as:

```text
ADR-0001
ADR-0012
```

No surviving current document should imply those missing files are required reading.

### Generic/old context doctrine

Search current docs/context for old patterns such as:

```text
think step by step
senior engineer
premature abstraction
AI must
always read
load all
context budget
llms.txt
agent fleet
LLM judge
```

Do not mechanically delete every lexical match; inspect whether it represents current rationale or stale doctrine. The goal is zero active generic model-control policy.

## Mechanical verification

Run focused checks while editing, then the full sequence before acceptance:

```sh
bun run fallow:audit --base origin/main --format compact --quiet
bun run context:lint
bun run docs:lint
bun run policy:check
bun run verify
```

If docs-health workflow patterns change, also inspect its first GitHub Actions run.

Do not weaken, suppress, or bypass a gate to accommodate the cleanup.

## Fresh-context review

After all edits and before marking ready, use a fresh review pass (human or isolated agent) with no reliance on the old archived docs.

The reviewer should answer:

1. Can a new coding agent understand repository structure starting from `AGENTS.md` without archived plans/research?
2. Does each surviving ADR explain a real active decision rather than implementation history?
3. Is any important security/business/platform rationale now missing?
4. Do current conventions point to source/tests rather than copying volatile inventories?
5. Can search for a current concept return current docs/source without old plans dominating results?
6. Does any current doc refer to a deleted/missing ADR/path as though it still exists?
7. Is Git history sufficient for every removed historical artifact?

## Final ADR acceptance rubric

A surviving ADR fails if any answer below is "no":

- Is the decision active today?
- Is it non-obvious?
- Is reversal meaningfully costly?
- Does the rationale matter beyond the implementation currently present?
- Are all current claims verified?
- Is the ADR materially more useful than source/config alone?
- Is it concise enough to be read as rationale rather than a historical transcript?

## Final docs acceptance rubric

Pass only if:

- working-tree docs are current operational knowledge;
- no `docs/research/` corpus remains unless a new concrete current use is demonstrated;
- no completed-plan archive remains in the working tree;
- no deprecated/superseded ADR file remains solely for historical traceability;
- the ADR set is approximately the target set in `01-adr-disposition.md` or every deviation has explicit current evidence;
- generic glossary/context doctrine has been removed;
- all current links, paths, commands, and ownership claims resolve;
- `docs:lint` no longer needs complexity primarily to tolerate stale historical docs;
- all required mechanical gates and CI are green.

## End state of this plan

After the cleanup PR is accepted and merged:

- delete `docs/plans/docs-knowledge-prune/` from the working tree;
- delete the completed `docs/plans/context-layer-v3/` plan if Context Layer v3 is also accepted;
- update `docs/plans/README.md` to show only genuinely active work;
- do not archive either plan inside the repository.
