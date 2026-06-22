'use client';

import { Button } from '@pumni/ui/form';
import { Play } from 'lucide-react';

interface TapToPlayOverlayProps {
  onResume: () => void;
}

export function TapToPlayOverlay({ onResume }: TapToPlayOverlayProps) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 overlay-scrim select-none">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="type-label text-foreground">Trình duyệt đã chặn tự động phát.</p>
        <Button onClick={onResume} size="lg" className="gap-2 shadow-sm shadow-primary/30">
          <Play className="size-5 fill-current" />
          Bấm để xem cùng phòng
        </Button>
      </div>
    </div>
  );
}
