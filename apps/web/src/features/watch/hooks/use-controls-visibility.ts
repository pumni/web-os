'use client';

import { useState, useEffect, useRef } from 'react';

interface UseControlsVisibilityProps {
  paused: boolean;
  stageRef?: React.RefObject<HTMLElement | null>;
}

export function useControlsVisibility({ paused, stageRef }: UseControlsVisibilityProps) {
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track hover and focus as state instead of refs to comply with render safety rules
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);

  const resetTimer = () => {
    setVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (paused || isHovered || hasFocus) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      // Check for OS prefers-reduced-motion to avoid hiding
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mediaQuery.matches) {
          return;
        }
      }
      setVisible(false);
    }, 3000);
  };

  const resetTimerRef = useRef(resetTimer);
  useEffect(() => {
    resetTimerRef.current = resetTimer;
  });

  // Track stage activities to reveal controls
  useEffect(() => {
    const el = stageRef?.current;
    if (!el) return;

    let lastMove = 0;
    const handleMove = () => {
      const now = Date.now();
      if (now - lastMove < 100) return; // throttle ~10fps
      lastMove = now;
      resetTimerRef.current();
    };
    const handleActivity = () => resetTimerRef.current();

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('pointerdown', handleActivity);
    el.addEventListener('keydown', handleActivity);

    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('pointerdown', handleActivity);
      el.removeEventListener('keydown', handleActivity);
    };
  }, [stageRef]);

  // When paused or hover/focus state changes, update timer asynchronously (no synchronous setState calls)
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!paused && !isHovered && !hasFocus) {
      // Started playing and no hover/focus: start the hide timer
      timeoutRef.current = setTimeout(() => {
        if (typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
          if (mediaQuery.matches) return;
        }
        setVisible(false);
      }, 3000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [paused, isHovered, hasFocus]);

  // Control bar hover states
  const onMouseEnter = () => {
    setIsHovered(true);
  };

  const onMouseLeave = () => {
    setIsHovered(false);
  };

  // Keyboard accessibility focus states
  const onFocus = () => {
    setHasFocus(true);
  };

  const onBlur = () => {
    setHasFocus(false);
  };

  // Compute final visibility based on all factors (derived state during render)
  const isControlsVisible = visible || paused || isHovered || hasFocus;

  return {
    visible: isControlsVisible,
    controlsBind: {
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
    },
  };
}
