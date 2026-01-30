/**
 * Audio Signal Processing
 * 
 * Core signal processing functions for audio domain
 */

import type { UniversalSignal, DomainSignature } from '../../types';
import type { AudioData } from './types';

/**
 * Extract harmonics from audio characteristics
 */
export function extractHarmonics(
  fundamental: number, 
  centroid: number, 
  tempo: number, 
  key: number, 
  mode: 'major' | 'minor' | 'neutral'
): number[] {
  const modeMultiplier = mode === 'major' ? 1.2 : mode === 'minor' ? 0.8 : 1;
  const tempoNorm = tempo / 120;
  const keyNorm = key / 12;
  
  return [
    fundamental / 1000,
    (fundamental * 2) / 1000 * modeMultiplier,
    (fundamental * 3) / 1000,
    (fundamental * 4) / 1000 * modeMultiplier,
    centroid / 5000,
    tempoNorm,
    keyNorm,
    Math.sin(keyNorm * Math.PI * 2) * modeMultiplier,
  ];
}

/**
 * Convert raw audio data to universal signal
 */
export function processAudioToSignal(data: AudioData): UniversalSignal {
  const { fundamentalHz, amplitude, spectralCentroid, tempo, key, mode, timestamp } = data;
  
  return {
    domain: 'audio',
    timestamp,
    intensity: amplitude,
    frequency: fundamentalHz,
    phase: (key / 12) * Math.PI * 2,
    harmonics: extractHarmonics(fundamentalHz, spectralCentroid, tempo, key, mode),
    rawData: [
      fundamentalHz, 
      amplitude, 
      spectralCentroid, 
      tempo, 
      key, 
      mode === 'major' ? 1 : mode === 'minor' ? -1 : 0
    ],
  };
}

/**
 * Calculate variance of values
 */
export function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
}

/**
 * Calculate musical coherence from signal history
 */
export function calculateMusicalCoherence(signals: UniversalSignal[]): number {
  if (signals.length < 2) return 0.5;
  
  let coherenceSum = 0;
  for (let i = 1; i < signals.length; i++) {
    const keyDiff = Math.abs(signals[i].rawData[4] - signals[i - 1].rawData[4]);
    const modeDiff = Math.abs(signals[i].rawData[5] - signals[i - 1].rawData[5]);
    
    const keyCoherence = 1 - (keyDiff / 6);
    const modeCoherence = 1 - (modeDiff / 2);
    
    coherenceSum += (keyCoherence + modeCoherence) / 2;
  }
  
  return coherenceSum / (signals.length - 1);
}

/**
 * Find dominant frequency from signal history
 */
export function findDominantFrequency(signals: UniversalSignal[]): number {
  const freqBuckets = new Map<number, number>();
  
  signals.forEach(s => {
    const octave = Math.floor(Math.log2(s.frequency / 27.5));
    const bucket = 27.5 * Math.pow(2, octave);
    freqBuckets.set(bucket, (freqBuckets.get(bucket) || 0) + s.intensity);
  });
  
  let maxBucket = 440;
  let maxValue = 0;
  freqBuckets.forEach((value, bucket) => {
    if (value > maxValue) {
      maxValue = value;
      maxBucket = bucket;
    }
  });
  
  return maxBucket;
}

/**
 * Calculate harmonic resonance between consecutive signals
 */
export function calculateHarmonicResonance(signals: UniversalSignal[]): number {
  if (signals.length < 2) return 0;
  
  let resonanceSum = 0;
  for (let i = 1; i < signals.length; i++) {
    const h1 = signals[i].harmonics;
    const h2 = signals[i - 1].harmonics;
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let j = 0; j < h1.length; j++) {
      dotProduct += h1[j] * h2[j];
      mag1 += h1[j] * h1[j];
      mag2 += h2[j] * h2[j];
    }
    
    const denom = Math.sqrt(mag1) * Math.sqrt(mag2);
    const cosineSim = denom > 0 ? dotProduct / denom : 0;
    resonanceSum += (cosineSim + 1) / 2;
  }
  
  return resonanceSum / (signals.length - 1);
}
