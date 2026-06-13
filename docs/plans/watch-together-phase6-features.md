# Kế hoạch Phase 6 — Tính năng mới Watch-Together (Chat+Reaction · Auto-promote Host · Drag-drop Playlist)

> **Trạng thái:** Đề xuất — chờ thực thi.
> **PHỤ THUỘC:** Chạy **ngay sau** `docs/plans/watch-together-phase5-hardening-v2.md` (Phase 5 phải xong & xanh). Phase 6 xây trên nền đã gia cố: sync follower đã đúng (A1), reorder đã đúng (A2), profiles public đã đọc được (B), channel reconnect-aware (C1).
> **Tài liệu tham chiếu:** `AGENTS.md` (root), `apps/web/AGENTS.md`, `docs/conventions/data-fetching.md`, `docs/conventions/design-system.md`, `docs/conventions/supabase-security.md`.
> **Mục tiêu:** Bổ sung 3 tính năng cộng tác mà **không** thêm channel/connection mới và **không** phá bất biến: (F) chat + reaction realtime, (G) auto-promote host khi host rớt, (H) kéo-thả sắp xếp playlist.

---

## 0. Quy ước cho người thực thi (ĐỌC TRƯỚC)

- Mọi đường dẫn tính từ gốc repo `D:\Dev\web-os`.
- **Phải hoàn tất Phase 5 trước.** Đặc biệt cần: handlers `isOriginTrusted` (A1), reorder đúng (A2), `get_public_profiles` (B), `wasDisconnectedRef` reconnect (C1).
- **Bất biến §5** không được phá: một channel `room:{id}`; anchor/heartbeat chỉ host ghi qua RLS; `claim_room_host` SECURITY DEFINER giữ cổng staleness 30s; React Compiler bật (không thêm memo tay); refs cho dữ liệu tần suất cao.
- Làm tuần tự **F → G → H**. Mỗi phase có "Cổng nghiệm thu".
- Lệnh: `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build`.
- Stack: Next 16.2.9, React 19.2.4, `@vidstack/react` 1.15.6, `@supabase/supabase-js` 2.108, TanStack Query 5.101. UI: `@pumni/ui` (token OKLCH, không mã màu raw), `tailwindcss-animate` có sẵn (dùng cho animation reaction).

---

## 1. Bảng quyết định (cách chọn & lý do)

| # | Vấn đề | Cách chọn | Lý do / loại bỏ phương án khác |
| :- | :- | :- | :- |
| F | Lưu chat ở đâu | **Ephemeral qua Broadcast** trên channel `room:{id}` sẵn có | Supabase Free tiết kiệm DB/quota; độ trễ thấp; không thêm connection. Lưu DB (bảng `watch_messages`) để **Phụ lục §6** (tùy chọn sau). |
| F | Reaction | Broadcast event riêng `reaction` + overlay emoji bay (CSS `tailwindcss-animate`) | Nhẹ, vui, không cần state bền. |
| G | Host rớt | **Auto-promote member vào sớm nhất** (presence `joinedAt`) sau grace, **giữ** banner thủ công làm fallback | Phase 4 đã có heartbeat + `claim_room_host` atomic; chỉ cần 1 ứng viên tự gọi để tránh race. Bỏ "mọi member cùng gọi" (spam RPC). |
| H | Kéo-thả | `@dnd-kit/core` + `@dnd-kit/sortable` (**dep mới**), **giữ** `fractionalPosition` + `useReorderQueue`; **giữ ▲/▼** làm fallback A11y | dnd-kit hỗ trợ keyboard + touch (đúng giá trị A11y dự án). Native HTML5 DnD bị loại vì touch/A11y kém. Cần xác nhận thêm dep khi thực thi. |

---

## 2. Bản đồ file thay đổi

```
package.json (apps/web)                   # SỬA (H): + @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

packages/validators/src/
  watch.ts                                # SỬA (F): chatMessageSchema (validate nội dung chat trước khi broadcast)
  index.ts                                # SỬA: export schema mới

apps/web/src/features/watch/
  types.ts                                # SỬA (F): ChatMessage, ReactionEvent
  hooks/
    use-room-channel.ts                   # SỬA (F): + listener broadcast chat/reaction; return broadcastChat/broadcastReaction
    use-room-chat.ts                      # MỚI (F): state messages ring-buffer + send helpers
    use-host-autopromote.ts               # MỚI (G): chọn ứng viên & auto claim
  components/
    chat-panel.tsx                        # MỚI (F): tab Chat (input + log)
    reaction-overlay.tsx                  # MỚI (F): emoji bay trên Stage
    reaction-bar.tsx                      # MỚI (F): nút thả reaction (trên control bar / cạnh Stage)
    side-dock.tsx                         # SỬA (F): thêm tab "Trò chuyện"
    playlist-panel.tsx                    # SỬA (H): bọc danh sách bằng dnd-kit Sortable (giữ ▲/▼)
    watch-room.tsx                        # SỬA (F,G): wire chat/reaction overlay; dùng use-host-autopromote
```

---

## 3. Chi tiết các Phase

### PHASE F — Chat + Reaction realtime (ephemeral qua Broadcast)

> **Nguyên tắc:** dùng đúng channel `room:{id}` đã subscribe trong `use-room-channel.ts`. Thêm 2 broadcast event: `chat` và `reaction`. Không DB, không connection mới.

#### F1. Validator — `packages/validators/src/watch.ts`

```ts
export const chatMessageSchema = z.object({
  text: z.string().trim().min(1).max(500),
});
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
```
Export trong `packages/validators/src/index.ts`.

#### F2. Types — `apps/web/src/features/watch/types.ts`

```ts
export interface ChatMessage {
  id: string;          // crypto.randomUUID() phía client gửi
  userId: string;
  text: string;
  sentAt: number;      // Date.now() của người gửi (chỉ để hiển thị/sort cục bộ)
}

export interface ReactionEvent {
  id: string;
  userId: string;
  emoji: string;       // 1 trong tập cho phép
  sentAt: number;
}
```

#### F3. `use-room-channel.ts` — thêm listener + broadcast helpers

Trong `useEffect` subscribe (cạnh listener `broadcast playback`), thêm 2 listener. Vì component cần nhận message, dùng pattern "latest ref callback" như `onAnchorLatestRef` (tránh re-subscribe):

```ts
  const onChatLatestRef = useRef<(m: ChatMessage) => void>(() => {});
  const onReactionLatestRef = useRef<(r: ReactionEvent) => void>(() => {});
  // (component set 2 ref này qua tham số hook — xem chữ ký bên dưới)

  // trong useEffect, sau listener "playback":
  activeChannel.on("broadcast", { event: "chat" }, (p: { payload: ChatMessage }) => {
    if (p.payload) onChatLatestRef.current(p.payload);
  });
  activeChannel.on("broadcast", { event: "reaction" }, (p: { payload: ReactionEvent }) => {
    if (p.payload) onReactionLatestRef.current(p.payload);
  });
```

Mở rộng chữ ký hook để nhận 2 callback (giống `onAnchor`), và return 2 helper:

```ts
export function useRoomChannel(
  room: Room,
  userId: string,
  isHost: boolean,
  onAnchor: (anchor: PlaybackAnchor) => void,
  onChat?: (m: ChatMessage) => void,
  onReaction?: (r: ReactionEvent) => void,
) {
  // ... set onChatLatestRef/onReactionLatestRef trong useEffect [như onAnchorLatestRef]

  const broadcastChat = (m: ChatMessage) => {
    channelRef.current?.send({ type: "broadcast", event: "chat", payload: m });
  };
  const broadcastReaction = (r: ReactionEvent) => {
    channelRef.current?.send({ type: "broadcast", event: "reaction", payload: r });
  };

  return { participants, broadcastAnchor, channelStatus, broadcastChat, broadcastReaction };
}
```

> ⚠️ Broadcast của Supabase mặc định **không** tự gửi lại cho người gửi (`self: false`). Vì vậy người gửi phải **tự append** message vào state cục bộ ngay khi gửi (optimistic) — xem F4.

#### F4. `use-room-chat.ts` — MỚI (state + send)

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

  // Nhận từ người khác (gọi bởi use-room-channel qua onChat)
  const receiveChat = (m: ChatMessage) => {
    setMessages((prev) => [...prev, m].slice(-MAX_MESSAGES));
  };

  // Gửi: validate → broadcast → tự append (self:false nên không vọng lại)
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
    setMessages((prev) => [...prev, msg].slice(-MAX_MESSAGES));
    return true;
  };

  const sendReaction = (emoji: string) => {
    broadcastReaction({ id: crypto.randomUUID(), userId, emoji, sentAt: Date.now() });
  };

  return { messages, receiveChat, sendChat, sendReaction };
}
```

Reaction overlay quản lý danh sách emoji "đang bay" riêng (xem F6) — `useRoomChat` chỉ phát/nhận; component overlay nhận callback `onReaction`.

#### F5. `chat-panel.tsx` — MỚI (tab Chat)

- Log messages: `<div role="log" aria-live="polite">` cuộn xuống đáy khi có message mới (effect scroll). Hiển thị tên người gửi qua `profiles` map (đã có từ Phase 5 B) — fallback id rút gọn.
- Input + nút gửi: `<form>` `onSubmit` gọi `sendChat`, clear input. Input có `aria-label="Nhập tin nhắn"`.
- Dùng component `@pumni/ui` (`Input`, `Button`), token màu, `select-none` ở khung.

#### F6. `reaction-overlay.tsx` + `reaction-bar.tsx` — MỚI

- `reaction-bar.tsx`: hàng nút emoji cho phép (ví dụ `["❤️","😂","😮","👍","🎉"]`) → `sendReaction(emoji)`. Đặt cạnh Stage (không che controls).
- `reaction-overlay.tsx`: nhận sự kiện reaction (cả của mình & người khác), render emoji bay từ dưới lên rồi mờ dần bằng class `tailwindcss-animate` (vd `animate-in fade-in slide-in-from-bottom` + tự remove sau ~2s qua `setTimeout`). `pointer-events-none absolute inset-0 z-20`. `aria-hidden="true"` (trang trí).

#### F7. Wire vào `side-dock.tsx` + `watch-room.tsx`

- `side-dock.tsx`: thêm tab thứ 3 "Trò chuyện" (`TabsTrigger value="chat"`) render `<ChatPanel …>`. Truyền `messages`, `sendChat`, `profiles`, `userId` xuống.
- `watch-room.tsx`:
  - `const { messages, receiveChat, sendChat, sendReaction } = useRoomChat(userId, broadcastChat, broadcastReaction);` — nhưng `broadcastChat` đến từ `useRoomChannel`, mà `useRoomChannel` cần `onChat=receiveChat`. Phá vòng lặp bằng **latest-ref** giống `onAnchorRef`:
    ```tsx
    const onChatRef = useRef<(m: ChatMessage) => void>(() => {});
    const onReactionRef = useRef<(r: ReactionEvent) => void>(() => {});
    const { participants, broadcastAnchor, channelStatus, broadcastChat, broadcastReaction } =
      useRoomChannel(currentRoom, userId, isHost,
        (a) => onAnchorRef.current(a),
        (m) => onChatRef.current(m),
        (r) => onReactionRef.current(r));
    const { messages, receiveChat, sendChat, sendReaction } =
      useRoomChat(userId, broadcastChat, broadcastReaction);
    useEffect(() => { onChatRef.current = receiveChat; }, [receiveChat]);
    // onReactionRef.current = (r) => reactionOverlay.push(r)  (xem dưới)
    ```
  - Reaction: overlay giữ state riêng; trong `watch-room.tsx` đặt `onReactionRef.current` trỏ tới hàm push của overlay (hoặc lift state reaction lên watch-room rồi truyền xuống overlay). Render `<ReactionOverlay …/>` làm child của Stage; `<ReactionBar onReact={sendReaction}/>` cạnh Stage.
  - Truyền `messages`, `sendChat` vào `<SideDock>`.

> **Cổng nghiệm thu F (2 trình duyệt):**
> - B gửi chat → A thấy ngay (và ngược lại); người gửi thấy message của chính mình (self-append). Log có `aria-live`.
> - Thả reaction → emoji bay hiện ở **cả hai** màn hình.
> - Reload → chat trống (ephemeral — đúng kỳ vọng).
> - `bun run lint` xanh (không mã màu raw); `typecheck` xanh.

---

### PHASE G — Auto-promote host khi host rớt

> Phase 4 đã có: `host_heartbeat_at` (host bump mỗi 15s→20s sau Phase 5 D3), RPC `claim_room_host` (atomic, cổng staleness 30s), `useClaimHost`, banner thủ công `HostClaimBanner`. Phase G chỉ thêm **tự động** chọn 1 ứng viên gọi claim.

#### G1. `use-host-autopromote.ts` — MỚI

Chọn **member vào sớm nhất đang present** (presence `joinedAt` nhỏ nhất, loại host hiện tại) làm ứng viên duy nhất tự gọi claim sau khi host vắng > grace. Chỉ ứng viên đó gọi → tránh đua; RPC vẫn atomic nên nếu trùng vẫn an toàn.

```ts
"use client";

import { useEffect } from "react";
import type { Participant } from "../types";
import { useClaimHost } from "./use-room-queue";

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
    // Đợi qua grace của claim_room_host (DB tự kiểm tra staleness 30s).
    const t = setTimeout(() => {
      claim.mutate(undefined, {
        // Im lặng nếu DB từ chối (host vừa hoạt động lại) — không spam toast.
        onError: () => {},
      });
    }, 12_000); // > 10s (banner) nhưng vẫn trong vùng hợp lý; DB là nguồn chân lý
    return () => clearTimeout(t);
  }, [isHost, hostPresent, iAmCandidate, claim]);
}
```

> **Lưu ý:** DB `claim_room_host` mới là authorization thật (staleness 30s + heartbeat). Hook chỉ là trigger; nếu host quay lại trong grace, RPC raise exception → nuốt êm.

#### G2. `watch-room.tsx` — wire

Sau `useRoomChannel` (có `participants`) và `isHost`, thêm:

```tsx
useHostAutopromote(currentRoom.id, userId, isHost, participants);
```

**Giữ nguyên** `HostClaimBanner` (banner thủ công) làm fallback nếu ứng viên cũng rớt.

> **Cổng nghiệm thu G (2–3 trình duyệt):**
> - A=host, B,C=follower (B vào trước C). Đóng hẳn tab A. Sau ~12–30s, **B** (vào sớm nhất) tự trở thành host (badge "Host", điều khiển hoạt động) mà không cần bấm gì; C thành follower của B.
> - Mở lại A vào phòng → A là follower.
> - Devtools: chỉ B gọi `claim_room_host` (không phải mọi follower).
> - Nếu B cũng đóng tab trước khi promote → C (ứng viên kế) tiếp quản; hoặc banner thủ công hiện cho người còn lại.

---

### PHASE H — Kéo-thả sắp xếp playlist (giữ ▲/▼ fallback)

#### H1. Thêm dependency

```
cd apps/web && bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```
> Sau khi thêm: `bun run typecheck` + `bun run build` (xác nhận tương thích React 19 / Next 16). Nếu có vấn đề tương thích → giữ ▲/▼ (đã đúng sau Phase 5 A2) và hoãn H sang sau.

#### H2. `playlist-panel.tsx` — bọc danh sách bằng Sortable

- Bọc list items trong `<DndContext>` + `<SortableContext items={items.map(i=>i.id)} strategy={verticalListSortingStrategy}>`.
- Mỗi item dùng `useSortable({ id: item.id })` → áp `transform/transition` + `attributes`/`listeners` lên handle kéo (icon grip), `setNodeRef` lên row.
- `onDragEnd(event)`: từ `active.id` và `over.id` tính chỉ số mới trong mảng, suy ra `beforeId/afterId` neighbor (đúng quy ước Phase 5 A2: before = item đứng trước vị trí thả, after = item đứng sau) rồi gọi `reorderMutation.mutate({ itemId, beforeId, afterId })`.
  ```ts
  const oldIndex = items.findIndex(i => i.id === active.id);
  const newIndex = items.findIndex(i => i.id === over.id);
  if (oldIndex === newIndex) return;
  const without = items.filter(i => i.id !== active.id);
  const before = without[newIndex - 1] ?? null; // sau khi bỏ active
  const after  = without[newIndex] ?? null;
  reorderMutation.mutate({ itemId: active.id, beforeId: before?.id ?? null, afterId: after?.id ?? null });
  ```
  > Lưu ý tính `before/after` theo mảng đã loại `active` để khớp ngữ nghĩa "chèn vào giữa". Kiểm thử kỹ ở cổng H.
- **Giữ ▲/▼** (đã đúng từ A2) như đường A11y/fallback; thêm `aria-label` cho handle kéo.
- Optimistic reorder của `useReorderQueue` (đã có) lo cập nhật tức thời; `onSettled` hội tụ.

#### H3. A11y kéo-thả
- dnd-kit `KeyboardSensor` + `sortableKeyboardCoordinates` cho phép kéo bằng bàn phím. Handle có `aria-label="Kéo để sắp xếp"`. Tôn trọng `prefers-reduced-motion` (tắt animation transform nếu bật).

> **Cổng nghiệm thu H (2 trình duyệt):**
> - Kéo-thả đổi thứ tự bằng chuột; bằng bàn phím (tab tới handle, Space + mũi tên). Thứ tự **giữ nguyên** sau refetch và **đồng bộ chéo** sang trình duyệt kia.
> - ▲/▼ vẫn hoạt động.
> - `bun run typecheck/lint/build` xanh.

---

## 4. Kiểm thử tổng & gates (cuối Phase 6)

1. `bun run typecheck` + `bun run lint` + `bun run test` + `bun run build` xanh (build toàn repo vì chạm validators/types).
2. Smoke 2–3 trình duyệt: chat 2 chiều + reaction bay (F); host rớt → auto-promote ứng viên sớm nhất (G); kéo-thả + keyboard reorder đồng bộ (H).
3. Devtools Realtime: vẫn **một** channel `room:{id}`; chat/reaction không tạo connection mới.
4. Regression Phase 5: follower vẫn bám host; reorder vẫn đúng; tên/avatar hiện đủ.

---

## 5. Bất biến tuyệt đối (KHÔNG phá)
- **Một** channel `room:{id}` cho Broadcast(anchor/chat/reaction) + Presence + postgres_changes. Chat/reaction KHÔNG tạo channel/connection mới.
- Anchor/heartbeat **chỉ host ghi** qua RLS `watch_rooms_update_host`; `claim_room_host` SECURITY DEFINER giữ cổng staleness 30s — auto-promote chỉ là trigger, DB là authorization.
- `leaveRoom` chỉ chạy trên hành động chủ ý.
- React Compiler bật → không thêm `useCallback/useMemo`; dùng latest-ref pattern cho callback trong effect dài hạn (giống `onAnchorRef`).
- Refs cho dữ liệu tần suất cao; chat ring-buffer ≤100 trong state (tần suất thấp, OK).
- Validate nội dung chat bằng `chatMessageSchema` **trước khi** broadcast (chống nội dung rác/quá dài).

## 6. Phụ lục (TÙY CHỌN, làm sau): lưu lịch sử chat vào DB
Nếu cần chat bền (không mất khi reload): bảng `watch_messages(id, room_id, user_id, text, created_at)` + RLS `is_room_member` cho select/insert; seed initial messages qua query (TanStack) + tiếp tục realtime qua `postgres_changes` hoặc broadcast. **Đánh dấu ngoài phạm vi Phase 6** để giữ Free tier nhẹ; chỉ làm khi có nhu cầu rõ.

## 7. Checklist thực thi nhanh
- [ ] **Tiền đề:** Phase 5 đã xong & gates xanh
- [ ] F1–F7 (validator, types, channel broadcast chat/reaction, hook chat, chat-panel, reaction overlay/bar, wire) → cổng F
- [ ] G1–G2 (auto-promote) → cổng G (test 2–3 trình duyệt)
- [ ] H1–H3 (dnd-kit, sortable, a11y) → cổng H
- [ ] Kiểm thử tổng + gates → hoàn tất
