# Documentation Knowledge-System Cleanup

## Status

Active handoff. Do not archive or delete this plan until the cleanup PR is accepted and CI is green.

## Objective

Make the repository working tree contain only documentation that is current, load-bearing, and useful to an engineer or coding agent making decisions today.

The governing model is:

```text
working tree = current operational knowledge
git history  = historical evidence
source/tests/config = executable truth
ADR = durable why for a costly/non-obvious decision
convention = current project-specific operating rule
plan = temporary state for active work only
```

This is intentionally stricter than merely labeling old material as archived or non-normative. Search, grep, semantic retrieval, and agent exploration can still surface historical Markdown that remains in the tree. If a historical document is no longer needed for current decisions, Git already preserves it.

## Why this cleanup is required

The Context Layer v3 implementation is mechanically healthy, but the documentation corpus still carries knowledge debt:

- many completed plans remain under `docs/plans/archive/` even though Git preserves their history;
- date-stamped research under `docs/research/` has already been distilled into current ADRs/conventions and can re-enter retrieval despite being marked non-normative;
- several ADRs are superseded, deprecated, negative non-decisions, implementation snapshots, or heavily amended documents rather than compact durable decisions;
- `docs/product/glossary.md` mixes real domain vocabulary with generic software-design vocabulary and duplicates state/security conventions;
- `docs/conventions/transpile-packages.md` records volatile framework behavior/absence rather than a durable project contract;
- `docs/README.md` still points at the older Context Layer v2 decision and does not accurately describe the current knowledge hierarchy.

## Principles

1. **Delete before reorganizing.** Do not create another archive hierarchy or index for material Git already stores.
2. **Keep only current truth in the working tree.** Historical context is retrieved through Git when explicitly needed.
3. **An ADR must earn its existence.** Keep an ADR only when the decision is still active, non-obvious, costly to reverse, and the rationale is not adequately visible from source/config/tests.
4. **Do not use ADRs as implementation diaries.** Exact versions, line numbers, file inventories, event lists, retry counts, cron expressions, or temporary migrations belong to source/config/tests unless they are themselves the durable decision.
5. **Conventions describe current project choices, not framework manuals.** Version-sensitive framework semantics come from installed/current framework documentation and project config.
6. **No generic agent/software doctrine.** Remove vocabulary/rules that a capable model or engineer can infer from normal practice.
7. **Security remains explicit.** High-consequence authorization, secret, migration, and tenancy boundaries may stay in prose even when mechanically reinforced.
8. **Make `docs:lint` simpler by making the corpus cleaner.** Prefer scanning all current docs to maintaining complex exclusions for historical material.

## Target working-tree shape

The intended end state is approximately:

```text
docs/
├── README.md
├── adr/
│   ├── README.md
│   ├── 0011-watch-sync-state-machine-and-observability-seam.md
│   ├── 0028-polar-billing-personal-tenancy.md
│   ├── 0029-inngest-durable-webhook-processing.md
│   ├── 0030-context-layer-v3-agent-judgment.md
│   └── 0031-ui-platform-contract.md
├── ai/
│   └── mcp.md
├── architecture/
│   └── overview.md
├── conventions/
│   ├── billing.md
│   ├── data-fetching.md
│   ├── design-system.md
│   ├── nextjs-project-profile.md
│   ├── supabase-security.md
│   └── testing.md
└── plans/
    ├── README.md
    └── <active plans only>
```

The exact surviving set may change if current source proves a document is still load-bearing. Any deviation must be justified by concrete repository evidence, not by a desire to preserve history in the working tree.

## Explicit anti-goals

Do not:

- create another archive/history directory under `docs/` for deleted historical Markdown;
- keep deprecated/superseded ADRs merely for traceability when Git already provides traceability;
- add a generated ADR index or documentation graph;
- introduce document token budgets or arbitrary size gates;
- turn `docs:lint` into a natural-language fact checker;
- change product/runtime behavior as part of documentation cleanup;
- weaken tests, lint, Fallow, policy, or CI to make a large deletion pass;
- preserve stale prose because another stale document links to it.

## Execution order

1. Read `01-adr-disposition.md` and resolve the ADR set first.
2. Read `02-docs-tree-disposition.md` and prune/migrate the rest of `docs/`.
3. Simplify documentation integrity behavior after historical material is gone.
4. Follow `03-execution-and-acceptance.md` for searches, verification, and final review.

## Source-of-truth precedence

When this plan conflicts with current implementation, use this order:

1. security/data invariants proven by migrations and focused tests;
2. source/config/manifests and generated contracts;
3. current mechanical gates;
4. accepted current ADRs/conventions;
5. this temporary implementation plan;
6. Git history.

Do not blindly preserve or delete a document solely because this handoff says so; verify its surviving claims against the current repository first.
