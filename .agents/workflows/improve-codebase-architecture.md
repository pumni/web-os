# Improve Codebase Architecture

Use this workflow only when the user asks for architecture review or codebase
health work. It surfaces candidates first; it does not refactor immediately.

## Process

1. Read `docs/ai/index.md`, `docs/architecture/overview.md`,
   `docs/architecture/project-graph.md`, `docs/ai/domain-language.md`, and ADRs
   relevant to the area.
   Also read boundary docs for the area under review: server/client,
   data-fetching, Supabase security, feature modules, and package-specific
   `AGENTS.md` files as applicable.
2. Use the `codebase-design` vocabulary: module, interface, implementation,
   seam, adapter, depth, locality.
3. Explore organically for friction:
   - route files owning business logic,
   - shallow helpers that only pass complexity through,
   - seams that tests cannot use,
   - duplicated behavior across feature modules,
   - server/client, state, or package boundaries under pressure.
4. Report candidates before editing. Do not propose a concrete patch until the
   user selects a candidate.

## Candidate Format

```md
## Candidate: [Name]

Files:
Problem:
Proposed change:
Benefits:
Recommendation strength: Strong | Worth exploring | Speculative
Validation:
```

## Rules

- Do not contradict RLS, server-only, package-boundary, or state-ownership
  rules.
- Do not recommend extraction unless it reduces caller knowledge or
  concentrates verification behind a stable interface.
- Mark any ADR conflict explicitly and explain why the friction may justify
  revisiting it.
- Ask which candidate to explore before proposing a concrete interface or patch.
