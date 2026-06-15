import { requireUser } from '@pumni/auth';
import { WatchLobby } from '@/features/watch/components/watch-lobby';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch Together',
  description: 'Xem video cùng bạn bè theo thời gian thực.',
};

export default async function WatchLobbyPage() {
  await requireUser();

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <WatchLobby />
    </div>
  );
}
