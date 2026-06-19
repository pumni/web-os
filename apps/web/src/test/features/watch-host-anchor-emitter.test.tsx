import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MediaPlayerInstance } from '@vidstack/react';
import { useHostAnchorEmitter } from '@/features/watch/hooks/use-host-anchor-emitter';
import type { PlaybackAnchor } from '@/features/watch/types';

const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn();

const mockSupabase = {
  from: mockFrom,
};

vi.mock('@pumni/supabase/browser', () => ({
  createSupabaseBrowserClient: () => mockSupabase,
}));

describe('useHostAnchorEmitter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    mockEq.mockReturnValue({ then: (cb: (res: { error: null }) => void) => cb({ error: null }) });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces multiple normal anchor emissions, coalescing them', () => {
    const anchorRef = {
      current: {
        isPlaying: true, // match player paused state to avoid transport edge trigger
        anchorPosition: 0,
        anchorServerTs: 0,
        playbackRate: 1.0,
        sequence: 0,
        originSessionId: 'session-1',
      } as PlaybackAnchor,
    };

    const playerRef = {
      current: {
        paused: false,
        currentTime: 10,
        playbackRate: 1.0,
      } as unknown as MediaPlayerInstance,
    };

    const { result } = renderHook(() =>
      useHostAnchorEmitter({
        anchorRef,
        playerRef,
        roomId: 'room-123',
        isHost: true,
        serverClock: () => 1000,
      })
    );

    const emitAnchor = result.current;

    // Call emitAnchor 5 times within 40ms total elapsed
    act(() => {
      emitAnchor();
      vi.advanceTimersByTime(10);
      playerRef.current.currentTime = 11;
      emitAnchor();
      vi.advanceTimersByTime(10);
      playerRef.current.currentTime = 12;
      emitAnchor();
      vi.advanceTimersByTime(10);
      playerRef.current.currentTime = 13;
      emitAnchor();
      vi.advanceTimersByTime(10);
      playerRef.current.currentTime = 14;
      emitAnchor();
    });

    // None should be persisted yet as 250ms has not passed since the last call
    expect(mockUpdate).not.toHaveBeenCalled();

    // Advance by 250ms to let the debounce window of the last call expire
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Only 1 update should be persisted, matching the last currentTime = 14
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        anchor_position: 14,
      })
    );
  });

  it('persists immediately on transport state change edges without waiting', () => {
    const anchorRef = {
      current: {
        isPlaying: false,
        anchorPosition: 0,
        anchorServerTs: 0,
        playbackRate: 1.0,
        sequence: 0,
        originSessionId: 'session-1',
      } as PlaybackAnchor,
    };

    const playerRef = {
      current: {
        paused: true,
        currentTime: 5,
        playbackRate: 1.0,
      } as unknown as MediaPlayerInstance,
    };

    const { result } = renderHook(() =>
      useHostAnchorEmitter({
        anchorRef,
        playerRef,
        roomId: 'room-123',
        isHost: true,
        serverClock: () => 1000,
      })
    );

    const emitAnchor = result.current;

    // Transition: paused -> playing via overridePlaying: true (overridePlaying is specified)
    act(() => {
      emitAnchor({ overridePlaying: true });
    });

    // Should persist immediately in the same tick
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        is_playing: true,
        anchor_position: 5,
      })
    );
  });

  it('flushes pending anchor updates on unmount', () => {
    const anchorRef = {
      current: {
        isPlaying: true, // match player paused state to avoid transport edge trigger
        anchorPosition: 0,
        anchorServerTs: 0,
        playbackRate: 1.0,
        sequence: 0,
        originSessionId: 'session-1',
      } as PlaybackAnchor,
    };

    const playerRef = {
      current: {
        paused: false,
        currentTime: 20,
        playbackRate: 1.0,
      } as unknown as MediaPlayerInstance,
    };

    const { result, unmount } = renderHook(() =>
      useHostAnchorEmitter({
        anchorRef,
        playerRef,
        roomId: 'room-123',
        isHost: true,
        serverClock: () => 1000,
      })
    );

    // Call emitAnchor, which schedules a persist
    act(() => {
      result.current();
    });

    expect(mockUpdate).not.toHaveBeenCalled();

    // Unmount hook
    act(() => {
      unmount();
    });

    // Should flush the pending update immediately on unmount
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        anchor_position: 20,
      })
    );
  });

  it('flushes pending anchor updates when isHost becomes false', () => {
    const anchorRef = {
      current: {
        isPlaying: true, // match player paused state to avoid transport edge trigger
        anchorPosition: 0,
        anchorServerTs: 0,
        playbackRate: 1.0,
        sequence: 0,
        originSessionId: 'session-1',
      } as PlaybackAnchor,
    };

    const playerRef = {
      current: {
        paused: false,
        currentTime: 30,
        playbackRate: 1.0,
      } as unknown as MediaPlayerInstance,
    };

    let isHostVal = true;

    const { result, rerender } = renderHook(() =>
      useHostAnchorEmitter({
        anchorRef,
        playerRef,
        roomId: 'room-123',
        isHost: isHostVal,
        serverClock: () => 1000,
      })
    );

    // Call emitAnchor, which schedules a persist
    act(() => {
      result.current();
    });

    expect(mockUpdate).not.toHaveBeenCalled();

    // Change host status to false and rerender
    isHostVal = false;
    rerender();

    // Should flush the pending update immediately when host status flips to false
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        anchor_position: 30,
      })
    );
  });
});
