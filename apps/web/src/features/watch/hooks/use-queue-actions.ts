'use client';

// fallow-ignore-file security-client-server-leak -- Intentional: Next.js Server Action import verified safe on client boundary

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useAddQueueItem,
  useAdvanceQueue,
  usePlayQueueItem,
  useRemoveQueueItem,
  useReorderQueue,
} from './use-room-queue';
import { watchKeys } from '../query-keys';
import type { QueueBroadcastEvent, QueueItem, RoomBroadcastEvent } from '../types';

interface QueueActionDeps {
  /** Hard gate — when false every action no-ops (room membership not ready). */
  isMemberReady: boolean;
  /** Identifier of the currently-playing queue item, if any. Used to broadcast
   *  `queue-current-cleared` when the user removes it. */
  currentQueueItemId: string | null;
  broadcastQueueEvent: (event: QueueBroadcastEvent) => void;
  broadcastRoomEvent: (event: RoomBroadcastEvent) => void;
}

export interface QueueActions {
  add: (input: { sourceType: 'youtube' | 'url'; sourceRef: string; title?: string }) => void;
  remove: (itemId: string) => void;
  /**
   * Advance to the next queued item.
   * Pass `{ silent: true }` from auto-play paths to skip the user-facing
   * "Đã chuyển sang video tiếp theo!" toast (broadcast events still fire).
   */
  advance: (options?: { silent?: boolean }) => void;
  reorder: (itemId: string, beforeId: string | null, afterId: string | null) => void;
  play: (item: QueueItem) => void;
  /** True when any underlying mutation is in flight. */
  isPending: boolean;
  /** Convenience — `isPending || !isMemberReady`. */
  isActionDisabled: boolean;
}

/**
 * Shared action handlers for the watch room queue (used by both `<WatchRoom>`
 * and `<PlaylistPanel>`). Each method bundles the mutation trigger, toast
 * feedback, and the broadcast call so callers don't have to repeat the same
 * toast/broadcast glue per JSX site — preventing the
 * `dup:629c55c6`/`playlist-panel ↔ watch-room` duplication and lowering each
 * component's cognitive load.
 *
 * The handlers are no-ops when `isMemberReady` is false to keep caller-side
 * gating (e.g. disabled buttons) consistent. The mutations themselves enforce
 * RLS server-side; this hook only mirrors the UX expectation.
 */
export function useQueueActions(
  roomId: string,
  { isMemberReady, currentQueueItemId, broadcastQueueEvent, broadcastRoomEvent }: QueueActionDeps,
): QueueActions {
  const queryClient = useQueryClient();
  const addMutation = useAddQueueItem(roomId);
  const removeMutation = useRemoveQueueItem(roomId);
  const reorderMutation = useReorderQueue(roomId);
  const advanceMutation = useAdvanceQueue(roomId);
  const playMutation = usePlayQueueItem(roomId);

  const isPending =
    addMutation.isPending ||
    removeMutation.isPending ||
    reorderMutation.isPending ||
    advanceMutation.isPending ||
    playMutation.isPending;

  const add = useCallback(
    (input: { sourceType: 'youtube' | 'url'; sourceRef: string; title?: string }) => {
      if (!isMemberReady) return;
      addMutation.mutate(input, {
        onSuccess: () => {
          toast.success('Đã thêm vào hàng chờ!');
          const displayTitle = input.title?.trim() || input.sourceRef;
          broadcastQueueEvent({ action: 'add', title: displayTitle });
        },
        onError: (err: Error) => toast.error(err.message || 'Thêm thất bại.'),
      });
    },
    [isMemberReady, addMutation, broadcastQueueEvent],
  );

  const remove = useCallback(
    (itemId: string) => {
      if (!isMemberReady) return;
      // Snapshot the pre-mutation queue so we can drive broadcast titles and
      // the `queue-current-cleared` edge without re-querying after settle.
      const cache = queryClient.getQueryData<QueueItem[]>(watchKeys.queue(roomId)) ?? [];
      const removed = cache.find((item) => item.id === itemId) ?? null;

      removeMutation.mutate(itemId, {
        onSuccess: () => {
          toast.success('Đã xóa khỏi hàng chờ!');
          broadcastQueueEvent({
            action: 'remove',
            title: removed?.title ?? removed?.source_ref,
          });
          if (removed && removed.id === currentQueueItemId) {
            broadcastRoomEvent({ action: 'queue-current-cleared' });
          }
        },
        onError: (err: Error) => toast.error(err.message || 'Xóa thất bại.'),
      });
    },
    [
      isMemberReady,
      removeMutation,
      queryClient,
      roomId,
      broadcastQueueEvent,
      broadcastRoomEvent,
      currentQueueItemId,
    ],
  );

  const advance = useCallback(
    (options?: { silent?: boolean }) => {
      if (!isMemberReady) return;

      advanceMutation.mutate(undefined, {
        onSuccess: () => {
          if (!options?.silent) {
            toast.success('Đã chuyển sang video tiếp theo!');
          }
          broadcastQueueEvent({ action: 'advance' });
          broadcastRoomEvent({ action: 'advance' });
        },
        onError: (err: Error) => toast.error(err.message || 'Chuyển video thất bại.'),
      });
    },
    [isMemberReady, advanceMutation, broadcastQueueEvent, broadcastRoomEvent],
  );

  const reorder = useCallback(
    (itemId: string, beforeId: string | null, afterId: string | null) => {
      if (!isMemberReady) return;
      reorderMutation.mutate(
        { itemId, beforeId, afterId },
        {
          onSuccess: () => {
            toast.success('Đã sắp xếp lại hàng chờ');
            broadcastQueueEvent({ action: 'reorder', title: undefined });
          },
          onError: (err: Error) => toast.error(err.message || 'Sắp xếp thất bại.'),
        },
      );
    },
    [isMemberReady, reorderMutation, broadcastQueueEvent],
  );

  const play = useCallback(
    (item: QueueItem) => {
      if (!isMemberReady) return;
      playMutation.mutate(item.id, {
        onSuccess: () => {
          toast.success(`Đang phát: ${item.title || item.source_ref}`);
          broadcastQueueEvent({ action: 'advance' });
          broadcastRoomEvent({ action: 'advance' });
        },
        onError: (err: Error) => toast.error(err.message || 'Phát bài hát thất bại.'),
      });
    },
    [isMemberReady, playMutation, broadcastQueueEvent, broadcastRoomEvent],
  );

  return {
    add,
    remove,
    advance,
    reorder,
    play,
    isPending,
    isActionDisabled: isPending || !isMemberReady,
  };
}
