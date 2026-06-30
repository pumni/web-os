# AI Context Layer — Refactor Execution Plan (2026-07-01)

- **Status:** ready-to-execute
- **Owner:** AI context layer (`docs/ai/index.md`)
- **Scope:** Sửa các drift/lỗi trong lớp AI-coding-instruction (root `AGENTS.md`,
  `docs/ai/*`, `docs/conventions/*`, `docs/adr/*`, `.claude/rules/*`,
  `.agents/*`, per-package `AGENTS.md`). **Không** đụng application code, trừ một
  code-doc comment trong `scripts/check-review-gate-rules.mjs` (Task 8, optional).
- **Goal:** Xoá thông tin sai/mâu thuẫn để một agent đọc lớp context là tin được
  100%, đồng thời bịt 2 lỗ mà deterministic gate hiện không bắt (phantom API,
  router bỏ sót workflow).

> Bản kế hoạch này **tự chứa và prescriptive**: một AI khác chỉ cần đọc file này,
> không cần re-derive, là thực thi được top-to-bottom. Mỗi task có: lý do, file +
> dòng chính xác, before/after literal, ràng buộc an toàn gate, và acceptance.
> Mọi câu lệnh dùng PowerShell 7 (`pwsh`) — xem `docs/ai/agent-command-policy.md`.

---

## 0. Bối cảnh & phương pháp (đọc trước khi sửa)

Plan này sinh ra từ một read-only audit lớp context. Mỗi finding đã được verify
lại với **bằng chứng đáng tin** (không suy đoán). Hai phát hiện đã được hiệu
chỉnh sau khi kiểm chứng kỹ — đọc kỹ phần "Hiệu chỉnh quan trọng" bên dưới trước
khi tin các nguồn cũ.

### Hiệu chỉnh quan trọng (đừng lặp lại sai lầm)

1. **Verify Next.js API phải dùng đúng path Bun-hoisted.** Repo là Bun monorepo;
   `next` **không** nằm ở `node_modules/next` mà ở
   `node_modules/.bun/next@16.2.9+<hash>/node_modules/next` (symlink từ
   `apps/web/node_modules/next`). Grep vào `node_modules/next/dist` trả 0 hit cho
   **mọi** thứ (kể cả `cacheLife` có thật) → kết quả vô nghĩa. Luôn grep vào path
   `.bun` thật, hoặc resolve symlink `apps/web/node_modules/next`.

2. **`llms.txt` là file BẮT BUỘC, không được xoá.** Nó nằm trong
   `scripts/ai-context.manifest.json:7` (`requiredFiles`). Xoá nó làm
   `checkRequiredFiles` fail. ADR-0013 §4 (nói "remove llms.txt") đã bị đảo trong
   thực tế nhưng ADR chưa cập nhật — đây là drift tài liệu, fix bằng cách **ghi
   nhận sự đảo ngược**, KHÔNG phải xoá file (xem Task 3).

---

## 1. Global guardrails (invariant — vi phạm là fail `bun run ai:check`)

Nguồn sự thật: `scripts/ai-context.manifest.json` + `scripts/check-ai-context.mjs`.

1. **`requiredFiles`** — không xoá bất kỳ file nào trong danh sách này. Liên quan
   tới plan: `llms.txt`, `CODEX.md`, `GEMINI.md`, `.github/copilot-instructions.md`,
   `.agents/workflows/review-gate.md`, `review-gate-rules.mjs`,
   `check-review-gate-rules.mjs`, tất cả `docs/conventions/*`, `docs/ai/*` đã liệt
   kê, các per-package `AGENTS.md` đã liệt kê.

2. **`sizeBudgets` (hard ceiling, ERROR nếu vượt — trim doc, đừng nâng budget):**

   | Path | maxBytes | Hiện tại | Headroom |
   |---|---|---|---|
   | `AGENTS.md` | 5500 | 5135 | 365 |
   | `docs/ai/index.md` | 4400 | 3788 | 612 |
   | `docs/ai/MEMORY.md` | 2200 | 1942 | 258 |
   | `docs/ai/common-mistakes.md` | 4000 | 3996 | **4** |
   | `.agents/workflows/review-gate.md` | 2600 | 2313 | 287 |
   | `docs/ai/agent-command-policy.md` | 5400 | 2310 | 3090 |
   | `docs/ai/mcp.md` | 5000 | (n/a) | — |

   ⚠ `common-mistakes.md` chỉ còn **4 byte** headroom. Edit ở Task 4 chỉ được
   **xoá** ký tự (`check-` → bỏ), không thêm. Tuyệt đối không thêm nội dung file này.

3. **`checkCompactMarkdownTables`** chạy trên mọi file có size-budget. Trong các
   file đó: ô bảng **không** được có ≥2 dấu cách liên tiếp; hàng separator
   **không** được có ≥4 dấu `-` hay double-space (dùng `|---|---|`). Áp dụng khi
   sửa bảng trong `index.md` (Task 2).

4. **`checkWorkflowIndexNames`** (`check-ai-context.mjs:477`): `docs/ai/index.md`
   **phải** giữ heading `## Workflows`. Mọi token dạng `` `kebab-name` `` (chỉ
   `[a-z0-9-]`) trong section đó phải map tới `.agents/workflows/<name>.md` có
   thật (trừ `agents`). Backtick chứa path đầy đủ (có `/`, `.`) KHÔNG bị coi là
   workflow-name → an toàn, nhưng vẫn bị `checkDocPathReferences` kiểm tra tồn tại.

5. **`checkRuleInventory`** (`check-ai-context.mjs:607`):
   `.agents/workflows/review-gate.md` phải giữ heading `## Static Rule Inventory`
   **và** literal string `review-gate-rules.mjs` bên trong nó. Đừng đụng phần đó.

6. **`frontmatterRequired`** — các doc sau phải giữ block `---...---` mở đầu với
   `description:`. Liên quan plan: `data-fetching.md`, `server-client-boundary.md`,
   `common-mistakes.md`, `testing.md`, `supabase-security.md`, `transpile-packages.md`.
   Sửa body thoải mái; đừng bỏ frontmatter.

7. **`indexRequiredReferences`** — `index.md` phải tiếp tục nhắc mỗi path trong
   danh sách (`manifest:70-91`). Task 2 chỉ **thêm** một row, không xoá row nào.

8. **`checkCodeReferences` / `checkDocPathReferences`** — backtick refs tới
   `apps|packages|supabase|scripts/...\.(ts|tsx|sql|mjs|css)` (có thể kèm
   `#symbol`) và `docs/...\.md` phải tồn tại. Khi đổi tên file/symbol trong prose,
   phải trỏ đúng cái có thật. `docs/plans/` và `docs/adr/` được **loại trừ** khỏi
   các check này (history/append-only).

9. **Sau MỖI task** đụng lớp context, chạy `bun run ai:check` rồi `bun run ai:eval`.
   Cả hai phải pass trước khi sang task kế. Lệnh đầy đủ trước khi "done":
   `bun run ai:premerge`.

---

## 2. Decisions & rationale (best practice 2026 — vì sao chọn như vậy)

Trước mỗi sửa đổi là một quyết định kỹ thuật. Đây là phần "tự đánh giá lựa chọn".

### D1 — Phantom API `unstable_instant`: **XOÁ guidance, thay bằng cơ chế thật**
- **Lựa chọn A (chọn):** Xoá mọi nhắc tới `unstable_instant`; viết lại theo cơ
  chế Next 16 có thật đã bật trong repo (`cacheComponents: true` ở
  `next.config.ts:10`) + `'use cache'` + `<Suspense>` (đã là SSOT ở
  `.claude/rules/nextjs-cache-components.md`).
- **Lựa chọn B (loại):** Giữ và "chờ Next thêm API". Loại — convention P2 đứng
  trên local code (P4); để một export không tồn tại trong P2 ép agent viết code
  vỡ build. YAGNI: đừng tài liệu hoá API tưởng tượng.
- **Bằng chứng:** `rg unstable_instant` vào Next 16.2.9 thật (path `.bun`) = 0
  hit; `rg` toàn repo source = 0 (chỉ 2 doc này dùng). `cacheComponents`/`cacheLife`
  có hit thật. → `unstable_instant` không có thật ở cả framework lẫn codebase.
- **Best practice:** Convention chỉ mô tả API đã verify tại edit-time trong
  `node_modules` (đúng tinh thần `ADR-0009:55-57`), single-source ở
  `.claude/rules/*`.

### D2 — Router bỏ sót workflow: **route tới review-gate, bỏ "not in use"**
- **Lựa chọn A (chọn):** `index.md` thêm row Workflows trỏ
  `.agents/workflows/review-gate.md`.
- **Lựa chọn B (loại):** Xoá `review-gate.md` cho khớp câu "not in use". Loại —
  ADR-0009:46 cố ý GIỮ nó là workflow duy nhất; nó là file `requiredFiles` và là
  behavioural self-review mà static gate không thay thế được.
- **Best practice:** "Single router" phải phủ **mọi** guidance layer; một self-review
  gate trước "done" là chuẩn agentic hiện đại (đối chiếu review-gate workflow của
  repo + Agent Skills progressive disclosure).

### D3 — `llms.txt` vs ADR-0013: **giữ file (bắt buộc), reconcile ADR**
- **Lựa chọn A (chọn):** Cập nhật `ADR-0013` bằng một dòng "Reversal note" + ghi
  một entry `MEMORY.md`, vì file đang `requiredFiles`.
- **Lựa chọn B (loại):** Xoá `llms.txt`. Loại — vỡ `checkRequiredFiles`
  (`manifest:7`). 
- **Best practice:** ADR là P3 append-only; khi thực tại đảo một quyết định
  Accepted, ghi nhận sự đảo ngược (status transition / reversal note) thay vì để
  ADR nói dối (lifecycle `docs/adr/README.md:53-63`).

### D4 — Con trỏ rule-id SSOT: **trỏ về registry `review-gate-rules.mjs`**
- **Quyết định:** `common-mistakes.md:8` đang nói ids "map to
  `check-review-gate-rules.mjs`" (cái analyzer). Sửa thành `review-gate-rules.mjs`
  (cái registry định nghĩa `RULES`/`RULE_INFO`). Checker tự xác nhận điều này:
  `check-ai-context.mjs:616-619` ghi rõ "scripts/review-gate-rules.mjs là single
  source of truth".
- **Lưu ý:** `review-gate.md:6` ("enforced by `check-review-gate-rules.mjs` via
  ai:eval") là **đúng** (analyzer enforces) — đừng sửa. Chỉ một dòng sai duy nhất
  là `common-mistakes.md:8`.

### D5 — "npm" trong command policy: **bỏ, repo là bun-only**
- `package.json:66` `preinstall: only-allow bun`. Liệt kê npm là tín hiệu sai.

### D6 — Bash fences trong repo pwsh-only: **đổi nhãn (cosmetic, gate-neutral)**
- Đổi ` ```bash ` → ` ```pwsh ` ở các convention doc. Lệnh `bun/bunx` shell-agnostic
  nên không vỡ; đây là khử tín hiệu sai, không bắt buộc — gom vào Task 7.

### D7 — Drift số đếm rule (16/17/20) & ADR gaps: **đồng bộ code-doc, ghi chú governance**
- ADR-0009 ("16 rules") là history đóng băng — **không sửa ADR**. Chỉ đồng bộ
  doc-comment header `check-review-gate-rules.mjs` cho khớp 20 `RULES` thật
  (Task 8, optional). ADR gap 0014–0020 ghi một dòng minh bạch (Task 9, optional).

---

## 3. Tasks (thực thi theo thứ tự)

> Quy ước: "FIND" = literal hiện có; "REPLACE" = literal mới. Match chính xác cả
> thụt lề. Sau mỗi task chạy gate (guardrail #9).

### Task 1 — [HIGH] Xoá phantom API `unstable_instant`

**Why:** D1. Hai P2 convention docs ép export một thứ không tồn tại trong Next
16.2.9 → vỡ build/runtime; static gate không bắt (không phải backtick code-path).

**File A — `docs/conventions/data-fetching.md` (dòng 25-29).**
Không size-budgeted; giữ frontmatter.

FIND:
```markdown
For routes that should navigate instantly with `cacheComponents: true`, export
`unstable_instant` from server route segments and let build-time validation catch
missing cache or Suspense boundaries. Protected layouts must keep auth checks
behind a local Suspense boundary with a static fallback shell that does not
render protected children before authentication resolves.
```

REPLACE:
```markdown
`cacheComponents: true` is enabled (`apps/web/next.config.ts`). To make a route
serve an instant static shell with PPR, mark the cached server function with
`'use cache'`, give it a parameterized `cacheTag(...)` and a safe `cacheLife(...)`,
and wrap every dynamic child in `<Suspense>`. Build-time validation flags a
dynamic read with no cache or Suspense boundary. Protected layouts must keep auth
checks behind a local Suspense boundary with a static fallback shell that does not
render protected children before authentication resolves. Canonical mechanics:
`.claude/rules/nextjs-cache-components.md`.
```

**File B — `docs/conventions/server-client-boundary.md` (dòng 12-14).**

FIND:
```markdown
- **Route Segment Exports**: Keep Next.js route segment config exports such as
  `unstable_instant` in Server Components. Do not add them to `"use client"`
  pages or components.
```

REPLACE:
```markdown
- **Route Segment Config**: Keep Next.js route segment config exports (e.g.
  `dynamic`, `revalidate`, `fetchCache`) and the `'use cache'` directive in
  Server Components. Never place them in `"use client"` pages or components.
```

**Gate-safety:** `unstable_instant` chỉ tồn tại ở 2 file này (đã verify
`rg unstable_instant` repo = 2 file). Sau sửa, không còn nhắc tới nó. Backtick
mới (`'use cache'`, `dynamic`...) không phải code-path ref nên không bị
`checkCodeReferences`. `.claude/rules/nextjs-cache-components.md` là backtick
`.claude/...md` → `checkDocPathReferences` kiểm tra tồn tại (có thật).

**Pre-flight verify (BẮT BUỘC chạy trước khi tin wording):**
```pwsh
$next = (Resolve-Path apps/web/node_modules/next).Path
rg -n "unstable_instant" "$next"          # kỳ vọng: 0 dòng
rg -n "cacheComponents|cacheLife" "$next\dist" | Select-Object -First 3  # kỳ vọng: có hit
```
Nếu (bất ngờ) `unstable_instant` CÓ trong Next đã cài → dừng, báo lại; có thể API
đã được thêm ở patch mới — khi đó giữ tên đúng thay vì xoá.

**Acceptance:** `rg unstable_instant docs/` = 0; `bun run ai:check` pass.

---

### Task 2 — [MED] Router route tới review-gate workflow

**Why:** D2. `index.md:73` "Not currently in use" mâu thuẫn workflow active
(`ADR-0009:46`, `AGENTS.md:41`).

**File — `docs/ai/index.md` (dòng 71-73).** Size-budgeted (612 byte headroom).
Giữ heading `## Workflows` (guardrail #4). Bảng phải compact (guardrail #3).

FIND:
```markdown
## Workflows

Not currently in use.
```

REPLACE:
```markdown
## Workflows

| Need | Load |
|---|---|
| Self-review your diff before reporting "done" | `.agents/workflows/review-gate.md` |
```

**Gate-safety:**
- `## Workflows` được giữ → `checkWorkflowIndexNames` OK.
- Backtick `` `.agents/workflows/review-gate.md` `` chứa `/` và `.` → KHÔNG khớp
  `` `[a-z0-9-]+` `` nên không bị coi là workflow-name (không cần shim name). Đồng
  thời khớp `\.agents/...\.md` của `checkDocPathReferences` → kiểm tra tồn tại
  (file có thật).
- Ô bảng không có ≥2 space; separator `|---|---|` → `checkCompactMarkdownTables` OK.
- Chỉ thêm, không xoá row → `indexRequiredReferences` OK.
- Δ bytes ≈ +70 → ~3858/4400. OK.

**Acceptance:** `bun run ai:check` pass; `rg "Not currently in use" docs/ai/index.md` = 0.

---

### Task 3 — [HIGH] Reconcile ADR-0013 với `llms.txt` đang sống

**Why:** D3. `ADR-0013:52-53` §4 nói đã xoá `llms.txt`, nhưng nó là `requiredFiles`
(`manifest:7`), tồn tại, và `index.md:39` trỏ tới. ADR đang nói dối trạng thái.
**KHÔNG xoá `llms.txt`.**

**File A — `docs/adr/0013-context-layer-cleanup-2026-06.md`.** (ADR được loại khỏi
link-check; sửa an toàn.) Thêm một "Reversal note" ngay dưới header
(`docs/adr/README.md` cho phép status transition; đây là ghi nhận đảo ngược một
phần, không phải tạo ADR mới vì 0013 vẫn Accepted cho 3 quyết định còn lại).

FIND (dòng 5-6):
```markdown
- **Refines:** ADR-0009 (Context Layer — Lean 2026)
```

REPLACE:
```markdown
- **Refines:** ADR-0009 (Context Layer — Lean 2026)
- **Partial reversal (2026-07-01):** Decision §4's removal of `llms.txt` was
  reversed — `llms.txt` is back as an agentic-handshake repo map and is now a
  required context file (`scripts/ai-context.manifest.json` `requiredFiles`,
  referenced from `docs/ai/index.md`). Decisions §1–§3 and §5 stand. `CODEX.md`
  normalization (§4, second half) stands.
```

**File B — `docs/ai/MEMORY.md`.** Size-budgeted (258 byte headroom). Thêm 1 dòng
vào `## Settled facts`. Δ ≈ +180 byte → ~2122/2200. OK (sát budget — đừng thêm gì
khác). Nếu vượt, rút gọn dòng cũ trùng ý.

FIND (dòng cuối list, dòng 26):
```markdown
- Enforcement is deterministic gates over discipline: doc→code drift caught by `checkCodeReferences` (`path#symbol` anchors); verify-loop reward-hacking caught by the `test-weakening` rule → `scripts/check-ai-context.mjs`, `scripts/review-gate-rules.mjs`, [common-mistakes.md](common-mistakes.md).
```

REPLACE:
```markdown
- Enforcement is deterministic gates over discipline: doc→code drift caught by `checkCodeReferences` (`path#symbol` anchors); verify-loop reward-hacking caught by the `test-weakening` rule → `scripts/check-ai-context.mjs`, `scripts/review-gate-rules.mjs`, [common-mistakes.md](common-mistakes.md).
- `llms.txt` is a required context file again (ADR-0013 §4 reversal, 2026-07-01) — keep it in sync with `docs/ai/index.md`; do not delete despite ADR-0013's removal note.
```

**Gate-safety:** Cả `llms.txt` và `index.md:39` giữ nguyên. `MEMORY.md` byte sát
budget — verify `(wc -c)` sau sửa < 2200. Link `[common-mistakes.md]` không đổi.

**Acceptance:** `bun run ai:check` pass; `MEMORY.md` < 2200 byte; `llms.txt` còn tồn tại.

---

### Task 4 — [MED] Sửa con trỏ rule-id SSOT trong common-mistakes

**Why:** D4. `common-mistakes.md:8` trỏ sai file định nghĩa rule-ids.

**File — `docs/ai/common-mistakes.md` (dòng 7-8).** Size-budgeted, **chỉ còn 4
byte headroom** → edit này XOÁ 6 ký tự (`check-`) nên file co lại 3990 byte. An toàn.

FIND:
```markdown
`bun run ai:eval` _catches_ these; this doc helps you _avoid_ them. Rule ids
map to `scripts/check-review-gate-rules.mjs`.
```

REPLACE:
```markdown
`bun run ai:eval` _catches_ these; this doc helps you _avoid_ them. Rule ids
are defined in `scripts/review-gate-rules.mjs`.
```

**Gate-safety:** `scripts/review-gate-rules.mjs` tồn tại (`requiredFiles:15`) →
`checkCodeReferences` OK. File co lại → size budget OK. Đừng thêm ký tự nào khác.

**Acceptance:** `bun run ai:check` pass; `(wc -c docs/ai/common-mistakes.md)` ≤ 3996.

---

### Task 5 — [LOW] Bỏ "npm" khỏi command policy

**Why:** D5. Repo only-allow bun (`package.json:66`).

**File — `docs/ai/agent-command-policy.md` (dòng 9).** Size-budgeted (3090 byte
headroom — thoải mái).

FIND:
```markdown
Use `pwsh` for non-file ops: git, npm, bun, `jq`.
```

REPLACE:
```markdown
Use `pwsh` for non-file ops: git, bun, bunx, `jq` (the repo is bun-only — `preinstall` runs `only-allow bun`).
```

**Acceptance:** `rg "\bnpm\b" docs/ai/agent-command-policy.md` = 0; gate pass.

---

### Task 6 — [INFO] Làm rõ phạm vi vitest trong P1 (tuỳ chọn)

**Why:** Issue #9 audit — `AGENTS.md:37` liệt kê `apps/web/vitest.config.ts` như
*the* enforced test config, nhưng `vitest.config.ts:14-15` chỉ include
`src/test/**` và exclude `validators/**`, `scripts/**` (có config/project khác).

**File — `AGENTS.md` (dòng 37).** Size-budgeted (365 byte headroom — đủ cho sửa nhỏ).

FIND:
```markdown
- **P1 Enforced Config:** `package.json`, `turbo.json`, `tsconfig*.json`, `apps/web/eslint.config.mjs`, `apps/web/vitest.config.ts`, CI commands.
```

REPLACE:
```markdown
- **P1 Enforced Config:** `package.json`, `turbo.json`, `tsconfig*.json`, `apps/web/eslint.config.mjs`, the `vitest.config.ts` files, CI commands.
```

**Gate-safety:** Δ bytes ≈ -10 (co lại). OK. **Optional** — bỏ qua nếu muốn giữ
diff tối thiểu.

**Acceptance:** gate pass; `AGENTS.md` < 5500 byte.

---

### Task 7 — [LOW] Đổi nhãn ```bash → ```pwsh ở convention docs (cosmetic)

**Why:** D6. Khử tín hiệu sai trong repo pwsh-only. Gate-neutral.

**Files (không size-budgeted; sửa từng fence ``` ```bash ``` `→` ``` ```pwsh ```):**
- `docs/conventions/testing.md` (3 fence: dòng ~20, ~38, ~49)
- `docs/quality-gates.md` (dòng ~6, ~24)
- `docs/conventions/supabase-security.md` (dòng ~45)
- `docs/conventions/feature-module.md` (dòng ~128)
- `docs/conventions/transpile-packages.md` (nếu có fence lệnh)

Lệnh bên trong (`bun run ...`, `bunx ...`, `cd apps/web`) giữ nguyên — đã hợp lệ
trong pwsh. **Optional** — gom thành một commit "docs: normalize shell fences".

**Verify:**
```pwsh
rg -n '```bash' docs/   # sau khi sửa: 0 dòng (hoặc chỉ còn fence thực sự là bash)
```

**Acceptance:** `bun run ai:check` pass (cosmetic, không ảnh hưởng gate).

---

### Task 8 — [LOW/optional] Đồng bộ doc-comment đếm rule trong analyzer

**Why:** D7. `scripts/check-review-gate-rules.mjs` header comment (dòng ~8-25) liệt
kê 17 flags trong khi `scripts/review-gate-rules.mjs` `RULES` có **20**
(thiếu `legacy-middleware`, `image-priority-deprecated`, `single-arg-revalidate-tag`).
Đây là **code-doc**, không phải lớp context — sửa nếu đang chạm file đó.

**Hành động:** Cập nhật khối comment liệt kê flags cho khớp đủ 20 id trong `RULES`.
**Không** sửa `ADR-0009:74` ("16 rules") — ADR là history append-only.

**Verify:**
```pwsh
# Đếm id thật trong registry:
rg -c "^\s+[A-Z_]+: '" scripts/review-gate-rules.mjs   # kỳ vọng: 20
bun run ai:eval                                         # self-test analyzer phải pass
```

**Acceptance:** Comment khớp 20 rule; `bun run ai:eval` pass.

---

### Task 9 — [LOW/optional] Ghi chú minh bạch ADR numbering gap

**Why:** Audit issue #8. 0005–0007 đã ghi squash→0009; nhưng 0014–0020 vắng mặt
không giải thích, nhảy thẳng 0021.

**File — `docs/adr/README.md`,** thêm 1 dòng vào mục `## Naming` (dòng ~67-71):

ADD (sau câu "Numbers are monotonic and never reused."):
```markdown
Gaps are expected: 0005–0007 were squashed into 0009; 0014–0020 were
draft/working numbers retired without a load-bearing record (recoverable from
git). A gap never implies a missing decision.
```

**Acceptance:** gate pass (ADR loại khỏi link-check; an toàn).

---

### Task 10 — [INFO/optional] Xác minh parity multi-tool shims

**Why:** ADR-0013 §4 (phần còn hiệu lực) yêu cầu `CODEX.md` ngang `GEMINI.md`. Cả
`CODEX.md`, `GEMINI.md`, `.github/copilot-instructions.md` là `requiredFiles`.

**Hành động (verify-only, sửa nếu lệch):**
```pwsh
Get-Content CODEX.md, GEMINI.md          # cùng trỏ @AGENTS.md / cùng cấu trúc?
Get-Content .github/copilot-instructions.md | Select-Object -First 20
```
Nếu một shim lệch (vd trỏ doc đã đổi tên, thiếu security mandate pointer), chỉnh
cho ngang `AGENTS.md`. Không nở nội dung — shim phải mỏng.

**Acceptance:** Ba shim nhất quán; `bun run ai:check` pass.

---

## 4. Validation sequence (chạy đúng thứ tự)

Sau **mỗi** task:
```pwsh
bun run ai:check    # required-files, sizes, links, frontmatter, workflow names, rule inventory
bun run ai:eval     # static review-gate rules + secrets scan (self-test analyzer trước)
```
Trước khi tuyên bố "done" (full pass):
```pwsh
bun run ai:premerge # = ai:check && ai:eval && lint && typecheck && test && build
```
Nếu chỉ sửa docs (Task 1–7, 9, 10), `ai:check` + `ai:eval` là gate đúng altitude
(xem `docs/ai/agent-command-policy.md#validation`). Task 8 đụng code-doc → thêm
`bun run ai:eval` (đã gồm) là đủ vì là comment; không cần `build`.

---

## 5. Rollback

Mỗi task là một edit độc lập, không phụ thuộc nhau (trừ Task 3 File A+B nên đi
cùng nhau). Nếu một gate fail sau task:
1. `git diff` file vừa sửa, đối chiếu before/after literal ở trên.
2. Lỗi size-budget → file vượt ceiling: rút gọn (đừng nâng budget). Hay gặp ở
   `common-mistakes.md` (4 byte) và `MEMORY.md` (258 byte).
3. Lỗi `Doc path reference does not exist` → backtick path mới sai chính tả.
4. `git checkout -- <file>` để revert một task, các task khác giữ nguyên.

---

## 6. Done checklist (exit criteria)

- [ ] Task 1: `rg unstable_instant docs/` = 0; cả 2 convention doc mô tả cơ chế
      `'use cache'` + `cacheComponents` + `<Suspense>` thật.
- [ ] Task 2: `index.md` `## Workflows` trỏ `.agents/workflows/review-gate.md`;
      không còn "Not currently in use".
- [ ] Task 3: `llms.txt` còn tồn tại; `ADR-0013` có Reversal note; `MEMORY.md`
      ghi nhận, `(wc -c) < 2200`.
- [ ] Task 4: `common-mistakes.md:8` trỏ `review-gate-rules.mjs`; file ≤ 3996 byte.
- [ ] Task 5: không còn `npm` trong `agent-command-policy.md`.
- [ ] Task 6 (optional): P1 nói "the `vitest.config.ts` files".
- [ ] Task 7 (optional): không còn ```bash fence sai trong `docs/`.
- [ ] Task 8 (optional): analyzer comment khớp 20 rule.
- [ ] Task 9 (optional): `adr/README.md` giải thích numbering gap.
- [ ] Task 10 (optional): 3 multi-tool shim parity.
- [ ] `bun run ai:premerge` PASS.
- [ ] Mọi size-budgeted file vẫn dưới `maxBytes` (bảng guardrail #2).
- [ ] Không file `requiredFiles` nào bị xoá.

---

## 7. Phụ lục — bản đồ gate (tham chiếu nhanh)

| Check (`check-ai-context.mjs`) | Ràng buộc | Task bị ảnh hưởng |
|---|---|---|
| `checkRequiredFiles` | `requiredFiles` phải tồn tại | giữ `llms.txt` (T3) |
| `checkSizeBudgets` | `sizeBudgets` hard ceiling | T2,T3,T4,T6 |
| `checkCompactMarkdownTables` | bảng compact trong file budgeted | T2 |
| `checkWorkflowIndexNames` | `## Workflows` + name→file | T2 |
| `checkRuleInventory` | `review-gate.md` giữ pointer | none (đừng đụng) |
| `checkFrontmatter` | giữ `---` + `description:` | T1,T4,T7 |
| `checkContextIndexCoverage` | `index.md` nhắc đủ refs | T2 (chỉ thêm) |
| `checkDocPathReferences` | backtick `docs/...md` tồn tại | T1,T2 |
| `checkCodeReferences` | backtick code-path[#symbol] tồn tại | T1,T4 |
| `checkSkillShimsSync` | `.claude/skills` == `.agents/skills` | none |
| `checkProjectGraphSync` | graph == workspace:* | none |

> SSOT files: `scripts/ai-context.manifest.json` (cấu hình gate),
> `scripts/check-ai-context.mjs` (`ai:check`), `scripts/run-ai-evals.mjs` +
> `scripts/check-review-gate-rules.mjs` + `scripts/review-gate-rules.mjs`
> (`ai:eval`). Nếu mâu thuẫn giữa plan này và các file đó, **gate thắng** — cập
> nhật plan, không bypass gate.
