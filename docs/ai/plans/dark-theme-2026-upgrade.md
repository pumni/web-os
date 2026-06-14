# Kế hoạch nâng cấp hệ màu Dark Mode 2026

> **Trạng thái:** kế hoạch để AI khác thực thi. KHÔNG phải code đã chạy.
> **Phạm vi:** chỉ hệ token màu dark trong `packages/ui/src/styles/{tokens.css,theme.css}`. Không đụng component, không đổi light mode (trừ khi nêu rõ).
> **Tiền đề:** mọi thay đổi L/C/H phải chạy lại `apps/web/src/test/design-system/glass-contrast.test.ts` — cổng contrast **APCA-only** (Lc), không có WCAG ratio. APCA chính xác hơn cho dark mode (WCAG 2.x over-score cặp dark).

## 0. Đánh giá hiện trạng (đã giỏi sẵn — đừng phá)

Dark mode hiện tại đã làm đúng nhiều best-practice 2026:
- ✅ **OKLCH** xuyên suốt → tỉ lệ sáng đồng đều.
- ✅ **Tinted neutrals:** surface tối được pha `color-mix(--primary N%, --neutral-*)` → xám ám brand thay vì xám chết. Đây là kỹ thuật cao cấp, giữ.
- ✅ **Halation compensation:** dark giảm font-weight (400→350, 600→550) + nới tracking +0.01em. Vượt báo cáo.
- ✅ **Semantic switch:** `--primary` cyan-600 (light) → cyan-500 (dark, sáng hơn để nổi trên nền đen). Đúng nguyên lý "đổi con trỏ tham chiếu".
- ✅ **Dark accent gated:** `.dark[data-accent]` chỉnh on-accent text để qua AA (đã có test).

→ **Không đại tu.** Các đề xuất dưới là tinh chỉnh có chủ đích, không viết lại.

## 1. Vấn đề chính: thiếu thang ELEVATION trong dark

Trong dark mode, **shadow gần như vô hình** → độ cao (elevation) phải truyền bằng **độ sáng tăng dần của surface**, không bằng đổ bóng (nguyên lý Material dark / Apple). Hiện trạng:

| Token (dark) | Giá trị | L |
| --- | --- | --- |
| `--background` | `neutral-950` | 0.085 |
| `--card` | `mix(primary 3%, neutral-900)` | ~0.130 |
| `--popover` | `mix(primary 3%, neutral-900)` | ~0.130 |
| `--secondary`/`--muted` | `mix(primary 5–6%, neutral-800)` | ~0.220 |

**Hai lỗ hổng:**
1. **`--card` ≡ `--popover`** (cùng neutral-900). Nhưng popover/dropdown/dialog **nổi phía trên** card → phải sáng hơn để đọc là "gần hơn". Hiện chúng phẳng như nhau ⇒ mất chiều sâu khi menu mở trên card.
2. **Gap thang neutral 900→800 quá lớn** (0.130 → 0.220, nhảy 0.09 L). Không có nấc trung gian để dựng elevation mượt. Mọi surface "nâng" đều phải nhảy thẳng lên 0.220 (quá sáng cho 1 bậc).

### Giải pháp: thêm nấc neutral trung gian + thang surface dark

**1.1 `tokens.css` — lấp gap dark neutral (primitive, hue 260):**
```css
--neutral-880: oklch(0.165 0.020 260);  /* surface +1 */
--neutral-860: oklch(0.195 0.022 260);  /* surface +2 */
```
> Chèn giữa 900 (0.130) và 800 (0.220). Giữ nguyên 950/900/800. Mỗi bậc ~+0.03 L = một mức elevation cảm nhận được, không chói.

**1.2 `theme.css` `.dark` — gán thang elevation:**
| Vai trò | Token | Map mới (dark) | Lý do |
| --- | --- | --- | --- |
| Nền OS | `--background` | `neutral-950` (giữ) | Đáy, OLED-friendly |
| Content surface | `--card` | `mix(primary 3%, neutral-900)` (giữ) | Bậc 1 |
| Floating panel | `--popover` | `mix(primary 3%, neutral-880)` | **Sáng hơn card 1 bậc** |
| Modal/dialog (nếu dùng surface, không glass) | (component token) | `neutral-860` | Bậc cao nhất |

> Chỉ cần đổi `--popover` (và `--popover-foreground` giữ nguyên). Light mode KHÔNG đổi (light dùng shadow cho elevation, đã ổn).
> Kiểm tra: dialog hiện dùng `glass-panel` (floating) — nếu một dialog opaque cần surface, dùng `neutral-860`. Đừng ép glass thành surface.

**1.3 Re-gate:** chạy `glass-contrast.test.ts`. `--popover-foreground` = neutral-50 trên neutral-880 (0.165) vẫn thừa AA; xác nhận APCA ≥ Lc 60 (text) / Lc 25 (UI).

## 2. Halation tại GỐC: làm dịu `--foreground` body

Hiện `--foreground: neutral-50` = oklch(**0.985**) — gần như trắng tinh. Halation (chữ sáng "nở" trên nền tối) đang được bù **gián tiếp** bằng giảm weight + tracking. Nhưng nguồn gốc halation là **độ sáng**, không phải weight. Khuyến nghị 2026 (Material high-emphasis ~87%, Apple): body text dark nên ~L 0.90–0.93, giữ trắng tinh cho heading/emphasis.

**2.1 Đề xuất (tùy chọn, gate kỹ):**
- Giữ `--foreground: neutral-50` (0.985) cho heading/emphasis.
- Cân nhắc một token body dịu hơn cho văn bản dài, ví dụ map text thường về `neutral-100` (0.968) hoặc thêm `--neutral-150 ≈ oklch(0.92 0.006 255)`.
- **Cảnh báo:** đây là thay đổi lan rộng (foreground dùng khắp nơi). Phải:
  1. Chạy `glass-contrast.test.ts` — đảm bảo body L thấp hơn vẫn ≥ APCA Lc 60 trên `--background` và `--card`.
  2. Cân nhắc giữ nguyên nếu rủi ro > lợi ích. **Xếp ưu tiên THẤP** — halation đã được bù một phần. Chỉ làm nếu mục 1 xong và còn dư địa.

## 3. Kiểm định độ rực (chroma) status color trong dark

OKLCH: cùng chroma nhưng L khác → cảm nhận rực khác. Dark dùng:
- `--destructive`: red-500 (C 0.237) — chroma cao, dễ "rung" trên nền đen.
- `--warning`: amber-400 (C 0.189).
- `--success`: emerald-500 (C 0.170).

**3.1 Việc cần làm (đánh giá, không nhất thiết đổi):**
- Xác nhận status foreground (`--*-foreground`) qua AA trên fill tương ứng — đã có trong contrast test, kiểm lại.
- Nếu `destructive` (red-500 C 0.237) bị chói/halation ở dark, cân nhắc hạ nhẹ chroma về ~0.20 **chỉ trong dark** qua một primitive `--red-500-dark` hoặc dùng red-400 đã có. **Chỉ đổi nếu quan sát thực tế thấy rung**, đừng đổi mù.
- Giữ nguyên nếu test xanh và mắt thường ổn — đừng tinh chỉnh thừa.

## 4. (Tùy chọn, ưu tiên thấp) Biến thể "Dim" dark

Xu hướng: ngoài "true dark" (nền ~0.085, OLED, tương phản gắt) còn cung cấp "dim/soft dark" (nền ~0.18–0.22, dịu mắt ban đêm). Dự án đã có hạ tầng personalization (`data-*` attribute + `personalization.css`).

**4.1 Nếu làm:** thêm scope `[data-contrast-mode="dim"]` trong `personalization.css` (sau `theme.css`) nâng `--background`/`--card` lên ~1 bậc, theo đúng pattern `.dark[data-accent]` hiện có. Đi kèm `usePersonalization()` API. **Phạm vi lớn hơn — chỉ đề xuất, không bắt buộc đợt này.**

## 5. Glass dark — đánh giá nhanh (đã ổn)

`--glass-bg` dark = `mix(neutral-900 36%, transparent)`, border/highlight/edge pha primitive qua color-mix → đúng chuẩn, có a11y fallback (reduced-transparency/contrast/forced-colors). **Không đổi.** Chỉ lưu: nếu mục 1 đổi `--popover`, kiểm lại `glass-window[data-active="false"]` (mix với `--popover`) và `glass-titlebar` (mix `--popover`) vẫn đọc đúng — chúng tham chiếu `--popover` nên sẽ tự sáng theo, cần xác nhận không quá sáng.

## 6. Thứ tự thực thi & cổng kiểm

1. **Mục 1 (elevation ramp)** — giá trị cao nhất, rủi ro thấp, đổi 2 primitive + 1 semantic.
2. **Mục 3 (kiểm chroma status)** — chỉ đánh giá, đổi nếu cần.
3. **Mục 2 (foreground dịu)** — ưu tiên thấp, gate kỹ.
4. **Mục 4 (dim variant)** — tùy chọn, có thể tách đợt sau.

**Cổng bắt buộc sau mỗi mục:**
- `bun run test` → `glass-contrast.test.ts` (APCA-only) PHẢI xanh.
- `bun run lint` (pumniNoRawColor — primitive mới chỉ được ở `tokens.css`).
- Visual: `cd apps/web && bunx playwright test design-system-visual` (snapshot dark + accent ở CI Linux).

## 7. KHÔNG làm
- Không đổi OKLCH sang HSL/hex. Không bỏ tinted-neutral.
- Không thêm token màu cho component lẻ (chỉ thêm primitive elevation ở tier 1 + alias tier 2 theo đúng quy trình "Adding a token" trong `design-system.md`).
- Không nâng `--background` thành xám sáng đại trà (giữ OLED true-dark; "dim" là biến thể opt-in ở mục 4, không phải mặc định).
- Không tin số liệu marketing trong báo cáo nguồn.
