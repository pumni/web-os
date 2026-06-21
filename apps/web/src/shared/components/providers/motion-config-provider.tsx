'use client';

import * as React from 'react';
import { MotionConfig } from '@pumni/ui';

export function MotionConfigProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
