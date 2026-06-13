# Phase 2 Plan — Watch‑Together Upgrade (Zones · Auto‑hide Controls · Soft‑sync · Collaborative Playlist · Lifecycle)

> **Tiền đề:** Phase 1 (Synced Playback lõi) đã hoàn thành & nghiệm thu. Plan này **nâng cấp**
> tính năng watch‑together, KHÔNG làm lại từ đầu. Đọc kèm `AGENTS.md`, `apps/web/AGENTS.md`,
> `docs/conventions/*`, và plan v1 `docs/plans/media-watch-together-refactor.md`.
>
> **Đây là bản kế hoạch thực thi.** Một agent khác chỉ cần đọc file này là làm được.

---

## 0. Phạm vi & quyết định đã chốt

**Phase 2 thêm/sửa:**

1. **Tái cấu trúc layout theo "zones"** — bỏ khung bó nhỏ căn giữa; Stage (video lớn) + Side Dock.
2. **Control overlay AUTO‑HIDE** (kiểu YouTube): đè video nhưng tự ẩn sau ~3s không tương tác.
3. **Soft‑lock + resync cho follower**: follower được tự tua/xem lại → tạm lệch host → nút "Đồng bộ lại".
4. **Collaborative playlist**: mọi **thành viên** thêm/sắp xếp/xóa item; host điều khiển "đang phát gì".
5. **`room_members`** (membership thật) → RLS chuẩn cho playlist + nền tảng host‑handoff.
6. **Lifecycle/cleanup**: `last_active_at` + `ON DELETE CASCADE` + delete‑on‑empty + cron quét stale.

**Quyết định kiến trúc đã chốt (KHÔNG đổi khi thực thi):**

| # | Quyết định | Chốt |
| --- | --- | --- |
| Control layout | Overlay auto‑hide 3s | ✅ |
| Follower seek | Soft‑lock + resync (client‑only, follower KHÔNG ghi/broadcast) | ✅ |
| Playlist RLS | Bảng `room_members`, RLS gate theo membership | ✅ |
| Advance queue | **Host authoritative** (auto khi `ended` / bấm Next); follower Next = *đề nghị* | ✅ default |
| Host‑handoff | **Chuyển quyền thủ công** (host trao cho member); auto‑promote = follow‑up | ✅ default |
| Presence vs member | `room_members` = quyền/RLS (bền); **Realtime Presence vẫn là nguồn hiển thị "đang online"** | ✅ default |
| Cleanup | delete‑on‑empty (presence leave) **+** cron quét `last_active_at` (lưới an toàn) | ✅ default |

**NGOÀI phạm vi (giữ cho sau):** chat, reactions, upload/storage, screen‑share, auto host‑promote,
host kick member, broadcast‑based state hydration (giữ DB anchor debounce của v1).

---

## 1. Kết quả mong đợi

- Video chiếm không gian lớn (theater), controls không còn đè cố định.
- Follower có thể tua xem lại rồi đồng bộ lại bằng 1 nút.
- Playlist sửa chung, đồng bộ realtime, RLS chỉ cho thành viên.
- Phòng tự dọn khi trống / khi quá hạn — không rác tích tụ.
- App build/typecheck/lint/test xanh ở cuối mỗi phase. RLS là ranh giới thật (P0).

---

## 2. Bản đồ v1 hiện tại (cái sẽ sửa)

| File | Vai trò | Phase 2 |
| --- | --- | --- |
| `features/watch/types.ts` | Room, PlaybackAnchor, Participant | **sửa** (thêm QueueItem, Member) |
| `features/watch/queries.ts` | `getRoom` | **sửa** (thêm `getQueue`, `getRoomWithQueue`) |
| `features/watch/actions.ts` | createRoom, setRoomSource, deleteRoom, joinByCode | **sửa** (membership, queue, advance, transfer) |
| `features/watch/sync-math.ts` | anchor math, helpers | **sửa** (thêm `fractionalPosition`) |
| `features/watch/hooks/use-server-clock.ts` | clock offset | giữ |
| `features/watch/hooks/use-room-channel.ts` | broadcast + presence + postgres_changes | giữ (đã có postgres_changes) |
| `features/watch/hooks/use-sync-controller.ts` | anchor sync | **sửa** (soft‑lock + resync) |
| `features/watch/components/sync-player.tsx` | Vidstack wrapper | **sửa** (Stage full, scrim) |
| `features/watch/components/room-controls.tsx` | transport bar | **sửa** (auto‑hide + follower mở khóa + resync) |
| `features/watch/components/watch-room.tsx` | orchestrator | **sửa** (zones + side dock) |
| `features/watch/components/participant-rail.tsx` | presence avatars | giữ (đặt trong dock tab) |
| `features/watch/components/watch-lobby.tsx` | lobby | giữ |
| `features/watch/components/sync-indicator.tsx` | sync status | giữ |
| `app/(watch)/watch/[roomId]/page.tsx` | room route | **sửa** (ensure membership) |
| `app/(watch)/layout.tsx` | immersive shell | **sửa** (bỏ center bó nhỏ) |
| `supabase/migrations/007_watch_rooms.sql` | schema phòng | **KHÔNG sửa** (append‑only) |
| `packages/validators/src/watch.ts` | schema | **sửa** (queue schemas) |

**File MỚI:**
```
features/watch/hooks/use-controls-visibility.ts   # auto-hide
features/watch/hooks/use-room-queue.ts            # realtime queue
features/watch/components/side-dock.tsx           # Tabs [Người xem | Playlist]
features/watch/components/playlist-panel.tsx      # playlist UI (add/reorder/remove)
supabase/migrations/008_room_members.sql
supabase/migrations/009_watch_queue_items.sql
supabase/migrations/010_watch_lifecycle.sql       # last_active_at + cron cleanup
```

---

## 3. PHASE A — DB schema (migrations append‑only)

> Sau mỗi migration: áp + regenerate types
> `bunx supabase gen types typescript --local > packages/supabase/src/types.ts`.

### 3.1 `008_room_members.sql`

```sql
-- Persistent room membership. The authorization backbone for collaborative
-- playlist editing and host transfer. (Online status stays in Realtime Presence.)
create table public.room_members (
  room_id   uuid not null references public.watch_rooms(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table public.room_members enable row level security;

-- Members aren't secret (link-shared model); keep SELECT open to authenticated.
create policy "room_members_select" on public.room_members
  for select to authenticated using (true);

-- A user may only insert/remove THEIR OWN membership.
create policy "room_members_insert_self" on public.room_members
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "room_members_delete_self" on public.room_members
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.room_members from anon, authenticated;
grant select, insert, delete on table public.room_members to authenticated;
grant select, insert, delete, update on table public.room_members to service_role;

-- SECURITY DEFINER membership check — used by queue RLS to AVOID recursive RLS
-- evaluation (queue policy querying room_members which has its own RLS).
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

-- Host transfer (manual). Only the current host may transfer, and only to an
-- existing member. SECURITY DEFINER so it can update host_id despite the
-- row-owner UPDATE policy on watch_rooms.
create or replace function public.transfer_room_host(p_room_id uuid, p_new_host uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.watch_rooms
                 where id = p_room_id and host_id = (select auth.uid())) then
    raise exception 'Only the current host may transfer host';
  end if;
  if not public.is_room_member(p_room_id) then null; end if; -- noop guard
  if not exists (select 1 from public.room_members
                 where room_id = p_room_id and user_id = p_new_host) then
    raise exception 'New host must be a room member';
  end if;
  update public.watch_rooms set host_id = p_new_host, updated_at = now()
  where id = p_room_id;
end;
$$;
revoke all on function public.transfer_room_host(uuid, uuid) from public, anon;
grant execute on function public.transfer_room_host(uuid, uuid) to authenticated;

alter publication supabase_realtime add table public.room_members;
```

### 3.2 `009_watch_queue_items.sql`

```sql
-- Collaborative playlist. Any room MEMBER may add/reorder/remove. The host
-- decides what is *currently playing* (separate authority — see watch_rooms).
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
create index watch_queue_items_room_pos_idx
  on public.watch_queue_items (room_id, position);

alter table public.watch_queue_items enable row level security;

-- All CRUD gated on membership via the SECURITY DEFINER helper (no recursion).
create policy "watch_queue_select" on public.watch_queue_items
  for select to authenticated using (public.is_room_member(room_id));
create policy "watch_queue_insert" on public.watch_queue_items
  for insert to authenticated with check (public.is_room_member(room_id));
create policy "watch_queue_update" on public.watch_queue_items
  for update to authenticated
  using (public.is_room_member(room_id)) with check (public.is_room_member(room_id));
create policy "watch_queue_delete" on public.watch_queue_items
  for delete to authenticated using (public.is_room_member(room_id));

revoke all on table public.watch_queue_items from anon, authenticated;
grant select, insert, update, delete on table public.watch_queue_items to authenticated;
grant select, insert, update, delete on table public.watch_queue_items to service_role;

-- Track which queue item is "now playing" (for highlight + advance).
alter table public.watch_rooms
  add column current_queue_item_id uuid
  references public.watch_queue_items(id) on delete set null;

alter publication supabase_realtime add table public.watch_queue_items;
```

### 3.3 `010_watch_lifecycle.sql`

```sql
-- Ephemeral-room lifecycle: heartbeat column + scheduled cleanup of stale rooms.
alter table public.watch_rooms
  add column last_active_at timestamptz not null default now();

-- pg_cron sweep: delete rooms inactive > 6h (CASCADE clears members + queue).
create extension if not exists pg_cron;
select cron.schedule(
  'watch-rooms-cleanup',
  '0 * * * *',                         -- hourly
  $$ delete from public.watch_rooms
     where last_active_at < now() - interval '6 hours'; $$
);
```

> Nếu `pg_cron` không khả dụng trên gói Supabase đang dùng: thay bằng **Supabase Edge
> Function + Scheduled Trigger** chạy cùng câu DELETE (ghi rõ trong PR mô tả). Delete‑on‑empty
> (§5) vẫn là cơ chế dọn chính; cron chỉ là lưới an toàn cho phòng "mồ côi".

**Acceptance Phase A:** types có `room_members`, `watch_queue_items`, `watch_rooms.current_queue_item_id`, `watch_rooms.last_active_at`; typecheck xanh.

---

## 4. PHASE B — Validators (`packages/validators/src/watch.ts`)

Thêm (giữ nguyên schema cũ):

```ts
export const addQueueItemSchema = z.object({
  roomId: z.string().uuid(),
  sourceType: sourceTypeSchema,
  sourceRef: z.string().min(1).max(2048),
  title: z.string().max(300).optional(),
});
export const reorderQueueSchema = z.object({
  roomId: z.string().uuid(),
  itemId: z.string().uuid(),
  beforeId: z.string().uuid().nullable(),   // item sẽ nằm TRƯỚC; null = về đầu/cuối
  afterId: z.string().uuid().nullable(),
});
export const transferHostSchema = z.object({
  roomId: z.string().uuid(),
  newHostId: z.string().uuid(),
});
export type AddQueueItemInput = z.infer<typeof addQueueItemSchema>;
export type ReorderQueueInput = z.infer<typeof reorderQueueSchema>;
export type TransferHostInput = z.infer<typeof transferHostSchema>;
```

`sync-math.ts` thêm helper thuần (test được):
```ts
// Fractional indexing: vị trí mới giữa before/after; ở biên thì ±1.
export function fractionalPosition(before: number | null, after: number | null): number {
  if (before === null && after === null) return 0;
  if (before === null) return after! - 1;
  if (after === null) return before! + 1;
  return (before + after) / 2;
}
```

---

## 5. PHASE C — Server actions & queries

### 5.1 `queries.ts`
- `getRoom(roomId)` — giữ (thêm select `current_queue_item_id`, `last_active_at`).
- `getQueue(roomId)` — `server-only`, đọc `watch_queue_items` theo `room_id` order `position` asc.

### 5.2 `actions.ts` (`"use server"`, validate trước mọi ghi)
- **`joinRoom(roomId)`**: `requireUser()`; **upsert** membership `(room_id, user_id)` (idempotent, `onConflict: "room_id,user_id"`). Trả `ActionResult`.
- **`leaveRoom(roomId)`**: xóa membership của user. Sau đó **đếm member còn lại**; nếu **0** → `deleteRoom`(cascade). (delete‑on‑empty.)
- **`addQueueItem(input)`**: validate `addQueueItemSchema`; sanitize ref (YouTube id / http(s) — tái dùng `extractYouTubeId`/`isValidHttpUrl`); tính `position` = max(position)+1 trong phòng; insert (RLS gate member). Nếu YouTube, nên thử lấy `title` (tùy chọn, có thể bỏ trống v2).
- **`reorderQueue(input)`**: validate; đọc `position` của `beforeId`/`afterId`; `update` `position = fractionalPosition(...)` cho `itemId` (RLS gate member).
- **`removeQueueItem(roomId, itemId)`**: delete (RLS gate member). Nếu item đó đang là `current_queue_item_id` → xử lý ở host advance (không tự đổi nguồn từ action này).
- **`advanceQueue(roomId)`**: **host‑only** (verify `host_id === user.id`, defense‑in‑depth trên RLS). Tìm item kế tiếp theo `position` sau `current_queue_item_id`; set `watch_rooms.source_type/source_ref/current_queue_item_id`, reset `is_playing=false, anchor_position=0, anchor_server_ts=now()`. Nếu hết queue → giữ nguyên / dừng.
- **`transferHost(input)`**: validate; gọi RPC `supabase.rpc("transfer_room_host", { p_room_id, p_new_host })`.
- **Heartbeat:** mọi action ghi vào phòng nên kèm `last_active_at = now()`; HOẶC host cập nhật `last_active_at` định kỳ khi emit anchor (xem §7 — đặt trong debounced persist).

> `setRoomSource` cũ: khi host đổi nguồn thủ công, set `current_queue_item_id = null` (đang phát ngoài queue).

**Acceptance Phase C:** typecheck xanh; mọi input validate; host‑only actions verify host.

---

## 6. PHASE D — Realtime hook playlist (`use-room-queue.ts`, `"use client"`)
- Tham số: `roomId`, `initialItems`.
- Subscribe channel (tái dùng `room:{roomId}` qua một channel chung hoặc channel riêng `room:{roomId}:queue`) lắng `postgres_changes` `INSERT/UPDATE/DELETE` trên `watch_queue_items` filter `room_id=eq.{roomId}` → cập nhật list, **giữ sort theo `position`**.
- Trả `{ items, currentItem }` (currentItem map theo `room.current_queue_item_id`).
- Cleanup khi unmount.

> **Lưu ý kênh:** tránh tạo quá nhiều channel. Có thể đăng ký thêm listener `postgres_changes`
> cho `watch_queue_items` ngay trong `use-room-channel` hiện có (cùng channel `room:{roomId}`),
> trả thêm `queueItems`. Ưu tiên gộp để giảm số subscription. Quyết định lúc code, miễn 1 channel/phòng.

---

## 7. PHASE E — Sync controller: soft‑lock + resync (`use-sync-controller.ts`)

Thêm vào controller hiện có:

```
isFollowingHostRef = useRef(true)            // chỉ ý nghĩa với follower
const [isFollowingHost, setFollowing] = useState(true)

// reconcile(): chặn khi đã rời đồng bộ
function reconcile() {
  if (isHost || !isFollowingHostRef.current) return
  ... (logic drift cũ giữ nguyên)
}

// Follower thao tác thủ công (qua RoomControls) => rời đồng bộ, KHÔNG broadcast/ghi DB
function handleFollowerManualSeekOrPause() {
  if (suppressSeekedEventRef.current) { suppressSeekedEventRef.current = false; return }
  isFollowingHostRef.current = false
  setFollowing(false)
}

// Nút "Đồng bộ lại"
function resync() {
  isFollowingHostRef.current = true
  setFollowing(true)
  // hard seek về expected + khớp play/pause ngay
  const a = anchorRef.current, p = playerRef.current
  if (p) {
    suppressSeekedEventRef.current = true
    p.currentTime = calculateExpectedPosition(a, serverClock())
    if (a.isPlaying && p.paused) p.play().catch(()=>{})
    if (!a.isPlaying && !p.paused) p.pause().catch(()=>{})
    p.playbackRate = a.playbackRate
  }
}
```

**Bất biến phải giữ:**
- **Follower KHÔNG bao giờ `broadcastAnchor`/`persistAnchor`.** Thao tác của follower chỉ đổi player local + tắt `isFollowingHost`.
- Host vẫn `emitAnchor` như cũ.
- Programmatic seek (reconcile + resync) set `suppressSeekedEventRef` để không tự tắt follow.
- Trả thêm `{ isFollowingHost, resync }` cho UI.

`emitAnchor` (host): bổ sung cập nhật `last_active_at` trong `persistAnchor` (heartbeat).

---

## 8. PHASE F — Controls auto‑hide (`use-controls-visibility.ts`, `"use client"`)

```
useControlsVisibility({ paused }) -> { visible, bind }
```
- `visible=true` khi: `mousemove`/`pointermove`/`touchstart`/`keydown` trên Stage, hoặc đang **paused**, hoặc con trỏ đang hover thanh điều khiển, hoặc focus nằm trong thanh.
- Sau **3000ms** không tương tác **và** đang play → `visible=false`.
- `bind` trả handlers gắn lên container Stage; thanh điều khiển nhận `data-visible` để fade.
- **A11y/reduced‑motion:** `useReducedMotion()` → bỏ fade (đổi tức thì); luôn hiện khi có focus bàn phím trong thanh; `pointer-events` tắt khi ẩn.

---

## 9. PHASE G — UI / Zones (Design System)

> Bắt buộc `@pumni/ui` + token semantic. Floating layer dùng glass utility đúng role.
> Tham chiếu `docs/conventions/design-system.md`. Lint `pumniNoRawColor` sẽ chặn raw màu className.

### 9.1 `(watch)/layout.tsx`
- Bỏ `items-center justify-center` + giới hạn nhỏ. Cho phép nội dung **chiếm gần hết viewport** (theater). Giữ nền Stage true‑black (inline style đen cho letterbox là chấp nhận — đồng bộ idiom dự án), auth sau Suspense + `unstable_instant` giữ nguyên.

### 9.2 `watch-room.tsx` — zones
- Layout: `flex` ngang trên desktop — **Stage `flex-1`** + **Side Dock cố định ~340px**; dọc/Sheet trên mobile.
- Bỏ `max-w-5xl`. Header mỏng (mã phòng, copy link, SyncIndicator, nút Back) đặt trên Stage hoặc trong dock.
- Truyền `isFollowingHost` + `resync` xuống RoomControls; truyền `queueItems`/`currentItem` xuống SideDock.

### 9.3 `sync-player.tsx` — Stage
- Bỏ giới hạn nhỏ; player lấp đầy Stage (`w-full h-full`, `aspect-video` trong khung co giãn). Thêm **gradient scrim đáy** (token, không raw) để controls overlay dễ đọc.

### 9.4 `room-controls.tsx` — transport auto‑hide + follower mở khóa + resync
- Bọc trong container nhận `visible` từ `useControlsVisibility`; fade + `pointer-events-none` khi ẩn (gate reduced‑motion).
- **Bỏ `disabled={!isHost}`** trên play/pause/seek: cả hai vai trò bấm được.
  - Host → đi qua remote như cũ → player phát event → controller `emitAnchor`.
  - Follower → remote điều khiển player local → controller bắt event → `handleFollowerManualSeekOrPause` (rời đồng bộ).
- Khi `!isFollowingHost` (follower lệch): hiện banner + nút **"Đồng bộ lại với mọi người"** gọi `resync()`. Banner dùng token `warning`.
- Speed/source‑change vẫn host‑only.

### 9.5 `side-dock.tsx` — Tabs
- `Tabs` `[Người xem | Playlist]`, container `.glass-panel`, `rounded-xl`.
- Tab "Người xem" = `ParticipantRail` (presence online, giữ nguyên) + (host) nút trao quyền cho member.
- Tab "Playlist" = `PlaylistPanel`.
- Mobile: dock thành `Sheet` (`@pumni/ui`) mở từ nút trên header.

### 9.6 `playlist-panel.tsx`
- Form thêm item: `Tabs` chọn `youtube|url` + `Input` + nút thêm → `addQueueItem`.
- Danh sách item: hiển thị title/ref, người thêm; **highlight item đang phát** (`current_queue_item_id`) bằng token `primary`.
- Mỗi item: nút xóa (`removeQueueItem`); **kéo‑thả sắp xếp** → `reorderQueue` (tính before/after id). (Nếu kéo‑thả phức tạp, v2 có thể dùng nút ▲▼ trước, drag‑drop follow‑up — ghi rõ.)
- (Host) nút **"Phát tiếp theo"** = `advanceQueue`; follower bấm Next = broadcast "request‑next" (host tùy chọn honor) — hoặc ẩn Next với follower ở v2.
- Realtime: list từ `use-room-queue` → mọi thay đổi của người khác hiện ngay.

**Acceptance Phase G:** lint (màu) + typecheck xanh; controls tự ẩn/hiện; follower tua được + resync; playlist render.

---

## 10. PHASE H — Membership wiring & lifecycle

- **Vào phòng:** `app/(watch)/watch/[roomId]/page.tsx` (server) sau `getRoom`, gọi `joinRoom(roomId)` (idempotent) **trước khi** render → đảm bảo là member (để RLS queue hoạt động, không flash).
- **createRoom:** chèn host vào `room_members` ngay khi tạo (trong action `createRoom`).
- **Rời phòng:** `WatchRoom` (client) gọi `leaveRoom(roomId)` khi unmount **và** trên `beforeunload`/presence `leave`. `leaveRoom` xóa membership + delete‑on‑empty.
- **Heartbeat:** host cập nhật `last_active_at` qua `persistAnchor` (§7).
- **Cron:** đã đặt ở migration 010 (lưới an toàn cho phòng mồ côi).

---

## 11. Bảo mật (P0 — không thoả hiệp)
- **RLS là ranh giới thật.** Queue CRUD gate qua `is_room_member()` (SECURITY DEFINER, `search_path=public`, tránh đệ quy RLS). Host transfer qua `transfer_room_host()` (verify host hiện tại + member). Host‑only actions verify trong code (defense‑in‑depth).
- **Follower không ghi state phát** (chỉ đổi player local). Bất biến này phải giữ tuyệt đối.
- **Sanitize** mọi `source_ref` (YouTube id / http(s)). URL nhúng → iframe `sandbox` nếu render embed.
- Không secret xuống client; chỉ publishable key cho Realtime; `server-only` trên queries/actions giữ nguyên.
- SECURITY DEFINER functions: `revoke from public/anon`, `grant execute to authenticated` only.

---

## 12. Best‑practice hiệu năng
- **Tầng dữ liệu đúng** (đã quyết): Postgres+RLS cho room/member/queue (bền + bảo mật); **Broadcast** cho anchor; **Presence** cho online. KHÔNG đẩy anchor tần suất cao vào DB ngoài debounce.
- **1 channel/phòng** nếu được (gộp broadcast + presence + postgres_changes của rooms/queue).
- **Refs cho giá trị tần suất cao**; state hoá giá trị thô cho UI.
- **Fractional indexing** cho reorder → update 1 row, không rớt cả list, tránh xung đột.
- `current_queue_item_id` để highlight + advance O(1), không quét.
- Auto‑hide dùng 1 timer + listener gọn; không setState mỗi mousemove (debounce/raf).

---

## 13. Phasing & cổng nghiệm thu

| Phase | Nội dung | Cổng |
| --- | --- | --- |
| A | Migrations 008/009/010 + types | types có member/queue/cột mới; `typecheck` |
| B | Validators + sync-math helper | `typecheck`; unit fractionalPosition |
| C | Actions + queries | `typecheck`; input validate; host‑only verify |
| D | Realtime queue hook | `typecheck`; 1 channel/phòng |
| E | Sync controller soft‑lock | `typecheck`; unit reconcile bị chặn khi !following |
| F | Auto‑hide hook | `typecheck` |
| G | UI zones + controls + playlist | `lint`(màu) + `typecheck` |
| H | Membership wiring + lifecycle | build xanh |
| I | Nghiệm thu tổng | `ai:check`+`lint`+`typecheck`+`test`+`build` xanh + smoke |

> Mỗi phase một commit build được.

### Test tự động tối thiểu (thuần)
- `fractionalPosition` (biên + giữa).
- reconcile bị **bỏ qua khi `isFollowingHost=false`** (refactor để test logic thuần nếu cần).
- Validator: `addQueueItemSchema`, `reorderQueueSchema`.

### Smoke test thủ công (2 tài khoản / 2 trình duyệt)
1. A tạo phòng (YouTube) → B join bằng code → cả hai là member (queue editable).
2. **Controls auto‑hide**: rê chuột hiện, để yên 3s khi đang play → ẩn; pause → luôn hiện.
3. **Soft‑lock**: B tua lùi xem lại → banner "lệch host" → bấm "Đồng bộ lại" → nhảy về vị trí host.
4. **Playlist chung**: B thêm 2 video → A thấy ngay (realtime); B kéo sắp xếp → A thấy đổi thứ tự; A (host) bấm "Phát tiếp theo" → cả phòng đổi sang item kế.
5. **Reorder không xung đột**: A và B cùng thao tác playlist → không mất item, thứ tự nhất quán.
6. **Lifecycle**: cả hai rời phòng → phòng bị xóa (delete‑on‑empty); kiểm `watch_rooms`/`watch_queue_items`/`room_members` đã sạch.
7. **RLS**: user KHÔNG phải member thử sửa queue (giả lập qua client/API) → bị từ chối.

---

## 14. Rủi ro / lưu ý thực thi
- **Vidstack v1.15.6**: verify API `useMediaRemote`/`useMediaState` + provider trong `node_modules` (KHÔNG dựa training data). Follower seek dùng `remote.seek` như host.
- **pg_cron** có thể không bật được trên mọi gói Supabase → fallback Edge Function scheduled (ghi rõ trong PR). delete‑on‑empty là cơ chế chính.
- **RLS recursion**: bắt buộc dùng `is_room_member()` SECURITY DEFINER trong policy queue; KHÔNG inline subquery room_members trong policy (dễ đệ quy).
- **Realtime publication**: phải áp 008/009 lên DB thật + bảng nằm trong `supabase_realtime` thì postgres_changes mới chạy (như bài học Phase 1).
- **Drag‑drop**: nếu tốn thời gian, ship nút ▲▼ trước, drag‑drop để follow‑up — vẫn đạt "sửa chung".
