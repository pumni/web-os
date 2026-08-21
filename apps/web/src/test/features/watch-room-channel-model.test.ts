import { describe, expect, it } from 'vitest';

import {
  classifyRoomUpdate,
  getPlaybackSignature,
  normalizeParticipants,
  queueBroadcastNotice,
} from '@/features/watch/room-channel-model';
import { getStructuralSignature } from '@/features/watch/sync-math';
import type { Room } from '@/features/watch/types';

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'room-1',
    source_type: 'youtube',
    source_ref: 'video-a',
    host_id: 'host-1',
    current_queue_item_id: null,
    is_playing: true,
    anchor_position: 12,
    anchor_server_ts: '2026-08-21T09:00:00.000Z',
    playback_rate: 1,
    ...overrides,
  } as Room;
}

describe('room channel model', () => {
  describe('classifyRoomUpdate', () => {
    it('does nothing when neither structural nor playback state changed', () => {
      const room = makeRoom();
      const decision = classifyRoomUpdate(
        getStructuralSignature(room),
        getPlaybackSignature(room),
        room,
      );

      expect(decision.invalidateRoom).toBe(false);
      expect(decision.anchor).toBeNull();
    });

    it('invalidates cached room data for structural-only changes', () => {
      const previous = makeRoom();
      const next = makeRoom({ source_ref: 'video-b' });
      const decision = classifyRoomUpdate(
        getStructuralSignature(previous),
        getPlaybackSignature(previous),
        next,
      );

      expect(decision.invalidateRoom).toBe(true);
      expect(decision.anchor).toBeNull();
      expect(decision.structuralSignature).toBe(getStructuralSignature(next));
    });

    it('emits a playback anchor without invalidating structure for playback-only changes', () => {
      const previous = makeRoom();
      const next = makeRoom({
        is_playing: false,
        anchor_position: 42,
        anchor_server_ts: '2026-08-21T09:01:30.000Z',
        playback_rate: 1.25,
      });
      const decision = classifyRoomUpdate(
        getStructuralSignature(previous),
        getPlaybackSignature(previous),
        next,
      );

      expect(decision.invalidateRoom).toBe(false);
      expect(decision.anchor).toEqual({
        isPlaying: false,
        anchorPosition: 42,
        anchorServerTs: Date.parse('2026-08-21T09:01:30.000Z'),
        playbackRate: 1.25,
      });
    });

    it('can invalidate structure and emit an anchor from the same authoritative update', () => {
      const previous = makeRoom();
      const next = makeRoom({ host_id: 'host-2', anchor_position: 20 });
      const decision = classifyRoomUpdate(
        getStructuralSignature(previous),
        getPlaybackSignature(previous),
        next,
      );

      expect(decision.invalidateRoom).toBe(true);
      expect(decision.anchor?.anchorPosition).toBe(20);
    });
  });

  describe('normalizeParticipants', () => {
    it('uses the latest presence per key and sorts participants by join time', () => {
      const participants = normalizeParticipants({
        'user-2': [
          { userId: 'user-2', isHost: false, joinedAt: 20 },
          { userId: 'user-2', isHost: true, joinedAt: 15, presenceRef: 'latest' },
        ],
        'user-1': [{ isHost: false, joinedAt: 5 }],
      });

      expect(participants).toEqual([
        { presenceRef: undefined, userId: 'user-1', isHost: false, joinedAt: 5 },
        { presenceRef: 'latest', userId: 'user-2', isHost: true, joinedAt: 15 },
      ]);
    });

    it('ignores empty presence buckets and uses a deterministic fallback join time', () => {
      const participants = normalizeParticipants(
        {
          empty: [],
          fallback: [{ userId: 'fallback' }],
        },
        1234,
      );

      expect(participants).toEqual([
        { presenceRef: undefined, userId: 'fallback', isHost: false, joinedAt: 1234 },
      ]);
    });
  });

  describe('queueBroadcastNotice', () => {
    it('formats add and remove activity using the queue item title', () => {
      expect(queueBroadcastNotice({ action: 'add', title: 'Demo' })).toBe(
        'Video "Demo" đã được thêm vào hàng chờ',
      );
      expect(queueBroadcastNotice({ action: 'remove', title: 'Demo' })).toBe(
        'Video "Demo" đã bị xóa khỏi hàng chờ',
      );
    });

    it('falls back to the existing unnamed label', () => {
      expect(queueBroadcastNotice({ action: 'add', title: null })).toBe(
        'Video "Không tên" đã được thêm vào hàng chờ',
      );
    });

    it('reports reorder but keeps advance and malformed events silent', () => {
      expect(queueBroadcastNotice({ action: 'reorder' })).toBe(
        'Thứ tự hàng chờ vừa được cập nhật',
      );
      expect(queueBroadcastNotice({ action: 'advance' })).toBeNull();
      expect(queueBroadcastNotice(undefined)).toBeNull();
    });
  });
});
