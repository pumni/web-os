import { requireUser } from '@pumni/auth';
import { WatchLobby } from '@/features/watch';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch Together',
  description: 'Xem video cùng bạn bè theo thời gian thực.',
};

interface WatchLobbyPageProps {
  searchParams: Promise<{
    roomCode?: string;
  }>;
}

export default async function WatchLobbyPage({ searchParams }: WatchLobbyPageProps) {
  await requireUser();
  const { roomCode } = await searchParams;

  return (
    <div className="flex min-h-[70vh] flex-col p-4">
      <WatchLobby initialRoomCode={roomCode} />
    </div>
  );
}
