'use client';

import React from 'react';
import { Badge } from '@pumni/ui/feedback';

interface SyncIndicatorProps {
  status: 'host' | 'in-sync' | 'catching-up';
}

export function SyncIndicator({ status }: SyncIndicatorProps) {
  const configs = {
    host: {
      label: 'Host',
      tone: 'primary' as const,
      pulse: false,
    },
    'in-sync': {
      label: 'Đồng bộ',
      tone: 'success' as const,
      pulse: false,
    },
    'catching-up': {
      label: 'Cân bằng...',
      tone: 'warning' as const,
      pulse: true,
    },
  };

  const config = configs[status];

  return (
    <Badge tone={config.tone} pulse={config.pulse} size="sm" role="status" aria-live="polite">
      {config.label}
    </Badge>
  );
}
