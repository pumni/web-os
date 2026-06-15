"use client";

import React, { useState } from "react";
import { Button, Input, Tabs, TabsList, TabsTrigger, cn } from "@pumni/ui";
import { Plus, Trash2, ChevronUp, ChevronDown, Play, Music, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  useAddQueueItem,
  useRemoveQueueItem,
  useReorderQueue,
  useAdvanceQueue,
} from "../hooks/use-room-queue";
import type { QueueItem, QueueBroadcastEvent } from "../types";

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  // Add item form state
  const [sourceType, setSourceType] = useState<"youtube" | "url">("youtube");
  const [sourceRef, setSourceRef] = useState("");
  const [title, setTitle] = useState("");

  // Mutation hooks
  const addMutation = useAddQueueItem(roomId);
  const removeMutation = useRemoveQueueItem(roomId);
  const reorderMutation = useReorderQueue(roomId);
  const advanceMutation = useAdvanceQueue(roomId);

  const isPending =
    addMutation.isPending ||
    removeMutation.isPending ||
    reorderMutation.isPending ||
    advanceMutation.isPending;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceRef.trim()) {
      toast.error("Vui lòng nhập link hoặc ID video.");
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
          toast.success("Đã thêm vào hàng chờ!");
          setSourceRef("");
          setTitle("");
          broadcastQueueEvent({ action: "add", title: currentTitle || currentSourceRef });
        },
        onError: (err) => {
          toast.error(err.message || "Thêm thất bại.");
        },
      },
    );
  };

  const handleRemoveItem = (itemId: string) => {
    const removed = items.find((i) => i.id === itemId);
    removeMutation.mutate(itemId, {
      onSuccess: () => {
        toast.success("Đã xóa khỏi hàng chờ!");
        broadcastQueueEvent({ action: "remove", title: removed?.title ?? removed?.source_ref });
      },
      onError: (err) => {
        toast.error(err.message || "Xóa thất bại.");
      },
    });
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const targetItem = items[index];
    if (!targetItem) return;

    // Đích lên trên 1 bậc: nằm giữa items[index-2] (trước) và items[index-1] (sau)
    const beforeItem = index - 2 >= 0 ? items[index - 2] : null;
    const afterItem = items[index - 1];
    if (!afterItem) return;

    reorderMutation.mutate(
      {
        itemId: targetItem.id,
        beforeId: beforeItem ? beforeItem.id : null,
        afterId: afterItem.id,
      },
      {
        onSuccess: () => {
          toast.success("Đã sắp xếp lại hàng chờ");
          broadcastQueueEvent({
            action: "reorder",
            title: targetItem.title ?? targetItem.source_ref,
          });
        },
        onError: (err) => {
          toast.error(err.message || "Sắp xếp thất bại.");
        },
      },
    );
  };

  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const targetItem = items[index];
    if (!targetItem) return;

    // Đích xuống dưới 1 bậc: nằm giữa items[index+1] (trước) và items[index+2] (sau)
    const beforeItem = items[index + 1];
    const afterItem = index + 2 < items.length ? items[index + 2] : null;
    if (!beforeItem) return;

    reorderMutation.mutate(
      {
        itemId: targetItem.id,
        beforeId: beforeItem.id,
        afterId: afterItem ? afterItem.id : null,
      },
      {
        onSuccess: () => {
          toast.success("Đã sắp xếp lại hàng chờ");
          broadcastQueueEvent({
            action: "reorder",
            title: targetItem.title ?? targetItem.source_ref,
          });
        },
        onError: (err) => {
          toast.error(err.message || "Sắp xếp thất bại.");
        },
      },
    );
  };

  const handleAdvance = () => {
    advanceMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Đã chuyển sang video tiếp theo!");
        broadcastQueueEvent({ action: "advance" });
      },
      onError: (err) => {
        toast.error(err.message || "Chuyển video thất bại.");
      },
    });
  };

  // dnd-kit sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Tránh kích hoạt nhầm khi click vào các nút hoặc input
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return; // ⚠️ BẮT BUỘC — thả ngoài list → over null
    if (active.id === over.id) return;

    const without = items.filter((i) => i.id !== active.id);
    const newIndex = without.findIndex((i) => i.id === over.id);
    if (newIndex < 0) return;

    // before = item đứng trước vị trí thả; after = item tại vị trí thả (trong mảng đã loại active)
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
          toast.success("Đã sắp xếp lại hàng chờ");
          broadcastQueueEvent({ action: "reorder", title: undefined });
        },
        onError: (err) => {
          toast.error(err.message || "Sắp xếp thất bại.");
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-75">
      {/* Host Controls */}
      {isHost && (
        <div className="flex justify-between items-center pb-2 select-none shrink-0">
          <span className="text-xs font-semibold text-muted-foreground">Điều khiển</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAdvance}
            disabled={items.length === 0 || isPending}
            className="h-7 text-xs gap-1.5 text-primary border border-primary/20 motion-safe:hover:bg-primary/10"
          >
            <Play className="size-3 fill-current" />
            Phát tiếp theo
          </Button>
        </div>
      )}

      {/* Add Item Form */}
      <form
        onSubmit={handleAddItem}
        className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted shrink-0"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Thêm video</span>
          <Tabs value={sourceType} onValueChange={(val) => setSourceType(val as "youtube" | "url")}>
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
          placeholder={sourceType === "youtube" ? "Link hoặc ID YouTube" : "Link video MP4 / HLS"}
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

      {/* Items List */}
      <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto min-h-0 pr-0.5">
        <div className="flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-muted-foreground">Hàng chờ</span>
          <span className="text-xs text-muted-foreground/60 tabular-nums">
            {items.length} video
          </span>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground/40 select-none flex-1">
            <Music className="size-8 stroke-[1.5] mb-2" />
            <span className="text-xs">Hàng chờ trống</span>
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
                    itemsCount={items.length}
                    currentQueueItemId={currentQueueItemId}
                    isPending={isPending}
                    handleMoveUp={handleMoveUp}
                    handleMoveDown={handleMoveDown}
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
  itemsCount: number;
  currentQueueItemId: string | null;
  isPending: boolean;
  handleMoveUp: (idx: number) => void;
  handleMoveDown: (idx: number) => void;
  handleRemoveItem: (id: string) => void;
}

function SortableItem({
  item,
  idx,
  itemsCount,
  currentQueueItemId,
  isPending,
  handleMoveUp,
  handleMoveDown,
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
  const isYoutube = item.source_type === "youtube";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 px-2 py-1.5 rounded-md border text-xs transition-all duration-(--duration-fast) ease-snappy",
        isCurrent
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-border bg-muted text-foreground motion-safe:hover:bg-muted/80",
        isDragging && "opacity-60 shadow-sm scale-[1.02] border-primary/20",
      )}
    >
      {/* Index / Playing indicator */}
      <div className="size-5 flex items-center justify-center shrink-0">
        {isCurrent ? (
          <span className="relative flex size-2.5">
            <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
        ) : (
          <span className="text-muted-foreground/40 font-mono tabular-nums leading-none text-[10px]">
            {idx + 1}
          </span>
        )}
      </div>

      {/* Grip Drag Handle */}
      <button
        type="button"
        className="size-5 flex items-center justify-center cursor-grab text-muted-foreground/30 motion-safe:hover:text-muted-foreground active:cursor-grabbing shrink-0 transition-colors"
        aria-label="Kéo để sắp xếp"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3" />
      </button>

      {/* Title + source type */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1 select-none">
        <span
          className={cn(
            "truncate font-medium text-left leading-tight",
            isCurrent ? "text-primary" : "text-foreground",
          )}
        >
          {item.title || item.source_ref}
        </span>
        <span
          className={cn(
            "inline-flex w-fit items-center px-1 py-px rounded text-[10px] font-medium leading-none",
            isYoutube ? "bg-destructive/10 text-destructive/80" : "bg-muted text-muted-foreground",
          )}
        >
          {isYoutube ? "YouTube" : "URL"}
        </span>
      </div>

      {/* Action buttons — visible only on hover (or always on current) */}
      <div
        className={cn(
          "flex items-center gap-0.5 transition-opacity duration-(--duration-fast)",
          "opacity-0 group-hover:opacity-100",
          isCurrent && "opacity-100",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleMoveUp(idx)}
          disabled={idx === 0 || isPending}
          className="size-5 p-0 motion-safe:hover:bg-muted/60"
          aria-label="Di chuyển lên"
        >
          <ChevronUp className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleMoveDown(idx)}
          disabled={idx === itemsCount - 1 || isPending}
          className="size-5 p-0 motion-safe:hover:bg-muted/60"
          aria-label="Di chuyển xuống"
        >
          <ChevronDown className="size-3" />
        </Button>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleRemoveItem(item.id)}
          disabled={isPending}
          className="size-5 p-0 motion-safe:hover:bg-destructive/10 text-muted-foreground/50 motion-safe:hover:text-destructive"
          aria-label="Xóa"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  );
}
