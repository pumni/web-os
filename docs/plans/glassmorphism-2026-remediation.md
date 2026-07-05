# Kế hoạch: Remediation Glassmorphism 2.0 (hậu-review 2026-07-05)

> [!WARNING]
> **Superseded (2026-07-05)**: Giá trị dark bottom trong plan này đã bị thay bởi doctrine mới (bottom = shadow bevel, miễn gate) trong [glass-border-doctrine-and-grain-2026.md](file:///V:/web-os/docs/plans/glass-border-doctrine-and-grain-2026.md).

- **Status:** Proposed
- **Date:** 2026-07-05
- **Trigger:** Master-review toàn diện hệ glassmorphism (lõi `packages/ui` +
  playground `design-trends`) đối chiếu chuẩn 2026 phát hiện: đợt
  "Glassmorphism 2.0" chưa commit (asymmetric border, double-bezel, specular)
  mang theo **4 lỗi thiết kế thực** và **drift docs↔code** đáng kể. Nghiêm
  trọng nhất: variant `specular` xoá viền cấu trúc trên ~75% chu vi, và APCA
  border gate đang đo `--glass-edge` — token mà `glass-panel`/`glass-window`
  **không còn tiêu thụ**.
- **Approach:** Sửa lõi CSS trước (gate đúng lại), rồi docs (SSOT theo kịp
  code), rồi playground (mô phỏng trung thực với production). Mỗi phase có
  gate riêng; STOP giữa các phase.

## Nguyên tắc (không được vi phạm)

- **P0–P2 giữ nguyên:** APCA Lc 60 (chữ) / Lc 25 (viền) là authority — nếu
  giá trị token fail gate thì sửa token, **không bao giờ** nới gate hay
  re-exempt (ADR-0012 Consequences).
- Token values là doc-edit, không mint ADR mới (ADR-0012). Chỉ sửa ADR-0012
  **in-place** ở phần amendment 2026-07-05 nếu mô tả implementation sai.
- Không animate `backdrop-filter`; không thêm cơ chế viền/rim mới — kế hoạch
  này **giảm** edge hardware, không tăng.
- Playground được phép demo kỹ thuật ngoài production, nhưng (a) mặc định
  phải là trạng thái production-hợp lệ, (b) "Generated CSS" phải đúng 100%
  với những gì đang render ("what you see is what you copy").
- Đổi bất kỳ token nào → sync `packages/ui/tokens.dtcg.json` tương ứng.

## Bảng vấn đề (từ review)

| # | Vấn đề | Vị trí | Mức độ |
|---|--------|--------|--------|
| 1 | `specular` đặt `border-color: transparent` → hairline biến mất trên ~3/4 chu vi; ::before conic chỉ phủ 45–90°. Mâu thuẫn ADR-0012 ("border stays as structural hairline"). ::before còn render cả trong fallback reduced-transparency | `glass.css:98-127` | **Cao** |
| 2 | APCA border gate đo `--glass-edge` nhưng panel/window giờ dùng `--glass-edge-top/bottom` → viền render thực tế **không được gate** | `glass-contrast.test.ts:74-108` | **Cao** |
| 3 | Bevel light mode ngược chiều sáng: top α0.45 đậm hơn bottom α0.35 trong khi rim tối + key-light từ trên → cạnh đổ bóng (đậm) phải là bottom | `theme.css:182-189` | Trung |
| 4 | Specular default angle 0deg = highlight giữa cạnh trên (không phải góc tl như doc); `--specular-corner` là biến chết; corner-map comment trong core (tl=0deg) mâu thuẫn playground (tl=315deg) | `glass.css:99, 129-133` vs `glass-playground.tsx:196` | Trung |
| 5 | `--glass-inset-bezel-outline`: outline trắng 360° tái tạo lại "uniform white hairline" đã bị loại; alpha 0.10/0.05 gần vô hình; spread `0.5px` sub-pixel render không ổn định giữa engine/DPR → 2 shadow layer/panel không có hiệu ứng đọc được | `theme.css:229-233`, `glass.css:76,150` | Trung |
| 6 | Docs drift: `design-system.md` vẫn dạy "3 hairline token, no fourth", hairline glass = `--glass-edge`, rim = `--surface-rim-top` — code đã đổi. Comment stale: `glass-bar-bordered` ("0.45 alpha white"), specular ("border-image carries…"). Hook context-drift đã flag `design-system.md` + `ui-styling` SKILL | `docs/conventions/design-system.md:156-222`, `glass.css:81-97,199-205` | Trung |
| 7 | Playground "color absorption" hấp hue từ `--desktop-blob-primary` (coral, tĩnh) trong khi backdrop preset là purple/pink/cyan hard-code → demo sai kỹ thuật | `glass-playground.tsx:142-159` | Trung |
| 8 | Generated CSS thiếu `saturate()` trong `backdrop-filter` và thiếu gradient-tint khi toggle bật → phá contract | `glass-playground.tsx:328-344` | Trung |
| 9 | Playground light mode inject edge = `tintL + 0.12` → viền **trắng α0.40 trên tint trắng** — đúng anti-pattern ADR-0012 đã cấm; không bao giờ demo rim navy mode-inverted của production | `glass-playground.tsx:202-209` | Trung |
| 10 | Toggle showcase-only (`cornerShine`, `reactiveTint`) mặc định ON — mâu thuẫn triết lý "playground can never teach a value the design system forbids" | `glass-playground.tsx:91-94` | Thấp |
| 11 | Dead imports `GlassSurface`, `Card` trong `glass-2026-primitives.tsx` | `glass-2026-primitives.tsx:4-5` | Thấp |

## Phases

### Phase 1 — Lõi CSS: specular + bevel + bezel (`packages/ui`)

1. **`glass.css` — sửa `.glass-panel[data-variant="specular"]`** (#1, #4):
   - **Xoá** `border-color: transparent;` — 4 cạnh asymmetric border
     (`--glass-edge-top/bottom`) giữ nguyên làm hairline cấu trúc; ::before
     conic ring chỉ **chồng thêm** highlight lên trên (Apple Liquid Glass:
     rim light overlay, không thay thế boundary).
   - **Xoá** biến chết `--specular-corner: tl;`.
   - Đổi default: gradient dùng `var(--specular-angle, 315deg)` (tl thật —
     khớp corner-map của playground `tl=315 · tr=45 · br=135 · bl=225`).
   - Sửa comment block (`glass.css:81-97`): bỏ mô tả "border-image carries a
     directional gradient / border-image only overrides the fill" — mô tả
     đúng cơ chế ::before + mask-composite ring overlay; sửa corner-map
     comment (`glass.css:129-133`) thành map 315/45/135/225.
   - Thêm `.glass-panel[data-variant="specular"]::before { display: none; }`
     (hoặc tương đương) vào cả 4 khối fallback: `prefers-reduced-transparency`,
     `@supports not (backdrop-filter…)`, `forced-colors: active`, và
     `.glass-a11y-preview[data-transparency='reduced']`. (`prefers-contrast:
     more` giữ ring — nó không che nội dung.)

2. **`theme.css:182-189` — đảo alpha bevel light mode** (#3):
   ```css
   --glass-edge-top: light-dark(
     oklch(0.3 0.02 260 / 0.35),   /* top nhận sáng → rim tối NHẠT hơn */
     oklch(0.95 0.03 270 / 0.55)
   );
   --glass-edge-bottom: light-dark(
     oklch(0.3 0.02 260 / 0.45),   /* bottom đổ bóng → rim tối ĐẬM hơn */
     oklch(0.80 0.03 270 / 0.25)
   );
   ```
   Dark mode giữ nguyên (đã đúng top-lit). Cập nhật comment: "với rim tối
   trên nền sáng, cạnh nhận sáng = alpha thấp, cạnh khuất = alpha cao —
   nhất quán key-light từ trên của `--shadow-glass`".

3. **Gỡ `--glass-inset-bezel-outline`** (#5):
   - Xoá layer `var(--glass-inset-bezel-outline)` khỏi box-shadow của
     `glass-panel` (`glass.css:76`) và `glass-window` (`glass.css:150`).
   - Xoá định nghĩa token trong `theme.css:230-233` và entry
     `inset-bezel-outline` trong `tokens.dtcg.json` (~dòng 1939).
   - **Giữ** `--glass-inset-bezel-top` (light-catch hợp lệ, 1 layer).
   - Nếu `glass-rim.test.ts` / `border-consumption.test.ts` pin layer này →
     cập nhật assertion theo (kiểm tra bằng cách chạy test trước khi sửa).
   - Lý do ghi vào comment: outline 360° tái tạo uniform white hairline đã
     loại bởi mode-inverted decision; spread sub-pixel 0.5px không ổn định.

4. **Sửa comment stale `glass-bar-bordered`** (`glass.css:199-205`):
   `--glass-edge` không còn là "0.45 alpha white" — mô tả đúng giá trị
   mode-inverted hiện tại và lý do bar/titlebar **giữ uniform edge** (chrome
   dock/toolbar không cần bevel định hướng — ghi rõ đây là chủ đích).

### Phase 2 — Gate lại đúng token (`packages/ui/src/test`)

5. **`glass-contrast.test.ts`** (#2): mở rộng gate Lc 25 từ `--glass-edge`
   sang **cả `--glass-edge-top` và `--glass-edge-bottom`** (viền panel thực
   render). Giữ gate `--glass-edge` (vẫn dùng bởi `glass-bar-bordered`,
   `glass-titlebar`). Phương pháp composite giữ nguyên (edge-alpha over
   glass-over-blob).
   - **Nếu `--glass-edge-bottom` dark (L0.80/α0.25) fail Lc 25:** nâng alpha
     bottom dark cho tới khi pass (thử 0.30–0.35), KHÔNG hạ threshold.
     Nếu nâng alpha làm mất chênh lệch bevel → nâng cả top tương ứng để giữ
     Δalpha ≥ 0.2. Ghi giá trị chốt vào `theme.css` comment + dtcg.
6. **`border-consumption.test.ts`**: thêm 1 guard mới pin quyết định #1 —
   `.glass-panel[data-variant="specular"]` **không được** chứa
   `border-color: transparent` (regex trên rule body, cùng pattern
   `readRuleBody` sẵn có). Cập nhật tên test/comment còn nhắc
   `--surface-rim-top` cho panel (giờ là bar-only).

### Phase 3 — Docs theo kịp code (SSOT)

7. **`docs/conventions/design-system.md`** (khối `156-222` "Border
   consumption flow"):
   - Bảng hairline: glass-panel/glass-window dùng **cặp asymmetric**
     `--glass-edge-top` / `--glass-edge-bottom` (bevel top-lit, cả 2 gated
     Lc 25); `--glass-edge` còn lại cho **uniform-edge chrome**
     (`glass-bar-bordered`, `glass-titlebar`). Restate closed set: 3 token
     hairline solid-flow không đổi (`--border`, `--input`) + closed set
     glass-flow (`--glass-edge`, `--glass-edge-top/bottom`) — cấm token thứ
     mới ngoài danh sách.
   - Rim vocabulary: panel/window dùng `--glass-inset-bezel-top` +
     `--glass-shadow-edge`; `--surface-rim-top` giờ là **bar/titlebar-only**.
     Xoá mọi câu nói panel đọc `--surface-rim-top`.
   - Decision tree: cập nhật nhánh GLASS tương ứng.
   - Ghi chú specular: "ring overlay qua ::before, hairline asymmetric giữ
     nguyên bên dưới, ẩn trong fallback opaque".
8. **`.agents/skills/ui-styling/SKILL.md` + `REFERENCE.md`**: cập nhật các
   dòng tương ứng (edge/rim vocabulary, specular). Hook context-drift phiên
   này đã flag đúng 2 file: `docs/conventions/design-system.md`,
   `.agents/skills/ui-styling/SKILL.md`.
9. **`docs/adr/0012-engineered-glass-surface-language.md`** — chỉ sửa phần
   amendment 2026-07-05 cho đúng thực tế: (a) specular = ::before ring
   overlay **giữ** structural hairline (không phải border-image thay fill);
   (b) ghi asymmetric pair được gate Lc 25 cả 2 mode; (c) ghi việc gỡ
   double-bezel *outline* (giữ bezel-top). Không mint ADR mới.
10. **`docs/ai/MEMORY.md`** thêm 1 dòng: "2026-07-05 — Glass 2.0 remediation:
    specular giữ hairline (ring overlay), bevel light-mode đảo alpha
    (top nhạt/bottom đậm), gỡ `--glass-inset-bezel-outline`, APCA Lc 25 gate
    mở rộng sang `--glass-edge-top/bottom`."

### Phase 4 — Playground trung thực với production

11. **`glass-2026-primitives.tsx`**:
    - Xoá dead imports `GlassSurface`, `Card` (#11).
    - Thêm metadata hue chủ đạo cho từng preset để absorption hấp đúng màu
      đang nhìn thấy (#7):
      ```ts
      const PRESETS: { value; label; dominant: { l: number; c: number; h: number } }[] = [
        { value: 'mesh',   label: 'Cosmic Mesh', dominant: { l: 0.55, c: 0.22, h: 300 } }, // purple/pink
        { value: 'shapes', label: 'Sharp Shapes', dominant: { l: 0.60, c: 0.20, h: 330 } },
        { value: 'grid',   label: 'Modern Grid', dominant: { l: 0.50, c: 0.18, h: 265 } }, // blue/purple
        { value: 'off',    label: 'Tắt (Flat)',  dominant: null },
      ];
      ```
      (Giá trị dominant do executor ước lượng từ màu preset thật — không cần
      chính xác tuyệt đối, cần đúng *họ* hue.)
12. **`glass-playground.tsx`**:
    - `reactiveHue/reactiveChroma` đọc `dominant` của preset đang chọn;
      fallback `--desktop-blob-primary` chỉ khi preset không có dominant
      (#7). Cập nhật label "Hấp hue …° từ blob" → "từ backdrop".
    - **Edge injection theo production** (#9): light mode inject
      `--glass-edge-top/bottom` từ **rim navy L 0.30** (chỉ điều biến alpha
      0.35/0.45 như Phase 1), KHÔNG derive từ `tintL + 0.12`; dark mode giữ
      công thức lift hiện tại. Đồng bộ khối tính `borderLc` (edgeOklch) và
      khối sinh Generated CSS với cùng logic — một nguồn công thức duy nhất
      (extract helper trong file).
    - **Generated CSS** (#8): `backdrop-filter: blur(Npx) saturate(Sx)` (cả
      dòng -webkit-); khi `gradientTint` bật, in `background:
      linear-gradient(135deg, …)` thay vì `background-color` phẳng.
    - Toggle mặc định (#10): `cornerShine = false`, `reactiveTint = false`
      (production-hợp lệ khi mở trang); các toggle Glassmorphism-2.0 đã có
      trong production CSS (`asymmetricBorder`, `doubleBezel` → đổi tên/mô tả
      thành "Bezel-top highlight" sau khi gỡ outline ở Phase 1, `chromaShadow`,
      `glassGrain`) được phép giữ ON.
    - Cập nhật hàng Do/Don't nhắc `--surface-rim-top`/bezel nếu còn.
13. *(Tuỳ chọn, làm nếu còn budget)*: thêm 1 backdrop preset nền **sáng**
    (blobs coral/amber trên nền kem — production light mode thật) để light
    mode có môi trường đại diện; presets giữ raw color nhưng thêm comment
    rationale "showcase backdrop mô phỏng nội dung tuỳ ý — được miễn
    anti-slop có chủ đích".

### Phase 5 — Verification (Definition of Done)

14. Gate hẹp trước, rộng sau (PowerShell 7):
    ```pwsh
    bun --filter @pumni/ui vitest run packages/ui/src/test/glass-contrast.test.ts
    bun --filter @pumni/ui vitest run packages/ui/src/test/border-consumption.test.ts
    bun --filter @pumni/ui vitest run packages/ui/src/test/glass-rim.test.ts
    bun --filter @pumni/ui typecheck
    bun --filter @pumni/ui lint
    bun run ai:check
    bun run ai:eval
    ```
15. Visual check thủ công `/design-trends` (tab glass), cả 2 mode:
    - Specular card: hairline đủ 4 cạnh + ring sáng đúng góc tl mặc định;
      đổi corner tl/tr/bl/br → ring xoay đúng.
    - Light mode: bevel đọc "top nhẹ, bottom đậm"; badge "Viền Lc" xanh
      với defaults.
    - Bật/tắt từng toggle → Generated CSS thay đổi khớp render.
    - Absorption: chọn preset mesh (tím) → OKLCH tint hue ~300, không phải
      ~30 (coral).
    - Bật a11y preview reduced-transparency → không còn ring specular ma.

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| `--glass-edge-bottom` dark (α0.25) fail gate Lc 25 khi mở rộng test | Nâng alpha bottom dark 0.30–0.35 (bước 5); nếu bevel mất tương phản nội bộ, nâng top giữ Δalpha; tuyệt đối không hạ threshold |
| Đảo alpha light bevel làm viền light mode "nặng đáy" khó chịu trên card nhỏ (menu, popover) | Δalpha chỉ 0.10 — kiểm tra visual popover/dropdown ở bước 15; nếu nặng, thu Δ về 0.05 nhưng giữ đúng chiều |
| Gỡ bezel-outline làm `glass-rim.test.ts` hoặc snapshot khác đỏ | Chạy 3 test glass trước khi sửa để có baseline; sửa assertion cùng commit với CSS |
| Playground refactor edge-formula chạm nhiều khối tính toán (preview vars, borderLc, Generated CSS) dễ lệch nhau | Extract 1 helper duy nhất trả về `{ edgeTop, edgeBottom }` cho cả 3 nơi tiêu thụ |
| `border-consumption.test.ts` guard mới (cấm `border-color: transparent`) khớp nhầm rule fallback | Regex scope vào đúng rule body `.glass-panel[data-variant="specular"]` qua `readRuleBody` như các guard sẵn có |

## Out of scope

- Không đổi blur range 8–16px, `--glass-saturate 1.4`, `--glass-tint` — đã
  đúng/deliberate, có rationale trong ADR-0012.
- Không đụng refraction/chromatic aberration (đã bị cấm 2026-07-05).
- Không refactor `Card` cva ngoài mô tả variant; không đổi hệ
  personalization; không thêm token viền mới.
- Không sửa các vi phạm raw-color trong backdrop preset ngoài việc thêm
  comment rationale (bước 13, optional).

## STOP points

- Sau Phase 1+2 (CSS + gate): chạy gate hẹp, report kết quả APCA thực đo
  (đặc biệt `--glass-edge-bottom` dark) trước khi sang docs.
- Sau Phase 3: diff docs phải khớp 1-1 với code đã đổi — không viết trước
  hành vi chưa có.
- Phase 4 độc lập với 1–3 về mặt file, nhưng chỉ bắt đầu khi Phase 1 chốt
  giá trị token cuối (playground phải mirror giá trị thật).
