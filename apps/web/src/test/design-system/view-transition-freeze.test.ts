import { describe, expect, it, vi } from 'vitest';

import { withViewTransition } from '@pumni/ui/lib/view-transition';

describe('withViewTransition Freeze Coordinator', () => {
  it('sets and removes vtFreeze during transition lifecycle', async () => {
    // Mock window.matchMedia since jsdom does not implement it by default
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Mock startViewTransition to execute the callback and return transition promises
    const readyMock = Promise.resolve();
    const finishedMock = Promise.resolve();
    const startViewTransitionMock = vi.fn().mockImplementation((cb) => {
      cb();
      return {
        ready: readyMock,
        finished: finishedMock,
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).startViewTransition = startViewTransitionMock;

    let called = false;
    withViewTransition(() => {
      called = true;
      // During callback, vtFreeze should be set on documentElement
      expect(document.documentElement.dataset.vtFreeze).toBe('');
    });

    expect(called).toBe(true);
    expect(startViewTransitionMock).toHaveBeenCalled();

    // Wait for promises to resolve to verify cleanup
    await finishedMock;
    expect(document.documentElement.dataset.vtFreeze).toBeUndefined();

    // Cleanup mocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).startViewTransition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).matchMedia;
  });
});
