'use client';

// fallow-ignore-file security-client-server-leak -- Intentional: Next.js Server Action import verified safe on client boundary

import { useEffect, useRef } from 'react';
import type { Participant } from '../types';
import { useClaimHost } from './use-room-queue';

const RETRY_MS = 5_000; // DB 30s staleness grace is the source of truth; retry until it succeeds

export function useHostAutopromote(
  roomId: string,
  userId: string,
  isHost: boolean,
  participants: Participant[],
  onClaimed?: () => void,
) {
  const claim = useClaimHost(roomId);
  const onClaimedRef = useRef(onClaimed);
  const mutateRef = useRef(claim.mutate);
  const pendingRef = useRef(false);

  useEffect(() => {
    onClaimedRef.current = onClaimed;
  }, [onClaimed]);

  useEffect(() => {
    mutateRef.current = claim.mutate;
  }, [claim.mutate]);

  // Candidate = non-host member with the earliest join time among currently present participants.
  const hostPresent = participants.some((p) => p.isHost);
  const candidate = participants
    .filter((p) => !p.isHost)
    .sort((a, b) => a.joinedAt - b.joinedAt)[0];
  const iAmCandidate = !!candidate && candidate.userId === userId;

  useEffect(() => {
    if (isHost || hostPresent || !iAmCandidate) return;

    let stopped = false;
    const attempt = () => {
      if (stopped || pendingRef.current) return;
      pendingRef.current = true;
      mutateRef.current(undefined, {
        onSuccess: () => onClaimedRef.current?.(),
        onError: () => {},
        onSettled: () => {
          pendingRef.current = false;
        },
      }); // DB silently rejects until >30s
    };
    // Attempt immediately (usually rejected if <30s elapsed) then retry periodically.
    // Once claim succeeds -> host_id changes -> isHost becomes true -> effect cleanup clears the interval.
    attempt();
    const interval = setInterval(attempt, RETRY_MS);
    return () => {
      stopped = true;
      pendingRef.current = false;
      clearInterval(interval);
    };
  }, [isHost, hostPresent, iAmCandidate]);
}
