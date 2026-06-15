# Kế hoạch Refactor Watch-Together — Phase 3 (Data-layer hiện đại hóa theo Next.js 16 + React 19)

> **Trạng thái:** Đề xuất — chờ thực thi.
> **Tài liệu tham chiếu:** `AGENTS.md` (root), `apps/web/AGENTS.md`, `docs/conventions/data-fetching.md`, `docs/conventions/server-client-boundary.md`.
> **SUPERSEDES:** `docs/plans/watch-together-phase2-upgrade.md` — tài liệu Phase 2 nay đã **lỗi thời** (mô tả `use-room-queue.ts` + `postgres_changes` chưa từng tồn tại trong code chạy thực, và `leaveRoom`-trong-unmount đã bị code chủ động bác bỏ). Plan này ghi nhận kiến trúc thực tế và đề ra hướng chuẩn hóa.
> **Mục tiêu:** Giữ nguyên hành vi đồng bộ playback (vốn tốt) nhưng tái cấu trúc **tầng dữ liệu, realtime và memoization** để: (1) tuân thủ chuẩn data-fetching của chính dự án, (2) tận dụng React Compiler / React 19 / Next.js 16, (3) loại bỏ dead code và đường cập nhật trùng lặp.

---

## 0. Bối cảnh & Quyết định kiến trúc đã chốt

### Đã xác minh trong giai đoạn khám phá:

- **Bảo mật RLS: ĐẠT.** `007_watch_rooms.sql:35-38` (`watch_rooms_update_host`) giới hạn UPDATE cho `auth.uid() = host_id` → host ghi anchor trực tiếp từ browser client là **hợp lệ và an toàn**. `is_room_member()` là `SECURITY DEFINER` chống đệ quy RLS. RPC `transfer_room_host` / `leave_room` atomic. → **Refactor KHÔNG được thay đổi các ranh giới này.**
- **TanStack Query đã wire sẵn** ở root (`app/layout.tsx:64`), có pattern mẫu chuẩn tại `features/profile/profile-form.tsx:100-133` (`useMutation` + `onMutate` optimistic + rollback). Watch là feature **duy nhất** không dùng nó.
- **React Compiler ĐANG BẬT** (`next.config.ts:7`) → mọi `useCallback`/`useMemo` viết tay là thừa.
- **Các bảng đã ở trong publication `supabase_realtime`** (`008:103`, `009:41`, `007:49`) → `postgres_changes` khả dụng về hạ tầng.
- **Bug "duplicate rows"** mà Phase 2 gặp (comment `use-room-channel.ts:27-30`) có nguyên nhân gốc là **chạy đồng thời 2 đường cập nhật** (postgres_changes + refetch tay). Khi gom về **một cache TanStack Query duy nhất**, nguyên nhân này biến mất.

### Quyết định đã chốt (qua trao đổi với chủ dự án):

| Hạng mục            | Quyết định                                                        | Lý do                                                             |
| :------------------ | :---------------------------------------------------------------- | :---------------------------------------------------------------- |
| Cache client        | **TanStack Query** cho room (structural) + queue                  | Đúng `data-fetching.md`, có precedent trong repo                  |
| Realtime structural | **`postgres_changes` → `invalidateQueries`** (KHÔNG tự merge row) | Canonical Supabase+TanStack; một cache duy nhất nên hết duplicate |
| Realtime anchor     | **Giữ Broadcast** (low-latency) → ref trong sync controller       | Anchor tần suất cao, không nên đi qua cache                       |
| Phạm vi             | **Refactor toàn diện một đợt**, phân pha A→F                      | Sạch nhất                                                         |
| Memoization         | Gỡ memo tay, tin React Compiler                                   | Đúng mục tiêu nền tảng                                            |

### Ngoài phạm vi (KHÔNG làm trong Phase 3):

- ❌ Chat / reactions / shared cursor.
- ❌ Drag-and-drop reorder (giữ nút ▲/▼).
- ❌ Auto-promote host khi host rớt mạng (vẫn chuyển thủ công).
- ❌ Thay đổi schema DB / RLS (chỉ đụng nếu cần `REPLICA IDENTITY`, xem Phase A).
- ❌ Thay đổi thuật toán sync (deadband/nudge/hard-seek giữ nguyên).

---

## 1. Nguyên tắc thiết kế tầng dữ liệu mới

### 1.1. Tách bạch hai loại trạng thái room

`watch_rooms` chứa lẫn lộn 2 nhóm cột với vòng đời rất khác nhau:

- **Structural** (đổi hiếm, do hành động chủ ý): `source_type`, `source_ref`, `host_id`, `code`, `current_queue_item_id`.
- **Anchor** (đổi theo tương tác play/pause/seek): `is_playing`, `anchor_position`, `anchor_server_ts`, `playback_rate`.

→ **Structural** sống trong TanStack Query (`roomQuery`). **Anchor** KHÔNG vào cache — đi qua Broadcast vào `anchorRef` của sync controller như hiện tại.

### 1.2. Structural-signature guard (CỐT LÕI — tránh refetch thừa)

Host ghi `watch_rooms` mỗi lần play/pause/seek (debounce 2s). Mỗi lần ghi sẽ phát một event `postgres_changes`. Nếu cứ thế `invalidate`, follower sẽ refetch room mỗi lần host bấm play → lãng phí.

**Giải pháp:** trong handler `postgres_changes` của `watch_rooms`, tính một "signature" chỉ từ các cột structural của `payload.new` và so với signature lần trước; **chỉ `invalidate` khi signature đổi**. Dùng được chỉ với `payload.new` (không cần `REPLICA IDENTITY FULL`).

```ts
const sig = (r) => `${r.source_type}|${r.source_ref}|${r.host_id}|${r.current_queue_item_id}`;
// chỉ invalidate roomQuery khi sig(new) !== lastSigRef.current
```

`watch_queue_items` đổi không thường xuyên → `invalidate` thẳng, không cần guard.

### 1.3. Một cache, một nguồn sự thật

- Mọi mutation (add/remove/reorder/advance/setSource/transferHost) → Server Action (giữ nguyên, đã chuẩn).
- Sau mutation **không** refetch tay; thay vào đó:
  - Optimistic update qua TanStack `onMutate` cho thao tác queue (precedent: `profile-form.tsx`).
  - `postgres_changes` của client KHÁC sẽ tự `invalidate` → đồng bộ chéo.
  - Client thực hiện mutation tự `invalidate` trong `onSettled` để hội tụ về server-truth.
- **Xóa** toàn bộ `revalidatePath("/watch/[id]")` trong các action phòng (vô tác dụng sau hydration). **Giữ** `revalidatePath("/watch")` cho lobby (create/delete/leave) vì lobby là server-rendered list.

---

## 2. Bản đồ file thay đổi

```
apps/web/src/features/watch/
  queries.ts                 # SỬA: Promise.all-friendly; bỏ ensureRoomMembership khỏi đây nếu chuyển sang route
  actions.ts                 # SỬA: bỏ revalidatePath thừa; tách membership
  query-keys.ts              # MỚI: factory key tập trung (watchKeys)
  hooks/
    use-server-clock.ts      # SỬA: re-sync định kỳ (phiên dài)
    use-room-channel.ts      # SỬA LỚN: bỏ refetchRoom/currentRoom state + watch_dirty;
                             #          thêm postgres_changes(room + queue) → invalidate; giữ Broadcast anchor + Presence
    use-room-query.ts        # MỚI: useQuery room structural (seed = initialData từ server)
    use-room-queue.ts        # MỚI: useQuery queue (seed = initialData) + các useMutation optimistic
    use-sync-controller.ts   # SỬA NHẸ: gỡ useCallback; nhận room structural từ query thay vì currentRoom-from-channel
    use-controls-visibility.ts # SỬA: gỡ useCallback (React Compiler)
  components/
    watch-room.tsx           # SỬA LỚN: bỏ useState(queue)+set-during-render+refetch tay; dùng hooks query; gỡ memo
    sync-player.tsx          # SỬA: gỡ useMemo/useCallback (xem 3.B — verify Vidstack)
    room-controls.tsx        # SỬA: gỡ 6 useCallback
    playlist-panel.tsx       # SỬA: chuyển mutation sang hooks use-room-queue
    side-dock.tsx            # SỬA: transferHost qua mutation hook
    participant-rail.tsx     # (tùy chọn) join profiles cho username/avatar
    sync-indicator.tsx       # GIỮ NGUYÊN

apps/web/src/app/(watch)/watch/[roomId]/page.tsx   # SỬA: Promise.all; chuyển membership ra route handler
apps/web/src/app/(watch)/layout.tsx                 # SỬA: sample roomId hợp lệ cho unstable_instant
apps/web/src/app/api/time/route.ts                  # SỬA: export const dynamic = "force-dynamic"
apps/web/src/app/api/watch/[roomId]/join/route.ts   # MỚI (nếu chọn route cho membership)
```

---

## 3. Chi tiết các Pha

### PHASE A — Hạ tầng & rủi ro nền tảng (ít rủi ro, làm trước)

**A1. `/api/time/route.ts` — chống prerender tĩnh.**
Đồng hồ này là nguồn sự thật cho toàn bộ anchor math. Với `cacheComponents: true`, một `GET` không đọc request có nguy cơ bị tối ưu thành tĩnh → trả timestamp chết → **vỡ toàn bộ sync**.

```ts
export const dynamic = 'force-dynamic';
export function GET() {
  return Response.json({ now: Date.now() });
}
```

> Cổng nghiệm thu A1: gọi `/api/time` 2 lần cách nhau → `now` tăng theo thời gian thực; kiểm tra header không có `cache-control: s-maxage`.

**A2. `use-server-clock.ts` — re-sync định kỳ.**
Hiện chỉ sync 1 lần. Thêm `setInterval` re-sync mỗi ~5 phút (cập nhật `clockOffsetRef`, không đổi `ready`). Giữ EMA nhẹ để tránh nhảy offset.

**A3. Quyết định `REPLICA IDENTITY`.**
Thiết kế guard (1.2) chỉ dùng `payload.new` nên **không cần** `REPLICA IDENTITY FULL`. Xác nhận handler `DELETE` của queue dùng được `payload.old` (id luôn có trong old với identity default). Nếu cần `old` đầy đủ cho UPDATE thì cân nhắc migration `011_*` set `replica identity full` cho `watch_queue_items` — **chỉ thêm nếu chứng minh cần**.

> Cổng nghiệm thu Phase A: `bun run typecheck` + `bun run lint` xanh; `/api/time` luôn động.

---

### PHASE B — Gỡ memoization tay (tận dụng React Compiler)

Với `reactCompiler: true`, gỡ toàn bộ `useCallback`/`useMemo` **giữ nguyên `useRef`** (ref là state khả biến, không phải memo).

| File                         | Gỡ                                                                                    | Giữ                                                                                       |
| :--------------------------- | :------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------- |
| `room-controls.tsx`          | 6 `useCallback` (handlePlayPause, handleSeek...)                                      | —                                                                                         |
| `use-sync-controller.ts`     | các `useCallback` (emitAnchor, reconcile, resync, handlers...)                        | tất cả `useRef` (`anchorRef`, `suppressSeekedEventRef`, `timerRef`, `isFollowingHostRef`) |
| `use-controls-visibility.ts` | `useCallback` (resetTimer, các handler)                                               | `timeoutRef`                                                                              |
| `use-room-channel.ts`        | `broadcastAnchor`, `broadcastDirty`, `refetchRoom` (refetchRoom bị xóa hẳn ở Phase D) | `channelRef`                                                                              |
| `watch-room.tsx`             | `refetchQueue`, `handleQueueMutated`, các `useCallback`                               | `playerRef`, `onAnchorRef`                                                                |
| `sync-player.tsx`            | `onProviderChange` `useCallback`; `source` `useMemo` (⚠️ xem dưới)                    | —                                                                                         |

**⚠️ B.special — `sync-player.tsx:43` `source` useMemo:** đây là memo phục vụ **tính đúng đắn** (giữ object identity để Vidstack không teardown provider). React Compiler _sẽ_ memo object literal theo `[sourceType, sourceRef]`, nên gỡ là an toàn về lý thuyết — nhưng **bắt buộc verify bằng E2E**: đổi nguồn + seek + presence-sync không làm provider reload giữa chừng. Nếu nghi ngờ, giữ lại `useMemo` này như ngoại lệ có comment.

> Cổng nghiệm thu Phase B: `bun run lint` (eslint react-hooks) xanh; smoke test thủ công player không reload khi re-render không liên quan.

---

### PHASE C — Query keys + hooks dữ liệu (TanStack Query)

**C1. `features/watch/query-keys.ts`**

```ts
export const watchKeys = {
  room: (roomId: string) => ['watch', 'room', roomId] as const,
  queue: (roomId: string) => ['watch', 'queue', roomId] as const,
};
```

**C2. `hooks/use-room-query.ts`** — room structural, seed bằng `initialData` từ server render (không refetch ngay nhờ `staleTime`).

```ts
export function useRoomQuery(roomId: string, initialData: Room) {
  return useQuery({
    queryKey: watchKeys.room(roomId),
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('watch_rooms')
        .select(
          'id, code, host_id, source_type, source_ref, is_playing, anchor_position, anchor_server_ts, playback_rate, created_at, updated_at, current_queue_item_id, last_active_at',
        )
        .eq('id', roomId)
        .single();
      if (error) throw error;
      return data as Room;
    },
    initialData,
    staleTime: 30_000,
  });
}
```

> **Lưu ý SELECT:** dùng đúng danh sách cột như `queries.ts:32` (hợp nhất, hết drift `select("*")`).

**C3. `hooks/use-room-queue.ts`** — queue query + mutations optimistic.

```ts
export function useQueueQuery(roomId: string, initialData: QueueItem[]) {
  return useQuery({
    queryKey: watchKeys.queue(roomId),
    queryFn: async () => {
      /* select queue cột tường minh, order position asc */
    },
    initialData,
    staleTime: 30_000,
  });
}
```

Mutations (mỗi cái wrap Server Action, optimistic theo precedent `profile-form`):

- `useAddQueueItem` — `onMutate`: chèn item tạm (id tạm) vào cache; `onError`: rollback; `onSettled`: `invalidateQueries(watchKeys.queue)`.
- `useRemoveQueueItem` — optimistic filter.
- `useReorderQueue` — optimistic reorder bằng `fractionalPosition` ngay trên cache (UX tức thời cho ▲/▼).
- `useAdvanceQueue`, `useTransferHost` — không optimistic phức tạp; `onSettled` invalidate room + queue.

> **Tại sao TanStack optimistic thay vì `useOptimistic`:** queue là _server-cached state_ nên TanStack `onMutate`/`setQueryData` là idiom đúng và đã có precedent trong repo. `useOptimistic` hợp cho form/`useActionState`, không dùng ở đây để tránh hai cơ chế optimistic chồng nhau.

> Cổng nghiệm thu Phase C: `bun run typecheck` xanh; hooks compile; chưa wire vào UI.

---

### PHASE D — Realtime: bỏ `watch_dirty`/refetch tay, dùng `postgres_changes` → invalidate

Viết lại `use-room-channel.ts`. Một channel `room:{roomId}` mang **3 cổng**:

1. **Broadcast `playback`** (anchor) → `onAnchor` (GIỮ NGUYÊN).
2. **Presence** → participants (GIỮ NGUYÊN).
3. **`postgres_changes`** (MỚI, thay `watch_dirty`):
   - `watch_rooms` (filter `id=eq.{roomId}`) → tính structural-signature (1.2); chỉ `queryClient.invalidateQueries(watchKeys.room(roomId))` khi signature đổi.
   - `watch_queue_items` (filter `room_id=eq.{roomId}`) → `invalidateQueries(watchKeys.queue(roomId))` (không guard).

**Xóa khỏi hook:** `currentRoom` state, `prevRoomId` set-during-render, `refetchRoom`, `broadcastDirty`, listener `watch_dirty`. Hook nhận `queryClient` (qua `useQueryClient`) và `roomId`.

**Giữ:** `broadcastAnchor`, presence sync, `channelRef`, vòng đời subscribe/unsubscribe.

> **Vì sao hết bug duplicate:** chỉ còn **một** cache (TanStack). `postgres_changes` chỉ phát tín hiệu `invalidate` → refetch chuẩn từ DB; không có đường thứ hai tự merge row.

> Cổng nghiệm thu Phase D: 2 trình duyệt — A thêm video, B thấy cập nhật không cần F5; A đổi nguồn, B đổi theo; host play/pause **không** gây B refetch room (kiểm tra Network/React Query Devtools — không có request room thừa).

---

### PHASE E — Lắp ráp UI & RSC purity

**E1. `page.tsx` — Promise.all + membership ra khỏi render.**

```ts
const user = await requireUser();
const { roomId } = await params;
const [room, initialQueueItems] = await Promise.all([getRoom(roomId), getQueue(roomId)]);
if (!room) notFound();
```

Membership: chuyển `ensureRoomMembership` khỏi thân render. Hai lựa chọn (chọn 1 khi thực thi):

- (a) **Route handler** `app/api/watch/[roomId]/join/route.ts` (POST) gọi từ client `WatchRoom` trong `useEffect` mount; hoặc
- (b) Gọi trong action `joinByCode` + giữ một fallback insert idempotent. Với mô hình link-share (vào thẳng URL), (a) đáng tin hơn.
  > Lý do: render RSC phải thuần; INSERT-lúc-render có thể chạy lại khi render bị replay.

**E2. `watch-room.tsx` — bỏ state thủ công.**

- Xóa `useState(initialQueueItems)` + khối set-during-render + `refetchQueue` + `handleQueueMutated`.
- Thay bằng: `const { data: room } = useRoomQuery(roomId, initialRoom)` và `const { data: queueItems } = useQueueQuery(roomId, initialQueueItems)`.
- `useRoomChannel(room, userId, isHost, onAnchor)` (đã bỏ onDirty).
- `useSyncController(playerRef, room, isHost, serverClock, broadcastAnchor)` — `room` giờ từ query.
- Mutations gọi hooks (Phase C). Bỏ `broadcastDirty`.

**E3. `playlist-panel.tsx` / `side-dock.tsx`** — thay lời gọi action trực tiếp + `onQueueMutated` bằng các mutation hook (optimistic). Bỏ prop `onQueueMutated`.

**E4. `actions.ts`** — gỡ `revalidatePath("/watch/${roomId}")` khỏi: `setRoomSource`, `addQueueItem`, `reorderQueue`, `removeQueueItem`, `advanceQueue`, `transferHost`. Giữ `revalidatePath("/watch")` cho `createRoom`/`deleteRoom`/`leaveRoom`.

**E5. `(watch)/layout.tsx`** — sửa `unstable_instant.samples` roomId từ UUID toàn `0` (gây notFound) sang một sample hợp lệ hoặc bỏ samples nếu không build-time prefetch được route động bảo vệ-auth.

> Cổng nghiệm thu Phase E: `bun run build` xanh; phòng load, đồng bộ, playlist, host advance, transfer host hoạt động đầy đủ; membership ghi đúng khi vào bằng link.

---

### PHASE F — Kiểm thử & dọn dẹp

**F1. Unit (`bun run test`):** giữ test `fractionalPosition`, `calculateExpectedPosition`; thêm test cho hàm `structuralSignature` (đổi anchor → signature không đổi; đổi source → đổi).

**F2. Smoke 2-trình-duyệt (A=host, B=follower):**

1. Tạo + join; cả hai thấy nhau (presence).
2. A play/pause/seek → B đồng bộ; **B không refetch room** (chỉ broadcast).
3. B tự seek → soft-lock banner; Resync → bắt kịp.
4. B thêm video → A thấy ngay (postgres_changes → invalidate); reorder ▲/▼ ở A cập nhật **tức thời** (optimistic) rồi hội tụ.
5. A đổi nguồn / advance → cả hai đổi video (signature đổi → invalidate).
6. Transfer host → quyền chuyển đúng.
7. Cả hai rời → delete-on-empty + cron reap.

**F3. Devtools:** mở React Query Devtools xác nhận không có vòng lặp invalidate; không refetch room trên mỗi host play/pause.

**F4. Cập nhật tài liệu:** đánh dấu `watch-together-phase2-upgrade.md` là superseded (thêm note đầu file trỏ tới Phase 3).

> Cổng nghiệm thu cuối: `bun run ai:check` + `bun run lint` + `bun run typecheck` + `bun run test` + `bun run build` đều xanh; E2E Playwright watch (nếu có) xanh.

---

## 4. Rủi ro & Khắc phục

| Rủi ro                                                                 | Khắc phục                                                                |
| :--------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| Gỡ `source` useMemo làm Vidstack reload provider                       | Verify E2E (B.special); giữ memo như ngoại lệ-có-comment nếu cần         |
| `postgres_changes` cần RLS-for-replication / publication chưa bật đúng | Đã xác minh tables ở trong publication; test trên môi trường local trước |
| Invalidate storm từ host play/pause                                    | structural-signature guard (1.2) — test F3 bắt buộc                      |
| Membership move sang route handler gây thêm round-trip lúc mount       | Idempotent insert (`23505` = success); chạy non-blocking, UI không chờ   |
| Optimistic reorder lệch với server (fractional)                        | `onSettled` invalidate hội tụ về server-truth                            |
| Mất broadcast khi follower join trễ (anchor)                           | Seed anchor từ `roomQuery.initialData` lúc mount (đã có)                 |

## 5. Bất biến tuyệt đối (không được phá khi refactor)

- Anchor write chỉ host, qua RLS `watch_rooms_update_host` — **không** chuyển sang service-role, **không** nới RLS.
- `"server-only"` trên `queries.ts`; không import server/secret vào client.
- Một channel duy nhất `room:{roomId}` cho cả Broadcast + Presence + postgres_changes.
- `leaveRoom` chỉ chạy trên hành động chủ ý (không unmount/`beforeunload`).
- Refs cho dữ liệu tần suất cao (anchor/currentTime) — không đẩy vào React state.

```

```
