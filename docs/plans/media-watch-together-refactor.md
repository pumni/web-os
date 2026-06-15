# Refactor Plan — Media → Synced Playback (Watch‑Together) Hub

> **Mục tiêu:** Gỡ bỏ hoàn toàn tính năng Cinema (Jellyfin + Tailscale) và thay bằng
> một **Watch‑Together hub** với **lõi duy nhất: Synced Playback** — nhiều người
> xem chung **một nguồn video (YouTube hoặc URL trực tiếp)**, đồng bộ play/pause/seek
> theo thời gian thực.
>
> **Đây là bản kế hoạch thực thi.** Một agent khác chỉ cần đọc file này là refactor được.
> Đọc kèm `AGENTS.md`, `apps/web/AGENTS.md`, và `docs/conventions/*` trước khi viết code.

---

## 0. Phạm vi (đọc kỹ — chống phình)

**TRONG phạm vi v1 (chỉ Synced Playback):**

- Tạo / tham gia phòng (room) bằng mã (join code).
- Phòng có **một nguồn** video: `youtube` (video id/URL) hoặc `url` (link mp4/HLS trực tiếp).
- **Host** điều khiển play / pause / seek / đổi tốc độ; tất cả người khác **đồng bộ theo**.
- **Presence tối thiểu**: biết ai đang trong phòng + ai là host (cần cho mô hình sync).

**NGOÀI phạm vi v1 (KHÔNG làm — sẽ là phase sau):**

- ❌ Upload video / storage pipeline (Supabase Storage / R2 / transcode).
- ❌ Screen‑share (WebRTC/SFU — sản phẩm khác hoàn toàn).
- ❌ Chat, reactions, emoji, con trỏ chung.
- ❌ Playlist / queue nhiều nguồn.
- ❌ Host handoff tự động (xem §9 — v1 dùng mô hình host = creator, đơn giản).

> Nếu một bước có vẻ cần "thêm cho đủ", **dừng lại** — nó thuộc phase sau.

---

## 1. Kết quả mong đợi sau refactor

- Không còn bất kỳ tham chiếu nào tới Jellyfin / Tailscale / `@pumni/jellyfin`.
- App build/typecheck/lint/test xanh ở **mỗi cuối phase** (mỗi phase tự đứng vững).
- Tính năng mới sống ở `apps/web/src/features/watch` + route `/watch` & `/watch/[roomId]`.
- Kiến trúc sync theo mô hình **anchor‑based** (§7), **DB giữ intent có thẩm quyền +
  Realtime broadcast cho độ trễ thấp** (§6). UI 100% dùng design system `@pumni/ui` (§10).

---

## 2. Bản đồ thực trạng (cái gì đang ở đâu)

**Tính năng Cinema hiện tại gồm:**

| Loại                  | Đường dẫn                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| Feature module        | `apps/web/src/features/media/` (queries, actions, types, index, `components/*`)                 |
| Route thư viện        | `apps/web/src/app/(app)/media/page.tsx`                                                         |
| Route chi tiết        | `apps/web/src/app/(app)/media/[itemId]/page.tsx`                                                |
| Route xem (immersive) | `apps/web/src/app/(watch)/media/[itemId]/watch/page.tsx`                                        |
| Layout immersive      | `apps/web/src/app/(watch)/layout.tsx`                                                           |
| Image proxy           | `apps/web/src/app/api/media/image/[itemId]/route.ts`                                            |
| Package server        | `packages/jellyfin/` (toàn bộ)                                                                  |
| Validators            | `packages/validators/src/media.ts` (+ export trong `index.ts`)                                  |
| Env (server)          | `packages/env/src/server-schema.ts`, `server.ts` (4 biến `JELLYFIN_*`)                          |
| Env (client)          | `packages/env/src/client-schema.ts`, `client.ts` (`NEXT_PUBLIC_JELLYFIN_URL`)                   |
| Turbo env allowlist   | `turbo.json` → `globalEnv` (5 biến jellyfin)                                                    |
| Next image config     | `apps/web/next.config.ts` → `images.localPatterns` (`/api/media/image/**`)                      |
| Nav                   | `apps/web/src/components/app-shell/nav-items.ts` (mục `/media` "Cinema")                        |
| DB                    | `supabase/migrations/005_media_preferences.sql` → bảng `media_watch_history`, `media_favorites` |
| DB types              | `packages/supabase/src/types.ts` (2 bảng trên — **file generated**)                             |
| Deps                  | `apps/web/package.json` → `@pumni/jellyfin` (xoá), `@vidstack/react` (**GIỮ**)                  |
| `.env`                | `apps/web/.env.example`, `.env.local` → các biến `JELLYFIN_*`                                   |

**Hạ tầng tái dùng (GIỮ):**

- `@vidstack/react@1.15.6` — player (hỗ trợ provider YouTube + video/HLS).
- `@pumni/supabase` — `createSupabaseServerClient` (server), `createSupabaseBrowserClient` (browser, dùng cho Realtime).
- `@pumni/auth` — `requireUser`, `getCurrentUser`.
- `@pumni/validators`, `@pumni/env`, `@pumni/ui`.
- Supabase Realtime (đi kèm `@supabase/supabase-js`, **không cần dep mới**).

---

## 3. Cấu trúc đích (sau refactor)

```
apps/web/src/features/watch/
  queries.ts                 # server read: getRoom(roomId)
  actions.ts                 # Server Actions: createRoom, setRoomSource, deleteRoom
  types.ts                   # Room, PlaybackAnchor, Participant, SourceType
  index.ts                   # barrel
  hooks/
    use-server-clock.ts      # "use client" — ước lượng offset đồng hồ server
    use-room-channel.ts      # "use client" — Realtime channel (broadcast + presence)
    use-sync-controller.ts   # "use client" — toán anchor + vòng hiệu chỉnh drift
  components/
    watch-lobby.tsx          # "use client" — tạo/tham gia phòng
    watch-room.tsx           # "use client" — orchestrator (player + sync + presence)
    sync-player.tsx          # "use client" — wrapper Vidstack
    room-controls.tsx        # "use client" — thanh điều khiển của host
    participant-rail.tsx     # "use client" — avatar presence
    sync-indicator.tsx       # "use client" — trạng thái in‑sync / catching‑up / host

apps/web/src/app/(app)/watch/page.tsx              # lobby (có shell)
apps/web/src/app/(watch)/watch/[roomId]/page.tsx   # phòng xem (immersive, tái dùng group (watch))
apps/web/src/app/api/time/route.ts                 # GET → { now: <epoch ms server> } cho clock sync

packages/validators/src/watch.ts                   # schema tạo phòng / đổi nguồn
supabase/migrations/006_drop_legacy_media.sql       # DROP bảng cinema cũ
supabase/migrations/007_watch_rooms.sql             # CREATE watch_rooms + RLS
```

---

## 4. PHASE 0 — Dọn dẹp Cinema (phải đứng vững độc lập)

> Sau Phase 0, app build sạch, **không còn tính năng media**, nav không còn mục Cinema.

### 4.1 Xoá file / thư mục

- `apps/web/src/features/media/` — **xoá cả thư mục**.
- `apps/web/src/app/(app)/media/` — xoá cả thư mục (`page.tsx` + `[itemId]/page.tsx`).
- `apps/web/src/app/(watch)/media/` — xoá thư mục con `media` (giữ lại group `(watch)` để tái dùng).
- `apps/web/src/app/api/media/` — xoá cả thư mục (image proxy). Nếu `api/` rỗng sau đó thì để nguyên (route mới `api/time` sẽ dùng).
- `packages/jellyfin/` — **xoá cả package** (cả `node_modules`, `.turbo` của nó).
- `packages/validators/src/media.ts` — xoá.

### 4.2 Sửa file

- `packages/validators/src/index.ts` — xoá dòng `export * from "./media";`.
- `packages/env/src/server-schema.ts` — xoá `JELLYFIN_URL`, `JELLYFIN_API_KEY`, `JELLYFIN_USER`, `JELLYFIN_PASSWORD`.
- `packages/env/src/server.ts` — xoá 4 dòng map `JELLYFIN_*` + dòng `NEXT_PUBLIC_JELLYFIN_URL`.
- `packages/env/src/client-schema.ts` — xoá `NEXT_PUBLIC_JELLYFIN_URL`.
- `packages/env/src/client.ts` — xoá dòng map `NEXT_PUBLIC_JELLYFIN_URL`.
- `turbo.json` — xoá 5 phần tử `*JELLYFIN*` khỏi `globalEnv`.
- `apps/web/next.config.ts` — xoá block `images.localPatterns` (`/api/media/image/**`). Nếu sau đó `images` rỗng thì xoá luôn key `images`.
- `apps/web/src/components/app-shell/nav-items.ts` — đổi mục Cinema:
  - từ `{ href: "/media" as Route, label: "Cinema", icon: Film }`
  - thành `{ href: "/watch" as Route, label: "Watch Together", icon: Clapperboard }`
    (import `Clapperboard` từ `lucide-react`; bỏ `Film` nếu không còn dùng).
- `apps/web/package.json` — xoá dependency `"@pumni/jellyfin": "workspace:*"`. **GIỮ** `@vidstack/react`.
- `apps/web/.env.example` và `apps/web/.env.local` — xoá mọi dòng `JELLYFIN_*` và `NEXT_PUBLIC_JELLYFIN_URL`.

### 4.3 DB — migration DROP (append‑only, KHÔNG sửa 005)

Tạo `supabase/migrations/006_drop_legacy_media.sql`:

```sql
-- Retire the legacy Cinema feature (Jellyfin). Tables/policies/grants are
-- dropped; data is intentionally discarded (feature deprecated 2026-06-13).
drop table if exists public.media_favorites;
drop table if exists public.media_watch_history;
```

> Migrations là lịch sử bất biến — **không xoá/sửa** `005_media_preferences.sql`.

### 4.4 Cập nhật DB types (file generated)

`packages/supabase/src/types.ts` là **generated** (untrusted theo `AGENTS.md`). Sau khi
áp migration, regenerate:

```sh
# từ thư mục gốc repo, sau khi đã supabase db push/reset:
bunx supabase gen types typescript --local > packages/supabase/src/types.ts
```

Nếu không chạy được Supabase local: hand‑edit `types.ts`, **xoá** hai khối
`media_watch_history` và `media_favorites` trong `public.Tables`.

### 4.5 Cài lại deps + nghiệm thu Phase 0

```sh
bun install            # gỡ @pumni/jellyfin khỏi lockfile
bun run typecheck      # phải xanh
bun run lint           # phải xanh
bun run build          # phải xanh
bun run ai:check
```

**Acceptance Phase 0:** grep toàn repo không còn `jellyfin` / `JELLYFIN` / `media_watch_history`
/ `media_favorites` (trừ file migration `005` lịch sử và `006` drop). App build sạch.

---

## 5. PHASE 1 — DB schema cho phòng xem

Tạo `supabase/migrations/007_watch_rooms.sql`:

```sql
-- Watch-Together rooms. One authoritative playback "intent" row per room.
-- The host (creator) is the only writer of playback fields (enforced by RLS).
create type public.watch_source_type as enum ('youtube', 'url');

create table public.watch_rooms (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,                 -- short join code
  host_id         uuid not null references auth.users(id) on delete cascade,
  source_type     public.watch_source_type not null,
  source_ref      text not null,                        -- youtube id OR direct url
  is_playing      boolean not null default false,
  anchor_position double precision not null default 0,  -- seconds into media
  anchor_server_ts timestamptz not null default now(),  -- server clock at anchor
  playback_rate   real not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index watch_rooms_code_idx on public.watch_rooms (code);

alter table public.watch_rooms enable row level security;

-- v1 access model: rooms are link/code-shared, not secret. Any authenticated
-- user may read a room (they need its id/code to reach it anyway).
create policy "watch_rooms_select_authenticated"
on public.watch_rooms for select to authenticated
using (true);

-- Only the creator row-owner may insert their own room.
create policy "watch_rooms_insert_own"
on public.watch_rooms for insert to authenticated
with check ((select auth.uid()) = host_id);

-- AUTHORITATIVE CONTROL GATE: only the host mutates playback state.
create policy "watch_rooms_update_host"
on public.watch_rooms for update to authenticated
using ((select auth.uid()) = host_id)
with check ((select auth.uid()) = host_id);

create policy "watch_rooms_delete_host"
on public.watch_rooms for delete to authenticated
using ((select auth.uid()) = host_id);

revoke all on table public.watch_rooms from anon, authenticated;
grant select, insert, update, delete on table public.watch_rooms to authenticated;
grant select, insert, update, delete on table public.watch_rooms to service_role;
```

> **Vì sao RLS update = host:** đây là ranh giới thật (P0). Followers không bao giờ
> ghi được trạng thái phát; chỉ host. Đây là điểm tựa của toàn bộ mô hình sync.

Áp migration + regenerate types (như §4.4) → `watch_rooms` xuất hiện trong `types.ts`.

**Bật Realtime cho bảng** (Supabase): đảm bảo `watch_rooms` nằm trong publication
`supabase_realtime` (Studio → Database → Replication, hoặc
`alter publication supabase_realtime add table public.watch_rooms;` trong migration).
_Lưu ý:_ v1 dùng **broadcast** là chính (không bắt buộc postgres‑changes), nhưng bật
sẵn để late‑join refetch hoạt động mượt nếu cần.

**Acceptance Phase 1:** typecheck xanh; `Database["public"]["Tables"]["watch_rooms"]` tồn tại.

---

## 6. PHASE 2 — Validators + server clock route

### 6.1 `packages/validators/src/watch.ts`

```ts
import { z } from 'zod';

export const sourceTypeSchema = z.enum(['youtube', 'url']);

// YouTube: 11-char id. URL: http(s) only.
export const createRoomSchema = z.object({
  sourceType: sourceTypeSchema,
  sourceRef: z.string().min(1).max(2048),
});

export const setSourceSchema = z.object({
  roomId: z.string().uuid(),
  sourceType: sourceTypeSchema,
  sourceRef: z.string().min(1).max(2048),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type SetSourceInput = z.infer<typeof setSourceSchema>;
```

Thêm `export * from "./watch";` vào `packages/validators/src/index.ts`.

> **Sanitize URL** ở Server Action (§8): chỉ chấp nhận scheme `http`/`https`; với
> `youtube` parse ra 11‑ký‑tự video id. Chống SSRF/nhập rác.

### 6.2 `apps/web/src/app/api/time/route.ts`

```ts
// Server clock source for drift-free anchor math. No auth needed (no secrets).
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ now: Date.now() });
}
```

**Acceptance Phase 2:** typecheck xanh; `GET /api/time` trả `{ now: number }`.

---

## 7. Mô hình sync — TOÁN ANCHOR (đặc tả lõi, đọc kỹ trước Phase 3)

Trạng thái phát biểu diễn bằng **một mốc neo** trên **đồng hồ server**:

```
anchor = { isPlaying, anchorPosition (s), anchorServerTs (ms, server clock), rate }
```

**Đồng hồ chung:** mỗi client ước lượng `clockOffset` MỘT LẦN khi vào phòng:

```
// gọi GET /api/time
t0 = Date.now()
serverNow = (await fetch('/api/time')).now
t1 = Date.now()
rtt = t1 - t0
clockOffset = serverNow - (t0 + rtt / 2)     // local + offset ≈ server clock
serverClock() => Date.now() + clockOffset
```

**Vị trí đáng lẽ phải ở NGAY BÂY GIỜ** (mọi client tính giống nhau):

```
expected = isPlaying
  ? anchorPosition + (serverClock() - anchorServerTs) / 1000 * rate
  : anchorPosition
```

**Host** tạo anchor mới mỗi khi có sự kiện (play / pause / seek / đổi rate / đổi nguồn):

```
emitAnchor() {
  anchor = {
    isPlaying: !player.paused,
    anchorPosition: player.currentTime,
    anchorServerTs: serverClock(),
    rate: player.playbackRate,
  }
  channel.broadcast('playback', anchor)        // tức thời tới followers
  debouncedPersist(anchor)                      // ghi DB (xem §6 dưới)
}
```

**Follower** — vòng hiệu chỉnh drift (một `setInterval` ~1000ms, KHÔNG seek mỗi event):

```
reconcile() {
  if (isHost) return                            // host không tự sync
  // 1) khớp play/pause
  if (anchor.isPlaying && player.paused) player.play()
  if (!anchor.isPlaying && !player.paused) player.pause()
  // 2) khớp vị trí theo bậc dung sai
  drift = expected - player.currentTime
  if (abs(drift) < DEADBAND) { player.playbackRate = anchor.rate; return }
  else if (abs(drift) < HARD_SEEK) {
    // bắt kịp mượt bằng nudge tốc độ
    player.playbackRate = clamp(anchor.rate + sign(drift) * NUDGE, 0.5, 2)
  } else {
    suppressSeekedEvent = true                  // tránh feedback loop
    player.currentTime = expected               // seek cứng
  }
}
```

**Hằng số dung sai (theo loại nguồn — YouTube thô hơn):**

|             | `url` (video/HLS) | `youtube` |
| ----------- | ----------------- | --------- |
| `DEADBAND`  | 0.3s              | 1.0s      |
| `HARD_SEEK` | 1.5s              | 2.0s      |
| `NUDGE`     | 0.05              | 0.07      |

**Quy tắc chống vòng lặp:**

- **Chỉ host emit anchor.** Followers không bao giờ broadcast/ghi DB.
- Seek lập trình (programmatic) phải set cờ `suppressSeekedEvent` để bỏ qua event `seeked` sinh ra.
- Dùng **refs** cho giá trị tần suất cao (currentTime, anchor); chỉ đẩy lên React state
  giá trị **thô** cho UI (sync status, participant list) để tránh re‑render mỗi giây.

---

## 8. PHASE 3 — Realtime hooks (`features/watch/hooks/`)

Tất cả `"use client"`. Dùng `createSupabaseBrowserClient()` từ `@pumni/supabase/browser`.

### 8.1 `use-server-clock.ts`

- Hook trả `serverClock()` + `clockOffset`. Đo offset 1 lần khi mount (gọi `/api/time`),
  có thể đo 3 lần lấy trung vị để giảm nhiễu. Trả `ready: boolean`.

### 8.2 `use-room-channel.ts`

- Tham số: `roomId`, `userId`, `isHost`, handler `onAnchor(anchor)`.
- Tạo channel `room:{roomId}` qua supabase browser client.
- **broadcast**: `.on('broadcast', { event: 'playback' }, ({ payload }) => onAnchor(payload))`.
  Trả hàm `broadcastAnchor(anchor)` (chỉ host gọi).
- **presence**: `.track({ userId, isHost, joinedAt })`; expose `participants` (mảng).
- Cleanup: `channel.unsubscribe()` khi unmount.
- Throttle presence; không spam.

### 8.3 `use-sync-controller.ts`

- Tham số: `player` (Vidstack instance/ref), `room`, `isHost`, `serverClock`, `broadcastAnchor`.
- Giữ `anchorRef` (cập nhật từ broadcast `onAnchor` và, với host, từ chính event player).
- Host: gắn listener Vidstack (`play`, `pause`, `seeked`, `rate-change`, `source-change`)
  → `emitAnchor()` (broadcast + debounced persist DB qua **browser client** RLS‑gated:
  `supabase.from('watch_rooms').update({...}).eq('id', roomId)` — host được phép theo RLS;
  debounce ~2–3s + flush trên event rời rạc).
- Follower: chạy `reconcile()` mỗi 1000ms theo §7. Áp `DEADBAND/HARD_SEEK/NUDGE` theo
  `room.source_type`.
- Trả `syncStatus: 'host' | 'in-sync' | 'catching-up'` cho UI.

> **Vì sao host ghi DB trực tiếp (không qua Server Action) cho anchor:** điều khiển phát
> là tần suất cao + cần độ trễ thấp; RLS đã chặn (chỉ host update). Đây là pattern Realtime
> chuẩn của Supabase và nhanh hơn round‑trip Server Action. **Mutation rời rạc** (tạo/xoá
> phòng, đổi nguồn) vẫn đi Server Action (§9) đúng convention.

**Acceptance Phase 3:** typecheck xanh; hooks không import server‑only/secret (tuân
`server-client-boundary.md`).

---

## 9. PHASE 4 — Server reads + actions (`queries.ts`, `actions.ts`)

### 9.1 `queries.ts` (server)

```ts
import { requireUser } from '@pumni/auth';
import { createSupabaseServerClient } from '@pumni/supabase/server';
// getRoom(roomId): đọc 1 row watch_rooms cho initial render (Server Component).
// KHÔNG "use cache" — dữ liệu phòng là live.
```

- `getRoom(roomId)` → trả row (hoặc null). Auth bằng `requireUser()`.

### 9.2 `actions.ts` (`"use server"`)

- `createRoom(input: CreateRoomInput)`:
  - `requireUser()`; `createRoomSchema.safeParse`.
  - **Sanitize**: nếu `youtube` → trích 11‑ký‑tự video id; nếu `url` → enforce `http(s)`.
  - Sinh `code` ngắn (vd 6 ký tự base32). Insert với `host_id = user.id`.
  - Trả `{ ok: true, roomId, code }` | `{ ok: false, message }` (mẫu `ActionResult`).
- `setRoomSource(input: SetSourceInput)`: host đổi nguồn (RLS chặn non‑host). Reset
  `anchor_position=0, is_playing=false, anchor_server_ts=now()`.
- `deleteRoom(roomId)`: host xoá phòng.
- `joinByCode(code)`: đọc room theo `code` → trả `roomId` (chỉ là tra cứu, không mutate).

> Validate bằng schema `@pumni/validators` TRƯỚC mọi ghi (đúng `feature-module.md`).

**Acceptance Phase 4:** typecheck xanh; actions trả `ActionResult`‑style; mọi input validate.

---

## 10. PHASE 5 — UI (Vidstack + Design System)

> **Bắt buộc** dùng `@pumni/ui` + token semantic. Tuyệt đối **không** raw Tailwind màu
> (`bg-neutral-*`, `text-white`), không `rounded-[Npx]`, không glass trên nền lớn. ESLint
> `pumniNoRawColor` sẽ chặn. Tham chiếu `docs/conventions/design-system.md`.

### 10.1 `sync-player.tsx` — wrapper Vidstack

- Dùng `@vidstack/react`. Nguồn:
  - `youtube` → source `https://www.youtube.com/watch?v=<id>` (Vidstack có provider YouTube).
  - `url` → source URL trực tiếp (mp4/HLS qua hls.js bundled).
- **Verify trước khi code:** mở `node_modules/@vidstack/react` docs/types để xác nhận cú
  pháp provider YouTube đúng version `1.15.6` (đây KHÔNG phải Vidstack trong training data).
- Expose player instance ra ngoài (ref/callback) cho `use-sync-controller`.
- Vidstack quản playback state — **KHÔNG** mirror vào Zustand (đúng convention cũ của media).

### 10.2 `room-controls.tsx` — thanh điều khiển host

- Floating bar dùng **`.glass-bar`** (role topbar/dock) — đây là floating layer hợp lệ cho glass.
- Nút play/pause/seek bằng `Button` từ `@pumni/ui` (có press depress sẵn).
- Host thấy full control; follower thấy control **disabled** + nhãn "Host đang điều khiển".
- Icon `lucide-react`. Màu trạng thái: `success`/`warning` semantic tokens.

### 10.3 `participant-rail.tsx` — presence

- `Avatar` từ `@pumni/ui`. Badge "Host" cho host.
- Entrance bằng motion recipe `staggerContainer` + `staggerItem` (gate `useReducedMotion()`).

### 10.4 `sync-indicator.tsx`

- 3 trạng thái: `host` (primary), `in-sync` (success), `catching-up` (warning).
- Chip nhỏ `rounded-sm`, text `text-xs`, token semantic.

### 10.5 `watch-lobby.tsx` — tạo/tham gia

- `Card` (glass mặc định) chứa `Form` + `Input` + `Button`.
- Hai hành động: "Tạo phòng" (chọn `sourceType` qua `Select`/`Tabs`, nhập `sourceRef`),
  "Tham gia" (nhập join code). Gọi Server Actions §9.
- Loading: `Skeleton`. Lỗi: toast qua `Toaster`.

### 10.6 `watch-room.tsx` — orchestrator

- `"use client"`. Nhận `room` (initial từ Server Component) + `userId`.
- `isHost = room.host_id === userId`.
- Ráp: `use-server-clock` → `use-room-channel` → `use-sync-controller` → render
  `SyncPlayer` + `RoomControls` + `ParticipantRail` + `SyncIndicator`.
- z‑index: player ở base; control bar floating dùng named z‑token nếu chồng layer khác.

### 10.7 Routes

- `apps/web/src/app/(app)/watch/page.tsx` — Server Component, render `<WatchLobby/>` (có shell).
- `apps/web/src/app/(watch)/watch/[roomId]/page.tsx` — immersive:
  - **Đọc `apps/web/src/app/(watch)/layout.tsx`** trước; tái dùng/điều chỉnh cho phòng
    (layout này vốn dựng cho trang xem cũ — sửa cho hợp, đừng để tham chiếu media chết).
  - Server Component: `requireUser()` → `getRoom(roomId)` → nếu null `notFound()` →
    truyền xuống `<WatchRoom room={...} userId={...}/>`.
  - **KHÔNG** `"use cache"`; route là live. Cân nhắc `export const dynamic` phù hợp.

**Acceptance Phase 5:** typecheck/lint xanh (ESLint màu pass); `/watch` mở được lobby;
`/watch/[roomId]` render phòng.

---

## 11. PHASE 6 — Nghiệm thu toàn cục & test

```sh
bun run ai:check
bun run lint
bun run typecheck
bun run test
bun run build
```

**Kiểm thử thủ công (2 trình duyệt / 2 tài khoản):**

1. Tài khoản A tạo phòng (YouTube id) → nhận join code.
2. Tài khoản B join bằng code → vào `/watch/[roomId]`.
3. A play/pause/seek → B đồng bộ trong dung sai (§7). B không điều khiển được (RLS + UI disabled).
4. B **reload giữa chừng** → đọc anchor từ DB → seek đúng vị trí hiện tại → tiếp tục sync.
5. Lặp lại với nguồn `url` (mp4/HLS) → dung sai chặt hơn.

**Test tự động tối thiểu (thuần, không cần mạng thật):**

- Unit cho toán anchor `expected = f(anchor, serverClock)` và bậc drift (deadband/nudge/hard‑seek).
- Unit cho sanitize URL/YouTube id trong actions.
- Validator schema tests cho `createRoomSchema` / `setSourceSchema`.

---

## 12. Bảo mật (P0 — không thoả hiệp)

- **RLS là ranh giới thật**: chỉ host UPDATE `watch_rooms` (đã đặt ở §5). UI disable chỉ là phụ.
- **Không secret xuống client**: chỉ dùng publishable key (browser Realtime). Không service‑role ở client.
- **URL bất kỳ**: render trong `<iframe sandbox>` + CSP nếu nhúng; chỉ cho scheme `http(s)`;
  cảnh giác SSRF nếu có lúc fetch server‑side (v1 không fetch).
- **YouTube ToS**: chỉ embed qua provider hợp lệ; không chặn ads / không tải về.
- `server-only` giữ nguyên trên mọi module server; hooks/components là client thuần.

---

## 13. Best‑practice hiệu năng (bám suốt khi code)

- **Broadcast cho live, DB debounced cho durable** — đừng ghi DB mỗi frame.
- **Followers không bao giờ ghi/emit.**
- **Refs cho giá trị tần suất cao**; chỉ state hoá giá trị thô cho UI → tránh re‑render.
- **Một** vòng `reconcile` 1000ms, không seek mỗi event; cờ chống feedback loop.
- **Deadband** để không "đánh nhau" với jitter (đặc biệt YouTube).
- Route phòng là **dynamic/live**, không `"use cache"`.
- Vidstack tải ở client; cân nhắc lazy cho khối player.

---

## 14. Thứ tự thực thi & cổng nghiệm thu

| Phase | Nội dung                       | Cổng (phải xanh trước khi sang phase sau)           |
| ----- | ------------------------------ | --------------------------------------------------- |
| 0     | Dọn Cinema                     | `typecheck` + `lint` + `build` + grep sạch jellyfin |
| 1     | DB `watch_rooms` + drop legacy | types có `watch_rooms`; `typecheck`                 |
| 2     | Validators + `/api/time`       | `typecheck`; route trả `{now}`                      |
| 3     | Realtime hooks                 | `typecheck`; không vỡ server/client boundary        |
| 4     | queries + actions              | `typecheck`; input đều validate                     |
| 5     | UI + routes                    | `lint` (màu) + `typecheck`; 2 route render          |
| 6     | Nghiệm thu                     | toàn bộ gate §11 xanh + smoke test 2 client         |

> **Mỗi phase là một commit độc lập, build được.** Không gộp Phase 0 với phần sau —
> dọn dẹp phải tự đứng vững để dễ revert nếu cần.
