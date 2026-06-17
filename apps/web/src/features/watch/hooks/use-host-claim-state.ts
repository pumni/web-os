'use client';

import { useState, useEffect } from 'react';

const GRACE_PERIOD_MS = 10_000;

/**
 * Tracks whether the host-claim banner should be shown.
 *
 * Hides the banner whenever a host is present (local user or a remote host in
 * presence); surfaces it after a 10s grace period once no host is detected.
 */
export function useHostClaimState(isHost: boolean, hostPresent: boolean) {
  const [showClaim, setShowClaim] = useState(false);

  // Hide the banner immediately when a host reappears.
  const [prevHostOrActive, setPrevHostOrActive] = useState(isHost || hostPresent);
  const currentHostOrActive = isHost || hostPresent;
  if (currentHostOrActive !== prevHostOrActive) {
    setPrevHostOrActive(currentHostOrActive);
    if (currentHostOrActive) {
      setShowClaim(false);
    }
  }

  useEffect(() => {
    if (isHost || hostPresent) {
      return;
    }
    const t = setTimeout(() => setShowClaim(true), GRACE_PERIOD_MS);
    return () => clearTimeout(t);
  }, [isHost, hostPresent]);

  return showClaim;
}
