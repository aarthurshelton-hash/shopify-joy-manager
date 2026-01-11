import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20],
  error: [50, 30, 50, 30, 50],
  selection: 5,
};

export const useHapticFeedback = () => {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const vibrate = useCallback((pattern: HapticPattern = 'light') => {
    if (!isSupported) return false;
    
    try {
      const vibrationPattern = PATTERNS[pattern];
      return navigator.vibrate(vibrationPattern);
    } catch (e) {
      console.warn('Haptic feedback failed:', e);
      return false;
    }
  }, [isSupported]);

  // Chess-specific haptic patterns
  const haptics = {
    // Piece selection - very light tap
    select: useCallback(() => vibrate('selection'), [vibrate]),
    
    // Normal move - light tap
    move: useCallback(() => vibrate('light'), [vibrate]),
    
    // Capture - medium impact
    capture: useCallback(() => vibrate('medium'), [vibrate]),
    
    // Check - stronger feedback
    check: useCallback(() => vibrate('heavy'), [vibrate]),
    
    // Checkmate/Victory
    victory: useCallback(() => vibrate('success'), [vibrate]),
    
    // Illegal move or error
    error: useCallback(() => vibrate('error'), [vibrate]),
    
    // Castle - double tap feel
    castle: useCallback(() => {
      if (!isSupported) return false;
      return navigator.vibrate([15, 40, 15]);
    }, [isSupported]),
    
    // Game start
    gameStart: useCallback(() => {
      if (!isSupported) return false;
      return navigator.vibrate([10, 30, 10, 30, 20]);
    }, [isSupported]),
  };

  return {
    isSupported,
    vibrate,
    haptics,
  };
};

export default useHapticFeedback;
