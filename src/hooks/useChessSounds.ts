import { useCallback, useRef, useEffect } from 'react';

type SoundType = 'move' | 'capture' | 'check' | 'checkmate' | 'castle' | 'gameStart' | 'gameEnd' | 'victory' | 'defeat' | 'draw' | 'illegal';

interface AudioContextRef {
  context: AudioContext | null;
  gainNode: GainNode | null;
}

export const useChessSounds = (enabled: boolean = true, volume: number = 0.5) => {
  const audioRef = useRef<AudioContextRef>({ context: null, gainNode: null });
  
  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (audioRef.current.context) return;
    
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const gainNode = context.createGain();
      gainNode.connect(context.destination);
      gainNode.gain.value = volume;
      
      audioRef.current = { context, gainNode };
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }, [volume]);

  // Update volume
  useEffect(() => {
    if (audioRef.current.gainNode) {
      audioRef.current.gainNode.gain.value = volume;
    }
  }, [volume]);

  // Create a tone with specific parameters
  const playTone = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    attack: number = 0.01,
    decay: number = 0.1,
    endFrequency?: number
  ) => {
    if (!enabled) return;
    initAudio();
    
    const { context, gainNode } = audioRef.current;
    if (!context || !gainNode) return;

    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, context.currentTime + duration);
    }
    
    envelope.gain.setValueAtTime(0, context.currentTime);
    envelope.gain.linearRampToValueAtTime(1, context.currentTime + attack);
    envelope.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration - decay);
    envelope.gain.linearRampToValueAtTime(0, context.currentTime + duration);
    
    oscillator.connect(envelope);
    envelope.connect(gainNode);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration);
  }, [enabled, initAudio]);

  // Play noise burst (for captures)
  const playNoise = useCallback((duration: number, filterFreq: number = 1000) => {
    if (!enabled) return;
    initAudio();
    
    const { context, gainNode } = audioRef.current;
    if (!context || !gainNode) return;

    const bufferSize = context.sampleRate * duration;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.3, context.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);
    
    noise.connect(filter);
    filter.connect(envelope);
    envelope.connect(gainNode);
    
    noise.start(context.currentTime);
    noise.stop(context.currentTime + duration);
  }, [enabled, initAudio]);

  // Sound effect definitions
  const playSound = useCallback((type: SoundType) => {
    if (!enabled) return;
    
    switch (type) {
      case 'move':
        // Soft wooden tap
        playTone(800, 0.08, 'sine', 0.005, 0.05);
        playTone(400, 0.06, 'triangle', 0.005, 0.04);
        break;
        
      case 'capture':
        // Impact sound with noise
        playNoise(0.12, 2000);
        playTone(300, 0.1, 'square', 0.005, 0.08);
        playTone(150, 0.15, 'sine', 0.01, 0.1);
        break;
        
      case 'castle':
        // Double tap (two pieces moving)
        playTone(600, 0.06, 'sine', 0.005, 0.04);
        setTimeout(() => playTone(700, 0.06, 'sine', 0.005, 0.04), 80);
        break;
        
      case 'check':
        // Alert tone
        playTone(880, 0.15, 'triangle', 0.01, 0.1);
        setTimeout(() => playTone(1100, 0.12, 'triangle', 0.01, 0.08), 120);
        break;
        
      case 'checkmate':
        // Dramatic descending tones
        playTone(880, 0.2, 'sine', 0.01, 0.15);
        setTimeout(() => playTone(660, 0.2, 'sine', 0.01, 0.15), 150);
        setTimeout(() => playTone(440, 0.3, 'sine', 0.01, 0.2), 300);
        setTimeout(() => playTone(330, 0.4, 'sine', 0.01, 0.3), 500);
        break;
        
      case 'gameStart':
        // Ascending fanfare
        playTone(523, 0.12, 'sine', 0.01, 0.08); // C5
        setTimeout(() => playTone(659, 0.12, 'sine', 0.01, 0.08), 100); // E5
        setTimeout(() => playTone(784, 0.2, 'sine', 0.01, 0.15), 200); // G5
        break;
        
      case 'gameEnd':
        // Neutral end sound
        playTone(440, 0.15, 'triangle', 0.01, 0.1);
        setTimeout(() => playTone(349, 0.25, 'triangle', 0.01, 0.2), 150);
        break;
        
      case 'victory':
        // Triumphant ascending melody
        playTone(523, 0.1, 'sine', 0.01, 0.08); // C5
        setTimeout(() => playTone(659, 0.1, 'sine', 0.01, 0.08), 100); // E5
        setTimeout(() => playTone(784, 0.1, 'sine', 0.01, 0.08), 200); // G5
        setTimeout(() => playTone(1047, 0.3, 'sine', 0.01, 0.25), 300); // C6
        break;
        
      case 'defeat':
        // Sad descending tones
        playTone(392, 0.2, 'sine', 0.02, 0.15); // G4
        setTimeout(() => playTone(349, 0.2, 'sine', 0.02, 0.15), 200); // F4
        setTimeout(() => playTone(330, 0.3, 'sine', 0.02, 0.25), 400); // E4
        setTimeout(() => playTone(262, 0.4, 'sine', 0.02, 0.35), 650); // C4
        break;
        
      case 'draw':
        // Neutral resolution
        playTone(440, 0.15, 'sine', 0.01, 0.1); // A4
        setTimeout(() => playTone(440, 0.15, 'sine', 0.01, 0.1), 180); // A4
        setTimeout(() => playTone(523, 0.2, 'sine', 0.01, 0.15), 360); // C5
        break;
        
      case 'illegal':
        // Error buzz
        playTone(200, 0.1, 'square', 0.005, 0.08);
        playTone(150, 0.08, 'sawtooth', 0.005, 0.06);
        break;
    }
  }, [enabled, playTone, playNoise]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current.context) {
        audioRef.current.context.close();
      }
    };
  }, []);

  return { playSound, initAudio };
};

// Singleton for global sound access
let globalSoundInstance: ReturnType<typeof useChessSounds> | null = null;

export const getChessSounds = () => globalSoundInstance;

export const ChessSoundsProvider = ({ children, enabled = true, volume = 0.5 }: { 
  children: React.ReactNode; 
  enabled?: boolean; 
  volume?: number;
}) => {
  const sounds = useChessSounds(enabled, volume);
  globalSoundInstance = sounds;
  return children;
};
