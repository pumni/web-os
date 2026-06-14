"use client";

import React, { useState } from "react";
import { Button, Input, Tabs, TabsList, TabsTrigger, cn } from "@pumni/ui";
import { Plus, Trash2, ChevronUp, ChevronDown, Play, Music } from "lucide-react";
import { toast } from "sonner";
import {
  useAddQueueItem,
  useRemoveQueueItem,
  useReorderQueue,
  useAdvanceQueue,
} from "../hooks/use-room-queue";
import type { QueueItem, QueueBroadcastEvent } from "../types";

interface PlaylistPanelProps {
  roomId: string;
  items: QueueItem[];
  currentQueueItemId: string | null;
  isHost: boolean;
  broadcastQueueEvent: (e: QueueBroadcastEvent) => void;
}

export function PlaylistPanel({ roomId, items, currentQueueItemId, isHost, broadcastQueueEvent }: PlaylistPanelProps) {
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
      }
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
          broadcastQueueEvent({ action: "reorder", title: targetItem.title ?? targetItem.source_ref });
        },
        onError: (err) => {
          toast.error(err.message || "Sắp xếp thất bại.");
        },
      }
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
          broadcastQueueEvent({ action: "reorder", title: targetItem.title ?? targetItem.source_ref });
        },
        onError: (err) => {
          toast.error(err.message || "Sắp xếp thất bại.");
        },
      }
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

  return (
    <div className="flex flex-col gap-4 h-full min-h-[300px]">
      {/* Host Controls */}
      {isHost && (
        <div className="flex justify-between items-center border-b border-border/20 pb-3 select-none">
          <span className="text-xs font-semibold text-muted-foreground">Điều khiển</span>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={handleAdvance}
            disabled={items.length === 0 || isPending}
            className="text-xs hover:bg-primary/10 text-primary border border-primary/20"
          >
            <Play className="size-3 mr-1.5 fill-current" />
            Phát tiếp theo
          </Button>
        </div>
      )}

      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className="flex flex-col gap-2 p-3 rounded-lg border border-border/10 bg-background/30">
        <span className="text-[11px] font-semibold text-muted-foreground select-none">Thêm Video</span>
        
        <Tabs 
          value={sourceType} 
          onValueChange={(val) => setSourceType(val as "youtube" | "url")}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 h-7 p-0.5 bg-background/50 border border-border/20">
            <TabsTrigger value="youtube" className="text-[10px] py-0.5 h-full">YouTube</TabsTrigger>
            <TabsTrigger value="url" className="text-[10px] py-0.5 h-full">URL Video</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-1">
          <Input
            placeholder={sourceType === "youtube" ? "Link hoặc ID video YouTube" : "Link direct MP4, HLS (.m3u8)"}
            value={sourceRef}
            onChange={(e) => setSourceRef(e.target.value)}
            disabled={isPending}
            className="h-8 text-xs bg-background/20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Input
            placeholder="Tiêu đề gợi nhớ (Tùy chọn)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isPending}
            className="h-8 text-xs bg-background/20"
          />
        </div>

        <Button type="submit" disabled={isPending} size="sm" className="h-8 text-xs mt-1 w-full">
          <Plus className="size-3 mr-1.5" />
          Thêm vào hàng chờ
        </Button>
      </form>

      {/* Items List */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto max-h-[350px] pr-1">
        <span className="text-[11px] font-semibold text-muted-foreground select-none">
          Danh sách chờ ({items.length})
        </span>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground/50 select-none">
            <Music className="size-8 stroke-[1.5] mb-2" />
            <span className="text-xs">Chưa có video nào trong hàng chờ</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {items.map((item, idx) => {
              const isCurrent = item.id === currentQueueItemId;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg border text-xs transition-all",
                    isCurrent 
                      ? "border-primary/30 bg-primary/5 text-primary font-medium" 
                      : "border-border/10 bg-background/20 text-foreground"
                  )}
                >
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-2 select-none">
                    <span className="truncate pr-1 font-medium">
                      {item.title || item.source_ref}
                    </span>
                    <span className="text-[9px] text-muted-foreground capitalize">
                      {item.source_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Reorder Buttons */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0 || isPending}
                      className="size-6 h-6 p-0 hover:bg-background/40"
                      aria-label="Di chuyển lên"
                    >
                      <ChevronUp className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === items.length - 1 || isPending}
                      className="size-6 h-6 p-0 hover:bg-background/40"
                      aria-label="Di chuyển xuống"
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isPending}
                      className="size-6 h-6 p-0 hover:bg-destructive/10 text-destructive/80 hover:text-destructive"
                      aria-label="Xóa"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
