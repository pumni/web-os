"use client";

import { useState, useEffect, useRef } from "react";

interface UseControlsVisibilityProps {
  paused: boolean;
}

export function useControlsVisibility({ paused }: UseControlsVisibilityProps) {
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
      if (typeof window !== "undefined") {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
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

  // Track window activities to reveal controls
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleActivity = () => {
      resetTimerRef.current();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("pointerdown", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, []);

  // When paused or hover/focus state changes, update timer asynchronously (no synchronous setState calls)
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!paused && !isHovered && !hasFocus) {
      // Started playing and no hover/focus: start the hide timer
      timeoutRef.current = setTimeout(() => {
        if (typeof window !== "undefined") {
          const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
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
    }
  };
}
