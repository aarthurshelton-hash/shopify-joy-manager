import { useState, useCallback, useRef, TouchEvent, MouseEvent } from 'react';

interface SwipeConfig {
  threshold?: number; // Minimum distance to trigger swipe
  allowMouse?: boolean; // Allow mouse drag on desktop
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isSwiping: boolean;
}

export const useSwipeNavigation = (config: SwipeConfig = {}) => {
  const {
    threshold = 50,
    allowMouse = true,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = config;

  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  const stateRef = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isSwiping: false,
  });

  const handleStart = useCallback((clientX: number, clientY: number) => {
    stateRef.current = {
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      isSwiping: true,
    };
    setIsSwiping(true);
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!stateRef.current.isSwiping) return;

    stateRef.current.currentX = clientX;
    stateRef.current.currentY = clientY;

    const deltaX = clientX - stateRef.current.startX;
    const deltaY = clientY - stateRef.current.startY;

    setSwipeOffset({ x: deltaX, y: deltaY });
  }, []);

  const handleEnd = useCallback(() => {
    if (!stateRef.current.isSwiping) return;

    const deltaX = stateRef.current.currentX - stateRef.current.startX;
    const deltaY = stateRef.current.currentY - stateRef.current.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine if swipe was horizontal or vertical
    if (absX > absY && absX > threshold) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else if (absY > absX && absY > threshold) {
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    stateRef.current.isSwiping = false;
    setIsSwiping(false);
    setSwipeOffset({ x: 0, y: 0 });
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  // Touch handlers
  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  const onTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse handlers (for desktop testing)
  const onMouseDown = useCallback((e: MouseEvent) => {
    if (!allowMouse) return;
    handleStart(e.clientX, e.clientY);
  }, [allowMouse, handleStart]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!allowMouse) return;
    handleMove(e.clientX, e.clientY);
  }, [allowMouse, handleMove]);

  const onMouseUp = useCallback(() => {
    if (!allowMouse) return;
    handleEnd();
  }, [allowMouse, handleEnd]);

  const onMouseLeave = useCallback(() => {
    if (!allowMouse) return;
    if (stateRef.current.isSwiping) {
      handleEnd();
    }
  }, [allowMouse, handleEnd]);

  return {
    swipeOffset,
    isSwiping,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    },
  };
};

export default useSwipeNavigation;
