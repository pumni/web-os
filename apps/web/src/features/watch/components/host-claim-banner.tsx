"use client";

import { Button } from "@pumni/ui";
import { Crown } from "lucide-react";
import { toast } from "sonner";
import { useClaimHost } from "../hooks/use-room-queue";

interface HostClaimBannerProps {
  roomId: string;
}

export function HostClaimBanner({ roomId }: HostClaimBannerProps) {
  const claim = useClaimHost(roomId);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-xs text-warning select-none">
      <span>Phòng hiện không có chủ điều khiển.</span>
      <Button
        size="sm"
        variant="ghost"
        disabled={claim.isPending}
        onClick={() =>
          claim.mutate(undefined, {
            onSuccess: () => toast.success("Bạn đã trở thành chủ phòng!"),
            onError: (err) => toast.error(err.message || "Nhận quyền thất bại."),
          })
        }
        className="h-7 border border-warning/30 px-2.5 text-[10px] font-semibold text-warning hover:bg-warning/15"
      >
        <Crown className="mr-1 size-3" />
        Nhận quyền điều khiển
      </Button>
    </div>
  );
}
