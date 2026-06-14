# Kế hoạch CUỐI: Hợp nhất, hoàn thiện & tối ưu Design System 2026

> **Trạng thái:** kế hoạch để AI khác thực thi. KHÔNG phải code đã chạy.
> **Bối cảnh:** 4 plan trước + objective-assessment **đã được thực thi phần lớn** (đã verify trực tiếp trên `tokens.css`/`theme.css`/`glass.css`/components). Bản này KHÔNG lặp lại; nó **đóng các mảnh hở** giữa "đã thêm hạ tầng" và "đã tiêu thụ + tài liệu hoá + test đầy đủ", dọn token mồ côi, và hoàn tất các mục best-practice còn lại.
> **Nguyên tắc:** APCA-only contrast; 3-tier token; no new color token; named radius; logical-first cho code mới. Mọi đổi màu/L → chạy lại `glass-contrast.test.ts`; mọi đổi motion token → `motion-tokens.test.ts`.

---

## §0. Hiện trạng đã verify (đừng làm lại)
✅ Token mới đã có **và** được tiêu thụ: `--field`(bg-field), `--shadow-control`, `focus-ring` util, `--z-popover/--z-tooltip` (popover/dropdown/context/select → popover; tooltip → tooltip), `overlay-scrim` (dialog/sheet/command), `--neutral-880/860` + `--popover` dark nâng bậc elevation, `--ease-spring`/`--duration-slower`/`--stagger-base`, `card-spotlight`, `animate-shimmer`, `breathe`/`shake` (motion.css), `--ring-width`.
⚠️ Đã thêm **nhưng chưa tiêu thụ / chưa nối** (xử lý ở §1).

---

## §1. Token/utility MỒ CÔI — quyết định "nối hoặc bỏ" (ưu tiên cao nhất)

Hạ tầng đã tạo nhưng không có ai dùng = nợ kỹ thuật + đánh lừa người đọc. Mỗi mục phải kết thúc bằng MỘT trong hai: **wire** (nối vào component) hoặc **remove** (xoá khỏi token/css).

### 1.1 State-layer utilities — ĐANG MỒ CÔI
`state-hover` / `state-pressed` / `state-selected` định nghĩa ở `glass.css:238–252`, tiêu thụ `--state-*` (`tokens.css:215–219`). **Không component nào dùng** (đã grep toàn bộ `components/`). Hover-dim hiện vẫn ad-hoc (`hover:bg-accent`, `hover:bg-primary/90`, `hover:bg-secondary/80`).
- **Quyết định cần chốt:** state-layer dùng overlay `--foreground` (xám trung tính, M3-style) — **khác** vẻ hover hiện tại (tint accent cyan). Hai lựa chọn:
  - **(A) Wire:** áp `state-hover`/`state-pressed` cho control trung tính — **menu items** (dropdown/context/select item), **ghost/secondary Button**, **TabsTrigger**, **command items**. Bỏ `hover:bg-accent`/`/NN` tương ứng. Lợi: một knob `--state-*` cho toàn bộ; nhất quán.
  - **(B) Remove:** nếu muốn giữ hover tint-accent (brand hơn), xoá 3 `@utility` + 3 token `--state-*`. Đừng để mồ côi.
- **Khuyến nghị:** **(A) một phần** — wire cho menu/list item & ghost (nơi hover trung tính hợp lý), giữ accent-hover cho action surfaces. Ghi quyết định vào `design-system.md`.
- **Lưu ý a11y:** `state-selected` set nền bất kể tương phản — phải gate APCA cho text trên nền đã phủ.

### 1.2 Density chưa nối vào control — `data-density="compact"` HIỆN KHÔNG CÓ TÁC DỤNG
`--control-height`/`--control-py` + `[data-density="compact"]` (tokens.css) + expose `--spacing-control` (theme.css:300). **Nhưng** Button/Input/Select vẫn hardcode `h-9`/`h-8` (button.tsx:24/27, select.tsx:34) — grep cho `spacing-control` trong components = rỗng. ⇒ knob density **vô hiệu**.
- **Wire:** size mặc định của Button/Input/Select/Switch dùng `h-(--spacing-control)` + `py-(--spacing-control-y)` thay `h-9`/`py-2`. Khi đó `data-density="compact"` mới thật sự thu gọn.
- **Hoặc Remove:** nếu chưa có dashboard cần compact, **xoá** density tokens + `[data-density]` + personalization wiring (personalization-provider.tsx:52,107,108) để khỏi nợ. (objective-assessment xếp density là "hoãn" — nếu giữ thì phải nối, đừng để nửa vời.)
- **Khuyến nghị:** nếu Bento/dashboard sắp làm → Wire; nếu không → Remove sạch.

### 1.3 `--ring-offset` mồ côi
`--ring-offset: 2px` (tokens.css:200) nhưng `focus-ring` (glass.css:224) chỉ dùng `--ring-width`, **không dùng offset**. Trên nút nền màu (primary/destructive) ring cyan sát mép dễ chìm (objective B4).
- **Wire:** thêm vào `.focus-ring:focus-visible` một vòng offset nền: `box-shadow: 0 0 0 var(--ring-offset) var(--background), 0 0 0 calc(var(--ring-offset) + var(--ring-width)) color-mix(in oklch, var(--ring) 50%, transparent);` → ring tách khỏi fill, tương phản trên cả nút đậm lẫn nền trang.
- **Hoặc Remove** `--ring-offset` nếu không dùng. Khuyến nghị **Wire** (giải quyết luôn B4).

### 1.4 `overlay-scrim` blur dùng số thô
`glass.css:260` `blur(4px)` hardcode — lệch nguyên tắc "blur trong token". Thêm `--blur-scrim: 4px` (hoặc dùng có sẵn) và tham chiếu. Nhỏ, nhưng để token-purity trọn vẹn.

---

## §2. Drift còn sót sau đợt thực thi

### 2.1 `checkbox.tsx:21` vẫn `transition-all`
Button/Switch đã chuyển scoped; checkbox bị bỏ quên. Sửa → `transition-[color,box-shadow,border-color]`.

### 2.2 `bg-background` trên thumb/indicator — audit nhẹ
`slider.tsx:32`, `switch.tsx:21` (thumb), `tabs.tsx:67` (active trigger) dùng `bg-background`. Với **núm/thumb** đây là quy ước hợp lệ (knob trắng nổi trên track) — **giữ**. Chỉ rà `tabs` active trigger: nếu muốn nổi hơn trên track `bg-muted`, cân nhắc `bg-card` + `shadow-control` (đã có) thay `bg-background shadow-sm`. (tabs.tsx vẫn còn `shadow-sm` — đổi sang `shadow-control` cho nhất quán ladder.)

---

## §3. Mục best-practice CÒN LẠI (objective-assessment chưa làm)

### 3.1 Typography primitive (B2) — type vẫn áp ad-hoc
Có token type đầy đủ nhưng **không có component/role** → `font-bold text-lg tracking-tight` rải khắp (bento, CardTitle…). Đây là tầng "ráp" còn hở.
- **Thêm** bộ role: hoặc primitive `Text`/`Heading` (cva: `variant="display|title|heading|body|caption|label"`, `as` polymorphic) **hoặc** bộ `@utility type-display/type-title/type-body/type-caption/type-label` gói size+weight+leading+tracking theo vai trò.
- Refactor `CardTitle`/`CardDescription`/Bento title… consume role thay vì ghép tay. Export qua barrel.
- **Test:** thêm assertion mọi role map đúng token (không magic).
- Ưu tiên: **cao** (nền tảng text, chặn drift tương lai).

### 3.2 Chart palette CVD-safe (B1) — chưa kiểm
`chart-1..5` = cyan(202)/indigo(277)/emerald(163)/amber(70)/rose(15), light & dark. Hue brand, **chưa kiểm mù màu**; L chưa chênh đủ để phân biệt khi CVD/grayscale.
- **Việc:** (a) chạy 5 stop qua mô phỏng deuteranopia/protanopia; (b) đảm bảo ΔL giữa các series ≥ ~0.1; (c) cân nhắc thứ tự để 2 series cạnh nhau tương phản tối đa; (d) thêm **test L-distinctness** trong `glass-contrast.test.ts` (đã có sẵn resolver OKLCH); (e) tùy chọn bổ sung ramp sequential/diverging nếu có heatmap.
- **Không đổi hue brand** — chỉ tinh L/thứ tự + kiểm. Chỉ làm nếu có data-viz thật.

### 3.3 RTL logical-first (B3) — 36 chỗ physical
`pl-/pr-/ml-/mr-/left-/right-/rounded-l*` (nặng ở dropdown/context/select/sheet). Chưa cần nếu chỉ LTR (Việt/Anh) nhưng:
- **Quy ước:** ban hành "logical-first" trong `design-system.md` (dùng `ps-/pe-/ms-/me-/start-/end-/rounded-s*`). Migrate **dần** khi chạm file; KHÔNG big-bang.
- Có thể thêm ESLint cảnh báo physical-direction (tùy chọn) để chặn drift mới.
- Ưu tiên: **thấp** (trừ khi có roadmap RTL).

---

## §4. Đồng bộ tài liệu — `design-system.md` phải khớp code mới

Nhiều token/utility đã thêm nhưng doc có thể chưa phản ánh. Rà & cập nhật:
- **Bảng semantic tokens:** thêm `field`, `shadow-control`, `state-hover/pressed/selected`, density (`--control-height`, `data-density`), `ring-width/offset`.
- **Bảng z-index:** thêm `z-popover` (1050) / `z-tooltip` (1150) + ghi rõ "scrim-only ở z-overlay".
- **Surface vocabulary:** ghi `bg-field` cho input fill; phân biệt với `bg-muted` inset well.
- **Mục mới "State-layer tokens":** giải thích vì sao `color-mix overlay` KHÁC surface-opacity bị cấm (để ESLint/maintainer không nhầm) + chốt quyết định §1.1.
- **Mục "Utilities":** `card-spotlight`, `animate-shimmer`, `overlay-scrim`, `focus-ring`, `breathe`/`shake` (motion.css), `type-*` (nếu làm §3.1).
- **Anti-slop table:** thêm hàng "raw `transition-all` → scoped transition", "raw `z-50` floating → token".

## §5. Test & contrast re-gate (bắt buộc — nền tảng đã đổi)

1. **APCA re-gate** (`glass-contrast.test.ts`):
   - `--field` mới: foreground + placeholder (muted) trên `bg-field` ở **cả 2 theme** ≥ Lc 60 / 45.
   - `--popover` dark nâng lên `neutral-880` (0.165): `popover-foreground` + mọi text trên popover ≥ Lc 60; kiểm `glass-titlebar`/`glass-window[data-active=false]` (mix với `--popover`) không quá sáng.
   - `state-selected` (nếu wire §1.1): text trên nền đã phủ ≥ Lc 60.
2. **Z-layering test (MỚI):** render `Select`/`Tooltip`/`DropdownMenu` bên trong `Dialog`, assert content z-index > `--z-modal`. Đây là test bắt bug đã sửa — chưa có, phải thêm để khoá regression.
3. **Density test (nếu wire §1.2):** `[data-density="compact"]` → control height = `--control-height-compact`.
4. **Motion bridge:** xác nhận `--duration-slower`/`--ease-spring`/`--stagger-base` đã có assertion trong `motion-tokens.test.ts` (nếu chưa, thêm).
5. **Typography test (nếu §3.1):** role → token mapping.
6. **Visual re-baseline:** showcase phải có: Card states (loading/error/success), spotlight, shimmer skeleton, Bento 4-tier, field input, dark elevation, density compact. Sinh baseline ở **CI Linux** (`--update-snapshots`), KHÔNG commit baseline Windows.

## §6. Thứ tự thực thi (final)
1. **§1 Mồ côi** (nối/bỏ) + **§2.1 checkbox** — đóng nợ, rủi ro thấp, làm trước.
2. **§5.1–5.2 re-gate APCA + z-layering test** — khoá an toàn nền tảng đã đổi.
3. **§4 Doc sync** — để code & doc khớp trước khi thêm tính năng.
4. **§3.1 Typography** — nền tảng cao giá trị.
5. **§3.2 Chart CVD** / **§3.3 RTL quy ước** — khi có nhu cầu (data-viz / i18n).
6. **§5.6 Visual re-baseline** — cuối cùng, sau khi mọi thay đổi UI ổn định.

**Cổng tổng:** `bun run ai:check` · `bun run lint` · `bun run typecheck` · `bun run test` · `cd apps/web && bunx playwright test design-system-visual`.

## §7. KHÔNG làm
- Không để token/utility mồ côi tồn tại (mỗi cái phải wire hoặc remove — §1).
- Không thêm `forwardRef` (ref-as-prop React 19 đang đúng); không thêm `info` status (trùng primary).
- Không big-bang RTL; không đổi hue brand của chart; không thêm token màu mới.
- Không refactor phần Scorecard đã đạt chuẩn (OKLCH/3-tier/APCA/glass-a11y/motion-bridge).
- Không commit baseline visual của Windows cho CI Linux.
- Không gộp "đổi diện rộng" (state-layer, typography) chung commit với bugfix — tách để review được.
