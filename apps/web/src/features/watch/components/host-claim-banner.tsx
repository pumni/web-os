'use client';

import { Button } from '@pumni/ui';
import { Crown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useClaimHost } from '../hooks/use-room-queue';

interface HostClaimBannerProps {
  roomId: string;
  broadcastRoomEvent: () => void;
}

export function HostClaimBanner({ roomId, broadcastRoomEvent }: HostClaimBannerProps) {
  const claim = useClaimHost(roomId);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-warning/20 bg-warning/10 px-4 py-2.5 select-none">
      <div className="flex items-center gap-2 type-caption text-warning font-medium">
        <AlertTriangle className="size-3.5 shrink-0" />
        <span className="font-medium">Phòng hiện không có chủ điều khiển.</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        disabled={claim.isPending}
        onClick={() =>
          claim.mutate(undefined, {
            onSuccess: () => {
              toast.success('Bạn đã trở thành chủ phòng!');
              broadcastRoomEvent();
            },
            onError: (err) => toast.error(err.message || 'Nhận quyền thất bại.'),
          })
        }
        className="h-7 border border-warning/20 px-3 type-caption font-semibold text-warning motion-safe:hover:bg-warning/15 shrink-0"
      >
        <Crown className="mr-1.5 size-3" />
        Nhận quyền
      </Button>
    </div>
  );
}
