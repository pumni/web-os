# 0001. Structured Prompting and Model Routing Guidance

- **Status:** Accepted
- **Date:** 2026-06-18
- **Owner:** AI context layer (see `docs/ai/index.md`)

## Context

An "Enterprise AI Context System Blueprint" was proposed for this repo. Its
enforcement, security, static-analysis, and untrusted-content layers were
already present and stronger than the blueprint described (see
`docs/plans/ai-context-audit.md`). Two capabilities the blueprint covers were
genuinely missing from this repo:

1. **Structured prompting** — XML tagging (`<context>`, `<requirements>`,
   `<task>`) and `<thinking>` chain-of-thought to keep multi-constraint tasks
   from dropping a constraint.
2. **Model routing guidance** — advice on which class of model fits which class
   of task, so a task can be matched to a model deliberately rather than by
   default.

The blueprint also proposed wholesale changes this repo declines: a migration to
a numbered `docs/01-architecture/…` taxonomy, a rewrite of `AGENTS.md`, and
Prisma-based domain/SSOT artifacts. This repo is **Supabase-first** (RLS is the
P0 security mandate), already has a working manifest-enforced instruction plane,
and follows a surgical, link-don't-duplicate change policy. Adopting the
blueprint wholesale would break `bun run ai:check` and create a parallel,
drifting documentation structure.

## Decision

32: 1. **Add structured prompting as optional, scoped guidance.** (Note: docs/ai/prompt-structure.md has been merged into docs/ai/agent-behavior.md; prompt-playbook.md was merged there in the 2026 efficiency overhaul).
33:    The guidance covered XML tagging and `<thinking>`. Scope it
34:    to multi-constraint tasks (R2 Supabase/RLS, multi-package, architecture- or
35:    cache-boundary work). Explicitly recommend **against** it for R0 and small R1,
36:    where tags add noise without value. Link to existing anchors
37:    (`docs/ai/golden-examples.md`, `docs/ai/common-mistakes.md`) rather than
38:    duplicating examples.
39: 
40: 2. **Add model routing as advisory guidance, not config.** (Note: docs/ai/model-routing.md has been deleted in 2026 overhaul).
41:    It proposed a task-type → model-class table. Pin no
42:    vendor and no model name. State firmly that model routing is **P6 (task
43:    intent)** and cannot override P0–P4, and that `ai:check` + `ai:eval` always
44:    run regardless of model.
45: 
46: 3. **Decline wholesale blueprint adoption.** Keep the Supabase-first
47:    constitution (`AGENTS.md`), the existing `docs/{ai,architecture,conventions}`
48:    structure, and the manifest-enforced plane. Do not migrate to the numbered
49:    taxonomy, do not rewrite `AGENTS.md`, and do not add Prisma artifacts.
50: 
51: 4. **Seed `docs/adr/`.** Establish the ADR directory (reserved at P3 in
52:    `AGENTS.md` until now) with `docs/adr/README.md` defining a MADR-lite format
53:    (Status / Context / Decision / Consequences / Alternatives) and a
54:    never-delete lifecycle. Record this decision as `0001`.
55: 
56: 5. **Enforce the two new `docs/ai/*` files via the manifest.** Add both to
57:    `requiredFiles`, `frontmatterRequired`, and `indexRequiredReferences` in
58:    `scripts/ai-context.manifest.json`, and add a row for each in
59:    `docs/ai/index.md`. Do **not** add `docs/adr/*` to the enforced arrays —
60:    their lifecycle differs (status transitions, never deleted); backtick
61:    references to ADRs from enforced docs remain validated by
62:    `checkDocPathReferences`.
63: 
64: ## Consequences
65: 
66: **Positive:**
67: 
68: - Two real capability gaps are closed, in this repo's house style, without
69:   disrupting enforcement or security.
70: - `docs/adr/` now exists with a documented format, so future architecture
71:   decisions have a home.
72: - Wholesale adoption of an incompatible (Prisma-based, taxonomy-shifting)
73:   blueprint is explicitly declined on the record.
74: 
75: **Negative / costs:**
76: 
77: - Two new files to maintain in the manifest and index. Adding a future
78:   `docs/ai/*.md` file now has a known three-array + index-row cost.
79: - Structured prompting adds tokens on the tasks where it is used; mitigated by
80:   scoping it to R2 and multi-constraint work only.
81: - Model routing guidance may age as model offerings change; mitigated by
82:   keeping it at the class level and pinning no vendor.
83: 
84: **Neutral:**
85: 
86: - ADRs are intentionally not manifest-enforced. If ADR drift becomes a problem
87:   later, harden them then; do not pre-emptively over-enforce.
88: 
89: ## Alternatives considered
90: 
91: - **Migrate to the blueprint's numbered taxonomy and rewrite `AGENTS.md`.**
92:   Rejected: breaks the manifest gate, conflicts with the Supabase-first
93:   constitution, and violates the repo's surgical-change policy. The blueprint's
94:   useful ideas (prompt structure, model routing) can be adopted without its
95:   structural prescriptions.
96: 
97: - **Add Prisma-based domain/SSOT artifacts.** Rejected: this repo has no
98:   Prisma. The data layer is Supabase with RLS as the P0 boundary.
99: 
100: - **Write two separate ADRs (0001 prompting, 0002 routing).** Rejected for now:
101:   the two decisions were made together as a single response to the blueprint,
102:   and one record captures their relationship cleanly. They can be split later
103:   if one is superseded independently.
104: 
105: - **Manifest-enforce `docs/adr/*`.** Rejected: ADRs transition status and are
106:   never deleted, unlike the enforced `docs/ai/*` set. Backtick-reference
107:   validation is sufficient for now.
108: 
109: ## References
110: 
111: - `AGENTS.md` — P0–P6 priority stack; P3 = ADRs.
112: - `docs/plans/ai-context-audit.md` — audit that identified the two gaps and
113:   recommended this work.
114: - `docs/ai/agent-behavior.md` — risk classification (R0/R1/R2) and Mini-PRD
115:   (merged from prompt-playbook.md in the 2026 efficiency overhaul); this ADR's
116:   prompting decision complements, not replaces, that guidance.
116: - docs/ai/prompt-structure.md (merged), docs/ai/model-routing.md (deleted) — the deliverables.
