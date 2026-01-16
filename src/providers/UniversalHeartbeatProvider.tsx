/**
 * Universal Heartbeat Provider
 * Synchronizes audio, evolution, and all En Pensent systems
 * The pulse that unifies Code (Blood) and Market (Nervous System)
 */

import React, { createContext, useContext, useCallback, useEffect, useState, useRef, ReactNode } from 'react';
import { useHeartbeatMusic } from '@/hooks/useHeartbeatMusic';
import { useLiveHeartbeat } from '@/hooks/useLiveHeartbeat';
import { useUnifiedEvolution, subscribeToEvolution, EvolutionEvent } from '@/hooks/useUnifiedEvolution';

interface UniversalHeartbeatContextType {
  isAlive: boolean;
  pulseCount: number;
  lastPulse: Date | null;
  intensity: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  triggerPulse: () => void;
  codeHealth: number;
  marketSync: number;
  patternAlignment: number;
}

const UniversalHeartbeatContext = createContext<UniversalHeartbeatContextType | null>(null);

export function useUniversalHeartbeat() {
  const context = useContext(UniversalHeartbeatContext);
  if (!context) {
    throw new Error('useUniversalHeartbeat must be used within UniversalHeartbeatProvider');
  }
  return context;
}

interface Props {
  children: ReactNode;
  autoStart?: boolean;
  interval?: number;
}

export function UniversalHeartbeatProvider({ children, autoStart = true, interval = 30000 }: Props) {
  const [soundEnabled, setSoundEnabled] = useState(false); // Off by default, user opt-in
  const [volume, setVolume] = useState(0.3);
  const [intensity, setIntensity] = useState(0.5);
  
  const evolution = useUnifiedEvolution();
  const stateRef = useRef(evolution.getUnifiedState());
  
  const music = useHeartbeatMusic({
    enabled: soundEnabled,
    volume,
    intensity
  });
  
  // Update intensity based on unified state
  useEffect(() => {
    const state = evolution.getUnifiedState();
    stateRef.current = state;
    // Intensity is average of all health metrics
    const avgHealth = (state.codeHealth + state.marketSync + state.patternAlignment) / 300;
    setIntensity(avgHealth);
  }, [evolution]);
  
  // Subscribe to evolution events for audio feedback
  useEffect(() => {
    const unsubscribe = subscribeToEvolution((event: EvolutionEvent) => {
      if (!soundEnabled) return;
      
      switch (event.type) {
        case 'code_analysis':
        case 'code_fix':
          music.playEvolutionSound('mutate');
          break;
        case 'pattern_discovered':
          music.playEvolutionSound('evolve');
          break;
        case 'market_sync':
          music.playEvolutionSound('sync');
          break;
      }
    });
    
    return unsubscribe;
  }, [soundEnabled, music]);
  
  // Main heartbeat callback
  const onPulse = useCallback(() => {
    // Play heartbeat sound
    if (soundEnabled) {
      music.playHeartbeatPulse(intensity);
    }
    
    // Update state reference
    stateRef.current = evolution.getUnifiedState();
  }, [soundEnabled, music, intensity, evolution]);
  
  const heartbeat = useLiveHeartbeat({
    interval,
    autoStart,
    onPulse,
    enabled: true
  });
  
  const triggerPulse = useCallback(() => {
    heartbeat.pulse();
  }, [heartbeat]);
  
  const value: UniversalHeartbeatContextType = {
    isAlive: heartbeat.isAlive,
    pulseCount: heartbeat.pulseCount,
    lastPulse: heartbeat.lastPulse,
    intensity,
    soundEnabled,
    setSoundEnabled,
    volume,
    setVolume,
    triggerPulse,
    codeHealth: stateRef.current.codeHealth,
    marketSync: stateRef.current.marketSync,
    patternAlignment: stateRef.current.patternAlignment
  };
  
  return (
    <UniversalHeartbeatContext.Provider value={value}>
      {children}
    </UniversalHeartbeatContext.Provider>
  );
}
