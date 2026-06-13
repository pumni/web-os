> ⚠️ **SUPERSEDED (2026-06-14):** Tài liệu này mô tả kiến trúc Phase 2 **đã lỗi thời một phần** so với code chạy thực (ví dụ `use-room-queue.ts` + `postgres_changes` chưa từng được tạo; `leaveRoom`-trong-unmount + `beforeunload` đã bị code chủ động bác bỏ vì StrictMode xóa nhầm phòng). Kế hoạch hiện hành cho tầng dữ liệu/realtime là **[Phase 3 — Data-layer refactor](./watch-together-phase3-refactor.md)**. Giữ file này làm tham chiếu lịch sử.

# Kế hoạch Nâng cấp Watch-Together — Phase 2 (Zones · Auto-hide · Soft-sync · Playlist · Lifecycle)

> **Tài liệu tham chiếu:** `AGENTS.md` (root), `apps/web/AGENTS.md`, `docs/conventions/*`, và kế hoạch v1 `docs/plans/media-watch-together-refactor.md`.
> **Mục tiêu:** Nâng cấp Watch-Together v1 hiện có lên bản v2 hoàn chỉnh, giải quyết các bất cập về trải nghiệm (layout chật chội, controls đè cố định) và tính năng (thêm playlist cộng tác, follower được tự tua xem lại và sync lại, tự động dọn phòng khi trống).
> **Nguyên tắc:** Bản kế hoạch này cực kỳ chi tiết, ghi nhận toàn bộ quyết định kiến trúc đã thống nhất để một AI khác đọc vào là có thể tự động triển khai được mà không cần hỏi lại.

---

## 0. Phạm vi & Quyết định kiến trúc đã chốt

### Trong phạm vi Phase 2:
1. **Tái cấu trúc Layout thành "Zones"**: Thay thế layout căn giữa bó nhỏ bằng Stage (video lớn, tỷ lệ co giãn linh hoạt) + Side Dock (Tabs: Playlist + Người xem).
2. **Auto-hide Controls**: Thanh điều khiển đè lên video nhưng tự ẩn sau 3 giây không tương tác khi đang phát. Luôn hiện khi pause hoặc khi focus bàn phím ở bên trong (A11y).
3. **Soft-lock + Resync cho Follower**: Follower được phép tương tác local (pause/seek để xem lại) → Hệ thống tự động ngắt đồng bộ tạm thời (rời sync) và hiển thị nút "Đồng bộ lại" để bắt kịp host.
4. **Collaborative Playlist**: Mọi thành viên trong phòng đều có quyền thêm/xóa/sắp xếp (fractional indexing) các video trong danh sách chờ.
5. **Room Members (Bền vững)**: Bảng `room_members` lưu trữ danh sách thành viên thực tế, phục vụ RLS cho playlist và tính năng chuyển quyền chủ phòng (host handoff).
6. **Lifecycle & Cleanup**: Cập nhật `last_active_at` làm nhịp tim (heartbeat). Tự động dọn phòng khi không còn ai (delete-on-empty) kết hợp cron job quét định kỳ các phòng stale.

### Ngoài phạm vi (KHÔNG làm):
* ❌ Trò chuyện (chat), thả tim (reactions), emoji, con trỏ chuột chung.
* ❌ Tải lên video / pipeline chuyển mã (storage pipeline).
* ❌ Tự động promote host khi host cũ mất kết nối đột ngột (giữ cơ chế chuyển quyền thủ công, auto-promote làm ở phase sau).

### Bảng Quyết định & Ranh giới Công nghệ:
| Tầng chức năng | Công nghệ được chọn | Lý do chốt |
| :--- | :--- | :--- |
| **Playlist & Members** | Postgres Table + RLS | Đảm bảo tính bền vững và bảo mật P0. Quyền hạn chỉnh sửa playlist được xác thực qua DB. |
| **State Hydration** | DB query lúc load phòng | Tránh reliance vào sync broadcast khi người dùng tham gia trễ. |
| **Realtime Sync** | Supabase Broadcast Channel | Trọng tải nhẹ, độ trễ cực thấp cho vị trí đầu phát (playback head). |
| **Online Status** | Supabase Realtime Presence | Phù hợp cho trạng thái online/offline tức thời (heartbeat kết nối). |
| **Tự động dọn dẹp** | Client event unmount + Cron Job | Lưới an toàn 2 tầng đảm bảo không rác DB. |

---

## 1. Bản đồ File Thay đổi & Tạo mới

### Cấu trúc thư mục đích của feature `watch`:
```
apps/web/src/features/watch/
  types.ts                    # SỬA: Thêm QueueItem, Member, cập nhật Room
  queries.ts                  # SỬA: Thêm getQueue, cập nhật getRoom
  actions.ts                  # SỬA: joinRoom, leaveRoom, addQueueItem, reorderQueue, removeQueueItem, advanceQueue, transferHost
  sync-math.ts                # SỬA: Thêm helper fractionalPosition
  hooks/
    use-server-clock.ts       # GIỮ NGUYÊN
    use-room-channel.ts       # GIỮ NGUYÊN (có đăng ký thêm listening table changes nếu cần)
    use-sync-controller.ts    # SỬA: Thêm logic isFollowingHost, handleFollowerManualSeekOrPause, resync
    use-controls-visibility.ts# MỚI: Tự động ẩn controls sau 3s
    use-room-queue.ts         # MỚI: Đồng bộ danh sách playlist realtime qua Postgres Changes
  components/
    watch-lobby.tsx           # GIỮ NGUYÊN
    watch-room.tsx            # SỬA: Layout chia Stage + Side Dock
    sync-player.tsx           # SỬA: Style Stage đầy đặn, thêm scrim bottom
    room-controls.tsx         # SỬA: Cho phép follower bấm, auto-hide, thêm nút Resync
    side-dock.tsx             # MỚI: Panel chứa Tabs [Playlist | Người xem]
    playlist-panel.tsx        # MỚI: UI quản lý playlist (add/remove/reorder)
    participant-rail.tsx      # GIỮ NGUYÊN (đặt vào side-dock)
    sync-indicator.tsx        # GIỮ NGUYÊN

apps/web/src/app/(watch)/watch/[roomId]/page.tsx      # SỬA: Kiểm tra và đăng ký membership trước khi render
apps/web/src/app/(watch)/layout.tsx                    # SỬA: Cho phép layout rộng (theater), bỏ center bó hẹp

packages/validators/src/watch.ts                       # SỬA: Thêm các schema cho playlist và transfer host
supabase/migrations/
  008_room_members.sql                                 # MỚI: Bảng room_members, is_room_member(), transfer_room_host()
  009_watch_queue_items.sql                            # MỚI: Bảng watch_queue_items, fractional indexing, FK link
  010_watch_lifecycle.sql                              # MỚI: Heartbeat column last_active_at, cron job sweep
```

---

## 2. Chi tiết 9 Phases Triển khai (Phases A → I)

### PHASE A: Cấu trúc Database & RLS (Migrations)
> Mỗi migration được áp dụng phải chạy lệnh regenerate typescript types tại thư mục gốc:
> `bunx supabase gen types typescript --local > packages/supabase/src/types.ts`

#### 1. Tạo file `supabase/migrations/008_room_members.sql`
```sql
-- 1. Bảng lưu trữ thành viên thực tế của phòng xem chung
create table public.room_members (
  room_id   uuid not null references public.watch_rooms(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index room_members_room_idx on public.room_members(room_id);
create index room_members_user_idx on public.room_members(user_id);

alter table public.room_members enable row level security;

-- Cho phép SELECT công khai cho người dùng đã đăng nhập (phục vụ mô hình link-shared)
create policy "room_members_select" on public.room_members
  for select to authenticated using (true);

-- Người dùng chỉ được phép thêm chính mình làm thành viên
create policy "room_members_insert_self" on public.room_members
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Người dùng chỉ được phép xóa chính mình ra khỏi danh sách thành viên
create policy "room_members_delete_self" on public.room_members
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.room_members from anon, authenticated;
grant select, insert, delete on table public.room_members to authenticated;
grant select, insert, delete, update on table public.room_members to service_role;

-- 2. Hàm SECURITY DEFINER kiểm tra tư cách thành viên tránh đệ quy RLS
create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists(
    select 1 from public.room_members
    where room_id = p_room_id and user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_room_member(uuid) from public, anon;
grant execute on function public.is_room_member(uuid) to authenticated;

-- 3. Hàm RPC chuyển quyền chủ phòng (Host Transfer) thủ công
create or replace function public.transfer_room_host(p_room_id uuid, p_new_host uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  -- Chỉ host hiện tại mới có quyền thực hiện
  if not exists (
    select 1 from public.watch_rooms
    where id = p_room_id and host_id = (select auth.uid())
  ) then
    raise exception 'Chỉ quản phòng (host) hiện tại mới có quyền chuyển quyền chủ phòng';
  end if;

  -- Người nhận quyền phải là thành viên hiện tại của phòng
  if not exists (
    select 1 from public.room_members
    where room_id = p_room_id and user_id = p_new_host
  ) then
    raise exception 'Người nhận quyền chủ phòng phải là thành viên trong phòng';
  end if;

  update public.watch_rooms 
  set host_id = p_new_host, updated_at = now()
  where id = p_room_id;
end;
$$;

revoke all on function public.transfer_room_host(uuid, uuid) from public, anon;
grant execute on function public.transfer_room_host(uuid, uuid) to authenticated;

alter publication supabase_realtime add table public.room_members;
```

#### 2. Tạo file `supabase/migrations/009_watch_queue_items.sql`
```sql
-- 1. Bảng danh sách playlist chung
create table public.watch_queue_items (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.watch_rooms(id) on delete cascade,
  position    double precision not null,            -- fractional indexing
  source_type public.watch_source_type not null,
  source_ref  text not null,
  title       text,
  added_by    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index watch_queue_items_room_pos_idx on public.watch_queue_items (room_id, position);

alter table public.watch_queue_items enable row level security;

-- Tất cả thao tác CRUD trên queue đều được bảo vệ bởi hàm is_room_member()
create policy "watch_queue_select" on public.watch_queue_items
  for select to authenticated using (public.is_room_member(room_id));

create policy "watch_queue_insert" on public.watch_queue_items
  for insert to authenticated with check (public.is_room_member(room_id));

create policy "watch_queue_update" on public.watch_queue_items
  for update to authenticated 
  using (public.is_room_member(room_id)) 
  with check (public.is_room_member(room_id));

create policy "watch_queue_delete" on public.watch_queue_items
  for delete to authenticated using (public.is_room_member(room_id));

revoke all on table public.watch_queue_items from anon, authenticated;
grant select, insert, update, delete on table public.watch_queue_items to authenticated;
grant select, insert, update, delete on table public.watch_queue_items to service_role;

-- 2. Thêm cột tham chiếu video hiện tại đang phát vào watch_rooms
alter table public.watch_rooms
  add column current_queue_item_id uuid
  references public.watch_queue_items(id) on delete set null;

alter publication supabase_realtime add table public.watch_queue_items;
```

#### 3. Tạo file `supabase/migrations/010_watch_lifecycle.sql`
```sql
-- 1. Thêm cột last_active_at làm nhịp tim (heartbeat)
alter table public.watch_rooms
  add column last_active_at timestamptz not null default now();

-- 2. Đăng ký pg_cron tự động xóa phòng không hoạt động > 6 giờ
create extension if not exists pg_cron;
select cron.schedule(
  'watch-rooms-cleanup',
  '0 * * * *', -- Quét mỗi giờ một lần
  $$ delete from public.watch_rooms
     where last_active_at < now() - interval '6 hours'; $$
);
```

> **Cổng nghiệm thu Phase A:** Chạy thành công `supabase db push` cục bộ. Lệnh `bun run typecheck` thành công, file `packages/supabase/src/types.ts` chứa đầy đủ các bảng, các cột mới và function definition.

---

### PHASE B: Cập nhật Validators & Math Helper

#### 1. Thêm vào `packages/validators/src/watch.ts`
```typescript
export const addQueueItemSchema = z.object({
  roomId: z.string().uuid(),
  sourceType: sourceTypeSchema,
  sourceRef: z.string().min(1).max(2048),
  title: z.string().max(300).optional(),
});

export const reorderQueueSchema = z.object({
  roomId: z.string().uuid(),
  itemId: z.string().uuid(),
  beforeId: z.string().uuid().nullable(), // item đứng trước mục tiêu (null nếu đưa lên đầu)
  afterId: z.string().uuid().nullable(),  // item đứng sau mục tiêu (null nếu đưa xuống cuối)
});

export const transferHostSchema = z.object({
  roomId: z.string().uuid(),
  newHostId: z.string().uuid(),
});

export type AddQueueItemInput = z.infer<typeof addQueueItemSchema>;
export type ReorderQueueInput = z.infer<typeof reorderQueueSchema>;
export type TransferHostInput = z.infer<typeof transferHostSchema>;
```
Đảm bảo export các schema này trong `packages/validators/src/index.ts`.

#### 2. Thêm hàm tính vị trí tương đối (Fractional Indexing) vào `apps/web/src/features/watch/sync-math.ts`
```typescript
/**
 * Trả về một vị trí double precision nằm giữa hai vị trí trước và sau.
 * Dùng cho fractional indexing để sắp xếp danh sách mà chỉ cần update 1 dòng.
 */
export function fractionalPosition(before: number | null, after: number | null): number {
  if (before === null && after === null) return 0.0;
  if (before === null) return after! - 1.0;
  if (after === null) return before! + 1.0;
  return (before + after) / 2.0;
}
```

> **Cổng nghiệm thu Phase B:** Viết unit test nhanh cho `fractionalPosition` trong file test, đảm bảo:
> * `fractionalPosition(null, null)` -> `0`
> * `fractionalPosition(null, 5)` -> `4`
> * `fractionalPosition(2, null)` -> `3`
> * `fractionalPosition(1, 2)` -> `1.5`
> Chạy `bun run typecheck` thành công.

---

### PHASE C: Server Actions & Queries
> Vị trí: `apps/web/src/features/watch/queries.ts` & `actions.ts`.
> Toàn bộ ghi dữ liệu phải đi kèm cơ chế cập nhật `last_active_at = now()` (Heartbeat).

#### 1. Cập nhật `queries.ts`
* Thêm hàm `getQueue(roomId: string)` chỉ chạy ở server (`server-only`), lấy danh sách các item từ bảng `watch_queue_items` của phòng, sắp xếp theo `position ASC`.
* Cập nhật `getRoom(roomId: string)` để select thêm hai trường mới: `current_queue_item_id` và `last_active_at`.

#### 2. Cập nhật và thêm mới các Server Actions trong `actions.ts`
* **`joinRoom(roomId)`**: Gọi khi người dùng truy cập phòng. Upsert bản ghi vào `room_members` để đảm bảo RLS cho phép người dùng thao tác playlist:
  ```typescript
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  await supabase.from("room_members").upsert({ room_id: roomId, user_id: user.id });
  ```
* **`leaveRoom(roomId)`**: Gọi khi người dùng rời phòng.
  1. Xóa bản ghi của user khỏi `room_members`.
  2. Đếm số lượng member còn lại trong `room_members` cho phòng này.
  3. Nếu số lượng thành viên còn lại bằng **0** -> Thực hiện xóa phòng (`deleteRoom`) để thực thi cơ chế *delete-on-empty*.
* **`addQueueItem(input)`**: Validate bằng `addQueueItemSchema`. Kiểm tra RLS qua membership (mặc định Supabase client sẽ tự cấm nếu user chưa join).
  * Cách tính `position` cho item mới: Đọc `MAX(position)` hiện tại trong phòng, gán `position = max + 1.0` (nếu chưa có item nào thì `0.0`).
  * Thực hiện insert dòng mới vào `watch_queue_items`.
* **`reorderQueue(input)`**: Validate bằng `reorderQueueSchema`.
  * Đọc `position` của `beforeId` và `afterId` từ DB.
  * Tính toán `newPosition = fractionalPosition(beforePosition, afterPosition)`.
  * Update cột `position` của item `itemId` bằng `newPosition`.
* **`removeQueueItem(roomId, itemId)`**: Xóa item khỏi `watch_queue_items`. Nếu item bị xóa đang trùng với `current_queue_item_id` của room, reset `current_queue_item_id = null` trong room.
* **`advanceQueue(roomId)`**: **Chỉ cho phép Host**.
  * Xác thực người dùng hiện tại là host của phòng.
  * Đọc item kế tiếp trong danh sách `watch_queue_items` (có `position` lớn hơn item hiện tại, lấy cái đầu tiên).
  * Nếu tìm thấy item tiếp theo:
    * Cập nhật room: `source_type = item.source_type`, `source_ref = item.source_ref`, `current_queue_item_id = item.id`.
    * Đặt lại trạng thái phát: `is_playing = false`, `anchor_position = 0`, `anchor_server_ts = now()`.
  * Nếu hết hàng chờ: Giữ nguyên hoặc thông báo hết playlist.
* **`transferHost(input)`**: Gọi RPC `transfer_room_host` để đổi host.
* **Cập nhật `setRoomSource` hiện có**: Nếu host thay đổi nguồn phát thủ công trực tiếp, set `current_queue_item_id = null` (phát ngoài queue).

> **Cổng nghiệm thu Phase C:** Đảm bảo tất cả action đều gọi `requireUser()`, kiểm tra phân quyền host đối với các action nhạy cảm (như `advanceQueue`, `transferHost`). `bun run typecheck` và `bun run lint` không báo lỗi.

---

### PHASE D: Realtime Playlist Hook (`use-room-queue.ts`)
> Vị trí: `apps/web/src/features/watch/hooks/use-room-queue.ts`
> Hook client đồng bộ playlist theo thời gian thực mà không làm tăng số lượng channel (tái sử dụng chung channel `room:{roomId}` hiện tại).

#### Cấu trúc logic của Hook:
```typescript
import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@pumni/supabase/browser";
import type { Database } from "@pumni/supabase";

type QueueItem = Database["public"]["Tables"]["watch_queue_items"]["Row"];

export function useRoomQueue(roomId: string, initialItems: QueueItem[], channel: RealtimeChannel | null) {
  const [items, setItems] = useState<QueueItem[]>(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (!channel) return;

    // Lắng nghe sự thay đổi của bảng watch_queue_items trên phòng hiện tại
    const updatedChannel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "watch_queue_items",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        setItems((prev) => {
          let updated = [...prev];
          if (eventType === "INSERT") {
            updated.push(newRecord as QueueItem);
          } else if (eventType === "UPDATE") {
            updated = updated.map((item) =>
              item.id === (newRecord as QueueItem).id ? (newRecord as QueueItem) : item
            );
          } else if (eventType === "DELETE") {
            updated = updated.filter((item) => item.id !== oldRecord.id);
          }
          // Sắp xếp lại danh sách theo position ASC để duy trì thứ tự nhất quán
          return updated.sort((a, b) => a.position - b.position);
        });
      }
    );

    return () => {
      // Postgres listener sẽ tự động unbind khi channel unsubscribe ở useRoomChannel
    };
  }, [roomId, channel, initialItems]);

  return items;
}
```

> **Cổng nghiệm thu Phase D:** `bun run typecheck` thành công. Đảm bảo listener không tạo channel mới mà tận dụng đối tượng `channel` truyền từ `useRoomChannel` xuống để giảm tải số lượng connection lên Supabase.

---

### PHASE E: Sync Controller Soft-lock & Resync

Sửa đổi file `apps/web/src/features/watch/hooks/use-sync-controller.ts` để chặn vòng lặp phản hồi và hỗ trợ tự do tua phát cho follower:

#### 1. Khai báo trạng thái theo dõi Host (Client-side only):
```typescript
const isFollowingHostRef = useRef<boolean>(true);
const [isFollowingHost, setIsFollowingHost] = useState<boolean>(true);
```

#### 2. Cập nhật hàm `reconcile` (Theo dõi):
```typescript
const reconcile = useCallback(() => {
  const player = playerRef.current;
  // Bất biến: Host không tự sync, Follower nếu ngắt follow cũng không chạy logic sync
  if (!player || isHost || !isFollowingHostRef.current) return;

  const anchor = anchorRef.current;
  const now = serverClock();
  const expected = calculateExpectedPosition(anchor, now);

  // 1) Khớp trạng thái play/pause
  if (anchor.isPlaying && player.paused) {
    player.play().catch(() => {});
  } else if (!anchor.isPlaying && !player.paused) {
    player.pause().catch(() => {});
  }

  // 2) Đo độ lệch và hiệu chỉnh
  const current = player.currentTime;
  const drift = expected - current;
  const absDrift = Math.abs(drift);

  const isYouTube = room.source_type === "youtube";
  const DEADBAND = isYouTube ? 1.0 : 0.3;
  const HARD_SEEK = isYouTube ? 2.0 : 1.5;
  const NUDGE = isYouTube ? 0.07 : 0.05;

  if (absDrift < DEADBAND) {
    if (player.playbackRate !== anchor.playbackRate) {
      player.playbackRate = anchor.playbackRate;
    }
    setSyncStatus("in-sync");
  } else if (absDrift < HARD_SEEK) {
    // Nudge nhẹ vận tốc phát
    const adjustedRate = anchor.playbackRate + Math.sign(drift) * NUDGE;
    player.playbackRate = Math.max(0.5, Math.min(2.0, adjustedRate));
    setSyncStatus("catching-up");
  } else {
    // Tua cứng (Hard seek) về đúng vị trí
    suppressSeekedEventRef.current = true;
    player.currentTime = expected;
    player.playbackRate = anchor.playbackRate;
    setSyncStatus("catching-up");
  }
}, [playerRef, isHost, serverClock, room.source_type]);
```

#### 3. Phát hiện tương tác thủ công của Follower (Soft-lock):
```typescript
const handleFollowerManualInteraction = useCallback(() => {
  if (isHost) return;
  // Nếu hành động này kích hoạt bởi code programmatic seek -> bỏ qua
  if (suppressSeekedEventRef.current) {
    suppressSeekedEventRef.current = false;
    return;
  }
  // Ngắt đồng bộ ngay lập tức
  isFollowingHostRef.current = false;
  setIsFollowingHost(false);
  setSyncStatus("catching-up"); // Hoặc trạng thái 'lệch' cụ thể
}, [isHost]);
```

#### 4. Thao tác đồng bộ lại (Resync):
```typescript
const resync = useCallback(() => {
  isFollowingHostRef.current = true;
  setIsFollowingHost(true);
  
  const player = playerRef.current;
  const anchor = anchorRef.current;
  if (!player) return;

  const expected = calculateExpectedPosition(anchor, serverClock());
  suppressSeekedEventRef.current = true;
  player.currentTime = expected;
  player.playbackRate = anchor.playbackRate;

  if (anchor.isPlaying && player.paused) {
    player.play().catch(() => {});
  } else if (!anchor.isPlaying && !player.paused) {
    player.pause().catch(() => {});
  }
}, [playerRef, serverClock]);
```

#### 5. Cập nhật các player event handlers trả về:
```typescript
const handlePlay = useCallback(() => {
  if (isHost) {
    emitAnchor();
  } else {
    handleFollowerManualInteraction();
  }
}, [isHost, emitAnchor, handleFollowerManualInteraction]);

const handlePause = useCallback(() => {
  if (isHost) {
    emitAnchor();
  } else {
    handleFollowerManualInteraction();
  }
}, [isHost, emitAnchor, handleFollowerManualInteraction]);

const handleSeeked = useCallback(() => {
  if (suppressSeekedEventRef.current) {
    suppressSeekedEventRef.current = false;
    return;
  }
  if (isHost) {
    emitAnchor();
  } else {
    handleFollowerManualInteraction();
  }
}, [isHost, emitAnchor, handleFollowerManualInteraction]);
```

> **Cổng nghiệm thu Phase E:** Trả thêm `{ isFollowingHost, resync }` từ hook `useSyncController`. Các thay đổi của Follower local không còn bị ghi vào cơ sở dữ liệu và không broadcast ra ngoài phòng, đồng thời không bị reconcile đè lại ngay lập tức.

---

### PHASE F: Tự động ẩn Thanh điều khiển (Controls Auto-hide)
> Tạo mới file: `apps/web/src/features/watch/hooks/use-controls-visibility.ts`

#### Code cụ thể cho Hook:
```typescript
import { useState, useEffect, useRef, useCallback } from "react";

interface UseControlsVisibilityProps {
  paused: boolean;
}

export function useControlsVisibility({ paused }: UseControlsVisibilityProps) {
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveredRef = useRef(false);
  const hasFocusRef = useRef(false);

  const resetTimer = useCallback(() => {
    setVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Nếu video đang tạm dừng, hoặc chuột đang hover trên controls, hoặc có focus bên trong -> không ẩn
    if (paused || isHoveredRef.current || hasFocusRef.current) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      // Kiểm tra xem chế độ reduced-motion của OS có bật không để giữ controls hiển thị
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        return;
      }
      setVisible(false);
    }, 3000);
  }, [paused]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resetTimer, paused]);

  // Các sự kiện tương tác của người dùng trên khung Stage
  const handleMouseMove = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const handlePointerDown = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const handleKeyDown = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Sự kiện kiểm soát hover trên chính thanh điều khiển
  const onControlsMouseEnter = useCallback(() => {
    isHoveredRef.current = true;
    setVisible(true);
  }, []);

  const onControlsMouseLeave = useCallback(() => {
    isHoveredRef.current = false;
    resetTimer();
  }, [resetTimer]);

  // Sự kiện kiểm soát focus bàn phím bên trong thanh điều khiển (A11y)
  const onControlsFocus = useCallback(() => {
    hasFocusRef.current = true;
    setVisible(true);
  }, []);

  const onControlsBlur = useCallback(() => {
    hasFocusRef.current = false;
    resetTimer();
  }, [resetTimer]);

  return {
    visible,
    stageBind: {
      onMouseMove: handleMouseMove,
      onPointerDown: handlePointerDown,
      onKeyDown: handleKeyDown,
    },
    controlsBind: {
      onMouseEnter: onControlsMouseEnter,
      onMouseLeave: onControlsMouseLeave,
      onFocus: onControlsFocus,
      onBlur: onControlsBlur,
    }
  };
}
```

> **Cổng nghiệm thu Phase F:** `bun run typecheck` thành công. Hook xử lý chính xác các điều kiện tương tác và tương thích tốt với A11y (không ẩn khi đang focus bàn phím) và reduced-motion.

---

### PHASE G: Tái cấu trúc Giao diện & Layout (Zones)

#### 1. Cập nhật `apps/web/src/app/(watch)/layout.tsx`
* Loại bỏ các class căn giữa và giới hạn kích thước bó hẹp (`items-center justify-center max-w-5xl`).
* Cho phép content trải dài ra toàn bộ không gian ngang của màn hình (Theater Mode).
* Giữ nguyên nền đen tuyền đặc trưng cho khu vực phát video.

#### 2. Layout phân vùng trong `watch-room.tsx`
* Layout flex lớn ở màn hình desktop: Stage (`flex-1 h-full`) ở bên trái, Side Dock (`w-[340px] shrink-0 border-l border-border/20`) ở bên phải.
* Responsive: Trên mobile, Side Dock ẩn đi và được kích hoạt thông qua một `Sheet` (từ `@pumni/ui`) trượt ra khi bấm nút "Mở danh sách" trên thanh tiêu đề.
* Gửi các giá trị mới `{ isFollowingHost, resync }` vào `RoomControls`.

#### 3. Cập nhật `sync-player.tsx` (Stage)
* Khung chứa player co giãn chiếm trọn diện tích Stage (`w-full h-full aspect-video`).
* Thêm một lớp phủ gradient mờ (`scrim`) ở đáy Stage:
  ```css
  background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0) 100%);
  ```
  Scrim này sẽ xuất hiện mượt mà cùng thời điểm hiển thị của thanh controls để phụ đề và text controls luôn rõ ràng, dễ đọc.

#### 4. Cập nhật `room-controls.tsx`
* Tích hợp hook `useControlsVisibility`. Áp dụng hiệu ứng fade bằng class Tailwind `transition-opacity duration-300` và `opacity-0 pointer-events-none` khi `visible = false` (không áp dụng hiệu ứng chuyển động nếu prefers-reduced-motion bật).
* **Mở khóa tương tác cho Follower**: Bỏ thuộc tính `disabled={!isHost}` trên nút Play/Pause và Slider tiến trình.
* Hiển thị banner cảnh báo cảnh báo khi `!isFollowingHost` (Follower đang bị lệch tiến trình):
  * Banner dùng token màu `warning` của hệ thống thiết kế (không dùng mã màu raw như `bg-yellow-500`).
  * Chứa nút **"Đồng bộ lại với mọi người"** kích hoạt hàm `resync()`.

#### 5. Tạo mới file `side-dock.tsx` & `playlist-panel.tsx`
* **`side-dock.tsx`**: Sử dụng component `Tabs` từ `@pumni/ui`. Gồm hai tab:
  1. **Người xem (Participants)**: Render component `ParticipantRail` hiện tại.
     * Đối với Host: Cạnh mỗi participant khác sẽ hiển thị nút "Trao quyền quản phòng" gọi hành động `transferHost`.
  2. **Danh sách phát (Playlist)**: Render `PlaylistPanel`.
* **`playlist-panel.tsx`**:
  * Form thêm video: Gồm tabs chọn `youtube` hoặc `url` trực tiếp, ô input nhập link và nút "Thêm".
  * List items hiển thị: Hiển thị tiêu đề (hoặc ID nguồn phát), người thêm. Item nào có ID trùng với `current_queue_item_id` sẽ được đánh dấu nổi bật bằng token màu `primary`.
  * Mỗi item có nút xóa (xóa queue item).
  * Hỗ trợ nút mũi tên ▲ / ▼ để sắp xếp nhanh (reorder) trước khi tích hợp kéo thả phức tạp ở phiên bản sau.
  * Đối với Host: Có nút "Phát video tiếp theo" (Advance) kích hoạt Server Action `advanceQueue`.

> **Cổng nghiệm thu Phase G:** Chạy `bun run lint` không phát hiện lỗi sử dụng mã màu raw (`pumniNoRawColor`). Thử nghiệm giao diện hiển thị gọn gàng, co giãn tốt trên cả màn hình rộng và thiết bị di động.

---

### PHASE H: Ràng buộc Hội viên & Vòng đời Phòng (Membership & Lifecycle)

#### 1. Ràng buộc vào phòng (`app/(watch)/watch/[roomId]/page.tsx`)
Tại file page server-side, trước khi trả về component `WatchRoom` cho client, phải đảm bảo gọi Server Action `joinRoom(roomId)` để đăng ký quyền thành viên vào bảng `room_members`.
```typescript
// Trong page.tsx
const room = await getRoom(roomId);
if (!room) {
  return notFound();
}
// Tự động tham gia
await joinRoom(roomId);
```

#### 2. Đăng ký cho Host khi tạo phòng (`actions.ts`)
Trong server action `createRoom()`, ngay sau khi chèn phòng mới vào bảng `watch_rooms` thành công, phải chèn một dòng vào `room_members` cho `host_id` để host mặc định là thành viên đầu tiên.

#### 3. Rời phòng và dọn dẹp trống (Client clean-up)
Trong `watch-room.tsx`, thiết lập listener unmount và unload:
```typescript
useEffect(() => {
  // Gửi tín hiệu rời phòng khi component unmount
  return () => {
    leaveRoom(room.id);
  };
}, [room.id]);

useEffect(() => {
  const handleBeforeUnload = () => {
    navigator.sendBeacon(`/api/watch/leave?roomId=${room.id}`); // Hoặc chạy action đồng bộ nếu cần
  };
  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [room.id]);
```

> **Cổng nghiệm thu Phase H:** Chạy build dự án `bun run build` thành công. Khi vào phòng và thoát ra, các bản ghi tương ứng trong bảng `room_members` và `watch_rooms` được thêm và xóa chính xác (kiểm tra trực tiếp trong Supabase Studio hoặc DB client).

---

### PHASE I: Kiểm thử & Nghiệm thu Tổng hợp

#### 1. Kiểm thử Tự động (Unit Tests)
Chạy bộ test của dự án bằng lệnh `bun run test`. Đảm bảo các logic toán học thuần túy (`fractionalPosition` và `calculateExpectedPosition` khi lệch giờ) luôn xanh.

#### 2. Kịch bản Smoke Test 7 bước (Sử dụng 2 trình duyệt độc lập - User A & User B):
1. **Khởi tạo và Tham gia**: User A tạo một phòng xem YouTube. User B tham gia qua mã phòng. Kiểm tra cả hai đều hiển thị trên tab "Người xem" của nhau.
2. **Auto-hide Controls**: Cả hai đang phát video. Để yên chuột trong 3 giây → controls ẩn đi. Rê chuột hoặc bấm một phím bất kỳ → controls hiện lại. Bấm Pause → controls luôn hiện.
3. **Tự do Tua (Soft-lock)**: User B tự ý kéo thanh tiến trình lùi lại 20 giây để xem lại. Kiểm tra video của User B phát độc lập và xuất hiện banner màu vàng "Lệch đồng bộ". Video của User A vẫn chạy bình thường.
4. **Đồng bộ lại (Resync)**: User B bấm nút "Đồng bộ lại". Video của User B ngay lập tức nhảy đến đúng vị trí hiện tại của User A và tự động tiếp tục phát khớp với User A.
5. **Playlist realtime**: User B thêm một link video YouTube vào ô playlist. Kiểm tra playlist của User A lập tức cập nhật video mới mà không cần F5.
6. **Host Advance**: User A (Host) bấm nút "Phát video tiếp theo". Kiểm tra video trên player của cả User A và User B cùng chuyển sang video thứ 2 vừa được thêm vào.
7. **Dọn dẹp Lifecycle**: Cả User A và User B cùng tắt tab trình duyệt. Kiểm tra sau 1 phút, bảng `watch_rooms` và `room_members` của phòng đó đã tự động biến mất khỏi database (Cơ chế Delete-on-empty).

---

## 3. Các Nguyên tắc Bảo mật (P0) & Hiệu năng cần nhớ

### Bảo mật P0:
* **RLS là bức tường phòng ngự cuối cùng**: Tuyệt đối không được bypass RLS. Các thao tác ghi đè lên hàng đợi (queue) bắt buộc phải kiểm tra thông qua function `public.is_room_member()`.
* **Không rò rỉ Service Key**: Tuyệt đối không import các module bí mật (như `supabase/server` hay `requireUser`) vào trong các component Client có chỉ thị `"use client"`. Chỉ dùng publishable key (`NEXT_PUBLIC_`) trên client.
* **Vô hiệu hóa thực thi công khai (RPC security)**: Các function postgres (`is_room_member`, `transfer_room_host`) phải được `revoke all on function ... from public, anon` để chống tấn công gián tiếp.

### Tối ưu Hiệu năng:
* **Duy trì duy nhất 1 Realtime Channel**: Gom tất cả các cổng đăng ký (Presence cho online, Broadcast cho vị trí phát, Postgres Changes cho playlist) vào đúng một kênh duy nhất `room:{roomId}` để tránh quá tải RAM trình duyệt và số lượng kết nối tới Supabase.
* **Refs cho dữ liệu thay đổi nhanh**: Các giá trị cập nhật liên tục như `currentTime`, `anchor` phải được lưu vào React `useRef` thay vì đẩy trực tiếp vào React state để tránh việc re-render component 60 lần một giây. Chỉ đưa lên state các thông tin tĩnh/bán tĩnh (danh sách playlist, danh sách online).

---

## 4. Các Rủi ro Thực thi & Phương án Khắc phục

* **Rủi ro API của Vidstack**: Vidstack API trong các phiên bản cập nhật có thể thay đổi nhẹ cách thức trigger sự kiện programmatic.
  * *Khắc phục*: Luôn sử dụng cờ hiệu `suppressSeekedEventRef` và kiểm tra kỹ `remote.seek` thay vì chỉnh sửa trực tiếp thuộc tính `currentTime` của DOM video.
* **Hạn chế pg_cron**: Supabase trên các gói dịch vụ nhỏ đôi khi không hỗ trợ kích hoạt trực tiếp `pg_cron`.
  * *Khắc phục*: Sử dụng cron-sweep của Database làm lưới an toàn phụ. Cơ chế dọn dẹp chính vẫn là sự kiện *Delete-on-empty* được trigger đồng thời ở tầng Client khi người dùng cuối cùng rời phòng (qua action `leaveRoom`).
* **RLS Recursion (Lỗi đệ quy)**: Nếu viết một câu RLS trên bảng `watch_queue_items` truy vấn trực tiếp bảng `room_members` bằng lệnh SELECT thông thường, Postgres sẽ sinh lỗi đệ quy vô tận do chính `room_members` cũng có RLS SELECT.
  * *Khắc phục*: Bắt buộc phải sử dụng hàm helper `public.is_room_member()` được định nghĩa dưới dạng `SECURITY DEFINER` để truy xuất bảng `room_members` với quyền ưu tiên bỏ qua kiểm tra RLS.
