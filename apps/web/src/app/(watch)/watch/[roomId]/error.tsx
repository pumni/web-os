"use client";

import { Button } from "@pumni/ui";

interface WatchRoomErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function WatchRoomError({ error, unstable_retry }: WatchRoomErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4 p-6 text-center select-none">
      <h2 className="text-base font-semibold text-foreground">
        Không tải được phòng xem chung
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={() => unstable_retry()}>Thử lại</Button>
    </div>
  );
}
