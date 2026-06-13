"use client";

import React from "react";
import { cn } from "@pumni/ui";

interface SyncIndicatorProps {
  status: "host" | "in-sync" | "catching-up";
}

export function SyncIndicator({ status }: SyncIndicatorProps) {
  const configs = {
    host: {
      label: "Host",
      className: "bg-primary/10 text-primary border-primary/20",
    },
    "in-sync": {
      label: "Đồng bộ",
      className: "bg-success/10 text-success border-success/20",
    },
    "catching-up": {
      label: "Cân bằng...",
      className: "bg-warning/10 text-warning border-warning/20",
    },
  };

  const config = configs[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-medium border select-none transition-colors",
        config.className
      )}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "currentColor" }} />
      {config.label}
    </span>
  );
}
