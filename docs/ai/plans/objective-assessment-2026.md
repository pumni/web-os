# Đánh giá khách quan: Token/Theme + Component lõi theo best-practice 2026

> **Trạng thái:** đánh giá + kế hoạch để AI khác thực thi. KHÔNG phải code đã chạy.
> **Góc nhìn:** khách quan theo best-practice & xu hướng hiện đại — gồm cả việc **ghi nhận cái đã tốt** và **khuyến nghị KHÔNG làm** một số thứ. Đây là lớp meta trên 4 plan trước (design-system / dark-theme / core-components / layering-interaction), tránh trùng lặp.

---

## Phần A — Scorecard khách quan (đã đạt chuẩn, đừng đụng)

Để cân bằng (4 plan trước toàn nói "cần sửa"), đây là những thứ hệ thống **đã làm đúng best-practice** và không nên refactor:

| Hạng mục | Đánh giá | Bằng chứng |
| --- | --- | --- |
| OKLCH perceptual color | ★★★★★ | toàn bộ `tokens.css`, ramp chroma taper có chủ đích |
| 3-tier token + enforce | ★★★★★ | ESLint `pumniNoRawColor` + test, hiếm dự án làm tới |
| Contrast = APCA-only | ★★★★★ | đúng hướng WCAG 3.0, đã thống nhất |
| Halation compensation (dark) | ★★★★☆ | weight 400→350, tracking +0.01em |
| Motion token bridge JS⇄CSS có test | ★★★★★ | `motion-tokens.test.ts` chống drift |
| Glass a11y fallback | ★★★★★ | reduced-transparency/contrast/forced-colors |
| z-index token scale (ý tưởng) | ★★★★☆ | thang owned; chỉ thiếu 2 tầng (layering plan §1) |
| **React 19 ref-as-prop** (không `forwardRef`) | ★★★★★ | `{...props}` spread — **đúng mẫu mới**, KHÔNG phải thiếu sót |
| `data-slot`/`data-variant` styling hooks | ★★★★★ | nhất quán toàn bộ |

**Kết luận A:** nền tảng token/theme đã ở nhóm đầu. Các "nâng cấp" còn lại là **hoàn thiện rìa**, không phải đại tu. Cảnh giác với việc refactor cái đã tốt.

---

## Phần B — Gap thật theo best-practice (CHƯA có trong 4 plan)

### B1. Palette data-viz chưa kiểm CVD (colorblind) — gap thật, ưu tiên cao nếu có dashboard
`chart-1..5` = cyan(202°) · indigo(277°) · emerald(163°) · amber(70°) · rose(15°).
- **Vấn đề:** chọn theo hue brand, **chưa kiểm deuteranopia/protanopia** (8% nam giới). emerald(163) vs amber/rose dễ lẫn ở CVD; cyan vs indigo gần nhau. Chuỗi categorical tốt phải khác cả **lightness** (không chỉ hue) để phân biệt khi mù màu / in đen trắng.
- **Việc:** (a) chạy 5 stop qua trình mô phỏng CVD; (b) chênh lệch L giữa các series ≥ ~0.1 để phân biệt theo độ sáng; (c) cân nhắc thứ tự series để 2 màu cạnh nhau tương phản tối đa; (d) **bổ sung ramp sequential + diverging** (hiện chỉ có categorical) nếu cần heatmap/metric đơn. Thêm test L-distinctness vào `glass-contrast.test.ts` (cùng cơ chế resolve OKLCH sẵn có).
- **Không cần đổi hue brand** — chỉ tinh chỉnh L/thứ tự + kiểm.

### B2. Thiếu Typography primitive — type đang áp ad-hoc → drift
- **Hiện trạng:** có **token** type đầy đủ (`text-xs..4xl` + line-height + weight + tracking) nhưng **không có component/utility role**. Type được ghép tay khắp nơi: `font-bold text-lg tracking-tight` (bento), `font-semibold` (CardTitle), `text-sm text-muted-foreground` (CardDescription)… Mỗi chỗ một kiểu → đây chính là loại drift mà token sinh ra để chặn, nhưng tầng "ráp" đang hở.
- **Đề xuất (xu hướng hiện đại):** thêm primitive nhẹ `Text` / `Heading` (hoặc bộ `@utility` type-role: `type-display / type-title / type-body / type-caption / type-label`) gói sẵn size+weight+tracking+leading theo vai trò. CardTitle/Description, Bento title… consume role thay vì ghép tay.
- **Lợi ích:** một nguồn chân lý cho typography như radius/motion đã có. Ưu tiên **trung bình-cao** (nền tảng cho mọi text).

### B3. Physical properties → không RTL-safe (i18n readiness)
- **Hiện trạng:** 36 chỗ dùng `pl-/pr-/ml-/mr-/left-/right-/rounded-l*` (nhiều nhất ở `dropdown-menu`, `context-menu`, `select`, `sheet`). Khi thêm ngôn ngữ RTL (Ả Rập/Do Thái) sẽ vỡ bố cục.
- **Đề xuất:** chuyển sang **logical properties** (`ps-/pe-/ms-/me-/start-/end-/rounded-s*/rounded-e*`). Tailwind v4 hỗ trợ sẵn.
- **Ưu tiên khách quan:** **THẤP nếu roadmap chỉ LTR (Việt/Anh)** — nhưng adopt logical ngay khi *viết mới* thì gần như miễn phí và tránh retrofit về sau. Khuyến nghị: ra **quy ước "logical-first"** cho code mới, migrate dần file cũ, KHÔNG làm big-bang.

### B4. Focus ring trên fill có màu — kiểm tương phản
- `--ring` (cyan) dùng đồng nhất. Trên `Button variant="default"` (nền cyan `--primary`) ring cyan có thể **chìm vào nút**. Best-practice: ring cần tương phản với CẢ nền trang và nền nút (thường dùng ring + **offset** màu nền, hoặc ring sáng/tối tương phản kép).
- **Việc:** thêm `ring-offset` (token `--ring-offset` đã đề ở core-components §1.4) để tách ring khỏi fill; hoặc đảo ring sang `--background`-contrast trên nút đậm. Gate bằng quan sát + APCA ring/UI ≥ Lc 25.

### B5. Thiếu `info` status? — KHÔNG, đây là non-gap (đánh giá khách quan)
- Nhiều hệ có `info` (xanh dương). **Nhưng `--primary` của dự án đã là cyan/xanh** → thêm `info` sẽ trùng tín hiệu với primary, gây nhiễu. **Khuyến nghị: KHÔNG thêm `info`.** Dùng `primary` tint cho thông báo trung tính (đã có pattern status-tint `/10+/20`). Ghi nhận để khỏi ai đó "bổ sung cho đủ bộ".

---

## Phần C — Cảnh báo over-engineering (khách quan = cũng phải nói cái nên BỎ)

4 plan đã tích lũy nhiều ý tưởng. Nhìn lạnh, vài thứ **rủi ro gimmick / chi phí > giá trị**:

| Hạng mục (plan) | Đánh giá khách quan | Khuyến nghị |
| --- | --- | --- |
| Card `variant="spotlight"` (design-system §4) | Đẹp nhưng pointer-tracking = client + listener; giá trị thẩm mỹ, không chức năng | **Hoãn** — chỉ làm nếu có nhu cầu marketing/landing cụ thể |
| Holographic/collectible card | Lệch brand OS công cụ | **Bỏ** |
| Density tokens (layering §4) | Hữu ích cho dashboard mật độ cao, nhưng phạm vi lớn | **Hoãn** tới khi có dashboard thật yêu cầu |
| Card state machine (đã làm) | OK nếu có form/async thật dùng | Kiểm **usage thật** trước khi mở rộng thêm state |
| State-layer tokens (layering §3) | Đúng chuẩn M3, nhưng đụng mọi control | Làm, nhưng **sau** bugfix; cần đồng thuận con số |
| "Dim" dark variant (dark §4) | Nice-to-have | **Hoãn** |

**Nguyên tắc:** ưu tiên **bugfix + guardrail cleanup** (giá trị chắc chắn) trước **tính năng thẩm mỹ** (giá trị suy đoán).

---

## Phần D — Thứ tự ưu tiên hợp nhất (toàn bộ 5 plan)

Xếp theo **value/effort** khách quan:

**Tier 1 — làm ngay (bug/guardrail, rủi ro thấp, giá trị chắc):**
1. Z-index `--z-popover`/`--z-tooltip` + remap (layering §1) — **bugfix thật**.
2. Surface-opacity & shadow drift cleanup (core-components §A/§B).
3. `transition-all` → scoped (layering §2).
4. Motion token còn thiếu — nếu chưa xong (design-system §1).

**Tier 2 — nền tảng (giá trị cao, phạm vi vừa):**
5. Dark elevation ramp `--neutral-880/860` + tách `--popover` (dark §1).
6. Typography primitive / type-role utilities (B2).
7. `--field` + `--shadow-control` + focus-ring token (core-components §1).
8. Chart palette CVD + L-distinctness (B1).

**Tier 3 — hoàn thiện (làm khi có dư địa):**
9. State-layer tokens (layering §3).
10. Bento 12-col refactor (design-system §2) — nếu có màn dashboard thật.
11. Logical-first cho code mới (B3).

**Tier 4 — hoãn/bỏ:** spotlight, holographic, density, dim-dark, info-status.

---

## Phần E — Độ phủ & cổng
- **Đã quét lại toàn bộ 26 component** ở các lượt trước (z, motion, sizing, màu, physical-props, ref pattern, typography). Phần B là kết quả góc nhìn best-practice (không phải drift đơn thuần).
- **Cổng mọi thay đổi:** `bun run ai:check` · `bun run lint` · `bun run typecheck` · `bun run test` (APCA + motion-bridge + chart-distinctness nếu thêm) · visual `bunx playwright test design-system-visual`.

## Phần F — KHÔNG làm
- Không refactor phần Scorecard A đã đạt chuẩn (đặc biệt: **đừng thêm `forwardRef`** — ref-as-prop đang đúng React 19).
- Không thêm `info` status (trùng primary).
- Không big-bang RTL; không chạy theo tính năng thẩm mỹ trước khi xong Tier 1.
- Không thêm token màu mới ngoài việc tinh chỉnh L/thứ tự chart đã có.
