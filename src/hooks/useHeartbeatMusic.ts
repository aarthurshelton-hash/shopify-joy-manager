/**
 * Heartbeat Music System
 * Generates synchronized audio that pulses with the En Pensent heartbeat
 * The blood (code) and nervous system (market) unified through sound
 */

import { useCallback, useRef, useEffect, useState } from 'react';

export interface HeartbeatMusicConfig {
  enabled?: boolean;
  volume?: number;
  tempo?: number; // BPM synced with heartbeat
  intensity?: number; // 0-1, driven by market volatility or code complexity
}

export function useHeartbeatMusic(config: HeartbeatMusicConfig = {}) {
  const { enabled = true, volume = 0.3, tempo = 60, intensity = 0.5 } = config;
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isInitializedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  
  // Initialize audio context on user interaction
  const initAudio = useCallback(() => {
    if (isInitializedRef.current) return true;
    
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = volume;
      gainNodeRef.current.connect(audioContextRef.current.destination);
      isInitializedRef.current = true;
      return true;
    } catch (e) {
      console.error('[HeartbeatMusic] Failed to initialize:', e);
      return false;
    }
  }, [volume]);
  
  // Play a heartbeat pulse sound
  const playHeartbeatPulse = useCallback((pulseIntensity: number = intensity) => {
    if (!enabled || !initAudio()) return;
    
    const ctx = audioContextRef.current!;
    const gain = gainNodeRef.current!;
    
    const now = ctx.currentTime;
    
    // Create the "lub-dub" heartbeat sound
    const createBeat = (delay: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + delay + duration);
      
      oscGain.gain.setValueAtTime(0, now + delay);
      oscGain.gain.linearRampToValueAtTime(pulseIntensity * volume, now + delay + 0.02);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
      
      osc.connect(oscGain);
      oscGain.connect(gain);
      
      osc.start(now + delay);
      osc.stop(now + delay + duration);
    };
    
    // "Lub" - first beat
    createBeat(0, 80 + (pulseIntensity * 40), 0.15);
    // "Dub" - second beat
    createBeat(0.12, 60 + (pulseIntensity * 30), 0.1);
  }, [enabled, initAudio, intensity, volume]);
  
  // Play evolution/mutation sound
  const playEvolutionSound = useCallback((type: 'mutate' | 'evolve' | 'sync') => {
    if (!enabled || !initAudio()) return;
    
    const ctx = audioContextRef.current!;
    const gain = gainNodeRef.current!;
    const now = ctx.currentTime;
    
    const freqMap = {
      mutate: [220, 330, 440], // Rising sequence
      evolve: [440, 550, 660, 880], // Major chord progression
      sync: [440, 440 * 1.5, 440 * 2] // Perfect fifth + octave
    };
    
    const freqs = freqMap[type];
    
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      
      osc.type = type === 'sync' ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      
      const delay = i * 0.08;
      oscGain.gain.setValueAtTime(0, now + delay);
      oscGain.gain.linearRampToValueAtTime(volume * 0.5, now + delay + 0.05);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);
      
      osc.connect(oscGain);
      oscGain.connect(gain);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.35);
    });
  }, [enabled, initAudio, volume]);
  
  // Play prediction sound (up/down/neutral)
  const playPredictionSound = useCallback((direction: 'up' | 'down' | 'neutral', confidence: number) => {
    if (!enabled || !initAudio()) return;
    
    const ctx = audioContextRef.current!;
    const gain = gainNodeRef.current!;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    const baseFreq = direction === 'up' ? 440 : direction === 'down' ? 220 : 330;
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    
    if (direction === 'up') {
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.2);
    } else if (direction === 'down') {
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.2);
    }
    
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(volume * confidence, now + 0.03);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.connect(oscGain);
    oscGain.connect(gain);
    
    osc.start(now);
    osc.stop(now + 0.3);
  }, [enabled, initAudio, volume]);
  
  // Play success/failure sound
  const playOutcomeSound = useCallback((success: boolean) => {
    if (!enabled || !initAudio()) return;
    
    const ctx = audioContextRef.current!;
    const gain = gainNodeRef.current!;
    const now = ctx.currentTime;
    
    if (success) {
      // Major chord - happy
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.05);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        osc.connect(oscGain);
        oscGain.connect(gain);
        
        osc.start(now + i * 0.03);
        osc.stop(now + 0.5);
      });
    } else {
      // Minor chord - sad
      [440, 523.25, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.value = freq * 0.5;
        
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(volume * 0.2, now + 0.05);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.connect(oscGain);
        oscGain.connect(gain);
        
        osc.start(now + i * 0.02);
        osc.stop(now + 0.35);
      });
    }
  }, [enabled, initAudio, volume]);
  
  // Ambient drone for continuous monitoring
  const startAmbientDrone = useCallback((baseFreq: number = 55) => {
    if (!enabled || !initAudio()) return;
    
    const ctx = audioContextRef.current!;
    const gain = gainNodeRef.current!;
    
    // Stop any existing drones
    oscillatorsRef.current.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    oscillatorsRef.current = [];
    
    // Create layered drone
    [1, 1.5, 2, 3].forEach((mult) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.value = baseFreq * mult;
      
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      
      oscGain.gain.value = volume * 0.05 / mult;
      
      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(gain);
      
      osc.start();
      oscillatorsRef.current.push(osc);
    });
    
    setIsPlaying(true);
  }, [enabled, initAudio, volume]);
  
  const stopAmbientDrone = useCallback(() => {
    oscillatorsRef.current.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    oscillatorsRef.current = [];
    setIsPlaying(false);
  }, []);
  
  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAmbientDrone();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAmbientDrone]);
  
  return {
    initAudio,
    playHeartbeatPulse,
    playEvolutionSound,
    playPredictionSound,
    playOutcomeSound,
    startAmbientDrone,
    stopAmbientDrone,
    isPlaying,
    isInitialized: isInitializedRef.current
  };
}
