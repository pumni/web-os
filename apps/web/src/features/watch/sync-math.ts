import type { PlaybackAnchor } from './types';

/**
 * Calculates where the playback head should be right now on the server timeline.
 */
export function calculateExpectedPosition(anchor: PlaybackAnchor, serverNowMs: number): number {
  let expected = anchor.anchorPosition;
  if (anchor.isPlaying) {
    expected += ((serverNowMs - anchor.anchorServerTs) / 1000) * anchor.playbackRate;
  }
  return expected;
}

export interface DriftThresholds {
  deadband: number;
  hardSeek: number;
  nudge: number;
}

export type DriftAction = 'in-sync' | 'nudge' | 'seek';

/** Source-specific drift policy. Kept pure so both reducer tests and the player executor share it. */
export function getDriftThresholds(sourceType: string): DriftThresholds {
  const isYouTube = sourceType === 'youtube';
  return {
    deadband: isYouTube ? 1.0 : 0.3,
    hardSeek: isYouTube ? 2.0 : 1.5,
    nudge: isYouTube ? 0.07 : 0.05,
  };
}

export function classifyDrift(absDrift: number, thresholds: DriftThresholds): DriftAction {
  if (absDrift < thresholds.deadband) return 'in-sync';
  if (absDrift < thresholds.hardSeek) return 'nudge';
  return 'seek';
}

/** Shift playback rate one step toward the host, clamped to the player's safe range. */
export function nudgedRate(anchorRate: number, drift: number, nudgeStep: number): number {
  return Math.max(0.5, Math.min(2.0, anchorRate + Math.sign(drift) * nudgeStep));
}

export function shouldAcceptPlaybackAnchor(current: PlaybackAnchor, incoming: PlaybackAnchor) {
  // Unversioned incoming = a persisted (postgres_changes) snapshot. With the
  // low-latency broadcast path (ADR-0011), a versioned live anchor can already
  // be current, so accept the snapshot only if it is strictly newer — a delayed
  // DB event must not clobber a fresher broadcast.
  if (!incoming.originSessionId || incoming.sequence === undefined) {
    return incoming.anchorServerTs > current.anchorServerTs;
  }
  if (current.originSessionId !== incoming.originSessionId) return true;
  if (current.sequence === undefined) return true;
  return incoming.sequence > current.sequence;
}

export interface ClockSample {
  /** Estimated (server - local) offset in ms for this probe. */
  offset: number;
  /** Round-trip time in ms for this probe. */
  rtt: number;
}

/**
 * Cristian's-algorithm sample selection: the probe with the smallest round-trip
 * time has the tightest bound on clock-offset error from path asymmetry, so it
 * is the best estimate. Returns null for an empty set.
 */
export function selectBestClockSample(samples: readonly ClockSample[]): ClockSample | null {
  if (samples.length === 0) return null;
  return samples.reduce((best, sample) => (sample.rtt < best.rtt ? sample : best));
}

export function shouldAcceptPersistedAnchorSnapshot(
  current: PlaybackAnchor,
  incoming: PlaybackAnchor,
) {
  if (!current.originSessionId || current.sequence === undefined) return true;
  return incoming.anchorServerTs >= current.anchorServerTs;
}

/**
 * Extracts the 11-character video ID from a YouTube link or ID.
 */
export function extractYouTubeId(urlOrId: string): string | null {
  const ytIdPattern = /^[a-zA-Z0-9_-]{11}$/;
  if (ytIdPattern.test(urlOrId)) return urlOrId;

  try {
    const urlObj = new URL(urlOrId);
    if (urlObj.hostname === 'youtu.be') {
      const id = urlObj.pathname.slice(1);
      if (ytIdPattern.test(id)) return id;
    } else if (urlObj.hostname.includes('youtube.com')) {
      if (urlObj.pathname === '/watch') {
        const id = urlObj.searchParams.get('v');
        if (id && ytIdPattern.test(id)) return id;
      } else if (urlObj.pathname.startsWith('/embed/')) {
        const id = urlObj.pathname.split('/')[2];
        if (id && ytIdPattern.test(id)) return id;
      }
    }
  } catch {
    // ignore parsing errors
  }
  return null;
}

/**
 * Validates if a string is a valid http or https URL.
 */
export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Trả về một vị trí double precision nằm giữa hai vị trí trước và sau.
 * Dùng cho fractional indexing để sắp xếp danh sách mà chỉ cần update 1 dòng.
 */
export function fractionalPosition(before: number | null, after: number | null): number {
  if (before === null && after === null) return 0.0;
  if (before === null) return after! - 1.0;
  if (after === null) return before! + 1.0;
  return (before + after) / 2.0;
}

/**
 * Computes a structural signature for a watch room.
 * This signature changes only when structural fields (source type, source ref, host, or active queue item) change.
 */
export function getStructuralSignature(room: {
  source_type: string;
  source_ref: string;
  host_id: string;
  current_queue_item_id: string | null;
}): string {
  return `${room.source_type}|${room.source_ref}|${room.host_id}|${room.current_queue_item_id || ''}`;
}
