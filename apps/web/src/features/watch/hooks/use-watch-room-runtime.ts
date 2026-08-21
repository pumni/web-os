'use client';

import { useQueryClient } from '@tanstack/react-query';

import type { QueueItem, Room } from '../types';
import { useHostAutopromote } from './use-host-autopromote';
import { useHostClaimState } from './use-host-claim-state';
import { useHostHeartbeat } from './use-host-heartbeat';
import { useMemberProfiles } from './use-room-members';
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
 * Composition boundary for room lifecycle + realtime ownership.
 *
 * Queue mutations, chat behavior, and player sync deliberately stay outside
 * this hook: they consume the runtime but have independent reasons to change.
 * Keeping this boundary focused lets `WatchRoom` read as orchestration instead
 * of a flat list of infrastructure hooks while avoiding a catch-all mega-hook.
 */
export function useWatchRoomRuntime({ room, userId, initialQueueItems }: WatchRoomRuntimeOptions) {
  const queryClient = useQueryClient();
  const membership = useRoomMembership(room.id, queryClient);
  const { ready: clockReady, serverClock } = useServerClock();
  const { data: currentRoom } = useRoomQuery(room.id, room);
  const { data: queueItems } = useQueueQuery(room.id, initialQueueItems);
  const isHost = currentRoom.host_id === userId;

  useHostHeartbeat(currentRoom.id, userId, isHost);

  const channel = useRoomChannel(currentRoom, userId, isHost);

  useHostAutopromote(currentRoom.id, userId, isHost, channel.participants, () =>
    channel.broadcastRoomEvent({ action: 'host-claim' }),
  );

  const { data: profiles = {} } = useMemberProfiles(
    channel.participants.map((participant) => participant.userId),
  );
  const hostPresent = channel.participants.some((participant) => participant.isHost);
  const showClaim = useHostClaimState(isHost, hostPresent);

  return {
    currentRoom,
    queueItems,
    isHost,
    membership,
    clockReady,
    serverClock,
    profiles,
    showClaim,
    ...channel,
  };
}
