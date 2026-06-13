"use client";

import { useEffect, useState, useRef } from "react";

export function useServerClock() {
  const [ready, setReady] = useState(false);
  const [clockOffset, setClockOffset] = useState<number>(0);
  const clockOffsetRef = useRef<number>(0);

  useEffect(() => {
    let active = true;
    let isFirstSync = true;

    async function syncClock() {
      try {
        const t0 = Date.now();
        const res = await fetch("/api/time");
        if (!res.ok) throw new Error("Failed to fetch server time");
        const { now: serverNow } = await res.json();
        const t1 = Date.now();
        const rtt = t1 - t0;
        if (active) {
          const rawOffset = serverNow - (t0 + rtt / 2);
          // Light EMA to prevent clock jumping abruptly during active sessions
          const offset = isFirstSync
            ? rawOffset
            : 0.8 * clockOffsetRef.current + 0.2 * rawOffset;
          
          isFirstSync = false;
          clockOffsetRef.current = offset;
          setClockOffset(offset);
          setReady(true);
        }
      } catch (err) {
        console.error("Failed to sync clock, falling back to local time", err);
        if (active && isFirstSync) {
          clockOffsetRef.current = 0;
          setClockOffset(0);
          setReady(true);
        }
      }
    }
    syncClock();

    const interval = setInterval(() => {
      void syncClock();
    }, 300_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const serverClock = () => Date.now() + clockOffsetRef.current;

  return {
    ready,
    clockOffset,
    serverClock,
  };
}

