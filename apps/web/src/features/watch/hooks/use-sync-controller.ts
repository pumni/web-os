'use client';

import { useRef, useState, useEffect } from 'react';
import type {
  MediaPlayerInstance,
  MediaPlayEvent,
  MediaPauseEvent,
  MediaSeekedEvent,
} from '@vidstack/react';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';
import type { PlaybackAnchor, Room } from '../types';
import { calculateExpectedPosition } from '../sync-math';

// ---------------------------------------------------------------------------
// Pure helpers — no side-effects, no refs
// ---------------------------------------------------------------------------

type DriftThresholds = {
  deadband: number;
  hardSeek: number;
  nudge: number;
};

function getDriftThresholds(sourceType: string): DriftThresholds {
  const isYouTube = sourceType === 'youtube';
  return {
    deadband: isYouTube ? 1.0 : 0.3,
    hardSeek: isYouTube ? 2.0 : 1.5,
    nudge: isYouTube ? 0.07 : 0.05,
  };
}

type DriftAction = 'in-sync' | 'nudge' | 'seek';

function classifyDrift(absDrift: number, thresholds: DriftThresholds): DriftAction {
  if (absDrift < thresholds.deadband) return 'in-sync';
  if (absDrift < thresholds.hardSeek) return 'nudge';
  return 'seek';
}

function matchTransportState(
  player: MediaPlayerInstance,
  anchor: PlaybackAnchor,
  tryPlay: (p: MediaPlayerInstance) => void,
  markProgrammatic: () => void,
) {
  if (anchor.isPlaying && player.paused) {
    tryPlay(player);
  } else if (!anchor.isPlaying && !player.paused) {
    markProgrammatic();
    player.pause().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSyncController(
  playerRef: React.RefObject<MediaPlayerInstance | null>,
  room: Room,
  isHost: boolean,
  serverClock: () => number,
  broadcastAnchor: (anchor: PlaybackAnchor) => void,
) {
  const [syncStatus, setSyncStatus] = useState<'host' | 'in-sync' | 'catching-up'>(
    isHost ? 'host' : 'in-sync',
  );

  // Follower sync lock states (client-side only)
  const [isFollowingHost, setIsFollowingHost] = useState<boolean>(true);
  const isFollowingHostRef = useRef<boolean>(true);

  const [prevIsHost, setPrevIsHost] = useState(isHost);
  if (isHost !== prevIsHost) {
    setPrevIsHost(isHost);
    setIsFollowingHost(true);
    setSyncStatus(isHost ? 'host' : 'in-sync');
  }

  useEffect(() => {
    isFollowingHostRef.current = true;
  }, [isHost]);

  const [needsGesture, setNeedsGesture] = useState(false);
  const needsGestureRef = useRef(false);

  const anchorRef = useRef<PlaybackAnchor>({
    isPlaying: room.is_playing,
    anchorPosition: room.anchor_position,
    anchorServerTs: new Date(room.anchor_server_ts).getTime(),
    playbackRate: room.playback_rate,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync anchorRef when room prop updates from server
  useEffect(() => {
    anchorRef.current = {
      isPlaying: room.is_playing,
      anchorPosition: room.anchor_position,
      anchorServerTs: new Date(room.anchor_server_ts).getTime(),
      playbackRate: room.playback_rate,
    };
  }, [room.is_playing, room.anchor_position, room.anchor_server_ts, room.playback_rate]);

  // Cleanup DB update debounce timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Persist playback state to database
  const persistAnchor = (anchor: PlaybackAnchor) => {
    if (!isHost) return;
    const supabase = createSupabaseBrowserClient();
    supabase
      .from('watch_rooms')
      .update({
        is_playing: anchor.isPlaying,
        anchor_position: anchor.anchorPosition,
        anchor_server_ts: new Date(anchor.anchorServerTs).toISOString(),
        playback_rate: anchor.playbackRate,
        last_active_at: new Date().toISOString(), // Keep-alive heartbeat update on state change
        updated_at: new Date().toISOString(),
      })
      .eq('id', room.id)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to update watch room database anchor', error);
        }
      });
  };

  const persistAnchorRef = useRef(persistAnchor);
  useEffect(() => {
    persistAnchorRef.current = persistAnchor;
  });

  // Flush the latest anchor immediately when the host leaves, bypassing the
  // 2s debounce, so a late-joiner doesn't inherit a stale anchor.
  useEffect(() => {
    if (!isHost) return;
    const flush = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      persistAnchorRef.current(anchorRef.current);
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [isHost]);

  // Debounced database updates to avoid overloading the DB
  const debouncedPersist = (anchor: PlaybackAnchor) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      persistAnchor(anchor);
    }, 2000);
  };

  // Host broadcasts playback status and triggers DB sync
  const emitAnchor = () => {
    const player = playerRef.current;
    if (!player) return;

    const newAnchor: PlaybackAnchor = {
      isPlaying: !player.paused,
      anchorPosition: player.currentTime,
      anchorServerTs: serverClock(),
      playbackRate: player.playbackRate,
    };

    anchorRef.current = newAnchor;
    broadcastAnchor(newAnchor);
    debouncedPersist(newAnchor);
  };

  // Robust play: browsers block unmuted autoplay without a user gesture.
  // Fall back to muted autoplay (always allowed); if even that fails, surface
  // a tap-to-play overlay via needsGesture.
  // Cửa sổ ức chế: bỏ qua event play/pause/seeked do CHÍNH reconcile/resync phát ra
  // (programmatic). Cần thiết vì isOriginTrusted KHÔNG đáng tin trên provider YouTube
  // (event tổng hợp từ iframe API) — trước đây gây ngắt đồng bộ nhầm khi host pause.
  const programmaticUntilRef = useRef(0);
  const PROGRAMMATIC_WINDOW_MS = 800; // YouTube bridge async; tinh chỉnh nếu cần
  const markProgrammatic = () => {
    programmaticUntilRef.current = Date.now() + PROGRAMMATIC_WINDOW_MS;
  };
  const isWithinProgrammaticWindow = () => Date.now() < programmaticUntilRef.current;

  // Robust play: browsers block unmuted autoplay without a user gesture.
  // Fall back to muted autoplay (always allowed); if even that fails, surface
  // a tap-to-play overlay via needsGesture.
  const tryPlay = (player: MediaPlayerInstance) => {
    markProgrammatic();
    player.play().catch(() => {
      markProgrammatic();
      player.muted = true;
      player.play().catch(() => {
        needsGestureRef.current = true;
        setNeedsGesture(true);
      });
    });
  };

  // Follower drift reconciliation loop
  const reconcile = () => {
    const player = playerRef.current;
    // Bypassed if client is not following host or if client is host
    if (!player || isHost || !isFollowingHostRef.current) return;

    const anchor = anchorRef.current;
    const now = serverClock();

    // Calculate the expected position of the playback head using pure helper
    const expected = calculateExpectedPosition(anchor, now);

    // 1) Match play/pause state
    matchTransportState(player, anchor, tryPlay, markProgrammatic);

    // 2) Match position according to drift tolerance thresholds
    const drift = expected - player.currentTime;
    const absDrift = Math.abs(drift);
    const thresholds = getDriftThresholds(room.source_type);
    const action = classifyDrift(absDrift, thresholds);

    switch (action) {
      case 'in-sync':
        if (player.playbackRate !== anchor.playbackRate) {
          player.playbackRate = anchor.playbackRate;
        }
        setSyncStatus('in-sync');
        break;
      case 'nudge': {
        const adjustedRate = anchor.playbackRate + Math.sign(drift) * thresholds.nudge;
        player.playbackRate = Math.max(0.5, Math.min(2.0, adjustedRate));
        setSyncStatus('catching-up');
        break;
      }
      case 'seek':
        if (Math.abs(player.currentTime - expected) > 0.01) {
          markProgrammatic();
          player.currentTime = expected;
        }
        player.playbackRate = anchor.playbackRate;
        setSyncStatus('catching-up');
        break;
    }
  };

  const reconcileRef = useRef(reconcile);
  useEffect(() => {
    reconcileRef.current = reconcile;
  });

  // Detect follower manual interaction
  const handleFollowerManualInteraction = () => {
    if (isHost) return;
    // Follower broke sync
    isFollowingHostRef.current = false;
    setIsFollowingHost(false);
    setSyncStatus('catching-up');
  };

  // Command to catch up with host immediately
  const resync = () => {
    isFollowingHostRef.current = true;
    setIsFollowingHost(true);

    const player = playerRef.current;
    const anchor = anchorRef.current;
    if (!player) return;

    const expected = calculateExpectedPosition(anchor, serverClock());
    if (Math.abs(player.currentTime - expected) > 0.01) {
      markProgrammatic();
      player.currentTime = expected;
    }
    player.playbackRate = anchor.playbackRate;

    matchTransportState(player, anchor, tryPlay, markProgrammatic);
  };

  // Called from the tap-to-play overlay (a real user gesture).
  const resumeFromGesture = () => {
    needsGestureRef.current = false;
    setNeedsGesture(false);
    const player = playerRef.current;
    if (player) player.muted = false;
    resync();
  };

  // Handle incoming broadcast updates
  const handleReceiveAnchor = (newAnchor: PlaybackAnchor) => {
    anchorRef.current = newAnchor;
    if (isHost) return;

    // Mỗi anchor nhận được là MỘT lệnh transport có chủ đích của host (host không
    // broadcast theo nhịp). → Tự gom follower về đồng bộ kể cả khi đang lệch.
    if (!isFollowingHostRef.current) {
      isFollowingHostRef.current = true;
      setIsFollowingHost(true);
    }
    reconcile();
  };

  // Periodically check sync for followers
  useEffect(() => {
    if (isHost) return;

    const interval = setInterval(() => {
      reconcileRef.current();
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost]);

  const isFollowerManualEvent = (e?: { isOriginTrusted?: boolean }) =>
    !isWithinProgrammaticWindow() && e?.isOriginTrusted !== false;

  // Player event handlers
  const handlePlay = (e?: MediaPlayEvent) => {
    if (isHost) {
      emitAnchor();
    } else if (isFollowerManualEvent(e)) {
      handleFollowerManualInteraction();
    }
  };

  const handlePause = (e?: MediaPauseEvent) => {
    if (isHost) {
      emitAnchor();
    } else if (isFollowerManualEvent(e)) {
      handleFollowerManualInteraction();
    }
  };

  const handleRateChange = () => {
    if (isHost) emitAnchor();
  };

  const handleSeeked = (detail?: number, e?: MediaSeekedEvent) => {
    if (isHost) {
      emitAnchor();
    } else if (isFollowerManualEvent(e)) {
      handleFollowerManualInteraction();
    }
  };

  return {
    syncStatus,
    isFollowingHost,
    needsGesture,
    resync,
    resumeFromGesture,
    handleReceiveAnchor,
    playerHandlers: {
      onPlay: handlePlay,
      onPause: handlePause,
      onRateChange: handleRateChange,
      onSeeked: handleSeeked,
    },
  };
}
