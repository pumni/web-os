# Kế hoạch nâng cấp Design System 2026 (Bento · Motion · Card states · Spotlight)

> **Trạng thái:** kế hoạch để một AI khác thực thi. Đây là tài liệu thiết kế, KHÔNG phải code đã chạy.
> **Nguồn:** chắt lọc từ báo cáo "Kiến Trúc Giao Diện UI Hiện Đại 2025–2026", đã loại bỏ phần hype (số liệu bịa, `@wrksz/themes`, server-first cookie theming, liquid-glass-khắp-nơi).
> **Phạm vi:** 4 hạng mục dưới đây. KHÔNG đụng hệ màu/theme, KHÔNG thêm token màu mới.

## 0. Ràng buộc bắt buộc (đọc trước khi sửa)

Các quy tắc này được enforce bằng ESLint (`pumniNoRawColor` trong `packages/config/eslint.mjs`) + test, vi phạm là CI đỏ. Trích từ `docs/conventions/design-system.md`:

1. **3-tier token:** primitive (`tokens.css`) → semantic (`theme.css`) → component-scoped. Component chỉ đọc semantic. Không `oklch(...)` thô, không `--indigo-*` trong TSX.
2. **No new color token.** Tái dùng `--primary`, `--success`, `--muted`… qua `color-mix` nếu cần sắc độ.
3. **No surface-token opacity:** cấm `bg-card/NN`, `bg-muted/NN`, `bg-background/NN`, `bg-popover/NN` (trừ hover-only `bg-muted/80`). Status tint chuẩn = `/10 fill + /20 border` của `destructive|warning|success|primary`.
4. **One border:** chỉ `border-border`. Xoá mọi `border-border/NN` (trừ status indicator dùng `/20`).
5. **No raw elevation shadow** (`shadow-lg/xl/2xl`). Content dùng `shadow-card`/`shadow-raised`; floating depth thuộc `glass-*`.
6. **Radius:** chỉ named utility (`rounded-md/lg/xl/2xl`, `rounded-full`). Cấm `rounded-[Npx]`.
7. **Glass chỉ ở floating layer.** Bento tile / content surface dùng `Card` opaque, KHÔNG glass (`backdrop-filter` nặng GPU).
8. **Motion JS không bị CSS reduced-motion tắt** → mọi `motion.*` phải gọi `useReducedMotion()` và tự degrade.
9. **Mọi sửa motion token phải đồng bộ 2 nơi:** `packages/ui/src/styles/tokens.css` ⇄ `packages/ui/src/lib/motion.ts`, nếu lệch thì `apps/web/src/test/design-system/motion-tokens.test.ts` fail.
10. `@pumni/ui` là package UI thuần: không import `@/`, `server-only`, supabase, auth, env, validators.

Sau khi xong toàn bộ: chạy `bun run ai:check`, `bun run lint`, `bun run typecheck`, `bun run test`. Visual regression: `cd apps/web && bunx playwright test design-system-visual` (baseline platform-specific — sinh ở CI Linux, không commit baseline Windows).

---

## 1. Motion token còn thiếu (LÀM TRƯỚC — nền tảng cho mục 3 & 4)

### Mục tiêu
Bổ sung 3 nấc motion mà báo cáo có còn dự án thiếu: duration dài cho chuyển trang, đường cong spring cho pop/shake, và stagger token hoá (đang là magic `0.04` inline).

### 1.1 `packages/ui/src/styles/tokens.css` — thêm vào block `--- Motion ---`
```css
--duration-slower: 480ms;   /* page / view-transition (report: ~500ms) */
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275); /* overshoot pop — modal/success/shake */
--stagger-base: 50ms;       /* token hoá cadence stagger (report: 50ms) */
```
> Giữ `--duration-fast/base/slow`, `--ease-out`, `--ease-in-out`, `--press-scale` nguyên trạng (đang dùng khắp nơi + bị test khoá).

### 1.2 `packages/ui/src/lib/motion.ts` — mirror đúng giá trị
- `duration`: thêm `slower: 0.48`.
- `easing`: thêm `spring: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number]`.
- Thêm hằng `export const staggerBase = 0.05;` và dùng nó thay magic `0.04` trong `recipes.staggerContainer` (`staggerChildren: staggerBase`). Cập nhật comment "Stagger cadence (`0.04`s)".
- Thêm vào `motionTokens` export: `staggerBase`.

### 1.3 `packages/ui/src/index.ts`
Thêm `staggerBase` vào dòng export từ `./lib/motion`.

### 1.4 `apps/web/src/test/design-system/motion-tokens.test.ts` — mở rộng guard
Thêm assertion để khoá 3 token mới (giữ guard "không drift"):
- `duration.slower` ⇄ `readDurationSeconds("--duration-slower")`.
- `easing.spring` ⇄ `readCubicBezier("--ease-spring")`.
- `staggerBase` ⇄ `readDurationSeconds("--stagger-base")` (50ms → 0.05). `import { staggerBase } from "@pumni/ui"`.

### Acceptance
- [ ] `bun run test` (motion-tokens) xanh.
- [ ] Không nấc cũ nào đổi giá trị.
- [ ] `--ease-spring` & `--duration-slower` xuất hiện được dùng ở mục 3/4.

---

## 2. Bento Grid — REFACTOR primitive đang vi phạm guardrail

> File hiện tại: `packages/ui/src/components/bento-grid.tsx`. **Đang vi phạm rule 3 (`bg-muted/40`), rule 4 (`border-border/10`), và hardcode `md:grid-cols-3`.** Đây là nâng cấp, không tạo mới. Giữ tên export `BentoGrid` / `BentoGridItem` (đã ở barrel).

### Mục tiêu
Lưới 12 cột toán học, tier ưu tiên theo diện tích (Hero/Feature/Metric/Accent), container-query để tile tự reflow, chống CLS, và tuân thủ guardrail.

### 2.1 `BentoGrid` (container)
- Đổi sang **CSS Grid 12 cột** responsive thay vì `md:grid-cols-3`:
  - Mobile (`<640px`): 1 cột (mọi tile full-width, xếp dọc — chống truncate).
  - Tablet (`≥640px`): 6 cột.
  - Desktop (`≥1024px`): `grid-cols-12`.
- Gap = `gap-4 lg:gap-6` (16→24px, đúng khoảng báo cáo 16–24px; đừng <8 hoặc >32).
- Bật container context cho tile con: thêm class `@container` (Tailwind v4 container query) hoặc `[container-type:inline-size]` ở **từng tile**, không ở grid cha (để mỗi tile đo riêng).
- API: `BentoGridProps extends React.ComponentProps<"div">`. Thêm prop tùy chọn `columns?: 6 | 12` (mặc định 12) nếu cần lưới nhỏ.

### 2.2 `BentoGridItem` (tile) — tier-based
Thay 2 prop chuỗi `colSpan`/`rowSpan` bằng API tier rõ ràng (vẫn cho override thủ công qua `className`):

```ts
type BentoTier = "hero" | "feature" | "metric" | "accent" | "full";
```
Map span theo bảng (dùng `cva`, named utility — KHÔNG raw px):

| `tier` | Desktop span (12-col) | Dùng cho |
| --- | --- | --- |
| `hero` | `lg:col-span-6 lg:row-span-2` | KPI chính (tối đa 2 hero/màn) |
| `feature` | `lg:col-span-4 lg:row-span-2` | Chart, sparkline, donut |
| `metric` | `lg:col-span-3` | KPI phụ, trạng thái |
| `accent` | `lg:col-span-2` | Quick action, CTA, shortcut |
| `full` | `lg:col-span-12` | Bảng mật độ cao, activity feed |
> Tablet (`sm:`): hero/feature → `sm:col-span-6` (full-width tablet, đúng breakpoint báo cáo 768px). Mobile: mặc định `col-span-1` (1 cột).

- **Surface:** giữ `Card` opaque (`variant="solid"`, `interactive` mặc định `true`). Radius đồng nhất `rounded-xl` (KHÔNG để tile to có radius khác — phá thẩm mỹ Bento).
- **Sửa vi phạm guardrail trong markup hiện tại:**
  - Header media well: `bg-muted/40` → **`bg-muted`** (opaque); `border-border/10` → **`border-border`** (hoặc bỏ border nếu thừa). Đây là "inset well" → đúng pattern `bg-muted border border-border`.
  - Giữ `bg-primary/10 text-primary` cho icon chip (đúng status-tint pattern, hợp lệ).
- **Chống CLS:** thêm prop `minHeight?: string` (mặc định set `min-h-[...]` qua named — nếu cần px thì đặt ở token/inline style, KHÔNG `rounded-[]`; min-height px là chấp nhận được vì không phải màu/radius). Khi `loading`, render `<Skeleton>` (đã có trong `@pumni/ui`) đúng kích thước tile.
- **Container query reflow:** ví dụ tile feature đổi layout dọc→ngang khi hẹp: dùng biến thể `@max-[28rem]:flex-col` / `@min-[28rem]:flex-row` trên nội dung (Tailwind v4 container variants), không media query viewport.

### 2.3 A11y (WCAG 2.2 — báo cáo nhấn mạnh, đúng)
- **DOM order = visual order:** không dùng `order-*`/grid-flow đảo thứ tự đọc; không `tabindex > 0`.
- Tile chứa số đơn lẻ (vd "142k") phải có `aria-label` mô tả đầy đủ → thêm prop `ariaLabel?: string` đặt lên `Card` container.
- Tile tương tác: focus ring qua `:focus-visible` (Card `interactive` đã có ring? kiểm tra — nếu chưa, thêm `focus-visible:ring-2 focus-visible:ring-ring`).
- Live data: cho phép truyền `aria-live="polite"` qua `...props`.

### 2.4 Showcase + visual regression
- Cập nhật `apps/web/src/app/design-system-preview` (showcase) thêm một section Bento 12-col đủ 4 tier để Playwright snapshot (`design-system-visual.spec.ts`). Đây là "visual contract".

### Acceptance
- [ ] Không còn `/40`, `/10`, `md:grid-cols-3` trong `bento-grid.tsx`.
- [ ] `bun run lint` (ESLint pumniNoRawColor) xanh.
- [ ] 4 tier render đúng span ở 3 breakpoint; mobile xếp 1 cột.
- [ ] Tile có `aria-label` khi chỉ chứa số; Tab order khớp DOM.

---

## 3. Card state machine (`state` prop)

> File: `packages/ui/src/components/card.tsx`. Phụ thuộc `--ease-spring` (mục 1).

### Mục tiêu
Thẻ phản hồi trạng thái dữ liệu (báo cáo: breathing khi load, shake khi lỗi, morph khi success) — token-hoá, không hardcode, tôn trọng reduced-motion.

### 3.1 API
Thêm vào `cardVariants` một chiều mới (giữ `variant`/`interactive`/`radius` nguyên):
```ts
state: { idle: "", loading: "...", error: "...", success: "..." }
```
- Đặt `data-state={state ?? "idle"}` lên Card (đồng bộ pattern `data-variant`).
- Mặc định `state: "idle"`.

### 3.2 Hành vi mỗi state (CSS-first, gate `motion-safe:`)
- **`loading` — breathing:** pulse opacity/độ sáng nhẹ. Dùng `motion-safe:animate-pulse` (Tailwind built-in) HOẶC một `@keyframes breathe` mới trong `glass.css`/một stylesheet component, duration `var(--duration-slower)`, lặp. Không đổi layout (chống CLS). Cân nhắc kèm `aria-busy="true"`.
- **`error` — shake:** keyframe `shake` (translateX ±4px, ~6 bước), `var(--duration-base)`, `var(--ease-spring)`, chạy 1 lần. Định nghĩa `@keyframes shake` trong stylesheet của package (KHÔNG inline style màu). Thêm border `border-destructive/20` (status-tint hợp lệ). Gate `motion-safe:` — reduced-motion chỉ đổi border, không rung.
- **`success`:** thoáng `border-success/20` + (tuỳ chọn) ring success mờ dần. Dùng `--ease-spring` cho cảm giác "morph". Không đổi kích thước.
- Mọi animation gate sau `@media (prefers-reduced-motion)` (đã có global safety net ở `glass.css` dòng 185 — keyframe mới tự động bị neutralize, nhưng vẫn thêm `motion-safe:` để rõ ý định).

### 3.3 Keyframes — đặt ở đâu
`@keyframes breathe`/`shake` thêm vào một file CSS trong `packages/ui/src/styles/` (vd cuối `glass.css` hoặc file mới `motion.css` import cùng chỗ). Duration/easing tham chiếu `var(--duration-*)`/`var(--ease-spring)` — KHÔNG số ms thô.

### 3.4 A11y
- `loading` → `aria-busy="true"`.
- `error`/`success` nên đi kèm message vùng `aria-live="polite"` (do consumer cung cấp; tài liệu hoá trong JSDoc của Card).

### Acceptance
- [ ] `data-state` render đúng; reduced-motion không rung/không pulse.
- [ ] Không màu thô; chỉ status-tint `/10`–`/20` hợp lệ.
- [ ] JSDoc mô tả 4 state + yêu cầu `aria-live` cho consumer.

---

## 4. Card `variant="spotlight"` (thay holographic/refraction nặng GPU)

> File: `card.tsx`. Đây là cách "kể chuyện 3D" của báo cáo nhưng giữ perf — pointer-tracked radial highlight, KHÔNG backdrop-filter, KHÔNG glass.

### Mục tiêu
Khi hover, một vầng sáng `--primary` mờ bám theo con trỏ trên bề mặt card. Opt-in, motion-safe, không token màu mới.

### 4.1 API
Thêm `spotlight` vào enum `variant` của `cardVariants` (bên cạnh `solid`/`inset`/`glass`):
- `spotlight` kế thừa nền của `solid` (`border bg-card shadow-card`) + thêm lớp highlight.
- Vì cần toạ độ chuột → component phải set CSS var `--spot-x`/`--spot-y` qua `onPointerMove` (client). Card hiện là Server-safe `div`; **tách một client wrapper nhỏ** hoặc thêm nhánh: khi `variant==="spotlight"`, render với handler cập nhật `style={{ "--spot-x": ..., "--spot-y": ... }}`. Đặt `"use client"` ở file riêng `card-spotlight.tsx` nếu cần, export thêm — KHÔNG biến toàn bộ `Card` thành client.

### 4.2 Lớp highlight (CSS)
- `::before` hoặc lớp con `absolute inset-0 pointer-events-none`, `opacity-0 group-hover:opacity-100 motion-safe:transition-opacity duration-[var(--duration-base)]`.
- `background: radial-gradient(200px circle at var(--spot-x) var(--spot-y), color-mix(in oklch, var(--primary) 12%, transparent), transparent 70%)`.
  - Dùng `color-mix(in oklch, var(--primary) …)` — hợp lệ vì là semantic token, KHÔNG màu thô. Nếu ESLint chặn `var(--primary)` thô trong TSX, đặt gradient này trong stylesheet utility (`@utility card-spotlight` trong `glass.css`) và TSX chỉ gắn class — **cách an toàn nhất, ưu tiên cách này.**
- `overflow-hidden` + `rounded-[inherit]` để vầng sáng bo theo card.
- Reduced-motion: ẩn highlight (`motion-reduce:hidden` hoặc opacity giữ 0).

### 4.3 A11y / perf
- `pointer-events-none` để không chặn click.
- Chỉ animate `opacity` + biến CSS (compositor-friendly), không `box-shadow` theo chuột.
- Forced-colors: highlight bị bỏ qua tự nhiên (gradient không áp dụng) — không cần xử lý thêm.

### Acceptance
- [ ] `variant="spotlight"` hover hiện vầng sáng bám chuột; rời chuột mờ dần.
- [ ] Không màu thô trong TSX (gradient qua `@utility`); `bun run lint` xanh.
- [ ] Reduced-motion: không highlight. Click xuyên qua bình thường.

---

## 5. Thứ tự thực thi đề xuất
1. **Motion token** (mục 1) — nền tảng, độc lập.
2. **Bento refactor** (mục 2) — giá trị cao nhất, sửa vi phạm đang tồn tại.
3. **Card state** (mục 3) — cần `--ease-spring`.
4. **Card spotlight** (mục 4) — độc lập, làm cuối.

## 6. KHÔNG làm (đã loại khỏi báo cáo)
- Không thêm/đổi token màu, không Metal-Industrial/Motif aesthetic (lệch brand cyan-glass).
- Không liquid-glass refraction động trên surface lớn (nặng GPU, phá rule "glass chỉ floating").
- Không server-first cookie theming / `@wrksz/themes` — dự án đã có `next-themes` + `PersonalizationScript` zero-FOUC.
- Không tin số liệu marketing trong báo cáo (47% dwell, 192µs…).

## 7. Cổng kiểm thử cuối
`bun run ai:check` · `bun run lint` · `bun run typecheck` · `bun run test` · (visual) `cd apps/web && bunx playwright test design-system-visual` — baseline sinh ở CI Linux.
