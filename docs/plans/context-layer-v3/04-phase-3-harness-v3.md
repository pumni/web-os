# Phase 3 — Harness v3 and Verification

## Goal

Finish the modernization by making context integrity, documentation integrity, and repository correctness explicit but separate. Add support for modern agent workflows without creating permanent AI bureaucracy.

## Files likely in scope

- `scripts/context-lint.mjs`
- new `scripts/docs-lint.mjs`
- `package.json`
- `.github/workflows/ci.yml`
- `.github/workflows/docs-health.yml`
- `docs/adr/README.md`
- new `docs/adr/0030-context-layer-v3-agent-judgment.md` (number may change if another ADR lands first)
- context/docs files affected by the new lint ownership

Resolve current repository state before creating the ADR number or changing scripts.

## 1. Split context integrity from docs integrity

### `context:lint` owns discovery integrity

Keep it narrow:

- required canonical context files;
- provider shim integrity;
- skill discovery metadata/schema;
- active context pointers/commands required for agent discovery;
- no orphan generated adapters;
- basic encoding corruption on active context surfaces.

It should remain fast and low-noise.

### `docs:lint` owns repository documentation integrity

Create a small deterministic script that checks the documentation corpus for concerns such as:

- broken relative Markdown links;
- broken repository paths written as explicit code/link references when they can be identified reliably;
- references to missing `bun run <script>` commands;
- encoding corruption;
- optional frontmatter shape only where the repository intentionally standardizes it.

Do not turn `docs:lint` into a natural-language fact checker.

Do not parse arbitrary prose into a private architecture policy language.

False positives are a failure of the tool design. If a check cannot be made reliably, leave it to review rather than adding brittle regex governance.

## 2. Integrate with scripts and CI

Add a `docs:lint` package script.

The broad validation chain should conceptually become:

```text
context:lint
    ↓
docs:lint
    ↓
policy:check
    ↓
other mechanical gates
    ↓
lint / typecheck / test / build
```

Keep `bun run verify` as the canonical broad proof unless repository evidence shows a better existing owner.

Do not add a second competing pre-merge command.

### Docs health workflow

The scheduled external-link checker may remain separate from local deterministic `docs:lint` because external network health is a different concern.

Avoid duplicating the same local link checks in multiple scripts/workflows unless one is intentionally defense-in-depth and cheap.

## 3. Add a superseding Context Layer v3 ADR

Do not rewrite the retired context decision to pretend the earlier decision used today's model capabilities.

Create a new ADR that records the operational update.

### Required decision points

- retain portable `AGENTS.md` + thin provider adapters;
- retain progressive disclosure and scoped local deltas;
- retain mechanical owners over prose;
- remove arbitrary persistent-context size gates;
- favor model judgment over generic prescriptive heuristics;
- favor implementation/tests/rich references over prose duplication;
- permit ephemeral subagents/verifiers when context isolation or independent judgment improves task quality;
- continue rejecting a permanent agent fleet framework, prompt registry, generated context graph, and uncalibrated LLM-as-judge CI program;
- split context discovery integrity from general docs integrity;
- document that plans/research/archived materials are subordinate evidence.

### Important distinction

The ADR must distinguish:

```text
allowed technique:
  fresh-context reviewer / task-level subagent / parallel explorer

from

rejected infrastructure:
  persistent agent fleet / orchestration bureaucracy / model benchmark theater
```

This avoids carrying forward the old assumption that all multi-agent or evaluator usage is undesirable.

## 4. Independent verification guidance

Do not add a required LLM-review CI job.

Instead, document optional task-level usage:

- security-sensitive changes may benefit from a fresh-context reviewer;
- large refactors may use separate exploration agents for isolated subtrees;
- an implementing agent may ask an independent agent to evaluate acceptance criteria;
- reviewers must inspect repository evidence and tests, not score wording similarity.

Mechanical gates remain the required repository proof.

## 5. Long-running task state

Do not use an ever-growing conversation as project memory.

For future large implementation efforts, durable active state belongs in a small active plan under `docs/plans/` when needed. State documents should record only:

- objective;
- current state;
- accepted decisions;
- remaining work;
- known failures/blockers;
- verification state.

Archive or delete them when work completes. Do not create permanent status bureaucracy for routine tasks.

## 6. Final hygiene audit

After all three phases, search for and remove obsolete patterns introduced by previous generations of context engineering:

- duplicated provider-specific policy;
- generic "AI must..." manuals;
- prompt/persona boilerplate;
- generic reasoning instructions;
- hard context-size correctness budgets;
- stale tool/version inventories duplicated from manifests;
- claims that a command proves something it does not check;
- active references to deprecated eval/agent-fleet infrastructure;
- archived plans referenced as current procedure;
- repeated security/design doctrine across three or more context layers.

Do not remove historical ADR/archive records solely because they describe the old approach. Make sure they are clearly non-operational instead.

## 7. Verification

Minimum final proof:

```sh
bun run context:lint
bun run docs:lint
bun run policy:check
bun run verify
```

Also run any focused tests changed while moving mechanical ownership.

Review CI workflow output after the first branch run. A locally green command is insufficient if CI exercises a materially different environment.

## Acceptance criteria

- context and docs lint responsibilities are separate and understandable;
- `verify` remains one canonical broad gate;
- no arbitrary context byte/token gate returns under another name;
- a new ADR records the v3 philosophy without rewriting history;
- ephemeral subagent/independent review is allowed as a technique but not mandated as infrastructure;
- no permanent LLM eval/fleet/meta-governance system is introduced;
- active docs accurately describe the actual mechanical owners;
- scheduled external docs health remains useful and non-duplicative;
- all repository gates are green.
