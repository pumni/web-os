# Plan: Glass visual refresh 2026-07 — sửa viền + chất kính theo audit F1–F5

- **Status:** Executed — Phases 1–5 áp trong working tree branch
  `fix/glass-visual-refresh-2026-07` (chưa commit). F3 spike: light 0.56/blur20
  (sat giữ 130%), dark readable 0.36 (nudge từ 0.34 để giữ chrome<readable
  strict). Còn nợ: commit (chờ user) + screenshot visual sign-off (`bun run dev`).
- **Date:** 2026-07-11
- **Owner:** `@pumni/ui` design system
- **Skills:** `refactor-plan` (plan này) · `ui-styling` + `testing-template` (từng step)
- **Cơ sở:** Audit 2026-07-11 (findings F1–F6) + artifact so sánh trực quan
  <https://claude.ai/code/artifact/b0186069-f640-4d36-8574-1489f96862fa> +
  `docs/research/glass-effect-modern-standards-2026-07.md` (30 nguồn) + plan
  archive `glass-border-doctrine-and-grain-2026.md` (spec grain đã duyệt nhưng
  chưa ship)
- **Predecessor (đã ship — KHÔNG làm lại):**
  `glass-standards-refresh-2026-07` Phases A–E1 (fallback var indirection,
  media-dim, scroll-edge, un-clip bevel ring). Plan này nhận bàn giao đúng
  điểm plan cũ dừng: bước E2 (recalibrate ring sau khi un-clip) chưa chạy.

---

## Outcome (một câu)

Sửa hai bug thị giác (viền bevel 135° một-góc-sáng chưa recalibrate; alpha
mặc định thiếu nhánh dark làm dark-mode đục hơn cả "strong"), ship grain đã
đặc tả, dọn từ vựng specular chết, và spike độ trong của kính — mỗi phase là
một PR độc lập, không đụng nền tảng đã đạt chuẩn (OKLCH SSOT, APCA gate, a11y
fallback, perf discipline).

## Findings map (audit 2026-07-11)

| # | Vấn đề | Loại | Phase |
|---|---|---|---|
| F2 | `--glass-tint-chrome/readable` (theme.css:168-169) alpha 0.54/0.58 phẳng cả 2 theme; comment nói dark = 0.34/0.40; dark default (0.58) đục hơn `[data-glass='strong']` dark (0.48) — thang intensity đảo | bug | 1 |
| F1 | Bevel ring `linear-gradient(135deg)` một-góc-sáng (glass.css:72,113); `--glass-edge-top` α0.65 tune từ thời ring còn bị clip vô hình — bước E2 còn nợ | bug thị giác | 2 |
| F5 | `--specular-rim-*` (theme.css:198-201) zero consumer; REFERENCE.md hứa `data-variant="specular"` không tồn tại; comment "diagonal reflection overlay via ::after" (glass.css:24, theme.css:146) bị `glass-optical-unity.test.ts` cấm | debt/drift | 3 |
| F4 | `glass-grain` đặc tả đầy đủ trong plan archive nhưng không có trong code | gap | 4 |
| F3 | Light glass đọc như nhựa sữa: fill L0.96 α0.58 + brightness(110%) + blur 16 — backdrop không xuyên qua | aesthetic | 5 |
| F6 | Không có lensing/refraction | settled — non-goal | — |

## Non-goals (hàng rào cứng)

- **Không lensing / SVG displacement refraction** — ADR-0021 đã bác; mở lại
  cần ADR mới, không phải plan này.
- **Không đổi giá trị các nấc blur ladder** (12/16/20/24). Phase 5 chỉ được
  di chuyển mapping default *dọc theo* ladder có sẵn.
- **Không thêm tier glass mới**; không đổi cap 2 lớp kính; không đổi motion /
  personalization API (chỉ đổi *giá trị* alpha trong ma trận có sẵn).
- **APCA gate là thẩm quyền** cho mọi thay đổi màu — nếu giá trị mới rớt gate
  Lc 60, chỉnh giá trị, không chỉnh gate (trừ hai guard được khai báo rework
  ở Step 2.3 với lý do ghi rõ).
- **Không đụng** `supabase/`, feature logic, `apps/web/src/features/watch`.
- **Không commit/push** trừ khi user yêu cầu.

## Constraints & invariants

- P0–P4 thắng plan. Token tiers: component chỉ tiêu thụ semantic; không raw
  `oklch()` ngoài token files.
- `light-dark()` chỉ cho màu; thuộc tính phi-màu (opacity grain, blur) override
  trong `.dark` (quy tắc SKILL.md ui-styling).
- Phase sửa hành vi thị giác (1, 2, 4, 5) không trộn với phase refactor thuần
  (3) trong cùng PR.
- Characterization test grep cấu trúc CSS (`border-consumption`,
  `glass-contrast`, `glass-rim`, `glass-a11y-fallbacks`, `glass-performance`,
  `glass-optical-unity`, `dtcg-export`): khi step đổi cấu trúc thì update test
  **cùng diff** và ghi rõ hành vi nào giữ nguyên.
- Docs/skill cập nhật cùng PR với hành vi nó mô tả (same-change rule):
  `docs/conventions/design-system.md`, `.agents/skills/ui-styling/SKILL.md` +
  `REFERENCE.md`.
- `tokens.dtcg.json` sync tay cùng diff khi thêm/xoá token; `dtcg-export.test.ts`
  gác parity.

## Pre-flight (trước Step 1.1)

1. Baseline: `bun run lint && bun run typecheck && bun run test` — ghi nhận
   green làm known-good. Đỏ thì dừng, sửa baseline trước.
   **Lưu ý:** working tree đang có diff dở (foundations-section showcase,
   avatar, context-menu/dropdown-menu) — stash hoặc để user quyết trước khi
   tạo branch; không cuốn diff đó vào plan này.
2. Branch mới từ `main`: `fix/glass-visual-refresh-2026-07`.
3. Probe pixel (scratchpad Playwright, tái dùng cách của plan trước): chụp
   `glass-panel` + `glass-window` trên backdrop blob ở cả 2 theme làm ảnh
   **before** cho mọi phase thị giác.

---

## Phase 1 — fix(ui): nhánh dark cho alpha tint mặc định (F2)

PR nhỏ nhất, độc lập, sửa bug rõ ràng nhất. Thị giác thay đổi ở dark mode.

### Step 1.1: Thêm `light-dark()` alpha cho hai token tint

- **File:** `packages/ui/src/styles/theme.css:161-169`
- **Action:**
  ```css
  --glass-tint-chrome:   light-dark(
    oklch(from var(--glass-fill) l c h / 0.54),
    oklch(from var(--glass-fill) l c h / 0.34)
  );
  --glass-tint-readable: light-dark(
    oklch(from var(--glass-fill) l c h / 0.58),
    oklch(from var(--glass-fill) l c h / 0.40)
  );
  ```
  Light giữ nguyên giá trị đang ship (0.54/0.58 — không đổi diện mạo light);
  dark lấy 0.34/0.40 đúng comment + khôi phục thứ tự thang
  soft (0.30/0.36) < default (0.34/0.40) < strong (0.40/0.48).
  Sửa comment "Alpha matrix" ngay trên đó cho khớp code (comment hiện ghi
  light chrome 0.52 — số thật là 0.54).
- **Verification:** `bun --filter @pumni/ui test` (glass-contrast gate phải
  green cho dark 0.40 — soft dark 0.36 đã pass gate nên 0.40 kỳ vọng pass;
  nếu đỏ: dừng, báo user — không nâng alpha ngược lên quá 0.48) &&
  `bun --filter web test`. Screenshot pair dark trước/sau đính vào report.
- **Rollback:** revert diff token (2 declarations + comment).
- **Depends on:** none

## Phase 2 — fix(ui): rim đối xứng + hoàn tất E2 (F1)

Trả đúng lời chê "sáng ở góc rồi tối dần". Screenshot review là **hard stop**
trước khi merge.

### Step 2.1: Token — thêm stop cạnh bên, recalibrate alpha

- **File:** `packages/ui/src/styles/theme.css:181-196`;
  `packages/ui/tokens.dtcg.json` (sync các entry edge)
- **Action:** Giữ tên `--glass-edge-top` / `--glass-edge-bottom`, thêm
  `--glass-edge-side`; đổi ngữ nghĩa bottom từ "contact shadow" thành
  "secondary light catch" (Fresnel — mép dưới bắt sáng yếu hơn mép trên):
  ```css
  /* giá trị khởi điểm cho spike — chốt bằng screenshot review */
  --glass-edge-top:    light-dark(oklch(1 0 0 / 0.45), oklch(0.98 0.005 0 / 0.28));
  --glass-edge-side:   light-dark(oklch(1 0 0 / 0.07), oklch(0.98 0.005 0 / 0.05));
  --glass-edge-bottom: light-dark(oklch(1 0 0 / 0.25), oklch(0.98 0.005 0 / 0.15));
  ```
  (top hạ 0.65→0.45 light / 0.35→0.28 dark — hoàn tất E2.) Viết lại khối
  comment "5. BEVEL RING" mô tả mô hình đối xứng; `--glass-edge` (uniform,
  cho bars) giữ nguyên.
- **Verification:** `bun --filter @pumni/ui test` — **kỳ vọng đỏ có kiểm soát**
  ở 2 guard sẽ rework tại Step 2.3; các test khác phải green.
- **Rollback:** revert token diff.
- **Depends on:** none (độc lập với Phase 1)

### Step 2.2: Ring linear 135° → conic đối xứng

- **File:** `packages/ui/src/styles/glass.css:72,113` (hai `::before` của
  `glass-panel` / `glass-window`)
- **Action:** Thay declaration background của ring (giữ nguyên toàn bộ kiến
  trúc mask/padding/inset:0 — không đụng fix E1):
  ```css
  background: conic-gradient(from 0deg,
    var(--glass-edge-top) 0deg,
    var(--glass-edge-side) 80deg,  var(--glass-edge-side) 100deg,
    var(--glass-edge-bottom) 180deg,
    var(--glass-edge-side) 260deg, var(--glass-edge-side) 280deg,
    var(--glass-edge-top) 360deg);
  ```
  Sửa comment 6-element model (glass.css:22, theme.css:144): element 5 =
  "symmetric specular ring (conic: top light-catch, faint sides, softer
  bottom light)".
- **Verification:** như 2.1 (đỏ có kiểm soát ở 2 guard); visual check bằng
  probe pixel: 4 góc ring phải đối xứng trái-phải.
- **Rollback:** revert declaration.
- **Depends on:** 2.1

### Step 2.3: Rework 2 characterization guard + docs cùng diff

- **File:** `packages/ui/src/test/border-consumption.test.ts:135-159`;
  `packages/ui/src/test/glass-contrast.test.ts:225-240`;
  `.agents/skills/ui-styling/REFERENCE.md` (bảng border doctrine, dòng ~180);
  `docs/conventions/design-system.md` (nếu nhắc ring 135°)
- **Action:**
  - `border-consumption`: regex `linear-gradient(135deg, …)` → conic + đủ 3
    token; giữ nguyên các assert transparent metric border + mask-composite
    (hành vi giữ nguyên: ring vẫn là hairline mask 1px, vẫn ungated).
  - `glass-contrast` guard "bottom darker than top": cơ sở lightness → **alpha**
    (`bottomEdge.alpha < topEdge.alpha`, và `side.alpha < bottom.alpha`) —
    hành vi được pin lại: chống "two equal bright rims", cho phép bottom là
    light catch yếu. Guard "top rim là LIGHT stroke, α ≤ 0.7" giữ nguyên
    (0.45 nằm trong biên).
  - REFERENCE.md: cập nhật mô tả ring + xoá chữ "light-catch TL → contact
    shadow BR".
- **Verification:** `bun --filter @pumni/ui test` && `bun --filter web test`
  (toàn bộ green) && `bun run ai:check`. **Hard stop:** screenshot pair
  (dialog + dock + window, 2 theme) cho user duyệt trước merge.
- **Rollback:** revert Phase 2 nguyên khối (3 step phụ thuộc nhau).
- **Depends on:** 2.2

## Phase 3 — chore(ui): dọn từ vựng specular chết (F5)

Refactor thuần, zero thay đổi thị giác. PR riêng, sau Phase 2 (prose ring đã
ổn định).

### Step 3.1: Xoá token chết + sửa prose drift

- **File:** `packages/ui/src/styles/theme.css:198-201` (xoá
  `--specular-rim-start/mid/end`); `packages/ui/tokens.dtcg.json:1739-1760`
  (xoá 3 entry); `packages/ui/src/styles/glass.css:24` + `theme.css:146`
  (xoá dòng "diagonal reflection overlay via ::after" — bị
  `glass-optical-unity.test.ts` cấm từ lâu);
  `.agents/skills/ui-styling/REFERENCE.md` (xoá dòng ~185 hứa
  `data-variant="specular"`); `apps/web` nếu grep còn prose nhắc variant này.
- **Action:** Contract thuần (audit đã xác nhận zero consumer — re-grep
  `specular-rim|data-variant.*specular` trước khi xoá; nếu lòi consumer mới:
  dừng, re-scope).
- **Verification:** `bun --filter @pumni/ui test` (dtcg-export parity) &&
  `bun run ai:check` && `bun run typecheck`.
- **Rollback:** revert diff.
- **Depends on:** Phase 2 merged (sửa cùng vùng prose).

## Phase 4 — feat(ui): grain mặc định trên panel/window (F4)

Ship spec grain từ plan archive `glass-border-doctrine-and-grain-2026.md`,
với một quyết định mới: **grain mặc định bật** trên `glass-panel` /
`glass-window` (mục tiêu là nâng chất "frosted" toàn hệ, không phải một
toggle demo). Screenshot review hard stop.

### Step 4.1: Token + lớp grain

- **File:** `packages/ui/src/styles/theme.css` (`:root`
  `--glass-grain-opacity: 0.05;` + `.dark` override `0.07` — phi-màu nên dùng
  `.dark`, không `light-dark()`); `packages/ui/src/styles/glass.css`
  (`glass-panel`/`glass-window` thêm `&::after`); `packages/ui/tokens.dtcg.json`.
- **Action:** `::after` inset 0, `background-image` data-URI SVG
  `feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'`,
  `background-size` cố định (hạt cùng cỡ mọi panel), `mix-blend-mode: overlay`,
  `opacity: var(--glass-grain-opacity)`, `pointer-events: none`,
  `display: var(--glass-grain-display, block)`. Hai utility hiện **không có**
  `::after` nào — không đụng độ (đã xác minh; `animate-shimmer` là
  skeleton-only).
- **Verification:** `bun --filter @pumni/ui test`; extend
  `glass-performance.test.ts` cùng diff: khối `::after` không chứa
  `backdrop-filter` / `will-change` / `animation`.
- **Rollback:** revert diff.
- **Depends on:** none (song song được với Phase 1–3; nếu Phase 2 merge trước
  thì rebase — cùng file glass.css).

### Step 4.2: Nhánh suy giảm + docs

- **File:** `packages/ui/src/styles/glass.css` (các khối fallback:
  `prefers-reduced-transparency`, `@supports not`, `prefers-contrast: more`,
  `forced-colors`, hai khối `.glass-a11y-preview`) — set
  `--glass-grain-display: none` theo đúng pattern `--glass-bevel-ring-display`;
  `packages/ui/src/test/glass-a11y-fallbacks.test.ts` (extend);
  `docs/conventions/design-system.md` + `.agents/skills/ui-styling/SKILL.md`
  (thêm grain vào 6-element model → thành 7 hoặc gộp vào element 5's prose).
- **Action:** như trên; grain tắt ở mọi nhánh suy giảm (grain trên fallback
  đục = "film bẩn" — lý do đã ghi trong plan archive).
- **Verification:** `bun --filter @pumni/ui test` && `bun --filter web test`
  && `bun run ai:check`. **Hard stop:** screenshot 2 theme (hạt phải "ăn" vào
  kính qua overlay, không phủ xám nội dung).
- **Rollback:** revert Phase 4 nguyên khối.
- **Depends on:** 4.1

## Phase 5 — feat(ui): spike độ trong của kính (F3)

Phase chủ quan nhất — làm **cuối cùng**, trên baseline đã có rim mới + grain
(diện mạo thay đổi bởi Phase 2/4 có thể đã đủ "hiện đại"; user có quyền dừng
plan tại đây — ghi nhận ở approval gate).

### Step 5.1: Spike có thang đo (không ship trực tiếp)

- **File:** scratchpad HTML/Playwright (ngoài repo) + đọc
  `packages/ui/src/test/glass-contrast.test.ts` để chạy gate offline.
- **Action:** Ma trận thử trên backdrop blob thật: light readable alpha
  {0.58, 0.52, 0.48} × blur {16, 20} × saturate {130%, 150%} × brightness
  {110%, 105%}; dark tương ứng sau Phase 1. Mỗi ô chấm 2 tiêu chí: gate APCA
  Lc 60 (chạy hàm composite của test) và cảm quan (screenshot cho user chọn).
  Ràng buộc thang: giá trị default mới phải giữ soft < default < strong ở cả
  2 theme — nếu default hạ dưới soft, ma trận personalization phải hạ cùng
  nhịp trong Step 5.2.
- **Verification:** bảng ma trận + screenshot grid trong step report; user
  chọn ô. **Hard stop** — không có Step 5.2 khi chưa chốt.
- **Rollback:** n/a (ngoài repo).
- **Depends on:** Phase 1, 2, 4 merged.

### Step 5.2: Áp giá trị đã chốt

- **File:** `packages/ui/src/styles/theme.css` (alpha default + knob
  saturate/brightness/blur mapping); `packages/ui/src/styles/personalization.css`
  (ma trận soft/strong nếu cần dịch cùng nhịp);
  `packages/ui/src/styles/tokens.css` **chỉ khi** đổi mapping default→rung
  blur (giá trị rung không đổi — non-goal); comment ma trận cập nhật cùng chỗ.
- **Action:** Một diff token thuần; không đụng utility/component.
- **Verification:** `bun --filter @pumni/ui test` (APCA gate + rim guards
  green) && `bun --filter web test` && `bun run build` (bundle-affecting? chỉ
  CSS token — build catalog đủ: `bunx turbo run build --filter=catalog`);
  screenshot pair cuối đính report.
- **Rollback:** revert token diff.
- **Depends on:** 5.1

---

## Thứ tự & song song

```
Phase 1 (F2)  ──┐
Phase 2 (F1)  ──┼── merge riêng rẽ ──> Phase 3 (F5, sau P2)
Phase 4 (F4)  ──┘                      Phase 5 (F3, sau P1+P2+P4)
```

Phase 1, 2, 4 độc lập về hành vi nhưng chạm `glass.css`/`theme.css` chung —
land tuần tự theo số thứ tự để tránh rebase chéo.

## Testing strategy

- Mỗi phase tự gác bằng suite hiện có; chỉ Step 2.3 được rework guard, với
  hành vi thay thế ghi rõ trong diff (alpha-subordination thay
  lightness-subordination; chống "two equal bright rims" vẫn được pin).
- Grain thêm assert mới vào `glass-performance` + `glass-a11y-fallbacks`
  (extend, không viết pattern test mới — `testing-template`).
- Visual: probe Playwright scratchpad chụp before/after mỗi phase; screenshot
  review là hard stop ở 2.3, 4.2, 5.1.
- `bun run ai:premerge` ở cuối mỗi phase (không chạy per-step).

## Definition of Done (mỗi phase = một PR)

1. Gate hẹp nhất của phase green; `ai:premerge` green khi đóng phase.
2. Không file ngoài scope khai báo bị đụng.
3. Docs/skill cập nhật cùng PR khi doctrine đổi (2.3, 4.2, 5.2).
4. Step report theo format review-gate; self-review `review-gate` trước khi
   báo done.
5. Screenshot pair đính report cho mọi phase thị giác.

## Risks & edge cases

| Risk | Mức | Giảm thiểu |
|---|---|---|
| Dark alpha 0.40 rớt gate APCA trên blob tối | Med | Soft dark 0.36 đang pass gate → 0.40 kỳ vọng pass; nếu đỏ, binary-search alpha lên (≤ 0.48) và báo user trước khi chốt |
| Conic rim render khác nhau giữa engine (interpolation góc) | Low | Stops là white cùng hue, chỉ khác alpha — không có hue-arc; visual check Chromium + Firefox trong probe |
| Rework guard 2.3 vô tình mở đường cho "two bright rims" quay lại | Med | Guard mới pin `bottom.alpha < top.alpha` && `side.alpha < bottom.alpha` — quan hệ thứ tự vẫn bị khoá |
| Grain data-URI phồng CSS bundle | Low | SVG ~200 byte; một URL dùng chung cho cả 2 utility |
| Grain overlay làm lệch kết quả APCA composite | Med | Gate hiện mô phỏng saturate/brightness, không mô phỏng grain; opacity 0.05 overlay ≈ ±1 Lc — ghi nhận trong comment gate; nếu muốn chặt chẽ, thêm worst-case ±grain vào simulation cùng diff 4.2 |
| Phase 5 làm chữ trên chrome tier sát sàn Lc 60 | High | Gate là thẩm quyền — ô ma trận nào đỏ thì loại ngay từ 5.1, không thương lượng ở 5.2 |
| User thấy Phase 2+4 đã đủ, Phase 5 thành over-engineering | — | Điểm dừng hợp lệ đã khai báo; Phase 5 chỉ chạy khi user còn muốn sau khi xem kết quả P2/P4 |

## Not yet specified (fog of war)

- **Alpha conic chính xác** (0.45/0.07/0.25) là khởi điểm cho screenshot
  review, không phải giá trị chốt — chốt ở hard stop 2.3.
- **Grain có vào `glass-bar*` không?** Bars là shell chrome mỏng, grain có
  thể thành nhiễu trên topbar/dock — quyết ở screenshot 4.2, mặc định KHÔNG.
- **`--glass-edge` (uniform, bars) có cần hạ alpha 0.55 đồng nhịp với edge-top
  0.45?** Xem xét ở 2.3 khi có screenshot dock cạnh panel.
- **Lc 75 body-floor trên solid inset** (điểm treo từ plan trước) — ngoài
  scope plan này; ghi lại để không mất dấu.

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-11 | Bottom edge đổi ngữ nghĩa: contact shadow → secondary light catch | Fresnel: mép dưới kính thật bắt sáng; idiom 2025–26 (Liquid Glass recreations) đều đối xứng; guard chống "two bright rims" giữ bằng alpha-subordination |
| 2026-07-11 | Light-mode alpha mặc định giữ nguyên ở Phase 1 | Phase 1 chỉ sửa bug dark; mọi thay đổi light dồn về spike Phase 5 có gate + screenshot — tránh trộn 2 thay đổi thị giác một PR |
| 2026-07-11 | Grain mặc định bật trên panel/window (khác plan archive: opt-in) | Mục tiêu là chất kính hệ thống, không phải demo toggle; knob còn lại là token opacity; mọi nhánh suy giảm tắt grain |
| 2026-07-11 | Lensing không mở lại | ADR-0021 là owner; F6 đóng ở mức plan |
