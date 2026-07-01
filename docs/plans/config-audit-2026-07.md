# Config Audit — Toàn bộ cấu hình monorepo (2026-07-02)

Audit toàn bộ cấu hình dự án so với default + best practice của đúng phiên bản
đang khóa: **Next.js 16.2.9**, **Turborepo 2.10.0**, Bun 1.3.14, TypeScript 6.0.3,
Tailwind CSS v4.3.x, ESLint 9, Vitest 4.1.9, React 19.2.7.

- **Phạm vi:** `package.json` (root + workspaces), `turbo.json`, `tsconfig*.json`,
  `apps/web/next.config.ts`, ESLint flat config, PostCSS/Tailwind, Prettier,
  `bunfig.toml`, `.gitattributes`, `vitest.config.ts`, `playwright.config.ts`,
  `.github/workflows/ci.yml`, cấu hình 8 packages nội bộ, `apps/catalog` (Storybook).
- **Phương pháp:** đọc trực tiếp từng file cấu hình; đối chiếu flag experimental
  với `config-schema.js` của đúng bản Next 16.2.9 trong `node_modules`
  (không dựa vào kiến thức training); xác minh phiên bản khóa trong `bun.lock`;
  tra cứu phiên bản phát hành mới nhất tại thời điểm audit.
- **Kết luận nhanh:** nền cấu hình rất tốt, đúng chuẩn Next 16 / Tailwind v4 /
  Bun catalog. Có **1 lỗi thật (F1)**, **3 vấn đề cache-correctness / CI (F2–F4)**,
  và một số điểm nên tinh chỉnh (C1–C5).

---

## 1. Trạng thái phiên bản (tại 2026-07-02)

| Thành phần | Đang khóa | Mới nhất (line hiện hành) | Đánh giá |
|---|---|---|---|
| Next.js | `16.2.9` (pin exact) | 16.2.9 là patch mới nhất của dòng 16.2; dòng 16.3 đã được công bố (persistent build cache, Rust React Compiler) | ✅ Cập nhật |
| Turborepo | `2.10.0` (pin exact) | **2.10.2** (~2026-07-01; fix `turbo watch` graceful shutdown + tôn trọng task `inputs`) | 🟡 Behind 2 patch — nên bump (liên quan trực tiếp F3) |
| TypeScript | `^6` → 6.0.3 | Dòng TS 6 hiện hành | ✅ |
| React / react-dom | `19.2.7` (pin exact) | Dòng 19.2 hiện hành | ✅ |
| Tailwind CSS | `^4.3.2` → 4.3.2 | Dòng v4 hiện hành | ✅ |
| Vitest | `^4.1.9` → 4.1.9 | Dòng v4 hiện hành | ✅ |
| Bun | `packageManager: bun@1.3.14`, engines `>=1.3` | 1.3.x | ✅ |
| Node engines | `>=22` (`@types/node: ^22`) | Node 22 vẫn LTS; Node 24 đã LTS nếu muốn nâng baseline sau | ✅ (C5) |

Nguồn: nextjs.org/blog/next-16-2, github.com/vercel/next.js/releases,
npmjs.com/package/turbo, github.com/vercel/turborepo/releases.

---

## 2. Những cấu hình đã đạt chuẩn (giữ nguyên)

### 2.1 `apps/web/next.config.ts`

- `cacheComponents: true`, `reactCompiler: true`, `typedRoutes: true` — đúng
  hướng khuyến nghị Next 16 (PPR + React Compiler monorepo-wide).
- `output: 'standalone'`, `poweredByHeader: false` — chuẩn production.
- **Cả 5 flag experimental đều hợp lệ với 16.2.9** — đã verify tồn tại trong
  `node_modules/next/dist/server/config-schema.js` của đúng bản cài:
  `inlineCss`, `viewTransition`, `scrollRestoration`, `globalNotFound`,
  và `logging.browserToTerminal`. Không có flag chết.
- `optimizePackageImports` chỉ liệt kê package **ngoài** default list của Next
  (`@vidstack/react`, `@dnd-kit/*`, `radix-ui`, `motion`) — comment trong file
  ghi đúng rằng `lucide-react` đã nằm trong default list nên không lặp lại.
- `serverExternalPackages: ['@supabase/supabase-js']` — đúng cho package có
  native/Node-only dependency.
- **Security headers vượt chuẩn trung bình:** CSP đầy đủ theo môi trường
  (`'unsafe-eval'` + dev origins chỉ bật ở development), HSTS preload,
  `frame-ancestors 'none'`, Permissions-Policy, nosniff, Referrer-Policy.
  Comment giải thích vì sao **không** dùng CSP nonce (nonce ép dynamic
  rendering per-request, phá static shell của `cacheComponents`/PPR) — chính xác.
- Không dùng `next/image` với host ngoài (đã grep: 0 import `next/image`) →
  không cần `images.remotePatterns`. Nếu sau này dùng `next/image` cho
  Supabase Storage/ytimg thì phải thêm.

### 2.2 ESLint (`apps/web/eslint.config.mjs`, `packages/ui`)

- Flat config ESLint 9 với `defineConfig` + `globalIgnores` — đúng API hiện hành.
- `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` —
  đúng preset mặc định Next 16 (import trực tiếp từ subpath, không qua
  `FlatCompat`).
- Custom rules (token-first, surface, timing, z-index, feature boundary) tách
  vào `@pumni/config/eslint` — sạch, tái sử dụng được. *(Nhưng xem F3 —
  Turbo không hash file này khi cache task `lint`.)*

### 2.3 TypeScript

- `tsconfig.base.json`: `strict` + `noUncheckedIndexedAccess` +
  `exactOptionalPropertyTypes` + `noImplicitOverride` +
  `noFallthroughCasesInSwitch` — trên mức chuẩn.
- `module: ESNext` + `moduleResolution: Bundler` — đúng khuyến nghị cho code
  được bundler (Next/Vite) xử lý.
- `apps/web/tsconfig.json` relax `exactOptionalPropertyTypes: false` **có
  comment lý do** (generated route types của Next chưa clean) và chỉ relax
  app-local — đúng cách xử lý drift.
- Include `.next/types/**/*.ts` — đúng cho typegen Next 16.

### 2.4 Bun monorepo + catalog

- `workspaces.catalog` khóa version tập trung — đúng chuẩn Bun 1.3; mọi
  workspace dùng `"catalog:"` nhất quán, không có version lệch catalog.
- `bunfig.toml`: `exact = true` (pin exact khi add mới) — tốt.
  `frozenLockfile = false` cho local là hợp lý vì CI đã dùng
  `bun install --frozen-lockfile` tường minh.
- `preinstall: bunx only-allow bun` + `engines` + `packageManager` pin —
  chống lệch package manager.
- `trustedDependencies: ["sharp", "unrs-resolver"]` trong `apps/web` — đúng cơ
  chế Bun cho postinstall scripts.

### 2.5 Packages nội bộ (8 package)

Tất cả đều theo pattern **just-in-time package** (Turborepo khuyến nghị cho
internal packages — consumer tự compile TS):

- `"type": "module"`, `"private": true`, `"sideEffects": false` (tree-shake được).
- `exports` map trỏ thẳng `./src/*.ts`; `@pumni/ui` export theo nhóm
  (`./form`, `./overlay`, …) thay vì một barrel to — tốt cho tree-shaking.
- `next`/`react` là **peerDependencies** (không bị double-instance React).
- `server-only` đặt đúng chỗ: `@pumni/env` (`./server`), `@pumni/supabase`
  (`./server`, `./service-role`), `@pumni/auth` — khớp P0 SECURITY_MANDATES.
- Mỗi package có `tsconfig.json` extends base + script `typecheck` riêng.

### 2.6 UI stack (Tailwind v4 + design system)

- `postcss.config.mjs` chỉ có `@tailwindcss/postcss` — **đúng default Tailwind
  v4 cho Next.js** (không cần `autoprefixer`/`postcss-import` nữa).
- `apps/catalog` (Storybook 10 + react-vite) dùng `@tailwindcss/vite` — đúng
  default cho Vite.
- Prettier: `prettier-plugin-tailwindcss` + `tailwindStylesheet` trỏ
  `apps/web/src/app/globals.css` — **bắt buộc** cho v4 (CSS-first config,
  không còn `tailwind.config.js`) và đã cấu hình đúng.
- `tailwind-lint` chạy trong `ai:check` với cùng stylesheet — gate token drift.
- Stack: `radix-ui` (unified package) + `cva` + `tailwind-merge` + `clsx` +
  `motion` v12 + `sonner` + `next-themes` + `tw-animate-css` — hiện đại,
  nhất quán shadcn-style.

### 2.7 Repo hygiene

- `.gitattributes` ép LF toàn repo + binary rules — có comment lý do (chống
  false drift của generated docs trên Windows). Tốt.
- `.vscode/settings.json` codeActionsOnSave fixAll.eslint — ổn.
- Prettier config đầy đủ, `endOfLine: "lf"` khớp `.gitattributes`.

---

## 3. Lỗi cần sửa (Findings)

### F1 — Root `tsconfig.json` tham chiếu `packages/workflows` không tồn tại 🔴

**File:** `tsconfig.json:32-34`

```json
{ "path": "./packages/workflows" }
```

- `packages/` chỉ có: `auth`, `config`, `env`, `features`, `supabase`,
  `test-utils`, `ui`, `validators`. **Không có `workflows`.**
- Hệ quả: bất kỳ ai (người hoặc tool) chạy `tsc --build` từ root sẽ fail ngay
  với lỗi missing project.
- Vấn đề nền rộng hơn: khối `references` này **không hoạt động như TS project
  references thật** — không tsconfig con nào bật `composite: true`
  (điều kiện bắt buộc của project references). Typecheck thực tế chạy
  per-package (`bun --bun tsc --noEmit`) qua Turbo nên lỗi bị che hoàn toàn.

**Fix (chọn 1):**
1. *Tối thiểu:* xóa entry `./packages/workflows`.
2. *Sạch hơn (khuyến nghị):* xóa luôn khối `references` vì không dùng
   `tsc -b`; root tsconfig chỉ cần `extends` + `files: []` cho editor.
3. *Nếu muốn dùng project references thật:* thêm `composite: true`,
   `declaration: true` vào từng package — **không khuyến nghị**, vì mô hình
   just-in-time hiện tại không cần emit.

### F2 — `turbo.json`: `build.outputs` cache cả `.next/cache` 🔴

**File:** `turbo.json:11`

```json
"outputs": [".next/**", "dist/**"]
```

- Khuyến nghị chính thức của Turborepo cho Next.js là **loại trừ** thư mục
  cache nội bộ của bundler khỏi artifact:

```json
"outputs": [".next/**", "!.next/cache/**", "dist/**"]
```

- Hệ quả hiện tại: artifact Turbo phình to (`.next/cache` chứa incremental
  cache của Turbopack, có thể hàng trăm MB), thời gian pack/restore tăng,
  và việc restore `.next/cache` từ Turbo cache là vô nghĩa vì Next có cơ chế
  cache riêng theo đường dẫn (CI đã cache `apps/web/.next/cache` riêng —
  xem F4).

### F3 — Cache task `lint` có thể trả kết quả stale (cache-correctness) 🔴

**File:** `turbo.json:19-22`

```json
"lint": {
  "dependsOn": ["^lint"],
  "inputs": ["src/**/*.{ts,tsx,js,mjs}", "eslint.config.mjs", "tsconfig.json"]
}
```

Chuỗi vấn đề:

1. `apps/web/eslint.config.mjs` và `packages/ui/eslint.config.mjs` import
   toàn bộ rule guard (token/surface/timing/z-index/feature-boundary) từ
   `@pumni/config/eslint` (`packages/config/eslint.mjs`).
2. `packages/config` **không có task `lint`** → `dependsOn: ["^lint"]`
   không kéo được gì từ nó (Turbo bỏ qua package thiếu task).
3. `inputs` chỉ hash file trong chính package đang lint.

→ **Sửa `packages/config/eslint.mjs` sẽ KHÔNG invalidate cache lint của
`web`/`ui`** — `turbo lint` trả kết quả cũ (cache hit xanh giả) cho tới khi
file trong `src/**` tình cờ đổi. Đây là lỗ hổng gate thật vì `ai:premerge`
và CI đều đi qua `turbo lint`.

**Fix:** dùng `$TURBO_ROOT$` (hỗ trợ từ Turbo 2.5) để hash file config chung:

```json
"lint": {
  "dependsOn": ["^lint"],
  "inputs": [
    "src/**/*.{ts,tsx,js,mjs}",
    "eslint.config.mjs",
    "tsconfig.json",
    "$TURBO_ROOT$/packages/config/eslint.mjs",
    "$TURBO_ROOT$/packages/config/src/**"
  ]
}
```

Vấn đề phụ cùng nhóm (mức nhẹ):

- `lint` chạy `eslint .` (lint cả `next.config.ts`, `playwright.config.ts`,
  `e2e/**`, `scripts/**`) nhưng inputs chỉ hash `src/**` + 2 file — sửa các
  file ngoài `src/` không bust cache lint.
- `typecheck` inputs (`turbo.json:25`) thiếu `next.config.ts`, `next-env.d.ts`
  trong khi tsconfig của web include chúng.
- `test` inputs (`turbo.json:29`) không hash `src/test/setup.ts`? — có, nằm
  trong `src/**/*.{ts,tsx}` — OK; nhưng thiếu `vitest.config.ts` của package
  khác khi `^test` không tồn tại ở package đó (hiện `ui` có test task nên ổn).

Khuyến nghị chung: sau khi vá inputs, bump Turbo lên **2.10.2** (patch có fix
liên quan việc tôn trọng task `inputs` trong watch mode).

### F4 — CI restore `.next/cache` nhưng không có bước build; e2e không chạy 🟠

**File:** `.github/workflows/ci.yml`

1. **Dead cache path / thiếu build gate:** bước `actions/cache` khai báo
   `apps/web/.next/cache` (dòng 29) nhưng workflow chỉ chạy
   `ai:check → lint → typecheck → test → ai:eval`. **Không có `bun run build`.**
   - `apps/web/.next/cache` không bao giờ được tạo/ghi → cache path chết.
   - Quan trọng hơn: các lớp lỗi **chỉ lộ khi `next build`** không được CI gác:
     typegen + typed routes drift, vi phạm Suspense boundary của
     `cacheComponents`, lỗi standalone output, lỗi chỉ xuất hiện ở production
     compile của React Compiler. Hiện chỉ được gác local qua `ai:premerge`
     (chạy tay, không cưỡng chế).
   - **Fix:** thêm step `- name: Build` / `run: bun run build` (Turbo cache +
     `.next/cache` lúc đó mới phát huy). Lưu ý cần cung cấp env
     `NEXT_PUBLIC_*` build-time (đã khai báo trong `turbo.json > build.env`) —
     dùng repo secrets/vars hoặc giá trị placeholder cho CI.
2. **Playwright không có job:** `playwright.config.ts` đã viết sẵn nhánh CI
   (`forbidOnly`, `retries: 2`, `workers: 1`) nhưng không workflow nào chạy
   e2e. Hoặc thêm job e2e (cần `bunx playwright install --with-deps chromium`
   + build/start app), hoặc ghi rõ trong `docs/quality-gates.md` rằng e2e là
   local-only có chủ đích để tránh hiểu nhầm gate.
3. *(Nhẹ)* Cache key hash `**/*.{ts,tsx,js,jsx,css}` toàn repo — mỗi commit đổi
   code là một key mới, fallback qua `restore-keys` vẫn hoạt động nên chấp
   nhận được; có thể đơn giản hóa còn `hashFiles('bun.lock')` + restore-keys.

---

## 4. Nên cân nhắc (không phải lỗi)

### C1 — `apps/catalog` (Storybook) nằm ngoài pipeline Turbo 🟡

- Scripts đặt tên `catalog:dev|build|lint|typecheck` và `turbo.json` không
  định nghĩa các task này → Storybook không được Turbo graph/cache; chạy
  qua `bun --filter=catalog` ở root.
- Nếu là **chủ đích** (tách Storybook khỏi `turbo dev` mặc định): giữ, nhưng
  nên ghi chú lý do vào `apps/catalog` docs/AGENTS.
- Nếu muốn nhất quán + cache: đổi script về tên chuẩn (`dev`, `build`, `lint`,
  `typecheck`), thêm outputs `storybook-static/**` cho build, và chấp nhận
  catalog xuất hiện trong `turbo dev` (hoặc dùng `--filter` khi dev web).

### C2 — Root devDependency `"catalog": "workspace:*"` 🟡

**File:** `package.json:87`. Không cần thiết cho `bun --filter=catalog`
(filter hoạt động theo workspace graph, không cần root dep) và dễ gây nhầm
với protocol `catalog:` ngay bên cạnh. Khuyến nghị: bỏ.

### C3 — `tsconfig.base.json` có thể nâng thêm 2 option chuẩn mới 🟡

- `"verbatimModuleSyntax": true` — thay thế mạnh hơn cho semantics của
  `isolatedModules` với codebase ESM thuần: ép `import type` tường minh,
  loại lỗi elision khi transpile per-file (Bun/SWC/oxc). Cần một lượt sửa
  `import type` khi bật — làm khi rảnh, không gấp.
- `"moduleDetection": "force"` — mọi file là module, tránh file không có
  import/export bị coi là script global.
- `"forceConsistentCasingInFileNames"` đã là default `true` từ TS 5 — dòng
  này thừa (vô hại, có thể xóa cho gọn).

### C4 — Vitest `globals: true` nhưng tsconfig không khai `vitest/globals` 🟡

**File:** `apps/web/vitest.config.ts:12` và `apps/web/tsconfig.json:17`
(`"types": ["node"]`).

- Typecheck đang xanh ⇒ test files import tường minh từ `vitest`; `globals`
  hiện chỉ còn phục vụ auto-cleanup của `@testing-library/react` (cần
  `afterEach` global lúc runtime).
- Hợp lệ, nhưng nên chốt 1 trong 2 cho nhất quán: (a) thêm
  `"vitest/globals"` vào `types` và cho phép dùng globals trong test, hoặc
  (b) giữ nguyên và ghi comment trong vitest.config lý do bật `globals`
  (chỉ vì RTL cleanup).

### C5 — Baseline Node/@types 🟢

`engines.node >= 22` + `@types/node ^22` nhất quán. Node 24 đã LTS nếu về
sau muốn nâng; không có lý do phải làm ngay (Next 16 yêu cầu ≥ 20.9).

---

## 5. Bảng ưu tiên hành động

| # | Việc | File | Effort | Rủi ro nếu bỏ qua |
|---|---|---|---|---|
| 1 | Xóa reference `packages/workflows` (hoặc cả khối `references`) | `tsconfig.json` | 1 phút | `tsc -b` root fail; config nói dối về cấu trúc repo |
| 2 | Thêm `"!.next/cache/**"` vào `build.outputs` | `turbo.json` | 1 phút | Artifact cache phình to, pack/restore chậm |
| 3 | Vá `lint.inputs` bằng `$TURBO_ROOT$/packages/config/...`; bổ sung inputs còn thiếu cho `lint`/`typecheck` | `turbo.json` | 10 phút | **Lint cache stale — gate xanh giả khi sửa rule guard** |
| 4 | Thêm step `bun run build` vào CI (kèm env build-time); quyết định số phận job e2e | `.github/workflows/ci.yml` | 30 phút | Lỗi build/typed-routes/PPR chỉ lộ khi deploy |
| 5 | Bump Turborepo `2.10.0 → 2.10.2` trong catalog | `package.json` | 5 phút + chạy gate | Thiếu fix watch-mode liên quan `inputs` |
| 6 | C1–C4 tùy chọn | — | tùy | Không rủi ro trực tiếp |

Sau mỗi thay đổi ở nhóm 1–5: chạy `bun run ai:check && bun run ai:eval` rồi
`bun run lint && bun run typecheck && bun run test && bun run build`
(đúng gate `ai:premerge`).

---

*Audit thực hiện ngày 2026-07-02. Đối chiếu flag Next bằng
`node_modules/next/dist/server/config-schema.js` (bản 16.2.9 đang cài);
phiên bản mới nhất tra cứu từ nextjs.org/blog, github releases của
vercel/next.js và vercel/turborepo, npmjs.com/package/turbo.*
