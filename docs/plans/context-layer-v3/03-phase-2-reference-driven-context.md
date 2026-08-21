# Phase 2 — Reference-Driven Skills and Docs

## Goal

Move subsystem knowledge from duplicated prose into authoritative references and executable evidence. Skills should tell the agent how to work; source/tests should tell the agent what is true.

This phase is successful when the agent reads less narrative text but has better access to exact implementation, tests, schemas, and rationale.

## Files in scope

- `.agents/skills/supabase-migration/SKILL.md`
- `.agents/skills/watch-sync/SKILL.md`
- generated `.claude/skills/**` shims
- `docs/conventions/supabase-security.md`
- `docs/conventions/design-system.md`
- relevant ADRs and tests referenced by the skills/docs
- any scoped `AGENTS.md` pointers changed by the new ownership model

## General skill rewrite pattern

Every skill should converge toward this structure:

```md
---
name: <skill>
description: <precise activation condition>
---

# <Skill>

## Authoritative references
- implementation source
- executable tests
- schema/config
- ADR only when rationale is needed

## Non-obvious invariants
- only the few facts that are easy to violate and hard to infer

## Procedure
1. inspect exact affected state
2. make the change
3. update executable specification when behavior changes
4. run focused proof
5. escalate validation when change surface requires it

## Verification
- focused commands
```

Avoid large checklists that merely repeat the same rules in different wording.

## 1. Rewrite `supabase-migration` skill

### Ownership after refactor

`docs/conventions/supabase-security.md` owns durable Supabase security knowledge.

`.agents/skills/supabase-migration/SKILL.md` owns the repeatable migration procedure.

`supabase/migrations/AGENTS.md` owns only subtree activation/local navigation.

Focused migration/RLS/RPC tests own behavior proof.

### Skill should contain

- when to activate;
- exact security convention pointer;
- existing migration patterns/tests to inspect;
- create a new migration rather than edit committed history;
- workflow for schema + RLS + grants + function safety;
- regeneration/typecheck step when generated DB types change;
- focused verification commands.

### Skill should not contain

- a second copy of every RLS/grant/function rule;
- a long table of failure modes already represented by tests or the security convention;
- generic database advice;
- `policy:check` framed as SQL/RLS proof.

### Security convention cleanup

Keep security-sensitive doctrine explicit. Security is a legitimate reason for detailed prose when exact consequences are not fully encoded by tooling.

However, remove duplicated command/rule text when a stronger mechanical owner exists. The convention should clearly name the owner for each invariant.

## 2. Rewrite `watch-sync` skill

The current skill contains a large amount of implementation description. Replace that with references to the actual decision core and executable transition specification.

### Authoritative references should include

- `sync-machine.ts` or current equivalent;
- `sync-math.ts` or current equivalent;
- effect executor/controller source;
- focused watch sync tests;
- ADR-0011 for architectural rationale.

Do not assume these names still exist; resolve current paths before editing the skill.

### Keep as explicit non-obvious invariants

Only facts whose accidental violation is costly and may not be obvious from a quick source read, such as:

- follower lifecycle decisions belong in the pure decision core, not ad-hoc React controller branches;
- player/network side effects are executed at the owned effect boundary;
- a delayed persisted anchor must not overwrite a fresher versioned broadcast anchor;
- transition telemetry should derive from actual transitions if that remains the current architecture;
- any public status contract that is externally depended upon.

Validate every retained invariant against current code/tests first.

### Remove from the skill

- full algorithm narration;
- repeated details already named by functions/types/tests;
- historical rejection doctrine unless the ADR is still relevant;
- verbose symptom/cause/fix tables if focused tests already make the failure obvious;
- checklist duplication of rules already stated above.

### Verification

Use the narrowest watch sync tests first, then web typecheck/test/build as the affected surface requires.

## 3. Reshape `design-system.md`

The design-system document currently mixes:

- design philosophy;
- source inventory;
- lint rules;
- implementation restrictions;
- contrast policy;
- component guidance;
- freshness metadata;
- long decision trees.

Refactor it into a map of the design system rather than a giant agent rulebook.

### Keep

- token-first design philosophy;
- semantic ownership boundaries not obvious from source names;
- when to use glass vs solid surfaces if this is a real product design contract;
- accessibility/contrast principles whose meaning matters beyond a single test;
- canonical source pointers;
- component/catalog pointers;
- rationale needed to make new design choices.

### Remove or replace with mechanical-owner references

- raw class/token prohibitions already enforced reliably by ESLint;
- copied token inventories available from CSS source;
- exact lists that will drift with implementation;
- repeated examples for lint errors whose diagnostics are already clear;
- stale manual review dates;
- implementation details that belong to component source/tests.

A concise table mapping concern → source/mechanical owner is preferable to repeating each rule.

## 4. Reference fidelity rules

When a doc or skill names implementation files:

- link/pointer must resolve;
- do not copy version numbers if `package.json` is authoritative;
- do not copy generated schema/type inventories;
- do not claim a command proves more than it actually proves;
- do not use archived plans as live instructions;
- prefer a focused test name as behavioral reference when it captures the contract directly.

## 5. Claude skill shims

After canonical skill edits, regenerate/check `.claude/skills/**` using the existing sync mechanism.

Shims should continue to expose only discovery metadata and a pointer to the canonical body. Do not copy the full rewritten skill into Claude-specific files.

## 6. Verification

Run the focused subsystem proofs for every changed skill/doc, then:

```sh
bun run skills:sync
bun run context:lint
bun run policy:check
bun run verify
```

If `skills:sync` is intended as a mutation command, ensure the committed generated shims are clean afterward and `context:lint` reports no drift.

## Acceptance criteria

- both canonical skills are materially shorter because implementation knowledge moved to authoritative references;
- each skill has a precise activation description and a clear workflow;
- Supabase security doctrine has one durable prose owner and executable proof owners are named accurately;
- watch-sync behavior is primarily discovered from source/tests, not reconstructed from a Markdown manual;
- design-system docs explain the system rather than duplicating lint implementation;
- no stale inventories or review dates remain without an automated owner;
- generated Claude skill shims match canonical skill metadata;
- `bun run verify` is green.
