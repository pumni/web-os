# Kế hoạch Phase 5 — Gia cố Watch-Together v2 (Sync-fix · Resilience · Scale · UX/A11y)

> **Trạng thái:** Đề xuất — chờ thực thi.
> **Bổ sung cho:** `docs/plans/watch-together-phase4-hardening.md` (Phase 4 đã thực thi). Phase 5 **không** thay kiến trúc Phase 3/4; nó sửa các bug đã xác nhận ở runtime + khép các lỗ resilience/scale/A11y còn lại.
> **Tài liệu tham chiếu:** `AGENTS.md` (root), `apps/web/AGENTS.md`, `docs/conventions/data-fetching.md`, `docs/conventions/supabase-security.md`, `docs/conventions/design-system.md`.
> **Mục tiêu:** Sau Phase 5, follower **bám đúng host** (đang vỡ hoàn toàn), reorder playlist **hoạt động**, tên/avatar người khác **hiển thị**, phòng **chịu được reconnect + Supabase Free** và đạt A11y cơ bản.
> **Tiếp nối:** Phase 6 (`watch-together-phase6-features.md`) chạy **ngay sau** Phase 5, trên nền đã gia cố.

---

## 0. Quy ước cho người thực thi (ĐỌC TRƯỚC)

- Mọi đường dẫn tính từ gốc repo `D:\Dev\web-os`.
- **KHÔNG phá các bất biến §6.** Đặc biệt: anchor/heartbeat chỉ host ghi qua RLS `watch_rooms_update_host`; RPC `SECURITY DEFINER` giữ `revoke from public, anon`; `leaveRoom` chỉ chạy trên hành động chủ ý; một channel `room:{id}` duy nhất.
- React Compiler **đang BẬT** (`apps/web/next.config.ts:7`) → **không thêm** `useCallback/useMemo` mới (trừ `source` useMemo đã có trong `sync-player.tsx`).
- Làm **tuần tự A → B → C → D → E**. Mỗi phase có "Cổng nghiệm thu" — phải xanh mới sang phase sau.
- Lệnh kiểm thử (PowerShell, gốc repo): `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build`.
- Stack thực tế: Next.js **16.2.9**, React **19.2.4**, `@vidstack/react` **1.15.6**, `@supabase/supabase-js` **2.108**, `@tanstack/react-query` **5.101**.

---

## 1. Ba phát hiện đã xác nhận (lý do tồn tại Phase 5)

| #         | Triệu chứng                                                                                                                                                    | Nguyên nhân gốc (đã truy trong code)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Cách xác nhận                |
| :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------- |
| 🔴 **B1** | Follower **không bao giờ bám host**: A play → B hiện banner _"Bạn đang xem lệch tiến trình phát của phòng"_ và đứng yên; A seek/pause/play → B không phản ứng. | `use-sync-controller.ts`: `reconcile()`/`resync()` gọi **programmatic** `player.play()/pause()/currentTime=` → Vidstack phát event `play/pause/seeked` → handler `handlePlay/handlePause/handleSeeked` khai báo `() => void` (**bỏ qua event**) → nhánh follower gọi `handleFollowerManualInteraction()` → `isFollowingHostRef=false`. `suppressSeekedEventRef` chỉ chặn _seek_, không chặn _play/pause_. Sau khi unfollow, `handleReceiveAnchor` có guard `isFollowingHostRef` nên broadcast kế tiếp **không** reconcile → kẹt. | Test 2 trình duyệt (đã chạy) |
| 🔴 **B2** | **Reorder playlist không đổi thứ tự** (ấn ▲/▼ có hiệu ứng nút nhưng item không di chuyển).                                                                     | `playlist-panel.tsx`: `handleMoveUp/handleMoveDown` **truyền ngược** `beforeId`/`afterId`. Khi list ít item hoặc đẩy lên-đầu/xuống-cuối, `fractionalPosition` rơi nhánh `null` bất đối xứng → vị trí mới = vị trí cũ → optimistic nhảy nhẹ rồi `onSettled` refetch trả thứ tự cũ.                                                                                                                                                                                                                                                | Test 2 trình duyệt (đã chạy) |
| 🟠 **B3** | **Tên/avatar người khác không hiện** (chỉ thấy `User: xxxxxxxx`).                                                                                              | RLS `profiles_select_own` (`supabase/migrations/001_initial_profiles.sql:18-22`) chỉ cho `auth.uid() = id`. `use-room-members.ts` `.from("profiles").select(...).in("id", [nhiều id])` → chỉ trả về dòng của chính người gọi.                                                                                                                                                                                                                                                                                                    | Đọc RLS (xác nhận tĩnh)      |

---

## 2. Bản đồ file thay đổi

```
supabase/migrations/
  012_public_profiles_rpc.sql            # MỚI: RPC get_public_profiles(uuid[]) SECURITY DEFINER

packages/supabase/src/
  types.ts                               # SỬA: thêm Functions.get_public_profiles (gen tay)

apps/web/src/features/watch/
  components/
    sync-player.tsx                      # SỬA (A1): prop event-typed onPlay/onPause/onSeeked/onRateChange + onEnded
    playlist-panel.tsx                   # SỬA (A2): đảo đúng before/after
    room-controls.tsx                    # SỬA (C3): aria-live cho banner soft-lock
  hooks/
    use-sync-controller.ts               # SỬA (A1): handlers nhận event + isOriginTrusted; gỡ suppressSeekedEventRef
    use-room-members.ts                  # SỬA (B3): gọi RPC get_public_profiles
    use-room-channel.ts                  # SỬA (C1): invalidate room khi reconnect; (D3) heartbeat note
    use-controls-visibility.ts           # SỬA (D2): listener gắn vào Stage ref + throttle
  components/watch-room.tsx              # SỬA (C4): host onEnded → advanceQueue; wire Stage ref (D2)

apps/web/src/app/(watch)/watch/[roomId]/
  error.tsx                              # MỚI (C2): error boundary dùng unstable_retry

apps/web/src/app/api/watch/
  cleanup/route.ts                       # MỚI (D1): Vercel Cron sweep (service-role, CRON_SECRET)

apps/web/src/test/features/
  watch-reorder.test.ts                  # MỚI (E): unit test quy ước reorder before/after

vercel.json                              # MỚI/SỬA (D1): crons entry
```

---

## 3. Chi tiết các Phase

### PHASE A — Sửa 2 bug chặn (P0)

#### A1. Sync controller phân biệt gesture vs programmatic bằng `isOriginTrusted`

> **Cốt lõi sửa B1.** Vidstack `DOMEvent` (mà `MediaPlayEvent`/`MediaPauseEvent`/`MediaSeekedEvent` kế thừa) có getter `isOriginTrusted` = _"Whether the origin event was triggered by the user"_ (`node_modules/@vidstack/react/types/vidstack-instances.d.ts` — `DOMEvent`). Các event do `player.play()/pause()/seek` programmatic phát ra có `isOriginTrusted === false`; thao tác thật của người dùng (click/keyboard) có `isOriginTrusted === true`.

**A1.1 — `apps/web/src/features/watch/components/sync-player.tsx`**

Đổi import + kiểu prop để **truyền event** cho handler (Vidstack React đã đưa event làm tham số đầu của `onPlay` v.v.):

```tsx
import {
  MediaPlayer,
  MediaProvider,
  isHLSProvider,
  type MediaPlayerInstance,
  type MediaProviderAdapter,
  type MediaPlayEvent,
  type MediaPauseEvent,
  type MediaSeekedEvent,
  type MediaRateChangeEvent,
  type MediaEndedEvent,
} from '@vidstack/react';

interface SyncPlayerProps {
  sourceType: 'youtube' | 'url';
  sourceRef: string;
  playerRef: React.RefObject<MediaPlayerInstance | null>;
  onPlay?: (e: MediaPlayEvent) => void;
  onPause?: (e: MediaPauseEvent) => void;
  onSeeked?: (e: MediaSeekedEvent) => void;
  onRateChange?: (e: MediaRateChangeEvent) => void;
  onEnded?: (e: MediaEndedEvent) => void; // dùng ở C4
  children?: React.ReactNode;
}
```

Trong `<MediaPlayer>` thêm `onEnded={onEnded}` cạnh các handler hiện có (giữ nguyên `onPlay/onPause/onSeeked/onRateChange`).

> ⚠️ Nếu một trong các type `MediaPlayEvent…` không export từ `@vidstack/react` ở 1.15.6, fallback: khai báo `type TrustedEvent = { isOriginTrusted?: boolean }` ngay trong file và dùng `onPlay?: (e: TrustedEvent) => void`. Mục tiêu chỉ cần đọc `e.isOriginTrusted`.

**A1.2 — `apps/web/src/features/watch/hooks/use-sync-controller.ts`**

(1) Handlers nhận event, **chỉ soft-lock khi do người dùng**:

```ts
import type { MediaPlayEvent, MediaPauseEvent, MediaSeekedEvent } from '@vidstack/react';

// ...

const handlePlay = (e?: MediaPlayEvent) => {
  if (isHost) {
    emitAnchor();
  } else if (e?.isOriginTrusted) {
    handleFollowerManualInteraction();
  }
};

const handlePause = (e?: MediaPauseEvent) => {
  if (isHost) {
    emitAnchor();
  } else if (e?.isOriginTrusted) {
    handleFollowerManualInteraction();
  }
};

const handleSeeked = (e?: MediaSeekedEvent) => {
  if (isHost) {
    emitAnchor();
  } else if (e?.isOriginTrusted) {
    handleFollowerManualInteraction();
  }
};
```

(2) **Gỡ cơ chế `suppressSeekedEventRef`** (đã thừa nhờ `isOriginTrusted`):

- Xóa khai báo `const suppressSeekedEventRef = useRef<boolean>(false);`.
- Trong `handleFollowerManualInteraction` xóa khối:
  ```ts
  if (suppressSeekedEventRef.current) {
    suppressSeekedEventRef.current = false;
    return;
  }
  ```
  (giữ phần `if (isHost) return;` rồi set `isFollowingHostRef=false` …).
- Trong `reconcile()` nhánh hard-seek, bỏ `suppressSeekedEventRef.current = true;` — giữ guard khoảng cách để tránh seek thừa:
  ```ts
  } else {
    if (Math.abs(player.currentTime - expected) > 0.01) {
      player.currentTime = expected;
    }
    player.playbackRate = anchor.playbackRate;
    setSyncStatus("catching-up");
  }
  ```
- Trong `resync()` tương tự, bỏ dòng set cờ; giữ guard `> 0.01`.

> **Vì sao an toàn:** seek programmatic trong reconcile/resync phát `seeked` với `isOriginTrusted === false` → `handleSeeked` bỏ qua. Chỉ seek thật của người dùng (kéo slider — đi qua `remote.seek`, có origin trusted) mới soft-lock.

> **Cổng nghiệm thu A1 (2 trình duyệt):**
>
> - A bấm Play/Pause/Seek → **B bám theo**, KHÔNG hiện banner _"lệch"_. ✅ (trước đây vỡ)
> - B **tự kéo** thanh tiến trình → hiện banner soft-lock + nút "Đồng bộ lại" đưa B về đúng vị trí host.
> - Follower mới vào khi host đang phát → tự phát (muted nếu bị chặn), vẫn đồng bộ.

#### A2. Sửa hoán đổi `before/after` trong reorder (sửa B2)

**`apps/web/src/features/watch/components/playlist-panel.tsx`**

Quy ước chuẩn (khớp `actions.ts reorderQueue` + optimistic `use-room-queue.ts useReorderQueue`): item đích nằm **giữa** `beforeId` (item đứng _trước_) và `afterId` (item đứng _sau_); server tính `fractionalPosition(beforePos, afterPos)` với `fractionalPosition(null, X)=X-1` (lên đầu) và `fractionalPosition(X, null)=X+1` (xuống cuối).

```tsx
const handleMoveUp = (index: number) => {
  if (index <= 0) return;
  const targetItem = items[index];
  if (!targetItem) return;
  // Đích lên trên 1 bậc: nằm giữa items[index-2] (trước) và items[index-1] (sau)
  const beforeItem = index - 2 >= 0 ? items[index - 2] : null;
  const afterItem = items[index - 1];
  if (!afterItem) return;

  reorderMutation.mutate(
    {
      itemId: targetItem.id,
      beforeId: beforeItem ? beforeItem.id : null,
      afterId: afterItem.id,
    },
    { onError: (err) => toast.error(err.message || 'Sắp xếp thất bại.') },
  );
};

const handleMoveDown = (index: number) => {
  if (index >= items.length - 1) return;
  const targetItem = items[index];
  if (!targetItem) return;
  // Đích xuống dưới 1 bậc: nằm giữa items[index+1] (trước) và items[index+2] (sau)
  const beforeItem = items[index + 1];
  const afterItem = index + 2 < items.length ? items[index + 2] : null;
  if (!beforeItem) return;

  reorderMutation.mutate(
    {
      itemId: targetItem.id,
      beforeId: beforeItem.id,
      afterId: afterItem ? afterItem.id : null,
    },
    { onError: (err) => toast.error(err.message || 'Sắp xếp thất bại.') },
  );
};
```

> **Cổng nghiệm thu A2:** list **2 item**: move up/down đổi đúng. List 3+ item: đẩy item đầu xuống, item cuối lên, item giữa qua lại — tất cả đổi đúng và **giữ nguyên sau refetch** (không snap về cũ). 2 trình duyệt: B reorder → A thấy cập nhật realtime.

---

### PHASE B — RLS đọc public profile (P0, đã được chủ dự án duyệt)

#### B1. `supabase/migrations/012_public_profiles_rpc.sql` — MỚI

```sql
-- Cho phép thành viên phòng đọc THÔNG TIN CÔNG KHAI (chỉ username + avatar) của
-- người khác để hiển thị trong danh sách người xem. KHÔNG nới RLS toàn bảng
-- profiles (tránh lộ full_name/timestamps). RPC SECURITY DEFINER trả đúng 3 cột.
create or replace function public.get_public_profiles(p_ids uuid[])
returns table (id uuid, username text, avatar_url text)
language sql security definer set search_path = public stable
as $$
  select p.id, p.username, p.avatar_url
  from public.profiles p
  where p.id = any(p_ids);
$$;

revoke all on function public.get_public_profiles(uuid[]) from public, anon;
grant execute on function public.get_public_profiles(uuid[]) to authenticated;
```

Áp lên Supabase remote theo quy trình dự án (migration đã được áp 008–011, áp tiếp 012).

#### B2. `packages/supabase/src/types.ts` — thêm Functions entry (gen tay)

Trong khối `Functions:` (cạnh `claim_room_host`, `transfer_room_host`) thêm:

```ts
      get_public_profiles: {
        Args: {
          p_ids: string[]
        }
        Returns: {
          id: string
          username: string | null
          avatar_url: string | null
        }[]
      }
```

#### B3. `apps/web/src/features/watch/hooks/use-room-members.ts` — dùng RPC

Thay khối `queryFn`:

```ts
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("get_public_profiles", {
        p_ids: sorted,
      });
      if (error) throw error;
      const map: Record<string, MemberProfile> = {};
      for (const p of (data ?? []) as MemberProfile[]) {
        map[p.id] = p;
      }
      return map;
    },
```

> **Cổng nghiệm thu B:** 2 trình duyệt khác tài khoản — participant rail + danh sách "Quản lý thành viên" hiện **đúng username/avatar của cả người kia** (không còn `User: xxxxxxxx`). `bun run typecheck` xanh (types có `get_public_profiles`).

---

### PHASE C — Resilience

#### C1. Anchor refresh sau reconnect — `use-room-channel.ts`

Broadcast là ephemeral: follower rớt mạng rồi nối lại sẽ **mất** các anchor phát trong lúc gap, và `postgres_changes` không fire nếu signature không đổi → anchor cũ. Khi channel chuyển `disconnected → SUBSCRIBED`, invalidate room để kéo anchor mới nhất.

Thêm ref theo dõi và xử lý trong `.subscribe`:

```ts
const wasDisconnectedRef = useRef(false);
// ...
activeChannel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    setChannelStatus('connected');
    if (wasDisconnectedRef.current) {
      wasDisconnectedRef.current = false;
      void queryClient.invalidateQueries({ queryKey: watchKeys.room(room.id) });
    }
    await activeChannel.track({
      userId,
      isHost: isHostRef.current,
      joinedAt: joinedAtRef.current,
    });
  } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
    wasDisconnectedRef.current = true;
    setChannelStatus('disconnected');
  }
});
```

> **Cổng nghiệm thu C1:** B đang đồng bộ → tắt mạng B ~10s (DevTools → Offline) → bật lại. Badge "Mất kết nối…" hiện rồi tắt; B **tự nhảy về đúng vị trí host** sau khi nối lại (không cần thao tác).

#### C2. Error boundary tận dụng Next 16.2 — `app/(watch)/watch/[roomId]/error.tsx` (MỚI)

```tsx
'use client';

import type { ErrorInfo } from 'next/error';
import { Button } from '@pumni/ui';

export default function WatchRoomError({ error, unstable_retry }: ErrorInfo) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4 p-6 text-center select-none">
      <h2 className="text-base font-semibold text-foreground">Không tải được phòng xem chung</h2>
      <p className="max-w-md text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={() => unstable_retry()}>Thử lại</Button>
    </div>
  );
}
```

> `unstable_retry()` (mới ở Next 16.2) gọi `router.refresh()` + `reset()` trong transition → re-fetch RSC (`getRoom/getQueue`) thay vì chỉ clear state như `reset()`. Phù hợp khi lỗi đến từ tầng dữ liệu.
> **Cổng nghiệm thu C2:** tạm làm `getRoom` throw (hoặc tắt mạng lúc load) → thấy trang lỗi tiếng Việt + nút "Thử lại" hồi phục khi mạng trở lại. Nhớ revert thay đổi giả lập.

#### C3. A11y banner soft-lock — `room-controls.tsx`

Thêm `role="status" aria-live="polite"` vào `<div>` banner _"Bạn đang xem lệch tiến trình…"_ (khối `{!isHost && !isFollowingHost && resync && (…)}`) để screen reader thông báo khi mất đồng bộ.

```tsx
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg border border-warning/20 bg-warning/5 text-warning text-xs select-none"
          >
```

> **Cổng nghiệm thu C3:** `bun run lint` xanh; kiểm tra DOM có `role="status"`. (Không dùng mã màu raw — vẫn token `warning`.)

#### C4. Auto-advance khi hết video — `watch-room.tsx` + `sync-player.tsx`

Host bắt sự kiện `ended` → tự chuyển video kế nếu còn hàng chờ (tránh phòng đứng hình).

`watch-room.tsx`:

```tsx
import { useAdvanceQueue } from '../hooks/use-room-queue';
// ...
const advanceQueueMutation = useAdvanceQueue(currentRoom.id);

const handleEnded = () => {
  // Chỉ host điều khiển; chỉ advance khi còn item phía sau item hiện tại
  if (!isHost) return;
  if (queueItems.length === 0) return;
  advanceQueueMutation.mutate();
};
```

Truyền vào player: `<SyncPlayer … onEnded={handleEnded}>`. (`advanceQueue` server-side đã trả lỗi "Hàng chờ đã hết" khi không còn item → nuốt lỗi êm, không toast spam: dùng mutate không onError, hoặc onError im lặng cho trường hợp hết queue.)

> **Cổng nghiệm thu C4:** thêm 2 video vào queue, host `advanceQueue` tới video 1, để video 1 phát hết (hoặc seek gần cuối video ngắn) → cả host và follower tự chuyển sang video 2. Video cuối hết → không lỗi rõ ràng cho user.

---

### PHASE D — Scale & ràng buộc Supabase Free

#### D1. Dọn phòng độc lập `pg_cron` — Vercel Cron sweep

> Supabase Free **pause project sau ~7 ngày idle** → `pg_cron` (migration 010) không chạy lúc pause. Bổ sung sweep ở tầng Vercel Cron (chạy kể cả khi app sống), giữ `pg_cron` làm dự phòng. Delete-on-empty (`leaveRoom` RPC) vẫn là cơ chế chính cho rời chủ ý.

`apps/web/src/app/api/watch/cleanup/route.ts` (MỚI):

```ts
import 'server-only';
import { NextRequest } from 'next/server';
import { createSupabaseServiceRoleClient } from '@pumni/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Chặn truy cập công khai: chỉ Vercel Cron (kèm header bí mật) được gọi.
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const supabase = createSupabaseServiceRoleClient();
  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('watch_rooms').delete().lt('last_active_at', cutoff);
  if (error) {
    console.error('watch cleanup failed', error);
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true });
}
```

> ⚠️ **KIỂM TRA TRƯỚC:** xác nhận `@pumni/supabase/server` có export `createSupabaseServiceRoleClient` (hoặc tên tương đương dùng `SUPABASE_SECRET_KEY`/service-role). Nếu chưa có → thêm helper service-role **chỉ ở server** (không bao giờ import vào client). Service key là server-only (P0).

`vercel.json` (thêm/ghép):

```json
{
  "crons": [{ "path": "/api/watch/cleanup", "schedule": "0 * * * *" }]
}
```

Thêm biến môi trường `CRON_SECRET` trên Vercel (và `.env` local cho test). Vercel Cron tự đính `Authorization: Bearer <CRON_SECRET>`.

> **Cổng nghiệm thu D1:** gọi tay `GET /api/watch/cleanup` **không** header → 401; có header đúng → 200 và phòng `last_active_at` quá hạn bị xóa. (Test local: tạo phòng, set `last_active_at` lùi 7 giờ qua SQL, gọi route → phòng biến mất.)

#### D2. Perf auto-hide controls — scope listener vào Stage — `use-controls-visibility.ts` + `watch-room.tsx`/`room-controls.tsx`

Hiện listener gắn `window` (`use-controls-visibility.ts:42-58`) → rê chuột **bất kỳ đâu** (kể cả side-dock) làm hiện controls + churn timer mỗi pixel. Gắn vào container Stage và throttle.

Đổi chữ ký hook nhận `stageRef`:

```ts
export function useControlsVisibility({
  paused,
  stageRef,
}: {
  paused: boolean;
  stageRef: React.RefObject<HTMLElement | null>;
}) {
  // ...
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    let lastMove = 0;
    const handleMove = () => {
      const now = Date.now();
      if (now - lastMove < 100) return; // throttle ~10fps
      lastMove = now;
      resetTimerRef.current();
    };
    const handleActivity = () => resetTimerRef.current();

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("pointerdown", handleActivity);
    el.addEventListener("keydown", handleActivity);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("pointerdown", handleActivity);
      el.removeEventListener("keydown", handleActivity);
    };
  }, [stageRef]);
```

Wiring: `room-controls.tsx` nhận `stageRef` (prop) và truyền vào hook; `watch-room.tsx` tạo `const stageRef = useRef<HTMLDivElement>(null)` đặt trên `<div className="… Stage">` bọc `SyncPlayer`, truyền xuống `RoomControls`. (Hoặc gắn ref trong `sync-player.tsx` vào div ngoài cùng rồi forward — chọn cách ít prop-drilling nhất, miễn ref trỏ đúng vùng Stage.)

> **Cổng nghiệm thu D2:** rê chuột **trên side-dock** → controls video KHÔNG hiện lại; rê trên vùng video → hiện. Auto-hide 3s vẫn đúng; prefers-reduced-motion vẫn giữ controls.

#### D3. Ghi nhận giới hạn Realtime Free (document, chỉnh nhỏ)

- Xác nhận **1 channel** `room:{id}` mang broadcast + presence + 2 postgres_changes (đã tối ưu). Không tạo channel mới ở Phase 5/6.
- `host_heartbeat_at` UPDATE mỗi 15s + anchor persist (debounce 2s) đều phát `postgres_changes` tới mọi follower (signature-guard chặn refetch, nhưng vẫn tốn message quota). **Chỉnh nhẹ:** giãn heartbeat 15s → **20s** trong `use-host-heartbeat.ts` (`setInterval(beat, 20_000)`) để giảm chatter; grace claim 30s vẫn an toàn (20s < 30s).
- Ghi chú trong doc: Realtime Free ~200 concurrent connection → mỗi client 1 connection → trần ~200 người xem đồng thời toàn hệ thống. Đủ cho giai đoạn hiện tại.

> **Cổng nghiệm thu D3:** React Query Devtools — heartbeat 20s và host play/pause **không** gây refetch room ở follower (signature-guard còn nguyên). `bun run typecheck` xanh.

---

### PHASE E — Kiểm thử & gates

#### E1. Unit test reorder — `apps/web/src/test/features/watch-reorder.test.ts` (MỚI)

Kiểm chứng `fractionalPosition` cho đúng các kịch bản before/after sau khi A2 sửa quy ước (test thuần hàm, không cần DOM):

```ts
import { describe, it, expect } from 'vitest';
import { fractionalPosition } from '../../features/watch/sync-math';

describe('reorder fractionalPosition semantics', () => {
  it('đưa lên đầu (before=null)', () => {
    expect(fractionalPosition(null, 0)).toBe(-1); // trước item đầu
  });
  it('đưa xuống cuối (after=null)', () => {
    expect(fractionalPosition(2, null)).toBe(3); // sau item cuối
  });
  it('chèn vào giữa', () => {
    expect(fractionalPosition(1, 2)).toBe(1.5);
  });
  it('list rỗng', () => {
    expect(fractionalPosition(null, null)).toBe(0);
  });
});
```

#### E2. Smoke 2 trình duyệt (A=host, B=follower)

1. **B1:** A play/pause/seek → B bám theo, KHÔNG banner lệch. B tự seek → soft-lock + resync OK.
2. **B2:** reorder list 2 item + đẩy đầu/cuối → đổi đúng, giữ nguyên sau refetch, đồng bộ chéo.
3. **B3:** tên/avatar người kia hiện đúng.
4. **C1:** B offline ~10s → online → tự đồng bộ lại.
5. **C4:** video hết → auto chuyển video kế (cả 2 client).
6. **D2:** rê chuột trên side-dock không hiện controls video.

#### E3. Gates

`bun run typecheck` + `bun run lint` + `bun run test` + `bun run build` đều xanh.

> **Cổng nghiệm thu cuối Phase 5:** E1 xanh, E2 đủ 6 bước, E3 xanh. Áp `012_*` lên remote + patch `types.ts` trước khi test B3.

---

## 4. Rủi ro & khắc phục

| Rủi ro                                                         | Khắc phục                                                                                                                                                 |
| :------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MediaPlayEvent…` không export ở Vidstack 1.15.6               | Fallback type cục bộ `{ isOriginTrusted?: boolean }` (A1.1 note). Chỉ cần đọc `isOriginTrusted`.                                                          |
| `isOriginTrusted` không phân biệt đúng cho YouTube provider    | Verify ở cổng A1; nếu YouTube provider không gắn trusted origin cho click thật → giữ thêm guard phụ (re-introduce 1 cờ chỉ cho seek). Ưu tiên test trước. |
| Gỡ `suppressSeekedEventRef` làm seek programmatic bị nuốt nhầm | Không xảy ra: programmatic seek có `isOriginTrusted=false` → handler bỏ qua đúng ý.                                                                       |
| `createSupabaseServiceRoleClient` chưa tồn tại (D1)            | Kiểm tra `@pumni/supabase/server`; thêm helper service-role server-only nếu thiếu. Tuyệt đối không import vào client.                                     |
| Vercel Cron không chạy trên gói hiện tại                       | pg_cron (010) làm dự phòng; delete-on-empty vẫn xử lý case chính.                                                                                         |
| `get_public_profiles` lộ dữ liệu ngoài ý                       | RPC chỉ `select id, username, avatar_url`; `revoke from public, anon`.                                                                                    |
| Auto-advance lỗi "hết queue" tạo toast spam                    | C4: không gắn onError cho trường hợp hết queue (im lặng) hoặc kiểm tra còn item trước khi mutate.                                                         |

## 5. Bất biến tuyệt đối (KHÔNG phá)

- Anchor + heartbeat **chỉ host ghi** qua RLS `watch_rooms_update_host` — không service-role, không nới RLS.
- Service-role **chỉ** ở route handler server (D1) với `"server-only"`; không bao giờ vào client/`"use client"`.
- RPC `SECURITY DEFINER` giữ `revoke from public, anon`; `get_public_profiles` chỉ trả cột công khai.
- **Một** channel `room:{id}` cho mọi realtime.
- `leaveRoom` chỉ chạy trên hành động chủ ý (không unmount/`beforeunload`).
- React Compiler bật → không thêm `useCallback/useMemo` (trừ `source` useMemo trong `sync-player.tsx`).
- Structural-signature guard (`getStructuralSignature`) giữ nguyên; `host_heartbeat_at` KHÔNG nằm trong signature.

## 6. Checklist thực thi nhanh

- [ ] A1 (isOriginTrusted, gỡ suppress) + A2 (reorder swap) → cổng A
- [ ] B1–B3 (RPC public profiles) → áp 012 + patch types → cổng B
- [ ] C1 (reconnect invalidate) + C2 (error.tsx) + C3 (aria-live) + C4 (auto-advance) → cổng C
- [ ] D1 (Vercel Cron cleanup) + D2 (scope controls listener) + D3 (heartbeat 20s) → cổng D
- [ ] E1–E3 (unit + smoke + gates) → cổng cuối
- [ ] Tiếp tục **liền mạch** sang `watch-together-phase6-features.md`
