# Plan: Agent Context Layer — Gap Fill (lean, no over-engineering)

- **Status:** Shipped 2026-07-09
- **Date:** 2026-07-09
- **Owner:** AI context layer (`docs/ai/index.md`)
- **Basis:** Internal audit vs Agent Context Layer research (context rot, progressive disclosure, MCP least privilege, Agent Skills, multi-agent cost); live repo state after ADR-0009 lean + ADR-0024 freeze.
- **Predecessors (do not re-open):**  
  `docs/plans/archive/context-layer-lean-execution-2026-06*.md`,  
  `docs/plans/archive/context-layer-measure-prune-2026-07.md`,  
  `docs/plans/archive/context-layer-standards-refresh-2026-07.md`,  
  `docs/plans/archive/context-layer-audit-playbook-2026-07.md`
- **ADR policy:** **No new context-layer ADR** unless a *measured* regression (see `docs/adr/README.md`). This plan is **prose + pin + small process only**.

---

## Goal

Lấp **lỗ hổng thực sự còn lại** của context layer sau lean/freeze — không redesign, không thêm meta-tooling, không phình always-on.

Kết quả mong muốn:

1. MCP supply-chain & fail-open behavior **rõ và an toàn hơn** (pin version + fallback).
2. Agent **non-Claude** biết đường đi tối thiểu (không còn implicit “chỉ Claude mới đủ”).
3. Vài quy tắc hygiene **chống context rot** (tool output / MEMORY) nằm trong budget hiện có.
4. Một vòng **audit tay** skill triggers + nearest-file — sửa chỉ chỗ broken, không rewrite fleet.

---

## Non-goals (hard fence)

| Không làm | Vì sao |
| --- | --- |
| Router cascade / `agent-behavior` / task-routes | ADR-0009 đã cắt; meta-inversion |
| Skill fleets / 19 personas / design-system-reviewer “cho đủ” | ADR-0023/0024 reject; token ×N |
| Vector memory (Mem0/Letta/Zep) | Rejected; hybrid harness + MEMORY đủ |
| SCIP / Sourcegraph-grade code graph MCP | Chưa có measured fail rate; over-scope |
| Behavioral LLM-in-the-loop eval harness | ADR-0009 cắt; API key + rarely run |
| MCPS / message crypto draft IETF | Chưa chuẩn hóa; premature |
| `ai-metrics` dashboard / meta measuring “doc earn tokens” | Meta-theater; freeze spirit |
| Phình `AGENTS.md` / `index.md` vượt size budget | Context rot always-on |
| Thêm GEMINI.md / CODEX.md “cho đủ file” | Không required; `AGENTS.md` + `llms.txt` là SSOT tool-agnostic |
| Dual-write skill bodies vào `.claude/skills` | Shims generated only |
| Schema / product feature code trong plan này | Context-only |

Nếu một hạng mục trong bảng trên “có vẻ hay” giữa chừng → **dừng**, ghi signal vào MEMORY hoặc plan follow-up, không ship trong plan này.

---

## Constraints & invariants

- **P0–P4** trong `AGENTS.md` không đổi nội dung security (chỉ được *trích dẫn* / re-anchor, không soft hóa).
- Size budgets (`scripts/ai-context.manifest.json`) — mọi edit docs phải giữ file dưới budget (đặc biệt: `review-gate.md` đang **đụng trần 2600B**, `MEMORY.md` gần 2200B, `common-mistakes.md` gần 4000B).
- Sửa 1 file (hoặc 1 cụm pin+docs) → `bun run ai:check` (+ `ai:eval` nếu đụng security/arch wording).
- `docs/plans/*` và `docs/adr/*` là append-only history cho link-rot gate — plan này **không** yêu cầu sửa ADR.
- Claude-only hooks/subagents **không** phải “bug”; phải **document** path cho harness khác.

---

## Current state (evidence)

### Đã vững (không đụng trừ lỗi chứng minh được)

| Area | Evidence |
| --- | --- |
| Thin constitution + P0–P6 | `AGENTS.md` ~4.9KB, budget 5.5KB |
| Single router | `docs/ai/index.md` |
| Progressive skills + generated shims | `.agents/skills/*` + `ai:skills:sync` |
| Glob Next 16 rules | `.claude/rules/*` |
| Domain reviewers (2) | `.claude/agents/*-reviewer.md` |
| Compact re-anchor | `.claude/hooks/context-drift-notice.mjs` |
| Context stop gate | `.claude/hooks/ai-context-stop-gate.mjs` |
| Deterministic enforcement | `ai:check`, `ai:eval`, `review-gate-rules.mjs` |
| MCP least-privilege philosophy | `docs/ai/mcp.md` reject broad Supabase MCP |
| Freeze | ADR-0024 + `docs/adr/README.md` “no new context ADR without measure” |

### Gaps thật (chỉ những mục này là in-scope)

| ID | Gap | Evidence | Severity |
| --- | --- | --- | --- |
| **G1** | MCP packages dùng `@latest` — rug-pull / non-reproducible | `.mcp.json` args `next-devtools-mcp@latest`, `@modelcontextprotocol/server-postgres@latest` | **P1** |
| **G2** | MCP fail / disabled: fallback có trong prose nhưng chưa đủ “agent-facing” (handshake fail → đoán schema) | Session: postgres MCP handshake fail; `mcp.md` có fallback typecheck nhưng thiếu “do not invent schema” | **P1** |
| **G3** | Non-Claude path mờ: hooks/globs/subagents Claude-only; agent khác dễ bỏ qua `ai:eval` | `docs/ai/index.md` Tool Support Matrix có nhưng **không** có “minimum done path” 5–8 dòng | **P1** |
| **G4** | Tool-result / log dump hygiene thiếu — context rot từ shell output | `agent-command-policy.md` có “Keep output lean” chung, **không** nói cap log / không paste full build | **P2** |
| **G5** | MEMORY sediment risk — budget gần đầy; promote discipline chỉ verbal | `MEMORY.md` ~2065 / 2200; không cần script mới, cần **một** dòng checklist + optional trim | **P2** |
| **G6** | Skill `description` / dead-skill risk — gates không bắt semantic fire | 17 skills; không audit trigger gần đây (measure-prune signal #5) | **P2** |
| **G7** | Nearest-file package AGENTS drift semantic | Packages có AGENTS; audit playbook tồn tại nhưng chưa chạy post-freeze | **P3** |
| **G8** | Review-gate at exact size budget — mọi thêm checklist = fail gate | `.agents/workflows/review-gate.md` = 2600B | **Constraint** (không gap; chặn feature creep) |

**Không** liệt kê thành gap: SCIP, multi-agent default, behavioral eval, design-system-reviewer, vector memory.

---

## Principles (thực thi)

1. **Edit > machinery.** Ưu tiên 1–3 câu trong doc đúng chỗ; cấm script mới trừ khi pin MCP bắt buộc đổi format (không).
2. **One SSOT.** Không copy cùng rule sang 3 file; pointer.
3. **Budget-first.** Trước khi thêm dòng: cắt 1 dòng stale cùng file (đặc biệt review-gate / MEMORY / common-mistakes).
4. **Measure before structure.** Nếu Phase 2 audit không tìm thấy dead skill → **không** invent skill lifecycle system.
5. **Security beats convenience.** Pin version có thể làm `npx` chậm hơn một chút; chấp nhận.

---

## Phases

### Phase 0 — Pre-flight (15–20 phút)

**Mục tiêu:** baseline xanh, không ship mù.

- [ ] `bun run ai:check` green (0 structural ERROR).
- [ ] Ghi kích thước file sẽ sửa (PowerShell):

```powershell
@(
  'AGENTS.md',
  'docs/ai/index.md',
  'docs/ai/mcp.md',
  'docs/ai/agent-command-policy.md',
  'docs/ai/MEMORY.md',
  'docs/ai/common-mistakes.md',
  '.agents/workflows/review-gate.md',
  '.mcp.json'
) | ForEach-Object { "{0}`t{1}" -f $_, (Get-Item $_).Length }
```

- [ ] Xác nhận non-goals với owner nếu có hạng mục “muốn thêm” ngoài G1–G7.
- [ ] **Không** tạo branch/ADR bắt buộc; commit chỉ khi user opt-in.

**Exit:** baseline recorded; scope = G1–G7 only.

---

### Phase 1 — MCP pin + fail-closed guidance (G1, G2)

**Mục tiêu:** đóng lỗ supply-chain và “đoán schema khi MCP chết”.

#### 1.1 Pin versions in `.mcp.json`

- [ ] Resolve current resolved versions once (example):

```powershell
bunx npm view next-devtools-mcp version
bunx npm view @modelcontextprotocol/server-postgres version
```

- [ ] Replace `@latest` with **exact version** (e.g. `next-devtools-mcp@0.x.y`). Prefer exact, not `^` range inside npx args.
- [ ] Do **not** embed DSN; keep `${SUPABASE_DEV_DB_READONLY}` only.

#### 1.2 Document in `docs/ai/mcp.md` (stay ≤ 5000B)

Thêm **ngắn** (không essay):

1. **Version pin policy:** versions in `.mcp.json` are pinned; bump intentionally after reading changelog; never reintroduce `@latest`.
2. **When MCP is unavailable / handshake fails:**
   - next-devtools → `bun run typecheck` / `bun run build` / read code; do not invent runtime errors.
   - postgres → prefer `packages/supabase/src/types.ts` + migrations under `supabase/migrations`; **do not invent columns/policies**.
3. **Upgrade ritual (3 lines):** check npm version → edit pin → enable local → smoke one tool call → leave disabled-by-default.

Cắt / gộp câu trùng trong file nếu chạm budget.

#### 1.3 Optional one line in `docs/ai/index.md` MCP row

- [ ] Nếu còn room dưới 4400B: pointer “pinned versions; fallback when offline — `docs/ai/mcp.md`”.
- [ ] Nếu không còn room → **skip**; `mcp.md` đủ.

**Verification**

- [ ] `bun run ai:check`
- [ ] Diff `.mcp.json` không chứa secret
- [ ] Manual: enable MCP local (optional) still starts with pinned package

**Exit:** G1 + G2 closed. **No new MCP servers.**

---

### Phase 2 — Non-Claude minimum path (G3)

**Mục tiêu:** agent Cursor / Copilot / Codex / generic harness không phụ thuộc hooks Claude mà vẫn “done đúng”.

#### 2.1 Thêm section ngắn — **một chỗ SSOT**

**Preferred location:** `docs/ai/agent-command-policy.md` (validation altitude đã sống ở đây)  
**Alternative:** subsection under `docs/ai/index.md` Tool Support Matrix — chỉ nếu policy file hết room.

Nội dung tối thiểu (bullet, không bảng dài):

```markdown
## Minimum path (any harness)

Always: read `AGENTS.md` → `docs/ai/index.md` → only task rows.
Claude Code: hooks may run `ai:check` on context edits; glob rules auto-load.
Other harnesses: no hooks/globs/subagents — you must:
1. Load path-relevant `.claude/rules/*` yourself when editing App Router / cache code.
2. Before "done" on code: narrowest gate (`typecheck` / `test` / …).
3. Before "done" on context/security/arch touch: `bun run ai:check` and `bun run ai:eval`.
4. High-risk diffs (`supabase/migrations`, `features/watch` sync): follow
   `.agents/workflows/review-gate.md` domain reviewer notes manually if no subagent dispatch.
```

- [ ] Cắt câu trùng “narrowest gate” nếu đã có ngay trên section Validation Gates (merge, không double).
- [ ] Giữ file ≤ 5400B.

#### 2.2 `llms.txt` / Copilot

- [ ] `llms.txt`: một bullet trỏ “Minimum path → agent-command-policy” nếu chưa có.
- [ ] `.github/copilot-instructions.md`: **giữ thin** (đã trỏ AGENTS). Chỉ thêm 1 dòng “run `ai:eval` before done on security-sensitive diffs” nếu muốn — không phình thành second AGENTS.

**Verification**

- [ ] `bun run ai:check`
- [ ] Self-read as “Cursor agent”: from cold start, path to P0 + gates ≤ 2 hops.

**Exit:** G3 closed without new entry files (no GEMINI/CODEX resurrection).

---

### Phase 3 — Context-rot hygiene (G4, G5)

**Mục tiêu:** giảm Lost-in-the-Middle từ log/tool spam và MEMORY phình.

#### 3.1 Tool output (G4) — `agent-command-policy.md`

Thêm **2–4 dòng** dưới Tool Discipline (hoặc Keep output lean):

- Cap large command output at the source (`--quiet`, tail, fail logs only).
- Do not paste full `node_modules`, full build traces, or multi-thousand-line SQL dumps into the transcript; summarize paths + first error.
- Prefer re-run targeted gate over re-reading megabyte logs.

Nếu hết budget: xóa 1 bullet low-value cùng section trước khi thêm.

#### 3.2 MEMORY (G5)

- [ ] Nếu `MEMORY.md` > ~2000B: **promote hoặc xóa** 1–2 bullets đã có canonical convention/ADR (đúng header “Promote then remove”).
- [ ] Không thêm auto-lint script.
- [ ] Optional: 1 bullet trong measure cadence (không file mới) — bi-weekly skim already in archive measure-prune; **chỉ** nhắc trong plan execution notes, không copy vào always-on.

**Verification**

- [ ] `bun run ai:check` (size budgets)
- [ ] MEMORY still pointers-first

**Exit:** G4 + G5 closed; **no new always-on files**.

---

### Phase 4 — Semantic audit only (G6, G7) — fix or no-op

**Mục tiêu:** đóng vòng “gates không thấy semantic”; **cấm** rewrite hàng loạt.

#### 4.1 Skill trigger pass (G6) — ~30–45 phút

Cho mỗi skill trong `.agents/skills/*/SKILL.md`:

| Check | Action if fail |
| --- | --- |
| `description` có leading verb + `Use when …` concrete paths/symptoms? | Rewrite description only |
| Body vẫn match code layout 2026-07? | Fix wrong path; drop generic filler |
| `## Checklist` ends on real gate? | Align to `ai:check` / `typecheck` / `test` as appropriate |
| Skill never relevant to this repo anymore? | **Delete skill dir** + `bun run ai:skills:sync` + drop index mention — only if clearly dead |

**Do not:** add new skills “for completeness”; add Known Failure Modes filler; duplicate conventions into skills.

Inventory checklist (tick when reviewed):

- [ ] codebase-design
- [ ] dependency-update
- [ ] diagnosing-bugs
- [ ] domain-modeling
- [ ] feature-module
- [ ] grill-requirements
- [ ] react-hook-form
- [ ] refactor-plan
- [ ] server-action
- [ ] server-component-read
- [ ] supabase-migration
- [ ] tanstack-query-hook
- [ ] testing-template
- [ ] ui-styling
- [ ] watch-sync
- [ ] zod-validator
- [ ] zustand-store

After any skill edit: `bun run ai:skills:sync` && `bun run ai:check`.

#### 4.2 Nearest-file AGENTS (G7) — light

Packages/apps with `AGENTS.md` (required + others):

- [ ] `apps/web`, `apps/catalog`
- [ ] `packages/auth`, `supabase`, `ui` (required) + skim others

Fix only: wrong import boundary, missing P0 consumer note, commands that no longer exist.  
**Do not** duplicate root priority stack into every package file.

**Verification**

- [ ] `bun run ai:check` && `bun run ai:eval`
- [ ] If **zero** skill/package edits needed → mark G6/G7 **verified-no-op** (success).

**Exit:** G6/G7 closed as *fixed* or *verified clean*.

---

### Phase 5 — Closeout

- [ ] Re-run size snapshot (Phase 0 command); no budget regressions.
- [ ] `bun run ai:check` && `bun run ai:eval`
- [ ] Update this plan **Status** → `Shipped` or `Shipped (partial: …)` with date.
- [ ] If a **measured** miss appeared during work that needs structural change → note under “Follow-ups (evidence-gated)” — **do not** open ADR unless metric/regression cited.
- [ ] Optional MEMORY one-liner only if a *settled* decision was made (e.g. “MCP versions pinned — see mcp.md”); promote later if it becomes convention.

**Archive rule:** when fully shipped and stable ≥1 week, move this file to `docs/plans/archive/` with one-line successor note if any — avoid live agent-trap plans (same lesson as glass false-doctrine archives).

---

## Follow-ups (explicitly **not** in this plan)

Chỉ mở khi có **signal đo được** (rework, security near-miss, meta size inversion, skill never-fires across real work):

| Idea | Trigger to reconsider |
| --- | --- |
| Structural code intelligence (SCIP / LS MCP) | Cross-package rename/refactors fail rate high despite grep |
| Extra domain reviewer | ≥2 missed bugs in same subsystem that static rules cannot catch |
| Lightweight offline injection fixtures | Real prompt-injection near-miss in seed/logs/docs |
| Pin integrity beyond npm version (checksum) | Supply-chain incident or team policy upgrade |
| `ai:metrics` as ADR evidence | Only when preparing a context-layer ADR (README already requires) |

---

## Success criteria

| Criterion | Measure |
| --- | --- |
| G1 closed | No `@latest` in `.mcp.json` |
| G2 closed | `mcp.md` states pin + fallback “do not invent schema/runtime” |
| G3 closed | Any-harness minimum path exists in policy (or index) ≤ 2 hops from `AGENTS.md` / `llms.txt` |
| G4 closed | Tool-output hygiene bullets in command policy |
| G5 closed | MEMORY under budget; no new sediment without promote path |
| G6/G7 closed | Skill + nearest-file pass done; edits only where broken |
| No over-engineering | Zero new scripts, ADRs, routers, skills-for-show, MCP servers |
| Gates green | `ai:check` + `ai:eval` pass |

---

## Definition of Done

1. Phases 0–1 **must** ship (security/reproducibility).  
2. Phase 2 **must** ship (portability).  
3. Phase 3 **should** ship if budget allows; drop bullets rather than exceed budgets.  
4. Phase 4 **must** run; **may** result in no file changes.  
5. Phase 5 closeout + status update.  
6. Unrelated product code untouched.

---

## Execution order (single sitting vs split)

| Sitting | Work | Est. |
| --- | --- | --- |
| A | Phase 0 + 1 + 2 | 45–90 min |
| B | Phase 3 + 4 + 5 | 45–90 min |

Prefer **Sitting A first** (highest leverage, lowest design risk). Sitting B can be a later day without blocking A.

---

## Risk register

| Risk | Mitigation |
| --- | --- |
| Pin breaks MCP start | Verify version exists on npm; keep previous pin in commit message for revert |
| Policy file hits size budget | Cut stale bullets first; never raise budget casually |
| Audit rewrites every skill | Hard rule: description/path fixes only; max touch count — stop if >5 skills need deep rewrite and reassess |
| Scope creep (“while we’re here…”) | Non-goals table; open follow-up only with signal |

---

## Appendix — map to research pillars (for reviewers)

| Research pillar | This plan’s action |
| --- | --- |
| Instructions altitude | No AGENTS bloat; G3 clarifies load without more always-on |
| Retrieval | No SCIP; router + skills audit only |
| Memory | G5 MEMORY trim/promote; no vector DB |
| Tools / MCP Top 10 | G1 pin (rug-pull ↓), G2 fail-open guidance, keep RO DSN |
| Agent Skills progressive disclosure | G6 description audit |
| Multi-agent | **No** fleet growth |
| Context rot | G4 tool output hygiene |
| Lean / freeze | No ADR; no meta scripts |

---

*End of plan. Path on disk: `docs/plans/context-layer-gap-fill-2026-07.md` (repo convention is `docs/plans/`, not `docs/plan/`).*
