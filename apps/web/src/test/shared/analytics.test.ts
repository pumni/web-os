import { describe, it, expect, vi, beforeEach } from 'vitest';

declare global {
  var mockCapture: import('vitest').Mock;
  var mockShutdown: import('vitest').Mock;
  var mockPostHogConstructor: import('vitest').Mock;
}

// 1. Define global spies at the very top of the module scope
globalThis.mockCapture = vi.fn();
globalThis.mockShutdown = vi.fn().mockResolvedValue(undefined);

// 2. Mock using a real class that delegates to the global spies
vi.mock('posthog-node', () => {
  class MockPostHog {
    constructor(token: string, options?: unknown) {
      globalThis.mockPostHogConstructor(token, options);
    }
    capture(...args: unknown[]) {
      return globalThis.mockCapture(...args);
    }
    shutdown(...args: unknown[]) {
      return globalThis.mockShutdown(...args);
    }
  }
  
  globalThis.mockPostHogConstructor = vi.fn();

  return {
    PostHog: MockPostHog,
    default: MockPostHog,
  };
});

import { captureServerEvent } from '../../shared/lib/analytics';
import { serverEnv } from '@pumni/env/server';

vi.mock('@pumni/env/server', () => ({
  serverEnv: {
    NEXT_PUBLIC_POSTHOG_TOKEN: undefined,
    NEXT_PUBLIC_POSTHOG_HOST: undefined,
  },
}));

vi.mock('server-only', () => ({}));

describe('Server-side Analytics (captureServerEvent)', () => {
  const mockCapture = globalThis.mockCapture;
  const mockShutdown = globalThis.mockShutdown;
  const mockConstructor = globalThis.mockPostHogConstructor;

  beforeEach(() => {
    vi.resetAllMocks();
    serverEnv.NEXT_PUBLIC_POSTHOG_TOKEN = undefined;
    serverEnv.NEXT_PUBLIC_POSTHOG_HOST = undefined;
  });

  it('skips tracking and does not instantiate PostHog if NEXT_PUBLIC_POSTHOG_TOKEN is missing', async () => {
    await captureServerEvent('user_123', 'test_event', { key: 'value' });
    expect(mockConstructor).not.toHaveBeenCalled();
  });

  it('instantiates PostHog and captures event when NEXT_PUBLIC_POSTHOG_TOKEN is present', async () => {
    serverEnv.NEXT_PUBLIC_POSTHOG_TOKEN = 'test_token';
    serverEnv.NEXT_PUBLIC_POSTHOG_HOST = 'https://test.posthog.com';

    await captureServerEvent('user_123', 'test_event', { key: 'value' });

    expect(mockConstructor).toHaveBeenCalledWith('test_token', {
      host: 'https://test.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });

    expect(mockCapture).toHaveBeenCalledWith({
      distinctId: 'user_123',
      event: 'test_event',
      properties: { key: 'value' },
    });
    expect(mockShutdown).toHaveBeenCalled();
  });
});
