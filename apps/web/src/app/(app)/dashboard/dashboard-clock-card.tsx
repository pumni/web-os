"use client";

import * as React from "react";
import { Clock } from "lucide-react";

export function DashboardClockCard() {
  const [time, setTime] = React.useState<Date | null>(() => {
    if (typeof window !== "undefined") {
      return new Date();
    }
    return null;
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) {
    return (
      <div className="flex h-full flex-col justify-between min-h-[120px]">
        <div className="flex items-center justify-between text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider font-semibold">Time</span>
        </div>
        <div className="space-y-1">
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex h-full flex-col justify-between min-h-[120px] select-none">
      <div className="flex items-center justify-between text-muted-foreground">
        <Clock className="h-4 w-4 text-primary" />
        <span className="text-xs uppercase tracking-wider font-semibold">System Time</span>
      </div>
      <div className="mt-4 space-y-1">
        <div className="flex items-baseline gap-1 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          <span>{hours}</span>
          <span className="animate-pulse text-primary">:</span>
          <span>{minutes}</span>
          <span className="text-sm font-medium text-muted-foreground">:{seconds}</span>
        </div>
        <p className="text-xs font-medium text-muted-foreground">{formattedDate}</p>
      </div>
    </div>
  );
}
