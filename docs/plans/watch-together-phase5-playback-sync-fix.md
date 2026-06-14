# Kế hoạch Phase 5 (Fix) — Đồng bộ Phát video: Guard programmatic + Auto-gom theo Host

> **Trạng thái:** Đề xuất — chờ thực thi.
> **Bổ sung cho:** `docs/plans/watch-together-phase5-hardening-v2.md` (mục A1 đã thay `suppressSeekedEventRef` bằng `isOriginTrusted`) và `watch-together-phase5-queue-sync-fix.md` (đã xong). Bản này **chỉ chạm tầng đồng bộ phát**, không đụng hàng chờ/queue.
> **Tài liệu tham chiếu:** `apps/web/AGENTS.md`, `docs/conventions/data-fetching.md`.
> **Mục tiêu:** Sau bản fix: host **dừng → play lại** thì **mọi follower tự resume** (không phải tự play + bấm "Đồng bộ lại"); follower vẫn được tạm tách khi tự seek/pause, nhưng **bất kỳ thao tác nào của host cũng tự gom cả phòng về đồng bộ**. Hết lỗi ngắt-đồng-bộ-nhầm trên provider YouTube.

---

## 0. Quy ước cho người thực thi (ĐỌC TRƯỚC)

- Mọi đường dẫn tính từ gốc repo `D:\Dev\web-os`.
- **KHÔNG phá bất biến §5.** Đặc biệt: anchor chỉ host ghi qua RLS `watch_rooms_update_host`; một channel `room:{id}`; host **không** broadcast theo nhịp định kỳ (chỉ phát khi có thao tác thật).
- React Compiler **đang BẬT** → **không thêm** `useCallback/useMemo`.
- Phạm vi file: **chỉ** `apps/web/src/features/watch/hooks/use-sync-controller.ts` (bắt buộc) + tinh chỉnh copy nhỏ `room-controls.tsx` (tùy chọn). Không migration, không đổi DB.
- Lệnh kiểm thử (PowerShell, gốc repo): `bun run typecheck`, `bun run lint`, `bun run build`.

---

## 1. Nguyên nhân gốc (đã truy trong code)

| # | Hiện tượng | Nguyên nhân |
| :- | :- | :- |
| 🔴 **P1** | Host **dừng → play lại** nhưng follower **không tự resume**; phải tự play + bấm "Đồng bộ lại". | `use-sync-controller.ts:261-287`: follower coi là "thao tác thủ công" **chỉ dựa trên `e?.isOriginTrusted`**. Với **YouTube**, event play/pause do Vidstack **tổng hợp** từ `onStateChange` của iframe → `isOriginTrusted` **không đáng tin**. Khi host dừng, follower `reconcile()` gọi `player.pause()` **programmatic** → event `pause` bị báo "trusted" → `handleFollowerManualInteraction()` chạy nhầm → follower **âm thầm `isFollowingHost=false`**. |
| 🔴 **P2** | Khi follower lỡ lệch thì **phục hồi hoàn toàn thủ công**. | `handleReceiveAnchor` (dòng 242-247): nếu `isFollowingHostRef.current===false` thì **bỏ qua `reconcile()`**. Host play lại → anchor tới nhưng follower không phản ứng. Mà host **chỉ broadcast khi thao tác thật** → mỗi anchor lẽ ra phải tự kéo cả phòng về. |

> Với nguồn **direct URL** (HTML5) `isOriginTrusted` đúng chuẩn nên bug không xảy ra → khẳng định đây là lỗi đặc thù provider + thiết kế phục hồi.

---

## 2. Thiết kế đích (đã chốt: Auto-gom theo host)

**Hai thay đổi bù nhau:**

**(A) Guard programmatic** — bỏ phụ thuộc đơn lẻ vào `isOriginTrusted`. Bọc **mọi** thao tác programmatic (`reconcile/resync/resumeFromGesture/tryPlay`) bằng **cửa sổ ức chế** thời gian. Follower chỉ coi là thao tác thủ công khi event **nằm ngoài** cửa sổ ức chế **và** `isOriginTrusted !== false`. → Robust trên mọi provider.

**(B) Host transport command luôn auto-gom** — vì host chỉ broadcast khi có thao tác thật, nên trong `handleReceiveAnchor`: **mỗi anchor nhận được** → tự đặt `isFollowingHost=true` rồi `reconcile()`. Host play/pause/seek **luôn kéo mọi follower về đồng bộ**, kể cả khi đang lệch. Follower vẫn được tự tách tạm thời (seek/pause cục bộ) giữa hai lần host thao tác; nút "Đồng bộ lại" giữ làm lối tắt.

Bug P1 được khắc phục bởi **cả (A)** (không còn ngắt nhầm khi host pause) **lẫn (B)** (host play tự kéo follower về dù có lỡ lệch). **Autoplay** giữ nguyên `tryPlay` (muted fallback → overlay tap-to-play) để resume không kẹt im lặng.

---

## 3. Chi tiết thay đổi — `use-sync-controller.ts`

### 3.1. Thêm cơ chế cửa sổ ức chế (đặt cạnh `tryPlay`)

```ts
// Cửa sổ ức chế: bỏ qua event play/pause/seeked do CHÍNH reconcile/resync phát ra
// (programmatic). Cần thiết vì isOriginTrusted KHÔNG đáng tin trên provider YouTube
// (event tổng hợp từ iframe API) — trước đây gây ngắt đồng bộ nhầm khi host pause.
const programmaticUntilRef = useRef(0);
const PROGRAMMATIC_WINDOW_MS = 800; // YouTube bridge async; tinh chỉnh nếu cần
const markProgrammatic = () => {
  programmaticUntilRef.current = Date.now() + PROGRAMMATIC_WINDOW_MS;
};
const isWithinProgrammaticWindow = () => Date.now() < programmaticUntilRef.current;
```

### 3.2. `tryPlay` — đánh dấu trước khi play

```ts
const tryPlay = (player: MediaPlayerInstance) => {
  markProgrammatic();
  player.play().catch(() => {
    markProgrammatic();
    player.muted = true;
    player.play().catch(() => {
      needsGestureRef.current = true;
      setNeedsGesture(true);
    });
  });
};
```

### 3.3. `reconcile()` — đánh dấu trước `pause()` và set `currentTime`

```ts
// 1) Match play/pause state
if (anchor.isPlaying && player.paused) {
  tryPlay(player); // đã markProgrammatic bên trong
} else if (!anchor.isPlaying && !player.paused) {
  markProgrammatic();
  player.pause().catch(() => {});
}
// ...
} else {
  // Hard jump
  if (Math.abs(player.currentTime - expected) > 0.01) {
    markProgrammatic();
    player.currentTime = expected;
  }
  player.playbackRate = anchor.playbackRate;
  setSyncStatus("catching-up");
}
```

> Nhánh "nudge" (chỉ đổi `playbackRate`) **không** cần mark vì không sinh event play/pause/seeked.

### 3.4. `resync()` & `resumeFromGesture()` — đánh dấu trước mọi mutation

Trong `resync()` thêm `markProgrammatic()` ngay trước khối set `currentTime`/`tryPlay`/`pause`:

```ts
const resync = () => {
  isFollowingHostRef.current = true;
  setIsFollowingHost(true);

  const player = playerRef.current;
  const anchor = anchorRef.current;
  if (!player) return;

  const expected = calculateExpectedPosition(anchor, serverClock());
  if (Math.abs(player.currentTime - expected) > 0.01) {
    markProgrammatic();
    player.currentTime = expected;
  }
  player.playbackRate = anchor.playbackRate;

  if (anchor.isPlaying && player.paused) {
    tryPlay(player);
  } else if (!anchor.isPlaying && !player.paused) {
    markProgrammatic();
    player.pause().catch(() => {});
  }
};
```

(`resumeFromGesture` gọi `resync()` nên tự kế thừa.)

### 3.5. Handlers — kết hợp 2 tín hiệu

```ts
const isFollowerManualEvent = (e?: { isOriginTrusted?: boolean }) =>
  !isWithinProgrammaticWindow() && e?.isOriginTrusted !== false;

const handlePlay = (e?: MediaPlayEvent) => {
  if (isHost) { emitAnchor(); return; }
  if (isFollowerManualEvent(e)) handleFollowerManualInteraction();
};

const handlePause = (e?: MediaPauseEvent) => {
  if (isHost) { emitAnchor(); return; }
  if (isFollowerManualEvent(e)) handleFollowerManualInteraction();
};

const handleSeeked = (detail?: number, e?: MediaSeekedEvent) => {
  if (isHost) { emitAnchor(); return; }
  if (isFollowerManualEvent(e)) handleFollowerManualInteraction();
};
```

> `handleRateChange` giữ nguyên (host-only emit; follower không phá follow theo rate).

### 3.6. `handleReceiveAnchor` — auto-gom theo host (B)

```ts
const handleReceiveAnchor = (newAnchor: PlaybackAnchor) => {
  anchorRef.current = newAnchor;
  if (isHost) return;

  // Mỗi anchor nhận được là MỘT lệnh transport có chủ đích của host (host không
  // broadcast theo nhịp). → Tự gom follower về đồng bộ kể cả khi đang lệch.
  if (!isFollowingHostRef.current) {
    isFollowingHostRef.current = true;
    setIsFollowingHost(true);
  }
  reconcile();
};
```

> `reconcile()` đọc `isFollowingHostRef.current` (đã set true đồng bộ qua ref) nên chạy ngay; `setIsFollowingHost` chỉ cập nhật UI. Vòng lặp 1s tự tiếp tục vì follow đã bật lại.

### 3.7. (Tùy chọn) Copy `room-controls.tsx`

Banner "Đã ngắt đồng bộ" có thể thêm gợi ý ngắn để người dùng hiểu cơ chế mới:
`"Đã ngắt đồng bộ — sẽ tự đồng bộ khi host thao tác"`. Không bắt buộc.

---

## 4. Cổng nghiệm thu (smoke 2 trình duyệt, **ưu tiên nguồn YouTube**)

| # | Kịch bản | Kỳ vọng |
| :- | :- | :- |
| 1 | A pause → A play lại | **B tự dừng rồi tự resume**, KHÔNG cần thao tác, KHÔNG hiện banner "Đã ngắt đồng bộ". *(P1 cũ vỡ)* |
| 2 | A seek tới đoạn khác | B tự nhảy theo, vẫn "Đang đồng bộ với Host". |
| 3 | A đổi tốc độ | B đổi theo. |
| 4 | B **tự seek** lùi để xem lại | B hiện "Đã ngắt đồng bộ" (tách tạm, đúng ý người dùng). |
| 5 | Sau (4), A pause hoặc play | **B tự gom về đồng bộ** ngay (auto-regather), không cần bấm nút. |
| 6 | B bấm "Đồng bộ lại" thủ công | B về đúng vị trí host. |
| 7 | Lặp 1–6 với **nguồn direct URL (mp4/HLS)** | Hành vi đồng nhất, không hồi quy. |
| 8 | Autoplay bị chặn lúc resume | Hiện overlay **tap-to-play**, không kẹt im lặng. |

**Gates:** `bun run typecheck` + `bun run lint` + `bun run build` xanh.

---

## 5. Bất biến tuyệt đối (KHÔNG phá)
- Anchor chỉ host ghi qua RLS `watch_rooms_update_host`; host **không** broadcast định kỳ.
- Một channel `room:{id}` cho mọi realtime.
- React Compiler bật → không thêm `useCallback/useMemo`.
- Không đổi schema/migration; không chạm tầng hàng chờ (queue).
- Giữ `tryPlay` muted-fallback + `needsGesture` overlay (autoplay policy).

---

## 6. Rủi ro & khắc phục

| Rủi ro | Khắc phục |
| :- | :- |
| `PROGRAMMATIC_WINDOW_MS=800` quá ngắn cho YouTube (seeked về trễ) → vẫn ngắt nhầm | Tăng lên 1000–1200ms; vòng lặp 1s tự re-mark khi còn catch-up. Tinh chỉnh tại cổng #1/#2. |
| Auto-gom "quá tay": follower đang xem lại bị kéo đi khi host vô tình thao tác | Đây là mô hình đã chốt (host action gom cả phòng). Follower có thể tách lại bằng seek của mình sau đó; host không broadcast định kỳ nên giữa các thao tác follower vẫn yên. |
| `isOriginTrusted` ở Vidstack 1.15.6 không có trên một số event | Guard dùng `!== false` (an toàn khi `undefined`) + cửa sổ thời gian là tín hiệu chính. |
| Follower tự play cục bộ (gesture thật) trong cửa sổ ức chế bị bỏ qua | Cửa sổ chỉ 800ms quanh thao tác programmatic; xác suất trùng rất thấp, chấp nhận được. |

---

## 7. Checklist thực thi nhanh
- [ ] 3.1 cửa sổ ức chế + 3.2 tryPlay
- [ ] 3.3 reconcile mark + 3.4 resync/resumeFromGesture mark
- [ ] 3.5 handlers (kết hợp window + isOriginTrusted) + 3.6 handleReceiveAnchor auto-gom
- [ ] (tùy chọn) 3.7 copy banner
- [ ] Cổng #1–#8 (ưu tiên YouTube) + gates typecheck/lint/build
