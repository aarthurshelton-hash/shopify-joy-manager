/**
 * En Pensent Device Profile Hook
 * 
 * Provides reactive device profile for adaptive rendering.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DeviceProfile,
  getDeviceProfile,
  getOptimalBoardSize,
  getOptimalImageQuality,
  shouldEnableAnimations,
  getChunkSize,
} from '@/lib/device/deviceDetection';

interface DeviceProfileContext extends DeviceProfile {
  optimalBoardSize: number;
  optimalImageQuality: number;
  animationsEnabled: boolean;
  chunkSize: number;
  refresh: () => void;
}

/**
 * Hook for reactive device profile with optimization hints
 */
export function useDeviceProfile(): DeviceProfileContext {
  const [profile, setProfile] = useState<DeviceProfile>(getDeviceProfile);
  
  const refresh = useCallback(() => {
    setProfile(getDeviceProfile());
  }, []);
  
  useEffect(() => {
    // Re-detect on resize (debounced)
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(refresh, 150);
    };
    
    // Re-detect on orientation change
    const handleOrientationChange = () => {
      setTimeout(refresh, 100);
    };
    
    // Re-detect on visibility change (battery/power mode changes)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for network changes
    const nav = navigator as Navigator & {
      connection?: EventTarget;
    };
    
    if (nav.connection) {
      nav.connection.addEventListener('change', refresh);
    }
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (nav.connection) {
        nav.connection.removeEventListener('change', refresh);
      }
    };
  }, [refresh]);
  
  // Compute derived values
  const derived = useMemo(() => ({
    optimalBoardSize: getOptimalBoardSize(profile),
    optimalImageQuality: getOptimalImageQuality(profile),
    animationsEnabled: shouldEnableAnimations(profile),
    chunkSize: getChunkSize(profile),
  }), [profile]);
  
  return {
    ...profile,
    ...derived,
    refresh,
  };
}

/**
 * Simplified hook just for device type
 */
export function useDeviceType() {
  const { type, isTouch, isPWA } = useDeviceProfile();
  return { type, isTouch, isPWA };
}

/**
 * Hook for performance-aware features
 */
export function usePerformanceHints() {
  const profile = useDeviceProfile();
  
  return useMemo(() => ({
    shouldLazyLoad: profile.connection !== 'fast',
    shouldReduceQuality: profile.performanceTier === 'low',
    shouldDisableAnimations: !profile.animationsEnabled,
    shouldPreload: profile.connection === 'fast' && profile.performanceTier === 'high',
    maxConcurrentRequests: profile.performanceTier === 'low' ? 2 : 
                           profile.performanceTier === 'medium' ? 4 : 6,
  }), [profile]);
}
