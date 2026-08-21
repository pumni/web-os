import { getStructuralSignature } from './sync-math';
import type { Participant, PlaybackAnchor, QueueBroadcastEvent, Room } from './types';

export interface RoomUpdateDecision {
  structuralSignature: string;
  playbackSignature: string;
  invalidateRoom: boolean;
  anchor: PlaybackAnchor | null;
}

type PresenceRecord = {
  presenceRef?: string;
  userId?: string;
  isHost?: boolean;
  joinedAt?: number;
};

export function getPlaybackSignature(room: Room): string {
  return `${room.is_playing}|${room.anchor_position}|${room.anchor_server_ts}|${room.playback_rate}`;
}

/**
 * Classifies one authoritative `watch_rooms` update without performing I/O.
 * Structural changes refresh cached room data; playback changes emit an anchor
 * into the same downstream path used by low-latency broadcasts.
 */
export function classifyRoomUpdate(
  previousStructuralSignature: string,
  previousPlaybackSignature: string,
  nextRoom: Room,
): RoomUpdateDecision {
  const structuralSignature = getStructuralSignature(nextRoom);
  const playbackSignature = getPlaybackSignature(nextRoom);
  const playbackChanged = playbackSignature !== previousPlaybackSignature;

  return {
    structuralSignature,
    playbackSignature,
    invalidateRoom: structuralSignature !== previousStructuralSignature,
    anchor: playbackChanged
      ? {
          isPlaying: nextRoom.is_playing,
          anchorPosition: nextRoom.anchor_position,
          anchorServerTs: new Date(nextRoom.anchor_server_ts).getTime(),
          playbackRate: nextRoom.playback_rate,
        }
      : null,
  };
}

/** Convert Supabase presence state into the stable participant view used by the room UI. */
export function normalizeParticipants(
  state: Record<string, unknown>,
  fallbackJoinedAt = Date.now(),
): Participant[] {
  const participants: Participant[] = [];

  for (const [key, value] of Object.entries(state)) {
    if (!Array.isArray(value) || value.length === 0) continue;

    const latest = value[value.length - 1] as PresenceRecord;
    participants.push({
      presenceRef: latest.presenceRef,
      userId: latest.userId || key,
      isHost: !!latest.isHost,
      joinedAt: latest.joinedAt || fallbackJoinedAt,
    });
  }

  return participants.sort((a, b) => a.joinedAt - b.joinedAt);
}

/** Returns user-facing queue activity copy; `advance` intentionally stays silent. */
export function queueBroadcastNotice(
  event: Partial<QueueBroadcastEvent> | null | undefined,
): string | null {
  const name = event?.title || 'Không tên';

  if (event?.action === 'add') return `Video "${name}" đã được thêm vào hàng chờ`;
  if (event?.action === 'remove') return `Video "${name}" đã bị xóa khỏi hàng chờ`;
  if (event?.action === 'reorder') return 'Thứ tự hàng chờ vừa được cập nhật';
  return null;
}
