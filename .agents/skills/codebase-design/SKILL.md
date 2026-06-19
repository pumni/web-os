---
name: codebase-design
description: Design or improve modules with small interfaces, deep implementations, clean seams, and testable public surfaces. Use when shaping feature modules, refactoring shallow helpers, choosing test seams, or making code easier for agents to navigate.
---

# Codebase Design

Design deep modules: a small interface that gives callers substantial behavior,
with complexity kept local to the implementation.

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
- Do not introduce a seam just because it feels tidy. One adapter is usually a
  hypothetical seam; two real variants make the seam more credible.
- Accept dependencies instead of constructing hidden dependencies when it makes
  testing and locality better.
- Return explicit results where practical. Hidden side effects make tests and
  callers learn too much implementation detail.
- Keep route files thin. App Router files compose UI and delegate behavior to
  feature modules, actions, queries, hooks, or package APIs.

## Checklist

- [ ] The module has one clear interface.
- [ ] Callers do not need to know internal sequencing or storage details.
- [ ] Tests can exercise behavior through the same seam callers use.
- [ ] Complexity moved behind the interface instead of being spread across
      route files or callers.
- [ ] No new seam weakens RLS, auth, cache, server/client, or package
      boundaries.
- [ ] The design follows nearby production patterns unless there is a concrete
      reason to change them.
