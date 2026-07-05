# 0024. Context Layer — 2026-07 Standards Refresh

- **Status:** Accepted
- **Date:** 2026-07-02
- **Owner:** AI context layer (see `docs/ai/index.md`)

## Context

ADR-0023 re-froze the layer pending a new measured trigger. Two external shifts
since then, plus an owner directive, constitute that trigger (evidence digest:
`docs/plans/context-layer-standards-refresh-2026-07.md` §1):

1. **Agent Skills became an open standard** (Anthropic 2025-12; donated to the
   AAIF/Linux Foundation alongside AGENTS.md and MCP; ~32 tools consume
   `SKILL.md` by 2026-03). The skill layer is now a cross-tool interface, not a
   Claude-only convenience — spec compliance is an interop requirement.
2. **Context rot was quantified**: instruction compliance decays sharply with
   conversation depth (a 2026 depth study measured 73%→33% between turns 5 and
   16). The layer re-anchors nothing after harness compaction, exactly where
   that decay bites.

## Decision

Three additive capabilities; every existing gate and budget is kept:

1. **Extend the ADR-0023 subagent seam with `supabase-rls-reviewer`**
   (`.claude/agents/`), following the documented extension pattern — the
   `supabase-migration` skill already carries `## Known Failure Modes`, and RLS
   is P0 where static rules only catch known regex shapes. A
   `design-system-reviewer` is deliberately **not** added: that subsystem has
   the densest deterministic enforcement in the repo (four ESLint guards, the
   APCA test, CSS drift guards, `checkDesignTokenBoundaries`); add it later
   only on a measured miss.
2. **Post-compaction re-anchor**: the SessionStart hook
   (`.claude/hooks/context-drift-notice.mjs`) now also emits, on `compact`/`resume` sources,
   a one-line pointer to re-read `AGENTS.md` (P0, Priority Stack, Definition of
   Done). Fail-open, non-blocking, no new always-loaded prose.
3. **Agent Skills spec compliance** is a standing requirement for
   `.agents/skills/*` frontmatter (kebab `name` = directory, `description` =
   what + "Use when" triggers). Verified for all 15 skills; the existing
   canonical-plus-generated-shim architecture is kept (the spec is
   location-agnostic).

## Consequences

Positive: the P0 domain gains an isolated review seam; long sessions re-surface
the constitution exactly when compliance decays; the skill layer is consumable
by non-Claude tools without translation. Negative/neutral: one more subagent
surface to keep in sync (mitigated: it only references its skill + convention);
the re-anchor line adds a few tokens on compacted sessions. **Re-freeze after
this ADR:** no further context-layer ADR without a new measured trigger.

## Alternatives considered

- Full reviewer coverage for all `context-map.json` subsystems — rejected:
  design-system's deterministic coverage makes an LLM reviewer redundant there;
  fleet growth is the failure mode ADR-0023 warned against.
- Re-anchor by re-injecting `AGENTS.md` content into context on every compact —
  rejected: duplicates the always-loaded file; a pointer is enough and costs
  ~30 tokens.
- Migrating skills to a tool-neutral top-level `skills/` directory per emerging
  ecosystem convention — rejected for now: `.agents/skills` + generated shims
  already interoperate; a move is churn without a measured consumer.
