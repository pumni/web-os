import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useRoomChat } from '@/features/watch/hooks/use-room-chat';
import { isReactionEmoji } from '@/features/watch/reaction-emojis';
import type { MessageReaction, RoomRealtimeEvents } from '@/features/watch/types';

type ChatEvents = Pick<RoomRealtimeEvents, 'onChat' | 'onReaction' | 'onMessageReaction'>;

/** Stub room events that lets the test emit a remote message reaction. */
function makeEvents() {
  let handler: ((r: MessageReaction) => void) | null = null;
  const events: ChatEvents = {
    onChat: () => () => {},
    onReaction: () => () => {},
    onMessageReaction: (h) => {
      handler = h;
      return () => {
        handler = null;
      };
    },
  };
  return { events, emit: (r: MessageReaction) => handler?.(r) };
}

function setup() {
  const broadcast = vi.fn();
  const { events, emit } = makeEvents();
  const view = renderHook(() => useRoomChat('me', vi.fn(), vi.fn(), broadcast, events));
  return { ...view, broadcast, emit };
}

describe('isReactionEmoji', () => {
  it('accepts allowed emojis and rejects everything else', () => {
    expect(isReactionEmoji('❤️')).toBe(true);
    expect(isReactionEmoji('💣')).toBe(false);
    expect(isReactionEmoji(null)).toBe(false);
    expect(isReactionEmoji(42)).toBe(false);
  });
});

describe('useRoomChat — message reactions', () => {
  it('toggles the viewer reaction locally and broadcasts it', () => {
    const { result, broadcast } = setup();

    act(() => result.current.toggleMessageReaction('m1', '❤️'));
    expect(result.current.messageReactions).toEqual({ m1: { me: '❤️' } });
    expect(broadcast).toHaveBeenLastCalledWith({ messageId: 'm1', userId: 'me', emoji: '❤️' });

    // Toggling the same emoji clears it (and broadcasts the clear).
    act(() => result.current.toggleMessageReaction('m1', '❤️'));
    expect(result.current.messageReactions).toEqual({});
    expect(broadcast).toHaveBeenLastCalledWith({ messageId: 'm1', userId: 'me', emoji: null });
  });

  it('applies a remote reaction so both sides converge', () => {
    const { result, emit } = setup();

    act(() => result.current.toggleMessageReaction('m1', '❤️'));
    act(() => emit({ messageId: 'm1', userId: 'them', emoji: '👍' }));

    expect(result.current.messageReactions.m1).toEqual({ me: '❤️', them: '👍' });

    // A remote clear removes only that user's reaction.
    act(() => emit({ messageId: 'm1', userId: 'them', emoji: null }));
    expect(result.current.messageReactions.m1).toEqual({ me: '❤️' });
  });

  it('ignores malformed or disallowed emojis from the channel', () => {
    const { result, emit } = setup();

    act(() => emit({ messageId: 'm1', userId: 'them', emoji: '💣' }));
    expect(result.current.messageReactions.m1).toBeUndefined();
  });
});
