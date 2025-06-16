'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const isRefreshing = useRef(false);

  const pullProgress = Math.min(pullDistance / threshold, 1);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing.current) return;
    
    const touch = e.touches[0];
    if (window.scrollY === 0) {
      touchStartY.current = touch.clientY;
    }
  }, [disabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || touchStartY.current === null || isRefreshing.current) return;

    const touch = e.touches[0];
    const distance = touch.clientY - touchStartY.current;

    if (distance > 0 && window.scrollY === 0) {
      e.preventDefault();
      setPullDistance(distance);
      setIsPulling(true);
    }
  }, [disabled]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || touchStartY.current === null || isRefreshing.current) return;

    touchStartY.current = null;

    if (pullDistance >= threshold) {
      isRefreshing.current = true;
      try {
        await onRefresh();
      } finally {
        isRefreshing.current = false;
      }
    }

    setPullDistance(0);
    setIsPulling(false);
  }, [disabled, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    if (disabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, disabled]);

  return {
    pullDistance,
    pullProgress,
    isPulling,
  };
} 