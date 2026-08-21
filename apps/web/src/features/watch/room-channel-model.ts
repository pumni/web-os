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

type NoticeAction = Exclude<QueueBroadcastEvent['action'], 'advance'>;

const QUEUE_NOTICE: Record<NoticeAction, (name: string) => string> = {
  add: (name) => `Video "${name}" đã được thêm vào hàng chờ`,
  remove: (name) => `Video "${name}" đã bị xóa khỏi hàng chờ`,
  reorder: () => 'Thứ tự hàng chờ vừa được cập nhật',
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

function participantFromPresence(
  key: string,
  value: unknown,
  fallbackJoinedAt: number,
): Participant | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const latest = value[value.length - 1] as PresenceRecord;
  return {
    presenceRef: latest.presenceRef,
    userId: latest.userId ?? key,
    isHost: latest.isHost === true,
    joinedAt: latest.joinedAt ?? fallbackJoinedAt,
  };
}

/** Convert Supabase presence state into the stable participant view used by the room UI. */
export function normalizeParticipants(
  state: Record<string, unknown>,
  fallbackJoinedAt = Date.now(),
): Participant[] {
  return Object.entries(state)
    .map(([key, value]) => participantFromPresence(key, value, fallbackJoinedAt))
    .filter((participant): participant is Participant => participant !== null)
    .sort((a, b) => a.joinedAt - b.joinedAt);
}

/** Returns user-facing queue activity copy; `advance` intentionally stays silent. */
export function queueBroadcastNotice(
  event: Partial<QueueBroadcastEvent> | null | undefined,
): string | null {
  if (!event?.action || event.action === 'advance') return null;
  return QUEUE_NOTICE[event.action](event.title ?? 'Không tên');
}
