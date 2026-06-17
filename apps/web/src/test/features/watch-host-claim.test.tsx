import * as React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useHostClaimState } from '@/features/watch/hooks/use-host-claim-state';

function Probe({ isHost, hostPresent }: { isHost: boolean; hostPresent: boolean }) {
  const showClaim = useHostClaimState(isHost, hostPresent);
  return <span data-testid="claim">{showClaim ? 'visible' : 'hidden'}</span>;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useHostClaimState', () => {
  it('hides the banner on initial render, even when no host is present', () => {
    render(<Probe isHost={false} hostPresent={false} />);
    expect(screen.getByTestId('claim')).toHaveTextContent('hidden');
  });

  it('reveals the banner after the 10s grace period when no host is present', () => {
    render(<Probe isHost={false} hostPresent={false} />);
    expect(screen.getByTestId('claim')).toHaveTextContent('hidden');

    act(() => {
      vi.advanceTimersByTime(9_999);
    });
    expect(screen.getByTestId('claim')).toHaveTextContent('hidden');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('claim')).toHaveTextContent('visible');
  });

  it('keeps the banner hidden when the local user is the host', () => {
    render(<Probe isHost hostPresent={false} />);
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByTestId('claim')).toHaveTextContent('hidden');
  });

  it('keeps the banner hidden when a remote host is present', () => {
    render(<Probe isHost={false} hostPresent />);
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByTestId('claim')).toHaveTextContent('hidden');
  });

  it('hides the banner immediately when a host reappears', () => {
    const { rerender } = render(<Probe isHost={false} hostPresent={false} />);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByTestId('claim')).toHaveTextContent('visible');

    rerender(<Probe isHost={false} hostPresent />);
    expect(screen.getByTestId('claim')).toHaveTextContent('hidden');
  });

  it('hides the banner immediately when the local user becomes host', () => {
    const { rerender } = render(<Probe isHost={false} hostPresent={false} />);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByTestId('claim')).toHaveTextContent('visible');

    rerender(<Probe isHost hostPresent={false} />);
    expect(screen.getByTestId('claim')).toHaveTextContent('hidden');
  });
});
