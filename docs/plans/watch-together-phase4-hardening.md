# Kế hoạch Phase 4 — Gia cố Watch-Together (Resilience + Sync robustness)

> **Trạng thái:** Đã thực thi.
> **Bổ sung cho:** `docs/plans/watch-together-phase3-refactor.md` (Phase 3 đã thực thi — tầng dữ liệu/realtime/memoization đã chuẩn hóa). Phase 4 **không** thay kiến trúc Phase 3, chỉ khép kín các edge của vòng đời thực tế.
> **Tài liệu tham chiếu:** `AGENTS.md` (root), `apps/web/AGENTS.md`, `docs/conventions/data-fetching.md`, `docs/conventions/supabase-security.md`.
> **Mục tiêu:** Sửa 3 lỗ hổng 🔴 (queue trống cho người vào link, host rớt = phòng chết, autoplay YouTube chặn im lặng) + 2 🟡 (transfer host, unstable_instant) + dọn 🟢. Sau Phase 4 phòng phải **chịu được host rớt mạng, người vào bằng link, và trình duyệt chặn autoplay**.

---

## 0. Quy ước cho người thực thi (ĐỌC TRƯỚC)

- Mọi đường dẫn tính từ gốc repo `D:\Dev\web-os`.
- **KHÔNG** phá các bất biến ở §5. Đặc biệt: anchor chỉ host ghi, RLS host-only không nới, `leaveRoom` chỉ chạy trên hành động chủ ý.
- Làm **tuần tự Phase A → B → C → D → E → G → F** (F là kiểm thử cuối cùng; Phase G là robustness/UX bổ sung làm trước F). Mỗi phase có "Cổng nghiệm thu" — phải xanh mới sang phase sau.
- Lệnh kiểm thử (PowerShell, chạy ở gốc repo):
  - `bun run typecheck`
  - `bun run lint`
  - `bun run test`
  - `bun run build`
- React Compiler đang BẬT (`apps/web/next.config.ts:7`) → **không thêm** `useCallback`/`useMemo` mới (trừ `source` trong `sync-player.tsx` đã có, giữ nguyên).

---

## 1. Bảng quyết định (cách chọn & lý do)

| #   | Vấn đề                                                                     | Cách chọn                                                                                                                                                                                                                                             | Lý do / loại bỏ phương án khác                                                                                                                                                                                                              |
| :-- | :------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Queue trống cho người vào link                                             | **Join client robust**: `await` POST join → `invalidateQueries(room+queue)` → retry 3 lần → toast khi fail. Route trả 500 khi lỗi thật.                                                                                                               | Không đụng RLS (P0-safe). Bỏ phương án relax RLS (đưa xuống Phụ lục §3.G, cần chủ dự án duyệt). Bỏ "membership trong render" (vi phạm RSC purity).                                                                                          |
| 2   | Host rớt = phòng chết                                                      | **Manual claim + heartbeat DB riêng**: cột `host_heartbeat_at`, host bump mỗi 15s; RPC `claim_room_host` chỉ cho member claim khi heartbeat cũ > 30s **hoặc** host không còn là member. UI hiện banner "Nhận quyền" khi presence không có host > 10s. | Presence là ephemeral, DB không tự biết host rớt → cần heartbeat. Tách `host_heartbeat_at` khỏi `last_active_at` vì cột này bị member khác bump (add queue) → sẽ reset nhầm đồng hồ staleness. Bỏ auto-promote (dễ race, đổi host bất ngờ). |
| 3   | Autoplay YouTube chặn im lặng                                              | **Fallback nhiều tầng trong sync controller**: `play()` lỗi → tự `muted=true` rồi play lại → vẫn lỗi → bật cờ `needsGesture` → overlay "Bấm để xem".                                                                                                  | Muted autoplay luôn được trình duyệt cho phép → giữ đồng bộ. Bỏ prop `muted` controlled (khóa nút mute của user).                                                                                                                           |
| 4   | Transfer host: resubscribe + state lệch                                    | Bỏ `isHost` khỏi deps effect subscribe; track presence ở effect riêng; reset `syncStatus`/`isFollowingHost` khi đổi vai.                                                                                                                              | Tránh tear-down channel (presence nhấp nháy + mất broadcast).                                                                                                                                                                               |
| 5   | `unstable_instant` sample roomId rác                                       | Xóa export `unstable_instant` ở `(watch)/layout.tsx`.                                                                                                                                                                                                 | Route động bảo vệ-auth không prefetch tĩnh được bằng id giả → prefetch vô dụng/notFound.                                                                                                                                                    |
| 6   | Dọn dẹp 🟢                                                                 | Gỡ memo tay sót; xóa state `channel` chết; bỏ `revalidatePath` thừa; thêm `aria-live`.                                                                                                                                                                | Đồng bộ với mục tiêu React Compiler + sạch code.                                                                                                                                                                                            |
| 7   | `addQueueItem` race vị trí (2 người thêm cùng lúc đọc cùng max)            | Dùng `fractionalPosition(last, null)` + tiebreak `created_at` khi sort.                                                                                                                                                                               | Không vỡ nhưng tránh tie thứ tự; fix vài dòng.                                                                                                                                                                                              |
| 8   | `useRoomQuery` `.single()` throw khi phòng bị xóa                          | Đổi sang `.maybeSingle()`, null → giữ data cũ (trả `initialData`/last).                                                                                                                                                                               | Tránh query throw cứng khi host xóa phòng giữa chừng.                                                                                                                                                                                       |
| 9   | `suppressSeekedEventRef` kẹt `true` nếu hard-seek tới đúng vị trí hiện tại | So sánh khoảng cách trước khi set cờ; chỉ set khi thực sự seek.                                                                                                                                                                                       | Tránh nuốt nhầm seek thật kế tiếp của follower.                                                                                                                                                                                             |
| 10  | Host đóng tab trong 2s sau thao tác → anchor chưa persist                  | Flush `persistAnchor` ngay trên `pagehide` (host).                                                                                                                                                                                                    | Late-joiner nhận anchor mới nhất.                                                                                                                                                                                                           |
| 11  | `createSupabaseBrowserClient` tạo client mới mỗi lần gọi                   | Singleton trong `packages/supabase/src/browser.ts`.                                                                                                                                                                                                   | Tránh nhiều GoTrue/realtime instance; lợi cho toàn app. **Blast radius: shared package.**                                                                                                                                                   |
| 12  | Participant chỉ hiển thị raw `userId` (chưa có username/avatar)            | `useQuery` profiles theo danh sách userId từ presence, map vào rail/list.                                                                                                                                                                             | Mở rộng UX (đã "ngoài phạm vi" Phase 3 — nay đưa vào).                                                                                                                                                                                      |
| 13  | Không có chỉ báo "đang kết nối lại" khi realtime drop                      | Dùng callback `subscribe(status)` để xuất `channelStatus` → badge.                                                                                                                                                                                    | Người dùng biết khi mất kết nối.                                                                                                                                                                                                            |
| 14  | Video không có captions/track (a11y)                                       | N/A cho YouTube (tự có captions) / URL tùy ý (không có track). Ghi nhận, không làm.                                                                                                                                                                   | Không phải bug; YouTube xử lý nội bộ.                                                                                                                                                                                                       |

---

## 2. Bản đồ file thay đổi

```
supabase/migrations/
  011_watch_host_claim.sql              # MỚI: cột host_heartbeat_at + RPC claim_room_host

packages/supabase/src/
  types.ts                              # SỬA: thêm host_heartbeat_at (Row/Insert/Update) + Functions.claim_room_host
  browser.ts                            # SỬA (G11): singleton client (blast radius: shared package)

apps/web/src/features/watch/
  queries.ts                            # SỬA: ensureRoomMembership throw khi lỗi thật; thêm host_heartbeat_at vào SELECT getRoom
  actions.ts                            # SỬA: bỏ revalidatePath thừa; thêm action claimHost
  hooks/
    use-server-clock.ts                 # SỬA: gỡ useCallback
    use-room-channel.ts                 # SỬA: bỏ isHost khỏi deps subscribe; track ở effect riêng; xóa state channel; (G13) channelStatus
    use-room-query.ts                   # SỬA: thêm host_heartbeat_at vào SELECT; (A8) maybeSingle
    use-sync-controller.ts              # SỬA: reset state khi đổi vai; tryPlay fallback; (A9) suppress-flag; (G10) pagehide flush
    use-host-heartbeat.ts               # MỚI: host bump host_heartbeat_at mỗi 15s
    use-room-queue.ts                   # SỬA: thêm useClaimHost mutation
    use-room-members.ts                 # MỚI (G12): useQuery profiles theo userId
  components/
    sync-player.tsx                     # SỬA: gỡ useCallback onProviderChange (giữ useMemo source)
    sync-indicator.tsx                  # SỬA: thêm role="status" aria-live
    tap-to-play-overlay.tsx             # MỚI: overlay "Bấm để xem" khi needsGesture
    host-claim-banner.tsx               # MỚI: banner "Nhận quyền điều khiển"
    participant-rail.tsx                # SỬA (G12): hiển thị username/avatar từ profiles
    side-dock.tsx                       # SỬA (G12): hiển thị tên thật trong danh sách thành viên
    watch-room.tsx                      # SỬA: join robust; wire heartbeat, overlay, claim banner, channelStatus
  actions.ts                            # SỬA: bỏ revalidatePath thừa; thêm claimHost; (A7) fractionalPosition cho add

apps/web/src/app/api/watch/[roomId]/join/route.ts   # SỬA: trả 500 khi ensureRoomMembership lỗi

apps/web/src/app/(watch)/layout.tsx                  # SỬA: xóa unstable_instant
```

---

## 3. Chi tiết các Phase

### PHASE A — Dọn dẹp & rủi ro thấp (không đổi hành vi)

**A1. `apps/web/src/app/(watch)/layout.tsx`** — xóa toàn bộ block:

```ts
export const unstable_instant = {
  prefetch: 'static',
  samples: [{ params: { roomId: '00000000000000000000000000000000' } }],
};
```

(Xóa cả `export const unstable_instant ... };`. Giữ nguyên phần còn lại của file.)

**A2. `apps/web/src/features/watch/hooks/use-server-clock.ts`** — gỡ `useCallback`:

- Sửa import dòng 3: bỏ `useCallback` → `import { useEffect, useState, useRef } from "react";`
- Sửa dòng 55-57:

```ts
const serverClock = () => Date.now() + clockOffsetRef.current;
```

**A3. `apps/web/src/features/watch/components/sync-player.tsx`** — gỡ `useCallback` (GIỮ `useMemo`):

- Import dòng 3: `import { useMemo } from "react";`
- Sửa dòng 34-38:

```ts
const onProviderChange = (provider: MediaProviderAdapter | null) => {
  if (isHLSProvider(provider)) {
    provider.library = () => import('hls.js');
  }
};
```

**A4. `apps/web/src/features/watch/actions.ts`** — bỏ `revalidatePath` thừa:

- Trong `deleteRoom` xóa dòng `revalidatePath(\`/watch/${roomId}\`);`(giữ`revalidatePath("/watch");`).
- Trong `leaveRoom` xóa dòng `revalidatePath(\`/watch/${roomId}\`);`(giữ`revalidatePath("/watch");`).

**A5. `apps/web/src/features/watch/components/sync-indicator.tsx`** — thêm a11y. Sửa thẻ `<span ...>` ngoài cùng (dòng 29) thêm thuộc tính:

```tsx
    <span
      role="status"
      aria-live="polite"
      className={cn(
```

**A6. `apps/web/src/features/watch/hooks/use-room-channel.ts`** — xóa state `channel` chết:

- Xóa dòng 19: `const [channel, setChannel] = useState<RealtimeChannel | null>(null);`
- Xóa dòng 48-50 (`setTimeout(() => { setChannel(activeChannel); }, 0);`).
- Trong cleanup (dòng 134-138) xóa `setChannel(null);`.
- Trong return (dòng 151-155) xóa `channel,`.
- Bỏ `useState` khỏi import nếu không còn dùng — **CHÚ Ý:** `participants` vẫn dùng `useState`, nên GIỮ `useState` trong import.

**A7. `apps/web/src/features/watch/actions.ts`** — `addQueueItem` chống race vị trí.

- Import thêm `fractionalPosition` (đã import sẵn `extractYouTubeId, isValidHttpUrl, fractionalPosition` ở dòng 18 — KHÔNG cần đổi import).
- Thay tính `newPosition` (dòng 300) — dùng append qua fractional (gap thưa, giảm tie):

```ts
const newPosition = maxItem ? fractionalPosition(maxItem.position, null) : 0.0;
```

> `fractionalPosition(before, null)` trả `before + 1.0` — tương đương cũ nhưng nhất quán helper. (Race thật chỉ gây tie thứ tự, không vỡ; tiebreak `created_at` xử lý ở A8/B của query sort — xem A8.)

Ngoài ra, để tie luôn ổn định, thêm tiebreak `created_at` vào order của **getQueue** (`queries.ts:51`) và **useQueueQuery** (`use-room-queue.ts:25`):

```ts
.order("position", { ascending: true })
.order("created_at", { ascending: true })
```

**A8. `apps/web/src/features/watch/hooks/use-room-query.ts`** — `.maybeSingle()` thay `.single()`.

- Sửa dòng 17: `.maybeSingle();`
- Sửa khối xử lý (dòng 19-23):

```ts
if (error) {
  throw error;
}
// Room may have been deleted by host mid-session: keep last known data
// instead of throwing a hard error.
return (data ?? initialData) as Room;
```

**A9. `apps/web/src/features/watch/hooks/use-sync-controller.ts`** — vá `suppressSeekedEventRef` kẹt.
Vấn đề: nếu hard-seek tới đúng vị trí hiện tại, `seeked` không fire → cờ kẹt `true` → nuốt nhầm seek thật kế tiếp. Chỉ set cờ khi thực sự dịch chuyển.

- Trong `reconcile`, nhánh hard-seek (dòng 137-143) sửa:

```ts
    } else {
      // Hard jump to the expected position
      if (Math.abs(player.currentTime - expected) > 0.01) {
        suppressSeekedEventRef.current = true;
        player.currentTime = expected;
      }
      player.playbackRate = anchor.playbackRate;
      setSyncStatus("catching-up");
    }
```

- Trong `resync` (dòng 173-176) sửa tương tự:

```ts
const expected = calculateExpectedPosition(anchor, serverClock());
if (Math.abs(player.currentTime - expected) > 0.01) {
  suppressSeekedEventRef.current = true;
  player.currentTime = expected;
}
player.playbackRate = anchor.playbackRate;
```

> **Cổng nghiệm thu A:** `bun run typecheck` + `bun run lint` + `bun run test` xanh. Phòng vẫn chạy như cũ (smoke nhanh 1 tab). Thêm/sắp xếp queue vẫn đúng thứ tự.

---

### PHASE B — Transfer host không tear-down channel + reset state

**B1. `apps/web/src/features/watch/hooks/use-room-channel.ts`**

Thêm ref ổn định cho `isHost` và `joinedAt`, đặt ngay sau `channelRef` (dòng 20):

```ts
const isHostRef = useRef(isHost);
const joinedAtRef = useRef(Date.now());
useEffect(() => {
  isHostRef.current = isHost;
}, [isHost]);
```

Trong `.subscribe` (dòng 124-132) đổi `track` dùng ref:

```ts
activeChannel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await activeChannel.track({
      userId,
      isHost: isHostRef.current,
      joinedAt: joinedAtRef.current,
    });
  }
});
```

Đổi dependency array của effect subscribe (dòng 139) — **bỏ `isHost`**:

```ts
  }, [room.id, userId, queryClient]);
```

Thêm effect re-track khi đổi vai (đặt SAU effect subscribe, trước `broadcastAnchor`):

```ts
// Re-track presence when host role flips WITHOUT tearing down the channel.
useEffect(() => {
  const ch = channelRef.current;
  if (ch && ch.state === 'joined') {
    void ch.track({ userId, isHost, joinedAt: joinedAtRef.current });
  }
}, [isHost, userId]);
```

**B2. `apps/web/src/features/watch/hooks/use-sync-controller.ts`**

Thêm effect reset khi `isHost` đổi (đặt sau effect cleanup timer, ~dòng 49):

```ts
// Reset sync UI state when host role changes (e.g. transfer / claim).
useEffect(() => {
  isFollowingHostRef.current = true;
  setIsFollowingHost(true);
  setSyncStatus(isHost ? 'host' : 'in-sync');
}, [isHost]);
```

> **Cổng nghiệm thu B:** 2 trình duyệt, A host + B follower. A bấm "Chuyển Host" cho B → B đổi sang badge "Host", A đổi sang "Đồng bộ". Presence **không** nhấp nháy (số người xem không tụt rồi tăng lại). Broadcast play/pause vẫn hoạt động ngay sau chuyển.

---

### PHASE C — Join phòng robust (sửa queue trống cho người vào link)

**C1. `apps/web/src/features/watch/queries.ts`** — `ensureRoomMembership` ném lỗi thật để route biết:

- Sửa dòng 21-23:

```ts
if (error && error.code !== '23505') {
  console.error('Failed to ensure room membership:', error.message);
  throw new Error(error.message);
}
```

- Thêm `host_heartbeat_at` vào SELECT của `getRoom` (dòng 32) — **bắt buộc** vì Phase E thêm cột vào type Row:

```ts
    .select("id, code, host_id, source_type, source_ref, is_playing, anchor_position, anchor_server_ts, playback_rate, created_at, updated_at, current_queue_item_id, last_active_at, host_heartbeat_at")
```

> Nếu chưa làm Phase E (chưa có cột), tạm BỎ qua phần thêm `host_heartbeat_at` ở đây và làm cùng Phase E. Khuyến nghị làm Phase E trước C nếu muốn liền mạch — nhưng C độc lập được nếu bỏ chỉnh SELECT này.

**C2. `apps/web/src/app/api/watch/[roomId]/join/route.ts`** — trả 500 khi lỗi:

```ts
import { NextRequest } from 'next/server';
import { ensureRoomMembership } from '@/features/watch/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;
  try {
    await ensureRoomMembership(roomId);
    return Response.json({ ok: true });
  } catch (err) {
    console.error('join route failed', err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
```

**C3. `apps/web/src/features/watch/components/watch-room.tsx`** — join robust + invalidate + retry.
Thay block effect dòng 63-67:

```tsx
// 1. Join room membership on mount, then refetch member-gated data.
// RSC render cannot INSERT, so membership is registered client-side; the
// queue is RLS-gated on membership, so we MUST invalidate after joining or a
// link-joiner sees an empty queue until staleTime expires.
useEffect(() => {
  let cancelled = false;
  async function join(attempt = 0) {
    try {
      const res = await fetch(`/api/watch/${room.id}/join`, { method: 'POST' });
      if (!res.ok) throw new Error(`join failed: ${res.status}`);
      if (cancelled) return;
      await queryClient.invalidateQueries({ queryKey: watchKeys.queue(room.id) });
      await queryClient.invalidateQueries({ queryKey: watchKeys.room(room.id) });
    } catch (err) {
      if (cancelled) return;
      if (attempt < 3) {
        setTimeout(() => void join(attempt + 1), 1000 * (attempt + 1));
      } else {
        console.error('Failed to join room after retries', err);
        toast.error(
          'Không thể tham gia phòng. Một số thao tác có thể bị hạn chế — hãy tải lại trang.',
        );
      }
    }
  }
  void join();
  return () => {
    cancelled = true;
  };
}, [room.id, queryClient]);
```

(`toast`, `queryClient`, `watchKeys` đã được import sẵn trong file.)

> **Cổng nghiệm thu C:** Trình duyệt B vào phòng bằng **link trực tiếp** (chưa từng join) → thấy hàng chờ **đầy đủ ngay** (trong ~1-2s sau load, không cần F5). Thử thêm video từ B → thành công (RLS insert qua vì đã là member). Devtools Network: có 1 POST `/join` 200 + refetch queue.

---

### PHASE D — Autoplay robust (muted-fallback + tap-to-play)

**D1. `apps/web/src/features/watch/hooks/use-sync-controller.ts`**

Thêm state/ref `needsGesture` (đặt cạnh `isFollowingHost`, ~dòng 21):

```ts
const [needsGesture, setNeedsGesture] = useState(false);
const needsGestureRef = useRef(false);
```

Thêm helper `tryPlay` (đặt trước `reconcile`, ~dòng 98):

```ts
// Robust play: browsers block unmuted autoplay without a user gesture.
// Fall back to muted autoplay (always allowed); if even that fails, surface
// a tap-to-play overlay via needsGesture.
const tryPlay = (player: MediaPlayerInstance) => {
  player.play().catch(() => {
    player.muted = true;
    player.play().catch(() => {
      needsGestureRef.current = true;
      setNeedsGesture(true);
    });
  });
};
```

Thay **mọi** chỗ `player.play().catch(() => {})` bằng `tryPlay(player)`:

- trong `reconcile` (dòng 112): `tryPlay(player);`
- trong `resync` (dòng 179): `tryPlay(player);`

Thêm hàm `resumeFromGesture` (sau `resync`, ~dòng 183):

```ts
// Called from the tap-to-play overlay (a real user gesture).
const resumeFromGesture = () => {
  needsGestureRef.current = false;
  setNeedsGesture(false);
  const player = playerRef.current;
  if (player) player.muted = false;
  resync();
};
```

Bổ sung vào return (dòng 237-248):

```ts
return {
  syncStatus,
  isFollowingHost,
  needsGesture,
  resync,
  resumeFromGesture,
  handleReceiveAnchor,
  playerHandlers: {
    onPlay: handlePlay,
    onPause: handlePause,
    onRateChange: handleRateChange,
    onSeeked: handleSeeked,
  },
};
```

**D2. `apps/web/src/features/watch/components/tap-to-play-overlay.tsx`** — MỚI:

```tsx
'use client';

import { Button } from '@pumni/ui';
import { Play } from 'lucide-react';

interface TapToPlayOverlayProps {
  onResume: () => void;
}

export function TapToPlayOverlay({ onResume }: TapToPlayOverlayProps) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm select-none">
      <p className="text-sm font-medium text-white/90">Trình duyệt đã chặn tự động phát.</p>
      <Button onClick={onResume} size="lg" className="gap-2">
        <Play className="size-5 fill-current" />
        Bấm để xem cùng phòng
      </Button>
    </div>
  );
}
```

**D3. `apps/web/src/features/watch/components/watch-room.tsx`** — wire overlay.

- Lấy thêm `needsGesture, resumeFromGesture` từ `useSyncController` (dòng 90):

```tsx
  const { syncStatus, isFollowingHost, needsGesture, resync, resumeFromGesture, handleReceiveAnchor, playerHandlers } = useSyncController(
```

- Import overlay ở đầu file: `import { TapToPlayOverlay } from "./tap-to-play-overlay";`
- Thêm overlay làm child của `<SyncPlayer>` (sau `<RoomControls .../>`, dòng 226):

```tsx
<RoomControls
  isHost={isHost}
  onSourceChange={() => setIsSourceModalOpen(true)}
  isFollowingHost={isFollowingHost}
  resync={resync}
/>;
{
  needsGesture && <TapToPlayOverlay onResume={resumeFromGesture} />;
}
```

> **Cổng nghiệm thu D:** Follower B (chưa tương tác trang) khi host phát YouTube → video **tự phát** (có thể bị tắt tiếng — đúng kỳ vọng), badge mute hiện ở control bar. Trường hợp trình duyệt chặn cả muted → hiện overlay "Bấm để xem", bấm vào → bắt kịp host và bật tiếng.

---

### PHASE E — Host claim (sửa "host rớt = phòng chết")

**E1. `supabase/migrations/011_watch_host_claim.sql`** — MỚI:

```sql
-- 1. Heartbeat riêng cho host-liveness (TÁCH khỏi last_active_at vốn bị
--    member khác bump khi thao tác queue).
alter table public.watch_rooms
  add column host_heartbeat_at timestamptz not null default now();

-- 2. RPC cho thành viên "nhận quyền chủ phòng" khi host vắng mặt.
--    Chỉ cho phép khi heartbeat của host cũ hơn 30s HOẶC host không còn là
--    thành viên. Atomic: người claim đầu tiên bump heartbeat → các claim sau
--    thấy heartbeat mới → bị từ chối.
create or replace function public.claim_room_host(p_room_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_grace interval := interval '30 seconds';
begin
  if not public.is_room_member(p_room_id) then
    raise exception 'Chỉ thành viên trong phòng mới có thể nhận quyền chủ phòng';
  end if;

  if not exists (
    select 1 from public.watch_rooms r
    where r.id = p_room_id
      and (
        r.host_heartbeat_at < now() - v_grace
        or not exists (
          select 1 from public.room_members m
          where m.room_id = r.id and m.user_id = r.host_id
        )
      )
  ) then
    raise exception 'Chủ phòng hiện tại vẫn đang hoạt động';
  end if;

  update public.watch_rooms
  set host_id = (select auth.uid()),
      host_heartbeat_at = now(),
      updated_at = now()
  where id = p_room_id;
end;
$$;

revoke all on function public.claim_room_host(uuid) from public, anon;
grant execute on function public.claim_room_host(uuid) to authenticated;
```

Áp migration vào DB local (theo quy trình supabase của dự án, ví dụ `supabase db reset` hoặc apply migration).

**E2. `packages/supabase/src/types.ts`** — cập nhật type tay (file này không có script gen trong repo):

- Trong `watch_rooms.Row` (sau dòng `last_active_at: string` ~135) thêm: `host_heartbeat_at: string`
- Trong `watch_rooms.Insert` (sau `last_active_at?: string` ~150) thêm: `host_heartbeat_at?: string`
- Trong `watch_rooms.Update` (sau `last_active_at?: string` ~165) thêm: `host_heartbeat_at?: string`
- Trong khối `Functions:` (sau `transfer_room_host` ~243) thêm:

```ts
claim_room_host: {
  Args: {
    p_room_id: string;
  }
  Returns: undefined;
}
```

**E3. `apps/web/src/features/watch/hooks/use-room-query.ts`** — thêm cột vào SELECT (dòng 15):

```ts
        .select("id, code, host_id, source_type, source_ref, is_playing, anchor_position, anchor_server_ts, playback_rate, created_at, updated_at, current_queue_item_id, last_active_at, host_heartbeat_at")
```

(Và `getRoom` trong `queries.ts` — đã làm ở C1; nếu C làm trước E thì quay lại thêm `host_heartbeat_at` vào SELECT của `getRoom` lúc này.)

**E4. `apps/web/src/features/watch/hooks/use-host-heartbeat.ts`** — MỚI:

```ts
'use client';

import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';

// Host-only liveness heartbeat. Lets `claim_room_host` detect a dropped host.
// Updates only `host_heartbeat_at` → structural signature unchanged → no
// invalidate storm on followers.
export function useHostHeartbeat(roomId: string, isHost: boolean) {
  useEffect(() => {
    if (!isHost) return;
    const supabase = createSupabaseBrowserClient();
    const beat = () => {
      void supabase
        .from('watch_rooms')
        .update({ host_heartbeat_at: new Date().toISOString() })
        .eq('id', roomId);
    };
    beat();
    const interval = setInterval(beat, 15_000);
    return () => clearInterval(interval);
  }, [roomId, isHost]);
}
```

**E5. `apps/web/src/features/watch/actions.ts`** — thêm action `claimHost` (cuối file):

```ts
/** Member action to claim host when the current host is gone (gated server-side). */
export async function claimHost(roomId: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('claim_room_host', { p_room_id: roomId });
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, data: undefined };
}
```

**E6. `apps/web/src/features/watch/hooks/use-room-queue.ts`** — thêm mutation `useClaimHost`:

- Thêm `claimHost` vào import từ `../actions` (dòng 6-12).
- Cuối file thêm:

```ts
export function useClaimHost(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await claimHost(roomId);
      if (!res.ok) {
        throw new Error(res.message);
      }
      return res;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: watchKeys.room(roomId) });
    },
  });
}
```

**E7. `apps/web/src/features/watch/components/host-claim-banner.tsx`** — MỚI:

```tsx
'use client';

import { Button } from '@pumni/ui';
import { Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useClaimHost } from '../hooks/use-room-queue';

interface HostClaimBannerProps {
  roomId: string;
}

export function HostClaimBanner({ roomId }: HostClaimBannerProps) {
  const claim = useClaimHost(roomId);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-xs text-warning select-none">
      <span>Phòng hiện không có chủ điều khiển.</span>
      <Button
        size="sm"
        variant="ghost"
        disabled={claim.isPending}
        onClick={() =>
          claim.mutate(undefined, {
            onSuccess: () => toast.success('Bạn đã trở thành chủ phòng!'),
            onError: (err) => toast.error(err.message || 'Nhận quyền thất bại.'),
          })
        }
        className="h-7 border border-warning/30 px-2.5 text-[10px] font-semibold text-warning hover:bg-warning/15"
      >
        <Crown className="mr-1 size-3" />
        Nhận quyền điều khiển
      </Button>
    </div>
  );
}
```

**E8. `apps/web/src/features/watch/components/watch-room.tsx`** — wire heartbeat + banner:

- Import: `import { useHostHeartbeat } from "../hooks/use-host-heartbeat";` và `import { HostClaimBanner } from "./host-claim-banner";`
- Sau khi có `isHost` (dòng 76) thêm:

```tsx
useHostHeartbeat(currentRoom.id, isHost);
```

- Thêm state phát hiện host vắng (sau `useHostHeartbeat`):

```tsx
const hostPresent = participants.some((p) => p.isHost);
const [showClaim, setShowClaim] = useState(false);
useEffect(() => {
  if (isHost || hostPresent) {
    setShowClaim(false);
    return;
  }
  const t = setTimeout(() => setShowClaim(true), 10_000);
  return () => clearTimeout(t);
}, [isHost, hostPresent]);
```

> **Lưu ý thứ tự:** khối này phải đặt SAU `useRoomChannel` (vì cần `participants`) và SAU `isHost`. `participants` từ `useRoomChannel` (dòng 82). Đặt khối này ngay trước `handleLeave`.

- Render banner ngay đầu phần JSX trả về, dưới Top Header Bar (sau `</div>` đóng header ~dòng 209, trước "Main Zones Layout"):

```tsx
{
  showClaim && !isHost && <HostClaimBanner roomId={currentRoom.id} />;
}
```

> **Cổng nghiệm thu E:** 2 trình duyệt. A host phát video, B follower đồng bộ. **Đóng hẳn tab A** (mô phỏng host rớt). Sau ~10s B thấy banner "Phòng hiện không có chủ"; bấm "Nhận quyền" → trong vòng vài giây (≤30s grace) B trở thành host (badge "Host", điều khiển hoạt động). Mở lại A vào cùng phòng → A giờ là follower. Devtools: heartbeat update mỗi 15s **không** gây refetch room ở follower (signature không đổi).

---

### PHASE G — Hoàn thiện bổ sung (robustness + UX) — làm TRƯỚC Phase F

**G10. Flush anchor khi host đóng tab (`use-sync-controller.ts`).**
Host đóng tab trong 2s sau thao tác → `debouncedPersist` chưa chạy → late-joiner nhận anchor cũ. Ghi ngay (bỏ debounce) trên `pagehide`.

- Thêm effect (đặt sau effect cleanup timer, ~dòng 49):

```ts
// Flush the latest anchor immediately when the host leaves, bypassing the
// 2s debounce, so a late-joiner doesn't inherit a stale anchor.
useEffect(() => {
  if (!isHost) return;
  const flush = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    persistAnchor(anchorRef.current);
  };
  window.addEventListener('pagehide', flush);
  return () => window.removeEventListener('pagehide', flush);
}, [isHost]);
```

> `persistAnchor` đã khai báo phía trên trong hook nên dùng được. KHÔNG đổi `leaveRoom` (vẫn chỉ chạy trên hành động chủ ý) — đây chỉ ghi anchor, không xóa membership.

**G11. Singleton browser client (`packages/supabase/src/browser.ts`).**

> ⚠️ **Blast radius: shared package** — ảnh hưởng toàn app. Chạy `bun run typecheck` + `bun run build` cho cả repo sau khi sửa.
> Hiện mỗi lần gọi tạo client mới → nhiều instance GoTrue/realtime. Cache 1 instance ở module scope:

```ts
import { createBrowserClient } from '@supabase/ssr';
import { clientEnv } from '@pumni/env/client';
import type { Database } from './types';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  return browserClient;
}
```

> Giữ nguyên chữ ký hàm → mọi nơi gọi không cần đổi. (Singleton chỉ ở browser — không áp dụng cho server client vì server có request scope.)

**G12. Hiển thị username/avatar thật cho participant.**
Presence chỉ mang `userId`. Fetch profiles theo danh sách id để hiển thị tên/avatar thật.

G12.1 — `apps/web/src/features/watch/hooks/use-room-members.ts` (MỚI):

```ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';

export interface MemberProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export function useMemberProfiles(userIds: string[]) {
  const sorted = [...new Set(userIds)].sort();
  return useQuery({
    queryKey: ['watch', 'profiles', sorted],
    enabled: sorted.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', sorted);
      if (error) throw error;
      const map: Record<string, MemberProfile> = {};
      for (const p of (data ?? []) as MemberProfile[]) map[p.id] = p;
      return map;
    },
  });
}
```

> **KIỂM TRA TRƯỚC:** xác nhận bảng `profiles` có cột `id, username, avatar_url` và RLS cho phép authenticated đọc (xem `packages/supabase/src/types.ts` + migration profiles). Nếu tên cột khác → chỉnh cho khớp. Nếu RLS không cho đọc profile người khác → bỏ G12 (giữ hiển thị id rút gọn) hoặc xin chủ dự án nới đọc profile công khai.

G12.2 — `participant-rail.tsx`: nhận thêm prop map profiles, đổi `AvatarFallback`/tooltip dùng `username` và `<AvatarImage src={avatar_url}/>` khi có. `side-dock.tsx`: trong danh sách thành viên (dòng 88-93) thay `p.userId.slice(...)` bằng `profile?.username ?? \`User: ${p.userId.slice(0,8)}\``. `watch-room.tsx`: gọi `useMemberProfiles(participants.map(p=>p.userId))`và truyền map xuống`SideDock`.

> Đây là mở rộng UX — nếu muốn giữ Phase 4 gọn, có thể tách G12 thành PR riêng. Đánh dấu **[TÙY CHỌN]**.

**G13. Chỉ báo "đang kết nối lại" khi realtime drop (`use-room-channel.ts` + UI).**

- Thêm state `channelStatus`:

```ts
const [channelStatus, setChannelStatus] = useState<'connecting' | 'connected' | 'disconnected'>(
  'connecting',
);
```

- Trong `.subscribe` callback, set theo status Supabase:

```ts
activeChannel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    setChannelStatus('connected');
    await activeChannel.track({ userId, isHost: isHostRef.current, joinedAt: joinedAtRef.current });
  } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
    setChannelStatus('disconnected');
  }
});
```

- Return thêm `channelStatus`. Trong `watch-room.tsx` lấy `channelStatus` từ `useRoomChannel`, hiển thị badge nhỏ cạnh `SyncIndicator` khi `!== "connected"` (ví dụ "Đang kết nối lại…", có `role="status" aria-live="polite"`).
  > Supabase tự reconnect; đây chỉ là chỉ báo trực quan. Đánh dấu **[TÙY CHỌN]**.

**G14. Captions/track — KHÔNG làm (ghi nhận).**
YouTube tự cung cấp caption qua provider; URL trực tiếp tùy ý không có track chuẩn. Không phải bug. Nếu sau này thêm nguồn có phụ đề → mở feature riêng với `<Track>` của Vidstack.

> **Cổng nghiệm thu G:** `bun run typecheck` + `bun run lint` + `bun run build` (toàn repo, vì G11 chạm shared package) xanh. Host đóng tab → late-joiner thấy đúng vị trí (G10). Tên/avatar thật hiển thị nếu bật G12. Ngắt mạng tạm → badge "đang kết nối lại" rồi tự hồi (G13).

---

### PHASE F — Kiểm thử & dọn tài liệu

**F1. Unit test** (`apps/web/src/test/features/watch-sync.test.ts`): các test hiện có vẫn phải xanh. (Logic claim là SQL — kiểm thử ở smoke 2-trình-duyệt, không unit test được.)

**F2. Smoke 2 trình duyệt** (A=host, B=follower) — chạy đủ kịch bản:

1. B vào bằng **link** → queue đầy đủ ngay (Phase C).
2. A play/pause/seek → B đồng bộ; **B không refetch room** (chỉ broadcast) (Phase 3 guard còn nguyên).
3. B tự seek → soft-lock banner → "Đồng bộ lại" bắt kịp.
4. YouTube: B (chưa tương tác) tự phát muted; nếu bị chặn → overlay tap-to-play (Phase D).
5. A "Chuyển Host" cho B → không nhấp nháy presence; state badge đúng (Phase B).
6. **Đóng tab A** → sau 10s B thấy banner claim → nhận quyền OK (Phase E).
7. **Late-join sau khi host vừa play 1s rồi đóng tab** → người vào sau nhận đúng vị trí (G10 flush).
8. Ngắt mạng B vài giây → badge "đang kết nối lại" → tự hồi (G13, nếu bật). Tên/avatar thật hiển thị (G12, nếu bật).
9. Cả hai rời → delete-on-empty.

**F3. Devtools (React Query)**: không có vòng lặp invalidate; heartbeat 15s và host play/pause **không** refetch room.

**F4. Tài liệu**: thêm dòng đầu file này "Trạng thái: Đã thực thi" khi xong; ghi chú Phase 3 vẫn còn hiệu lực (Phase 4 là bổ sung).

> **Cổng nghiệm thu cuối:** `bun run ai:check` + `bun run lint` + `bun run typecheck` + `bun run test` + `bun run build` đều xanh; smoke F2 đủ 7 bước.

---

## 4. Rủi ro & khắc phục

| Rủi ro                                                                                   | Khắc phục                                                                                              |
| :--------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| Quên thêm `host_heartbeat_at` vào SELECT → typecheck đỏ (Row có field nhưng query thiếu) | E3 + C1 thêm cột vào cả `use-room-query.ts` và `queries.ts`. Làm Phase E trước C nếu muốn liền mạch.   |
| `claim_room_host` bị lạm dụng (member claim khi host vẫn online)                         | Cổng staleness 30s + heartbeat 15s phía DB; UI chỉ là trigger, không phải authorization.               |
| Heartbeat gây invalidate storm                                                           | `host_heartbeat_at` KHÔNG nằm trong structural-signature → guard Phase 3 bỏ qua. Bắt buộc kiểm tra F3. |
| muted-autoplay làm user mất tiếng bất ngờ                                                | Có badge/nút bật tiếng sẵn ở control bar + overlay tap-to-play bật tiếng khi bấm.                      |
| Re-track presence (Phase B) trùng với subscribe ban đầu                                  | `joinedAtRef` ổn định → track cùng `joinedAt` → presence cập nhật tại chỗ, không tạo entry mới.        |
| Migration chưa áp DB local → RPC 404                                                     | Áp `011_*` trước khi test Phase E.                                                                     |
| G11 singleton chạm shared package → ảnh hưởng app khác                                   | Giữ nguyên chữ ký hàm; chạy `bun run build` + `bun run typecheck` TOÀN repo sau G11.                   |
| G12 bảng/RLS `profiles` không cho đọc người khác                                         | Kiểm tra schema + RLS trước; nếu không → bỏ G12, giữ id rút gọn (đánh dấu [TÙY CHỌN]).                 |
| G13 đọc sai enum status của Supabase realtime                                            | Dùng đúng chuỗi `SUBSCRIBED`/`CHANNEL_ERROR`/`TIMED_OUT`/`CLOSED`.                                     |

## 5. Bất biến tuyệt đối (KHÔNG phá)

- Anchor chỉ host ghi, qua RLS `watch_rooms_update_host`. Heartbeat cũng là host ghi qua đúng policy đó — **không** dùng service-role, **không** nới RLS.
- `claim_room_host` là `SECURITY DEFINER` có cổng staleness — không hạ điều kiện kiểm tra.
- `"server-only"` trên `queries.ts`; không import server/secret vào client.
- Một channel duy nhất `room:{roomId}` cho Broadcast + Presence + postgres_changes.
- `leaveRoom` chỉ chạy trên hành động chủ ý (không unmount/`beforeunload`).
- Refs cho dữ liệu tần suất cao (anchor) — không đẩy vào React state.
- Structural-signature guard giữ nguyên (Phase 3).

## 6. Checklist thực thi nhanh

- [ ] A1–A9 (cleanup + 3 fix nhỏ: position race, maybeSingle, suppress-flag) → typecheck/lint/test xanh
- [ ] B1–B2 (transfer host) → cổng B
- [ ] C1–C3 (join robust) → cổng C
- [ ] D1–D3 (autoplay) → cổng D
- [ ] E1–E8 (host claim) → áp migration → cổng E
- [ ] G10–G14 (pagehide flush, singleton client, [tùy chọn] profiles/reconnect-badge) → cổng G
- [ ] F1–F4 → gate cuối toàn bộ xanh

---

## §3.G — PHỤ LỤC (TÙY CHỌN, CẦN CHỦ DỰ ÁN DUYỆT): relax RLS đọc queue

Hiện `watch_queue_select` (`009:18-19`) gate đọc trên `is_room_member`. Vì phòng là "link-shared, không bí mật" (giống `watch_rooms` đã `using(true)`), có thể nới đọc queue để **xóa hoàn toàn race đọc** + cho realtime queue tới cả người chưa join. **INSERT/UPDATE/DELETE vẫn gate membership.**

> ⚠️ Đây là **thay đổi chính sách bảo mật** (P0). Chỉ làm khi chủ dự án đồng ý. Nếu áp dụng, Phase C vẫn cần (để có quyền _ghi_ queue).

```sql
-- 012_relax_watch_queue_read.sql (CHỈ khi được duyệt)
drop policy "watch_queue_select" on public.watch_queue_items;
create policy "watch_queue_select" on public.watch_queue_items
  for select to authenticated using (auth.uid() is not null);
```
