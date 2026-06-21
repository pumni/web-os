# Context Layer Lean — Execution Plan Round 2 (2026-06-22)

- **Status:** ready-to-execute
- **Owner:** AI context layer (`docs/ai/index.md`)
- **Depends on:** Round 1 (`context-layer-lean-execution-2026-06.md`) already
  applied (ADR 0012 consolidated, plans archived, review-gate/MEMORY/
  common-mistakes trimmed, AGENTS.md Working Principles added).
- **Goal:** Lock in the Round-1 diet against re-bloat, drop one more required
  file (MCP merge), fix the stale-status meta-ADRs, and shave always-on tokens.

Prescriptive and self-contained. Execute tasks in the order given: **②, ③, ④
first** (they change file sizes), **then ① last** (it measures the final sizes
and sets the budgets). Run `bun run ai:check` + `bun run ai:eval` after each task.

---

## Global guardrails (invariants)

1. `scripts/ai-context.manifest.json` drives the gate. Three lists must stay
   mutually consistent: `requiredFiles`, `frontmatterRequired`,
   `indexRequiredReferences`. If you rename/remove a `docs/ai/*` file, update
   **all three** plus the matching row in `docs/ai/index.md`
   (`checkContextIndexCoverage` fails otherwise).
2. Every `docs/ai/*.md` keeps `---` frontmatter with `description:` +
   `when-to-load:` (`checkFrontmatter`).
3. `checkAiDocSizes` emits a WARN (not error) for any `docs/ai/*.md` > 5000
   bytes. Keep the merged `mcp.md` **under 5000 bytes** to avoid the warn.
4. `sizeBudgets` are **hard** (build-failing). The manifest rule: when a budget
   trips, **trim the doc — do not raise the budget**.
5. The link checker excludes `docs/adr/` + `docs/plans/`, but enforced docs
   (`docs/ai/*`, `docs/conventions/*`, `AGENTS.md`, package `AGENTS.md`) that
   point at a removed path WILL fail. Each task says where to grep.
6. After each task: `bun run ai:check` then `bun run ai:eval`. Both exit 0.

---

## Task ② — Merge the two MCP docs into `docs/ai/mcp.md`

**Why:** 142 lines across two required files for an optional local dev aid.
`mcp-runtime.md` already cross-references `mcp-postgres.md`.

### Steps

1. **Create `docs/ai/mcp.md`** by merging both, tightened ~30% (target **< 5000
   bytes**). Required frontmatter (covers both servers):

   ```markdown
   ---
   description: How AI agents use the two declared MCP servers — next-devtools (live Next.js dev-server runtime: errors, routes, browser verify) and postgres (read-only DB schema introspection) — including their security boundaries.
   when-to-load: When debugging a runtime/build error, verifying a route/render change against the running dev server, or reading the live Supabase schema instead of guessing from generated types.
   ---
   ```

   Preserve, condensed, every load-bearing fact from both source files:
   - `.mcp.json` declares two servers; both are **local dev aids, never a CI
     dependency**; P0–P4 still win; never edit `.mcp.json` to bypass a gate.
   - **next-devtools** is a *bridge*: tools `init`, `nextjs_runtime`,
     `nextjs_docs`, `browser_eval`, `upgrade_nextjs_16`/`enable_cache_components`.
     No literal `get_errors`/`get_routes`; runtime tool names are discovered via
     `nextjs_runtime`, not hard-coded. Closed-loop: change → ensure dev server on
     a known port → `init` → `nextjs_runtime` to read errors/structure → fix root
     cause → `browser_eval` for interaction changes. Next.js-16 API SoT stays
     `apps/web/AGENTS.md` + `.claude/rules/*`; MCP only adds a faster docs lookup.
   - **postgres** (`@modelcontextprotocol/server-postgres`) schema introspection,
     hard boundary: **read-only role only**, **dev/local DB only never prod**,
     **DSN from `SUPABASE_DEV_DB_READONLY` env, never a literal in `.mcp.json`**.
     Prefer fresh generated types/migrations; use MCP when `types.ts` is stale.
   - Rejected candidates (keep, prevents re-litigation): `mcp-server-git`
     (npx-confusion canary, not a real git MCP) and
     `@supabase/mcp-server-supabase` (broader trust surface than needed).

2. **Delete** `docs/ai/mcp-runtime.md` and `docs/ai/mcp-postgres.md`.

3. **Update `scripts/ai-context.manifest.json`** — in all three arrays replace
   the two old paths with the single new one:
   - `requiredFiles`: remove `"docs/ai/mcp-runtime.md"` and
     `"docs/ai/mcp-postgres.md"`; add `"docs/ai/mcp.md"`.
   - `frontmatterRequired`: same swap.
   - `indexRequiredReferences`: same swap.

4. **Update `docs/ai/index.md`** — the Reference table currently has two rows
   (`MCP runtime …` and `MCP Postgres …`). Replace with one:

   ```markdown
   | MCP servers (next-devtools runtime + postgres schema, optional) | `docs/ai/mcp.md` |
   ```

5. **Grep for back-references** to the old paths and repoint them to
   `docs/ai/mcp.md` (ignore hits inside `docs/adr/**` and `docs/plans/**`):
   `rg -n "mcp-runtime\.md|mcp-postgres\.md" --glob '!docs/adr/**' --glob '!docs/plans/**'`
   Known internal cross-links inside the two merged files disappear with them.

6. `bun run ai:check` + `bun run ai:eval`. Confirm no `[WARN] … mcp.md` size
   warning (if it appears, tighten `mcp.md` below 5000 bytes).

---

## Task ③ — Squash the superseded meta-ADRs (0005/0006/0007)

**Why:** All three still read `Status: Accepted` although ADR-0009 + MEMORY
state they are superseded (a correctness bug). They are same-week (2026-06-19)
meta-process ADRs that ADR-0009 (2026-06-20) already narrates in full. Same
squash policy applied to the glass ADRs in Round 1.

### Steps

1. **Grep for enforced-doc references first** (must come back empty outside
   adr/plans before deleting):
   `rg -n "0005-context-layer|0006-context-efficacy|0007-context-efficiency" --glob '!docs/adr/**' --glob '!docs/plans/**'`
   If any enforced doc references them, repoint to
   `docs/adr/0009-context-layer-lean-2026.md`.

2. **Add an archaeology note to ADR-0009.** Insert this block at the end of the
   `## Consequences` section, immediately before `## Alternatives considered`
   (currently line 92):

   ```markdown

   ## Superseded predecessors (archaeology)

   ADRs 0005 (context-layer-2026-overhaul), 0006 (context-efficacy-overhaul), and
   0007 (context-efficiency-2026) — all 2026-06-19 — were squashed into this
   record on 2026-06-22; their meta-process narrative is captured in the Context
   section above. Full text is in git history.
   ```

3. **Delete** `docs/adr/0005-context-layer-2026-overhaul.md`,
   `docs/adr/0006-context-efficacy-overhaul.md`,
   `docs/adr/0007-context-efficiency-2026.md`.

4. ADR numbering stays monotonic (gap 0005–0007 is fine; numbers are never
   reused per `docs/adr/README.md`). Leave `0008` (command policy) untouched.

5. `bun run ai:check` + `bun run ai:eval`.

---

## Task ④ — Tighten `## Read Routing` in `AGENTS.md`

**Why:** the section restates what `index.md` already owns ("maps every need…"),
costing always-on tokens. Keep only the non-duplicated instruction (read
`apps/web/AGENTS.md` + `.claude/rules/*` before Next.js code).

### Steps

1. In `AGENTS.md`, replace the entire `## Read Routing` section (currently the
   last block, ~lines 76–82) with:

   ```markdown
   ## Read Routing

   `docs/ai/index.md` is the need → canonical-doc router; pull a row only when the
   task needs it, never preload broad docs. Before writing Next.js app code, read
   `apps/web/AGENTS.md` and the relevant `.claude/rules/*`.
   ```

2. Re-measure: `wc -c AGENTS.md` (expect a small drop from 5139). Used by Task ①.
3. `bun run ai:check`.

---

## Task ① — Ratchet `sizeBudgets` (do this LAST)

**Why:** Round 1 shrank the high-traffic files, but the budgets still allow
silent 2–3× re-bloat, and the per-task-read files have no budget at all. This is
the anti-rebloat ratchet — the mechanism that keeps the diet permanent.

### Steps

1. **Re-measure final sizes after ②③④:**
   `wc -c AGENTS.md docs/ai/index.md docs/ai/MEMORY.md docs/ai/common-mistakes.md .agents/workflows/review-gate.md docs/ai/agent-command-policy.md docs/ai/mcp.md`

2. **Replace the `sizeBudgets` array** in `scripts/ai-context.manifest.json`
   with the set below. Numbers = current size rounded up with ~10–15% headroom
   (recompute if a `wc -c` above differs by more than the headroom):

   ```json
   "sizeBudgets": [
     { "path": "AGENTS.md", "maxBytes": 5500 },
     { "path": "docs/ai/index.md", "maxBytes": 4400 },
     { "path": "docs/ai/MEMORY.md", "maxBytes": 2200 },
     { "path": "docs/ai/common-mistakes.md", "maxBytes": 4000 },
     { "path": ".agents/workflows/review-gate.md", "maxBytes": 2600 },
     { "path": "docs/ai/agent-command-policy.md", "maxBytes": 5400 },
     { "path": "docs/ai/mcp.md", "maxBytes": 5000 }
   ]
   ```

   Constraints to honour:
   - Each `maxBytes` MUST be ≥ the file's current size (else the gate fails
     immediately). If a measured size exceeds the value above, either trim the
     doc or bump that one entry to `current + ~300`.
   - `AGENTS.md` budget must stay ≤ the `checkEntrypointSizes` warn threshold
     logic is separate (6500 warn) — 5500 is fine.

3. `bun run ai:check` (runs `checkSizeBudgets`) + `bun run ai:eval`.

---

## Final verification (after all four)

```
bun run ai:check     # expect: pass, 0 errors (mcp.md size warning must be absent)
bun run ai:eval      # expect: All AI regression evals passed
ls docs/adr/*.md     # expect 0005/0006/0007 gone; 0009 present with archaeology note
ls docs/ai/mcp*.md   # expect only docs/ai/mcp.md
rg -n "mcp-runtime\.md|mcp-postgres\.md" --glob '!docs/adr/**' --glob '!docs/plans/**'   # expect no matches
wc -c AGENTS.md docs/ai/MEMORY.md   # expect within new budgets
```

## Expected outcome

- `docs/ai/`: 8 → 7 files; one fewer required-file / frontmatter / index
  obligation; merged MCP doc ~30% tighter.
- `docs/adr/`: 12 → 9 files; meta-ADR statuses corrected via consolidation.
- `AGENTS.md`: smaller always-on footprint.
- **`sizeBudgets` now cover all seven high-traffic files at current+headroom** —
  the diet is locked; any future re-bloat fails the build instead of creeping in.
- No deterministic gate weakened: 16 static rules, secrets scan, RLS checks,
  project-graph sync, and frontmatter/link checks all still run and pass.
