import { NextRequest } from 'next/server';
import { ensureRoomMembership, RoomFullError } from '@/features/watch';
import { requireUser } from '@pumni/auth';
import { limitOr429 } from '@/shared/lib/rate-limit';
import { captureServerEvent } from '@/shared/lib/analytics';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;
  let userId: string | undefined;
  try {
    const user = await requireUser();
    userId = user.id;
    const limitResponse = await limitOr429(`join:${user.id}:${roomId}`);
    if (limitResponse) {
      return limitResponse;
    }

    await ensureRoomMembership(roomId);
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof RoomFullError) {
      if (userId) {
        captureServerEvent(userId, 'limit_hit', { limitType: 'room_members' }).catch((e) => {
          console.error('Failed to capture room_members limit_hit:', e);
        });
      }
      return Response.json({ ok: false, message: err.message }, { status: 403 });
    }
    console.error('join route failed', err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
