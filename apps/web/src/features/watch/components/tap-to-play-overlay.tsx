"use client";

import { Button } from "@pumni/ui";
import { Play } from "lucide-react";

interface TapToPlayOverlayProps {
  onResume: () => void;
}

export function TapToPlayOverlay({ onResume }: TapToPlayOverlayProps) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm select-none">
      <p className="text-sm font-medium text-white/90">
        Trình duyệt đã chặn tự động phát.
      </p>
      <Button onClick={onResume} size="lg" className="gap-2">
        <Play className="size-5 fill-current" />
        Bấm để xem cùng phòng
      </Button>
    </div>
  );
}
