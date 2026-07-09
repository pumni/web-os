> Archived 2026-07-09. Successor: docs/plans/glass-modernization-relative-apca-2026-07.md

# Kế hoạch: Border doctrine đúng tri giác + Grain chuẩn 2026

- **Status:** Proposed
- **Date:** 2026-07-05
- **Trigger:** Review độc lập (không dựa ADR) phát hiện: (1) quy tắc "mọi cạnh
  viền kính phải đạt APCA Lc 25" là **tri thức sai đã bị ghi thành doctrine** —
  không có chuẩn a11y nào yêu cầu viền container đạt ngưỡng tương phản, và
  gate-cả-hai-cạnh mâu thuẫn nội tại với khái niệm bevel (đã gây ra sự cố
  viền chói α0.95 trước đó); (2) `glass-grain` đúng kỹ thuật nền nhưng thiếu
  4 điểm so với chuẩn 2026 và có **bug xung đột `::before`** với variant
  specular.
- **Approach:** Sửa doctrine + token + test trước (xác lập sự thật), grain
  và playground theo sau, quét sạch tri thức sai trong docs ở bước cuối cùng
  (docs chỉ được viết theo code đã chốt, không viết trước).

## Guardrails cho executor (đúc kết từ 2 lần thực thi trước — BẮT BUỘC)

1. **Không brute-force token để qua gate.** Mọi thay đổi giá trị token phải có
   bằng chứng probe (Phase 0) kèm biên an toàn ≥ Lc 27, và bị chặn trên về
   thị giác: rim sáng alpha ≤ 0.65, rim tối alpha ≤ 0.55. Nếu không tìm được
   giá trị vừa qua gate vừa trong chặn — DỪNG, report, không nới chặn.
2. **Không game test.** Cấm thêm comment/code chỉ để thoả regex của một test
   (tiền lệ xấu: comment "satisfy the test's brace-unbalanced regex check" đã
   phải xoá). Nếu test chặn một thay đổi chính đáng → sửa test kèm rationale
   trong cùng commit.
3. **Một nguồn công thức.** Playground mirror giá trị production bằng hằng số
   có comment trỏ chéo hai chiều (`theme.css` ↔ `getEdgeTokens`). Cấm trộn
   "công thức cũ + giá trị mới" (tiền lệ xấu: `tintL + 0.12` với α0.95).
4. **Docs viết sau code.** Phase docs chỉ chạy khi token/test đã xanh; mọi số
   liệu trong docs phải đọc lại từ code cuối, không chép từ plan này.
5. Probe/harness tạm đặt tên có tiền tố `debug-` và **xoá trước khi báo xong**.

## Doctrine mới (chép nguyên văn vào docs ở Phase 4)

> **Delineation guarantee (thay cho "mọi viền kính gate Lc 25"):**
> Mỗi bề mặt kính phải có **ít nhất một** cơ chế phân giới đạt APCA Lc 25
> trên worst-case backdrop: cạnh biên chủ đạo (`--glass-edge` cho chrome
> uniform; `--glass-edge-top` cho panel/window) — drop shadow
> (`--shadow-glass`) vẫn là delineator chính. Lc 25 là **sàn nội bộ** chống
> viền tàng hình, chọn trong dải non-text draft của APCA (Lc 15–30); nó
> KHÔNG phải yêu cầu WCAG/APCA chuẩn hoá — WCAG 1.4.11 chỉ áp cho control
> (vì thế `--input` mới là token mang nghĩa vụ a11y). Đường a11y thật của
> glass là fallback `prefers-contrast: more` / `prefers-reduced-transparency`.
>
> **Bevel shading edge:** `--glass-edge-bottom` là hiệu ứng specular — cùng
> lớp với `--surface-rim-top` / `--glass-shadow-edge` — **miễn gate Lc 25**,
> được pin giá trị bằng drift guard để không trôi thành cạnh trội. Phân loại
> theo tri giác (boundary vs shading), không theo cơ chế CSS (border vs
> box-shadow).

## Phase 0 — Probe hạ tầng (làm lại được, dùng cho Phase 1)

1. Tạo `packages/ui/src/test/debug-edge-probe.test.ts` (mẫu: dùng
   `buildTokenMap`/`resolveColor` từ `scripts/lib/token-resolver` + composite
   y hệt `glass-contrast.test.ts`; ghi kết quả ra
   `debug-edge-probe.out.txt` vì vitest nuốt console). Sweep các ứng viên ở
   Phase 1 rồi đọc file out. **Xoá cả 2 file khi xong Phase 1.**

## Phase 1 — Token viền theo bevel vật lý (`packages/ui`)

2. **`theme.css` — trả dark bottom về bóng đổ vật lý** (được phép vì bottom
   không còn bị gate):
   ```css
   --glass-edge-top: light-dark(
     oklch(0.3 0.02 260 / 0.40),   /* giữ nguyên — gated, Lc 26.5 */
     oklch(0.95 0.03 270 / 0.55)   /* giữ nguyên — gated, Lc 33.0 */
   );
   --glass-edge-bottom: light-dark(
     oklch(0.3 0.02 260 / 0.50),   /* giữ nguyên — navy đậm hơn top (bóng) */
     oklch(0.2 0.03 270 / 0.35)    /* MỚI: shadow tím sẫm thay rim sáng L0.90 */
   );
   ```
   Bevel dark mode giờ đúng macOS-idiom: top rim sáng bắt sáng, bottom là
   bóng tiếp xúc. Viết lại comment token: bỏ đoạn "cannot clear the APCA
   Lc 25 gate... both edges stay light" (lý do đó hết hiệu lực khi bottom
   miễn gate); ghi doctrine mới + giá trị Lc đo được của top.
3. **Kiểm tra chồng bóng đáy:** bottom border tối + inset
   `--glass-shadow-edge` (dark α0.22) cùng đổ tối cạnh dưới. Visual check ở
   Phase 5; nếu đáy quá nặng → hạ `--glass-shadow-edge` dark 0.22 → 0.15
   (một lần, có ghi chú), không đụng bottom border.
4. **`tokens.dtcg.json`:** sync `edge-bottom` dark = `oklch(0.2 0.03 270 / 0.35)`
   (+ `shadow-edge` nếu bước 3 kích hoạt).

## Phase 2 — Test gate theo doctrine mới

5. **`glass-contrast.test.ts`:**
   - Gate Lc 25 chỉ còn chạy trên `['--glass-edge', '--glass-edge-top']`
     (bỏ `--glass-edge-bottom` khỏi vòng `it.each`).
   - Thêm test mới `'--glass-edge-bottom is bevel shading (exempt, pinned)'`:
     (a) assert alpha > 0.1 (vẫn nhìn thấy); (b) assert **KHÔNG trội hơn cạnh
     gated**: ở dark, bottom lightness < 0.5 (nó là bóng, không phải rim);
     ở light, bottom cùng lightness với top (0.3) — pin bằng so sánh token
     resolved. Comment ghi doctrine mới ngắn gọn + link design-system.md.
   - Viết lại header comment khối border (dòng ~57-72): xoá framing
     "glass border is now APCA-gated in BOTH modes ... the prior exempt was
     a workaround"; thay bằng delineation-guarantee + ghi rõ Lc 25 là sàn
     nội bộ, không phải chuẩn a11y.
6. **`border-consumption.test.ts`:** giữ guard asymmetric-pair + guard cấm
   `border-color: transparent` trong specular. Cập nhật comment nào còn nói
   "cả hai cạnh gated".

## Phase 3 — Grain chuẩn 2026 (`packages/ui`)

7. **Sửa bug xung đột pseudo-element trước tiên:** `glass-grain` hiện dùng
   `::before` — trùng với `.glass-panel[data-variant="specular"]::before` →
   khi một card vừa specular vừa grain (playground bật cả 2 toggle), specular
   thắng specificity và **grain biến mất**. Chuyển toàn bộ `glass-grain`
   sang **`::after`** (định nghĩa utility + mọi selector fallback đang trỏ
   `.glass-grain::before`).
8. **`glass.css` — nâng cấp utility:**
   ```css
   @utility glass-grain {
     position: relative;
     isolation: isolate; /* chặn blend leak ra ngoài lớp kính */

     &::after {
       content: "";
       position: absolute;
       inset: 0;
       opacity: var(--glass-grain-opacity);
       mix-blend-mode: overlay; /* grain điều biến luminance của kính,
                                   không phủ film xám lên trên */
       pointer-events: none;
       background-image: url("data:image/svg+xml,<svg 200x200 + feTurbulence
         type='fractalNoise' baseFrequency='0.8' numOctaves='2'
         stitchTiles='stitch' + feColorMatrix type='saturate' values='0' +
         rect filter>");
       background-size: 200px 200px;
       background-repeat: repeat;
       border-radius: inherit;
     }
   }
   ```
   Chi tiết bắt buộc:
   - **SVG root phải có `width='200' height='200'`** và utility phải có
     `background-size: 200px 200px` — SVG chỉ-viewBox hiện tại scale hạt
     theo kích thước phần tử (card to = hạt nhoè to), vi phạm tính đồng
     nhất bề mặt. `numOctaves` 3 → 2 (octave 3 không thêm gì ở scale này).
   - `feColorMatrix saturate 0`: khử nhiễu màu RGB (chuẩn hiện đại dùng
     nhiễu luminance-only).
   - Nếu `overlay` gắt trên tint dark (visual check Phase 5) → dùng
     `soft-light`, ghi chú lựa chọn. Chỉ chọn MỘT, áp cả 2 mode.
9. **Token opacity theo mode — LƯU Ý CÚ PHÁP:** `opacity` không phải thuộc
   tính màu nên **`opacity: light-dark(...)` là CSS không hợp lệ**. Đúng
   convention repo (`.dark` block dành cho non-color override, cùng mẫu
   `--glass-blur`):
   ```css
   /* theme.css :root */  --glass-grain-opacity: 0.05;
   /* theme.css .dark  */ --glass-grain-opacity: 0.07;
   ```
   Sync `tokens.dtcg.json` (thêm `grain-opacity` với modes extension).
10. **Fallback đủ 4 khối:** `.glass-grain::after { display: none }` trong
    `prefers-reduced-transparency` (đổi từ ::before), `forced-colors: active`
    (đang THIẾU — forced-colors không tự bỏ background-image),
    `@supports not (backdrop-filter…)` (grain trên fallback đục = film bẩn),
    và `.glass-a11y-preview[data-transparency='reduced']` (đang thiếu).

## Phase 4 — Quét sạch tri thức sai trong docs (một lượt, theo code cuối)

Nguyên tắc: mỗi vị trí dưới đây phải hoặc (a) viết lại theo doctrine mới,
hoặc (b) xoá. Không để sót câu nào nói "cả hai cạnh / mọi viền kính gated"
hay ngụ ý Lc 25 là yêu cầu a11y. Danh sách grep-verified (số dòng tại thời
điểm viết plan — grep lại trước khi sửa):

11. **`docs/conventions/design-system.md`:**
    - Dòng ~96 "The glass border is now APCA-gated at Lc 25 in both modes"
      → thay bằng delineation-guarantee (cạnh chủ đạo gated).
    - Dòng ~173: bỏ "the bevel lives in lightness because a dimmer bottom
      cannot clear the Lc 25 gate" + "Both are APCA Lc 25 gated in both
      modes" → mô tả cặp mới (top gated / bottom = specular shadow, exempt
      + pinned) với giá trị cuối từ `theme.css`.
    - Bảng ~179-183: hàng "Structural hairline" và "APCA Lc 25 gate" của cột
      glass → "top: enforced · bottom: exempt (bevel shading, drift-pinned)".
    - Chèn đoạn doctrine nguyên văn (mục "Doctrine mới" ở trên) vào khối
      Border consumption flow; đồng thời hợp nhất với câu có sẵn "The rim
      tokens are specular ... NOT subject to the APCA gate" — bottom edge giờ
      thuộc đúng lớp này (hết mâu thuẫn phân loại theo cơ chế CSS).
12. **`docs/adr/0012-...md`:** thêm amendment mới **(2026-07-05 border
    doctrine)** — không xoá amendment cũ, ghi đè bằng lịch sử: "Gate-mọi-cạnh
    (2026-07-04) đã over-scope; bằng chứng: bottom bevel bị ép thành rim sáng
    α0.55–0.95 phá bevel vật lý. Rescope: delineation guarantee (cạnh chủ đạo
    gated), bottom = specular class. Lc 25 được minh định là house floor,
    không phải chuẩn WCAG/APCA." Sửa bullet Consequences 2026-07-05 hiện tại
    (đang ghi "equal 0.55 alpha lightness bevel 0.95/0.90") theo giá trị mới.
13. **`.agents/skills/ui-styling/REFERENCE.md`** dòng ~18: "(APCA-gated
    Lc 25)" → "(top APCA-gated Lc 25; bottom = bevel shading exempt)".
    **`SKILL.md`** dòng ~27-29: thêm mệnh đề tương tự vào rule contrast.
    Bổ sung grain vào bảng token (grain-opacity + blend).
14. **`docs/ai/MEMORY.md`:** dòng 2026-07-05 remediation đang ghi giá trị
    lỗi thời "dark mode alphas raised (top 0.95/bottom 0.75)" → sửa thành
    lịch sử 3 bước ngắn: alignment → remediation (0.55/0.55) → doctrine
    rescope (top gated / bottom shadow α0.35) + grain 2026 (overlay,
    saturate-0, 200px tile, ::after).
15. **`theme.css` comments:** khối "4. Edge" (~dòng 146-155) và comment
    `--surface-rim-top` (~217) còn câu "now APCA-gated in both modes per
    2026-07-04 align" → cập nhật theo doctrine; comment cặp edge token viết
    ở Phase 1 bước 2.
16. **Plans cũ:** thêm 1 dòng banner đầu file (không viết lại lịch sử):
    - `glassmorphism-2026-alignment.md`: "> Superseded (2026-07-05): phần
      'gate border cả 2 mode' bị rescope bởi glass-border-doctrine-and-grain-2026.md."
    - `glassmorphism-2026-remediation.md`: "> Giá trị dark bottom trong plan
      này đã bị thay bởi doctrine mới (bottom = shadow bevel, miễn gate)."

## Phase 5 — Playground đồng bộ

17. **`glass-playground.tsx`:**
    - `getEdgeTokens`: dark bottom → `{ l: 0.2, c: reactiveChroma, h:
      reactiveHue, alpha: 0.35 }` (mirror token mới, giữ comment trỏ chéo).
    - Badge "Viền Lc": chỉ đo cạnh **top** (đang đúng — `edgeTokens.top`);
      đổi label/tooltip thành "Viền chủ đạo Lc" và caption "Viền kính ≥ Lc 25
      (cả 2 mode)" → "Cạnh biên chủ đạo ≥ Lc 25 · cạnh đáy = bevel shading
      (miễn gate)".
    - Theory card mục 3 (Edge Highlight): cập nhật mô tả cặp
      top-rim/bottom-shadow; mục Do/Don't hàng "Tuân thủ APCA Lc 60 chữ /
      Lc 25 viền" → "Lc 60 chữ / Lc 25 cạnh biên chủ đạo".
    - Generated CSS: khối `.glass-grain` sinh ra phải phản ánh implementation
      mới (::after, mix-blend-mode, background-size 200px, SVG có
      feColorMatrix, opacity theo mode) — contract "what you see is what you
      copy".
    - Toggle grain desc: thêm "(overlay blend, luminance-only)".
18. Không đổi backdrop presets / absorption (đã đúng sau remediation).

## Phase 6 — Verification (Definition of Done)

19. Gate hẹp → rộng:
    ```pwsh
    bun --cwd packages/ui run test -- src/test/glass-contrast.test.ts src/test/border-consumption.test.ts
    bun --cwd apps/web run test -- src/test/design-system/glass-rim.test.ts
    bun --cwd packages/ui run typecheck; bun --cwd apps/web run typecheck
    bun run ai:check; bun run ai:eval
    ```
20. Visual check `/design-trends` (bắt buộc cả 2 mode):
    - Dark: top rim tím sáng mảnh + đáy bóng sẫm (không còn "hai rim sáng
      gần bằng nhau"); đáy không nặng gấp đôi (bước 3).
    - Grain: bật toggle — hạt mịn **cùng cỡ** trên card to và toast nhỏ;
      bật đồng thời specular + grain → cả ring lẫn grain cùng hiển thị
      (bug ::before đã hết); grain "ăn" vào kính (overlay) chứ không phủ xám.
    - A11y preview reduced-transparency: không grain, không specular ring.
    - Badge "Viền chủ đạo Lc" xanh ở cả 2 mode.
21. Quét lại tri thức sai lần cuối:
    ```pwsh
    rg -n "gated .*both modes|both .*Lc 25|cả 2 mode.*Lc 25|0\.95.*0\.75" docs .agents packages/ui/src/styles
    ```
    Kết quả phải rỗng (hoặc chỉ còn trong 2 plan cũ đã gắn banner).

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Bottom shadow tối (dark) + `--glass-shadow-edge` chồng nhau làm đáy nặng | Bước 3: một núm hạ duy nhất (shadow-edge 0.22→0.15), quyết định bằng visual check, ghi chú lại |
| `mix-blend-mode: overlay` render khác nhau giữa engine trên backdrop-filter element | `isolation: isolate` cô lập blend vào lớp kính; nếu vẫn lệch → `soft-light`; test Chrome + Safari (webkit prefix path) |
| Executor "sửa docs trước code" rồi code lệch docs | Guardrail 4 + Phase 4 nằm SAU Phase 1-3; STOP point giữa Phase 3 và 4 |
| Test exempt-bottom viết thành gate-ngầm (assert Lc bottom ≥ X) | Cấm: test bottom chỉ pin visibility (alpha > 0.1) + subordination (dark L < 0.5), không pin Lc |
| Grain ::after đụng utility khác dùng ::after (`animate-shimmer`) | Hai utility không được khai báo cùng phần tử; thêm 1 dòng ghi chú trong glass.css; shimmer là skeleton-only nên thực tế không giao |

## Out of scope

- Không đổi `--glass-tint`, blur range, saturate, specular ring (đã đúng).
- Không thêm animated grain (từ chối có chủ đích: pin battery + vestibular).
- Không gỡ gate Lc 25 khỏi `--glass-edge` / `--glass-edge-top` — guardrail
  chống viền tàng hình giữ nguyên giá trị của nó.
- Không sửa 19 warning `suggestCanonicalClasses` trong backdrop presets
  (ngoài phạm vi; chạy `bun run ai:tw -- --fix` là việc riêng).

## STOP points

- Sau Phase 1+2: report giá trị Lc đo được của top/bottom mới + screenshot
  nếu có, chờ confirm trước khi sang grain.
- Sau Phase 3: visual check grain ở cả 2 mode trước khi viết docs.
- Phase 4 chỉ bắt đầu khi mọi gate Phase 6 bước 19 đã xanh trên code.
