import { useRef, useCallback, useEffect, useState } from "react";

interface SwipeState {
  offsetX: number;
  swiping: boolean;
}

interface UseSwipeOptions {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useSwipe({
  threshold = 80,
  onSwipeLeft,
  onSwipeRight,
}: UseSwipeOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    offsetX: 0,
    swiping: false,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    tracking.current = true;
    setSwipeState({ offsetX: 0, swiping: false });
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!tracking.current) return;

    const touch = e.touches[0];
    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;

    // If vertical movement is dominant, stop tracking horizontal swipe
    if (Math.abs(dy) > Math.abs(dx) && !swipeState.swiping) {
      tracking.current = false;
      setSwipeState({ offsetX: 0, swiping: false });
      return;
    }

    // Only swipe left (negative dx)
    if (dx < -10) {
      e.preventDefault();
      setSwipeState({ offsetX: dx, swiping: true });
    }
  }, [swipeState.swiping]);

  const handleTouchEnd = useCallback(() => {
    if (!tracking.current) return;
    tracking.current = false;

    const offset = swipeState.offsetX;

    if (offset < -threshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (offset > threshold && onSwipeRight) {
      onSwipeRight();
    }

    setSwipeState({ offsetX: 0, swiping: false });
  }, [swipeState.offsetX, threshold, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { ref, swipeState };
}
