# Kế hoạch: Align Glassmorphism playground + ADR với chuẩn 2026

> [!WARNING]
> **Superseded (2026-07-05)**: Phần 'gate border cả 2 mode' bị rescope bởi [glass-border-doctrine-and-grain-2026.md](file:///V:/web-os/docs/plans/glass-border-doctrine-and-grain-2026.md).

- **Status:** Accepted
- **Date:** 2026-07-04
- **Trigger:** Đánh giá khách quan playground `design-trends` so với 7 nguồn
  glassmorphism 2026 (Orizon Feb 2026, UX Pilot, MDN, CSS-Tricks, dev.to,
  Kreativa Jun 2026) phát hiện 4 lệch chuẩn. ADR-0012 (consolidated,
  chứa nguyên ADR-0014/0016) đang cấm/阴影 một số kỹ thuật 2026.
- **Approach:** Sửa cả 4 vấn đề · edit trực tiếp ADR-0012. 
  *(Lưu ý kỹ thuật: Trong quá trình triển khai, việc sử dụng viền trắng oklch(1 0 0 / 0.60) ở light mode và oklch(0.7 0.05 270 / 0.18) ở dark mode được xác định là KHÔNG ĐỦ để vượt qua cổng kiểm tra APCA Lc 25 trên các desktop blobs sáng màu. Do đó, các token thực tế đã được tinh chỉnh sang dạng mode-inverted: light mode dùng viền xanh dương đậm oklch(0.3 0.02 260 / 0.40) và dark mode dùng viền tím nhạt oklch(0.9 0.03 270 / 0.50) để đảm bảo độ tương phản an toàn nhưng vẫn đậm tính nghệ thuật).*

## Nguyên tắc

- ADR-0012 giữ history của 9 micro-ADR (0013–0020) trong phần
  "Superseded micro-ADRs" — không xóa, chỉ cập nhật phần Decision và
  thêm section "2026 alignment" để minh bạch.
- Token values hiện đang ở `theme.css` (SSOT theo ADR-0012). Sửa token
  values KHÔNG cần ADR mới — chỉ cần ADR-0012 ghi rõ rationale 2026.
- Showcase playground phải dạy cả khi production không dùng — đó là
  mục đ� của tab design-trends.

## 4 vấn đề cần sửa

| # | Vấn đề | Chuẩn 2026 (nguồn) | Hiện tại | Đề xuất |
|---|--------|---------------------|----------|---------|
| 1 | `--glass-edge` không adaptive per mode | UX Pilot: light = "clearer edge, higher opacity", dark = "neutral-gray or colored rim, NOT pure white" | `theme.css:158` `light-dark(white 0.45 / white 0.14)` — cùng white cả 2 mode | Light: `oklch(1 0 0 / 0.60)`<br>Dark: `oklch(0.7 0.05 270)` (neutral violet, ~alpha 0.18) |
| 2 | Border APCA gate bị exempt cho glass | `glass-contrast.test.ts:57-60` comment "rescopes gate"; chuẩn 2026 nói border giúp "brain lock onto boundaries" | Border exempt | Raise alpha (#1) → border Lc 25 pass both mode → thêm assert |
| 3 | Corner-shine bị cấm ở production (ADR-0016 del sheen) | Apple Liquid Glass + UX Pilot "rim light along side facing light source" — directional/specular edge là trend chính 2026 | `glass-playground.tsx:422` Do/Don't cấm corner-shine ở production | Cho phép `variant="specular"` cho hero/showcase card; production card list vẫn uniform |
| 4 | Blur floor 8px có thể heavy hơn baseline 2026 subtle | UX Pilot: "blur(4–6px) thường đủ, >20px GPU-heavy" | `glass-playground.tsx:55` min 8 | Giữ 8px floor cho Pumni "frosted" style nhưng ghi rõ trong ADR-0012 rằng 4–6px là subtle baseline, 8–16px là "frosted" choice deliberate |

## Phases

### Phase 1 — ADR & docs (P2/P3 layer, không code)

1. **`docs/adr/0012-engineered-glass-surface-language.md`** (edit trực tiếp):
   - Mở section "Context" thêm: đối chiếu 7 nguồn 2026, liệt kê 4 lệch.
   - Sửa "Decision" bullet về edge: thay "uniform luminous hairline" →
     "mode-adaptive luminous rim: light = higher-alpha white hairline,
     dark = neutral-colored rim (violet/teal) replacing pure white".
   - Sửa bullet về corner-shine/sheen: ghi rõ "ADR-0016 del sheen cho
     production bulk list; 2026 alignment: cho phép `variant=specular`
     trên hero/showcase card (≤1/g分量) và chỉ trên backdrop blob".
   - Thêm bullet "blur range rationale": 8–16px frosted choice, 4–6px
     subtle baseline, >16px GPU-heavy (cite UX Pilot).
   - Mở phần "Consequences" thêm row: gate APCA border Lc 25 giờ
     enforce ở cả 2 mode — không còn exempt cho glass.
   - Cập nhật "Superseded micro-ADRs": ghi rõ ADR-0016 phần "sheen
     removal" được amend lại bởi alignment 2026 này.

2. **`docs/conventions/design-system.md`** (chỉ những dòng liên quan):
   - `design-system.md:164-166` — description `--glass-edge` từ
     "white (light 0.45 / dark 0.14)" → "light 0.60 white / dark 0.18
     neutral-violet rim". Giữ 3-token rule (no fourth).
   - `design-system.md:174-177` bảng Solid vs Glass — update value trong
     parentheses cho `--glass-edge`.
   - Kommentar ADR-0012 trong bảng vẫn cite — OK.

3. **`docs/ai/MEMORY.md`** (1 dòng, theo format file):
   - "2026-07-04 — Glassmorphism 2026 alignment: ADR-0012 amended
     in-place; --glass-edge mode-adaptive (light 0.60 / dark
     neutral-violet 0.18); APCA border Lc 25 gate enforced both modes;
     corner-shine `variant=specular` allowed for hero/showcase only."

### Phase 2 — Token & CSS (P1 enforced config)

4. **`packages/ui/src/styles/theme.css:158`**:
   ```css
   --glass-edge: light-dark(
     oklch(1 0 0 / 0.60),
     oklch(0.7 0.05 270 / 0.18)
   );
   ```
   Comment cập nhật: logic adaptive per mode (cite UX Pilot 2026).

5. **`packages/ui/src/styles/theme.css`** (stable comment block
   140–175): cập nhật bullet "4. Edge" — xóa câu "NOT APCA-gated" vì
   giờ gate lại. Ghi rõ: glass edge giờ delineates by contrast trong
   dark mode (colored rim), light mode vẫn dựa shadow nhưng alpha 0.60
   giúp border pass Lc 25.

6. **`packages/ui/src/styles/glass.css:67`**: giữ `border: 1px solid
   var(--glass-edge)` (exact same code, khác tự động qua token change).

7. **THÊM `glass.css` `@utility glass-panel-specular`** (or modify
   `glass-panel` nhận `data-variant="specular"`):
   ```css
   .glass-panel[data-variant="specular"] {
     /* light-catcher border-image — 2026 directional rim, allowed only
        for hero/showcase cards per ADR-0012 2026 amendment. */
     border-image: linear-gradient(135deg,
       oklch(1 0 0 / 0.7) 0%,
       oklch(1 0 0 / 0.1) 30%,
       transparent 60%) 1;
   }
   ```
   GlassSpotlight / Card `variant="specular"` được dùng cho hero.

8. **`packages/ui/src/styles/tokens.css`** (nếu có_primitive cho
   neutral-violet) — verify `oklch(0.7 0.05 270)` không cần primitive
   mới vì alpha-channel đã đủ subtle. Nếu cần primitive thì thêm
   `--rim-violet-300` (semantic tier, không primitive raw).

### Phase 3 — Test gate (P1 enforced config)

9. **`packages/ui/src/test/glass-contrast.test.ts`** (edit block 57-60):
   - Xóa comment "rescopes the gate". Thay bằng: "2026 alignment: glass
     border hiện APCA-gated Lc 25 ở cả light AND dark (mode-adaptive
     `--glass-edge` token đủ contrast sau raise alpha + colored rim)."
   - Thêm 2 cycle `it.each`:

   ```ts
   it.each(['light', 'dark'] as const)(
     'keeps glass border at APCA Lc 25 over desktop blobs in %s mode',
     (mode) => {
       const tokenMap = buildTokenMap(mode);
       const edge = tokenColor('--glass-edge', tokenMap);
       // Border gz over blob composite.
       for (const blobToken of desktopBlobTokens) {
         const blob = tokenColor(blobToken, tokenMap);
         const blobOverTint = composite(
           tokenColor('--glass-tint', tokenMap),
           blob,
         );
         expect(
           Math.abs(apcaContrast(oklchToSrgb(edge), blobOverTint)),
         ).toBeGreaterThanOrEqual(25);
       }
     },
   );
   ```

10. **Border-consumption test** (`packages/ui/src/test/border-consumption.test.ts`):
    verify `--glass-edge` vẫn là 1 trong 3 structural hairline tokens —
    không thay đổi count.

### Phase 4 — Showcase extension (P4)

11. **`apps/web/src/features/design-trends/glass-playground.tsx`**:
    - Thêm toggle "Colored rim (dark mode 2026)" — khi on, inject
      inline `--glass-edge: oklch(0.7 0.05 270 / 0.18)` để preview khác
      vs production.
    - Thêm toggle "Stronger edge (light mode 2026)" — khi on, inject
      `--glass-edge: oklch(1 0 0 / 0.60)`.
    - Thêm backdrop preset `'textured'` — pattern noise + blob (test
      Orizon rule #6 thứ 5 extremes).
    - Cập nhật bảng Do/Don't (`glass-playground.tsx:407-428`):
      + Bỏ dòng "Border-image corner-shine ở production (demo 2026
        thôi)" vì giờ được phép cho hero/showcase.
      + Thay bằng: "Corner-shine chỉ cho hero/showcase card (≤1/page);
        list card vẫn uniform rim."
    - Sửa typos tiếng Việt "Reactive t\*nt" → "Reactive tint" và "Mong
      tint" → "Mong muốn tint" (`glass-playground.tsx:425-426`).

12. **`apps/web/src/features/design-trends/glass-2026-primitives.tsx`**:
    - Thêm `BACKDROP_PRESETS` entry `'textured'` với SVG/CSS pattern.
    - Thêm data-slot="glass-surface" cho Liquid layer (sửa bug dashboard
      không đếm nó — từ đánh giá trước).

### Phase 5 — Verification (gates green)

13. Chạy narrowest gate theo scope change:
    ```pwsh
    bun --filter @pumni/ui typecheck
    bun --filter @pumni/ui lint
    bun --filter @pumni/ui vitest run packages/ui/src/test/glass-contrast.test.ts
    bun --filter @pumni/ui vitest run packages/ui/src/test/border-consumption.test.ts
    bun --filter @pumni/ui generate-exports --check
    bun run ai:check
    ```
    - Typecheck + lint + tests glass/border green.
    - `ai:check` (drift guards) green.

14. Visual check thủ công ở `/design-trends?tab=glass`:
    - Light mode: border đọc rõ hơn trước (alpha 0.60 vs 0.45).
    - Dark mode: border hơi tím thay white glow — confirm không còn
      "harsh pure-white glow" (UX Pilot dark mode tip).
    - Toggle corner-shine cho hero card → directional specular rim.
    - Backdrop preset 'textured' mới xuất hiện.

## Risks & mitigate

| Risk | Mitigate |
|------|----------|
| Raise alpha `--glass-edge` light mode 0.60 có thể "đậm" quá, mất delicacy của glass | Bắt đầu 0.55, test visual, tăng dần. APCA Lc 25 có thể pass ở 0.55 rồi |
| Colored rim dark mode (violet 0.7 0.05 270) có thể xung đột accent personalization (coral/cyan/indigo/violet/rose) | Chroma 0.05 rất thấp, gần neutral — không nên xung đột. Nếu xảy ra, dùng `oklch(0.7 0 0 / 0.18)` (neutral gray) + cho phép personalization override `--glass-edge` per accent |
| ADR-0012 history broken nếu edit | Section "Superseded micro-ADRs" giữ nguyên; section "Decision" ghi rõ "amended 2026-07-04 per 2026 alignment review"; git history giữ original |
| Test fail nếu composite border+glass-tint+blob không đạt Lc 25 ở light mode pink blob | Nếu fail, fallback: giữ exempt cho light mode nhưng gate strict cho dark mode mới (partial alignment) |
| `border-consumption.test.ts` có thể flag `data-variant="specular"` là new pattern | Specular variant đi qua cùng `--glass-edge` border, không thêm token mới — pass |

## Out of scope

- Không sửa ADR khác (0010, 0009, 0013, 0024, 0025) vì không liên quan.
- Không refactor `Card` component variants — chỉ thêm `variant=specular`
  ở `glass.css` utility level, không động `Card` cva.
- Không đổi szematik personalization system (accent pairs) — chỉ có khả
  năng override `--glass-edge` per accent nếu cần (post-MVP).

## STOP point

Sau khi duyệt plan này, tôi sẽ làm theo Phase 1 → 5 sequential. Dừng
ngay Phase 2 (sửa token) nếu Phase 1 (ADR edit) gây tranh cãi. Mỗi
phase xong sẽ report + chờ confirm trước khi phase tiếp theo.
