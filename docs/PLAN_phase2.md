# KẾ HOẠCH ĐỢT 2 — Kiến trúc & API mới (web-os)

> **Người lập:** Claude (đã thẩm định trực tiếp với `apps/web/node_modules/next/dist/docs/` — Next.js 16.2.9)
> **Người thực thi:** AI khác (executor)
> **Người nghiệm thu:** Claude
> **Tiền đề:** Đợt 1 đã nghiệm thu xanh (next.config, prettier, metadata, 3 package scaffold, React Compiler).

---

## 0. Ground rules (áp dụng MỌI task)

- **Đọc `node_modules/next/dist/docs/` trước khi viết code** (theo `apps/web/AGENTS.md`). Đây KHÔNG phải Next.js trong training data — có breaking changes.
- Sau mỗi task chạy đủ 4 gate, **xanh mới sang task kế**:
  - `bun run typecheck` · `bun run lint` · `bun run test` · `bun run build`
- **Dùng `bun run test`, KHÔNG dùng `bun test`** (Bun native runner sẽ nuốt Playwright e2e và báo lỗi giả). Gate thật là `vitest run` qua turbo.
- Commit riêng từng task, message tiếng Anh (`feat(...)`, `chore(...)`, `perf(...)`).
- **Tier A** → làm trên `main`. **Tier B/C** → mỗi task một **feature branch riêng**.
- Gate fail → **DỪNG, báo cáo**, không "sửa vòng quanh".
- Chỉ stage đúng phạm vi task; KHÔNG gộp các thay đổi working-tree có sẵn (`bun.lock`/`package.json` phần `bun-types`, `REPORT_*`).

## 0.1 ⛔ GUARDRAILS — bẫy v16 đã xác minh (vi phạm = sai)

1. `revalidateTag` ở v16 **bắt buộc tham số thứ 2** (cacheLife profile). Dạng 1 tham số = lỗi TypeScript. Ưu tiên `updateTag` cho read-your-writes.
2. `cacheLife` / `cacheTag` đã **stable** — KHÔNG dùng prefix `unstable_`.
3. `cacheComponents: true` **chỉ ở Task B1**, branch riêng, KHÔNG gộp với task khác (đổi mô hình prerendering toàn app).
4. KHÔNG tái xuất hiện config bịa từ các báo cáo gốc: `experimental.typedEnv` (không tồn tại), `staleTimes` top-level (phải nằm trong `experimental`).
5. `proxy` runtime là `nodejs`, **không** hỗ trợ `edge` — đừng thêm `runtime: 'edge'`.
6. Giữ `suppressHydrationWarning` trên `<html>` (đã có) khi thêm ThemeProvider.

## 0.2 Thứ tự thực hiện & phụ thuộc (ĐÃ CHỐT)

```
A1 → A2 → A3 → B3 → B2 → B1 → C1/C2/C3
```

- **A3 (CI) trước Tier B**: cần lưới an toàn bắt hồi quy trước khi đụng kiến trúc.
- **B3 (DAL) trước B2**: auth actions dùng chung `verifySession()`.
- **A2 trước B1**: cả hai đụng luồng profile — làm React Query mutation trước, rồi B1 đổi `revalidatePath`→`updateTag` sau, tránh xung đột.
- **B1 cuối Tier B**: rủi ro cao nhất.

---

## TIER A — Hoàn thiện & bảo vệ (branch `main`)

### Task A1 — Wire dark mode (next-themes)

**Bối cảnh đã xác minh:** `next-themes` chỉ được đọc trong `src/components/ui/sonner.tsx`; **KHÔNG có `ThemeProvider`** trong `layout.tsx`; trang `settings/appearance` đã tồn tại nhưng theme chưa thực sự áp/persist.

**Đọc trước:** `src/app/layout.tsx`, `src/app/(app)/settings/appearance/page.tsx`, `src/components/ui/sonner.tsx`, `src/app/globals.css`.

**Việc:**
1. Tạo `src/components/providers/theme-provider.tsx` (`"use client"`) bọc `next-themes` `ThemeProvider` với `attribute="class"`, `defaultTheme="system"`, `enableSystem`.
2. `layout.tsx`: bọc `<ThemeProvider>` **bên ngoài** `<QueryProvider>`. Giữ `suppressHydrationWarning` trên `<html>`.
3. Trang appearance: thêm toggle light / dark / system bằng `useTheme()`, tái dùng `Button` / `dropdown-menu` sẵn có.

**Nghiệm thu:**
- Đổi theme **persist qua reload**; không hydration warning ở console.
- `globals.css` có biến `.dark` (nếu thiếu → báo cáo, không tự chế biến màu).
- 4 gate xanh.

---

### Task A2 — TanStack Query: GIỮ + dùng thật

**Quyết định đã chốt:** Giữ `@tanstack/react-query`, nhưng phải có usage thật (hiện 0 `useQuery`/`useMutation`).

**Nguyên tắc ranh giới (bắt buộc):**
- React Query CHỈ dùng cho **surface client-interactive thật** (mutation + optimistic, polling, infinite scroll).
- KHÔNG thay thế data fetching ở Server Component — `features/profile/queries.ts` vẫn fetch phía server.

**Đọc trước:** `src/components/providers/query-provider.tsx`, `src/features/profile/profile-form.tsx`, `src/features/profile/actions.ts`.

**Việc (tối thiểu):**
1. Trong `profile-form.tsx`, dùng `useMutation` gọi server action `updateProfile` → có pending/optimistic + toast (sonner) on success/error.
2. (Tùy chọn) thêm 1 `useQuery` cho 1 vùng dữ liệu client trên dashboard nếu có nhu cầu tự nhiên.

**Nghiệm thu:**
- Có ≥1 `useMutation` thật, hoạt động (cập nhật profile mượt, pending state đúng).
- Provider có lý do tồn tại; không còn dead-weight.
- 4 gate xanh.

---

### Task A3 — CI/CD GitHub Actions

**Bối cảnh:** chưa có `.github/workflows`.

**Việc:** tạo `.github/workflows/ci.yml`, trigger trên PR + push `main`:
`oven-sh/setup-bun` → `bun install --frozen-lockfile` → `bun run lint` → `bun run typecheck` → `bun run test` → `bun run build`.
(Node ≥ 20.9 do bun cung cấp; bật cache bun.)

**Nghiệm thu:** workflow chạy **xanh trên 1 PR thử**; các bước chạy đúng thứ tự; cache hoạt động.

---

## TIER B — Kiến trúc & API mới (feature branch riêng mỗi task)

### Task B3 — Data Access Layer `verifySession()` (branch `feat/dal`)

**Đọc trước:** `02-guides/authentication.md` (mục DAL), `02-guides/data-security.md`. Đọc code `packages/auth`.

**Việc:** trong `packages/auth`, thêm `verifySession()` (cached) làm nguồn auth-check duy nhất; refactor `requireUser` dùng nó; chuẩn bị để Server Actions (B2) gọi chung.

**Nghiệm thu:** mọi auth check đi qua DAL; redirect khi chưa đăng nhập không hồi quy; 4 gate xanh.

---

### Task B2 — Auth forms → Server Actions + `useActionState` (branch `feat/auth-server-actions`)

**Đọc trước:** `02-guides/forms.md`, `02-guides/authentication.md`, `03-api-reference/01-directives/use-server.md`.
**Đọc code:** `(public)/sign-in|sign-up|forgot-password|reset-password/page.tsx`, `auth/callback/route.ts`, `packages/validators`.

**Việc:** mỗi form:
- Server Action (`"use server"`): validate Zod **server-side** → `createSupabaseServerClient()` → `redirect()` **server-side**.
- Client: `<form action={...}>` native + `useActionState` (pending → disable nút; `state.errors` → hiển thị lỗi). Toast sonner nếu cần.

**Lưu ý:** đây là đánh đổi có chủ đích (progressive enhancement). **KHÔNG** gỡ react-hook-form khỏi repo — profile form vẫn dùng. Dùng `verifySession()` từ B3.

**Nghiệm thu:**
- Sign-in / sign-up / forgot / reset hoạt động **cả khi tắt JS**.
- Không còn `createSupabaseBrowserClient` trong các page auth; redirect là server-side.
- 4 gate xanh.

---

### Task B1 — Cache Components (`use cache`) ⚠️ branch `feat/cache-components` — CẦN NGƯỜI NGHIỆM THU DUYỆT TRƯỚC KHI BẮT ĐẦU

**Trạng thái đã xác minh (vì sao làm):** `cacheComponents` là **kiến trúc caching chuẩn mới, stable** của v16 (flag top-level, KHÔNG còn `experimental`). Nó **thay thế** `experimental.dynamicIO` + `experimental.useCache` (đã gỡ), và là **điều kiện bắt buộc** để dùng `use cache`/`cacheTag`/`cacheLife`. Khi bật, **PPR là mặc định** (static shell + streaming) và giữ state điều hướng qua React `<Activity>`.

**Cảnh báo:** opt-in + là **migration thật** ("dynamic by default" sau khi bật). Làm **từng bước nhỏ, build sau mỗi bước.**

**Đọc trước:** `03-api-reference/01-directives/use-cache.md`, `04-functions/cacheTag.md`, `04-functions/cacheLife.md`, `04-functions/updateTag.md`, `04-functions/revalidateTag.md`, `05-config/01-next-config-js/cacheComponents.md`, guide `migrating-to-cache-components.md`.

**Việc:**
1. Bật `cacheComponents: true` trong `next.config.ts`. Build NGAY để thấy điểm vỡ PPR (kỳ vọng) và xử lý theo guide.
2. `features/profile/queries.ts` (`getCurrentProfile`): thêm `"use cache"` + `cacheTag(\`profile:${userId}\`)` + `cacheLife(...)`.
3. `features/profile/actions.ts`: đổi `revalidatePath("/settings/profile")` → `updateTag(\`profile:${user.id}\`)` (read-your-writes). Nếu buộc dùng `revalidateTag` → **2 tham số**.
4. Phối hợp với A2: React Query phía client chỉ `invalidateQueries`/optimistic; KHÔNG tự gọi revalidate server.

**Nghiệm thu:**
- Build xanh **với PPR bật**.
- Cập nhật profile thấy ngay **không reload cứng**.
- Không còn `revalidatePath` cho luồng profile; 0 `unstable_`; `revalidateTag` (nếu có) đủ 2 tham số.
- 4 gate xanh.

---

## TIER C — Production hardening (branch riêng mỗi task)

### C1 — CSP headers (branch `feat/csp`)
Theo `02-guides/content-security-policy.md` (nonce-based, qua `proxy.ts` / `headers()`).
**Nghiệm thu:** header CSP xuất hiện; app không vỡ inline script/style.

### C2 — Rate limit auth (branch `feat/rate-limit`)
`@upstash/ratelimit` cho action đăng nhập/đăng ký (sau B2).
**Nghiệm thu:** vượt ngưỡng bị chặn; đường happy-path không ảnh hưởng.

### C3 — `next/image` cho avatar (branch `feat/next-image`)
Thêm `images.remotePatterns` (`**.supabase.co`) + đổi `<img>` → `<Image>` (avatar trong app-shell).
**Nghiệm thu:** avatar tối ưu, không lỗi domain; build xanh.

---

## NGHIỆM THU TỔNG (Claude tự chạy)

| Gate | Lệnh | Pass khi |
|---|---|---|
| Types | `bun run typecheck` | xanh toàn repo |
| Lint | `bun run lint` | không lỗi mới |
| **Test** | `bun run test` | 9/9 vitest, e2e loại đúng (KHÔNG `bun test`) |
| Build | `bun run build` | thành công (B1: với PPR) |
| Guardrails | grep | 0 hit: `unstable_`, `revalidateTag(` 1-arg, `typedEnv`, top-level `staleTimes`, `runtime: 'edge'` trong proxy |
| Phạm vi | `git diff --name-only` | đúng file/branch của task |

---

## Phụ lục — Đã cố ý LOẠI khỏi đợt 2 (chờ đợt sau / quyết định riêng)
- Drizzle ORM (đổi data-access layer — cần quyết định kiến trúc riêng).
- Sentry / analytics / feature flags / PWA / Storybook / Docker Compose.
