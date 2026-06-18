---
description: Đánh giá độc lập và toàn diện hệ thống AI context hiện tại của Pumni Web OS, đối chiếu với hai báo cáo tham chiếu, kèm khuyến nghị nâng cấp và tối ưu.
when-to-load: Khi cần hiểu trạng thái hệ thống AI context, lập kế hoạch nâng cấp, hoặc onboard một agent/maintainer mới vào triết lý thiết kế của hệ thống.
audit-date: 2026-06-18
audited-against:
  - "Báo cáo 1: Thiết Kế Hệ Thống Ngữ Cảnh Trí Tuệ Nhân Tạo Cho Kiến Trúc Monorepo Next.js 16.2.9"
  - "Báo cáo 2: Kiến Trúc Hệ Thống Ngữ Cảnh AI Chuyên Sâu Cho Dự Án Monorepo Next.js 16.2.9"
---

# AI Context System Audit — Pumni Web OS

> Phân tích và đánh giá độc lập hệ thống AI context của repo `D:\Dev\web-os`, ngày
> 2026-06-18. Mọi tuyên bố kỹ thuật dưới đây đều đã được kiểm chứng trực tiếp
> against code/config thật (đường dẫn, version file, script enforcement, kết quả
> chạy `ai:check` / `ai:eval`), không dựa trên mô tả của báo cáo. Các mục
> **✅ Đã kiểm chứng** / **⚠️ Drift phát hiện** / **❌ Thiếu** được đánh dấu rõ.

## TL;DR

Pumni Web OS **đã sở hữu một hệ thống AI context thuộc nhóm trưởng thành nhất**
so với thực tiễn mà hai báo cáo tham chiếu mô tả. Hệ thống không dừng ở "có
`AGENTS.md`" mà đi xa về phía **enforcement xác định luận (deterministic
enforcement)**: một manifest chính thức, các static analyzer tự viết, gate CI, và
lớp prompt-injection/threat-model tường minh. Đánh giá tổng thể:

| Khía cạnh | Mức độ triển khai | Ghi chú |
| --- | --- | --- |
| Static context phân tầng (AGENTS.md / scoped / conventions) | ██████████ Mạnh | 4 entry points + multi-tool wrappers |
| Progressive disclosure + read routing | █████████░ Rất tốt | index + task routes + skills, vài chỗ duplicate |
| Next.js 16 specifics (async/cache API) | ██████████ Mạnh | Đúng phiên bản, có ví dụ, có static rules |
| MCP runtime (next-devtools-mcp) | ████████░░ Tốt | Cấu hình + doc chính xác, optional đúng |
| Enforcement layer (ai:check / ai:eval / CI) | █████████░ Rất tốt | 14 static rules, self-test, eval coverage 14/14 |
| Security & untrusted-content policy | ██████████ Mạnh | P0–P6 priority stack, prompt-injection evals |
| Memory / compaction layer | ███████░░░ Khá | Có 3 tầng MEMORY/scratchpad/canonical, manual |
| Prompt engineering (XML/CoT) | ████░░░░░░ Yếu | Chưa áp dụng XML tagging / `<thinking>` định dạng |
| Model routing strategy | █░░░░░░░░░ Hầu như không | Chưa có hướng dẫn phân tuyến model |
| Cursor `.mdc` / settings.json allow-deny | ░░░░░░░░░░ Không | Không dùng Cursor/Claude settings (chính sách chủ động) |

Kết luận ngắn: hệ thống **vượt hai báo cáo** ở phần enforcement và security, nhưng
**chưa đạt** ở phần prompt-engineering có cấu trúc (XML/CoT) và model routing —
chính là hai mảng báo cáo mô tả rất chi tiết. Đây là cơ hội nâng cấp rõ ràng nhất.

---

## 1. Phạm vi & phương pháp kiểm chứng

Để báo cáo này đủ tin cậy làm cơ sở nâng cấp, mọi nhận định đều được đối chiếu
thực tế trong repo:

- **Version & config**: đọc `apps/web/package.json`, root `package.json`,
  `turbo.json`, `apps/web/next.config.ts`, `.mcp.json`, `.github/workflows/ci.yml`.
- **Bundled docs**: kiểm tra trực tiếp `node_modules/next/dist/docs/` (xác nhận có
  `01-app`, `02-pages`, `03-architecture`, `04-community`, `index.md`).
- **Enforcement**: đọc `scripts/ai-context.manifest.json`, `check-ai-context.mjs`,
  `review-gate-rules.mjs`, `run-ai-evals.mjs`; chạy thực tế `bun run ai:check` và
  `bun run ai:eval`.
- **Toàn bộ instruction plane**: `AGENTS.md`, `apps/web/AGENTS.md`, 3
  `packages/*/AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `GEMINI.md`, `llms.txt`,
  `.github/copilot-instructions.md`, `.claude/rules/*.md`, toàn bộ `docs/ai/*.md`,
  `docs/ai/task-routes/*.md`.
- **Recipe plane**: 5 skills, 7 evals, 1 workflow (`review-gate.md`).

Phần lớn tuyên bố của hai báo cáo tham chiếu là **đúng với dự án này** — vì dự án
đã được xây dựng theo đúng những nguyên lý đó. Điểm khác biệt và cơ hội cải thiện
nằm ở phần "chưa làm", được liệt kê ở §6.

---

## 2. Kiểm chứng các tuyên bố kỹ thuật cốt lõi

Đây là phần quan trọng nhất: xác nhận báo cáo không bị "hallucinate" khi áp dụng
vào repo cụ thể.

### 2.1 Next.js 16.2.9 & async request APIs — ✅ Đã kiểm chứng

- **Báo cáo claim**: `params`, `searchParams`, `cookies()`, `headers()`,
  `draftMode()` đều bất đồng bộ; sync access compile được nhưng throw runtime.
- **Thực tế repo**: `apps/web/package.json` pin `"next": "16.2.9"` (đúng phiên bản
  báo cáo). `node -e "require('next/package.json').version"` → `16.2.9`.
  `apps/web/AGENTS.md` + `.claude/rules/nextjs-async-apis.md` + `common-mistakes.md`
  §12 mô tả chính xác pattern `await params` và cảnh báo "sync access compiles but
  throws at runtime". Khớp hoàn toàn.

### 2.2 Cache Components (`cacheComponents: true`) — ✅ Đã kiểm chứng

- **Báo cáo claim**: 16 gộp `experimental.ppr` + `experimental.dynamicIO` thành một
  cờ `cacheComponents`; `'use cache'` placement, `cacheLife('seconds')` tạo dynamic
  hole, `updateTag()` Server-Actions-only, `revalidateTag()` cần 2 tham số.
- **Thực tế repo**: `apps/web/next.config.ts` có `cacheComponents: true` (không còn
  `experimental.ppr`). `apps/web/AGENTS.md` → "Cache Components (ALWAYS/NEVER)"
  covers **tất cả 6 điểm trên** với bảng three-tier decision model
  (Always/Ask/Never). `common-mistakes.md` §10/13/14/15/16 lặp lại dưới dạng ❌/✅.
  Static rule không cover cache (chỉ docs) — nhưng docs rất sát báo cáo.

### 2.3 Bundled documentation (`node_modules/next/dist/docs/`) — ✅ Đã kiểm chứng

- **Báo cáo claim**: Next 16.2 đóng gói docs tại `node_modules/next/dist/docs/`,
  giúp AI đạt 100% task completion vs 79% dynamic retrieval.
- **Thực tế repo**: đường dẫn **có tồn tại** và chứa `01-app/`, `02-pages/`,
  `03-architecture/`, `04-community/`, `index.md`. `mcp-runtime.md` + `apps/web/AGENTS.md`
  hướng dẫn dùng `nextjs_docs` (MCP) **hoặc** `cat node_modules/next/dist/docs/...`
  (không cần MCP). Docs-first workflow được lặp lại nhiều nơi → tin cậy.

### 2.4 `npx next typegen` — ✅ Đã kiểm chứng

- **Báo cáo claim**: dùng `next typegen` để sinh `PageProps`/`RouteContext`.
- **Thực tế repo**: `npx next --help` liệt kê `typegen [directory] [options]` thực
  sự tồn tại. Được nhắc trong `apps/web/AGENTS.md`, `common-mistakes.md` §12, và
  `.claude/rules/nextjs-async-apis.md`. ✅.

### 2.5 MCP `next-devtools-mcp` & endpoint `/_next/mcp` — ✅ Đã kiểm chứng (có tinh chỉnh)

- **Báo cáo claim**: cấu hình `.mcp.json` với `next-devtools-mcp@latest`, các tool
  `get_errors`, `get_logs`, `get_routes`, `get_page_metadata`,
  `get_server_action_by_id`, `nextjs_index`; endpoint `/_next/mcp`.
- **Thực tế repo**: `.mcp.json` tồn tại, khai báo đúng server `next-devtools` với
  `npx -y next-devtools-mcp@latest` + `NEXT_TELEMETRY_DISABLED=1`. **Tuy nhiên** repo
  **sửa lại chính xác** điều mà báo cáo nêu sai: `mcp-runtime.md` nói rõ
  "**Không có** tool literal tên `get_routes`/`get_errors` ở bridge level" — các
  capability phải được **khám phá runtime** qua `init` + `nextjs_runtime`. Đây là
  điểm repo **tinh tế và đúng hơn** báo cáo (báo cáo liệt kê tool tên cứng).

> Nhận định: phần lớn tuyên bố kỹ thuật của hai báo cáo là chính xác và repo đã
> triển khai đúng. Repo thậm chí chỉnh một sai số (tên tool MCP) mà báo cáo mắc
> phải. Độ tin cậy kỹ thuật: cao.

---

## 3. Kiến trúc hệ thống hiện tại (như đang tồn tại)

Hệ thống chia **3 plane** (mô tả trong `docs/ai/context-system-overview.md`):

```
┌─ Instruction Plane (nói AI đọc gì, nghĩ sao) ────────────────────────┐
│  AGENTS.md (root constitution) ─┬─ apps/web/AGENTS.md (Next 16 scoped)│
│  CLAUDE.md / CODEX.md / GEMINI │  packages/{ui,supabase,auth}/AGENTS │
│  .github/copilot-instructions  │  .claude/rules/*.md (glob-scoped)   │
│  llms.txt / .aiignore          │  docs/ai/*.md + task-routes/*       │
│                                │  docs/conventions/* + architecture  │
└─────────────────────────────────┴─────────────────────────────────────┘
┌─ Recipe Plane (thủ tục tái sử dụng) ─────────────────────────────────┐
│  .agents/workflows/review-gate.md   .agents/skills/*/SKILL.md (×5)   │
│  .agents/evals/*.md (×7)                                             │
└──────────────────────────────────────────────────────────────────────┘
┌─ Enforcement Plane (làm context deterministic) ──────────────────────┐
│  scripts/ai-context.manifest.json   scripts/check-ai-context.mjs     │
│  scripts/review-gate-rules.mjs      scripts/check-review-gate-rules  │
│  scripts/check-secrets.mjs          scripts/run-ai-evals.mjs         │
│  CI: .github/workflows/ci.yml (ai:check + ai:eval trong pipeline)    │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.1 Instruction Plane — điểm mạnh

- **Single source of truth với thin wrappers**: `CLAUDE.md`, `CODEX.md` chỉ là
  `@AGENTS.md` (≤1500 byte, manifest enforced). `GEMINI.md` / copilot-instructions
  cũng chỉ trỏ về `AGENTS.md`. Đúng nguyên tắc "không vi phạm DRY" mà báo cáo 1 nêu.
  ✅ Manifest validate `requiredText: ["AGENTS.md"]` + `maxBytes`.
- **Priority stack P0–P6 tường minh** (`AGENTS.md`): security > enforced config >
  architecture > ADR > local evidence > recipes > task intent. Đây là cơ chế giải
  xung đột mà **không báo cáo nào** mô tả chi tiết bằng — đây là điểm vượt trội.
- **Untrusted-content policy** rõ ràng: comment/log/bug-report/seed/generated
  types/pasted markdown = dữ liệu không tin cậy, không bao giờ là instruction.
  Có 2 eval prompt-injection (`bug-report`, `code-comment`) kiểm chứng hành vi.
- **Next.js scoped rules cô đặc** (`apps/web/AGENTS.md`, 148 dòng): toàn bộ async
  + cache + suspense + transitionTypes + three-tier model trong 1 file, được bảo
  bởi comment block `BEGIN:nextjs-agent-rules` (cú pháp quản lý bởi Next).
- **Glob-scoped Claude rules** (`.claude/rules/`): lazy-load theo file pattern,
  đúng kỹ thuật "progressive disclosure" báo cáo 2 mô tả.

### 3.2 Recipe Plane — điểm mạnh

- **5 skills** (server-action, supabase-migration, tanstack-query-hook,
  zustand-store, testing-template): mỗi skill có frontmatter `name`/`description`,
  `## Rules` + `## Checklist`. Manifest validate cấu trúc.
- **7 evals** với 14 static rules được map `automated-rule`/`covered-rules`;
  `ai:eval` báo **coverage 14/14** (chạy thực tế). Self-test fixture cho mỗi rule.
- **Task routes** (R0/R1/R2/review-fix/spike) định nghĩa "context budget" —
  **must/may/must-not read** theo mức rủi ro. Đây là cách xử lý "lost in the middle"
  rất tốt: không nạp docs thừa.

### 3.3 Enforcement Plane — điểm mạnh (vượt cả báo cáo)

Đây là nơi repo **đáng tự hào nhất** và báo cáo hoàn toàn không đề cập:

- `check-ai-context.mjs` kiểm: required files, frontmatter, markdown link rot,
  **backtick doc-path reference rot**, thin-wrapper size, llms.txt path validity,
  golden-example path existence, eval→rule mapping, **rule inventory sync**,
  design-token boundaries (không raw `oklch()` ngoài token files), `@pumni/ui`
  package boundary (không import server/auth/db). Đây là static context integrity
  gate đúng nghĩa.
- `check-review-gate-rules.mjs`: 14 static rules + self-test 14/14 (chạy thực tế).
- `check-secrets.mjs`: .env committed + secret pattern scan.
- **CI** (`.github/workflows/ci.yml`) chạy `ai:check` + `ai:eval` trên mỗi push/PR
  → enforcement không chỉ là lời khuyên mà là hard gate. Báo cáo 2 nói "verification
  loop khép kín" — repo **đã có** loop đó, tự động hoá.

---

## 4. Đánh giá theo từng trụ cột mà hai báo cáo nêu

### 4.1 Static context phân tầng trong monorepo — Điểm: 9/10

Báo cáo 2 đề xuất CLAUDE.md phân cấp root/subdirectory <200 dòng, `@imports`
tiết lộ lũy tiến. Repo **đã làm gần hết**:

- ✅ Root `AGENTS.md` + scoped `apps/web/AGENTS.md` + `packages/*/AGENTS.md`.
- ✅ `CLAUDE.md` <200 dòng (23 dòng).
- ✅ Index + task routes = progressive disclosure.
- ⚠️ `docs/ai/index.md` liệt kê `.claude/rules/*.md` như canonical source nhưng
  manifest `requiredFiles` **không** liệt kê cụ thể 2 file `.claude/rules/*` → nếu
  ai xoá file đó, `ai:check` vẫn pass. (Drift nhỏ, xem §6.1.)

### 4.2 Next.js 16.2.9 sync — Điểm: 9.5/10

- ✅ Version chính xác, cacheComponents đúng, async API đúng, bundled docs đúng,
  `next typegen` đúng. Mọi claim kỹ thuật của báo cáo đều đúng với repo.

### 4.3 MCP runtime — Điểm: 8/10

- ✅ `.mcp.json` cấu hình đúng, `mcp-runtime.md` chính xác và **sửa sai báo cáo**
  về tên tool.
- ✅ Optional đúng: "không bao giờ phụ thuộc MCP cho CI/gate" — khớp tinh thần
  "local dev aid" mà `MEMORY.md` chốt.
- ⚠️ Chưa tận dụng `next-browser` (`@vercel/next-browser`) / PPR lock-unlock workflow
  mà báo cáo 1 mô tả. Repo chỉ đến `browser_eval` (Playwright-backed) qua MCP. Đây
  là capability nâng cao có thể bổ sung khi cần verify PPR shell.

### 4.4 Security & access control — Điểm: 10/10

- ✅ P0 immutable mandates, RLS-first, service-role server-only, `"server-only"`
  isolation, untrusted-content policy, prompt-injection evals, secret scan trong
  CI. Đây là mảng **vượt xa** cả hai báo cáo (báo cáo chỉ nói `settings.json`
  allow/deny; repo làm bằng static analyzer + eval).

### 4.5 Prompt engineering (XML tagging / CoT `<thinking>`) — Điểm: 3/10 ❌

Đây là **khoảng trống lớn nhất**. Báo cáo 2 dành cả mục "Tối Ưu Hóa Kỹ Thuật
Prompt Engineering" cho:

- XML tagging (`<context>`, `<task>`, `<instructions>`, `<requirements>`) → tăng
  20–40% consistency.
- `<thinking>` chain-of-thought ép agent suy luận trước khi code.
- Few-shot examples, expert role framing, positive instructions.

Repo hiện **không có** tài liệu nào dạy agent dùng XML structure hay `<thinking>`.
Các convention doc là prose xuôi (tốt cho người, vừa phải cho mô hình). Đề xuất ở §6.6.

### 4.6 Model routing (Opus vs GPT/Codex vs GLM) — Điểm: 1/10 ❌

Báo cáo 1 đề xuất phân tuyến: Opus cho kiến trúc/App Router/Cache boundaries,
GPT-5.5 cho CI/test/log analysis, GLM cho privacy. Repo **không có** hướng dẫn
nào. Hiện tại model dùng cho agent này là `builtin:zai-start-plan/GLM-5.2` (theo
config) nhưng không có doc nào nói khi nào nên/phải dùng model nào, hay trade-off.

### 4.7 Verification loop khép kín — Điểm: 9/10

- ✅ Explore→Plan→Implement→Verify ngầm định qua agent-behavior + task routes +
  review-gate. "Show evidence" được enforce qua CI.
- ✅ Subagent delegation: harness có Agent tool (Explore) — khớp khuyến nghị
  "subagent bảo toàn context" của báo cáo 2.
- ⚠️ Chưa có doc tường minh về "khi nào dùng subagent vs đọc trực tiếp" trong
  `docs/ai/`.

---

## 5. Drift & vấn đề thực tế phát hiện khi kiểm chứng

Đây là những phát hiện **thực** (không suy đoán), quan trọng cho việc nâng cấp:

### 5.1 ⚠️ Hai file vượt ngưỡng kích thước (ai:check warning)

Chạy `bun run ai:check` → **2 warning**:

```
[WARN] AI context file is large (5459 bytes): docs/ai/common-mistakes.md
[WARN] AI context file is large (5392 bytes): docs/ai/context-system-overview.md
```

Ngưỡng `docs/ai/*.md` < 5000 byte (`check-ai-context.mjs:113`). Hai file đang
5459 / 5392 byte. Mức độ: thấp (warning, không block). Nhưng vi phạm nguyên tắc
"keep static prefix small & prompt-cache-friendly" mà chính
`context-system-overview.md` §"Prompt-cache layout" đặt ra — **tự vi phạm rule
của mình**.

### 5.2 ⚠️ `.claude/rules/*.md` không nằm trong manifest `requiredFiles`

`docs/ai/index.md` (Canonical Sources) + `context-system-overview.md` (Instruction
Plane) đều liệt kê `.claude/rules/*.md` là canonical. Nhưng
`scripts/ai-context.manifest.json` → `requiredFiles` **không** chứa
`.claude/rules/nextjs-async-apis.md` hay `nextjs-cache-components.md`. Hệ quả: ai
xoá 2 file này, `ai:check` vẫn PASS → link rot nói "load từ `.claude/rules/`"
nhưng file không còn. Lỗ hổng integrity nhỏ.

### 5.3 ⚠️ Trùng lặp nội dung cache rules (3 nơi)

Cùng nội dung `'use cache'` placement / `cacheLife('seconds')` / `updateTag`
Server-Action-only / `revalidateTag` 2 tham số xuất hiện ở:

1. `apps/web/AGENTS.md` (scoped, có bảng)
2. `.claude/rules/nextjs-cache-components.md` (glob-scoped)
3. `docs/ai/common-mistakes.md` §10/13/14/15/16

`context-system-overview.md` §"Prompt-cache layout" cảnh báo: *"Do not duplicate a
canonical rule into a second file; link instead. Duplicates drift."* → **đang drift
nguy cơ**. Khi Next 16.3 đổi cache API, phải sửa 3 chỗ. `context-maintenance.md`
§"Drift Risks" cũng đã liệt sẵn `.claude/rules/*.md drifting out of sync` — tức
người维护 đã biết rủi ro nhưng chưa có guard tĩnh.

### 5.4 ⚠️ `packages/features` tồn tại nhưng "vô hình" trong graph

`AGENTS.md` (Project) liệt kê `packages/*` gồm `features` & `test-utils`.
`docs/architecture/project-graph.md` liệt leaves: `validators`, `features`,
`test-utils`. Kiểm chứng: cả 5 package (`validators`, `features`, `test-utils`,
`config`, `env`) đều **tồn tại**. ✅ Nhưng `project-graph.md` Mermaid graph **không
vẽ** `features` / `test-utils` / `validators` (chỉ vẽ Web→UI/Auth/Supabase/Env/
Validators/Config). Đồ thị và bảng leaves không khớp hoàn toàn → có thể gây nhầm
cho agent về blast radius. Nhẹ.

### 5.5 ⚠️ docs/ai/index.md tự tham chiếu `.agents/skills` glob nhưng không liệt kê skill cụ thể

`indexRequiredReferences` (manifest) bắt `docs/ai/index.md` phải chứa chuỗi
`.agents/skills` và `docs/ai/task-routes`. ✅ nhưng index chỉ khớp bằng *chuỗi con*,
không verify từng skill route có tên trong index. Nếu thêm skill mới mà quên đưa
vào bảng Skills của index, `ai:check` vẫn pass. Mức độ: thấp.

### 5.6 ❌ Không có `docs/adr/` (ADRs) — đã khai báo "reserved"

`AGENTS.md` Priority Stack P3 = "ADRs in `docs/adr/` (reserved — none yet)". Đây là
khoảng trống **có chủ đích**, không phải bug. Nhưng khi quyết định kiến trúc quan
trọng xuất hiện (ví dụ: chọn model routing, chọn có dùng XML prompt hay không),
nên bắt đầu ghi ADR. Đề xuất ở §6.

### 5.7 ℹ️ `agent-command-policy.md` nói "PowerShell-first" nhưng môi trường agent là `cmd.exe`

Policy ưu tiên `pwsh`, nhưng environment của agent này là `win32` + `cmd.exe`.
Không sai (policy cho phép fallback), nhưng khi agent tự chạy lệnh dễ dùng cú pháp
bash/pwsh mà cmd không hiểu (như `&&` không phải cmd native, `head`/`tail`). Đây là
**rủi ro thực nghiệm**: trong phiên audit này, một số lệnh `findstr`/path backslash
thất bại vì cmd. Đề xuất: bổ sung note rõ trong policy về hành vi khi shell hiện
hành là cmd.

---

## 6. Khuyến nghị nâng cấp & tối ưu (theo độ ưu tiên)

Mỗi đề xuất gắn với plane nó thuộc về và rủi ro nó giải quyết. Đánh giá theo
nguyên tắc của chính repo: **surgical, link-don't-duplicate, enforcement-first**.

### P1 — Khử duplicate cache rules + đưa `.claude/rules` vào manifest (giảm drift)

**Vấn đề**: §5.3 (trùng 3 nơi) + §5.2 (manifest lỗổng).

**Giải pháp**:

1. Biến `apps/web/AGENTS.md` → Cache Components section thành **canonical owner**
   (giữ nguyên, nó đã có bảng three-tier đẹp nhất).
2. `.claude/rules/nextjs-cache-components.md` + `common-mistakes.md` §13–16:
   rút gọn thành ❌/✅ + dòng "See `apps/web/AGENTS.md` → Cache Components" thay vì
   lặp lại code block.
3. Thêm vào `manifest.requiredFiles`:
   `.claude/rules/nextjs-async-apis.md`, `.claude/rules/nextjs-cache-components.md`.
4. (Tùy chọn) thêm checker mới trong `check-ai-context.mjs`: phát hiện cache-API
   code block (`'use cache'`, `cacheLife`, `updateTag`) xuất hiện ở >1 file → warn.

**Lợi ích**: khi Next 16.3 đổi, sửa 1 chỗ. Khớp nguyên tắc "link instead of
duplicate". Giảm 5459→<5000 byte cho `common-mistakes.md` (giải luôn §5.1).

### P2 — Bổ sung prompt-enginering plane (XML tagging + `<thinking>`)

**Vấn đề**: §4.5 (điểm 3/10) — khoảng trống lớn nhất so với báo cáo.

**Giải pháp**: tạo file mới **`docs/ai/prompt-structure`** *(đề xuất — chưa tồn tại)*,
có frontmatter `description`/`when-to-load`, dạy agent:

- **Khi nào dùng XML**: task phức tạp nhiều ràng buộc (R2, multi-package) → bọc
  requirement trong `<requirements>…</requirements>`, ngữ cảnh `<context>…`, task
  `<task>…`. Không lạm dụng cho R0/R1 đơn giản (tránh noise).
- **`<thinking>` CoT**: trước khi edit không-trivial, trình bày trong `<thinking>`:
  (1) ràng buộc/giả định, (2) trade-off, (3) edge case & blast radius qua
  `project-graph.md`, (4) backward-compat. Đây chính là "plan mode" có cấu trúc.
- **Few-shot**: tham chiếu `golden-examples.md` (đã có) + `common-mistakes.md` ❌/✅.
- **Positive instructions**: "viết X" thay "đừng Y" (đã làm tốt ở多处).

**Rủi ro/trade-off**: XML tăng token; dùng chọn lọc theo task route. Đưa vào
`task-routes/r2-supabase.md` + `r1-feature.md` "May use structured prompt" thay vì
bắt buộc toàn cục. Thêm 1 ADR **`docs/adr/0001-structured-prompting`** *(đề xuất)* ghi quyết định.

### P3 — Bổ sung model routing strategy

**Vấn đề**: §4.6 (điểm 1/10).

**Giải pháp**: tạo **`docs/ai/model-routing`** *(đề xuất — chưa tồn tại)* hoặc thêm mục vào `prompt-playbook.md`:

| Loại task | Đặc điểm | Gợi ý |
| --- | --- | --- |
| Kiến trúc App Router, Cache boundaries, Server Actions sâu | Cần logic nhất quán, ngữ cảnh dài | Model reasoning mạnh (Opus-class) |
| CI/debug log analysis, refactor lớn, sinh test hàng loạt | Parallel tool use, throughput | Model tool-discipline (GPT-class / Codex harness) |
| Dữ liệu nhạy cảm / privacy | Không rời môi trường | GLM-class local |
| Đa số task R0/R1 | Cân bằng | Model mặc định |

Kèm **cảnh báo**: model routing là **P6 (task intent)**, không override P0–P4. Dù
model nào, vẫn phải chạy `ai:check`/`ai:eval`. Không bao giờ dùng "model yếu" làm
lý do bỏ validation.

**Lưu ý quan trọng**: đây là *hướng dẫn vận hành*, không phải config repo. Repo
không chọn model thay user; doc chỉ giúp hiểu trade-off. Đưa vào ADR.

### P4 — Thu gọn 2 file vượt size (giải warning §5.1)

`common-mistakes.md` (5459B) và `context-system-overview.md` (5392B):

- `common-mistakes.md`: mục §13–16 (cache) rút gọn theo P1. Có thể tách
  "Next.js 16 cache mistakes" (§10,13,14,15,16) thành **`docs/ai/nextjs16-mistakes`**
  *(đề xuất)* riêng (cũng <5000) và `common-mistakes.md` giữ state/Supabase/route mistakes.
- `context-system-overview.md`: phần "Extending The System" khá dài → tách sang
  `context-maintenance.md` (đã có mục tương tự, gộp).

**Hoặc** nâng ngưỡng warning lên 5500 nếu chủ đích cho phép — nhưng repo tự đặt
5000 vì lý do prompt-cache, nên thu gọn đúng tinh thần hơn.

### P5 — Đồng bộ graph với reality (§5.4)

Sửa `project-graph.md` Mermaid: thêm node `Features`, `TestUtils`, `Validators`
với cạnh `Web -->` phù hợp (nếu apps/web thực sự import). Hoặc nếu chúng thực sự
chưa được Web import (leaves thật sự), thêm note "not yet imported by apps/web".
Verify bằng `rg "from '@pumni/(features|test-utils|validators)'" apps/web/src`.

### P6 — Mở rộng static rules cho cache API (tùy chọn, cẩn thận)

Hiện 14 static rules **không** cover Next.js cache misuse (placement, seconds,
updateTag scope, revalidateTag args). Báo cáo 1 liệt kê đúng 5 "silent bugs compile
fine". Đề xuất: thêm rules `use-cache-placement`, `cache-life-too-short`,
`update-tag-scope`, `cache-tag-unparameterized` vào `review-gate-rules.mjs` với
self-test fixture (repo đã có pattern cho việc này).

**Cảnh báo**: `context-system-overview.md` nói "Add static rule only when pattern
deterministic enough to avoid false positives". Cache misuse **có thể** false
positive (vd. `'use cache'` hợp lệ trong nhiều ngữ cảnh). Phải viết regex hẹp +
test fixture nhiều case. Ưu tiên thấp hơn P1–P3.

### P7 — Bổ sung next-browser / PPR verification khi cần (§4.3)

Khi repo bắt đầu phụ thuộc nặng vào PPR static shell, thêm workflow
**`.agents/workflows/ppr-verify`** *(đề xuất)* dùng `next-browser ppr lock/unlock` qua MCP. Chưa
cấp bách — chỉ khi có route `unstable_instant` phức tạp.

---

## 7. Lộ trình đề xuất (3 giai đoạn)

**Giai đoạn 1 — Anti-drift (1–2 buổi, rủi ro thấp, xử lý P1+P4+P5)**:

- Khử duplicate cache rules, link thay vì copy.
- Đưa `.claude/rules/*` vào manifest.
- Thu gọn 2 file vượt size.
- Đồng bộ Mermaid graph.
- Chạy `bun run ai:check` phải 0 warning, `bun run ai:eval` pass.

**Giai đoạn 2 — Prompt & model maturity (2–3 buổi, P2+P3)**:

- Tạo `docs/ai/prompt-structure.md` (XML + `<thinking>`), link từ task routes.
- Tạo `docs/ai/model-routing.md` + ADR `0001` + `0002`.
- Cập nhật `index.md`, `manifest.requiredFiles`/`indexRequiredReferences` để
  `ai:check` cover file mới.

**Giai đoạn 3 — Enforcement sâu hơn (khi có dữ liệu, P6+P7)**:

- Thêm static cache rules chỉ sau khi có ≥2 lần agent mắc lỗi cache thực tế.
- PPR verify workflow khi cần.

---

## 8. Tổng kết

Hệ thống AI context của Pumni Web OS **không phải bản nháp** — nó là một kiến trúc
3-plane hoàn chỉnh với enforcement deterministic đi kèm CI, vượt các thực tiễn mà
hai báo cáo tham chiếu mô tả ở mảng **security, untrusted-content, static
analysis, eval coverage**. Repo thậm chí **sửa được một sai số kỹ thuật** của báo
cáo (tên tool MCP).

Điểm yếu hiện tại **không nằm ở phần đã làm** mà ở **hai mảng báo cáo mô tả mà repo
chưa chạm**: prompt engineering có cấu trúc (XML/CoT) và model routing strategy.
Cùng với vài drift nhỏ (duplicate cache rules, file vượt size, manifest lỗổng), đây
là cơ hội nâng cấp rõ ràng, không đụng đến security boundary (P0 giữ nguyên).

Quan trọng nhất: **mọi nâng cấp phải đi qua chính enforcement plane** — thêm file
→ cập nhật manifest; thêm rule → cập nhật inventory + self-test; thay đổi cache
API → sửa canonical owner duy nhất. Đó là triết lý đã khiến hệ thống ổn định đến
nay và là kim chỉ nam cho đợt nâng cấp tiếp theo.

---

## Phụ lục A — Bằng chứng kiểm chứng (lệnh đã chạy)

| Kiểm chứng | Lệnh | Kết quả |
| --- | --- | --- |
| Next.js version | `node -e "require('next/package.json').version"` (từ apps/web) | `16.2.9` ✅ |
| Bundled docs tồn tại | `ls node_modules/next/dist/docs` (apps/web) | `01-app 02-pages 03-architecture 04-community index.md` ✅ |
| cacheComponents flag | đọc `next.config.ts` | `cacheComponents: true`, không `experimental.ppr` ✅ |
| MCP config | đọc `.mcp.json` | server `next-devtools`, `@latest`, telemetry off ✅ |
| `next typegen` | `npx next --help \| grep typegen` | tồn tại ✅ |
| Package leaves tồn tại | kiểm tra `packages/{validators,features,test-utils,config,env}` | đều EXISTS ✅ |
| Multi-tool wrappers | kiểm tra `CODEX.md/GEMINI.md/llms.txt/.aiignore/.github/copilot-instructions.md` | đều EXISTS ✅ |
| AI context gate | `bun run ai:check` | PASSED, 2 warnings (size) ✅⚠️ |
| Regression gate | `bun run ai:eval` | PASSED; self-test 14/14; static scan 199 code + 16 SQL; eval coverage 14/14 ✅ |
| Static rules | đọc `review-gate-rules.mjs` | 14 rules, P0/B1/B2 severity ✅ |

## Phụ lục B — Bản đồ file AI context (tính đến ngày audit)

| Plane | Đường dẫn | Vai trò |
| --- | --- | --- |
| Instruction | `AGENTS.md` | Hiến pháp root, P0–P6, security mandates |
| Instruction | `apps/web/AGENTS.md` | Next.js 16 scoped rules (async/cache/suspense) |
| Instruction | `packages/{ui,supabase,auth}/AGENTS.md` | Package-scoped rules |
| Instruction | `CLAUDE.md`/`CODEX.md`/`GEMINI.md` | Thin wrappers → `@AGENTS.md` |
| Instruction | `.github/copilot-instructions.md` | Copilot entry → `AGENTS.md` |
| Instruction | `llms.txt`/`.aiignore` | LLM context map / ignore patterns |
| Instruction | `.claude/rules/nextjs-async-apis.md` | Glob-scoped async rules |
| Instruction | `.claude/rules/nextjs-cache-components.md` | Glob-scoped cache rules |
| Instruction | `docs/ai/index.md` | Routing index |
| Instruction | `docs/ai/*.md` (9 file: agent-behavior, prompt-playbook, mcp-runtime, memory-layer, context-system-overview, context-maintenance, agent-command-policy, golden-examples, common-mistakes) | Behavior/routing/runtime/memory/maintenance |
| Instruction | `docs/ai/task-routes/*.md` (5 file: r0-ui, r1-feature, r2-supabase, review-fix, spike) | Context budgets theo risk |
| Instruction | `docs/conventions/*` (8 file) | Canonical engineering rules |
| Instruction | `docs/architecture/*.md` (overview, project-graph) | Boundaries + blast radius |
| Instruction | `docs/quality-gates.md` | Verification command ownership |
| Instruction | `docs/ai/MEMORY.md` | Long-term settled facts |
| Recipe | `.agents/workflows/review-gate.md` | Self-review + static rule inventory |
| Recipe | `.agents/skills/*/SKILL.md` (5: server-action, supabase-migration, tanstack-query-hook, zustand-store, testing-template) | Reusable procedures |
| Recipe | `.agents/evals/*.md` (7) | Regression scenarios |
| Enforcement | `scripts/ai-context.manifest.json` | Required files/wrappers/frontmatter |
| Enforcement | `scripts/check-ai-context.mjs` | Context integrity gate |
| Enforcement | `scripts/{review-gate-rules,check-review-gate-rules,check-secrets,run-ai-evals,frontmatter}.mjs` | Static rules + secrets + eval runner |
| Enforcement | `scripts/ai-review-rule-allowlist.json` | Rule allowlist |
| Enforcement | `.github/workflows/ci.yml` | CI: ai:check + ai:eval + code gates |
