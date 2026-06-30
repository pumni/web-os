# AI Context Layer — Refactor Execution Plan **v2** (2026-07-01)

- **Status:** ready-to-execute
- **Owner:** AI context layer (`docs/ai/index.md`)
- **Predecessor:** `docs/plans/ai-context-layer-refactor-2026-07.md` (v1 — DONE,
  gates green). v2 builds on a clean tree where v1's Tasks 1–10 are already merged.
- **Scope:** Hardening + governance. Bịt lỗ gate gốc rễ (phantom API), gỡ nợ
  size-budget, chuẩn hoá nốt phần sót, khép vòng governance `llms.txt`, và
  **bảo trì lớp ADR** (register + status audit + generator).
- **Goal:** Sau v2, một drift cùng loại (`unstable_instant`) **không thể merge**;
  lớp ADR có một register tự-đồng-bộ; không còn mâu thuẫn P1↔P3.

> Plan tự chứa & prescriptive: một AI khác đọc là thực thi top-to-bottom. Mỗi task
> có lý do, file:line, before/after literal (hoặc full script source), ràng buộc
> gate, acceptance. Lệnh dùng PowerShell 7 (`pwsh`). Sau MỖI task chạy
> `bun run ai:check` + `bun run ai:eval`; trước "done" chạy `bun run ai:premerge`.

---

## 0. Tiền đề (trạng thái sau v1 — đã verify)

- v1 đã merge: phantom `unstable_instant` xoá khỏi convention docs; router trỏ
  `review-gate`; `llms.txt` giữ + ADR-0013 có partial-reversal note; SSOT pointer
  sửa; npm bỏ; fence→pwsh (4 convention docs); analyzer comment 17→20.
- `bun run ai:check` + `bun run ai:eval` đều **PASS** (self-test 20/20 rule types).
- **Byte budgets hiện tại** (ceiling từ `scripts/ai-context.manifest.json`):

  | Path | maxBytes | Sau v1 | Headroom | v2 đụng? |
  |---|---|---|---|---|
  | `AGENTS.md` | 5500 | 5136 | 364 | không |
  | `docs/ai/index.md` | 4400 | 3881 | 519 | P3 (+~25) |
  | `docs/ai/MEMORY.md` | 2200 | 2117 | 83 | P4 (net ~0) |
  | `docs/ai/common-mistakes.md` | 4000 | **3998** | **2** | **P2 (giảm ~135)** |
  | `.agents/workflows/review-gate.md` | 2600 | 2313 | 287 | không |
  | `docs/ai/agent-command-policy.md` | 5400 | 2373 | 3027 | không |
  | `docs/ai/mcp.md` | 5000 | — | — | không |

---

## 1. Global guardrails (invariant — vi phạm là fail `bun run ai:check`)

Giống v1 §1, nhắc lại các điểm v2 chạm. Nguồn: `scripts/ai-context.manifest.json`
+ `scripts/check-ai-context.mjs`.

1. **`requiredFiles`** — không xoá file nào trong danh sách. P5 **thêm** một file
   (`scripts/sync-adr-register.mjs`) vào danh sách này.
2. **`sizeBudgets`** — hard ERROR nếu vượt; **trim doc, đừng nâng budget**. P2 phải
   làm `common-mistakes.md` co lại (đang 3998/4000, chỉ 2 byte). P3 thêm ~25 byte
   vào `index.md` (còn 519 byte — OK).
3. **`checkCompactMarkdownTables`** (file budgeted): ô bảng không ≥2 space liên
   tiếp; separator dùng `|---|`. Áp dụng khi sửa bảng `index.md` (P3) và
   `common-mistakes.md` (P2 — nhưng file này không có bảng).
4. **`checkWorkflowIndexNames`**: giữ `## Workflows`; token `` `kebab` `` trong đó
   map tới `.agents/workflows/<kebab>.md` thật. P3 cố ý thêm tên trần `review-gate`.
5. **`checkRuleInventory`**: `review-gate.md` giữ `## Static Rule Inventory` +
   literal `review-gate-rules.mjs`. Không đụng.
6. **`frontmatterRequired`**: `common-mistakes.md` phải giữ `---...description---`.
   P2 chỉ sửa body (mục 11–12). Đừng đụng frontmatter.
7. **`checkCodeReferences`/`checkDocPathReferences`**: backtick path tới
   `apps|packages|supabase|scripts/...` và `docs/...md` phải tồn tại. P1 thêm
   `scripts/sync-adr-register.mjs` vào prose → file phải tồn tại trước khi
   reference. `docs/plans/` và `docs/adr/` **được loại trừ** khỏi 2 check này → an
   toàn cho register table trong `adr/README.md` và ADR-0022.
8. **ADR là append-only/loại khỏi link-check** — P4/P5 sửa ADR + README thoải mái,
   nhưng đừng xoá ADR load-bearing (lifecycle `docs/adr/README.md`).
9. Sau mỗi task: `bun run ai:check` → `bun run ai:eval`. Cả hai pass mới sang task kế.

---

## 2. Decisions & rationale (best practice 2026)

### D-P1 — Phantom-API gate: **denylist nhẹ inline, KHÔNG freshness-treadmill**
- **Chọn:** Thêm hàm `checkDocApiDenylist()` **inline** vào `check-ai-context.mjs`
  (không file mới, không manifest change). Một mảng token đã-biết-là-ma; khởi đầu
  `unstable_instant`.
- **Loại — full "verify mọi Next API vs node_modules":** quá nặng/giòn (resolve
  export map, minified dist), và đúng cái treadmill mà `ADR-0009`/`0013` đã bỏ.
- **Loại — standalone script + --self-test:** machinery thừa cho ~25 dòng (YAGNI,
  `codebase-design` ladder). Inline là surgical nhất.
- **Best practice:** "Real misses become permanent guardrails" (`review-gate.md`)
  — biến 1 lần lọt thành deterministic gate, chi phí tối thiểu. Verify API thật
  vẫn làm tại edit-time vào `apps/web/node_modules/next` (đã ghi ở v1 Task 1).

### D-P2 — Budget `common-mistakes.md`: **trim prose dư, không nâng ceiling**
- Rule cấm nâng budget ("trim the doc"). Cắt ~135 byte prose lặp ở mục 11–12
  (không mất cặp ❌/✅). Mục tiêu ≤ 3870 (buffer ≥130). Không tách REFERENCE (file
  nằm trong requiredFiles + indexRequiredReferences + frontmatterRequired → tách
  là invasive, vi phạm "surgical").

### D-P3 — Polish: **fence sót + workflow-name validation thật**
- `docs/starter/rename-checklist.md` còn ```bash (cùng class v1 Task 7) → pwsh.
- `index.md ## Workflows` hiện trỏ bằng full-path backtick → `checkWorkflowIndexNames`
  **không** validate (chỉ `checkDocPathReferences`). Thêm tên trần `` `review-gate` ``
  để checker workflow-name cũng cắn → 2 lớp bảo vệ.

### D-P4 — Governance `llms.txt`: **ADR-0022 chính thức, không chỉ inline note**
- v1 chỉ thêm inline reversal note vào 0013 (header). Best practice MADR
  (`adr/README.md:62-65`): đảo một quyết định Accepted → **ADR mới** reference cái
  cũ. Tạo `ADR-0022` "Keep llms.txt", set `Supersedes: ADR-0013 §4`, trỏ chéo.
- *Vì sao đáng:* P1 (manifest requiredFiles) và P3 (ADR) đang mâu thuẫn ngầm; một
  ADR load-bearing dọn sạch điều đó cho người đọc tương lai.

### D-P5 — Bảo trì ADR: **register tự-đồng-bộ (generator), mirror sync-project-graph**
- **Chọn:** `scripts/sync-adr-register.mjs` (write + `--check`) sinh bảng register
  trong `adr/README.md` từ header mỗi ADR; `--check` wire vào `ai:check`. Giống
  hệt pattern `sync-project-graph.mjs`/`sync-skills.mjs` repo đã dùng.
- **Loại — bảng tay:** drift ngay khi thêm ADR (đúng lỗi `index.md` từng mắc).
- **Best practice:** "deterministic generators over discipline" — register không
  bao giờ thiếu ADR/sai status. Đây là governance hygiene, **không** phải
  context-layer prose tuning nên không vướng lệnh cấm meta-ADR của `ADR-0009/0013`.
- Kèm **status audit**: tất cả 11 ADR hiện `Accepted` (đã verify); generator chỉ
  phản ánh, con người sửa status-line nếu cần Deprecate/Supersede.

---

## 3. Tasks

### Task P1 — Phantom-API denylist gate

**Why:** D-P1. Convention prose (P2) có thể đặt tên API không tồn tại; gate hiện
không bắt. Biến nó thành lỗi build-time.

**Edit 1 — `scripts/check-ai-context.mjs`: thêm hàm.** Chèn **ngay trước**
`function checkUiPackageBoundaries() {` (khoảng dòng 695):

```js
function checkDocApiDenylist() {
  // Framework/API identifiers known to be phantom or removed. A convention doc
  // (P2) naming a non-existent API outranks real code (P4) and makes agents write
  // code that fails to build (cf. the `unstable_instant` incident, 2026-07).
  // This is a denylist, NOT a freshness table (ADR-0009/0013 removed version-table
  // upkeep): add an entry when a phantom API is caught. Verify *real* APIs at edit
  // time against apps/web/node_modules/next, not here.
  const DENY = [
    {
      token: 'unstable_instant',
      reason: 'not exported by the installed Next.js (phantom route-segment API)',
    },
  ];
  const targets = [
    'AGENTS.md',
    'apps/web/AGENTS.md',
    ...collectMarkdownFiles('docs/conventions'),
    ...collectMarkdownFiles('docs/ai'),
    ...collectMarkdownFiles('.claude/rules'),
  ];
  for (const relativePath of targets) {
    if (!fs.existsSync(resolveRel(relativePath))) continue;
    const content = readFile(relativePath);
    for (const { token, reason } of DENY) {
      const idx = content.indexOf(token);
      if (idx >= 0) {
        reportError(
          `Denylisted API '${token}' in ${relativePath}:${lineNumber(content, idx)} — ${reason}. Remove it or replace with a verified API.`,
        );
      }
    }
  }
}
```

**Edit 2 — `scripts/check-ai-context.mjs`: gọi hàm.** Trong chuỗi chạy chính (sau
`checkUiPackageBoundaries();`, khoảng dòng 738):

FIND:
```js
checkDesignTokenBoundaries();
checkUiPackageBoundaries();
checkSecretsIntegration();
```
REPLACE:
```js
checkDesignTokenBoundaries();
checkUiPackageBoundaries();
checkDocApiDenylist();
checkSecretsIntegration();
```

**Gate-safety:**
- Hàm chỉ scan `docs/conventions`, `docs/ai`, `.claude/rules`, 2 file AGENTS —
  **không** scan `docs/plans` (nơi v1/v2 plan có nhắc `unstable_instant`) hay
  `docs/adr` → không false-positive.
- Hiện không doc nào trong phạm vi chứa `unstable_instant` (v1 đã xoá) → check pass
  ngay.
- `collectMarkdownFiles`, `resolveRel`, `readFile`, `lineNumber`, `reportError` đã
  có sẵn trong file — không import mới.

**Acceptance:**
```pwsh
bun run ai:check     # phải PASS
# Test âm: tạm chèn "unstable_instant" vào docs/conventions/testing.md → ai:check FAIL với [ERROR] Denylisted API; rồi revert.
```

---

### Task P2 — Gỡ nợ size-budget `common-mistakes.md`

**Why:** D-P2. Chỉ còn 2 byte headroom → khoá mọi edit tương lai.

**File — `docs/ai/common-mistakes.md`.** Size-budgeted. Giữ frontmatter. Hai trim:

**Trim A (mục 11, dòng 94-95):**
FIND:
```markdown
❌ `describe.only` / `it.skip`, or `try { x() } catch {}` to silence a throwing
assertion. `.only` silently disables every other test.
```
REPLACE:
```markdown
❌ `describe.only` / `it.skip`, or `try { x() } catch {}` to silence a throw
(`.only` disables every other test).
```

**Trim B (mục 12, dòng 99-105):**
FIND:
```markdown
## 12. Premature abstraction / speculative features (simplicity — no static rule)

❌ A strategy/factory/registry for one case; an interface with a single
implementation; caching, validation, or config flags nobody asked for.
✅ Minimum code that solves today's task; add the abstraction when a second
real caller appears. Reversible/cosmetic decisions get no ADR
(`docs/adr/README.md`).
```
REPLACE:
```markdown
## 12. Premature abstraction (simplicity — no static rule)

❌ A strategy/factory/registry for one case; an interface with one impl; caching
or config flags nobody asked for.
✅ Minimum code for today's task; add the abstraction when a second real caller
appears. Reversible/cosmetic decisions get no ADR (`docs/adr/README.md`).
```

**Gate-safety:** Net ~-135 byte → ~3863/4000 (buffer ~137). `docs/adr/README.md`
backtick vẫn tồn tại. Không đụng rule-id headings `(`...`)` (giữ nguyên các
`(`test-weakening`)` v.v. — chúng map docs↔rule registry).

**Acceptance:**
```pwsh
(Get-Item docs/ai/common-mistakes.md).Length   # ≤ 3870
bun run ai:check
```

---

### Task P3 — Polish: fence sót + workflow-name validation

**Why:** D-P3.

**Edit 1 — `docs/starter/rename-checklist.md` (dòng ~33):** đổi fence ```bash →
```pwsh (lệnh bên trong giữ nguyên).

**Edit 2 — `docs/ai/index.md` `## Workflows`:** thêm tên trần để
`checkWorkflowIndexNames` validate.
FIND:
```markdown
| Self-review your diff before reporting "done" | `.agents/workflows/review-gate.md` |
```
REPLACE:
```markdown
| Self-review your diff before reporting "done" | `review-gate` → `.agents/workflows/review-gate.md` |
```

**Gate-safety:**
- `` `review-gate` `` là token `[a-z0-9-]+` → `checkWorkflowIndexNames` map tới
  `.agents/workflows/review-gate.md` (tồn tại). Full-path backtick vẫn được
  `checkDocPathReferences` kiểm tra.
- Ô bảng: ` `review-gate` → `.agents/...` ` không có ≥2 space liên tiếp → compact OK.
- Δ index.md ≈ +18 byte → ~3899/4400 OK.

**Acceptance:**
```pwsh
rg -n '```bash' docs/starter/   # 0 dòng
bun run ai:check                # PASS (workflow-name validate cắn)
```

---

### Task P4 — ADR-0022: chính thức hoá việc giữ `llms.txt`

**Why:** D-P4. Khép mâu thuẫn P1↔P3 bằng một ADR load-bearing.

**Edit 1 — Tạo `docs/adr/0022-keep-llms-txt-agentic-handshake.md`:**
```markdown
# 0022. Keep llms.txt as the Agentic Handshake Map

- **Status:** Accepted
- **Date:** 2026-07-01
- **Owner:** AI context layer (see `docs/ai/index.md`)
- **Supersedes:** ADR-0013 §4 (the `llms.txt` removal half only)

## Context

ADR-0013 §4 (2026-06-24) removed `llms.txt` as redundant with `docs/ai/index.md`
in a private monorepo. It was since restored as the tool-agnostic "agentic
handshake" entry map, re-added to `scripts/ai-context.manifest.json`
`requiredFiles`, and referenced from `docs/ai/index.md`. The ADR layer (P3) thus
contradicted the enforced manifest (P1). Per `docs/adr/README.md`, when a decision
and an enforced config disagree, enforce the config and update the ADR.

## Decision

Keep `llms.txt` as a required context file: a short human+agent map of the
tool-agnostic context (start-here → conventions → reference → skills). It stays in
`requiredFiles`, is referenced from `docs/ai/index.md`, and is link-checked by
`scripts/check-ai-context.mjs`. The remaining ADR-0013 decisions (freshness
removal, `when-to-load` collapse, generated skill shims, `CODEX.md`
normalization) stand.

## Consequences

Positive: P1 (manifest) and P3 (ADR) agree; new agents/tools get one stable
handshake file. Negative/neutral: `llms.txt` must stay in sync with
`docs/ai/index.md` (recorded in `docs/ai/MEMORY.md`); it is small and gate-checked,
so drift fails `bun run ai:check`.

## Alternatives considered

- Re-delete `llms.txt` to honor ADR-0013 §4 — rejected: it is a `requiredFiles`
  entry; deletion fails `checkRequiredFiles`, and the handshake map earns its keep.
- Leave the contradiction as an inline note on ADR-0013 — rejected: a load-bearing
  reversal deserves its own record (README lifecycle: supersede via a new ADR that
  references the old one).
```

**Edit 2 — `docs/adr/0013-context-layer-cleanup-2026-06.md`:** trỏ reversal note
sang ADR-0022 (thay note tạm của v1).
FIND:
```markdown
- **Partial reversal (2026-07-01):** Decision §4's removal of `llms.txt` was
  reversed — `llms.txt` is back as an agentic-handshake repo map and is now a
  required context file (`scripts/ai-context.manifest.json` `requiredFiles`,
  referenced from `docs/ai/index.md`). Decisions §1–§3 and §5 stand. `CODEX.md`
  normalization (§4, second half) stands.
```
REPLACE:
```markdown
- **Partial reversal:** Decision §4's `llms.txt` removal was reversed by
  **ADR-0022** (2026-07-01) — `llms.txt` is a required context file again.
  Decisions §1–§3, §5, and the `CODEX.md` normalization half of §4 stand.
```

**Edit 3 — `docs/ai/MEMORY.md`:** cập nhật dòng llms.txt trỏ ADR-0022.
FIND:
```markdown
- `llms.txt` is a required context file again (ADR-0013 §4 reversal, 2026-07-01) — keep it in sync with `docs/ai/index.md`; do not delete despite ADR-0013's removal note.
```
REPLACE:
```markdown
- `llms.txt` is a required context file (ADR-0022 supersedes ADR-0013 §4) — keep it in sync with `docs/ai/index.md`; do not delete.
```

**Gate-safety:** ADRs loại khỏi link/path check. `MEMORY.md` net ~-40 byte (an toàn
dưới 2200). Edit 2 net ~-90 byte. `0022-keep-llms-txt-agentic-handshake.md` tuân
format MADR-lite (README:33-50): header 4 dòng + đúng 4 section theo thứ tự.

**Acceptance:**
```pwsh
Test-Path docs/adr/0022-keep-llms-txt-agentic-handshake.md
(Get-Item docs/ai/MEMORY.md).Length     # < 2200
bun run ai:check
```

---

### Task P5 — Bảo trì ADR: register tự-đồng-bộ + status audit

**Why:** D-P5. Hiện `adr/README.md` không có register; thêm ADR là phải nhớ thủ
công (drift-prone). Tạo generator + block auto-gen, mirror `sync-project-graph`.

**Edit 1 — Tạo `scripts/sync-adr-register.mjs`** (write mặc định; `--check` so sánh):
```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ADR_DIR = path.join(ROOT, 'docs', 'adr');
const README = path.join(ADR_DIR, 'README.md');
const BEGIN = '<!-- BEGIN:auto-generated-adr-register -->';
const END = '<!-- END:auto-generated-adr-register -->';

const check = process.argv.includes('--check');

function field(content, label) {
  const m = content.match(new RegExp(`^- \\*\\*${label}:\\*\\*\\s*(.+)$`, 'm'));
  return m ? m[1].trim() : '';
}

function buildRegister() {
  const files = fs
    .readdirSync(ADR_DIR)
    .filter((f) => /^\d{4}-.+\.md$/.test(f))
    .sort();
  const rows = files.map((f) => {
    const content = fs.readFileSync(path.join(ADR_DIR, f), 'utf8');
    const title = (content.match(/^#\s+\d{4}\.\s+(.+)$/m)?.[1] ?? f).trim();
    const num = f.slice(0, 4);
    const status = field(content, 'Status') || '—';
    const date = field(content, 'Date') || '—';
    // Compact cells: collapse runs of spaces so checkCompactMarkdownTables-style
    // padding never sneaks in if README is ever budgeted.
    const cell = (s) => s.replace(/\s+/g, ' ').replace(/\|/g, '\\|');
    return `| ${num} | ${cell(title)} | ${cell(status)} | ${cell(date)} |`;
  });
  return [
    BEGIN,
    '<!-- Generated by scripts/sync-adr-register.mjs — run `bun run ai:adr:sync`. Do not edit by hand. -->',
    '',
    '| ADR | Title | Status | Date |',
    '|---|---|---|---|',
    ...rows,
    '',
    '> Number gaps are intentional: 0005–0007 squashed into 0009; 0014–0020 are',
    '> retired draft numbers. A gap never implies a missing decision.',
    END,
  ].join('\n');
}

const readme = fs.readFileSync(README, 'utf8');
const block = buildRegister();

if (!readme.includes(BEGIN) || !readme.includes(END)) {
  if (check) {
    console.error('[ERROR] adr/README.md is missing the ADR register block. Run `bun run ai:adr:sync`.');
    process.exit(1);
  }
  console.error('[ERROR] Add the BEGIN/END markers to adr/README.md first (see plan v2 Task P5 Edit 2).');
  process.exit(1);
}

const next = readme.replace(new RegExp(`${BEGIN}[\\s\\S]*?${END}`), block);

if (check) {
  if (next !== readme) {
    console.error('[ERROR] ADR register is out of sync. Run `bun run ai:adr:sync` and commit.');
    process.exit(1);
  }
  console.log('[sync-adr-register] Register in sync.');
} else {
  fs.writeFileSync(README, next);
  console.log('[sync-adr-register] Register written.');
}
```

**Edit 2 — `docs/adr/README.md`: thêm section register + markers.** Chèn một
`## Register` ngay sau heading `# Architecture Decision Records` (trước `## Priority`):
```markdown
## Register

<!-- BEGIN:auto-generated-adr-register -->
<!-- END:auto-generated-adr-register -->
```
(Để rỗng giữa marker; generator sẽ điền. KHÔNG sửa tay phần giữa marker sau đó.)

**Edit 3 — `package.json`: thêm script.** Trong `"scripts"`, cạnh `ai:graph:sync`:
FIND:
```json
    "ai:graph:sync": "bun scripts/sync-project-graph.mjs",
```
REPLACE:
```json
    "ai:graph:sync": "bun scripts/sync-project-graph.mjs",
    "ai:adr:sync": "bun scripts/sync-adr-register.mjs",
```

**Edit 4 — `scripts/ai-context.manifest.json`: thêm vào `requiredFiles`.**
FIND:
```json
    "scripts/sync-project-graph.mjs",
    "scripts/sync-skills.mjs",
```
REPLACE:
```json
    "scripts/sync-project-graph.mjs",
    "scripts/sync-skills.mjs",
    "scripts/sync-adr-register.mjs",
```

**Edit 5 — `scripts/check-ai-context.mjs`: wire `--check`.** Thêm hàm
`checkAdrRegisterSync()` (copy mẫu `checkProjectGraphSync`, đổi script + thông
điệp), chèn cạnh nó (~dòng 541-556):
```js
function checkAdrRegisterSync() {
  const syncScript = path.join(__dirname, 'sync-adr-register.mjs');
  if (!fs.existsSync(syncScript)) {
    reportWarn('sync-adr-register.mjs not found — skipping ADR register sync check.');
    return;
  }
  try {
    execFileSync(process.execPath, [syncScript, '--check'], { stdio: 'inherit', cwd: ROOT });
  } catch {
    reportError(
      'docs/adr/README.md ADR register is out of sync. Run `bun run ai:adr:sync` and commit.',
    );
  }
}
```
Và gọi nó trong chuỗi chính, sau `checkProjectGraphSync();` (~dòng 741):
FIND:
```js
checkSkillShimsSync();
checkProjectGraphSync();
```
REPLACE:
```js
checkSkillShimsSync();
checkProjectGraphSync();
checkAdrRegisterSync();
```

**Edit 6 — Chạy generator & status audit:**
```pwsh
bun run ai:adr:sync        # điền register 11 ADR + ADR-0022 = 12 dòng
Get-Content docs/adr/README.md | Select-String -Pattern '\| 00'   # mắt thường audit status
```
Status audit kỳ vọng (tất cả `Accepted`): 0001-0002 Accepted; 0003 Accepted
(defer adoption); 0004/0008/0011/0012 Accepted; 0009 Accepted (refined by 0013);
0010 Accepted (rejections revised by 0021); 0013 Accepted (§4 superseded by 0022);
0021 Accepted; 0022 Accepted. Nếu một ADR cần Deprecate/Supersede, sửa **status-line
trong file ADR đó** rồi chạy lại `ai:adr:sync` (đừng sửa tay block register).

**Gate-safety:**
- `sync-adr-register.mjs` phải tồn tại TRƯỚC khi nó vào `requiredFiles` (Edit 1
  trước Edit 4) và trước khi `check-ai-context` gọi `--check` (Edit 5). Thứ tự
  Edit 1→2→6→(3,4,5) an toàn; hoặc làm tất cả rồi chạy `ai:adr:sync` trước
  `ai:check`.
- README nằm trong `docs/adr/` → loại khỏi link/path check; register table tự do.
- `requiredPackageScripts` trong manifest **không** bắt buộc `ai:adr:sync` (chỉ
  bắt ai:check/ai:eval/... ) → không cần thêm ở đó. Thêm cũng được nhưng không bắt.

**Acceptance:**
```pwsh
bun run ai:adr:sync                       # "[sync-adr-register] Register written."
bun run ai:check                          # "[sync-adr-register] Register in sync." + PASS
# Test âm: sửa tay 1 ô trong block → ai:check FAIL "ADR register is out of sync"; rồi ai:adr:sync khôi phục.
```

---

## 4. Validation sequence

Sau mỗi task: `bun run ai:check` → `bun run ai:eval`.
Thứ tự thực thi đề xuất: **P1 → P2 → P3 → P4 → P5** (P5 cuối vì register phải gồm
ADR-0022 do P4 tạo).
Trước "done":
```pwsh
bun run ai:adr:sync     # đảm bảo register fresh
bun run ai:premerge     # ai:check && ai:eval && lint && typecheck && test && build
```
P1 & P5 đụng `scripts/*.mjs` (P1 enforced config) — `ai:eval` self-test (20/20) và
`ai:check` self-test (compact-table) phải vẫn pass; không cần `build` cho thay đổi
script gate, nhưng `ai:premerge` chạy hết cho chắc.

---

## 5. Rollback

- Mỗi P độc lập trừ **P4 trước P5** (register gồm 0022). Nếu P5 fail vì thiếu 0022
  → làm P4 trước.
- `git checkout -- <file>` revert một task; xoá `docs/adr/0022-*.md` và
  `scripts/sync-adr-register.mjs` nếu lùi P4/P5 (nhớ gỡ entry manifest + package.json
  + 2 call-site, nếu không `ai:check` fail vì `requiredFiles` thiếu file vừa xoá).
- Lỗi size-budget `common-mistakes.md` → cắt thêm prose (đừng nâng budget).
- Lỗi `Denylisted API` bất ngờ → grep token trong phạm vi scan; nếu là nhắc hợp lệ
  (hiếm), chuyển token ra khỏi denylist hoặc thu hẹp phạm vi.

---

## 6. Done checklist (exit criteria)

- [ ] **P1** `checkDocApiDenylist()` có trong `check-ai-context.mjs` + được gọi;
      test âm `unstable_instant` làm `ai:check` FAIL rồi revert sạch.
- [ ] **P2** `common-mistakes.md` ≤ 3870 byte; cặp ❌/✅ mục 11–12 còn nguyên ý.
- [ ] **P3** `docs/starter/rename-checklist.md` không còn ```bash; `index.md`
      Workflows có tên trần `review-gate`; `checkWorkflowIndexNames` validate.
- [ ] **P4** `docs/adr/0022-keep-llms-txt-agentic-handshake.md` tồn tại (MADR-lite,
      Supersedes 0013 §4); 0013 + MEMORY trỏ 0022; `llms.txt` còn tồn tại.
- [ ] **P5** `scripts/sync-adr-register.mjs` tồn tại + trong `requiredFiles` +
      `package.json` script `ai:adr:sync` + `check-ai-context` gọi `--check`;
      `adr/README.md` có register 12 ADR auto-gen; status audit xong; test âm
      out-of-sync FAIL rồi khôi phục.
- [ ] `bun run ai:check` + `bun run ai:eval` PASS; `bun run ai:premerge` PASS.
- [ ] Mọi size-budgeted file dưới ceiling; không `requiredFiles` nào bị xoá.

---

## 7. Phụ lục A — ADR register data (snapshot 2026-07-01, để đối chiếu generator)

| ADR | Title | Status | Date |
|---|---|---|---|
| 0001 | Structured Prompting and Model Routing Guidance | Accepted | 2026-06-18 |
| 0002 | Next.js Cache API Static Rules — Scope and Limits | Accepted | 2026-06-18 |
| 0003 | Cursor `.mdc` and Claude `settings.json` Permission Allow-Deny | Accepted (defer adoption) | 2026-06-19 |
| 0004 | Memory Layer Harness Managed Hybrid Model | Accepted | 2026-06-19 |
| 0008 | Refined Command Policy | Accepted | 2026-06-19 |
| 0009 | Context Layer — Lean 2026 | Accepted | 2026-06-20 |
| 0010 | Frontend Platform Foundation | Accepted (rejections revised by 0021) | 2026-06-20 |
| 0011 | Watch Sync State Machine + Observability Seam | Accepted | 2026-06-20 |
| 0012 | Surface Visual Language (consolidated) | Accepted | 2026-06-20 |
| 0013 | Context Layer — 2026-06 Cleanup | Accepted (§4 superseded by 0022) | 2026-06-24 |
| 0021 | Revisit ADR-0010 Rejections | Accepted | 2026-06-30 |
| 0022 | Keep llms.txt as the Agentic Handshake Map | Accepted | 2026-07-01 |

Gaps: 0005–0007 squashed → 0009; 0014–0020 retired draft numbers.

> Đây là snapshot tham chiếu; **nguồn sự thật là header từng file ADR** do
> `sync-adr-register.mjs` đọc. Nếu generator ra khác bảng này, generator thắng —
> cập nhật ADR header, không sửa tay register.

## 8. Phụ lục B — bản đồ gate sau v2 (mới so với v1)

| Check | Ràng buộc | Thêm bởi |
|---|---|---|
| `checkDocApiDenylist` | doc enforced không chứa API ma | P1 |
| `checkAdrRegisterSync` | `adr/README.md` register == header ADR | P5 |

> SSOT: `scripts/ai-context.manifest.json`, `scripts/check-ai-context.mjs`,
> `scripts/sync-adr-register.mjs`. Mâu thuẫn plan↔gate → **gate thắng**.
