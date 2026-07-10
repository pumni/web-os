# Nghiên cứu: cấu hình & thiết kế hiệu ứng glass theo chuẩn web mới nhất — 07/2026

> Báo cáo nghiên cứu từ 30 nguồn bắt buộc trong `V:\nguồn glass effect.md`
> (nhóm A–G: W3C → MDN → Myndex/APCA → thư viện OKLCH+APCA → Apple HIG →
> Chrome/web.dev → bài chuyên gia). Toàn bộ nguồn đã được fetch trực tiếp ngày
> 2026-07-11; tình trạng fetch từng nguồn ở Phụ lục §10. Đây là tài liệu
> nghiên cứu (research), không phải doctrine — doctrine hiện hành của repo nằm
> ở `docs/conventions/design-system.md`.

---

## 1. Kết luận điều hành (TL;DR)

1. **`backdrop-filter` đã Baseline 2024** (mọi engine lớn từ 09/2024) nhưng
   spec của nó (Filter Effects Module Level 2) **vẫn chỉ là Editor's Draft,
   chưa có consensus của Working Group** — dùng được trong sản xuất, nhưng khi
   trích dẫn "chuẩn" phải ghi rõ trạng thái draft.
2. Hệ màu cho glass hiện đại nên xây trên **OKLCH** (CSS Color 4 — Candidate
   Recommendation Draft 18/06/2026, Baseline Widely Available từ 05/2023):
   lightness tri giác đồng nhất → kiểm soát được độ tương phản trên nền mờ.
3. **`color-mix()` (mặc định nội suy Oklab, alpha premultiplied)** và
   **relative color syntax** là hai công cụ CSS gốc để sinh biến thể màu glass
   (tint, alpha, hover) từ một token gốc — cả hai đã interop đủ dùng.
4. Kiểm soát tương phản chữ trên glass phải dùng **APCA (Lc)** thay vì tỉ lệ
   WCAG 2 — WCAG 2 sai lệch nặng ở màu tối/dark-mode. APCA là ứng viên WCAG 3,
   **chưa phải chuẩn ban hành** (beta 0.1.x, thuật toán 0.0.98G-4g) → tính
   bằng thư viện (`apca-w3`, `apcach`, Color.js), **không** chờ
   `contrast-color()` của CSS (Level 6 hiện chỉ hỗ trợ WCAG 2.1 và gắn cờ
   "Not Ready For Implementation").
5. Chuẩn công nghiệp về *thiết kế* glass 2025–2026 là **Apple Liquid Glass**:
   glass chỉ dành cho **tầng điều hướng nổi trên nội dung**, không bao giờ
   glass-trên-glass, không glass cho tầng nội dung, biến thể *clear* bắt buộc
   kèm lớp dimming (~35 % khi nền sáng), và mọi hiệu ứng phải suy giảm theo
   Reduce Transparency / Increase Contrast / Reduce Motion.
6. Bẫy kỹ thuật số một khi triển khai: **Backdrop Root** — tổ tiên mang
   `opacity < 1`, `filter`, `mask`, `clip-path`, `mix-blend-mode` hoặc
   `will-change` tương ứng sẽ chặn phạm vi blur của con; đồng thời
   `backdrop-filter ≠ none` tự tạo stacking context + containing block cho
   con `absolute`/`fixed`.

---

## 2. Nền tảng spec W3C (nhóm A)

### 2.1 `backdrop-filter` — Filter Effects Module Level 2

Nguồn: Editor's Draft 23/01/2026 (drafts.csswg.org/filter-effects-2) + MDN.

- **Định nghĩa hình thức**: `backdrop-filter: none | <filter-value-list>`;
  initial `none`; không kế thừa; animatable theo danh sách filter function.
  Nhận đủ bộ filter: `blur() brightness() contrast() drop-shadow() grayscale()
  hue-rotate() invert() opacity() saturate() sepia()` và SVG filter qua
  `url()`, cho phép chuỗi nhiều filter.
- **Cách ảnh backdrop được dựng (Backdrop Root Image)**: tìm tổ tiên Backdrop
  Root gần nhất → vẽ mọi nội dung theo painting order giữa tổ tiên đó và phần
  tử → flatten vào buffer 2D screen-space → áp filter lên **toàn bộ** buffer →
  áp inverse transform nếu có transform xen giữa → **clip theo border-box của
  phần tử, tôn trọng `border-radius`**. Blur dùng `edgeMode="mirror"` tại mép
  đã clip (nên mép glass không bị "rò" màu đen).
- **Phần tử tạo Backdrop Root**: root element; mọi phần tử có `filter ≠ none`,
  `opacity < 1`, `mask`/`mask-image`/`clip-path ≠ none`,
  `backdrop-filter ≠ none`, `mix-blend-mode ≠ normal`, hoặc `will-change` khai
  báo các thuộc tính đó. Hệ quả thực dụng (MDN nhấn mạnh): cha có
  `opacity: .9` ⇒ con chỉ blur được nội dung *bên trong* cha, không blur được
  nền trang — đúng cái bẫy đã pin trong
  `glass-backdrop-root-trap.test.ts` của repo.
- **Side effect**: giá trị khác `none` tạo **stacking context và containing
  block** cho descendant `absolute`/`fixed` (trừ root).
- **Trạng thái chuẩn**: Editor's Draft, "drafted for discussion, does not yet
  have Working Group consensus"; định nghĩa Backdrop Root vẫn là open issue
  (fxtf-drafts #53). **Chưa phải W3C Recommendation** — trái với hỗ trợ trình
  duyệt đã rộng (MDN: **Baseline 2024, newly available từ 09/2024**; Safari
  từng cần prefix `-webkit-backdrop-filter`, Firefox ship muộn nhất).
- **Điều kiện nhìn thấy hiệu ứng**: phần tử hoặc background của nó phải trong
  suốt một phần (ví dụ `background: rgb(255 255 255 / .2)`), vì filter áp lên
  những gì *phía sau*.

### 2.2 CSS Color Module Level 4 — `oklch()` / `oklab()`, wide gamut

Nguồn: w3.org/TR/css-color-4 — **W3C Candidate Recommendation Draft
18/06/2026** (đang giai đoạn implementation testing, chưa Recommendation).

- Cú pháp: `oklch( [<number>|<percentage>|none]{3} [ / [<alpha-value>|none] ]? )`
  — L (0–1 hoặc 0–100 %), C (chroma, thực dụng 0–0.4; `100 % = 0.4`), H
  (0–360°), alpha mặc định 100 %. `oklab()` thay C/H bằng hai trục Descartes
  a (đỏ↔lục) / b (vàng↔lam).
- Lý do tồn tại: **tri giác đồng nhất** — khoảng cách số ≈ khoảng cách cảm
  nhận, khắc phục sRGB/HSL nơi "lightness" không tương quan độ sáng thật.
- **Gamut mapping** cho màu ngoài gamut đích: giảm chroma / clip có kiểm soát
  (binary search + local MINDE, v.v.) giữ hue và lightness cảm nhận.
- Wide gamut qua `color()`: `srgb`, `display-p3`, `rec2020`, `a98-rgb`,
  `prophoto-rgb`, `xyz[-d50|-d65]`. P3 rộng hơn sRGB ~50 % thể tích Lab
  (1.233M vs 0.820M đơn vị Lab).

### 2.3 CSS Color Level 5 — `color-mix()`, relative color syntax

Nguồn: WD 18/06/2026 + ED cùng ngày.

- **`color-mix( <color-interpolation-method>?, [<color> && <percentage>?]# )`**
  — **mặc định nội suy trong Oklab** nếu không chỉ định; phần trăm chuẩn hoá
  về 100 %; **alpha premultiplied** trước khi nội suy (spec dẫn ví dụ: bỏ
  premultiply gây sai ΔE ≈ 30.7 — quan trọng khi mix màu bán trong suốt cho
  glass); không gian trụ (hsl/lch/oklch) mặc định hue `shorter`.
- **Relative color syntax**: `oklch(from <color> l c h / alpha)` + `calc()`
  trên từng kênh; kênh màu **không clamp** (giữ out-of-gamut), alpha clamp
  [0,1]; có dạng rút gọn `alpha(from <color> / <alpha-value>)` chỉ chỉnh
  alpha. Kênh resolve về number (oklch: l∈0–1, c: 0.4 = 100 %, h: độ).
- `contrast-color()` **vẫn nằm ở Level 5 §8 nhưng gắn cờ at-risk** (có thể bị
  bỏ trước CR); các mục at-risk khác: Custom Color Spaces, `@color-profile`,
  `device-cmyk()`, Relative Alpha Colors.

### 2.4 CSS Color Level 6 — `contrast-color()`, `color-layers()`

Nguồn: ED 11/01/2026 (URL `w3c.github.io/csswg-drafts/css-color-6/` redirect
301 về `drafts.csswg.org/css-color-6/` — đã fetch bản đích).

- `contrast-color()` phiên bản Level 6: nhận màu gốc + vai trò fg/bg (keyword
  còn "tbd") + target contrast; ứng viên mặc định là trắng/đen. **Thuật toán
  hiện chỉ có WCAG 2.1 luminance** `(Yl + 0.05)/(Yd + 0.05)` với keyword
  `aa`/`aaa`/`large` — spec tự thừa nhận thuật toán này "có vấn đề đã biết
  trên nền tối" và sẽ bổ sung phương pháp khác (ngụ ý APCA) sau.
- `color-layers([<blend-mode>,]? <color>#)` — composite nhiều lớp màu bằng
  toán tử source-over (Compositing 1); đúng mô hình "nhiều lớp kính".
- Toàn spec mang cảnh báo **"Not Ready For Implementation"**.

**Hệ quả cho glass**: chưa được dựa vào `contrast-color()` để đảm bảo chữ đọc
được trên glass — phải tính APCA bằng thư viện tại build-time/design-time (§4).

---

## 3. OKLCH làm xương sống hệ màu glass (nhóm B, F, G)

### 3.1 Vì sao OKLCH thay hex/rgb/hsl (Evil Martians + Chrome)

- **HSL**: mỗi hue có cùng thang S/L 0–100 % trong khi mắt người không thấy
  vậy ⇒ đổi hue là đổi luôn độ sáng thật; `darken()` kiểu SASS cho kết quả
  khó lường; **không biểu diễn được màu P3**.
- **Lab/LCH (CIE)**: dính bug hue-shift ở dải lam (hue 270–330: giảm chroma
  làm lam trôi sang tím). **Oklab/OKLCH (Björn Ottosson, 2020) sửa đúng lỗi
  này** — không hue-shift khi chỉnh C/L.
- **OKLCH vs Oklab**: cùng không gian, khác hệ toạ độ; OKLCH (trụ: C, H) dễ
  đọc cho con người và design token; Oklab (Descartes: a, b) là **không gian
  mặc định cho animation/nội suy** (Chrome khuyến nghị; `color-mix()` cũng
  mặc định Oklab) vì gradient không "chết vùng xám" như sRGB.
- **Tương phản dự đoán được** — luận điểm ăn tiền nhất cho glass: vì L là
  lightness tri giác thật, có thể đặt ngưỡng kiểu "mọi fill nền có L ≥ 0.87
  thì chữ đen luôn đủ tương phản" bất kể hue — điều HSL không thể.
- Lưu ý hue: `0°` trong OKLCH ≈ magenta (gốc CIELab), **đỏ ≈ 41°** — khác
  HSL (0° = đỏ). Trong `calc()` trên kênh phải cộng number, không cộng `%`.

### 3.2 Hỗ trợ trình duyệt & fallback

| Tính năng | Chrome/Edge | Firefox | Safari | Trạng thái |
|---|---|---|---|---|
| `oklch()`/`oklab()`/`lch()`/`lab()` | 111 | 113 | 15.4 | Baseline Widely Available (05/2023) |
| `color()` + display-p3 | 111 | 113 | 15 | Baseline |
| `color-mix()` | 111 | 113 | 16.2 | Interop toàn engine |
| Relative color syntax | 119 | ✅ (muộn hơn) | ✅ | Khả dụng rộng, detect bằng `@supports (color: rgb(from white r g b))` |
| `backdrop-filter` | ✅ | ✅ | ✅ (lịch sử `-webkit-`) | **Baseline 2024** (09/2024) |
| `contrast-color()` | — | — | (thử nghiệm) | Đừng dùng sản xuất |

Mẫu fallback chuẩn (Evil Martians):

```css
.glass-accent { background: oklch(0.6973 0.155 112.79); }        /* sRGB-safe */
@media (color-gamut: p3) {
  .glass-accent { background: oklch(0.6973 0.176 112.79); }      /* chroma cao hơn */
}
```

Caveat gamut: Chrome/Safari hiện **clip nhanh thay vì gamut-map chuẩn OKLCH**
khi màu vượt gamut ⇒ có thể lệch hue nhẹ; tự viết override P3 thay vì phó mặc
trình duyệt. Tooling cưỡng chế: `stylelint` + `stylelint-gamut`
(`gamut/color-no-out-gamut-range`), `npx convert-to-oklch` để di trú codebase.

### 3.3 Công thức sinh biến thể màu glass bằng CSS gốc

```css
:root { --glass-tint: oklch(0.72 0.11 240); }

/* nền glass: tint + alpha, mix trong oklab (premultiplied) */
.glass {
  background: color-mix(in oklab, var(--glass-tint) 22%, transparent);
  backdrop-filter: blur(20px) saturate(1.4);
}
/* biến thể sáng/tối cùng hue — relative color syntax */
.glass:hover  { background: oklch(from var(--glass-tint) calc(l + .08) c h / .28); }
.glass-border { border-color: oklch(from var(--glass-tint) calc(l + .2) c h / .35); }
/* chỉ chỉnh alpha */
.glass-muted  { background: alpha(from var(--glass-tint) / .12); }
```

Chrome blog xác nhận các recipe: lighten/darken bằng `calc(l ± Δ)` trong
OKLCH (không gian "cho kết quả dự đoán được nhất"), palette đơn sắc từ một
token, biến thể tương phản bằng delta L ≈ 0.6.

---

## 4. Tương phản trên glass: APCA / WCAG 3 (nhóm C)

### 4.1 Vì sao không dùng tỉ lệ WCAG 2 cho glass

APCA (Accessible Perceptual Contrast Algorithm, từ nghiên cứu SAPC của Andrew
Somers — W3C Invited Expert, ứng viên cho WCAG 3) đo **Lc (lightness
contrast)** gắn trực tiếp với đường cong nhạy tương phản không gian của mắt.
WCAG 2 dùng tỉ lệ `(Y+0.05)/(Y+0.05)`:

- **phóng đại tương phản ở màu tối** — cặp màu "đạt 4.5:1" trên nền tối có thể
  không đọc nổi; "không thể hướng dẫn hữu ích cho dark mode";
- bỏ qua **cỡ/đậm chữ và cực tính** — hai yếu tố quyết định trên glass, nơi
  nền biến thiên liên tục.

Glass là bề mặt bán trong suốt trên nội dung động ⇒ tương phản thực tế dao
động theo backdrop; APCA (đo được cả hai cực tính, có bù ambient cho màu rất
tối) là công cụ đúng. **Trạng thái**: beta/ứng viên WCAG 3 — dùng làm chuẩn
nội bộ được (kèm accessibility statement), chưa phải chuẩn pháp lý thay
WCAG 2.

### 4.2 Thang Lc và bảng tra (tổng hợp Easy Intro + Nutshell + Calculator)

Lc dương = chữ tối/nền sáng (0…106); **Lc âm = chữ sáng/nền tối (0…−108,
dark mode)**. Mức "AAA-tương-đương" = mức AA + 15.

| Lc | Vai trò | Ví dụ cỡ/đậm tối thiểu (x-height ≈ 0.52, chuẩn Helvetica) |
|---|---|---|
| **90** | Body text ưu tiên (đọc trôi chảy) | 18px/300 hoặc 14px/400; cũng là *trần* khuyến nghị cho chữ rất to đậm ≥ 36px |
| **75** | Sàn cho cột body text | 24px/300 · 18px/400 · 16px/500 · 14px/700 |
| **60** | Sàn cho chữ nội dung không-body | 48px/200 · 36px/300 · 24px/400 · 18px/600 · 16px/700 |
| **45** | Sàn cho headline / chữ to đậm | 36px/400 hoặc 24px/700; icon nét mảnh |
| **30** | Sàn tuyệt đối cho spot text | placeholder, disabled, copyright; icon đặc ≥ 5.5px |
| **15** | Sàn tuyệt đối cho phi-văn-bản | divider, outline focus ≥ 5px; **dưới 15 coi như vô hình** |

Font khác Helvetica phải quy đổi theo x-height (Times ≈ 0.45 ⇒ tăng cỡ ~16 %).
Ghi chú vận hành từ calculator: body text dưới Lc 75 phải cộng 15; sub-fluent
được trừ 15 (sàn 30); spot text trừ 25 (sàn 30).

### 4.3 API tính APCA trong pipeline

```js
// apca-w3 (bản cấp phép W3/AGWG; thuật toán 0.0.98G-4g, lib 0.1.9 beta)
import { APCAcontrast, sRGBtoY, calcAPCA, fontLookupAPCA, reverseAPCA,
         displayP3toY, alphaBlend } from 'apca-w3';
const lc = APCAcontrast(sRGBtoY([17,17,17]), sRGBtoY([232,230,221]));
const sizes = fontLookupAPCA(-68.5); // [Lc, minPx cho weight 100..900]
```

Lưu ý khi đo chữ trên glass: **phải `alphaBlend()` màu chữ/nền bán trong suốt
về màu hiệu dụng trước khi tính Y** — APCA nhận màu đã composite.

```js
// apcach — "compose màu OKLCH theo Lc mục tiêu" (MIT, production-ready)
import { apcach, crToBg, crToFg, maxChroma, apcachToCss } from 'apcach';
apcach(60, 0.2, 145);                       // fg trên nền trắng, Lc 60
apcach(crToBg('#E8E8E8', 60), 0.2, 145);    // fg trên nền tuỳ ý
apcach(crToFg('white', 60), maxChroma(), 145); // nền đậm nhất còn giữ Lc 60
apcachToCss(c, 'p3');                        // xuất color(display-p3 …)
// hướng tìm kiếm 'lighter'/'darker', gamut 'p3' (mặc định) hoặc 'srgb'
```

apcach đảo đúng bài toán thiết kế glass: cố định Lc + hue, để thư viện giải L
— hợp để **sinh token màu chữ/fill từ token nền glass**.

```js
// Color.js (Lea Verou & Chris Lilley — hai editor của chính CSS Color spec)
import Color from 'colorjs.io';
new Color('oklch(72% .11 240)').contrast('#111', 'APCA'); // cũng có WCAG21
c.to('oklch'); c.toGamut({ space: 'p3' }); Color.mix(a, b, .5, {space:'oklab'});
```

Color.js đồng thời là **prototype của spec** (nội suy đúng CSS Color 4, gamut
mapping thật thay vì clip, ΔE 2000/OK…, tiền thân của đề xuất Color API cho
WICG) — dùng làm "nguồn chân lý" khi cần kiểm chứng hành vi spec. Hệ sinh thái
phụ trợ: oklch.com (picker, hiển thị biên sRGB/P3/Rec2020 + fallback theo
chroma), OkColor (Figma, OKLCH/OkHSL + APCA + WCAG trên nền Culori),
bridge-pca (biến thể APCA tương thích ngược WCAG 2 khi cần tuân thủ pháp lý).

---

## 5. Chuẩn thiết kế công nghiệp: Apple Liquid Glass 2025–2026 (nhóm E)

Nguồn: HIG Materials + Liquid Glass Technology Overview (fetch qua endpoint
JSON chính thức của Apple docs vì trang là SPA) + transcript WWDC25 §219.

### 5.1 Bản chất vật liệu

- **Lensing thay vì scatter**: glass tự định nghĩa bằng khúc xạ/bẻ cong ánh
  sáng động chứ không chỉ blur; xuất hiện/biến mất bằng cách điều biến độ bẻ
  cong ánh sáng (không fade).
- **Nhiều lớp thích ứng**: lớp highlight (theo hình học + chuyển động thiết
  bị), lớp shadow (đậm lên trên chữ, nhạt đi trên nền sáng), tint + dynamic
  range dịch chuyển liên tục để giữ legibility.
- **Ứng xử vật lý**: gel-like khi chạm; phần tử "nổi lên" tầng glass lúc
  tương tác rồi hạ xuống; glass to hơn ⇒ mô phỏng kính dày hơn (bóng sâu hơn,
  lensing rõ hơn); ánh sáng môi trường từ nội dung màu lân cận "tràn" lên bề
  mặt (sidebar iPad/Mac).

### 5.2 Hai biến thể và luật chọn

| | **Regular** (mặc định) | **Clear** (đặc biệt) |
|---|---|---|
| Ứng xử | Đầy đủ thích ứng: blur + chỉnh luminosity nền, tự lật sáng/tối, tự bù legibility | Trong suốt cố định, **không** thích ứng |
| Khi dùng | Hầu hết mọi nơi; component nhiều chữ (alert, sidebar, popover) | Chỉ khi đủ **3 điều kiện**: nổi trên media giàu hình ảnh; nội dung dưới chịu được dimming; nội dung trên glass đậm & sáng |
| Điều kiện kèm | — | **Bắt buộc lớp dimming** (nền sáng: tối ~35 % opacity; nền đủ tối / media control AVKit chuẩn: khỏi cần) |
| Cấm | — | Không trộn Regular và Clear trong cùng ngữ cảnh |

Quy tắc lật sáng/tối: phần tử **nhỏ** (tab bar, glyph) tự lật theo nền để tối
đa tương phản; phần tử **lớn** (menu, sidebar) không lật (diện tích lớn, lật
gây nhiễu) — chỉ thích ứng mềm.

### 5.3 Luật cấu trúc (chuyển thẳng được sang web)

1. **Glass = tầng điều hướng nổi trên nội dung** (bars, controls, menu,
   modal, search). **Không bao giờ** áp glass cho tầng nội dung (bảng, list,
   vùng cuộn, form) — nội dung dùng fill đặc.
2. **Không glass chồng glass.** Phần tử trên bề mặt glass dùng fill/vibrancy/
   transparency như "lớp mỏng thuộc về vật liệu", không phải tấm kính thứ hai.
3. **Tint có chọn lọc** — chỉ hành động chính; tint mọi thứ ⇒ không gì nổi
   bật. Tint đúng là *dải tông* ánh xạ theo độ sáng nền phía sau (như kính
   màu thật), không phải fill đặc.
4. **Scroll edge effect**: khi nội dung cuộn dưới glass, làm tan dần nội dung
   sát mép để giữ tách bạch; nội dung tối chui xuống ⇒ glass chuyển style tối
   và chuyển sang dimming tinh tế. (Tương đương web: dải gradient/mask ở mép
   cuộn dưới header glass.)
5. **Steady state tránh giao cắt** giữa nội dung và glass — bố cục sao cho
   nội dung quan trọng không nằm kẹt dưới glass lúc nghỉ.

### 5.4 Độ dày vật liệu & vibrancy (materials chuẩn, không phải Liquid Glass)

iOS/tvOS: 4 mức `ultraThin / thin / regular / thick` — dày hơn = đục hơn =
tương phản chữ tốt hơn; mỏng hơn = giữ ngữ cảnh nền. Chữ trên material dùng
**vibrant color hệ thống** (label → quaternaryLabel; tránh quaternary trên
thin/ultraThin) thay vì màu thường — tự thích ứng nền. **Chọn material theo
ngữ nghĩa, không theo màu nhìn thấy** (settings hệ thống có thể đổi diện mạo).

### 5.5 Accessibility — bắt buộc, không phải tuỳ chọn

| Setting | Ứng xử glass |
|---|---|
| Reduce Transparency | Glass "đục như sương", che nội dung sau nhiều hơn |
| Increase Contrast | Chuyển chủ đạo đen/trắng + viền tương phản |
| Reduce Motion | Giảm cường độ hiệu ứng, tắt đàn hồi |

Tương đương web: `@media (prefers-reduced-transparency: reduce)`,
`(prefers-contrast: more)`, `(prefers-reduced-motion: reduce)` phải có nhánh
suy giảm cho mọi bề mặt glass. Không bao giờ truyền đạt thông tin *chỉ* bằng
độ trong suốt.

---

## 6. Tổng hợp: công thức glass "chuẩn 2026" cho web

Kết nối cả ba trục nguồn (spec CSS + APCA + Liquid Glass):

```css
/* Token gốc — một nguồn chân lý, OKLCH */
:root {
  --glass-tint: oklch(0.75 0.06 240);
  --glass-alpha: 22%;
  --glass-blur: 20px;
}

.glass-surface {
  /* 1. Nền bán trong suốt — bắt buộc để backdrop-filter hiển thị (MDN) */
  background: color-mix(in oklab, var(--glass-tint) var(--glass-alpha), transparent);
  /* 2. Blur + saturate: bù độ bão hoà mất đi khi blur (mô phỏng "lensing" mềm) */
  backdrop-filter: blur(var(--glass-blur)) saturate(1.4);
  /* 3. Rim sáng mỏng = mép kính bắt sáng; sinh từ cùng token */
  border: 1px solid oklch(from var(--glass-tint) calc(l + .2) c h / .35);
  border-radius: 16px;
  /* 4. Bóng đổ tách tầng nổi khỏi nội dung */
  box-shadow: 0 8px 32px oklch(0 0 0 / .12);
}

/* Fallback khi thiếu backdrop-filter: tăng độ đục để giữ legibility */
@supports not (backdrop-filter: blur(1px)) {
  .glass-surface { background: color-mix(in oklab, var(--glass-tint) 88%, transparent); }
}
/* Suy giảm accessibility (mô hình Liquid Glass) */
@media (prefers-reduced-transparency: reduce) {
  .glass-surface { backdrop-filter: none;
    background: color-mix(in oklab, var(--glass-tint) 94%, transparent); }
}
@media (prefers-contrast: more) {
  .glass-surface { backdrop-filter: none; background: Canvas;
    border-color: CanvasText; }
}
```

Kèm các luật phi-CSS:

1. **Vị trí**: chỉ tầng nổi (header, dock, palette, popover) trên backdrop có
   màu sắc; nội dung đặc — đúng cả Liquid Glass lẫn doctrine repo.
2. **Không glass chồng glass; không glass cho form/bảng/văn bản dài.**
3. **Tương phản**: mọi cặp chữ/nền-glass phải qua APCA sau khi
   `alphaBlend()` với *trường hợp backdrop xấu nhất* (sáng nhất và tối nhất
   mà bề mặt có thể trôi qua). Sàn thực dụng: Lc 75 cho chữ đọc, Lc 60 cho
   chữ phụ ≥ 16px/700, Lc 15 cho hairline. Sinh token bằng apcach hoặc test
   bằng Color.js/apca-w3 trong CI (repo đã có `glass-contrast` test — đúng
   hướng).
4. **Backdrop-root trap**: cấm tổ tiên của glass mang `opacity < 1`,
   `mix-blend-mode`, `filter`, `mask`, `clip-path`, `will-change` tương ứng.
   Ngược lại, có thể **cố ý** đặt một backdrop root để giới hạn phạm vi blur
   (rẻ hơn cho GPU).
5. **Hiệu năng**: `backdrop-filter` là hiệu ứng GPU đắt (dựng buffer riêng
   mỗi lần vẽ) — giới hạn số bề mặt đồng thời, tránh animate bán kính blur,
   ưu tiên animate opacity/transform của chính bề mặt.
6. **Dark mode**: định nghĩa lại token OKLCH trong
   `prefers-color-scheme: dark` (giữ nguyên component CSS); nhớ Lc âm có
   thang riêng (đến −108) và màu rất tối cần "boost" — không tái dùng ngưỡng
   dương một cách mù quáng.

---

## 7. Trạng thái chuẩn hoá — điều phải nói rõ khi trích dẫn

| Tính năng | Spec | Trạng thái 07/2026 | Dùng sản xuất? |
|---|---|---|---|
| `backdrop-filter` | Filter Effects 2 | **ED, chưa WG consensus** (Backdrop Root còn open issue) | ✅ (Baseline 2024) — trích dẫn phải kèm caveat draft |
| `oklch()`/`oklab()` | CSS Color 4 | **CR Draft 18/06/2026** | ✅ (Baseline 2023) |
| `color-mix()`, RCS | CSS Color 5 | WD/ED 18/06/2026 | ✅ (interop; RCS từ Chrome 119) |
| `contrast-color()` | Color 5 (at-risk) / Color 6 | ED, WCAG2-only, "Not Ready For Implementation" | ❌ — tính APCA bằng thư viện |
| `color-layers()` | CSS Color 6 | ED | ❌ |
| APCA | ứng viên WCAG 3 | Thuật toán 0.0.98G-4g ổn định; lib beta; WCAG 3 chưa ban hành | ✅ làm chuẩn nội bộ; chưa thay WCAG 2 về pháp lý |
| Liquid Glass | Apple HIG | Chuẩn công nghiệp de-facto (không phải W3C) | ✅ làm design doctrine |

---

## 8. Đối chiếu nhanh với doctrine hiện có của repo

`docs/conventions/design-system.md` hiện hành đã khớp các trục chính của
nghiên cứu này: glass chỉ ở tầng nổi trên backdrop màu, nội dung đặc; APCA
Lc 60 cho text-on-fill có test `glass-contrast` gác; bẫy backdrop-root pin
bằng `glass-backdrop-root-trap.test.ts`; blur chỉ qua utility `glass-*` /
`GlassSurface`. Khoảng chênh đáng cân nhắc (ghi nhận, **không** phải đề xuất
đổi doctrine trong báo cáo này):

- Doctrine chưa nói tới nhánh suy giảm `prefers-reduced-transparency` /
  `prefers-contrast` (Liquid Glass coi là bắt buộc — §5.5).
- Sàn Lc 60 hiện áp chung cho text-on-fill; thang APCA đầy đủ đặt sàn 75 cho
  body text và thang âm riêng cho dark mode (§4.2) — đáng rà lại xem chữ nào
  trên glass thuộc lớp "body".
- Chưa có quy tắc scroll-edge (tách nội dung cuộn dưới header glass — §5.3.4).

---

## 9. Nguồn đã fetch (30/30) và tình trạng

| # | Nguồn | Tình trạng fetch 2026-07-11 |
|---|---|---|
| A1 | w3.org/TR/css-color-4 | ✅ |
| A2 | w3.org/TR/css-color-5 | ✅ |
| A3 | drafts.csswg.org/css-color-5 | ✅ |
| A4 | w3c.github.io/csswg-drafts/css-color-6 | ✅ qua redirect 301 → drafts.csswg.org/css-color-6 |
| A5 | drafts.csswg.org/filter-effects-2 | ✅ |
| B1 | MDN oklch | ✅ |
| B2 | MDN backdrop-filter | ✅ |
| C1 | github.com/Myndex/SAPC-APCA | ✅ |
| C2 | github.com/Myndex/apca-w3 | ✅ |
| C3 | git.myndex.com | ✅ |
| C4 | myndex.com/APCA | ⚠️ server từ chối kết nối (ECONNREFUSED ×2); nội dung lấy đủ qua mirror chính thức apcacontrast.com (cùng công cụ, beta 0.1.7 G) |
| C5 | git.apcacontrast.com/documentation/APCAeasyIntro.html | ✅ |
| C6 | git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html | ✅ |
| C7 | apcaw3.myndex.com | ✅ (nâng cấp HTTPS) |
| D1 | github.com/color-js/color.js | ✅ |
| D2 | colorjs.io | ✅ |
| D3 | github.com/antiflasher/apcach | ✅ |
| D4 | github.com/evilmartians/oklch-picker | ✅ |
| D5 | oklch.com | ✅ |
| D6 | github.com/dokozero/okcolor | ✅ |
| E1 | HIG Materials | ✅ qua endpoint JSON chính thức của Apple docs (trang gốc là SPA không render server-side) |
| E2 | Liquid Glass Technology Overview | ✅ qua endpoint JSON chính thức (như trên) |
| E3 | WWDC25 §219 "Meet Liquid Glass" | ✅ (transcript) |
| F1 | developer.chrome.com HD color guide | ✅ |
| F2 | developer.chrome.com access-colors-spaces | ✅ |
| F3 | developer.chrome.com blog RCS | ✅ |
| F4 | web.dev/learn/css/color | ✅ |
| F5 | web.dev color-spaces-and-functions | ✅ |
| G1 | evilmartians.com oklch-in-css | ✅ |
| G2 | lea.verou.me releasing-colorjs | ✅ |
