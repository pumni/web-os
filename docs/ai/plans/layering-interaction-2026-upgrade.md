# Kế hoạch: Phân tầng Z-index + Lớp tương tác (Interaction Layer) 2026

> **Trạng thái:** kế hoạch để AI khác thực thi. KHÔNG phải code đã chạy.
> **Bối cảnh:** đây là lớp plan thứ 4, **additive** với 3 plan trước (design-system / dark-theme / core-components). Lưu ý repo đang refactor dở — `card.tsx` đã có state machine + `--ease-spring`/`--duration-slower`/keyframes `breathe`/`shake`. Plan này KHÔNG đụng phần đó.
> **Phạm vi quét:** đã quét 25 component lõi cho z-index, motion thô, sizing tùy ý, màu thô. Kết quả dưới là phần CHƯA có trong 3 plan trước.

---

## §1. BUG THẬT: floating menu/tooltip bị ghim sai vào tầng scrim (`--z-overlay`)

### Hiện trạng (đã xác minh bằng `zIndex` của từng file)

| Component (content)            | z-index hiện tại     | Đúng/Sai                |
| ------------------------------ | -------------------- | ----------------------- |
| Dialog content                 | `--z-modal` (1000)   | ✅                      |
| Sheet content                  | `--z-modal` (1000)   | ✅                      |
| CommandPalette content         | `--z-command` (1100) | ✅                      |
| Dialog/Sheet/Command **scrim** | `--z-overlay` (900)  | ✅ (đúng vai trò scrim) |
| **Popover content**            | `--z-overlay` (900)  | ❌                      |
| **DropdownMenu content**       | `--z-overlay` (900)  | ❌                      |
| **ContextMenu content**        | `--z-overlay` (900)  | ❌                      |
| **Select content**             | `--z-overlay` (900)  | ❌                      |
| **Tooltip content**            | `--z-overlay` (900)  | ❌                      |

`--z-overlay` (900) theo `tokens.css`/`design-system.md` là **"scrim đằng sau modal"** — KHÔNG phải tầng cho nội dung nổi. Hệ quả thực tế:

> Mở một `Select` / `DropdownMenu` / `Tooltip` **bên trong một `Dialog`** → menu render ở 900, **thấp hơn** panel dialog ở `--z-modal` (1000) ⇒ **menu bị dialog che khuất**. Đây là kịch bản rất phổ biến (select trong form modal) và là đúng class bug mà mục Z-index của `design-system.md` tồn tại để ngăn.

### Giải pháp: thêm 2 tầng semantic còn thiếu

**1.1 `tokens.css` — chèn vào thang `--z-*` (giữ thứ tự tăng dần):**

```css
--z-overlay: 900; /* scrim sau modal (giữ) */
--z-modal: 1000; /* panel dialog/sheet (giữ) */
--z-popover: 1050; /* MỚI: popover/menu/select/context — nổi TRÊN modal */
--z-command: 1100; /* command palette (giữ) */
--z-tooltip: 1150; /* MỚI: tooltip — trên command, dưới toast */
--z-toast: 1200; /* toast, frontmost (giữ) */
```

> Lý do thứ tự: menu/popover phải trên modal (để dùng được select trong dialog). Tooltip trên cùng các overlay tương tác nhưng dưới toast (toast luôn frontmost). Command palette giữ giữa.

**1.2 `theme.css @theme inline` — expose utility (đồng bộ kiểu hiện có):**

```css
--z-index-popover: var(--z-popover);
--z-index-tooltip: var(--z-tooltip);
```

**1.3 Remap component (đổi inline `style={{ zIndex }}`):**

- `popover.tsx:33`, `dropdown-menu.tsx:36`+`:206`, `context-menu.tsx:46`+`:205`, `select.tsx:59` → `var(--z-popover)`.
- `tooltip.tsx:45` → `var(--z-tooltip)`.
- **Giữ nguyên** mọi `--z-overlay` đang dùng cho SCRIM (dialog/sheet/command scrim) — chúng đúng.

**1.4 `design-system.md` — cập nhật bảng z-index** thêm 2 hàng `z-popover` (1050) / `z-tooltip` (1150) và ghi rõ: "transient overlay (menu/popover/tooltip) nổi TRÊN modal; chỉ scrim mới ở `z-overlay`."

**1.5 Kiểm thử:** thêm e2e/visual hoặc một test phân tầng: render `Select`/`Tooltip` bên trong `Dialog`, khẳng định content z-index > modal. (Hiện chưa có test nào bắt lỗi này — đó là lý do nó lọt.)

---

## §2. Motion hygiene (drift còn lại sau core-components plan)

### 2.1 `transition-all` → scoped transition

`button.tsx:11`, `checkbox.tsx:21`, `switch.tsx:13` dùng `transition-all` — animate cả layout property (gây jank, perf kém). `design-system.md` convention là transition có phạm vi.

- Button → `transition-[color,box-shadow,transform]`.
- Checkbox → `transition-[color,box-shadow,border-color]` (bỏ `transition-all`/`transition-shadow` trùng).
- Switch → `transition-[background-color,box-shadow]` (thumb riêng đã `transition-transform`).

### 2.2 Tooltip arrow `z-50` cục bộ

`tooltip.tsx:53` arrow `z-50` là z nội bộ trong stacking context của tooltip — không leo ra ngoài nên KHÔNG phải bug OS-scale, nhưng `z-50` thừa (arrow chỉ cần nổi trên fill). Hạ về `z-10` cho rõ ý "component-internal" (đúng tinh thần mục Z-index: raw z chỉ cho nội bộ component).

---

## §3. (Cấu trúc mới) State-layer tokens — thống nhất hover/press dimming

### Vấn đề

Hover-dim hiện ad-hoc: `hover:bg-primary/90`, `hover:bg-secondary/80`, `dark:hover:bg-accent/50`, `hover:bg-muted/80`… mỗi control một con số. Khó nhất quán, dễ tái drift (core-components plan §2.3 mới chỉ "chọn quy ước thủ công").

### Đề xuất (Material-3 / xu hướng "state layer")

Token hoá **độ mạnh tương tác**, không phải từng màu:

```css
/* tokens.css */
--state-hover: 8%; /* lớp phủ hover */
--state-pressed: 12%; /* lớp phủ pressed */
--state-selected: 10%; /* lớp phủ selected/active */
```

Áp qua một `@utility` dùng `color-mix` trên `currentColor`/fill, ví dụ:

```css
@utility state-hover {
  &:hover {
    background-color: color-mix(in oklch, var(--foreground) var(--state-hover), transparent);
  }
}
```

- **Lưu ý guardrail:** đây KHÔNG phải surface-opacity bị cấm (cấm là `bg-card/NN` trên _surface_); đây là **state overlay** trên fill tương tác — hợp lệ và là chuẩn hiện đại. Ghi rõ ngoại lệ này trong `design-system.md` để ESLint/maintainer không nhầm.
- **Ưu tiên:** trung bình. Làm sau §1/§2 vì phạm vi rộng (đụng mọi control) và cần đồng thuận về con số.

---

## §4. (Tùy chọn) Density tokens

Báo cáo nhấn data-density (Bento). Dự án có token radius/motion/z/type/shadow nhưng **không có thang spacing/density**. Cân nhắc `--density: comfortable | compact` điều chỉnh `--control-height` / padding control (h-9 ↔ h-8) cho dashboard mật độ cao. Phạm vi lớn — tách đợt riêng, chỉ ghi nhận, KHÔNG bắt buộc.

---

## §5. Xác nhận độ phủ quét

Đã quét toàn bộ `packages/ui/src/components/`: button, input, checkbox, switch, slider, select, label, form, card, skeleton, avatar, separator, scroll-area, dialog, sheet, popover, tooltip, dropdown-menu, context-menu, command-palette, window, dock, tabs, bento-grid, glass-surface, sonner.

- z-index: §1.
- motion thô / `transition-all`: §2.
- sizing tùy ý: `dialog`/`command-palette` `top-[50%] translate-[-50%]` = pattern căn giữa **hợp lệ** (không tokenize %); `tabs` `p-[..]`/`h-[..]` minor (đã nằm trong core-components plan §4); `bento` `min-h-[..]` thuộc Bento plan (chống CLS, hợp lệ).
- màu trắng/đen thô: không có (ESLint đã chặn). `avatar z-10` = component-internal, hợp lệ.

---

## §6. Thứ tự & cổng kiểm

1. **§1 Z-index** (bug thật, rủi ro thấp, giá trị cao) — sửa token + remap 6 file + test phân tầng.
2. **§2 Motion hygiene** — đổi class, không đổi hành vi.
3. **§3 State-layer** — cần đồng thuận con số, phạm vi rộng.
4. **§4 Density** — tách đợt sau.

**Cổng:**

- `bun run lint`, `bun run typecheck`.
- `bun run test` (+ test phân tầng z mới ở §1.5).
- Visual: `cd apps/web && bunx playwright test design-system-visual`; bổ sung kịch bản "menu/select/tooltip trong Dialog" để khoá bug §1.

## §7. KHÔNG làm

- Không đổi z của scrim (đang đúng). Không thêm token màu mới (z/state/density là metric/role, không phải màu).
- Không ép motion JS vào overlay Radix.
- Không gộp §1 và §3 chung commit (một là bugfix, một là đổi diện rộng).
