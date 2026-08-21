import { requireUser } from '@pumni/auth';
import { WatchLobby } from '@/features/watch/client';
import { getEntitlements } from '@/features/billing';
import { createSupabaseServerClient } from '@pumni/supabase/server';

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
  const user = await requireUser();
  const { roomCode } = await searchParams;

  const entitlements = await getEntitlements();

  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from('watch_rooms')
    .select('id', { count: 'exact', head: true })
    .eq('host_id', user.id);

  return (
    <div className="flex min-h-[70vh] flex-col p-4">
      <WatchLobby
        initialRoomCode={roomCode}
        entitlements={entitlements}
        activeRoomsCount={count ?? 0}
      />
    </div>
  );
}
