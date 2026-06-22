'use client';

import * as React from 'react';
import { MotionConfig } from '@pumni/ui/lib/motion-primitives';

export function MotionConfigProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
