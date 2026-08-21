'use client';

// fallow-ignore-file security-client-server-leak -- Intentional: Next.js Server Action import verified safe on client boundary

import React, { useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Input, Label } from '@pumni/ui/form';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@pumni/ui/overlay';
import { toast } from 'sonner';

import { setRoomSource } from '../actions';
import { watchKeys } from '../query-keys';
import type { RoomBroadcastEvent } from '../types';
import { VideoSourceTabs } from './source-tabs';

interface SourceChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  broadcastRoomEvent: (event: RoomBroadcastEvent) => void;
}

/** Host-only command surface for changing the room media source. */
export function SourceChangeDialog({
  open,
  onOpenChange,
  roomId,
  broadcastRoomEvent,
}: SourceChangeDialogProps) {
  const queryClient = useQueryClient();
  const [sourceType, setSourceType] = useState<'youtube' | 'url'>('youtube');
  const [sourceRef, setSourceRef] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!sourceRef.trim()) {
      toast.error('Vui lòng nhập link hoặc ID video.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await setRoomSource({
          roomId,
          sourceType,
          sourceRef,
        });

        if (!result.ok) {
          toast.error(result.message || 'Đổi nguồn phát thất bại.');
          return;
        }

        toast.success('Đổi nguồn phát thành công!');
        onOpenChange(false);
        setSourceRef('');
        void queryClient.invalidateQueries({ queryKey: watchKeys.room(roomId) });
        broadcastRoomEvent({ action: 'source' });
      } catch (error) {
        toast.error('Có lỗi xảy ra.');
        console.error(error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="type-heading text-base">Đổi nguồn phát video</DialogTitle>
          <DialogDescription className="type-caption">
            Thay đổi nguồn phát video cho tất cả mọi người trong phòng.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="type-label">Nguồn video</Label>
              <VideoSourceTabs value={sourceType} onChange={setSourceType} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-source-ref" className="type-label">
                {sourceType === 'youtube' ? 'Link hoặc ID video YouTube' : 'Link video trực tiếp'}
              </Label>
              <Input
                id="new-source-ref"
                placeholder={
                  sourceType === 'youtube'
                    ? 'https://www.youtube.com/watch?v=...'
                    : 'https://example.com/video.mp4'
                }
                value={sourceRef}
                onChange={(event) => setSourceRef(event.target.value)}
                disabled={isPending}
                required
              />
            </div>
          </DialogBody>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
