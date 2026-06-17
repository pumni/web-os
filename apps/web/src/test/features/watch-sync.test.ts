import { describe, it, expect, vi } from 'vitest';
import {
  calculateExpectedPosition,
  extractYouTubeId,
  isValidHttpUrl,
  getStructuralSignature,
} from '../../features/watch/sync-math';
import {
  classifyDrift,
  getDriftThresholds,
  matchTransportState,
} from '../../features/watch/hooks/use-sync-controller';

describe('Watch synced playback math & helpers', () => {
  describe('calculateExpectedPosition', () => {
    it('should return static position when video is paused', () => {
      const anchor = {
        isPlaying: false,
        anchorPosition: 42.5,
        anchorServerTs: 100000,
        playbackRate: 1.0,
      };
      // Server clock moves forward but video is paused
      const expected = calculateExpectedPosition(anchor, 150000);
      expect(expected).toBe(42.5);
    });

    it('should calculate correct position when video is playing at 1x speed', () => {
      const anchor = {
        isPlaying: true,
        anchorPosition: 10.0,
        anchorServerTs: 100000, // epoch ms
        playbackRate: 1.0,
      };
      // 5 seconds pass (5000ms)
      const expected = calculateExpectedPosition(anchor, 105000);
      expect(expected).toBe(15.0);
    });

    it('should calculate correct position when video is playing at 1.5x speed', () => {
      const anchor = {
        isPlaying: true,
        anchorPosition: 20.0,
        anchorServerTs: 100000,
        playbackRate: 1.5,
      };
      // 10 seconds pass (10000ms) -> should advance by 10 * 1.5 = 15 seconds
      const expected = calculateExpectedPosition(anchor, 110000);
      expect(expected).toBe(35.0);
    });
  });

  describe('extractYouTubeId', () => {
    it('should parse 11-char ID directly', () => {
      expect(extractYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should parse standard watch link', () => {
      expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should parse shortened link', () => {
      expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should parse embed link', () => {
      expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid YouTube links', () => {
      expect(extractYouTubeId('https://youtube.com/invalid')).toBeNull();
      expect(extractYouTubeId('not-eleven-chars')).toBeNull();
    });
  });

  describe('isValidHttpUrl', () => {
    it('should accept valid http and https links', () => {
      expect(isValidHttpUrl('https://example.com/video.mp4')).toBe(true);
      expect(isValidHttpUrl('http://localhost/stream.m3u8')).toBe(true);
    });

    it('should reject invalid urls and protocols', () => {
      expect(isValidHttpUrl('ftp://example.com')).toBe(false);
      expect(isValidHttpUrl('not-a-link')).toBe(false);
    });
  });

  describe('getStructuralSignature', () => {
    it('should return identical signature when structural fields are unchanged', () => {
      const room = {
        source_type: 'youtube' as const,
        source_ref: 'dQw4w9WgXcQ',
        host_id: 'user-1',
        current_queue_item_id: 'item-1',
        is_playing: false,
        anchor_position: 12.3,
      };

      const sig1 = getStructuralSignature(room);

      // Change anchor states
      const roomUpdated = {
        ...room,
        is_playing: true,
        anchor_position: 45.6,
      };

      const sig2 = getStructuralSignature(roomUpdated);
      expect(sig1).toBe(sig2);
    });

    it('should return different signature when structural fields change', () => {
      const room = {
        source_type: 'youtube' as const,
        source_ref: 'dQw4w9WgXcQ',
        host_id: 'user-1',
        current_queue_item_id: 'item-1',
      };

      const sig1 = getStructuralSignature(room);

      const roomWithNewSource = {
        ...room,
        source_ref: 'another-video',
      };

      const sig2 = getStructuralSignature(roomWithNewSource);
      expect(sig1).not.toBe(sig2);
    });
  });

  describe('getDriftThresholds', () => {
    it('uses wider tolerances for YouTube sources', () => {
      const t = getDriftThresholds('youtube');
      expect(t.deadband).toBe(1.0);
      expect(t.hardSeek).toBe(2.0);
      expect(t.nudge).toBe(0.07);
    });

    it('uses tighter tolerances for direct-URL sources', () => {
      const t = getDriftThresholds('url');
      expect(t.deadband).toBe(0.3);
      expect(t.hardSeek).toBe(1.5);
      expect(t.nudge).toBe(0.05);
    });
  });

  describe('classifyDrift', () => {
    it('reports in-sync while drift stays within the deadband', () => {
      const t = getDriftThresholds('youtube');
      expect(classifyDrift(0, t)).toBe('in-sync');
      expect(classifyDrift(0.999, t)).toBe('in-sync');
    });

    it('reports nudge once drift passes the deadband but stays below the hard-seek threshold', () => {
      const t = getDriftThresholds('youtube');
      expect(classifyDrift(1.0, t)).toBe('nudge');
      expect(classifyDrift(1.999, t)).toBe('nudge');
    });

    it('reports seek once drift reaches the hard-seek threshold', () => {
      const t = getDriftThresholds('youtube');
      expect(classifyDrift(2.0, t)).toBe('seek');
      expect(classifyDrift(5.0, t)).toBe('seek');
    });
  });

  describe('matchTransportState', () => {
    const pausedAnchor = { isPlaying: false, anchorPosition: 0, anchorServerTs: 0, playbackRate: 1 };
    const playingAnchor = { isPlaying: true, anchorPosition: 0, anchorServerTs: 0, playbackRate: 1 };

    it('calls tryPlay when the anchor is playing but the player is paused', () => {
      const tryPlay = vi.fn();
      const markProgrammatic = vi.fn();
      const player = { paused: true, pause: vi.fn().mockResolvedValue(undefined) };

      matchTransportState(player as never, playingAnchor, tryPlay, markProgrammatic);

      expect(tryPlay).toHaveBeenCalledWith(player);
      expect(markProgrammatic).not.toHaveBeenCalled();
      expect(player.pause).not.toHaveBeenCalled();
    });

    it('pauses the player (and marks the change programmatic) when the anchor is paused but the player is playing', () => {
      const tryPlay = vi.fn();
      const markProgrammatic = vi.fn();
      const player = { paused: false, pause: vi.fn().mockResolvedValue(undefined) };

      matchTransportState(player as never, pausedAnchor, tryPlay, markProgrammatic);

      expect(tryPlay).not.toHaveBeenCalled();
      expect(markProgrammatic).toHaveBeenCalledTimes(1);
      expect(player.pause).toHaveBeenCalledTimes(1);
    });

    it('does nothing when play/pause states already match', () => {
      const tryPlay = vi.fn();
      const markProgrammatic = vi.fn();

      // Both playing
      const playingPlayer = { paused: false, pause: vi.fn() };
      matchTransportState(playingPlayer as never, playingAnchor, tryPlay, markProgrammatic);
      // Both paused
      const pausedPlayer = { paused: true, pause: vi.fn() };
      matchTransportState(pausedPlayer as never, pausedAnchor, tryPlay, markProgrammatic);

      expect(tryPlay).not.toHaveBeenCalled();
      expect(markProgrammatic).not.toHaveBeenCalled();
      expect(playingPlayer.pause).not.toHaveBeenCalled();
      expect(pausedPlayer.pause).not.toHaveBeenCalled();
    });
  });
});
