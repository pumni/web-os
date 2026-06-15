import { notFound } from 'next/navigation';
import { requireUser } from '@pumni/auth';
import { getRoom, getQueue } from '@/features/watch/queries';
import { WatchRoom } from '@/features/watch/components/watch-room';

interface WatchRoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function WatchRoomPage({ params }: WatchRoomPageProps) {
  const user = await requireUser();
  const { roomId } = await params;

  const [room, initialQueueItems] = await Promise.all([getRoom(roomId), getQueue(roomId)]);

  if (!room) {
    notFound();
  }

  return <WatchRoom room={room} userId={user.id} initialQueueItems={initialQueueItems} />;
}
