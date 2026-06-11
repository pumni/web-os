# KẾ HOẠCH — Hệ thống AI Context cho web-os

> **Người lập:** Claude (đã đọc trực tiếp repo nguồn `D:\Dev\WTE-mobile` + khảo sát cấu trúc thật `web-os`)
> **Người thực thi:** AI khác (executor)
> **Người nghiệm thu:** Claude
> **Nguồn tham chiếu (READ-ONLY, KHÔNG sửa):** `D:\Dev\WTE-mobile` — hệ thống AI Context gốc (React Native). Đây là nơi **copy/đối chiếu**, không phải nơi chỉnh sửa.
> **Tiền đề:** web-os đã có `docs/conventions/*`, `docs/architecture/overview.md`, `docs/quality-gates.md`, 4 gate (`lint/typecheck/test/build` qua turbo), `apps/web/AGENTS.md` (cảnh báo Next v16). KHÔNG có `scripts/`, `.aiignore`, `llms.txt`, root `AGENTS.md`, `.agents/`.

---

## 0. Ground rules (áp dụng MỌI task)

- **web-os là MONOREPO.** Mọi path scan/manifest phải tính theo cấu trúc thật (đã xác minh):
  - App: `apps/web/src/{app,components,features,lib,stores,test}`
  - Packages: `packages/{auth,config,env,features,supabase,test-utils,ui,validators}`
  - DB: `supabase/migrations/` (CÓ), `supabase/functions/` (**KHÔNG tồn tại** → bỏ mọi rule Edge Function)
  - i18n/locales: **KHÔNG tồn tại** → bỏ mọi rule i18n
- **Đây KHÔNG phải copy nguyên xi WTE.** Repo nguồn là React Native; web-os là Next.js 16. Mỗi task đánh dấu rõ:
  - 🟢 **COPY** — port gần như nguyên văn (logic web-agnostic).
  - 🟡 **DỊCH TAY** — phải sửa logic/path cho web/Next/monorepo. Sai ở đây = false-positive tràn lan.
  - 🔴 **BỎ** — RN-only, không tạo.
- **KHÔNG mass-rename docs hiện có.** web-os đã có `docs/conventions/*` + `docs/architecture/*` đóng vai trò P2 tốt. Plan **giữ nguyên tên file đó** và trỏ manifest/index vào chúng — KHÔNG bê cấu trúc `docs/ai/*` của WTE sang.
- Sau mỗi task chạy đủ gate, **xanh mới sang task kế**. Gate mới của hệ thống này: `bun run ai:check` và (từ Tier B3) `bun run ai:eval`. Gate cũ vẫn phải xanh: `bun run lint · typecheck · test · build`.
- Commit riêng từng task, message tiếng Anh (`chore(ai):`, `feat(ai):`, `build(ai):`).
- **Tier A** → làm trên `main`. **Tier B/C** → mỗi task một feature branch riêng.
- Gate fail → **DỪNG, báo cáo**, không "sửa vòng quanh".
- Chỉ stage đúng phạm vi task; KHÔNG gộp working-tree có sẵn (`next.config.ts`, `theme-provider.tsx`, `PLAN_phase2.md`…).

## 0.1 ⛔ GUARDRAILS — bẫy đã xác minh khi đọc repo nguồn (vi phạm = sai)

1. **Frontmatter cần ĐỦ 2 field.** `check-ai-context.mjs` của WTE bắt buộc `description:` **và** `when-to-load:` (xem `WTE-mobile/scripts/check-ai-context.mjs:262-267`). Thiếu `when-to-load` = fail. Khi port script, giữ đúng yêu cầu này cho các doc canonical của web-os.
2. **`service-role` KHÔNG cấm toàn bộ ở web.** Ở RN cấm mọi nơi. Ở Next.js, service-role **hợp lệ phía server** (Server Action, route handler, `packages/*` server-only) và chỉ **cấm trong client bundle** (file có `"use client"` hoặc import từ `lib/supabase` browser client). Rule `service-role-client` phải DỊCH theo ranh giới này — đã có sẵn quy ước tại `docs/conventions/supabase-security.md §Client Keys`.
3. **Scan roots hardcode của WTE là `src` + `supabase/functions`** (`check-review-gate-rules.mjs:19-21`). web-os phải đổi thành `apps/web/src`, `packages/*/src`, `supabase/migrations`. Quên đổi = script không quét gì cả (false "pass").
4. **Regex golden-example hardcode prefix `app|src|supabase`** (`check-ai-context.mjs:160`). Nếu web-os tạo `golden-examples`, phải đổi prefix sang `apps/web/src|packages`.
5. **Route file ở web KHÁC RN.** "Route file" của web-os = `apps/web/src/app/**/{page,layout,route,loading,error}.tsx|ts`, KHÔNG phải Expo Router. Rule `route-business-logic` dịch theo đó.
6. **Giữ `apps/web/AGENTS.md` hiện tại** (cảnh báo Next v16) như **scoped rule** — root `AGENTS.md` mới KHÔNG được nuốt/ghi đè nó. Hai file song song, root trỏ xuống.
7. **Biến môi trường web là `NEXT_PUBLIC_*`** (không phải `EXPO_PUBLIC_*`). Quy ước env đi qua `packages/env`. Rule env (nếu làm) dịch theo đó.

## 0.2 Thứ tự thực hiện & phụ thuộc (ĐÃ CHỐT)

```
A1 → A2 → A3 → B1 → B2 → B3 → (C tùy chọn, theo nhu cầu)
```

- **Tier A trước B**: phải có file đích (AGENTS.md, index, .aiignore, llms.txt) thì `ai:check` ở B1 mới có thứ để verify.
- **B1 (ai:check) trước B2/B3**: B1 là khung verify; B2 (secrets) được B1 gọi tích hợp; B3 (review-gate static) là gate nặng nhất, làm cuối.
- **Tier C chỉ làm khi có nhu cầu thật** (thấy executor lặp sai một pattern) — KHÔNG bắt buộc để hệ thống hoạt động.

---

## TIER A — Entry & Routing layer (branch `main`)

### Task A1 — Root `AGENTS.md` + thin wrappers 🟡 DỊCH TAY

**Đọc trước:** `WTE-mobile/AGENTS.md` (khuôn), `docs/conventions/supabase-security.md`, `docs/quality-gates.md`, `apps/web/AGENTS.md`.

**Việc:**
1. Tạo `AGENTS.md` ở **gốc repo** (`D:\Dev\web-os\AGENTS.md`), bám khuôn WTE nhưng dịch sang web-os:
   - `<SECURITY_MANDATES>`: không bypass RLS; **service-role/secret key chỉ server-side, cấm trong client bundle**; browser chỉ dùng publishable key (`NEXT_PUBLIC_*`). Trích từ `docs/conventions/supabase-security.md`.
   - **Untrusted Content Policy**: copy nguyên (web-agnostic).
   - **Priority Stack P0–P6** dịch path:
     - P1 Enforced Config: `package.json`, `turbo.json`, `tsconfig*.json`, `apps/web/eslint.config.mjs`, `apps/web/vitest.config.ts`, CI.
     - P2 Architecture: `docs/architecture/overview.md` + `docs/conventions/*`.
     - P3 ADR: `docs/adr/` (nếu chưa có thì ghi "reserved" — KHÔNG bịa ADR).
   - **Execution Policy** + **Read Routing**: "Start with `docs/ai/index.md` (tạo ở A2), then load task-relevant files."
   - **Key Commands**: `bun run ai:check`, `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`, `bun run ai:eval` (B3).
   - **Response Format**: copy nguyên block `## Summary / ## Files changed / ## Validation run / ## Risks`.
   - Mục **Project**: nêu đúng stack web-os (Next.js 16, App Router, React Compiler, Supabase, TanStack Query, Zustand, bun, turbo, monorepo). KHÔNG dùng thuật ngữ RN (Outbox, Fasting Window…).
   - **Giữ kích thước < 6500 byte** (giới hạn `ai:check` ở B1).
2. Tạo thin wrapper gốc:
   - `CLAUDE.md` (gốc): nội dung `@AGENTS.md` (theo convention import của Claude). ≤ 1500 byte, có chuỗi `AGENTS.md`.
   - `GEMINI.md` (gốc): trỏ `AGENTS.md`. ≤ 1500 byte.
   - (Tùy chọn) `.github/copilot-instructions.md`: trỏ `AGENTS.md`.
3. **KHÔNG đụng** `apps/web/AGENTS.md` và `apps/web/CLAUDE.md` — giữ nguyên làm scoped rule; thêm 1 dòng trong root `AGENTS.md` ghi rõ "Next.js v16 scoped rules: see `apps/web/AGENTS.md`".

**Nghiệm thu:**
- Root `AGENTS.md` < 6500 byte, có đủ: SECURITY_MANDATES, Untrusted Content Policy, Priority Stack P0–P6, Response Format.
- Wrappers ≤ 1500 byte, đều chứa chuỗi `AGENTS.md`.
- 0 path bịa: mọi path nhắc trong AGENTS.md phải tồn tại thật (trừ `docs/ai/index.md` sẽ tạo ở A2 — A2 phải xong trước khi chạy B1).
- 4 gate cũ xanh.

---

### Task A2 — `docs/ai/index.md` + frontmatter cho doc canonical 🟡 DỊCH TAY

**Bối cảnh đã xác minh:** web-os đã có `docs/README.md` đóng vai trò gần giống index. Quyết định: **tạo `docs/ai/index.md`** (vì AGENTS.md + script port sẽ trỏ vào path này theo convention), và để `docs/README.md` trỏ tới nó.

**Đọc trước:** `WTE-mobile/docs/ai/index.md` (khuôn), `docs/README.md`, toàn bộ `docs/conventions/*`, `docs/architecture/overview.md`.

**Việc:**
1. Tạo `docs/ai/index.md` — bảng tra cứu nhu cầu → file, trỏ vào **file thật của web-os** (KHÔNG bịa `docs/ai/architecture.md` kiểu WTE):

   | Need | Source |
   |---|---|
   | Tool-agnostic rules | `AGENTS.md` |
   | Architecture & package boundaries | `docs/architecture/overview.md` |
   | Server/Client boundary | `docs/conventions/server-client-boundary.md` |
   | Data fetching (Server Comp / Query / Zustand) | `docs/conventions/data-fetching.md` |
   | Feature module layout | `docs/conventions/feature-module.md` |
   | Supabase / RLS / keys | `docs/conventions/supabase-security.md` |
   | Testing scope & commands | `docs/conventions/testing.md` |
   | Quality gates | `docs/quality-gates.md` |
   | Skills (nếu có) | `.agents/skills/*/SKILL.md` |
   | Task routes (nếu có) | `docs/ai/task-routes/*.md` |

2. Thêm YAML frontmatter (`description:` **và** `when-to-load:`) vào **các doc canonical** mà manifest B1 sẽ liệt kê:
   - `docs/architecture/overview.md`
   - `docs/conventions/server-client-boundary.md`, `data-fetching.md`, `feature-module.md`, `supabase-security.md`, `testing.md`
   - Nội dung `when-to-load` ngắn gọn (vd: "Load when touching Supabase migrations or RLS").
3. Cập nhật `docs/README.md`: thêm 1 dòng trỏ `docs/ai/index.md` là entry cho AI.

**Nghiệm thu:**
- `docs/ai/index.md` tồn tại, mọi path trong bảng đều tồn tại thật (chống link rot — sẽ bị B1 bắt).
- 6 doc canonical có frontmatter đủ 2 field, parse được.
- 4 gate cũ xanh.

---

### Task A3 — `.aiignore` + `llms.txt` 🟢 COPY (dịch path)

**Đọc trước:** `WTE-mobile/.aiignore`, `WTE-mobile/llms.txt`, `.gitignore` của web-os.

**Việc:**
1. Tạo `.aiignore` ở gốc. Pattern bắt buộc (dịch cho web, bỏ `.expo/` và `assets/` RN):
   ```
   .env
   .env*
   !.env.example
   .git/
   node_modules/
   .next/
   .turbo/
   dist/
   coverage/
   *.log
   ```
   (Danh sách `requiredAiIgnorePatterns` chính xác sẽ do manifest B1 định nghĩa — A3 và B1 phải khớp nhau.)
2. (Tùy chọn nhưng nên có) `.claudignore` / `.geminiignore` nếu muốn ignore riêng từng tool — hoặc bỏ nếu không cần.
3. Tạo `llms.txt` ở gốc — liệt kê path tuyệt đối tới các doc canonical theo thứ tự quan trọng (`/AGENTS.md`, `/docs/ai/index.md`, `/docs/architecture/overview.md`, `/docs/conventions/...`). **Mọi path phải tồn tại thật** (B1 sẽ verify từng dòng).

**Nghiệm thu:**
- `.aiignore` chứa đủ pattern; `.env` được ignore, `.env.example` được giữ.
- `llms.txt` 0 path chết.
- 4 gate cũ xanh.

---

## TIER B — Machine Verification (feature branch riêng mỗi task)

### Task B1 — `scripts/check-ai-context.mjs` + manifest + wire `ai:check` 🟡 DỊCH TAY (branch `feat/ai-check`)

**Đọc trước:** `WTE-mobile/scripts/check-ai-context.mjs` (toàn bộ), `WTE-mobile/scripts/ai-context.manifest.json`.

**Việc:**
1. Tạo `scripts/ai-context.manifest.json` cho web-os:
   - `requiredFiles`: **chỉ liệt kê file web-os thật sự có/sẽ có** — `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `llms.txt`, `.aiignore`, `docs/ai/index.md`, `docs/architecture/overview.md`, `docs/conventions/*` (5 file), `docs/quality-gates.md`. KHÔNG copy danh sách 54 file của WTE.
   - `thinWrappers`: `CLAUDE.md`, `GEMINI.md` (+ copilot nếu tạo) — `maxBytes: 1500`, `requiredText: ["AGENTS.md"]`.
   - `requiredPackageScripts`: `ai:check`, `lint`, `typecheck`, `test`, `build` (+ `ai:eval` sau B3). Dùng tên script THẬT của web-os (KHÔNG `lint:ci`/`test:ci` kiểu WTE).
   - `requiredAiIgnorePatterns`: khớp đúng A3.
   - `frontmatterRequired`: 6 doc canonical ở A2.
   - `skillValidation` / `evalValidation`: giữ schema gốc (chỉ dùng khi Tier C tạo skill/eval).
2. Port `check-ai-context.mjs`, DỊCH:
   - `ROOT` = gốc monorepo (script ở `scripts/`, `path.resolve(__dirname, '..')`).
   - Hàm `checkGoldenExamplePaths`: đổi regex prefix `^(app|src|supabase)\/` → `^(apps\/web\/src|packages|supabase)\/`. Nếu Tier C chưa tạo `golden-examples.md`, **bỏ hàm này hoặc cho phép vắng mặt** (đừng để fail vì file không tồn tại).
   - `checkContextIndexCoverage` + `checkTaskRoutes`: đổi danh sách `requiredReferences` sang path web-os thật (các `docs/conventions/*`, `docs/architecture/overview.md`). Nếu chưa có task-routes (Tier C), **bỏ `checkTaskRoutes`** hoặc cho phép thư mục trống.
   - Giữ nguyên (🟢): `checkRequiredFiles`, `checkFrontmatter` (2 field), `checkThinWrappers`, `checkMarkdownLinks`, `checkDocPathReferences`, `checkPackageScripts`, `checkAiIgnoreCoverage`, `checkLlmsTxt`, `checkEntrypointSizes`, `checkSecretsIntegration`, `checkSkillsStructure`, `checkEvalsStructure`.
   - `checkDocPathReferences`: đổi regex path-prefix từ `\.agents|\.claude|docs/ai|docs/adr` → thêm `docs/conventions|docs/architecture`.
3. Thêm script vào `package.json` gốc: `"ai:check": "node scripts/check-ai-context.mjs"`.
4. Wire vào turbo: thêm `ai:check` vào pipeline `turbo.json` và/hoặc gọi trong `lint` (tham khảo cách WTE gắn vào `lint:ci`). Quyết định tối thiểu: để `ai:check` là task độc lập + thêm vào CI (`.github/workflows/ci.yml` nếu đã tạo ở phase 2).

**Nghiệm thu:**
- `bun run ai:check` chạy **xanh** trên trạng thái sau Tier A.
- Cố tình làm hỏng 1 link trong `docs/ai/index.md` → `ai:check` **đỏ** đúng chỗ (chứng minh nó thật sự verify). Khôi phục lại.
- Cố xóa `when-to-load` của 1 doc → đỏ. Khôi phục.
- 4 gate cũ xanh.

---

### Task B2 — `scripts/check-secrets.mjs` 🟢 COPY (dịch path) (branch `feat/ai-secrets`)

**Đọc trước:** `WTE-mobile/scripts/check-secrets.mjs` (toàn bộ).

**Việc:**
1. Port `check-secrets.mjs`, DỊCH:
   - Scan roots theo monorepo: `apps/web/src`, `packages/*/src`, `supabase/`.
   - Pattern service-role: giữ `SUPABASE_SERVICE_ROLE_KEY`, `service_role`, `sb_secret_`… (web vẫn dùng Supabase).
   - Phát hiện `.env` committed: dùng quy ước web (`.env`, `.env.local`), giữ allow `.env.example`.
   - **Quan trọng (🟡):** nếu script gốc cấm service-role ở MỌI file `src/`, phải nới: chỉ cấm trong **client bundle** (file `"use client"` hoặc import browser supabase client), KHÔNG cấm ở server (`packages/*` server-only, Server Action, route handler). Nếu phân biệt này phức tạp, để check-secrets chỉ lo `.env` committed + hardcoded literal key, và để rule `service-role-client` (B3) lo phần ranh giới client/server.
2. Đảm bảo `check-ai-context.mjs` (B1) gọi được `check-secrets.mjs` qua `checkSecretsIntegration` (đã có sẵn trong port B1).

**Nghiệm thu:**
- `bun run ai:check` vẫn xanh (đã tích hợp secrets).
- Tạo file thử có literal service-role key → đỏ. Xóa file thử.
- 4 gate cũ xanh.

---

### Task B3 — `scripts/check-review-gate-rules.mjs` + `ai:eval` 🟡 DỊCH TAY (branch `feat/ai-review-static`)

**Đọc trước:** `WTE-mobile/scripts/check-review-gate-rules.mjs` (toàn bộ — 1250 dòng), `docs/conventions/data-fetching.md`, `docs/conventions/supabase-security.md`.

**Việc:** Port có CHỌN LỌC. Phân loại rule (đã quyết định khi đọc nguồn):

**🟢 Port gần thẳng (chỉ đổi scan roots + path):**
- `supabase-select-star`
- `swallowed-error` (đổi `API_SERVICE_PATTERN` sang path web: `packages/*/src/**/*.ts`, `apps/web/src/features/**/actions.ts`, `apps/web/src/lib/**`)
- `missing-auth-uid-policy` (quét `supabase/migrations/*.sql` + `supabase/seed.sql` thay vì `schema.sql` RN)
- `rpc-user-id-without-auth-check`
- `mutation-without-invalidation` (đổi scope sang `apps/web/src/features/**`)
- `query-result-in-zustand`
- `missing-loading-state`

**🟡 Port có DỊCH logic:**
- `service-role-client` → đổi tên ý niệm thành "service-role trong client bundle". Chỉ flag file có `"use client"` hoặc import từ browser supabase client (`apps/web/src/lib/supabase/*` client). KHÔNG flag server code. (Xem guardrail #2.)
- `route-business-logic` → "route file" = `apps/web/src/app/**/{page,layout,route}.{ts,tsx}`. Pattern cấm: gọi `supabase.from(`, `fetch('http`, định nghĩa `useMutation`. (Trong Next, data-fetch server-side trong Server Component page là HỢP LỆ — chỉ flag mutation/business logic, không flag `await supabase` đọc dữ liệu server. Cân nhắc nới rule cho phù hợp App Router; nếu mơ hồ, để severity thấp/cảnh báo.)
- `trusted-client-user-id-write` → chỉ áp client-side write; server action set user_id từ `auth.uid()` là hợp lệ.
- `direct-env-access` (tùy chọn) → đổi `process.env.EXPO_PUBLIC_*` → quy ước env web qua `packages/env`. Chỉ làm nếu `packages/env` có pattern truy cập tập trung rõ ràng; nếu không, BỎ.

**🔴 BỎ hẳn (RN-only / web-os không có):**
- `reanimated-non-worklet`, `skia-expensive-outside-memo`, `mmkv-sensitive-persist`
- `hardcoded-i18n-string`, `i18n-key-symmetry` (web-os chưa có locales)
- `edge-function-no-input-schema` (không có `supabase/functions/`)

**Hạ tầng giữ nguyên (🟢):** cơ chế `RULE_INFO`/severity (P0/B1/B2), allowlist JSON (`scripts/ai-review-rule-allowlist.json`, reason ≥ 12 ký tự), `--self-test`, `--paths`, `--strict`, `findBlockEnd`/`findMatchingParen`. **Cập nhật `runSelfTest`** để fixture + assert chỉ gồm các rule được giữ (đừng assert rule đã bỏ).

**Wire:**
1. `package.json`: `"ai:review:static": "node scripts/check-review-gate-rules.mjs"`.
2. Tạo `scripts/run-ai-evals.mjs` (port từ `WTE-mobile/scripts/run-ai-evals.mjs`) gọi: review-gate static + secrets check + (bỏ console-log scanner RN hoặc dịch sang quy ước logging web nếu có). `"ai:eval": "node scripts/run-ai-evals.mjs"`.
3. Thêm `ai:eval` vào `requiredPackageScripts` của manifest (B1) và vào CI.

**Nghiệm thu:**
- `node scripts/check-review-gate-rules.mjs --self-test` xanh (fixture chỉ gồm rule được giữ).
- `bun run ai:review:static` chạy trên codebase hiện tại — báo cáo trung thực (0 finding hoặc finding thật; KHÔNG được "pass" vì scan roots sai → kiểm chứng bằng cách thêm tạm 1 `.select('*')` ở `apps/web/src/features/` và xác nhận bị bắt, rồi gỡ).
- `bun run ai:eval` xanh.
- `bun run ai:check` xanh (đã thêm `ai:eval` vào required scripts).
- 4 gate cũ xanh.

---

## TIER C — Recipes (TÙY CHỌN, theo nhu cầu — branch riêng mỗi task)

> Chỉ làm khi quan sát thấy executor lặp sai một pattern cụ thể. KHÔNG bắt buộc để hệ thống chạy. Mọi skill/eval phải tuân `skillValidation`/`evalValidation` trong manifest (B1 sẽ tự verify).

### C1 — Skills (`.agents/skills/<name>/SKILL.md`) 🟡 DỊCH TAY
Ưu tiên port + dịch sang web/Next:
- `tanstack-query-hook` (đổi reference path sang `apps/web/src`, bỏ outbox/MMKV).
- `zustand-store` (chỉ client UI state — đúng `docs/conventions/data-fetching.md §Local State`).
- `supabase-migration` (RLS + grants + `search_path`, theo `docs/conventions/supabase-security.md`).
- `testing-template` (vitest + mock Supabase/Query, theo `docs/conventions/testing.md`).
- **BỎ:** `outbox-sync`, `realtime-sync`(trừ khi cần), `reanimated-animation`, `i18n-localization`.
Mỗi SKILL.md: frontmatter `name` + `description`, có `# <Title>`, `## Rules`, `## Checklist`.

### C2 — Evals (`.agents/evals/*.md`) 🟡 DỊCH TAY
Ưu tiên:
- `r2-supabase-rls-migration` 🟢 (copy gần thẳng — đã đối chiếu, hợp web-os).
- `r1-query-zustand-boundary`, `r1-mutation-missing-invalidation` 🟢.
- `prompt-injection-bug-report`, `prompt-injection-code-comment` 🟢 (web-agnostic).
- **BỎ:** `r1-reanimated-old-pattern`, `r1-outbox-broad-payload`, `r1-i18n-missing-key`, `r2-edge-function-service-role-leak` (không có Edge Functions).
Mỗi eval: frontmatter `name`/`category`/`description`, có `## Scenario Goal`, `## Mock Input Prompt`, `## Evaluation Criteria`.

### C3 — Task routes (`docs/ai/task-routes/*.md`) + Context Budget 🟡 DỊCH TAY
Chỉ khi cần kỷ luật chống over-reading. Tạo `r0-ui`, `r1-feature`, `r2-supabase`, `review-fix` — mỗi file < 4000 byte, có `## Context Budget`, trỏ vào doc web-os thật. Nếu tạo, **bật lại `checkTaskRoutes`** trong B1 và thêm reference vào `docs/ai/index.md`.

---

## NGHIỆM THU TỔNG (Claude tự chạy)

| Gate | Lệnh | Pass khi |
|---|---|---|
| AI context | `bun run ai:check` | xanh; cố tình hỏng 1 link/frontmatter → đỏ đúng chỗ |
| AI eval | `bun run ai:eval` | xanh; self-test review-gate xanh |
| Types | `bun run typecheck` | xanh toàn repo |
| Lint | `bun run lint` | không lỗi mới |
| Test | `bun run test` | xanh (vitest) |
| Build | `bun run build` | thành công |
| Guardrails | grep | manifest KHÔNG còn path WTE (`docs/ai/architecture.md`, `EXPO_PUBLIC_`, `supabase/functions`, `.expo/`, `MMKV`, `reanimated`); scan roots = `apps/web/src`/`packages`/`supabase/migrations` |
| Phạm vi | `git diff --name-only` | đúng file/branch của task; KHÔNG gộp working-tree phase 2 |

---

## Phụ lục — Đã cố ý LOẠI khỏi kế hoạch này

- Mọi thứ RN-only: Reanimated, Skia, MMKV, outbox-sync, FlashList, Expo Router skill/eval.
- i18n rules/skill/eval (web-os chưa đa ngôn ngữ — mở lại khi thêm locales).
- Edge Function rules/skill/eval (chưa có `supabase/functions/`).
- `logging-architecture.md` 22KB của WTE (RN-specific; phase 2 đã hoãn Sentry).
- Mass-rename `docs/conventions/*` → `docs/ai/*` (giữ nguyên P2 đang tốt).
- Slash commands `.claude/commands/*` (tùy chọn, làm sau nếu muốn).
