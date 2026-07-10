---
name: codebase-design
description: Design or improve single modules with small interfaces, deep implementations, clean seams, and testable public surfaces. Use when choosing test seams, refactoring shallow helpers, or making code easier for agents to navigate — not for scaffolding new feature slices.
---

# Codebase Design

Design deep modules: a small interface that gives callers substantial behavior,
with complexity kept local to the implementation.

## Reuse-first ladder

Before writing new code, walk this ladder top-down and stop at the first hit —
the cheapest code is the code you never wrote:

1. **Does it need to exist?** Drop speculative features, flags, and config nobody
   asked for (YAGNI).
2. **Already in this repo?** Reuse a feature module, `@pumni/*` package export,
   hook, or helper before re-implementing it.
3. **A platform / stdlib primitive?** Prefer Web / Node / React / Next built-ins
   over a hand-rolled equivalent.
4. **An already-installed dependency?** Use a catalog dep (`package.json`) rather
   than adding a new one.
5. **A one-liner?** Prefer the smallest expression that stays clear.
6. Only then write new code — the minimum that solves today's task.

   When the change spans more than one spot or is a structural reshuffle rather
   than new behavior, route to the `refactor-plan` skill to organize the steps
   before editing.

A new dependency or abstraction is a real cost; justify it against the rungs
above. This is the design-time companion to the simplicity rule in
`docs/ai/common-mistakes.md` (#11).

## Vocabulary

- **Module**: any unit with an interface and implementation; a function,
  feature module, package, or vertical slice.
- **Interface**: everything callers must know to use the module correctly:
  types, invariants, ordering, errors, config, auth requirements, cache behavior,
  and performance expectations.
- **Implementation**: the code hidden behind the interface.
- **Seam**: the place where callers and tests cross into a module.
- **Adapter**: a concrete implementation that satisfies an interface at a seam.
- **Depth**: the leverage callers get per unit of interface they must learn.
- **Locality**: the degree to which change, bugs, and verification concentrate
  in one module instead of spreading across callers.

## Rules

- Keep Web OS boundaries intact: RLS, server/client isolation, package graph,
  and feature module ownership outrank local design preferences.
- Prefer the highest stable seam for tests. The interface is the test surface.
- Apply the deletion test: if deleting a module only moves its complexity into
  callers, it was earning its keep; if complexity disappears, it may be a
  pass-through.

  Pair (abbreviated):

  ```text
  ❌ helper that just re-exports another module's function → delete it;
     callers should import the original.
  ✅ helper that owns sequencing A; B; C; adapt each (e.g. DB connect, txn,
     retry) and is the only place that knowledge lives → keep it.
  ```
- Do not introduce a seam just because it feels tidy. One adapter is usually a
  hypothetical seam; two real variants make the seam more credible.
- Accept dependencies instead of constructing hidden dependencies when it makes
  testing and locality better.
- Return explicit results where practical. Hidden side effects make tests and
  callers learn too much implementation detail.
- Keep route files thin. App Router files compose UI and delegate behavior to
  feature modules, actions, queries, hooks, or package APIs.

## Checklist

- [ ] Walked the reuse-first ladder; any new code, dependency, or abstraction is
      justified against existing repo, platform, and installed deps.
- [ ] The module has one clear interface.
- [ ] Callers do not need to know internal sequencing or storage details.
- [ ] Tests can exercise behavior through the same seam callers use.
- [ ] Complexity moved behind the interface instead of being spread across
      route files or callers.
- [ ] No new seam weakens RLS, auth, cache, server/client, or package
      boundaries.
- [ ] The design follows nearby production patterns unless there is a concrete
      reason to change them.
- [ ] The interface is demonstrated by a test through its public seam (a
      failing-then-passing test, or a named test seam) — `bun run test`.

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Module feels "shallow" | Interface is large but implementation is simple; callers do too much work. | Move logic from callers into the module implementation; shrink the public surface. |
| Tests require extensive mocking | The module has too many hidden dependencies or high coupling. | Pass dependencies as arguments; use smaller, cohesive interfaces at seams. |
| Changes in one package break others | Breaking change at a foundational boundary without verifying dependents. | Consult `docs/architecture/project-graph.md`; run `bun run typecheck` monorepo-wide. |
