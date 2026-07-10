# Plan: Agent Context Layer — Correctness Waves (path drift + hygiene + measured gaps)

- **Status:** Shipped 2026-07-10
- **Date:** 2026-07-09
- **Owner:** AI context layer (`docs/ai/index.md`)
- **Skill basis:** `.agents/skills/refactor-plan/SKILL.md` (atomic steps, pre-flight baseline, per-step verification, hard non-goals)
- **Audit basis:** Deep audit vs live repo (2026-07-09): always-on path map stale after `src/shared/` restructure; golden/skill/context-map drift; incomplete mistake few-shots; MEMORY sediment; multi-harness honor-system
- **Predecessors (do not re-open as redesign):**
  - `docs/plans/context-layer-gap-fill-2026-07.md` (**Shipped** 2026-07-09 — MCP pin, non-Claude path, tool-output hygiene)
  - `docs/plans/archive/context-layer-lean-execution-2026-06*.md`
  - `docs/plans/archive/context-layer-standards-refresh-2026-07.md`
  - `docs/plans/archive/context-layer-measure-prune-2026-07.md`
- **ADR policy:** **No new context-layer ADR.** This plan is **prose + small deterministic gate only** (path-existence asserts). Freeze remains: `docs/adr/README.md` (measured regression required for any future context ADR).

---

## Goal

Đưa **lớp sự thật repo** trong context layer về khớp filesystem + production patterns hiện tại, rồi hygiene budget, rồi (chỉ khi đo được) gap có-chủ-đích — **không** redesign router / skill fleet / meta eval theater.

| Wave | Mục tiêu | Severity gốc | Agent outcome |
| --- | --- | --- | --- |
| **A** | Sửa **sai sự thật** (paths, golden, zustand, data-fetching toast) + path-existence gate | P0–P1 | Agent không scaffold store/UI vào path chết |
| **B** | Hygiene BP 2026 (MEMORY, common-mistakes coverage, playground note, feature-module English + test exception, metrics altitude) | P1–P2 | Ít rot hơn; few-shot đủ rule quan trọng; meta không nhầm DoD |
| **C** | Gap **chỉ khi measured** (sky-player skill vs demo bar, Cursor dual vs load map, behavioral baseline, Compiler policy soft) | P2–P3 / conditional | Không ship speculative structure |

---

## Non-goals (hard fence)

| Không làm | Vì sao |
| --- | --- |
| Router cascade / `agent-behavior` / `task-routes` / meta “how to use context” docs | ADR-0009 lean; meta-inversion |
| Skill fleet / design-system-reviewer “cho đủ” / 19 personas | ADR-0023/0024 reject; token ×N |
| Vector memory (Mem0/Letta/Zep) | Rejected; hybrid harness + MEMORY |
| SCIP / Sourcegraph code-graph MCP | Chưa measured miss rate |
| MCPS / IETF message crypto | Draft, premature |
| Dual-write skill bodies vào `.claude/skills` (hand-edit) | Shims **generated only** via `bun run ai:skills:sync` |
| Product feature code, schema, RLS, UI redesign | Context-only (trừ Wave A pre-flight **unblock** `ai:check` nếu ERROR chặn baseline) |
| Phình `AGENTS.md` / `index.md` / `review-gate.md` vượt size budget | Context rot always-on |
| GEMINI.md / CODEX.md “cho đủ file” | `AGENTS.md` + `llms.txt` SSOT |
| Raise size budgets “cho dễ viết” | Trim > raise (`check-ai-context` policy) |
| Re-open ADR-0009–0024 as Accepted | Deprecated = decisions live in repo; freeze policy lives in `docs/adr/README.md` |

Nếu hạng mục “có vẻ hay” xuất hiện giữa chừng → **dừng**, ghi signal vào cuối plan execution notes hoặc MEMORY **một pointer**, không ship trong wave hiện tại.

---

## Constraints & invariants

1. **P0–P4** `AGENTS.md` security / priority stack: không soft hóa; chỉ được sửa **Project layout bullet** và wording drift (không đụng `<SECURITY_MANDATES>` semantics).
2. **Size budgets** (`scripts/ai-context.manifest.json`) — bắt buộc giữ:

   | Path | maxBytes | Snapshot 2026-07-09 (bytes) | Headroom |
   | --- | ---: | ---: | ---: |
   | `AGENTS.md` | 5500 | 4927 | ~573 |
   | `docs/ai/index.md` | 4400 | 3703 | ~697 |
   | `docs/ai/MEMORY.md` | 2200 | 2138 | **~62** |
   | `docs/ai/common-mistakes.md` | 4000 | 3851 | **~149** |
   | `.agents/workflows/review-gate.md` | 2600 | **2600** | **0** |
   | `docs/ai/agent-command-policy.md` | 5400 | 4961 | ~439 |
   | `docs/ai/mcp.md` | 5000 | 3774 | ~1226 |

   **Rule:** trước khi thêm ≥1 dòng vào file NEAR/FULL → **cắt** ≥ cùng số dòng stale trong cùng file (MEMORY / common-mistakes). **Không** sửa `review-gate.md` trừ khi cắt 1:1 (Wave B không phụ thuộc nó).

3. **Gates:**
   - Context edits → `bun run ai:check` (narrowest) per step cluster; `bun run ai:eval` nếu đụng security/arch wording hoặc review-gate rules surface.
   - Code only if unblocking design-token test ERROR (Pre-flight A0).
4. **Commit policy:** default **no commit** unless user opts in (`AGENTS.md`). Plan assumes agent reports diff; commit-per-wave only if user approved.
5. **Branch:** dedicated branch before Wave A step 1 (e.g. `context/correctness-waves-2026-07`). Never refactor context on `main` if shared.
6. **`docs/plans/*` / `docs/adr/*`:** append-only for link-rot gate — plan file itself OK to add; **do not** rewrite historical ADRs.
7. **Claude-only hooks/subagents** remain Claude-only; Wave B documents altitude, Wave C may add load map — not “fix Claude parity by copying hooks”.

---

## Context (current state + evidence)

### Live layout (authoritative)

```text
apps/web/src/
  app/           # routes
  features/      # vertical slices (design-system, design-trends, profile, sky-player, watch)
  shared/        # shell, providers, cross-feature hooks/lib/stores
    components/
    hooks/
    lib/
    stores/      # app-ui-store.ts, tasks-store.ts
  test/
```

**Does not exist:** `apps/web/src/components`, `apps/web/src/lib`, `apps/web/src/stores` (top-level).

### Drift matrix (must close in Wave A)

| Location | Stale claim | Correct |
| --- | --- | --- |
| `AGENTS.md` ~L51 | `src/{app,components,features,lib,stores}` | `src/{app,features,shared,test}` + shared roles |
| `apps/web/AGENTS.md` App-local | “reusable UI in `components`” | `shared/components` for shell/shared UI; feature UI under `features/*/components` |
| `.agents/skills/zustand-store/SKILL.md` | `apps/web/src/stores` | `apps/web/src/shared/stores` + feature-local `features/*/stores` |
| `scripts/context-map.json` data-fetching code globs | `apps/web/src/stores/**` | `apps/web/src/shared/stores/**` |
| `docs/ai/golden-examples.md` profile form | form “with useMutation” | form = RHF; mutation = `use-profile-mutation.ts` |
| golden `actions.ts#requireUser` | implies local symbol | `requireUser` from `@pumni/auth` |
| `docs/conventions/data-fetching.md` Zustand | “system toast events” | Sonner / `@pumni/ui` toaster; Zustand = UI chrome only |
| golden migrations | only 001–003 | optional watch harden exemplar (017/018) — Wave A optional step |

### Production pattern notes (Wave A golden / skill wording)

- Profile write path: `use-profile-mutation.ts` may **browser Storage upload** then Server Action `updateProfile` → `updateTag` + `router.refresh()` (not `invalidateQueries(['profile'])` as primary).
- `getProfileByUserId` uses service-role with `requireUser()`-derived id — golden must keep **copy-with-care** warning (already partial; strengthen pointer).

### Gate state (pre-flight risk)

- `bun run ai:eval` — PASS (2026-07-09 session).
- `bun run ai:check` — **FAIL** on design-token raw `oklch(` in  
  `apps/web/src/test/design-system/glass-panel-simple-tokenization.test.ts` (5 ERRORs).  
  **Must resolve in Pre-flight A0** before claiming Wave A done (either fix test or legitimate allowlist if check supports it — prefer fix).

### Metrics snapshot (`bun run ai:metrics`)

- `skillOverlapPairs`: 1 (heuristic; grill↔refactor, rhf↔server-action also share tokens)
- `commonMistakesEnforcementGap`: 3 (honor-system/partial markers)
- `behavioralBaseline`: null
- Undocumented static rule ids in `common-mistakes.md` (8 of 22):  
  `client-secret-env`, `image-priority-deprecated`, `legacy-middleware`, `rpc-user-id-without-auth-check`, `server-action-missing-auth`, `server-action-missing-revalidation`, `server-only-in-client`, `single-arg-revalidate-tag`

### Size / freeze

- `review-gate.md` at exact budget — **do not expand**.
- MEMORY near full — Wave B trim first.

---

## Target state

### After Wave A

1. Always-on + nearest-file + zustand skill + context-map describe **`shared/`** correctly.
2. Golden examples match profile/watch/shared patterns enough that copy-paste is safe.
3. `data-fetching.md` does not teach toast-in-Zustand.
4. `ai:check` includes **path-existence** for a small allowlisted set of cited paths (AGENTS layout tokens + golden bullets + skill path claims where listed).
5. `bun run ai:check` green (including A0 test fix).

### After Wave B

1. MEMORY under ~85% budget; glass/MCP dated bullets collapsed to pointers.
2. `common-mistakes.md` documents the **high-value missing rules** (at least middleware/proxy, single-arg revalidateTag, server-only-in-client, server-action auth/revalidation) without exceeding 4000B (trim stale first).
3. `docs/ai/index.md` has a short **playground / non-DoD surfaces** note (sky-player, todos, design-trends).
4. `feature-module.md`: English-only firewall section; explicit test deep-import exception.
5. `docs/architecture/overview.md` one short bullet on `apps/web/src/shared`.
6. `agent-command-policy.md` or `index.md` clarifies: `ai:metrics` / `ai:eval:behavioral` = **freeze evidence / opt-in**, **not** Definition of Done for normal tasks.
7. Optional: skill description disambiguation for grill vs refactor, rhf vs server-action (one line each) if budget allows in skill files (no size budget on skills, but keep short).

### After Wave C (only if exit criteria of prior waves met + measure gate)

1. Explicit decision recorded (MEMORY one line or plan notes): sky-player = **demo bar / no skill** **or** thin skill — not both undecided.
2. Multi-harness: either expanded path→doc table in `llms.txt`/`index.md` **or** defer Cursor `.mdc` remains with reason (no half dual-write).
3. Optional quarterly behavioral dry-run documented; baseline JSON optional.
4. React Compiler policy: AGENTS wording softened **or** left as aspirational with “prefer not to add new useCallback” — no mass codemod unless separate plan.

---

## Principles (execution)

1. **Truth > trend.** Fix wrong paths before adding new abstractions.
2. **Edit > machinery.** Prefer 1–5 line doc fixes; only one new check: path existence.
3. **One SSOT.** Point; do not copy full layout into 5 files — AGENTS + apps/web AGENTS + architecture overview; skills/golden reference paths only.
4. **Budget-first.** Trim before add on MEMORY / common-mistakes.
5. **Measure before Wave C structure.** No sky-player skill without “agent miss” evidence or owner directive.
6. **Wave order is a DAG:** A → B → C. Do not start C while A paths still wrong.

---

## Pre-flight (mandatory before Wave A Step A1)

### P0 — Record baseline

```powershell
# From repo root (pwsh)
bun run ai:check 2>&1 | Tee-Object -FilePath docs/plans/_baseline-ai-check.txt
bun run ai:eval 2>&1 | Tee-Object -FilePath docs/plans/_baseline-ai-eval.txt
bun run ai:metrics 2>&1 | Tee-Object -FilePath docs/plans/_baseline-ai-metrics.txt

@(
  'AGENTS.md',
  'apps/web/AGENTS.md',
  'docs/ai/index.md',
  'docs/ai/MEMORY.md',
  'docs/ai/common-mistakes.md',
  'docs/ai/golden-examples.md',
  'docs/ai/agent-command-policy.md',
  'docs/conventions/data-fetching.md',
  'docs/conventions/feature-module.md',
  'docs/architecture/overview.md',
  '.agents/skills/zustand-store/SKILL.md',
  'scripts/context-map.json',
  'scripts/ai-context.manifest.json',
  'scripts/check-ai-context.mjs',
  '.agents/workflows/review-gate.md'
) | ForEach-Object { "{0}`t{1}" -f $_, (Get-Item $_).Length }
```

- [ ] Confirm `ai:eval` PASS.
- [ ] Note `ai:check` ERROR count (expected: design-token test raw oklch if still present).
- [ ] Create branch: `git checkout -b context/correctness-waves-2026-07` (or user-named).
- [ ] Do **not** delete baseline artifacts from `docs/plans/` if they would be committed noise — prefer local only; if committed, put under `docs/plans/archive/` or delete after ship. **Default: do not commit `_baseline-*.txt`.**

### A0 — Unblock `ai:check` (code, only if still red)

- **File(s):** `apps/web/src/test/design-system/glass-panel-simple-tokenization.test.ts` (and only related allowlist if an existing pattern exists in `check-ai-context.mjs` / design token checker — **prefer fix test to use tokens**, not weaken gate).
- **Action:** Remove or replace raw `oklch(` assertions that violate design token boundary so `checkDesignTokenBoundaries` (or equivalent) no longer errors. Preserve test intent (tokenization behavior) via computed styles / token CSS variables if possible.
- **Verification:** `bun run ai:check` → 0 ERROR.
- **Rollback:** `git checkout --` that test file.
- **Depends on:** none (blocks Wave A DoD).

**Stop-and-ask** if fix requires changing production glass tokens or disabling the boundary check globally.

**Exit Pre-flight:** `ai:check` green; branch created; sizes recorded.

---

## Wave A — Correctness (P0 path drift) — **execute first**

**Scope:** docs + skill + context-map + small path-existence gate. No product features.

### Step A1: Fix root `AGENTS.md` Project layout bullet

- **File(s):** `AGENTS.md` (Project section, layout bullet ~L51)
- **Action:**
  - Replace `apps/web/src/{app,components,features,lib,stores}` with accurate tree, e.g.:
    - `apps/web/src/{app,features,shared,test}` — delivery layer
    - One short clause: `shared/` = shell, providers, cross-feature hooks/lib, global UI stores; feature domain stays under `features/<name>`
  - Keep packages line truthful (`packages/*` + nearest `AGENTS.md`).
  - Stay ≤ 5500B; if over, trim non-security fluff elsewhere in Project/How-to-work (not P0).
- **Verification:**  
  - Manual: string `components,features,lib,stores` **absent** from AGENTS layout claim; `shared` present.  
  - `bun run ai:check`
- **Rollback:** `git checkout -- AGENTS.md`
- **Depends on:** Pre-flight A0 (preferred; if A0 blocked by owner, still OK to land A1 but DoD Wave A waits on green check)

### Step A2: Fix `apps/web/AGENTS.md` App-local layout

- **File(s):** `apps/web/AGENTS.md` (App-local layout section)
- **Action:**
  - Routes: `src/app`
  - Shared shell/providers/UI: `src/shared/components` (and hooks/lib/stores as needed)
  - Domain: `src/features/<feature>` (actions, queries, feature components/stores)
  - Keep Next 16 pointer rules + state ownership + security one-liners
  - Keep file short (nearest-file)
- **Verification:** `bun run ai:check`; no claim of top-level `src/components`
- **Rollback:** `git checkout -- apps/web/AGENTS.md`
- **Depends on:** A1 recommended (same vocabulary)

### Step A3: Fix zustand skill paths

- **File(s):** `.agents/skills/zustand-store/SKILL.md`
- **Action:**
  - `description` + body: replace `apps/web/src/stores` with `apps/web/src/shared/stores` **or** feature-local `features/<feature>/stores`
  - Rules: global UI chrome → `shared/stores`; feature-only UI → feature stores; still never server data
  - Checklist paths updated
  - Run `bun run ai:skills:sync` so `.claude/skills/zustand-store/SKILL.md` shim stays in sync
- **Verification:** `bun run ai:check` (shim sync); grep skill for `src/stores` without `shared` → zero hits
- **Rollback:** checkout skill + re-run `ai:skills:sync` if needed
- **Depends on:** A1 vocabulary

### Step A4: Fix `scripts/context-map.json` data-fetching globs

- **File(s):** `scripts/context-map.json`
- **Action:** In `data-fetching` subsystem `code` array, replace `apps/web/src/stores/**` with `apps/web/src/shared/stores/**`. Keep `features/**/stores/**`.
- **Verification:** JSON valid; `bun run ai:check` (if context-map is validated); `bun scripts/check-context-drift.mjs` if part of hooks — at least parse JSON
- **Rollback:** `git checkout -- scripts/context-map.json`
- **Depends on:** A3 (same truth)

### Step A5: Fix `docs/conventions/data-fetching.md` Zustand bullets

- **File(s):** `docs/conventions/data-fetching.md` (Local State section)
- **Action:**
  - Remove “Rendering system toast events” as Zustand use case
  - Replace with: UI chrome (sidebar open, modal ids, local preferences); toasts via Sonner / design-system toaster — not Zustand mirror of server events
  - Optional one line: global UI stores live under `apps/web/src/shared/stores`
  - Keep Server Components / Query / cache rules intact
- **Verification:** `bun run ai:check` (frontmatter + size if any); no “toast” + Zustand pairing
- **Rollback:** `git checkout -- docs/conventions/data-fetching.md`
- **Depends on:** none (can parallel A1–A4)

### Step A6: Rewrite `docs/ai/golden-examples.md` profile + shared exemplars

- **File(s):** `docs/ai/golden-examples.md`
- **Action (precise):**
  1. **Feature Module — profile:**
     - `actions.ts`: Server Action `updateProfile` — Zod `profileSchema`, `requireUser()` from `@pumni/auth`, Supabase update, `updateTag(\`profile:${user.id}\`)`
     - `use-profile-mutation.ts`: client mutation orchestration (`useMutation`), optional **browser** Storage avatar upload, then action; success → `router.refresh()` + toast
     - `profile-form.tsx`: RHF + `@pumni/ui` Form; delegates submit to mutation hook (not “form owns useMutation” as sole story)
     - `queries.ts`: cached read + user-scoped tag; **warn** service-role only with server-derived user id
  2. **Feature-Local + shared Zustand:**
     - Keep `features/watch/stores/volume-store.ts`
     - Add `apps/web/src/shared/stores/app-ui-store.ts` (and optionally `tasks-store.ts`) as global UI chrome exemplar
  3. **Supabase:** keep 001–003; **add one** harden exemplar, e.g. `017_harden_watch_queue_rls.sql` or `018_harden_watch_rpcs.sql` (verify file exists before citing)
  4. Do not invent paths; every bullet path must exist on disk
  5. Stay lean — if file grows large, drop least-useful package-boundary fluff (packages/* one-liners can stay short)
- **Verification:**  
  ```powershell
  # Every markdown path-like token under apps/, packages/, supabase/, .agents/ that looks like a file path should exist — agent should spot-check all new bullets
  Test-Path apps/web/src/features/profile/use-profile-mutation.ts
  Test-Path apps/web/src/shared/stores/app-ui-store.ts
  ```
  `bun run ai:check`
- **Rollback:** `git checkout -- docs/ai/golden-examples.md`
- **Depends on:** A1–A3 for vocabulary consistency

### Step A7: Path-existence enforcement in `ai:check`

- **File(s):**
  - `scripts/check-ai-context.mjs` (add `checkCitedPathsExist` or similar)
  - `scripts/ai-context.manifest.json` (optional `requiredExistingPaths` array — **prefer manifest-driven** so edits don’t require script surgery each time)
- **Action:**
  1. Add manifest key, e.g. `requiredExistingPaths`: string[] of repo-relative paths that **must** exist (start minimal):
     - `apps/web/src/shared/stores/app-ui-store.ts`
     - `apps/web/src/features/profile/use-profile-mutation.ts`
     - `apps/web/src/features/watch/stores/volume-store.ts`
     - `apps/web/src/shared/components/app-shell/app-shell.tsx` (or another stable shared shell file)
     - Plus any golden bullets you want locked
  2. Implement check: missing path → **ERROR** (not warn)
  3. Optional stronger check (if cheap): scan `docs/ai/golden-examples.md` for fenced `` `path/to/file` `` patterns under `apps/`, `packages/`, `supabase/`, `.agents/` and assert existence — **skip** anchors (`#`), URLs, globs with `*`. If regex too fragile, stick to manifest list only in v1.
  4. Self-test: temporary missing path fails; restore
- **Verification:** `bun run ai:check` green; deliberately break one path in a local throwaway → ERROR (do not commit break)
- **Rollback:** revert script + manifest keys
- **Depends on:** A6 (paths in golden stable)

### Step A8: Wave A verification cluster

- **File(s):** none new
- **Action:** full context gate + greps for dead paths
  ```powershell
  bun run ai:check
  bun run ai:eval
  # Dead path greps (should be empty or only historical plans/adr)
  rg -n "src/\{app,components,features,lib,stores\}|apps/web/src/stores[^*]|reusable UI in ``components``" AGENTS.md apps/web/AGENTS.md .agents/skills docs/ai docs/conventions scripts/context-map.json
  ```
- **Verification:** 0 ERROR ai:check; ai:eval PASS; dead layout strings gone from live context paths (ignore `docs/plans/**`, `docs/adr/**` if any)
- **Rollback:** revert Wave A commits/files
- **Depends on:** A1–A7

**Wave A DoD**

- [ ] A0–A8 green
- [ ] No top-level `src/stores` / `src/components` / `src/lib` claims in live agent entry docs
- [ ] Golden profile path includes `use-profile-mutation.ts`
- [ ] Path-existence gate live
- [ ] Diff limited to listed files (+ skill shim if generated)
- [ ] Report risks in review-gate style

**Wave A stop-and-ask**

- A0 requires disabling design-token enforcement
- Manifest path list would need >15 entries (scope creep)
- Golden rewrite would exceed readability — split file only with owner OK (prefer trim)

---

## Wave B — Hygiene & best-practice gaps (after Wave A DoD)

**Scope:** budget-sensitive docs; no new ADR; no review-gate expansion.

### Step B1: MEMORY sediment trim + freeze pointer fix

- **File(s):** `docs/ai/MEMORY.md`
- **Action:**
  1. Collapse dated Glass 2026-07-05 / 2026-07-09 bullets into **one** pointer: design-system + ADR-0012 (already SSOT)
  2. Collapse MCP pin bullet into pointer to `docs/ai/mcp.md` only (if duplicate)
  3. Freeze policy: point to **`docs/adr/README.md`** (“no context ADR without measured regression / ai:metrics”), not primarily Deprecated ADR-0009/0024 bodies
  4. Keep enforcement pointers (check-ai-context, review-gate-rules)
  5. Target ≤ **~1870 bytes** (~85% of 2200) after trim
- **Verification:** `(Get-Item docs/ai/MEMORY.md).Length -le 2000`; `bun run ai:check`
- **Rollback:** checkout MEMORY.md
- **Depends on:** Wave A DoD

### Step B2: `common-mistakes.md` — add high-value missing rules (budget swap)

- **File(s):** `docs/ai/common-mistakes.md`
- **Action:**
  1. **Trim first** if needed (~149B headroom only): shorten §10 cache mega-paragraph or honor-system §12 if redundant with AGENTS simplicity; or compress §1–2 examples
  2. **Add compact sections** (each: rule id + one ❌ + one ✅ + one line), priority order:
     1. `legacy-middleware` — `middleware.ts` → `proxy.ts` (Node), cite `apps/web` / auth proxy path if short
     2. `single-arg-revalidate-tag` — must be `revalidateTag(tag, profile)`
     3. `server-only-in-client` — no `server-only` modules in client components
     4. `server-action-missing-auth` + `server-action-missing-revalidation` can share one subsection if budget tight
     5. If space: `rpc-user-id-without-auth-check`, `client-secret-env`, `image-priority-deprecated`
  3. Fix §6 profile-oriented example: prefer `updateTag` / `router.refresh()` for RSC-tagged data; keep `invalidateQueries` as TanStack-client-cache case only
  4. Stay ≤ **4000B**
- **Verification:**  
  ```powershell
  (Get-Item docs/ai/common-mistakes.md).Length -le 4000
  bun run ai:check
  bun run ai:eval
  ```
  At least `legacy-middleware`, `single-arg-revalidate-tag`, `server-only-in-client` appear as substrings
- **Rollback:** checkout file
- **Depends on:** B1 optional parallel

### Step B3: Playground / non-DoD surfaces in `docs/ai/index.md`

- **File(s):** `docs/ai/index.md`
- **Action:** Add short subsection or table row under Reference or new ## Surfaces (≤6 lines):
  - `features/sky-player`, `features/design-trends`, `app/(app)/todos` = playground / local demo quality; **do not** invent full feature-module skill coverage; still respect P0 security if any server touch
  - Prefer pointer not essay
  - Stay ≤ 4400B
- **Verification:** size; `bun run ai:check`; index still lists required references from manifest
- **Rollback:** checkout index.md
- **Depends on:** Wave A (shared vocabulary)

### Step B4: `docs/architecture/overview.md` — document `shared/`

- **File(s):** `docs/architecture/overview.md` (Modular Structure § apps/web)
- **Action:** One–three sentences: `apps/web/src/shared` holds app shell, providers, cross-feature hooks/lib, global UI stores; product capabilities stay in `features/*`.
- **Verification:** `bun run ai:check` if frontmatter/size; no contradiction with AGENTS
- **Rollback:** checkout
- **Depends on:** A1

### Step B5: `docs/conventions/feature-module.md` — English + test exception

- **File(s):** `docs/conventions/feature-module.md`
- **Action:**
  1. Translate remaining Vietnamese narrative blocks in layer responsibilities / notes to **English** (AI layer language consistency) **without** changing firewall rules’ meaning
  2. Firewall IMPORTANT: app/runtime code must import feature **public** `index.ts`; **tests** under `apps/web/src/test` may deep-import internals for unit seams (explicit exception)
  3. Do not expand scope into new architecture
- **Verification:** `bun run ai:check`; spot-check no large VN body left in conventions (code comments in features untouched)
- **Rollback:** checkout
- **Depends on:** none (after A)

### Step B6: Metrics / behavioral altitude (not DoD)

- **File(s):** prefer `docs/ai/agent-command-policy.md` Validation Gates (or one row in `docs/ai/index.md` Verification) — **one** place only
- **Action:** Clarify:
  - Normal task DoD = altitude table (typecheck/lint/test/ai:check as scoped)
  - `bun run ai:metrics` = evidence for **context-layer ADR freeze gate** only
  - `bun run ai:eval:behavioral` = **opt-in** regression band; fail-open without API key; **not** required for feature done
- **Verification:** size ≤5400 for command-policy; `bun run ai:check`
- **Rollback:** checkout
- **Depends on:** none

### Step B7: Skill description disambiguation (optional, low risk)

- **File(s):**  
  - `.agents/skills/grill-requirements/SKILL.md` frontmatter description  
  - `.agents/skills/refactor-plan/SKILL.md` frontmatter description  
  - `.agents/skills/react-hook-form/SKILL.md`  
  - `.agents/skills/server-action/SKILL.md`  
- **Action:** Strengthen “Use when / Not for / For X use Y” so overlap heuristic drops; do not rewrite bodies
- **Verification:** `bun run ai:skills:sync`; `bun run ai:check`; optional `bun run ai:metrics` note `skillOverlapPairs`
- **Rollback:** checkout skills + sync
- **Depends on:** Wave A complete

### Step B8: Wave B verification cluster

```powershell
bun run ai:check
bun run ai:eval
bun run ai:metrics
# MEMORY headroom
(Get-Item docs/ai/MEMORY.md).Length
(Get-Item docs/ai/common-mistakes.md).Length
```

**Wave B DoD**

- [ ] B1–B6 done (B7 optional)
- [ ] MEMORY ≤ 2000B (soft target) and ≤ 2200 hard
- [ ] common-mistakes ≤ 4000B with ≥3 previously missing rule ids
- [ ] index playground note present
- [ ] feature-module test exception present; EN
- [ ] metrics altitude clarified
- [ ] No review-gate.md expansion

**Wave B stop-and-ask**

- Cannot fit critical mistakes without exceeding 4000B after maximal trim → propose split file **or** drop lowest-priority rules (image-priority last)
- feature-module EN translation would change meaning of firewall — stop

---

## Wave C — Measured / conditional (after Wave A+B DoD)

**Gate to enter Wave C:** owner confirms A+B shipped; open only the **sub-tracks** with evidence.

### Track C1 — Sky-player / todos surface policy (choose one)

**Measure gate (any one):**

- Agent wrongly applied full `feature-module` skill to sky-player/todos causing bad structure, **or**
- Owner directive: “add skill” / “mark demo-only forever”

| Option | Action | When |
| --- | --- | --- |
| **C1-a Demo bar (default if no skill demand)** | Strengthen index playground note only; optional one line in `apps/web/AGENTS.md` | No skill file |
| **C1-b Thin skill** | Add `.agents/skills/sky-player/SKILL.md` only if domain complexity + repeated edits; Rules/Checklist/KFM; sync shims; list in index | Measured thrash |

- **Verification:** `ai:check` / `ai:skills:sync` if skill added
- **Non-goal:** design-system LLM reviewer

### Track C2 — Multi-harness progressive load (choose one, not both half-done)

**Measure gate:** non-Claude session skipped Next rules or `ai:eval` on security touch (log once).

| Option | Action |
| --- | --- |
| **C2-a Load map** | Expand `llms.txt` and/or `docs/ai/index.md` with path glob → must-read doc table (App Router → nextjs rules; migrations → supabase skill; watch sync → watch-sync) ≤ budgets |
| **C2-b Cursor `.mdc`** | Only if team standardizes on Cursor; dual-write **globs only** pointing at same SSOT files — **no** rule body fork (ADR-0003 re-open needs owner) |

- **Verification:** size budgets; tool matrix still accurate
- **Rollback:** checkout

### Track C3 — Behavioral baseline (opt-in ops)

- **File(s):** none required; optional `scripts/behavioral-evals/last-run.json` gitignored or documented
- **Action:** Run `bun run ai:eval:behavioral --dry-run` then full run **once** with API key if owner wants freeze evidence; record date in plan notes or MEMORY one line “last behavioral run YYYY-MM-DD”
- **Non-goal:** make behavioral part of CI or `ai:premerge`
- **Verification:** exit code understood; baseline null → non-null only if run succeeds

### Track C4 — React Compiler policy alignment (docs only unless separate plan)

**Measure gate:** repeated agent “fixes” removing useCallback causing regressions, **or** owner wants aspirational rule softened.

- **File(s):** `AGENTS.md` How to work / React Compiler sentence only
- **Action:** Soften to: “Prefer relying on React Compiler; do not add **new** useMemo/useCallback for ordinary stability. Existing patterns in profile/watch may remain until a dedicated cleanup plan.”
- **Non-goal:** mass codemod of useCallback in this plan
- **Verification:** size budget AGENTS; `ai:check`

### Track C5 — Explicitly deferred (do not execute in this plan)

- SCIP MCP, vector memory, multi-agent fleet, MCPS crypto, design-system-reviewer, raising budgets, dual skill body write

**Wave C DoD (per track)**

- [ ] Only tracks with measure gate or owner checkmark executed
- [ ] Decisions written (plan execution notes footer or single MEMORY pointer)
- [ ] `ai:check` green if files touched

---

## Testing strategy

| Layer | Command | When |
| --- | --- | --- |
| Context structure | `bun run ai:check` | Every step that touches docs/skills/scripts/manifest |
| Static security/arch | `bun run ai:eval` | After common-mistakes, AGENTS security-adjacent, any rule wording |
| Skill shims | `bun run ai:skills:sync` then `ai:check` | After skill frontmatter/body path edits |
| Metrics advisory | `bun run ai:metrics` | End of Wave B; before any temptation to open context ADR |
| App tests | only if A0 touched test file | `bun --filter <pkg> test` targeted if needed |
| Full premerge | `bun run ai:premerge` | **Optional** end of Wave A+B if owner wants; not required for context-only if A0 was only test touch |

**Characterization:** context layer is docs/gates — “characterization” = greps + path existence + green `ai:check` baseline, not Vitest for markdown.

---

## Definition of Done (whole plan)

### Must (Wave A + B)

1. Pre-flight A0 + Wave A DoD + Wave B DoD checkboxes complete.
2. `bun run ai:check` and `bun run ai:eval` green on final tree.
3. No size budget ERROR.
4. No unrelated product refactors.
5. Execution report: per-step file / action / verification / rollback readiness (review-gate format).
6. Plan status line updated to **Shipped YYYY-MM-DD** when done (this file).

### Should (Wave C)

7. Owner-selected tracks only; deferred tracks listed under “Explicitly deferred”.

### Commit

8. Commits only if user opted in; suggested commit titles if opted in:
   - `fix(context): align agent paths with src/shared layout`
   - `docs(context): hygiene MEMORY, mistakes, playground, feature-module`
   - `docs(context): measured Wave C …` (if any)

---

## Risks & edge cases

| Risk | Mitigation |
| --- | --- |
| A0 design-token fix changes test meaning | Preserve intent via token vars; stop-and-ask if production CSS must change |
| Path-existence regex false positives on golden | v1 = manifest list only |
| common-mistakes budget overflow | Trim first; prioritize 3 rules; drop image-priority |
| MEMORY over-trim loses unique fact | Keep only non-canonical unique pointers; glass is canonical elsewhere |
| Skill sync forget | Always `ai:skills:sync` after skill edit |
| Agent executes Wave C without measure | Plan text: **hard stop** without owner/evidence |
| `llms.txt` drift vs index after B3 | If index playground added, mirror one line in `llms.txt` if required by ADR-0022 sync spirit (check manifest/llms; update if handshake should mention playground) |
| Stop hook blocks on context edits | Expected; fix until `ai:check` green |

---

## Execution order (DAG)

```text
Pre-flight P0 → A0 (if check red)
    ↓
A1 AGENTS ──┬→ A2 apps/web AGENTS
            ├→ A3 zustand skill → A4 context-map
            └→ A5 data-fetching (parallel)
                    ↓
                 A6 golden → A7 path gate → A8 verify
                    ↓
         B1 MEMORY ∥ B2 mistakes ∥ B5 feature-module
                    ↓
         B3 index playground → B4 architecture overview
                    ↓
         B6 metrics altitude → B7 skills optional → B8 verify
                    ↓
         Wave C tracks (independent, measure-gated)
```

**Parallelism allowed:** A5 ∥ A1–A4; B1 ∥ B2 ∥ B5; B3 after A; C tracks independent.

**Forbidden:** Wave B golden path text that contradicts unfinished A; Wave C skill while A paths wrong.

---

## Agent execution checklist (copy into session)

```text
[ ] Read this plan + AGENTS.md + docs/ai/index.md
[ ] Pre-flight sizes + ai:eval + ai:check status
[ ] Branch created
[ ] A0 if needed — ai:check green
[ ] A1 → A2 → A3 → sync skills → A4
[ ] A5
[ ] A6 → A7 → A8
[ ] Wave A DoD signed
[ ] B1 → B2 → B3 → B4 → B5 → B6 → (B7?) → B8
[ ] Wave B DoD signed
[ ] Wave C only with measure/owner — else stop
[ ] Final ai:check + ai:eval
[ ] Report diff + risks; commit only if user asked
[ ] Set plan Status: Shipped
```

---

## Rollback strategy

- Prefer **per-step** `git checkout -- <files>`.
- Wave boundary: revert all files listed in that wave’s steps.
- If path-existence gate bricks `ai:check` unexpectedly: revert A7 first, keep A1–A6 truth fixes.

---

## Appendix A — File touch map

| Wave | Files (expected) |
| --- | --- |
| A0 | `apps/web/src/test/design-system/glass-panel-simple-tokenization.test.ts` (if red) |
| A | `AGENTS.md`, `apps/web/AGENTS.md`, `.agents/skills/zustand-store/SKILL.md`, `.claude/skills/zustand-store/SKILL.md` (generated), `scripts/context-map.json`, `docs/conventions/data-fetching.md`, `docs/ai/golden-examples.md`, `scripts/check-ai-context.mjs`, `scripts/ai-context.manifest.json` |
| B | `docs/ai/MEMORY.md`, `docs/ai/common-mistakes.md`, `docs/ai/index.md`, `docs/architecture/overview.md`, `docs/conventions/feature-module.md`, `docs/ai/agent-command-policy.md` and/or `llms.txt`, optional skill descriptions |
| C | Conditional: index/AGENTS/llms/skills/sky-player — **not** pre-listed as mandatory |

## Appendix B — Verification command block (final)

```powershell
bun run ai:check
bun run ai:eval
bun run ai:metrics
bun run ai:skills:sync   # if skills touched; should be no-op if clean

# Spot-check layout truth
Select-String -Path AGENTS.md,apps/web/AGENTS.md -Pattern "shared"
Test-Path apps/web/src/shared/stores/app-ui-store.ts
Test-Path apps/web/src/features/profile/use-profile-mutation.ts
```

## Appendix C — Mapping audit IDs → steps

| Audit finding | Step |
| --- | --- |
| AGENTS layout wrong | A1 |
| apps/web AGENTS components | A2 |
| zustand `src/stores` | A3 |
| context-map stores | A4 |
| toast-in-Zustand | A5 |
| golden profile/migrations/shared | A6 |
| no path existence gate | A7 |
| ai:check red token test | A0 |
| MEMORY sediment / deprecated ADR freeze pointer | B1 |
| common-mistakes 8 undocumented rules | B2 |
| playground surfaces missing | B3 |
| architecture missing shared | B4 |
| feature-module VN + absolute firewall | B5 |
| metrics/behavioral vs DoD | B6 |
| skill description overlap | B7 |
| sky-player skill / Cursor / behavioral / Compiler | C1–C4 |

---

*End of plan. Path: `docs/plans/context-layer-correctness-waves-2026-07.md`. Execute with `.agents/skills/refactor-plan/SKILL.md` discipline; P0–P4 always win.*
