# Kế hoạch nâng cấp Component lõi + Token/Theme 2026

> **Trạng thái:** kế hoạch để AI khác thực thi. KHÔNG phải code đã chạy.
> **Phạm vi:** toàn bộ primitive lõi trong `packages/ui/src/components/` + token hỗ trợ trong `styles/{tokens.css,theme.css,glass.css}`.
> **Nguyên tắc:** tuân thủ guardrail ở `docs/conventions/design-system.md` (3-tier token, no surface-opacity, owned shadow ladder, named radius, APCA-only contrast). Mọi đổi màu/L chạy lại `glass-contrast.test.ts` (APCA). Motion token mới phải mirror `tokens.css` ⇄ `lib/motion.ts` (`motion-tokens.test.ts`).
> **Phụ thuộc:** dùng chung `--ease-spring` / `--stagger-base` từ [design-system-2026-upgrade.md](./design-system-2026-upgrade.md) §1. Làm §1 đó trước.

---

## Phát hiện cốt lõi: primitive lõi vẫn còn "shadcn-default drift"

Các component được seed từ shadcn vẫn mang **hack opacity dark-mode** và **shadow Tailwind built-in** — chính những thứ guardrail của dự án cấm. Đây là drift thực, không phải ý kiến. Inventory chính xác (đã loại các trường hợp hợp lệ):

### A. Surface-token opacity — vi phạm Hard Rule #2 ("surfaces are opaque")
| File:line | Class lỗi | Sửa thành |
| --- | --- | --- |
| `button.tsx:16` | `dark:bg-destructive/60` | fill opaque (xem §1.3 — token destructive dark đủ tối, bỏ `/60`) |
| `button.tsx:18` | `dark:bg-input/30`, `dark:hover:bg-input/50` | dùng `--field` opaque (§1.2) |
| `button.tsx:20` | `dark:hover:bg-accent/50` | `hover:bg-accent` opaque |
| `checkbox.tsx:14` | `dark:bg-input/30` | `bg-input` opaque / `--field` |
| `switch.tsx:13` | `dark:data-[state=unchecked]:bg-input/80` | `bg-input` opaque |
| `select.tsx:34` | `bg-input/30`, `bg-input/50` | `--field` opaque |
| `window.tsx:100` | `bg-card/60` | `bg-card` opaque (window body là content, không glass) |

> **Hover-dim fills** (`hover:bg-primary/90`, `hover:bg-secondary/80`, `hover:bg-destructive/90`): đây là dim-một-bậc trên *fill action* (không phải surface card/bg/popover) → guardrail cho phép "ONE opacity step" cho control. **Giữ, nhưng chuẩn hoá về một quy ước** (xem §2.3). Không tính là lỗi.
> **`bg-destructive/10` + `/20`** ở `dropdown-menu.tsx:66`, `context-menu.tsx:72`: đúng chuẩn status-tint `/10 fill + /20 border` → **HỢP LỆ, không đụng.**

### B. Shadow Tailwind built-in thay vì owned ladder — vi phạm Hard Rule #4
`shadow-xs`/`shadow-sm` rải rác: `button.tsx:18`, `input.tsx:11`, `checkbox.tsx:14`, `switch.tsx:13`, `slider.tsx:32`, `select.tsx:34`, `tabs.tsx:67`.
→ Dự án có `shadow-card`/`shadow-raised` cho content nhưng **chưa có token shadow cho control nhỏ**. Thêm `--shadow-control` (§1.1) rồi thay toàn bộ.

### C. Raw `backdrop-blur-*` trong TSX — vi phạm Hard Rule #1
`dialog.tsx:36`, `sheet.tsx:35`, `command-palette.tsx:84`: `backdrop-blur-sm` trên **scrim overlay** (không phải glass surface).
→ Hai lựa chọn (chọn 1, ghi rõ trong plan thực thi):
  - **(khuyến nghị)** tạo `@utility overlay-scrim` trong `glass.css` gói `bg-overlay` + blur + a11y fallback (reduced-transparency → bỏ blur), rồi 3 file dùng class đó.
  - hoặc tài liệu hoá ngoại lệ "scrim được phép blur" và nới ESLint. Kém sạch hơn.

### D. Magic value lặp lại
- `ring-[3px]` ở **button, input, checkbox, switch, select, tabs, scroll-area** → token hoá `--ring-width` (§1.4).
- `switch.tsx:13` `h-[1.15rem]`, `slider.tsx:32` `hover:scale-110 active:scale-95` → thay bằng token/utility (§3).

---

## §1. Token/theme bổ sung (làm trước phần component)

### 1.1 `--shadow-control` (control elevation)
`tokens.css`: thêm `--shadow-control: var(--shadow-1);` (hoặc một inset hairline nhẹ hơn shadow-1 nếu muốn phẳng hơn). `theme.css` `@theme inline`: `--shadow-control: var(--shadow-control);` → utility `shadow-control`. Thay mọi `shadow-xs`/`shadow-sm` ở control bằng `shadow-control`. (Tabs active trigger có thể giữ `shadow-card`.)

### 1.2 `--field` — nền opaque cho input/select/control fill
Hiện `--input` chỉ dùng làm **border** (`border-input`) và bị hack `bg-input/30` để giả nền tối. Tách rõ:
- `theme.css :root`: `--field: var(--background);` (light: input phẳng nền trang — hoặc xem §3.2 cho filled variant).
- `theme.css .dark`: `--field: color-mix(in oklch, var(--primary) 4%, var(--neutral-900));` (opaque, sáng hơn page nền một chút — không cần `/30`).
- `@theme inline`: `--color-field: var(--field);` → utility `bg-field`.
- Thay `bg-background`(input)/`bg-input/30`(dark) → `bg-field`. Gate APCA: `--foreground`/placeholder trên `--field` ≥ Lc 60 (text) / muted placeholder ≥ Lc 45.

### 1.3 Destructive dark: bỏ `/60`
`button.tsx:16` dùng `dark:bg-destructive/60` để làm dịu đỏ trên nền tối. Thay bằng token đã có: dark `--destructive` đã là red-500 mix. Nếu quá rực, hạ tại **token dark** (`theme.css .dark`) thay vì opacity ở component — đồng bộ mọi nơi dùng destructive. Re-gate status-tint test.

### 1.4 `--ring-width` + focus ring nhất quán
`tokens.css`: `--ring-width: 3px;` `--ring-offset: 2px;`. `theme.css @theme inline` không có namespace ring-width của Tailwind → expose qua `@utility focus-ring` trong `glass.css`:
```css
@utility focus-ring {
  outline: none;
}
.focus-ring:focus-visible {
  box-shadow: 0 0 0 var(--ring-width) color-mix(in oklch, var(--ring) 50%, transparent);
  border-color: var(--ring);
}
```
Thay cụm `focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring` lặp lại bằng utility này (hoặc giữ Tailwind ring nhưng đổi `ring-[3px]` → `ring-(length:--ring-width)`). Một knob cho toàn bộ focus.

---

## §2. Cross-cutting cleanup (áp cho mọi control)

### 2.1 Press feedback nhất quán
Chuẩn hoá về `motion-safe:active:scale-(--press-scale)` (Button đã đúng). Sửa:
- `slider.tsx:32` `active:scale-95` → `motion-safe:active:scale-(--press-scale)`; `hover:scale-110` → giữ nhưng gate `motion-safe:` (hoặc bỏ, dùng ring).
- Checkbox/Switch: thêm press scale nếu hợp (tùy chọn).

### 2.2 Spring cho toggle (dùng `--ease-spring`)
- `switch.tsx` thumb: `transition-transform` → thêm `duration-[var(--duration-base)] ease-(--ease-spring)` (cảm giác nảy khi gạt).
- `checkbox.tsx` indicator đang `transition-none` → cho check-in một chút (`motion-safe:` scale/opacity với spring). Reduced-motion giữ tức thì.

### 2.3 Chuẩn hoá hover-dim
Chọn MỘT quy ước cho fill action hover: dùng `/90` cho default/destructive, `/80` cho secondary là không nhất quán. Đề xuất: **action fills dim `/90`**, **muted/secondary control dim `/80`** — viết thành quy ước trong `design-system.md` §Surface để khỏi tái drift.

### 2.4 Bỏ shadow built-in
Thay tất cả `shadow-xs`/`shadow-sm` (mục B) → `shadow-control`.

---

## §3. Nâng cấp theo xu hướng — theo từng component

### 3.1 Button — thêm trạng thái `loading`
Hiện thiếu loading state (nhu cầu phổ biến nhất). Thêm prop `loading?: boolean`:
- Render spinner (lucide `Loader2` + `motion-safe:animate-spin`), set `disabled`, `aria-busy="true"`, ẩn text bằng opacity giữ layout (chống CLS). Giữ `data-slot`.

### 3.2 Input — `variant` (filled vs outline)
Xu hướng form 2026 nghiêng filled/recessed. Thêm `cva` variant:
- `outline` (mặc định, như hiện tại nhưng `bg-field`).
- `filled` → `bg-muted border-transparent focus-visible:bg-field` (inset well cảm giác).
Giữ `data-slot="input"`, `data-variant`.

### 3.3 Skeleton — shimmer hiện đại + token đúng
- Đổi `bg-accent` → `bg-muted` (accent là surface brand, sai ngữ nghĩa cho skeleton).
- Thêm option shimmer: `@keyframes shimmer` (gradient quét) trong `glass.css`, gate `motion-safe`; fallback `animate-pulse` khi reduced-motion. API: `variant?: "pulse" | "shimmer"` (mặc định pulse để không phá hiện trạng).

### 3.4 Slider — token hoá thumb
`slider.tsx:32`: `shadow-xs`→`shadow-control`; `active:scale-95`→`active:scale-(--press-scale)`; `focus-visible:ring-1 focus-visible:ring-ring`→focus-ring utility (§1.4).

### 3.5 Switch/Checkbox — xem §2.1/2.2 (spring + opaque field).

### 3.6 Overlays (Dialog/Sheet/CommandPalette/Popover/Tooltip/Dropdown/Context)
- Scrim blur → `overlay-scrim` utility (§C).
- Giữ CSS enter/exit do Radix quản (đúng convention — không ép motion JS).
- Kiểm tra panel dùng `glass-panel` (đã đúng), foreground APCA trên glass.

### 3.7 Window/Dock — `bg-card/60`→`bg-card` (§A). Giữ `glass-window`/`glass-titlebar`.

---

## §4. Bảng phủ toàn bộ component lõi
| Nhóm | Component | Việc |
| --- | --- | --- |
| Control | Button | bỏ opacity dark, shadow-control, focus-ring, **loading state** |
| Control | Input | bg-field, shadow-control, focus-ring, **filled variant** |
| Control | Checkbox | bỏ `bg-input/30`, shadow-control, spring indicator |
| Control | Switch | bỏ `bg-input/80`, `h-[1.15rem]`→token, spring thumb |
| Control | Slider | shadow-control, press-scale, focus-ring |
| Control | Select | bỏ `bg-input/30,50`, shadow-control, focus-ring |
| Control | Label/Form | rà focus/aria; ít đổi |
| Surface | Card | (đã có plan riêng: state machine + spotlight) |
| Surface | Skeleton | bg-muted, shimmer variant |
| Surface | Avatar/Separator/ScrollArea | focus-ring (`scroll-area` `ring-[3px]`), rà nhỏ |
| Overlay | Dialog/Sheet/CommandPalette | overlay-scrim utility (bỏ raw blur) |
| Overlay | Popover/Tooltip/Dropdown/Context | rà glass + APCA; status-tint giữ nguyên |
| OS | Window/Dock | `bg-card/60`→opaque; glass utilities giữ |
| Layout | Tabs | `shadow-sm`→owned, `ring-[3px]`→token |
| Layout | Bento | plan riêng (§Bento) |

---

## §5. Cổng kiểm & thứ tự
**Thứ tự:** §1 (token) → §2 (cross-cutting) → §3 (per-component) → §4 rà sót.
**Cổng sau mỗi bước:**
- `bun run lint` (pumniNoRawColor + chặn opacity/shadow drift sau khi sửa).
- `bun run test` → `glass-contrast.test.ts` (APCA) + `motion-tokens.test.ts` xanh.
- `bun run typecheck` (props mới: `loading`, `variant`).
- Visual: `cd apps/web && bunx playwright test design-system-visual` (showcase là contract — cập nhật showcase cho variant/loading/shimmer mới; baseline sinh ở CI Linux).

## §6. KHÔNG làm
- Không thêm token màu mới (chỉ `--field`/`--shadow-control`/`--ring-width` là role/elevation/metric, không phải màu mới — theo đúng quy trình "Adding a token").
- Không đổi status-tint `/10 + /20` (đang đúng).
- Không ép motion JS vào overlay Radix (giữ CSS enter/exit).
- Không bỏ a11y fallback của glass; không tin số liệu marketing báo cáo.
- Không gom nhiều thay đổi vào 1 commit khổng lồ — tách theo nhóm §4 để review được.
