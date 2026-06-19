'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';
import { watchKeys } from '../query-keys';
import {
  addQueueItem,
  removeQueueItem,
  reorderQueue,
  advanceQueue,
  transferHost,
  claimHost,
} from '../actions';
import { type QueueItem, QUEUE_ITEM_SELECT } from '../types';
import { fractionalPosition } from '../sync-math';
import { WATCH_ROOM_RECOVERY_REFETCH_MS, WATCH_ROOM_STALE_MS } from './use-room-query';

export function useQueueQuery(roomId: string, initialData: QueueItem[]) {
  return useQuery({
    queryKey: watchKeys.queue(roomId),
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      // fallow-ignore-next-line code-duplication
      const { data, error } = await supabase
        .from('watch_queue_items')
        .select(QUEUE_ITEM_SELECT)
        .eq('room_id', roomId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []) as QueueItem[];
    },
    initialData,
    staleTime: WATCH_ROOM_STALE_MS,
    refetchInterval: WATCH_ROOM_RECOVERY_REFETCH_MS,
    refetchIntervalInBackground: false,
    refetchOnReconnect: 'always',
    refetchOnWindowFocus: 'always',
  });
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
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: watchKeys.queue(roomId) });
      const previousQueue = queryClient.getQueryData<QueueItem[]>(watchKeys.queue(roomId)) || [];

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

      const nextQueue = [...previousQueue, optimisticItem];
      queryClient.setQueryData<QueueItem[]>(watchKeys.queue(roomId), nextQueue);

      return { previousQueue };
    },
    onError: (err, variables, context) => {
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
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: watchKeys.queue(roomId) });
      const previousQueue = queryClient.getQueryData<QueueItem[]>(watchKeys.queue(roomId)) || [];

      const nextQueue = previousQueue.filter((item) => item.id !== itemId);
      queryClient.setQueryData<QueueItem[]>(watchKeys.queue(roomId), nextQueue);

      return { previousQueue };
    },
    onError: (err, itemId, context) => {
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
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: watchKeys.queue(roomId) });
      const previousQueue = queryClient.getQueryData<QueueItem[]>(watchKeys.queue(roomId)) || [];

      const beforeItem = previousQueue.find((i) => i.id === variables.beforeId);
      const afterItem = previousQueue.find((i) => i.id === variables.afterId);
      const beforePosition = beforeItem ? beforeItem.position : null;
      const afterPosition = afterItem ? afterItem.position : null;
      const newPosition = fractionalPosition(beforePosition, afterPosition);

      const nextQueue = previousQueue.map((item) => {
        if (item.id === variables.itemId) {
          return { ...item, position: newPosition };
        }
        return item;
      });

      // Sort again by position
      nextQueue.sort((a, b) => a.position - b.position);

      queryClient.setQueryData<QueueItem[]>(watchKeys.queue(roomId), nextQueue);

      return { previousQueue };
    },
    onError: (err, variables, context) => {
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
