'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

interface PostHogPageTrackerProps {
  eventName: string;
  properties?: Record<string, unknown>;
}

export function PostHogPageTracker({ eventName, properties }: PostHogPageTrackerProps) {
  useEffect(() => {
    posthog.capture(eventName, properties);
  }, [eventName, properties]);

  return null;
}
