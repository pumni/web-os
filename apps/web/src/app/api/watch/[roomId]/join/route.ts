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
