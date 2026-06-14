# Kế hoạch Phase 5 (Fix) — Đồng bộ Hàng chờ qua Broadcast

> **Trạng thái:** Đề xuất — chờ thực thi.
> **Bổ sung cho:** `docs/plans/watch-together-phase5-hardening-v2.md`. Bản fix này **không** đổi kiến trúc playback/anchor; nó **thay transport đồng bộ hàng chờ** từ `postgres_changes` (mong manh) sang **Supabase Broadcast** (đáng tin cậy, đồng nhất với anchor playback).
> **Tài liệu tham chiếu:** `AGENTS.md` (root), `apps/web/AGENTS.md`, `docs/conventions/data-fetching.md`, `docs/conventions/supabase-security.md`.
> **Mục tiêu:** Sau bản fix, khi A **thêm / xóa / sắp xếp / chuyển** video: (1) A thấy thông báo **tự kích hoạt** (local, tức thì); (2) B thấy thông báo tương ứng; (3) **danh sách của B được đồng bộ ngay** — hết bug mất đồng bộ.

---

## 0. Quy ước cho người thực thi (ĐỌC TRƯỚC)

- Mọi đường dẫn tính từ gốc repo `D:\Dev\web-os`.
- **KHÔNG phá bất biến §5.** Đặc biệt: **một** channel `room:{id}` duy nhất; anchor playback chỉ host ghi; `leaveRoom` chỉ chạy trên hành động chủ ý.
- React Compiler **đang BẬT** → **không thêm** `useCallback/useMemo` mới.
- Làm tuần tự **A → B → C**. Mỗi phase có "Cổng nghiệm thu" — phải xanh mới sang phase kế.
- Lệnh kiểm thử (PowerShell, gốc repo): `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build`.

---

## 1. Nguyên nhân gốc (vì sao đang mất đồng bộ)

Đồng bộ hàng chờ hiện cưỡi trên `postgres_changes` của `watch_queue_items` (`use-room-channel.ts`, listener #3). Đây là transport realtime **mong manh nhất** của Supabase, và đúng 3 điểm yếu của nó gây bug:

| # | Vấn đề | Hệ quả |
| :- | :- | :- |
| 1 | **RLS đánh giá per-subscriber.** `watch_queue_select = is_room_member(room_id) AND auth.uid() is not null`. B chỉ `POST /api/watch/[roomId]/join` **sau mount** (`watch-room.tsx:72`). Nếu kênh subscribe / event bắn ra trước khi membership commit hoặc trước khi token realtime được set → Realtime coi B là non-member/anon. | **Drop sạch event** (race, lúc được lúc không). |
| 2 | **DELETE/reorder cần `REPLICA IDENTITY FULL`.** Mặc định row OLD chỉ có PK → filter client `room_id=eq.X` không khớp, RLS theo `room_id` không đánh giá được. | **Event DELETE không tới B.** |
| 3 | **Logic `localDeletedQueueItemIds`** (Set toàn cục) chỉ là vá để đoán self/other cho toast — không sửa được nguồn lỗi ở (1)(2). | Phức tạp thừa, vẫn lỗi. |

→ Code JS không "hỏng" (lệnh `invalidateQueries` vẫn chạy); **event realtime không tới được B**. Các migration 013/014 là băng dán cho một transport vốn fragile.

**Giải pháp:** dùng **Broadcast** — kênh A→server→mọi-subscriber, **không** phụ thuộc RLS-per-subscriber, REPLICA IDENTITY hay WAL. Đây cũng chính là cơ chế anchor playback đang chạy ổn (`broadcastAnchor`). Hàng chờ đi cùng mô hình → nhất quán + tin cậy.

---

## 2. Thiết kế đích

**Nguyên tắc một-nguồn cho mỗi phía:**

- **Phía người thao tác (A):** toast hiển thị **local** trong `onSuccess` của mutation (tự kích hoạt, tức thì, không chờ round-trip). Sau khi server action OK, A **gửi broadcast `queue`** cho người khác. A **không** tự nhận lại broadcast (giữ `broadcast.self` mặc định = `false`) → không double toast, không cần `localDeletedQueueItemIds`.
- **Phía người nhận (B):** listener `broadcast/queue` trong `use-room-channel.ts` → **luôn** `invalidateQueries(queue)` (danh sách re-fetch từ DB, vẫn qua RLS đọc) + hiện toast theo `action`.

> **Vì sao không bật `broadcast.self = true`:** sẽ làm host nhận lại cả event `playback` của chính mình → nhiễu vòng anchor. Giữ self=false, toast của A xử lý local.

**Payload broadcast** (ephemeral, không phải nguồn chân lý — chỉ để kích hoạt refetch + toast):

```ts
// types.ts (feature watch)
export interface QueueBroadcastEvent {
  action: "add" | "remove" | "reorder" | "advance";
  title?: string | null; // tiêu đề video liên quan (nếu có) để toast giàu thông tin
}
```

**Phục hồi sau mất kết nối:** broadcast là ephemeral — B rớt mạng sẽ **mất** event phát trong lúc gap. Tận dụng `wasDisconnectedRef` đã có: khi resubscribe sau disconnect, invalidate **cả `queue` lẫn `room`** để kéo lại trạng thái mới nhất.

---

## 3. Bản đồ file thay đổi

```
apps/web/src/features/watch/
  types.ts                       # SỬA: thêm interface QueueBroadcastEvent
  hooks/
    use-room-channel.ts          # SỬA: + broadcastQueueEvent; + listener broadcast/queue;
                                  #       GỠ listener postgres_changes watch_queue_items;
                                  #       reconnect → invalidate cả queue; bỏ import localDeletedQueueItemIds
    use-room-queue.ts            # SỬA: GỠ export localDeletedQueueItemIds + mọi tham chiếu;
                                  #       (mutation giữ optimistic + onSettled invalidate như cũ)
  components/
    watch-room.tsx               # SỬA: nhận broadcastQueueEvent từ useRoomChannel;
                                  #       handleEnded (auto-advance) broadcast {action:"advance"};
                                  #       truyền broadcastQueueEvent xuống SideDock
    side-dock.tsx                # SỬA: prop broadcastQueueEvent → PlaylistPanel
    playlist-panel.tsx           # SỬA: prop broadcastQueueEvent; gọi trong onSuccess của
                                  #       add/remove/reorder/advance; + toast success cho reorder

supabase/migrations/             # (KHÔNG bắt buộc — đã push) 013/014 có thể giữ nguyên.
                                  # Tùy chọn dọn sau: 013 replica-identity không còn cần cho queue.
```

> Không thêm Context/Provider mới — đi theo lối prop-drill sẵn có (`roomId`, `userId`, `queueItems`… đều đang prop-drill qua `SideDock`).

---

## 4. Chi tiết các Phase

### PHASE A — Kênh broadcast hàng chờ (core)

#### A1. `types.ts` — thêm kiểu payload

Thêm `QueueBroadcastEvent` (xem §2).

#### A2. `use-room-channel.ts`

**(1) Thêm hàm phát** cạnh `broadcastAnchor`:

```ts
const broadcastQueueEvent = (event: QueueBroadcastEvent) => {
  if (channelRef.current) {
    channelRef.current.send({
      type: "broadcast",
      event: "queue",
      payload: event,
    });
  }
};
```

**(2) Thêm listener** trong `useEffect` đăng ký kênh (cạnh listener `playback`):

```ts
activeChannel.on(
  "broadcast",
  { event: "queue" },
  (msg: { payload: QueueBroadcastEvent }) => {
    void queryClient.invalidateQueries({ queryKey: watchKeys.queue(room.id) });
    const { action, title } = msg.payload ?? {};
    const name = title || "Không tên";
    if (action === "add") {
      toast.info(`Video "${name}" đã được thêm vào hàng chờ`);
    } else if (action === "remove") {
      toast.info(`Video "${name}" đã bị xóa khỏi hàng chờ`);
    } else if (action === "reorder") {
      toast.info("Thứ tự hàng chờ vừa được cập nhật");
    }
    // "advance": room source đổi → postgres_changes watch_rooms đã lo invalidate room;
    // chỉ cần đồng bộ lại danh sách (đã invalidate queue ở trên).
  }
);
```

**(3) GỠ listener `postgres_changes` cho `watch_queue_items`** (toàn bộ khối #3 hiện tại) — broadcast thay thế. Gỡ luôn `import { localDeletedQueueItemIds } from "./use-room-queue";`.

**(4) Reconnect:** trong nhánh `if (wasDisconnectedRef.current)` của `.subscribe`, invalidate thêm `queue`:

```ts
if (wasDisconnectedRef.current) {
  wasDisconnectedRef.current = false;
  void queryClient.invalidateQueries({ queryKey: watchKeys.room(room.id) });
  void queryClient.invalidateQueries({ queryKey: watchKeys.queue(room.id) });
}
```

**(5)** Thêm `broadcastQueueEvent` vào object return (cạnh `broadcastAnchor`, `channelStatus`).

#### A3. `use-room-queue.ts` — dọn `localDeletedQueueItemIds`

- Xóa `export const localDeletedQueueItemIds = new Set<string>();`.
- `useRemoveQueueItem`: xóa `localDeletedQueueItemIds.add/delete` trong `onMutate`/`onError`. Giữ nguyên optimistic filter + `onSettled` invalidate.
- `useAdvanceQueue`: xóa nguyên `onMutate`/`onError` (chỉ thêm/xóa Set) — giữ `onSettled`.

> Optimistic update + `onSettled` invalidate của **chính người thao tác** giữ nguyên → A vẫn thấy danh sách đúng tức thì. Broadcast chỉ phục vụ B.

> **Cổng nghiệm thu A:** `bun run typecheck` xanh (không còn tham chiếu `localDeletedQueueItemIds`); không còn listener `postgres_changes` cho queue trong `use-room-channel.ts`.

---

### PHASE B — Nối dây phát broadcast tại điểm thao tác

#### B1. `watch-room.tsx`

- Lấy `broadcastQueueEvent` từ `useRoomChannel(...)`.
- `handleEnded` (auto-advance, host): sau khi `advanceQueueMutation.mutate()` thành công, phát broadcast:

```ts
const handleEnded = () => {
  if (!isHost) return;
  if (queueItems.length === 0) return;
  advanceQueueMutation.mutate(undefined, {
    onSuccess: () => broadcastQueueEvent({ action: "advance" }),
  });
};
```

- Truyền `broadcastQueueEvent` xuống **cả hai** `<SideDock>` (desktop + mobile sheet).

#### B2. `side-dock.tsx`

- Thêm prop `broadcastQueueEvent: (e: QueueBroadcastEvent) => void` vào `SideDockProps`, truyền tiếp xuống `<PlaylistPanel>`.

#### B3. `playlist-panel.tsx`

Thêm prop `broadcastQueueEvent`. Gọi **trong `onSuccess`** (sau khi server OK) cho từng thao tác — A vẫn giữ toast local sẵn có, broadcast là cho B:

```ts
// add
onSuccess: () => {
  toast.success("Đã thêm vào hàng chờ!");
  setSourceRef(""); setTitle("");
  broadcastQueueEvent({ action: "add", title: title.trim() || sourceRef.trim() });
},

// remove (truyền title của item bị xóa)
const handleRemoveItem = (itemId: string) => {
  const removed = items.find((i) => i.id === itemId);
  removeMutation.mutate(itemId, {
    onSuccess: () => {
      toast.success("Đã xóa khỏi hàng chờ!");
      broadcastQueueEvent({ action: "remove", title: removed?.title ?? removed?.source_ref });
    },
    onError: (err) => toast.error(err.message || "Xóa thất bại."),
  });
};

// reorder — THÊM toast success (hiện chưa có) + broadcast
onSuccess: () => {
  toast.success("Đã sắp xếp lại hàng chờ");
  broadcastQueueEvent({ action: "reorder", title: targetItem.title ?? targetItem.source_ref });
},

// advance (nút "Phát tiếp theo")
onSuccess: () => {
  toast.success("Đã chuyển sang video tiếp theo!");
  broadcastQueueEvent({ action: "advance" });
},
```

> `reorderMutation.mutate` hiện chỉ có `onError`. Thêm `onSuccess` như trên (đặt cho cả `handleMoveUp` và `handleMoveDown`, dùng `targetItem` đã có trong scope).

> **Cổng nghiệm thu B:** `bun run typecheck` + `bun run lint` xanh; mọi điểm thao tác đều phát broadcast với `action` đúng.

---

### PHASE C — Kiểm thử & gates

#### C1. Smoke 2 trình duyệt (A=host, B=follower, **khác tài khoản**)

| Bước | Kỳ vọng A (người thao tác) | Kỳ vọng B (người nhận) |
| :- | :- | :- |
| A **thêm** video | toast "Đã thêm vào hàng chờ!" + item hiện ngay | toast "Video … đã được thêm…" + **item xuất hiện** |
| A **xóa** video | toast "Đã xóa…" + item biến mất ngay | toast "Video … đã bị xóa…" + **item biến mất** |
| A **đổi thứ tự** (▲/▼) | toast "Đã sắp xếp lại…" + thứ tự đổi, **giữ sau refetch** | toast "Thứ tự hàng chờ vừa được cập nhật" + **thứ tự đồng bộ** |
| A **Phát tiếp theo** | toast + video chuyển | video chuyển + danh sách đồng bộ |
| Video phát **hết** (host) | tự chuyển video kế | tự chuyển + đồng bộ |
| B **offline 10s** rồi online | — | badge "Mất kết nối…" tắt; **danh sách + phòng tự đồng bộ lại** |

> Quan trọng: **không** còn double toast ở phía A; **không** mất đồng bộ ở phía B cho cả 4 action.

#### C2. Gates
`bun run typecheck` + `bun run lint` + `bun run test` + `bun run build` đều xanh.

> **Cổng nghiệm thu cuối:** C1 đủ 6 dòng, C2 xanh.

---

## 5. Bất biến tuyệt đối (KHÔNG phá)
- **Một** channel `room:{id}` cho mọi realtime (broadcast playback + broadcast queue + presence + postgres_changes watch_rooms).
- `broadcast.self` giữ **mặc định (false)** — không bật, tránh nhiễu vòng anchor playback.
- Anchor + heartbeat **chỉ host ghi** qua RLS `watch_rooms_update_host`.
- DB vẫn là nguồn chân lý của hàng chờ: B luôn **refetch** (`invalidateQueries(queue)`) chứ không dựng list từ payload broadcast.
- `leaveRoom` chỉ chạy trên hành động chủ ý.
- React Compiler bật → không thêm `useCallback/useMemo`.

---

## 6. Rủi ro & khắc phục

| Rủi ro | Khắc phục |
| :- | :- |
| B miss broadcast do rớt mạng đúng lúc | Reconnect invalidate cả `queue` (A2.4) kéo lại trạng thái. |
| A gửi broadcast trước khi channel `joined` | `broadcastQueueEvent` no-op nếu `channelRef.current` null; broadcast phát trong `onSuccess` (sau server OK) — lúc này channel hầu như đã joined. Refetch local của A vẫn đảm bảo A đúng; B sẽ tự đồng bộ ở reconnect/lần thao tác kế nếu lỡ. |
| Còn sót listener `postgres_changes` queue → double toast | Phase A3 gỡ hẳn listener + mọi tham chiếu `localDeletedQueueItemIds`; grep xác nhận. |
| Migration 013 (`replica identity full`) thừa ghi WAL | Không khẩn cấp — đã push, để nguyên. Tùy chọn dọn ở phase sau (queue không còn dùng postgres_changes). |

---

## 7. Checklist thực thi nhanh
- [ ] A1 (type) + A2 (channel: phát/nghe/gỡ pg_changes/reconnect/return) + A3 (dọn Set) → cổng A
- [ ] B1 (watch-room: lấy + auto-advance + truyền) + B2 (side-dock prop) + B3 (playlist-panel onSuccess + toast reorder) → cổng B
- [ ] C1 (smoke 6 dòng) + C2 (gates) → cổng cuối
