'use client';

import { useQueryClient } from '@tanstack/react-query';

import type { QueueItem, Room } from '../types';
import { useHostHeartbeat } from './use-host-heartbeat';
import { useRoomChannel } from './use-room-channel';
import { useRoomMembership } from './use-room-membership';
import { useQueueQuery } from './use-room-queue';
import { useRoomQuery } from './use-room-query';
import { useServerClock } from './use-server-clock';

interface WatchRoomRuntimeOptions {
  room: Room;
  userId: string;
  initialQueueItems: QueueItem[];
}

/**
 * Composition boundary for the base room runtime: membership, clock, cached
 * room/queue state, host heartbeat, and realtime transport.
 *
 * Queue mutations, chat, host election, profiles, and player sync deliberately
 * stay outside. Their hooks retain the same relative ordering in `WatchRoom`,
 * avoiding subtle effect-order changes while still giving infrastructure a
 * named boundary an agent can inspect independently.
 */
export function useWatchRoomRuntime({ room, userId, initialQueueItems }: WatchRoomRuntimeOptions) {
  const queryClient = useQueryClient();
  const membership = useRoomMembership(room.id, queryClient);
  const { ready: clockReady, serverClock } = useServerClock();
  const { data: currentRoom } = useRoomQuery(room.id, room);
  const { data: queueItems } = useQueueQuery(room.id, initialQueueItems);
  const isHost = currentRoom.host_id === userId;

  useHostHeartbeat(currentRoom.id, userId, isHost);

  return {
    currentRoom,
    queueItems,
    isHost,
    membership,
    clockReady,
    serverClock,
    ...useRoomChannel(currentRoom, userId, isHost),
  };
}
