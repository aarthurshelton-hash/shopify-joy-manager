import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { trackUserLocation, updateLastSeen } from '@/lib/security/trackLocation';

// Minimum time between full geolocation refreshes (30 minutes)
const FULL_REFRESH_INTERVAL = 30 * 60 * 1000;
// Minimum time between last_seen updates (5 minutes)
const LAST_SEEN_INTERVAL = 5 * 60 * 1000;
// Time user must be away before triggering refresh on return (2 minutes)
const AWAY_THRESHOLD = 2 * 60 * 1000;

export function useLocationRefresh() {
  const { user } = useAuth();
  const lastFullRefreshRef = useRef<number>(0);
  const lastSeenUpdateRef = useRef<number>(0);
  const hiddenAtRef = useRef<number | null>(null);
  const lastTimezoneRef = useRef<string | null>(null);

  // Get current browser timezone
  const getCurrentTimezone = useCallback(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return null;
    }
  }, []);

  // Full location refresh (calls geolocation API)
  const refreshLocation = useCallback(async () => {
    if (!user) return;
    
    const now = Date.now();
    if (now - lastFullRefreshRef.current < FULL_REFRESH_INTERVAL) {
      return; // Skip if we refreshed recently
    }

    lastFullRefreshRef.current = now;
    lastSeenUpdateRef.current = now;
    
    await trackUserLocation(user.id);
  }, [user]);

  // Quick last_seen update (no geolocation API call)
  const updateLastSeenTimestamp = useCallback(async () => {
    if (!user) return;
    
    const now = Date.now();
    if (now - lastSeenUpdateRef.current < LAST_SEEN_INTERVAL) {
      return; // Skip if we updated recently
    }

    lastSeenUpdateRef.current = now;
    await updateLastSeen(user.id);
  }, [user]);

  // Check if timezone changed (indicates travel/VPN)
  const checkTimezoneChange = useCallback(() => {
    const currentTimezone = getCurrentTimezone();
    if (!currentTimezone) return false;

    if (lastTimezoneRef.current && lastTimezoneRef.current !== currentTimezone) {
      lastTimezoneRef.current = currentTimezone;
      return true; // Timezone changed
    }

    lastTimezoneRef.current = currentTimezone;
    return false;
  }, [getCurrentTimezone]);

  // Handle visibility change (user returns to app)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // User left - record the time
      hiddenAtRef.current = Date.now();
    } else {
      // User returned
      const wasHiddenFor = hiddenAtRef.current 
        ? Date.now() - hiddenAtRef.current 
        : 0;
      hiddenAtRef.current = null;

      if (!user) return;

      // Check if timezone changed
      const timezoneChanged = checkTimezoneChange();

      if (timezoneChanged) {
        // Timezone changed - do full refresh
        refreshLocation();
      } else if (wasHiddenFor >= AWAY_THRESHOLD) {
        // User was away for a while - update last_seen
        updateLastSeenTimestamp();
      }
    }
  }, [user, checkTimezoneChange, refreshLocation, updateLastSeenTimestamp]);

  // Handle window focus
  const handleFocus = useCallback(() => {
    if (!user) return;
    
    // Quick last_seen update on focus
    updateLastSeenTimestamp();
  }, [user, updateLastSeenTimestamp]);

  useEffect(() => {
    if (!user) return;

    // Initialize timezone tracking
    lastTimezoneRef.current = getCurrentTimezone();

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Periodic last_seen update while app is active (every 5 minutes)
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        updateLastSeenTimestamp();
      }
    }, LAST_SEEN_INTERVAL);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [user, getCurrentTimezone, handleVisibilityChange, handleFocus, updateLastSeenTimestamp]);

  return {
    refreshLocation,
    updateLastSeenTimestamp,
  };
}
