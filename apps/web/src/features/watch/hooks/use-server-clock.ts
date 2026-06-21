'use client';

import { useEffect, useState, useRef } from 'react';
import { useTelemetryRef } from '@/shared/lib/observability';

import { selectBestClockSample, type ClockSample } from '../sync-math';

// Probe the server several times per sync and keep the lowest-RTT sample; a
// single half-RTT estimate is corrupted by an outlier round-trip (asymmetric
// delay), so one bad fetch must not skew the offset.
const PROBES_PER_SYNC = 3;
const SYNC_INTERVAL_MS = 300_000;

export function useServerClock() {
  const [ready, setReady] = useState(false);
  const [clockOffset, setClockOffset] = useState<number>(0);
  const clockOffsetRef = useRef<number>(0);
  const telemetryRef = useTelemetryRef();

  useEffect(() => {
    let active = true;
    let isFirstSync = true;

    async function probeOnce(): Promise<ClockSample | null> {
      try {
        const t0 = Date.now();
        const res = await fetch('/api/time');
        if (!res.ok) return null;
        const { now: serverNow } = await res.json();
        const t1 = Date.now();
        const rtt = t1 - t0;
        return { offset: serverNow - (t0 + rtt / 2), rtt };
      } catch {
        return null;
      }
    }

    async function syncClock() {
      const samples: ClockSample[] = [];
      for (let i = 0; i < PROBES_PER_SYNC; i++) {
        const sample = await probeOnce();
        if (!active) return;
        if (sample) samples.push(sample);
      }

      const best = selectBestClockSample(samples);
      if (!best) {
        telemetryRef.current.error(new Error('clock sync: all probes failed'), {
          scope: 'server-clock',
        });
        if (active && isFirstSync) {
          clockOffsetRef.current = 0;
          setClockOffset(0);
          setReady(true);
        }
        return;
      }

      // Light EMA to prevent the clock jumping abruptly during active sessions.
      const offset = isFirstSync ? best.offset : 0.8 * clockOffsetRef.current + 0.2 * best.offset;
      isFirstSync = false;
      clockOffsetRef.current = offset;
      setClockOffset(offset);
      setReady(true);
      telemetryRef.current.event('clock.offset', {
        offsetMs: Math.round(offset),
        rttMs: best.rtt,
        probes: samples.length,
      });
    }

    void syncClock();

    const interval = setInterval(() => {
      void syncClock();
    }, SYNC_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
    // telemetryRef is a stable ref; listed to satisfy exhaustive-deps without
    // re-running the clock sync.
  }, [telemetryRef]);

  const serverClock = () => Date.now() + clockOffsetRef.current;

  return {
    ready,
    clockOffset,
    serverClock,
  };
}
