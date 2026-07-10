'use client';

// fallow-ignore-file security-client-server-leak -- Intentional: Next.js Server Action import verified safe on client boundary
// fallow-ignore-file code-duplication -- Intentional: React Query mutation rollback boilerplate is repeated across independent hooks for clarity

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { watchKeys } from '../query-keys';
import {
  addQueueItem,
  removeQueueItem,
  reorderQueue,
  advanceQueue,
  transferHost,
  claimHost,
  playQueueItem,
} from '../actions';
import type { QueueItem } from '../types';
import { fractionalPosition } from '../sync-math';
import { WATCH_ROOM_RECOVERY_REFETCH_MS, WATCH_ROOM_STALE_MS } from './use-room-query';
import { getQueueClient } from '../client-queries';

export function useQueueQuery(roomId: string, initialData: QueueItem[]) {
  return useQuery({
    queryKey: watchKeys.queue(roomId),
    queryFn: () => getQueueClient(roomId),
    initialData,
    staleTime: WATCH_ROOM_STALE_MS,
    refetchInterval: WATCH_ROOM_RECOVERY_REFETCH_MS,
    refetchIntervalInBackground: false,
    refetchOnReconnect: 'always',
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Optimistic queue helper shared by every "queue mutation" hook below.
 * Cancels in-flight queries, snapshots the previous queue, runs `mutator` to
 * produce the next queue, and writes it back to the cache — returning the
 * snapshot for `onError` to roll back. Each hook pairs this with its own
 * `onError` (roll back if the helper returned a snapshot) and `onSettled`
 * (invalidate to reconcile with the server). Centralising just the
 * cancel/snapshot/write half removes the duplicate boilerplate between
 * `useAddQueueItem` and `useReorderQueue`.
 */
async function applyOptimisticQueueUpdate(
  roomId: string,
  queryClient: ReturnType<typeof useQueryClient>,
  mutator: (prev: QueueItem[]) => QueueItem[],
): Promise<{ previousQueue: QueueItem[] }> {
  await queryClient.cancelQueries({ queryKey: watchKeys.queue(roomId) });
  const previousQueue = queryClient.getQueryData<QueueItem[]>(watchKeys.queue(roomId)) || [];
  queryClient.setQueryData<QueueItem[]>(watchKeys.queue(roomId), mutator(previousQueue));
  return { previousQueue };
}

export function useAddQueueItem(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      sourceType: 'youtube' | 'url';
      sourceRef: string;
      title?: string;
    }) => {
      const res = await addQueueItem({
        roomId,
        sourceType: variables.sourceType,
        sourceRef: variables.sourceRef,
        title: variables.title,
      });
      if (!res.ok) {
        throw new Error(res.message);
      }
      return res;
    },
    onMutate: async (variables) =>
      applyOptimisticQueueUpdate(roomId, queryClient, (previousQueue) => {
        const lastItem = previousQueue[previousQueue.length - 1];
        const position = lastItem ? fractionalPosition(lastItem.position, null) : 0.0;

        const optimisticItem: QueueItem = {
          id: `temp-${Date.now()}`,
          room_id: roomId,
          position,
          source_type: variables.sourceType,
          source_ref: variables.sourceRef,
          title: variables.title || 'Đang tải tiêu đề...',
          added_by: 'me',
          created_at: new Date().toISOString(),
        };

        return [...previousQueue, optimisticItem];
      }),
    onError: (_err, _variables, context) => {
      if (context?.previousQueue) {
        queryClient.setQueryData(watchKeys.queue(roomId), context.previousQueue);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: watchKeys.queue(roomId) });
    },
  });
}

export function useRemoveQueueItem(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await removeQueueItem(roomId, itemId);
      if (!res.ok) {
        throw new Error(res.message);
      }
      return res;
    },
    onMutate: async (itemId) =>
      applyOptimisticQueueUpdate(roomId, queryClient, (previousQueue) =>
        previousQueue.filter((item) => item.id !== itemId),
      ),
    onError: (_err, _itemId, context) => {
      if (context?.previousQueue) {
        queryClient.setQueryData(watchKeys.queue(roomId), context.previousQueue);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: watchKeys.queue(roomId) });
      void queryClient.invalidateQueries({ queryKey: watchKeys.room(roomId) });
    },
  });
}

export function useReorderQueue(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      itemId: string;
      beforeId: string | null;
      afterId: string | null;
    }) => {
      const res = await reorderQueue({
        roomId,
        itemId: variables.itemId,
        beforeId: variables.beforeId,
        afterId: variables.afterId,
      });
      if (!res.ok) {
        throw new Error(res.message);
      }
      return res;
    },
    onMutate: async (variables) =>
      applyOptimisticQueueUpdate(roomId, queryClient, (previousQueue) => {
        const beforeItem = previousQueue.find((i) => i.id === variables.beforeId);
        const afterItem = previousQueue.find((i) => i.id === variables.afterId);
        const beforePosition = beforeItem ? beforeItem.position : null;
        const afterPosition = afterItem ? afterItem.position : null;
        const newPosition = fractionalPosition(beforePosition, afterPosition);

        const nextQueue = previousQueue.map((item) =>
          item.id === variables.itemId ? { ...item, position: newPosition } : item,
        );
        nextQueue.sort((a, b) => a.position - b.position);
        return nextQueue;
      }),
    onError: (_err, _variables, context) => {
      if (context?.previousQueue) {
        queryClient.setQueryData(watchKeys.queue(roomId), context.previousQueue);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: watchKeys.queue(roomId) });
    },
  });
}

export function useAdvanceQueue(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await advanceQueue(roomId);
      if (!res.ok) {
        throw new Error(res.message);
      }
      return res;
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: watchKeys.queue(roomId) });
      void queryClient.invalidateQueries({ queryKey: watchKeys.room(roomId) });
    },
  });
}

export function useTransferHost(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newHostId: string) => {
      const res = await transferHost({ roomId, newHostId });
      if (!res.ok) {
        throw new Error(res.message);
      }
      return res;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: watchKeys.room(roomId) });
    },
  });
}

export function useClaimHost(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await claimHost(roomId);
      if (!res.ok) {
        throw new Error(res.message);
      }
      return res;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: watchKeys.room(roomId) });
    },
  });
}

export function usePlayQueueItem(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await playQueueItem(roomId, itemId);
      if (!res.ok) {
        throw new Error(res.message);
      }
      return res;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: watchKeys.queue(roomId) });
      void queryClient.invalidateQueries({ queryKey: watchKeys.room(roomId) });
    },
  });
}
