/**
 * Audio Adapter Types
 * 
 * Type definitions for audio/music domain pattern recognition
 */

import type { DomainSignature, UniversalSignal } from '../../types';

export interface AudioData {
  fundamentalHz: number; // Fundamental frequency
  amplitude: number; // 0-1 normalized
  spectralCentroid: number; // "Brightness" of sound
  tempo: number; // BPM
  key: number; // Musical key (0-11 for C to B)
  mode: 'major' | 'minor' | 'neutral';
  timestamp: number;
}

export interface TempoRange {
  min: number;
  max: number;
}

export const TEMPO_CLASSIFICATIONS: Record<string, TempoRange> = {
  largo: { min: 40, max: 60 },
  adagio: { min: 60, max: 80 },
  andante: { min: 80, max: 100 },
  moderato: { min: 100, max: 120 },
  allegro: { min: 120, max: 160 },
  presto: { min: 160, max: 200 },
};

// Musical frequency references
export const A4_FREQUENCY = 440; // Hz

// Signal buffer size
export const AUDIO_BUFFER_SIZE = 1000;

export type { DomainSignature, UniversalSignal };
