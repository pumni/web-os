import { RecentRoomsStrip } from './recent-rooms-strip';
import { EmptyRoomsCard } from './empty-rooms-card';
import type { Room } from '../types';

interface RecentRoomsCardProps {
  rooms: Room[];
}

export function RecentRoomsCard({ rooms }: RecentRoomsCardProps) {
  if (rooms.length === 0) {
    return <EmptyRoomsCard />;
  }

  return <RecentRoomsStrip rooms={rooms} />;
}
