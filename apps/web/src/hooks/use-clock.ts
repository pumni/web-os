"use client";

import * as React from "react";

export function useClock() {
  const [timestamp, setTimestamp] = React.useState<number | null>(null);

  React.useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const now = Date.now();

      setTimestamp(now);

      const delay = 1000 - new Date(now).getMilliseconds();

      timerId = setTimeout(tick, delay);
    };

    tick();

    return () => {
      clearTimeout(timerId);
    };
  }, []);

  return timestamp;
}