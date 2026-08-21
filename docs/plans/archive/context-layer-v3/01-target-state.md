# Target State

## Purpose

Context Layer v3 treats the repository as the agent environment, not as a prompt container. The model should receive a small map, inspect authoritative state on demand, and get fast deterministic feedback from the harness.

## Target architecture

```text
user outcome
    ↓
small portable AGENTS.md contract
    ↓
nearest scoped AGENTS.md delta
    ↓
just-in-time references
    ├── source / manifests
    ├── tests / schemas / types
    ├── conventions / architecture docs
    ├── ADRs when rationale matters
    └── skills when a repeatable procedure applies
    ↓
agent implementation loop
    ├── inspect
    ├── change
    ├── focused validation
    └── observe failures
    ↓
mechanical owners
    ├── TypeScript
    ├── ESLint
    ├── framework build
    ├── unit/integration tests
    ├── migration/security tests
    ├── secret/policy checks
    └── CI
```

## Information placement rules

### Persistent context: `AGENTS.md`

Persistent context may contain only:

- repository identity and stack details that materially affect work;
- non-negotiable security boundaries;
- a small number of high-frequency architecture invariants;
- navigation to deeper references;
- the validation escalation path;
- rare project-specific gotchas that cannot be inferred reliably.

Persistent context should not contain:

- generic clean-code advice;
- generic role/persona instructions;
- detailed framework tutorials;
- duplicated package manifests/configuration;
- lengthy rationales;
- examples for behavior already enforced by tools;
- historical incidents unless they encode a still-live non-obvious constraint.

### Scoped context: nested `AGENTS.md`

A nested file exists only when entering that subtree changes what the agent needs to know.

A scoped file should be a delta from its parent. Do not repeat root security rules, general workflow, or commands unless the local command is materially different.

Delete a scoped file if all useful content can be inferred from source/config or replaced by a single parent pointer.

### Skills

Skills are procedures, not encyclopedias.

A good skill contains:

- a precise activation description;
- the authoritative references to inspect;
- the few non-obvious invariants that matter during the procedure;
- the workflow sequence;
- focused verification;
- failure modes only when they are not already obvious from tests/tool output.

A skill should not copy an entire convention document or restate implementation architecture line-by-line.

### Convention and architecture docs

Docs explain project-specific decisions and knowledge that is useful to humans and agents but is not naturally encoded in executable artifacts.

Prefer links to source-of-truth files rather than copied inventories. For example:

- read the exact version from `package.json` rather than maintaining a version table in prose;
- read enabled framework flags from `next.config.ts` rather than duplicating them unless the consequence is non-obvious;
- read token inventories from CSS sources rather than copying token lists into docs;
- read package edges from manifests/import rules rather than maintaining a generated dependency map.

### ADRs

ADRs preserve rationale and decision history. They are not active instruction files unless a current context file explicitly points to one for rationale.

Do not rewrite historical ADRs to make history appear cleaner. Create a superseding ADR when operational guidance changes materially.

### Plans and research

Plans are temporary execution state. Research is evidence. Neither outranks current source, tests, scoped instructions, or accepted architecture decisions.

Archived plans must never be part of normal context discovery.

## Mechanical ownership principle

Every invariant should have exactly one strongest owner.

Examples:

| Invariant | Preferred owner |
| --- | --- |
| package/type compatibility | TypeScript/build |
| forbidden imports | ESLint |
| feature public API boundary | ESLint + focused characterization test |
| generated DB type correctness | generator + TypeScript |
| RLS/policy behavior | migration/security tests + Supabase semantics |
| secret exposure | server-only/build + focused secret scan |
| design token restrictions | ESLint/tests where signal is reliable |
| workflow discovery integrity | `context:lint` |
| documentation references | `docs:lint` |

Prose may explain an invariant but should not pretend to be its proof when a stronger owner exists.

## Model-judgment principle

Current frontier models should be allowed to inspect evidence and choose implementation details. Avoid hard-coding generic heuristics such as:

- "never abstract before a second caller";
- "always use the existing pattern";
- "always make the smallest diff";
- "always plan before coding";
- "always/never use a particular implementation technique" when the restriction is not actually architectural.

Use hard language only for genuine project/security contracts.

## Context isolation and independent review

Ephemeral subagents or independent reviewers are allowed when isolation improves signal, for example:

- exploring unrelated parts of a large change in parallel;
- reviewing a security-sensitive diff with a fresh context;
- validating acceptance criteria independently of the implementing agent;
- researching framework behavior without polluting the main implementation context.

Do not build permanent multi-agent infrastructure merely because agents are available. Use isolation as a task-level technique, not repository bureaucracy.

## Provider neutrality

Canonical knowledge belongs in portable repository surfaces. Provider-specific files should only adapt discovery mechanics.

Target:

```text
AGENTS.md                canonical guidance
CLAUDE.md                @AGENTS.md compatibility import
.agents/skills/**         canonical skill bodies
.claude/skills/**         generated Claude discovery pointers
.github/copilot-*         thin pointer if retained
```

Do not introduce independent Codex/Claude policy copies.

## Desired end-user behavior

A fresh coding agent should be able to:

1. read the root map;
2. enter the task subtree and receive only the local delta;
3. discover the exact source/tests/docs required for the task;
4. make decisions from repository evidence rather than remembered framework folklore;
5. get deterministic feedback from focused gates;
6. escalate to `bun run verify` for broad proof;
7. leave durable project truth in source/tests/docs rather than conversation history.
