# Kế hoạch Phase 6 — Tính năng mới Watch-Together (Chat+Reaction · Auto-promote Host · Drag-drop Playlist)

> **Trạng thái:** Đề xuất — chờ thực thi. **Bản viết lại** (sau khi Phase 5 đã hoàn tất ở commit `9c5364f`) để khớp kiến trúc thực tế và vá 3 lỗi nghiêm trọng từ review nội bộ.
> **PHỤ THUỘC:** Phase 5 đã xong & xanh (queue-sync qua Broadcast, playback-sync guard programmatic + auto-gom host, public profiles RPC, reconnect-aware channel).
> **Tài liệu tham chiếu:** `AGENTS.md` (root), `apps/web/AGENTS.md`, `docs/conventions/data-fetching.md`, `docs/conventions/design-system.md`, `docs/conventions/supabase-security.md`.
> **Mục tiêu:** Thêm 3 tính năng cộng tác mà **không** thêm channel/connection mới và **không** phá bất biến: (F) chat + reaction realtime, (G) auto-promote host khi host rớt, (H) kéo-thả sắp xếp playlist.

---

## 0. Đường cơ sở kiến trúc THỰC TẾ (post-Phase 5) — ĐỌC TRƯỚC

Bản Phase 6 cũ viết trước khi Phase 5 đổi transport hàng chờ. Trạng thái **hiện tại** (đã verify trong code) khác như sau — mọi thiết kế Phase 6 phải dựa trên đây:

| Thành phần | Thực tế hiện tại (KHÔNG được hồi quy) |
| :- | :- |
| `useRoomChannel` chữ ký | `useRoomChannel(room, userId, isHost, onAnchor)` |
| `useRoomChannel` return | `{ participants, broadcastAnchor, broadcastQueueEvent, channelStatus }` — **`broadcastQueueEvent` là sống còn** (đồng bộ thêm/xóa/reorder/advance hàng chờ; dùng trong `watch-room.tsx` + truyền xuống `SideDock`/`PlaylistPanel`). |
| Channel `room:{id}` đang mang | broadcast `playback`, broadcast `queue`, postgres_changes `watch_rooms` (UPDATE), presence. **Queue KHÔNG còn dùng postgres_changes** (migration 015 đã revert replica identity). |
| Sync controller | Đã có `programmaticUntilRef`/`markProgrammatic`/`isFollowerManualEvent` + auto-gom follower trong `handleReceiveAnchor`. Không đụng tới ở Phase 6. |
| Host heartbeat | `use-host-heartbeat.ts` bump `host_heartbeat_at` mỗi **20s**. |
| `claim_room_host` (migration 011) | Atomic, **cổng staleness 30s** (`host_heartbeat_at < now() - 30s` HOẶC host rời phòng). |
| Migrations | tới **015** (`015_revert_queue_replica_identity.sql`). |

> ⚠️ **Quy tắc vàng cho Phase F:** khi mở rộng `useRoomChannel`, **PHẢI giữ `broadcastQueueEvent` trong return**. Bỏ sót sẽ làm `watch-room.tsx` nhận `undefined` → **crash khi thêm/xóa video** hoặc **mất đồng bộ hàng chờ**.

---

## 1. Quy ước cho người thực thi

- Mọi đường dẫn tính từ gốc repo `D:\Dev\web-os`.
- **Bất biến §5** không được phá: **một** channel `room:{id}` (giờ mang 4 broadcast event sau Phase 6: playback, queue, chat, reaction); anchor/heartbeat chỉ host ghi qua RLS; `claim_room_host` SECURITY DEFINER giữ cổng staleness 30s; React Compiler bật (không memo tay) → dùng **latest-ref pattern** cho callback trong effect dài hạn (giống `onAnchorLatestRef`).
- Làm tuần tự **F → G → H**. Mỗi phase có "Cổng nghiệm thu".
- Lệnh: `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build`.
- Stack: Next 16.2.9, React 19.2.4, `@vidstack/react` 1.15.6, `@supabase/supabase-js` 2.108, TanStack Query 5.101, **Tailwind v4**. UI: `@pumni/ui` (token OKLCH, **không mã màu raw**).

---

## 2. Bảng quyết định

| # | Vấn đề | Cách chọn | Lý do |
| :- | :- | :- | :- |
| F | Lưu chat ở đâu | **Ephemeral qua Broadcast** trên channel `room:{id}` sẵn có | Free tier nhẹ; độ trễ thấp; không thêm connection. Lưu DB → Phụ lục §6 (tùy chọn sau). |
| F | Reaction | Broadcast event riêng `reaction` + overlay emoji bay | Nhẹ, vui, không cần state bền. |
| G | Host rớt | **Auto-promote member vào sớm nhất** (presence `joinedAt`) với **retry định kỳ** sau khi vượt cổng staleness; **giữ** banner thủ công làm fallback | RPC atomic; chỉ 1 ứng viên gọi để tránh spam. **Phải retry** vì DB từ chối cho tới khi heartbeat host cũ > 30s (xem Lỗi nghiêm trọng §3-G). |
| H | Kéo-thả | `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` (**dep mới**), giữ `fractionalPosition` + `useReorderQueue` + broadcast `queue`; **giữ ▲/▼** làm fallback A11y | dnd-kit hỗ trợ keyboard + touch. Xác nhận tương thích React 19/Next 16 khi cài. |

---

## 3. Chi tiết các Phase

### PHASE F — Chat + Reaction realtime (ephemeral qua Broadcast)

> **Nguyên tắc:** dùng đúng channel `room:{id}` đã subscribe. Thêm 2 broadcast event: `chat` và `reaction` — nâng tổng số event broadcast trên channel lên 4 (playback, queue, chat, reaction). Không DB, không connection mới.

#### F1. Validator — `packages/validators/src/watch.ts`

```ts
export const chatMessageSchema = z.object({
  text: z.string().trim().min(1).max(500),
});
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
```
Export trong `packages/validators/src/index.ts`.

#### F2. Types — `apps/web/src/features/watch/types.ts`

Thêm (cạnh `QueueBroadcastEvent` đã có):

```ts
export interface ChatMessage {
  id: string;          // crypto.randomUUID() phía client gửi
  userId: string;
  text: string;
  sentAt: number;      // Date.now() của người gửi (hiển thị/sort cục bộ)
}

export interface ReactionEvent {
  id: string;
  userId: string;
  emoji: string;       // 1 trong tập cho phép
  sentAt: number;
}
```

#### F3. `use-room-channel.ts` — thêm listener + broadcast helpers (GIỮ NGUYÊN phần queue)

Mở rộng chữ ký nhận thêm 2 callback **tùy chọn** (đặt sau `onAnchor`), lưu vào latest-ref như `onAnchorLatestRef`:

```ts
export function useRoomChannel(
  room: Room,
  userId: string,
  isHost: boolean,
  onAnchor: (anchor: PlaybackAnchor) => void,
  onChat?: (m: ChatMessage) => void,
  onReaction?: (r: ReactionEvent) => void,
) {
  // ...
  const onChatLatestRef = useRef(onChat);
  const onReactionLatestRef = useRef(onReaction);
  useEffect(() => { onChatLatestRef.current = onChat; });
  useEffect(() => { onReactionLatestRef.current = onReaction; });
```

Trong `useEffect` subscribe, **sau listener `queue` hiện có** (giữ nguyên listener queue), thêm:

```ts
activeChannel.on("broadcast", { event: "chat" }, (p: { payload: ChatMessage }) => {
  if (p.payload) onChatLatestRef.current?.(p.payload);
});
activeChannel.on("broadcast", { event: "reaction" }, (p: { payload: ReactionEvent }) => {
  if (p.payload) onReactionLatestRef.current?.(p.payload);
});
```

Thêm 2 helper phát (cạnh `broadcastAnchor`/`broadcastQueueEvent`):

```ts
const broadcastChat = (m: ChatMessage) => {
  channelRef.current?.send({ type: "broadcast", event: "chat", payload: m });
};
const broadcastReaction = (r: ReactionEvent) => {
  channelRef.current?.send({ type: "broadcast", event: "reaction", payload: r });
};
```

**Return — BẮT BUỘC giữ `broadcastQueueEvent`:**

```ts
return {
  participants,
  broadcastAnchor,
  broadcastQueueEvent, // ⚠️ PHẢI GIỮ — nếu thiếu sẽ crash thêm/xóa video
  channelStatus,
  broadcastChat,
  broadcastReaction,
};
```

> ⚠️ Broadcast Supabase mặc định `self: false` → người gửi **không** nhận lại. Người gửi phải tự append cục bộ (F4).

#### F4. `use-room-chat.ts` — MỚI (state + send), có **lọc trùng theo id**

```ts
"use client";

import { useState } from "react";
import { chatMessageSchema } from "@pumni/validators";
import type { ChatMessage, ReactionEvent } from "../types";

const MAX_MESSAGES = 100;

export function useRoomChat(
  userId: string,
  broadcastChat: (m: ChatMessage) => void,
  broadcastReaction: (r: ReactionEvent) => void,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Nhận từ người khác — lọc trùng theo id (resilience nếu self-echo/đổi config sau này)
  const receiveChat = (m: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((x) => x.id === m.id)) return prev;
      return [...prev, m].slice(-MAX_MESSAGES);
    });
  };

  const sendChat = (text: string) => {
    const parsed = chatMessageSchema.safeParse({ text });
    if (!parsed.success) return false;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      userId,
      text: parsed.data.text,
      sentAt: Date.now(),
    };
    broadcastChat(msg);
    receiveChat(msg); // tự append (self:false) — đi qua bộ lọc trùng
    return true;
  };

  const sendReaction = (emoji: string) => {
    broadcastReaction({ id: crypto.randomUUID(), userId, emoji, sentAt: Date.now() });
  };

  return { messages, receiveChat, sendChat, sendReaction };
}
```

#### F5. `chat-panel.tsx` — MỚI (tab Chat)

- Log: `<div role="log" aria-live="polite">` tự cuộn đáy khi có message mới (effect). Tên người gửi lấy từ `profiles` map (đã có từ Phase 5) — fallback id rút gọn; người đã rời phòng có thể thiếu profile → vẫn fallback id.
- Input + nút gửi: `<form onSubmit>` gọi `sendChat`, clear input; `aria-label="Nhập tin nhắn"`.
- Dùng `@pumni/ui` (`Input`, `Button`), token màu, `select-none` khung.

#### F6. `reaction-overlay.tsx` + `reaction-bar.tsx` — MỚI

- `reaction-bar.tsx`: hàng nút emoji cho phép (vd `["❤️","😂","😮","👍","🎉"]`) → `sendReaction(emoji)`. Đặt cạnh Stage, không che controls.
- `reaction-overlay.tsx`: nhận reaction (cả của mình & người khác), render emoji bay lên rồi mờ dần; tự remove sau ~2s qua `setTimeout`. `pointer-events-none absolute inset-0 z-20`, `aria-hidden="true"`.
  > **Tailwind v4:** dùng animation utilities sẵn có / token `@pumni/ui`; **xác nhận plugin animate** (Tailwind v4 không tự có `tailwindcss-animate` như v3) trước khi dùng class cụ thể. Tôn trọng `prefers-reduced-motion`. Không mã màu raw.

#### F7. Wire vào `side-dock.tsx` + `watch-room.tsx`

- `side-dock.tsx`: thêm tab thứ 3 "Trò chuyện" render `<ChatPanel messages sendChat profiles userId />`. (Giữ nguyên truyền `broadcastQueueEvent` xuống `PlaylistPanel`.)
- `watch-room.tsx` — phá vòng phụ thuộc bằng latest-ref giống `onAnchorRef`:

```tsx
const onChatRef = useRef<(m: ChatMessage) => void>(() => {});
const onReactionRef = useRef<(r: ReactionEvent) => void>(() => {});

const {
  participants, broadcastAnchor, broadcastQueueEvent, channelStatus,
  broadcastChat, broadcastReaction,
} = useRoomChannel(
  currentRoom, userId, isHost,
  (a) => onAnchorRef.current(a),
  (m) => onChatRef.current(m),
  (r) => onReactionRef.current(r),
);

const { messages, receiveChat, sendChat, sendReaction } =
  useRoomChat(userId, broadcastChat, broadcastReaction);

useEffect(() => { onChatRef.current = receiveChat; }, [receiveChat]);
// onReactionRef.current trỏ tới hàm push của overlay (lift state reaction lên watch-room
// rồi truyền xuống <ReactionOverlay/>, hoặc overlay tự giữ state và expose push qua ref).
```

- Render `<ReactionOverlay/>` làm child Stage; `<ReactionBar onReact={sendReaction}/>` cạnh Stage. Truyền `messages`, `sendChat` vào `<SideDock>`.

> **Cổng nghiệm thu F (2 trình duyệt):**
> - B gửi chat → A thấy ngay & ngược lại; người gửi thấy tin của mình (self-append, không trùng). Log có `aria-live`.
> - Thả reaction → emoji bay hiện ở **cả hai** màn hình.
> - Reload → chat trống (ephemeral — đúng kỳ vọng).
> - **Regression queue:** thêm/xóa/reorder/advance video vẫn đồng bộ + toast đúng (chứng tỏ `broadcastQueueEvent` còn nguyên).
> - `bun run lint` + `typecheck` xanh.

---

### PHASE G — Auto-promote host khi host rớt

> Sẵn có: `host_heartbeat_at` bump mỗi **20s**; RPC `claim_room_host` (atomic, **cổng staleness 30s**); `useClaimHost`; banner thủ công `HostClaimBanner`. Phase G thêm **tự động** chọn 1 ứng viên gọi claim — nhưng phải **retry** vì cổng 30s.

#### 🔴 Lỗi nghiêm trọng đã vá so với bản cũ
Bản cũ chờ **một lần** 12s rồi gọi claim. Nhưng DB từ chối cho tới khi heartbeat host cũ > **30s**; vì `useEffect` dep không đổi, timeout **chỉ chạy 1 lần → phòng kẹt không host**. Bản này dùng **retry định kỳ**: DB là cổng thật, ta cứ thử lại tới khi qua 30s thì thành công.

#### G1. `use-host-autopromote.ts` — MỚI (retry every 5s)

```ts
"use client";

import { useEffect } from "react";
import type { Participant } from "../types";
import { useClaimHost } from "./use-room-queue";

const RETRY_MS = 5_000; // DB cổng staleness 30s là nguồn chân lý; cứ thử tới khi qua

export function useHostAutopromote(
  roomId: string,
  userId: string,
  isHost: boolean,
  participants: Participant[],
) {
  const claim = useClaimHost(roomId);

  // Ứng viên = member không phải host, joinedAt nhỏ nhất trong số đang present.
  const hostPresent = participants.some((p) => p.isHost);
  const candidate = participants
    .filter((p) => !p.isHost)
    .sort((a, b) => a.joinedAt - b.joinedAt)[0];
  const iAmCandidate = !!candidate && candidate.userId === userId;

  useEffect(() => {
    if (isHost || hostPresent || !iAmCandidate) return;

    let stopped = false;
    const attempt = () => {
      if (stopped) return;
      claim.mutate(undefined, { onError: () => {} }); // DB từ chối êm tới khi >30s
    };
    // Thử ngay (thường bị từ chối nếu chưa đủ 30s) rồi retry tới khi thành công.
    // Khi claim thành công → host_id đổi → isHost=true → effect cleanup dừng interval.
    attempt();
    const interval = setInterval(attempt, RETRY_MS);
    return () => { stopped = true; clearInterval(interval); };
  }, [isHost, hostPresent, iAmCandidate, claim]);
}
```

> **Vì sao retry an toàn:** chỉ **một** ứng viên (joinedAt nhỏ nhất) gọi; RPC atomic; mỗi lần bị từ chối là no-op êm. Khi qua 30s, lần thử kế thành công → client thành host → vòng lặp tự dừng. Nếu host quay lại trước đó → `hostPresent=true` → effect cleanup dừng.

> **Thay thế đơn giản hơn (nếu ngại retry):** một `setTimeout` **35_000ms** (vượt chắc 30s). Nhược: chậm hơn và kém bền nếu host drop ngay sau heartbeat. Khuyến nghị dùng retry.

#### G2. `watch-room.tsx` — wire

```tsx
useHostAutopromote(currentRoom.id, userId, isHost, participants);
```
**Giữ nguyên** `HostClaimBanner` thủ công làm fallback.

> **Cổng nghiệm thu G (2–3 trình duyệt):**
> - A=host, B,C=follower (B vào trước C). Đóng hẳn tab A. Sau khi heartbeat host cũ > 30s, **B** tự thành host (badge "Host", điều khiển hoạt động) không cần bấm gì; C thành follower của B.
> - Devtools: chỉ B gọi `claim_room_host` (retry vài lần rồi thành công), không phải mọi follower.
> - Nếu B cũng đóng tab trước khi promote → C (ứng viên kế) tiếp quản.
> - Mở lại A vào phòng → A là follower.

---

### PHASE H — Kéo-thả sắp xếp playlist (giữ ▲/▼ fallback)

#### H1. Thêm dependency

```
cd apps/web && bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```
> Sau khi thêm: `bun run typecheck` + `bun run build` (xác nhận tương thích React 19 / Next 16). Nếu lỗi tương thích → giữ ▲/▼ (đã đúng) và hoãn H.

#### H2. `playlist-panel.tsx` — bọc Sortable (CÓ guard `over`)

- Bọc list trong `<DndContext onDragEnd={handleDragEnd}>` + `<SortableContext items={items.map(i=>i.id)} strategy={verticalListSortingStrategy}>`.
- Mỗi item: `useSortable({ id: item.id })` → áp `transform/transition` + `attributes`/`listeners` lên handle kéo (icon grip), `setNodeRef` lên row.

#### 🔴 Lỗi nghiêm trọng đã vá: guard `over === null`
Thả ra ngoài danh sách → `over` là `null` → truy cập `over.id` ném `TypeError` crash component. **Bắt buộc** guard:

```ts
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;                 // ⚠️ BẮT BUỘC — thả ngoài list → over null
  if (active.id === over.id) return;

  const without = items.filter((i) => i.id !== active.id);
  const newIndex = without.findIndex((i) => i.id === over.id);
  if (newIndex < 0) return;

  // before = item đứng trước vị trí thả; after = item tại vị trí thả (trong mảng đã loại active)
  const before = newIndex - 1 >= 0 ? without[newIndex - 1] : null;
  const after = without[newIndex] ?? null;

  reorderMutation.mutate(
    { itemId: String(active.id), beforeId: before?.id ?? null, afterId: after?.id ?? null },
    {
      onSuccess: () => {
        toast.success("Đã sắp xếp lại hàng chờ");
        broadcastQueueEvent({ action: "reorder", title: undefined });
      },
      onError: (err) => toast.error(err.message || "Sắp xếp thất bại."),
    }
  );
};
```

> **Lưu ý đồng bộ:** `reorderMutation` đã có optimistic + `onSettled` invalidate. Vì Phase 5 đồng bộ hàng chờ qua **broadcast**, drag-drop **phải** gọi `broadcastQueueEvent({ action: "reorder" })` trong `onSuccess` để client B cập nhật — y như ▲/▼. `broadcastQueueEvent` cần được truyền prop xuống `PlaylistPanel` (hiện đã có cho ▲/▼).
> **Giữ ▲/▼** làm đường A11y/fallback; thêm `aria-label="Kéo để sắp xếp"` cho handle.

#### H3. A11y kéo-thả
- `KeyboardSensor` + `sortableKeyboardCoordinates` cho kéo bằng bàn phím (Tab tới handle, Space + mũi tên). Tôn trọng `prefers-reduced-motion` (tắt animation transform nếu bật).

> **Cổng nghiệm thu H (2 trình duyệt):**
> - Kéo-thả bằng chuột & bàn phím đổi thứ tự; **thả ra ngoài list không crash**; thứ tự **giữ sau refetch** và **đồng bộ chéo** (toast + list ở B).
> - ▲/▼ vẫn hoạt động.
> - `bun run typecheck/lint/build` xanh.

---

## 4. Kiểm thử tổng & gates (cuối Phase 6)

1. `bun run typecheck` + `bun run lint` + `bun run test` + `bun run build` xanh (build toàn repo vì chạm validators/types).
2. Smoke 2–3 trình duyệt: chat 2 chiều + reaction bay (F); host rớt → auto-promote ứng viên sớm nhất sau >30s (G); kéo-thả + keyboard reorder đồng bộ, thả-ngoài không crash (H).
3. Devtools Realtime: vẫn **một** channel `room:{id}`; chat/reaction không tạo connection mới (chỉ thêm event).
4. **Regression Phase 5 (quan trọng):** follower vẫn bám/auto-gom host; **thêm/xóa/reorder/advance hàng chờ vẫn đồng bộ + toast** (chứng tỏ `broadcastQueueEvent` còn nguyên); tên/avatar hiện đủ.

---

## 5. Bất biến tuyệt đối (KHÔNG phá)
- **Một** channel `room:{id}` mang Broadcast(playback/queue/chat/reaction) + Presence + postgres_changes(`watch_rooms`). Chat/reaction KHÔNG tạo channel/connection mới.
- **`broadcastQueueEvent` PHẢI còn trong return của `useRoomChannel`** — đây là transport đồng bộ hàng chờ sau Phase 5.
- Anchor/heartbeat **chỉ host ghi** qua RLS `watch_rooms_update_host`; `claim_room_host` SECURITY DEFINER giữ cổng staleness 30s — auto-promote chỉ là trigger có retry, DB là authorization.
- `leaveRoom` chỉ chạy trên hành động chủ ý.
- React Compiler bật → không thêm `useCallback/useMemo`; dùng latest-ref pattern cho callback trong effect dài hạn.
- Chat ring-buffer ≤100 trong state; validate `chatMessageSchema` **trước khi** broadcast; lọc trùng theo `id` khi nhận.
- Không mã màu raw (token OKLCH `@pumni/ui`); tôn trọng `prefers-reduced-motion`.

## 6. Phụ lục (TÙY CHỌN, làm sau): lưu lịch sử chat vào DB
Nếu cần chat bền: bảng `watch_messages(id, room_id, user_id, text, created_at)` + RLS `is_room_member` cho select/insert; seed qua TanStack + tiếp tục realtime qua broadcast. **Ngoài phạm vi Phase 6** để giữ Free tier nhẹ.

## 7. Checklist thực thi nhanh
- [ ] **Tiền đề:** Phase 5 xong & gates xanh; xác nhận `useRoomChannel` đang return `broadcastQueueEvent`
- [ ] F1–F7 (validator, types, channel broadcast chat/reaction **giữ broadcastQueueEvent**, hook chat lọc-trùng, chat-panel, reaction overlay/bar, wire) → cổng F (kèm regression queue)
- [ ] G1–G2 (auto-promote **retry 5s**) → cổng G (2–3 trình duyệt, chờ >30s)
- [ ] H1–H3 (dnd-kit, sortable **guard over**, broadcast reorder, a11y) → cổng H
- [ ] Kiểm thử tổng + gates → hoàn tất
