'use client';

import { useEffect, useRef } from 'react';
import type { Participant } from '../types';
import { useClaimHost } from './use-room-queue';

const RETRY_MS = 5_000; // DB cổng staleness 30s là nguồn chân lý; cứ thử tới khi qua

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

  // Ứng viên = member không phải host, joinedAt nhỏ nhất trong số đang present.
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
      }); // DB từ chối êm tới khi >30s
    };
    // Thử ngay (thường bị từ chối nếu chưa đủ 30s) rồi retry tới khi thành công.
    // Khi claim thành công → host_id đổi → isHost=true → effect cleanup dừng interval.
    attempt();
    const interval = setInterval(attempt, RETRY_MS);
    return () => {
      stopped = true;
      pendingRef.current = false;
      clearInterval(interval);
    };
  }, [isHost, hostPresent, iAmCandidate]);
}
