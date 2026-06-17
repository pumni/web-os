'use client';

import React, { useState } from 'react';
import { Button, Input, Tabs, TabsList, TabsTrigger, cn } from '@pumni/ui';
import { Plus, Trash2, Play, Music, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAddQueueItem,
  useRemoveQueueItem,
  useReorderQueue,
  useAdvanceQueue,
} from '../hooks/use-room-queue';
import type { QueueItem, QueueBroadcastEvent } from '../types';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PlaylistPanelProps {
  roomId: string;
  items: QueueItem[];
  currentQueueItemId: string | null;
  isHost: boolean;
  broadcastQueueEvent: (e: QueueBroadcastEvent) => void;
}

export function PlaylistPanel({
  roomId,
  items,
  currentQueueItemId,
  isHost,
  broadcastQueueEvent,
}: PlaylistPanelProps) {
  const [sourceType, setSourceType] = useState<'youtube' | 'url'>('youtube');
  const [sourceRef, setSourceRef] = useState('');
  const [title, setTitle] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(true);

  const addMutation = useAddQueueItem(roomId);
  const removeMutation = useRemoveQueueItem(roomId);
  const reorderMutation = useReorderQueue(roomId);
  const advanceMutation = useAdvanceQueue(roomId);

  const isPending =
    addMutation.isPending ||
    removeMutation.isPending ||
    reorderMutation.isPending ||
    advanceMutation.isPending;

  const currentItem = items.find((i) => i.id === currentQueueItemId);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceRef.trim()) {
      toast.error('Vui lòng nhập link hoặc ID video.');
      return;
    }

    const currentTitle = title.trim();
    const currentSourceRef = sourceRef.trim();

    addMutation.mutate(
      {
        sourceType,
        sourceRef: currentSourceRef,
        title: currentTitle || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Đã thêm vào hàng chờ!');
          setSourceRef('');
          setTitle('');
          broadcastQueueEvent({ action: 'add', title: currentTitle || currentSourceRef });
        },
        onError: (err) => {
          toast.error(err.message || 'Thêm thất bại.');
        },
      },
    );
  };

  const handleRemoveItem = (itemId: string) => {
    const removed = items.find((i) => i.id === itemId);
    removeMutation.mutate(itemId, {
      onSuccess: () => {
        toast.success('Đã xóa khỏi hàng chờ!');
        broadcastQueueEvent({ action: 'remove', title: removed?.title ?? removed?.source_ref });
      },
      onError: (err) => {
        toast.error(err.message || 'Xóa thất bại.');
      },
    });
  };

  const handleAdvance = () => {
    advanceMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Đã chuyển sang video tiếp theo!');
        broadcastQueueEvent({ action: 'advance' });
      },
      onError: (err) => {
        toast.error(err.message || 'Chuyển video thất bại.');
      },
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const without = items.filter((i) => i.id !== active.id);
    const newIndex = without.findIndex((i) => i.id === over.id);
    if (newIndex < 0) return;

    const before = newIndex - 1 >= 0 ? without[newIndex - 1] : null;
    const after = without[newIndex] ?? null;

    reorderMutation.mutate(
      {
        itemId: String(active.id),
        beforeId: before?.id ?? null,
        afterId: after?.id ?? null,
      },
      {
        onSuccess: () => {
          toast.success('Đã sắp xếp lại hàng chờ');
          broadcastQueueEvent({ action: 'reorder', title: undefined });
        },
        onError: (err) => {
          toast.error(err.message || 'Sắp xếp thất bại.');
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* Now Playing */}
      {currentItem && (
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-primary/20 bg-primary/10 shrink-0 select-none">
          <span className="relative flex size-2.5 shrink-0">
            <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="type-caption text-primary font-medium">Đang phát</span>
            <span className="truncate text-xs text-foreground font-medium leading-tight">
              {currentItem.title || currentItem.source_ref}
            </span>
          </div>
          {isHost && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAdvance}
              disabled={items.length === 0 || isPending}
              className="h-7 text-xs gap-1 text-primary border border-primary/20 motion-safe:hover:bg-primary/10 shrink-0"
            >
              <Play className="size-3 fill-current" />
              Tiếp
            </Button>
          )}
        </div>
      )}

      {/* Add Video — collapsible */}
      <div className="shrink-0">
        <Button
          variant="ghost"
          onClick={() => setIsAddOpen((prev) => !prev)}
          className={cn(
            'flex items-center gap-2 w-full rounded-lg border border-border px-3 py-2 h-auto text-xs transition-colors duration-(--duration-fast)',
            isAddOpen ? 'bg-muted' : 'bg-transparent motion-safe:hover:bg-muted/80',
          )}
        >
          <Plus className="size-3.5" />
          <span className="type-caption font-medium text-foreground">Thêm video</span>
          <span className="flex-1" />
          {isAddOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </Button>

        {isAddOpen && (
          <form onSubmit={handleAddItem} className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted mt-1.5">
            <div className="flex items-center justify-between">
              <span className="type-caption font-medium text-muted-foreground">Nguồn</span>
              <Tabs
                value={sourceType}
                onValueChange={(val) => setSourceType(val as 'youtube' | 'url')}
              >
                <TabsList className="h-6 p-0.5 bg-muted border border-border rounded-md gap-0.5">
                  <TabsTrigger value="youtube" className="text-xs h-5 px-2 py-0">
                    YT
                  </TabsTrigger>
                  <TabsTrigger value="url" className="text-xs h-5 px-2 py-0">
                    URL
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Input
              placeholder={sourceType === 'youtube' ? 'Link hoặc ID YouTube' : 'Link video MP4 / HLS'}
              value={sourceRef}
              onChange={(e) => setSourceRef(e.target.value)}
              disabled={isPending}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Tiêu đề gợi nhớ (tùy chọn)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              className="h-8 text-xs"
            />
            <Button type="submit" disabled={isPending} size="sm" className="h-8 text-xs w-full">
              <Plus className="size-3.5 mr-1.5" />
              Thêm vào hàng chờ
            </Button>
          </form>
        )}
      </div>

      {/* Queue List */}
      <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto min-h-0 pr-0.5">
        <div className="flex items-center justify-between shrink-0">
          <span className="type-label">Hàng chờ</span>
          <span className="type-caption text-muted-foreground tabular-nums">
            {items.length} video
          </span>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground select-none flex-1">
            <Music className="size-8 stroke-[1.5] mb-2 opacity-40" />
            <span className="type-caption">Hàng chờ trống</span>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-1">
                {items.map((item, idx) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    idx={idx}
                    currentQueueItemId={currentQueueItemId}
                    isPending={isPending}
                    handleRemoveItem={handleRemoveItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

interface SortableItemProps {
  item: QueueItem;
  idx: number;
  currentQueueItemId: string | null;
  isPending: boolean;
  handleRemoveItem: (id: string) => void;
}

// fallow-ignore-next-line complexity
function SortableItem({
  item,
  idx,
  currentQueueItemId,
  isPending,
  handleRemoveItem,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const isCurrent = item.id === currentQueueItemId;
  const isYoutube = item.source_type === 'youtube';

  const rowClass = cn(
    'group flex items-center gap-2 px-2 py-1.5 rounded-md border text-xs transition-all duration-(--duration-fast) ease-snappy',
    isCurrent
      ? 'border-primary/20 bg-primary/10 text-primary'
      : 'border-border bg-muted text-foreground motion-safe:hover:bg-muted/80',
    isDragging && 'opacity-60 shadow-sm scale-[1.02] border-primary/20',
  );
  const titleClass = cn(
    'truncate font-medium text-left leading-tight',
    isCurrent ? 'text-primary' : 'text-foreground',
  );
  const badgeClass = cn(
    'inline-flex w-fit items-center px-1 py-px rounded text-[10px] font-medium leading-none',
    isYoutube ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
  );
  const deleteClass = cn(
    'size-5 p-0 motion-safe:hover:bg-destructive/10 motion-safe:hover:text-destructive shrink-0 transition-opacity duration-(--duration-fast)',
    isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
    'text-muted-foreground',
  );

  return (
    <div ref={setNodeRef} style={style} className={rowClass}>
      {/* Index / Playing indicator */}
      <div className="size-5 flex items-center justify-center shrink-0">
        {isCurrent ? (
          <span className="relative flex size-2.5">
            <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
        ) : (
          <span className="text-muted-foreground font-mono tabular-nums leading-none text-[10px] opacity-50">
            {idx + 1}
          </span>
        )}
      </div>

      {/* Drag Handle */}
      <button
        type="button"
        className="size-5 flex items-center justify-center cursor-grab text-muted-foreground opacity-30 motion-safe:hover:text-muted-foreground motion-safe:hover:opacity-100 active:cursor-grabbing shrink-0 transition-colors"
        aria-label="Kéo để sắp xếp"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3" />
      </button>

      {/* Title + source type */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1 select-none">
        <span className={titleClass}>{item.title || item.source_ref}</span>
        <span className={badgeClass}>{isYoutube ? 'YouTube' : 'URL'}</span>
      </div>

      {/* Delete — visible on hover or always on current */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleRemoveItem(item.id)}
        disabled={isPending}
        className={deleteClass}
        aria-label="Xóa"
      >
        <Trash2 className="size-3" />
      </Button>
    </div>
  );
}