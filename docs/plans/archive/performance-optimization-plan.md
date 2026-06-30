# Kế hoạch Tối ưu hóa Hiệu năng Gói @pumni/ui (Performance Optimization Plan)

Tài liệu phân tích và đề xuất các tối ưu hóa hiệu năng cho `@pumni/ui`. Mục tiêu:
hướng dẫn AI refactor triển khai **có hệ thống, có thước đo, có cổng kiểm chứng** —
không phải danh sách "cảm tính".

> [!NOTE]
> **React Compiler đã bật** (`reactCompiler: true` trong `next.config.ts`). Mọi
> memoize thông thường (`useMemo`/`useCallback` cho config object, context value,
> giá trị dẫn xuất trong render) được compiler tự xử lý. Kế hoạch này **chỉ** nhắm
> các tối ưu **nằm ngoài** khả năng compiler: ranh giới Server/Client, scheduler
> priority, chi phí layout projection của Motion, hydration, dọn DOM/CSS thủ công,
> và cấu hình đóng gói cấp package. **Bất kỳ đề xuất nào thêm `useMemo`/`useCallback`
> thủ công đều phải tự chứng minh compiler đã bail — nếu không, đó là vi phạm
> convention dự án (AGENTS.md › React Compiler).**

> [!IMPORTANT]
> **Bối cảnh đóng gói:** `@pumni/ui` xuất **mã nguồn TS/TSX thô** qua `exports`
> (không build trước); app Next.js biên dịch qua `transpilePackages`. Do đó chỉ thị
> `'use client'` được diễn giải ở **thời điểm build của app**, và việc gỡ nó **chỉ
> giảm client bundle khi component thực sự được render trong Server Component**.
> Nếu component chỉ được dùng bên trong cây client, gỡ directive là *vệ sinh ranh
> giới* (cho phép dùng ở server về sau) chứ **không** giảm bundle. Mọi mục ở §1 phải
> được đọc với nhận thức này.

---

## 0. Phương pháp & Cổng kiểm chứng (BẮT BUỘC đọc trước)

Mỗi thay đổi phải gắn với **một thước đo chứng minh được**. Không có "done" nếu không
qua được cổng tương ứng.

### 0.1. Thước đo theo loại tối ưu

| Loại | Cách verify | Chứng cứ "đạt" |
|---|---|---|
| Gỡ `'use client'` (§1) | Tìm consumer thực: component có được import vào Server Component không? Chạy `@next/bundle-analyzer` so client chunk trước/sau. | Component xuất hiện trong RSC graph **và** client chunk giảm; nếu không có consumer server → chỉ ghi nhận là vệ sinh ranh giới, **không** tuyên bố giảm bundle. |
| Input lag (§2) | React DevTools Profiler / Performance trace khi gõ liên tục vào palette với danh sách ≥1k item. | Keystroke không bị long task (>50ms) chặn; input phản hồi tức thì. |
| Layout projection (§3) | Performance trace dưới `prefers-reduced-motion: reduce`. | Không còn measure/recalc-style do `layout` gây ra trên trigger. |
| Giảm DOM node (§4) | Đếm node trong DevTools + **Playwright visual snapshot**. | Số node giảm; ảnh chụp khớp baseline mới đã review. |
| Hydration (§5) | Render trang chứa component ở môi trường server-TZ ≠ client-TZ (ví dụ `TZ=UTC`); kiểm tra console không có hydration warning. | Không còn "Text content does not match". |
| Dọn ref/CSS (§6) | Unit/RTL test mô phỏng pointerleave rồi re-render. | `--spot-*` không tái áp dụng tọa độ cũ. |

### 0.2. Cổng cố định (theo CLAUDE.md, không bỏ qua)

- `bun run ai:check` **và** `bun run ai:eval` phải xanh trước khi tuyên bố hoàn thành.
- Mọi mục đổi DOM/visual (**§3, §4, và bất kỳ thay đổi render nào**) phải **cập nhật &
  review baseline Playwright** (`apps/web/e2e/design-system-visual.spec.ts`).
- `ssr-safety.test.tsx` phải tiếp tục xanh sau §1 (điều kiện cần, **không đủ**:
  `renderToString` không phân biệt ranh giới `'use client'`).

### 0.3. Xếp hạng ưu tiên (làm theo thứ tự impact)

1. **§2.1** Input lag command-palette — *user-facing, cao*.
2. **§5.1** Hydration chat-bubble — *bug đúng nghĩa*.
3. **§1** Gỡ `'use client'` đủ điều kiện — *bundle/hygiene*.
4. **§4.1** Giảm DOM node segmented — *trung bình, có rủi ro visual*.
5. **§8** Đòn bẩy cấp package (exports/tree-shaking) — *trung bình, một lần*.
6. **§3, §6, §7** — *thấp / phần lớn đã được hạ tầng xử lý; ưu tiên sửa tài liệu sai*.

---

## 1. RSC-First (Giảm Client-side Footprint khi đủ điều kiện)

**Mục tiêu:** Bỏ `'use client'` ở các component thực sự stateless/SSR-safe **đồng thời**
xác minh consumer server (xem §0.1). Không tuyên bố giảm bundle nếu chưa có consumer
server.

> [!WARNING]
> **Quy trình bắt buộc cho từng file:** (1) xác nhận không dùng hook/state/effect/
> browser API; (2) `grep` consumer — có file Server Component nào import nó không;
> (3) gỡ directive; (4) chạy `ssr-safety.test.tsx` + bundle analyzer. Nếu (2) trống,
> vẫn gỡ được (hygiene) nhưng ghi rõ "không thay đổi bundle".

### 1.1. [glass-surface.tsx](file:///v:/web-os/packages/ui/src/components/identity/glass-surface.tsx)
- **Phân tích:** Có `'use client'` nhưng chỉ dùng Radix `Slot` + `cva` truyền class CSS tĩnh. Không hook/state. SSR-safe.
- **Giải pháp:** Gỡ `'use client';`.

### 1.2. [separator.tsx](file:///v:/web-os/packages/ui/src/components/layout/separator.tsx)
- **Trạng thái: ĐÃ HOÀN THÀNH — KHÔNG CÒN VIỆC.** File hiện tại **không** chứa `'use client'` (có JSDoc giải thích lý do server-safe). Mục này được giữ lại làm dấu vết; không refactor gì thêm.

### 1.3. [auth-field.tsx](file:///v:/web-os/packages/ui/src/components/form/auth-field.tsx)
- **Phân tích:** Có `'use client'` nhưng chỉ là layout wrapper ghép Label + Input + thông báo lỗi. Stateless. (Nó render `Input` — một client component — nhưng *Server Component được phép render con là client component*, nên bản thân `AuthField` không cần directive.)
- **Giải pháp:** Gỡ `'use client';`.

### 1.4. [progress.tsx](file:///v:/web-os/packages/ui/src/components/feedback/progress.tsx)
- **Phân tích:** Có `'use client'`. Radix `Progress` chỉ render HTML + ARIA tĩnh, không state/effect.
- **Giải pháp:** Gỡ `'use client';`.

### 1.5. (MỞ RỘNG) Quét toàn bộ candidate `'use client'` thừa
- **Phân tích:** Plan gốc chỉ liệt kê 3 file đã biết. Để theo chuẩn "boundary càng sâu càng tốt", thực hiện một lần quét toàn package: liệt kê mọi file có `'use client'`, đánh dấu file nào **không** dùng hook/state/effect/browser API/event handler.
- **Giải pháp:** Liệt kê ứng viên (ví dụ candidate cần kiểm: các wrapper cva-only như `badge`, `icon-badge`, `kbd-chip`, `section-heading`, `card`...). Với mỗi ứng viên đạt tiêu chí, áp quy trình §1 WARNING. **Không** gỡ hàng loạt mù quáng — verify từng cái.

---

## 2. Loại bỏ Input Lag khi fuzzy-search danh sách lớn

### 2.1. [command-palette.tsx](file:///v:/web-os/packages/ui/src/components/overlay/command-palette.tsx) — **(Ưu tiên cao)**
- **Phân tích (chính xác):** `matchSorter` chạy **đồng bộ** trên luồng chính mỗi khi `query` đổi (`const q = query.trim()` → `filtered`). `startTransition` hiện chỉ bọc `setActiveIndex(0)` nên **không** trì hoãn việc lọc — gõ vào danh sách lớn vẫn lag. React Compiler memo `filtered` theo `(items, q)` nhưng **không giúp** khi chính `q` đổi (công việc vẫn chạy đồng bộ trên keystroke). Phải hạ ưu tiên việc lọc.

- **Giải pháp ĐỀ XUẤT (idiom hiện đại, gọn nhất): `useDeferredValue`.**
  Tách giá trị nhập (đồng bộ) khỏi giá trị lọc (trì hoãn) bằng một dòng, không cần state thứ hai:
  ```tsx
  const [query, setQuery] = React.useState('');
  const deferredQuery = React.useDeferredValue(query);
  const isPending = query !== deferredQuery; // thay cho useTransition.isPending

  const q = deferredQuery.trim();
  const filtered = q
    ? matchSorter(items, q, { keys: ['label', 'keywords'] }).slice(0, 25)
    : items;
  ```
  - `input.value={query}` (phản hồi tức thì), `onChange` chỉ `setQuery(val)`.
  - `isPending` vẫn dùng được cho hiệu ứng `animate-pulse` của `SearchIcon`.
  - **Lưu ý reset `activeIndex`:** giữ `activeIndex` đồng bộ với *kết quả đã lọc* (đã có sẵn effect "drop stale highlight khi `filtered.length === 0`"). Khi `deferredQuery` đổi, reset active về 0 trong effect phụ thuộc `deferredQuery` thay vì nhét vào `onChange`.

- **Giải pháp THAY THẾ (nếu cần kiểm soát thủ công): `useTransition` + state đôi.**
  Giữ `query`/`searchQuery` tách biệt, bọc `setSearchQuery` trong `startTransition`. Tương đương về kết quả nhưng nhiều state hơn — chỉ chọn nếu có lý do cụ thể.

- **Phán quyết §2.2 (renderOption → React.memo): HẠ XUỐNG "tùy chọn / có khả năng thừa".**
  - **Lý do:** (a) Dưới React Compiler, JSX trong map đã được tối ưu; tách ra `React.memo` là pattern *trước* compiler. (b) Quan trọng hơn: **trong lúc gõ, `query` đổi mỗi keystroke** → mọi row đều re-render qua `<Highlight text query={query}/>` bất kể memo theo `activeIndex`. Vậy memo theo active **không** cứu được lúc gõ. Lợi ích thật khi gõ đến từ §2.1 (trì hoãn lọc) + §7 (memo Highlight, nếu compiler không tự lo).
  - **Hành động:** Bỏ §2.2 khỏi phạm vi bắt buộc. Chỉ cân nhắc nếu Profiler chỉ ra re-render do **di chuyển active bằng phím** (lúc đó `query` ổn định) là nút thắt — khi đó tách `CommandPaletteItem` memo theo `isActive` mới có ý nghĩa.

---

## 3. Reduced Motion — Né chi phí Layout Projection (impact thấp; ưu tiên sửa tài liệu)

> [!IMPORTANT]
> **Bối cảnh đã có:** `app/layout.tsx` bọc cây bằng `MotionConfig reducedMotion="user"`.
> Theo Motion, cấu hình này **đã tự động tắt animation transform + layout** cho người
> dùng bật reduced-motion. Vậy **tính đúng đắn (tween bị tắt) đã được đảm bảo ở cấp app**.
> Lợi ích còn lại của việc gỡ `layout`/`layoutId` ở JSX là **né chi phí đo layout
> projection** — một micro-opt, không phải sửa lỗi. Plan gốc trình bày như thể tween
> chưa được xử lý là **không chính xác**.

### 3.1. [segmented-picker.tsx](file:///v:/web-os/packages/ui/src/components/form/segmented-picker.tsx)
- **Vấn đề tài liệu (phải sửa trước):** JSDoc khẳng định *"`useReducedMotion()` neutralises the tween"* nhưng **code không hề gọi `useReducedMotion`** — pill hardcode `layout` + `transition.snappy`. Tài liệu đang nói dối so với code.
- **Giải pháp:**
  1. **Sửa JSDoc** cho khớp thực tế (reduced-motion được lo bởi `MotionConfig` ở app root, theo cùng cơ chế với các recipe trong `lib/motion.ts`).
  2. *(Tùy chọn, micro-opt)* Né luôn chi phí projection bằng cách gỡ prop động khi reduced — **đồng nhất với pattern của `Window`** (file đó gọi `useReducedMotion()` thật):
  ```tsx
  import { motion, useReducedMotion } from 'motion/react';
  const shouldReduce = useReducedMotion();
  // ...
  <motion.span
    aria-hidden
    data-slot="segmented-picker-indicator"
    className="..."
    {...(!shouldReduce && { layoutId, layout: true, transition: transition.snappy })}
  />
  ```
  - **Cổng:** chạy bộ visual Playwright. Snapshot **dự kiến KHÔNG đổi** (MotionConfig đã neutralize tween dưới `reducedMotion: reduce`, và prop bị gỡ chỉ là `layout`/`layoutId` — không ảnh hưởng pixel ở trạng thái settle). Chỉ điều tra/cập nhật baseline nếu ảnh thực sự khác.

### 3.2. [tabs.tsx](file:///v:/web-os/packages/ui/src/components/layout/tabs.tsx)
- **Phân tích:** Indicator hardcode `layoutId` + `layout`. JSDoc ở đây **đã đúng** (ghi rõ `MotionConfig` ở app root neutralize tween) — nên **không sửa doc**.
- **Giải pháp:** *(Tùy chọn, micro-opt)* Gỡ prop động khi reduced để né projection, giống §3.1:
  ```tsx
  const shouldReduce = useReducedMotion();
  <motion.span
    aria-hidden
    data-slot="tabs-trigger-indicator"
    className="..."
    {...(!shouldReduce && { layoutId, layout: true })}
  />
  ```

---

## 4. Giảm DOM Node dư thừa bằng CSS Pseudo-element

### 4.1. [segmented-picker.tsx](file:///v:/web-os/packages/ui/src/components/form/segmented-picker.tsx)
- **Phân tích:** Để tránh layout shift khi `font-normal → font-medium`, component nhân đôi nhãn + Icon (Inactive/Active layer) → gấp đôi DOM node mỗi option.
- **Giải pháp:**
  - Render Icon **một lần** (icon không đổi theo font-weight, chỉ đổi màu).
  - Dùng pseudo-element `::after` với `content-[attr(data-text)] font-medium h-0 invisible overflow-hidden` để **reserve** chiều rộng của weight đậm mà không sinh node thật.
  ```tsx
  <span className="inline-flex items-center justify-center gap-1.5 text-sm transition-colors duration-(--duration-fast) ease-fluid">
    {Icon && <Icon className={cn("shrink-0 transition-colors", checked ? "text-foreground" : "text-muted-foreground")} />}
    <span
      data-text={label}
      className={cn(
        "relative transition-all after:block after:content-[attr(data-text)] after:font-medium after:h-0 after:invisible after:overflow-hidden",
        checked ? "font-medium text-foreground" : "font-normal text-muted-foreground"
      )}
    >
      {label}
    </span>
  </span>
  ```
- **CẢNH BÁO TRADE-OFF (plan gốc bỏ sót):** Thiết kế hiện tại **crossfade opacity** giữa hai lớp weight (mượt). Giải pháp pseudo-element **đổi weight tức thì** (chỉ còn transition màu). Đây là **thay đổi hành vi *chuyển tiếp* có chủ đích**, không phải tối ưu "miễn phí".
- **Cổng:** Snapshot Playwright tĩnh **có thể không đổi** (chụp trạng thái đã settle; crossfade là transition mà ảnh tĩnh không bắt được — và giảm node không đổi pixel). Vì vậy phải **kiểm tra hành vi chuyển tiếp bằng mắt/quay màn hình**, không chỉ dựa vào snapshot. Xác nhận thiết kế chấp nhận mất crossfade; nếu không → giữ nguyên 2 lớp (ưu tiên đúng thị giác hơn vài node DOM).

---

## 5. Sửa Hydration Mismatch trong chat-bubble — **(Bug thật, ưu tiên cao)**

### 5.1. [chat-bubble.tsx](file:///v:/web-os/packages/ui/src/components/feedback/chat-bubble.tsx)
- **Phân tích (đúng):** `formatChatTime` dùng `getHours()/getMinutes()` theo **múi giờ local của runtime**. Server (vd UTC) ≠ client (vd UTC+7) → markup lệch → **Hydration Mismatch**. Lỗi này xảy ra **cả khi** `ChatBubble` được SSR như con của cây client (Next vẫn SSR client component).
- **Giải pháp ĐỀ XUẤT (đúng nhất về kiến trúc — format ở consumer):**
  Cho consumer truyền **chuỗi đã format sẵn** (`timeLabel: string`) thay vì epoch ms; quyết định múi giờ nằm ở tầng gọi (nơi biết TZ người dùng). `ChatBubble` thành thuần present, bỏ hẳn `formatChatTime` → triệt tiêu nguồn gây mismatch ngay tại gốc. Đây là hướng nên ưu tiên.
- **Giải pháp THAY THẾ A (giữ API epoch ms — format trên client sau mount):**
  Tách `<ChatTime timestamp>` client, format trong `useEffect`/sau mount nên hiển thị **đúng giờ local của người dùng**. Nhãn vốn `opacity-0` + hover-reveal nên không thấy flash empty→time. Đánh đổi: thêm **một effect + state cho MỖI bubble** → list chat hàng trăm tin nhắn cần cân nhắc chi phí. Đây là phương án "plan gốc" nhưng đã sửa lại cho đúng (giờ local, không phải UTC).
- **KHÔNG khuyến nghị — `suppressHydrationWarning`:**
  Directive này chỉ **dập cảnh báo**, KHÔNG sửa nội dung. React giữ nguyên text do server render (giờ theo **TZ server / UTC**) cho đến khi component re-render vì lý do khác → người dùng UTC+7 thấy **giờ UTC sai**. Chỉ chấp nhận được khi giá trị hiển thị không quan trọng — **không phải** trường hợp nhãn giờ này.
- **Khuyến nghị:** Dùng ĐỀ XUẤT (format ở consumer) — vừa hết mismatch vừa giữ `ChatBubble` thuần. Chọn THAY THẾ A nếu muốn giữ nguyên API `timestamp: number`.
- **Cổng:** Test với `TZ=UTC` ở server vs giả lập client TZ khác; xác nhận hết warning **và** giờ hiển thị đúng theo TZ người dùng (không phải UTC).

---

## 6. Dọn ref/CSS trong card-spotlight (sửa tận gốc, không vá triệu chứng)

### 6.1. [card-spotlight.tsx](file:///v:/web-os/packages/ui/src/components/layout/card-spotlight.tsx)
- **Phân tích:** `handlePointerLeave` hủy rAF nhưng **không** reset `coordsRef.current` và **không** xóa `--spot-x/--spot-y` trên DOM. Nếu cha re-render vì lý do khác, `mergedStyle` (đọc `coordsRef.current` lúc render) áp lại tọa độ cũ.
- **Vấn đề gốc (plan gốc bỏ sót):** Có **hai nguồn sự thật** cho `--spot-*`: imperative (`element.style.setProperty` trong rAF) **và** declarative (`mergedStyle` từ `coordsRef`). `coordsRef` mutation không trigger render nên `mergedStyle` luôn lệch pha — bản thân `mergedStyle` coords **không phục vụ mục đích gì** (cập nhật thật đến từ rAF imperative).
- **Giải pháp ĐỀ XUẤT (sửa gốc):** **Bỏ hẳn** phần coords trong `mergedStyle` (chỉ spread `style` của consumer), giữ cập nhật imperative làm nguồn duy nhất; trong `handlePointerLeave` clear DOM:
  ```tsx
  // handlePointerLeave:
  e.currentTarget.style.removeProperty('--spot-x');
  e.currentTarget.style.removeProperty('--spot-y');
  // và bỏ luôn coordsRef + nhánh coords trong mergedStyle.
  ```
- **Giải pháp TỐI THIỂU (nếu muốn giữ mergedStyle):** Như plan gốc — reset `coordsRef.current = {}` + `removeProperty(...)` trong leave. Chấp nhận được nhưng vẫn để lại dual-source.
- **Mức độ:** Thấp (chỉ lộ khi cha re-render sau leave). Xếp vào *correctness hygiene*.

---

## 7. RegExp trong highlight — Verify trước, đừng thêm useMemo mù

### 7.1. [highlight.tsx](file:///v:/web-os/packages/ui/src/components/layout/highlight.tsx)
- **Mâu thuẫn cần giải quyết:** Plan gốc đề nghị bọc IIFE tạo RegExp trong `React.useMemo`. Nhưng tiền đề của chính tài liệu này là **React Compiler tự memo giá trị dẫn xuất trong render**. IIFE `{splitPattern, testPattern}` dẫn xuất từ `query` → **compiler nên đã memo theo `query`**. Thêm `useMemo` thủ công sẽ **thừa** và **vi phạm convention dự án** (AGENTS.md cấm memo thủ công cho biến render thông thường).
- **Vấn đề tài liệu:** JSDoc của `highlight.tsx` khẳng định RegExp "được memoize trên token set" — đây là mô tả **hiệu ứng do compiler tạo ra**, không phải memo ở mã nguồn. Câu "codebase khởi tạo RegExp mới mỗi render" trong plan gốc **chỉ đúng nếu compiler bail**.
- **Giải pháp (đúng quy trình):**
  1. **Verify** compiler có memo IIFE này không (đọc output compiler / React DevTools "Memo ✨", hoặc Profiler khi gõ trong palette).
  2. Nếu **đã memo** → **không sửa code**; chỉ chỉnh JSDoc cho rõ "memo nhờ React Compiler".
  3. Chỉ khi Profiler chứng minh compiler **bail** (vd do cấu trúc khiến compiler bỏ qua cả component) → mới thêm `useMemo` và **ghi chú lý do bail ngay tại chỗ** để không bị coi là vi phạm convention.
- **Lưu ý liên quan §2.2:** nếu Highlight được memo đúng, việc tách `CommandPaletteItem` càng ít giá trị.

---

## 8. (MỤC MỚI) Đòn bẩy hiệu năng cấp Package — exports / tree-shaking / side-effects

Plan gốc bỏ trống hoàn toàn tầng đóng gói, dù đây là đòn bẩy bundle lớn và *một lần là xong*.

### 8.1. `optimizePackageImports` chưa có `@pumni/ui`
- **Phân tích:** `next.config.ts` liệt kê `radix-ui`, `motion`, dnd-kit, vidstack — **nhưng không** có các entrypoint của `@pumni/ui`. Các barrel theo domain (`./form`, `./overlay`, `./layout`, `./feedback`, `./identity`, `./os`) là **barrel file**: import một component vẫn kéo cả barrel trừ khi được "barrel-optimize".
- **Giải pháp:** Thêm các entrypoint `@pumni/ui/*` vào `optimizePackageImports` (hoặc xác nhận bằng bundle analyzer rằng barrel hiện đã được shake sạch nhờ `sideEffects:false` + ESM). Đo client chunk của một route chỉ dùng 1–2 component (vd trang login dùng `AuthField`) trước/sau.
- **Cổng:** `@next/bundle-analyzer` so sánh; chỉ giữ thay đổi nếu chunk giảm thật.

### 8.2. `"sideEffects": false` vs import CSS
- **Phân tích:** `package.json` đặt `"sideEffects": false`. Nếu **bất kỳ** module JS/TS trong package `import './*.css'` (side-effect import), bundler có quyền **drop** nó khi shake → mất style. Hiện CSS được expose qua `./styles/*` và app import trực tiếp (an toàn), nhưng cần kiểm tra để chắc chắn không có side-effect import bị nuốt.
- **Giải pháp:** `grep` toàn package tìm `import '...css'` / `import "...css"`. Nếu có → đổi thành `"sideEffects": ["**/*.css"]`. Nếu không → giữ `false` và **ghi chú** kết luận kiểm tra vào đây để lần sau khỏi nghi ngờ.

### 8.3. Kiểm tra trùng dependency / peer (vệ sinh monorepo)
- **Phân tích:** `react`/`react-dom` đã đúng là `peerDependencies` (tránh nhân đôi React) và deps dùng `catalog:` (một phiên bản toàn workspace) — **đây là đúng chuẩn 2026, không cần đổi**. Ghi nhận để tránh "refactor" thừa.
- **Giải pháp:** Không hành động; chỉ xác nhận trong lần review rằng cấu hình peer/catalog vẫn nguyên.

---

## 9. Bảng tổng hợp trạng thái & việc cần làm

| Mục | Trạng thái | Hành động chính |
|---|---|---|
| 1.1 glass-surface | Hợp lệ | Gỡ `'use client'` + verify consumer/bundle |
| 1.2 separator | **Đã xong** | Không làm gì |
| 1.3 auth-field | Hợp lệ | Gỡ `'use client'` + verify |
| 1.4 progress | Hợp lệ | Gỡ `'use client'` + verify |
| 1.5 quét candidate | Mới | Audit toàn package, verify từng file |
| 2.1 palette lag | **Ưu tiên cao** | `useDeferredValue` (đề xuất) |
| 2.2 memo row | Hạ → tùy chọn | Bỏ khỏi scope bắt buộc |
| 3.1 segmented motion | Thấp + sửa doc | Sửa JSDoc sai; gỡ prop động (tùy chọn) |
| 3.2 tabs motion | Thấp | Gỡ prop động (tùy chọn) |
| 4.1 pseudo-element | Trung bình | Triển khai + update snapshot + xác nhận trade-off |
| 5.1 chat hydration | **Bug, ưu tiên cao** | Format ở consumer (đề xuất); KHÔNG dùng `suppressHydrationWarning` |
| 6.1 card-spotlight | Thấp | Sửa gốc: bỏ dual-source + clear khi leave |
| 7.1 highlight regexp | Verify | Đo compiler; sửa doc; **không** thêm useMemo mù |
| 8.x package-level | Mới | optimizePackageImports + sideEffects + đo bundle |

**Định nghĩa "Done" toàn kế hoạch:** mọi mục trên đã qua cổng §0; `bun run ai:check`
và `bun run ai:eval` xanh; baseline Playwright cho §3/§4 đã cập nhật & review; không
có hydration warning ở §5; bundle analyzer xác nhận (hoặc bác bỏ) tuyên bố ở §1/§8.
