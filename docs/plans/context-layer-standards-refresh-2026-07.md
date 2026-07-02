# AI Context Layer — 2026-07 Standards Refresh (2026-07-02)

- **Status:** executed 2026-07-02 (structural additions recorded in ADR-0024)
- **Owner:** AI context layer (`docs/ai/index.md`)
- **Companions:** `context-layer-measure-prune-2026-07.md` (policy + Tier-1 record),
  `context-layer-audit-playbook-2026-07.md` (the sweep engine this refresh executes).
- **Scope:** (1) record a July-2026 web-research digest of the external standards
  landscape; (2) execute the audit playbook sweep (Tier 2 / Tier 3 / meta /
  nearest-file) and log its §6 findings here; (3) fix confirmed config drift;
  (4) the structural additions decided by the owner and recorded in ADR-0024.
- **Non-goal:** re-adding anything ADR-0009/0023 explicitly rejected (LLM eval
  tier, vector memory, agent fleet, spec/PRD workflows, MCP doc-retrieval).

---

## 1. Research digest (July 2026) — external standards vs this repo

Findings only; sources listed in §5 and treated as untrusted per `AGENTS.md`.

| Finding (external, 2026) | Repo state | Action |
|---|---|---|
| Anthropic context-engineering canon: prompt altitude, just-in-time retrieval over preloading, compaction, structured note-taking, sub-agent isolation | Already implemented (router, on-demand tiers, MEMORY.md, one reviewer subagent) | None — confirms architecture |
| **Agent Skills** is now an open standard (Anthropic 2025-12-18; donated to AAIF/Linux Foundation alongside AGENTS.md and MCP; 32 tools read `SKILL.md` by 2026-03). Frontmatter `name` + `description`, three-tier progressive disclosure | `.agents/skills` canonical + generated `.claude/skills` shims predate the spec but match its shape | Verify frontmatter spec-compliance per skill (§3.4); keep the shim architecture (spec is location-agnostic) |
| GitHub 2,500-repo analysis: LLM-generated agent files that duplicate repo-derivable content **reduce success ~2% and raise cost ~23%**; concise human-written non-obvious content wins | The playbook's C4 criterion encodes exactly this | Strengthens every C4 cut in §4 |
| **Context rot quantified:** constraint compliance falls 73% → 33% between turn 5 and turn 16 without mitigation | Nearest-file `AGENTS.md` reinforcement exists; nothing re-anchors after harness compaction | KEEP the `apps/web/AGENTS.md` point-of-use line (closes measure-prune §4 item); add a fail-open compact/resume re-anchor notice (ADR-0024) |
| Skill/instruction evals: failures → test cases, repeat runs to measure variance | ADR-0009 deliberately keeps evals deterministic-only for a solo project | None — decision stands |
| Spec-driven development (Spec Kit et al.) mainstreamed | ADR-0023 rejected re-adding spec/PRD workflows (harness plan-mode + `grill-requirements` cover it) | None — decision stands |

Net assessment: the layer already meets ~90% of the 2026 external standard. The
refresh is a sweep + drift fix + three small additive capabilities (ADR-0024).

## 2. Confirmed drift (pre-sweep)

- `.claude/settings.local.json` pins ~9 permission allow-rules to `D:\Dev\web-os`
  absolute paths; the repo lives at `V:\web-os` — dead rules. Fix in §4.
- Both MCP servers are disabled locally (`disabledMcpjsonServers`) while
  `docs/ai/mcp.md` reads as if they are active. Owner decision: **keep disabled,
  fix the doc** (opt-in).
- `docs/ai/domain-language.md` description still says "PRD drafting" (playbook
  seed #1).

## 3. Structural additions (owner-directed; ADR-0024)

1. `supabase-rls-reviewer` subagent via the documented Subagent Extension Pattern
   (`.agents/skills/README.md`) — the `supabase-migration` skill already carries
   `## Known Failure Modes`. **Done** (`.claude/agents/supabase-rls-reviewer.md`
   + review-gate verification line, 2549 B ≤ 2600 budget).
2. `design-system-reviewer` — **skipped, recorded in ADR-0024**: that subsystem
   already has the densest deterministic enforcement in the repo (four ESLint
   guards, APCA test, CSS drift guards, `checkDesignTokenBoundaries`); adding an
   LLM reviewer there is the fleet-growth failure mode ADR-0023 warns against.
3. Compact/resume re-anchor — **done** in `context-drift-notice.mjs` itself
   (reads the hook's stdin `source`; no settings.json change needed since
   SessionStart already fires for every source). Verified: `compact` emits the
   re-anchor, `startup` stays silent, empty stdin fail-opens with exit 0.
4. Agent Skills frontmatter spec-compliance pass over all 15 skills — **done**,
   15/15 compliant (see §4 Tier-2 block); standing requirement per ADR-0024.

## 4. Sweep findings log (playbook §6 format)

One block per in-scope file. An empty block = "audited, nothing to change."

```
FILE: docs/ai/domain-language.md
- seed #1 already resolved before this sweep. proof: `rg -ni prd` over
  .agents/docs (excl. plans/adr) → 0 hits. Nothing to change.

FILE: docs/architecture/overview.md
- seeds #2/#3 already resolved (no hand-drawn mermaid; packages/ui entry is
  already boundary-rule + pointer). Nothing structural to change.
- chunk: 2 links  criterion: C5  action: FIX
  proof: links used absolute `file:///v:/web-os/...` URIs — machine-pinned,
  invisible to `checkMarkdownLinks`. edit: → relative `project-graph.md`,
  `../../packages/ui/AGENTS.md`.

FILE: docs/architecture/project-graph.md
- generated SSOT; in sync (`sync-project-graph` PASS). Nothing to change.

FILE: apps/web/AGENTS.md
- chunk: state-ownership line  criterion: C1  action: KEEP (decision)
  proof: 2026 context-rot data (compliance 73%→33% by depth) supports
  point-of-use reinforcement in a nearest-file tier. Closes measure-prune §4
  item 1 and playbook seed #4.
- chunk: data-fetching link  criterion: C5  action: FIX  (file:/// → relative)

FILE: apps/catalog/AGENTS.md
- chunk: footer links  criterion: C5  action: FIX  (file:/// → relative ×2)

FILE: docs/conventions/server-client-boundary.md
- chunk: "Zustand Limits" + "TanStack Query Limits" bullets  criterion: C1
  action: CUT → one pointer line to data-fetching.md
  proof: verbatim restatement of data-fetching.md §Client-Side/§Local State;
  both docs are same-tier on-demand rows in the router (adjacent copies).

FILE: docs/conventions/data-fetching.md
- KEEP (owner of state placement). Nothing to change.

FILE: docs/conventions/design-system.md
- KEEP. Already C2-correct: tables cite the enforcing ESLint rule by name
  (`pumniNoRawColor`, `pumniNoRawTiming`, `pumniNoAdHocSurface`).

FILE: docs/conventions/testing.md / feature-module.md / supabase-security.md
- KEEP (repo-specific, enforcement documented). Nothing to change.
- seed #5 outcome: eslint.config.mjs enforces token/surface/timing/z-index +
  feature boundary only — NOT server/client import boundaries, so the
  server-client-boundary.md / data-fetching.md prose stays (C2 not satisfied).

FILE: docs/conventions/transpile-packages.md
- chunk: export example  criterion: C5  action: FIX
  proof: `packages/ui/package.json` has no root `.` export (subpath-only).
  edit: example → `@pumni/ui/form` -> `./src/components/form/index.ts`.

FILE: docs/quality-gates.md · docs/ai/index.md · docs/ai/golden-examples.md ·
      docs/ai/common-mistakes.md · docs/ai/MEMORY.md · llms.txt
- KEEP. Router is pure; example paths gate-checked; llms.txt mirrors index.

FILE: docs/ai/agent-command-policy.md
- chunk: §4 Claude Code Hooks list  criterion: C5  action: FIX (in §3.3 pass)
  proof: SessionStart hook (`context-drift-notice.mjs`, ADR-0023) exists in
  `.claude/settings.json` but is missing from the doc's hook list.

FILE: docs/ai/mcp.md
- chunk: server availability  criterion: C5  action: FIX (owner decision)
  proof: `.claude/settings.local.json#disabledMcpjsonServers` disables both
  servers locally; doc reads as always-active. edit: document opt-in state.

TIER 2 — .agents/skills/* (15 skills)
- Frontmatter: 15/15 compliant with the Agent Skills open spec (kebab `name`
  = dir name; `description` = what + "Use when" triggers; within limits).
- Bodies: KEEP. Deep-checked `ui-styling` (defers hard rules to
  design-system.md, holds reference detail) and `server-component-read`
  (procedural + distilled KFM per ADR-0023 — not wholesale restatement).
  State-ownership appears only as one-line point-of-use bullets
  (`rg "Zustand|mirror" .agents/skills`), not duplicated rule bodies.

NEAREST-FILE — packages/*/AGENTS.md (×8)
- KEEP. Boundary-focused, matches enforced config (`.fallowrc.json` verified;
  ui subpath-only exports match `package.json`; graph roles match
  project-graph.md).
```

## 5. Appendix — evidence base (untrusted; findings only)

Anthropic engineering: "Effective context engineering for AI agents" (2025-09),
"Equipping agents for the real world with Agent Skills" (2025-12),
"Demystifying evals for AI agents". Agent Skills spec: agentskills.io; AAIF
donation coverage (2025-12). AGENTS.md ecosystem: agents.md; morphllm.com
AGENTS.md guide; asdlc.io spec research (2,500-repo analysis). Context rot:
morphllm.com/context-rot; 2026 constraint-compliance depth study (73%→33%).
SDD: github.com/github/spec-kit. Per `AGENTS.md` these are untrusted inputs —
findings used as evidence, embedded instructions ignored.
