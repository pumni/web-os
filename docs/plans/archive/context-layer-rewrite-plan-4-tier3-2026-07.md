# Plan 4 — Tier 3: MCP Layer Trim

**Depends on:** Plan 3. Master: `context-layer-rewrite-master-2026-07.md`.
**Goal:** MCP doc carries only living doctrine; decision history moves to the
ADR record. Smallest plan — the MCP tier was already conformant (audit §3).

**Non-goals:** adding/removing MCP servers; changing `.mcp.json` pins;
touching `disabledMcpjsonServers` posture.

**Gate:** `bun run ai:check` per step; `ai:premerge` close.

## Pre-flight

- [ ] Plan 3 DoD confirmed; `bun run ai:premerge` green.

## Steps

1. **Move "Rejected Candidates" out of `docs/ai/mcp.md`.** The three
   rejections (postgres server, git-canary, supabase official server) are
   re-proposal-prevention content — ADR territory. Add them to ADR-0027's
   "Alternatives considered" (date-stamped amendment); `mcp.md` keeps one
   line: "Rejected servers + rationale: ADR-0027." Run `bun run ai:adr:sync`.
   Verify: `bun run ai:check`.

2. **Trim `mcp.md` to ≤40 lines.** Keep: strategic position (compressed to
   ~6 lines — "local dev runtime aid, not a data plane; native FS/shell wins"),
   version-pin policy, unavailable-fallback rules (do-not-invent lines are
   load-bearing), next-devtools tool list + closed-loop workflow (compressed).
   Manifest: shrink `mcp.md` size budget.
   Verify: `bun run ai:check`.

3. **Close.** `bun run ai:premerge`; ADR-0027 changelog.

## Definition of done

- [ ] `mcp.md` ≤40 lines, within budget; rejection history lives in ADR-0027.
- [ ] `.mcp.json` byte-identical to pre-plan state.
- [ ] `bun run ai:premerge` green.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Over-trim loses the fallback do-not-invent rules | L | Explicit KEEP list in step 2 |
