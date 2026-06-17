import { RoomCard } from './room-card';
import type { Room } from '../types';

interface RecentRoomsStripProps {
  rooms: Room[];
}

export function RecentRoomsStrip({ rooms }: RecentRoomsStripProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
      {rooms.map((room) => (
        <div key={room.id} className="shrink-0">
          <RoomCard room={room} />
        </div>
      ))}
    </div>
  );
}
