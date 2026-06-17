'use client';

import React from 'react';
import { cn } from '@pumni/ui';

interface SyncIndicatorProps {
  status: 'host' | 'in-sync' | 'catching-up';
}

export function SyncIndicator({ status }: SyncIndicatorProps) {
  const configs = {
    host: {
      label: 'Host',
      className: 'bg-primary/10 text-primary border-primary/20',
      dotClass: '',
    },
    'in-sync': {
      label: 'Đồng bộ',
      className: 'bg-success/10 text-success border-success/20',
      dotClass: '',
    },
    'catching-up': {
      label: 'Cân bằng...',
      className: 'bg-warning/10 text-warning border-warning/20',
      dotClass: 'motion-safe:animate-ping',
    },
  };

  const config = configs[status];

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 type-caption font-medium border select-none transition-colors',
        config.className,
      )}
    >
      <span className="relative flex size-1.5">
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75',
            config.dotClass,
            'bg-current',
          )}
        />
        <span className="relative inline-flex size-1.5 rounded-full bg-current" />
      </span>
      {config.label}
    </span>
  );
}
