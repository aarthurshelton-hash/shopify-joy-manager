/**
 * Live Heartbeat Hook
 * Provides auto-refreshing, always-on analysis state
 * Pulses like a heartbeat to keep analysis fresh
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface HeartbeatConfig {
  /** Interval in milliseconds between heartbeats (default: 30000 = 30s) */
  interval?: number;
  /** Auto-start on mount (default: true) */
  autoStart?: boolean;
  /** Callback when heartbeat triggers */
  onPulse?: () => void | Promise<void>;
  /** Enable/disable heartbeat (default: true) */
  enabled?: boolean;
}

export interface HeartbeatState {
  isAlive: boolean;
  lastPulse: Date | null;
  pulseCount: number;
  isProcessing: boolean;
  nextPulseIn: number; // seconds until next pulse
}

export function useLiveHeartbeat(config: HeartbeatConfig = {}) {
  const {
    interval = 30000,
    autoStart = true,
    onPulse,
    enabled = true
  } = config;

  const [state, setState] = useState<HeartbeatState>({
    isAlive: false,
    lastPulse: null,
    pulseCount: 0,
    isProcessing: false,
    nextPulseIn: Math.floor(interval / 1000)
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const onPulseRef = useRef(onPulse);

  // Keep callback ref up to date
  useEffect(() => {
    onPulseRef.current = onPulse;
  }, [onPulse]);

  const pulse = useCallback(async () => {
    if (!enabled) return;
    
    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      if (onPulseRef.current) {
        await onPulseRef.current();
      }
    } catch (error) {
      console.error('[Heartbeat] Pulse error:', error);
    } finally {
      setState(prev => ({
        ...prev,
        isAlive: true,
        lastPulse: new Date(),
        pulseCount: prev.pulseCount + 1,
        isProcessing: false,
        nextPulseIn: Math.floor(interval / 1000)
      }));
    }
  }, [enabled, interval]);

  const start = useCallback(() => {
    if (intervalRef.current) return;

    // Initial pulse
    pulse();

    // Set up recurring pulse
    intervalRef.current = setInterval(pulse, interval);

    // Set up countdown timer
    countdownRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        nextPulseIn: Math.max(0, prev.nextPulseIn - 1)
      }));
    }, 1000);

    setState(prev => ({ ...prev, isAlive: true }));
  }, [pulse, interval]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setState(prev => ({ ...prev, isAlive: false }));
  }, []);

  const restart = useCallback(() => {
    stop();
    setTimeout(start, 100);
  }, [stop, start]);

  // Auto-start on mount
  useEffect(() => {
    if (autoStart && enabled) {
      start();
    }

    return () => {
      stop();
    };
  }, [autoStart, enabled, start, stop]);

  // Handle enabled changes
  useEffect(() => {
    if (!enabled && intervalRef.current) {
      stop();
    } else if (enabled && autoStart && !intervalRef.current) {
      start();
    }
  }, [enabled, autoStart, start, stop]);

  return {
    ...state,
    pulse,
    start,
    stop,
    restart
  };
}

/**
 * Format time until next pulse
 */
export function formatNextPulse(seconds: number): string {
  if (seconds <= 0) return 'now';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}
