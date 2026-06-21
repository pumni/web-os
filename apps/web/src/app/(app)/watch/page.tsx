import { requireUser } from '@pumni/auth';
import { WatchLobby } from '@/features/watch';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch Together',
  description: 'Xem video cùng bạn bè theo thời gian thực.',
};

export default async function WatchLobbyPage() {
  await requireUser();

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <WatchLobby />
    </div>
  );
}
