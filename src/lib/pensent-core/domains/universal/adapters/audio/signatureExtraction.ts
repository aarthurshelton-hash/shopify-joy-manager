/**
 * Audio Signature Extraction
 * 
 * Extract domain signatures from audio signal history
 */

import type { UniversalSignal, DomainSignature } from '../../types';
import { 
  calculateVariance, 
  calculateMusicalCoherence,
  findDominantFrequency,
  calculateHarmonicResonance
} from './signalProcessing';

/**
 * Calculate quadrant profile from audio characteristics
 */
export function calculateQuadrantFromAudio(
  signals: UniversalSignal[]
): DomainSignature['quadrantProfile'] {
  const avgTempo = signals.reduce((sum, s) => sum + s.rawData[3], 0) / signals.length;
  const avgCentroid = signals.reduce((sum, s) => sum + s.rawData[2], 0) / signals.length;
  const ampVariation = calculateVariance(signals.map(s => s.intensity));
  const modeSum = signals.reduce((sum, s) => sum + s.rawData[5], 0);
  
  const tempoScore = Math.min((avgTempo - 60) / 140, 1);
  const warmthScore = 1 - Math.min(avgCentroid / 5000, 1);
  const dynamicScore = Math.min(ampVariation * 4, 1);
  const structureScore = Math.abs(modeSum / signals.length);
  
  const total = tempoScore + warmthScore + dynamicScore + structureScore || 1;
  
  return {
    aggressive: tempoScore / total,
    defensive: warmthScore / total,
    tactical: dynamicScore / total,
    strategic: structureScore / total,
  };
}

/**
 * Calculate temporal flow from signal history
 */
export function calculateTemporalFlow(
  signals: UniversalSignal[]
): DomainSignature['temporalFlow'] {
  const len = signals.length;
  const third = Math.floor(len / 3);
  
  const earlyEnergy = signals.slice(0, third)
    .reduce((sum, s) => sum + s.intensity * s.frequency, 0) / third || 0;
  const midEnergy = signals.slice(third, 2 * third)
    .reduce((sum, s) => sum + s.intensity * s.frequency, 0) / third || 0;
  const lateEnergy = signals.slice(2 * third)
    .reduce((sum, s) => sum + s.intensity * s.frequency, 0) / third || 0;
  
  const total = earlyEnergy + midEnergy + lateEnergy || 1;
  
  return {
    early: earlyEnergy / total,
    mid: midEnergy / total,
    late: lateEnergy / total,
  };
}

/**
 * Calculate momentum from recent vs older signals
 */
export function calculateMomentum(signals: UniversalSignal[]): number {
  if (signals.length < 10) return 0;
  
  const recent = signals.slice(-10);
  const older = signals.slice(-20, -10);
  
  const recentEnergy = recent.reduce((sum, s) => sum + s.intensity * s.frequency, 0) / recent.length;
  const olderEnergy = older.length > 0 
    ? older.reduce((sum, s) => sum + s.intensity * s.frequency, 0) / older.length 
    : recentEnergy;
  
  return (recentEnergy - olderEnergy) / (olderEnergy || 1);
}

/**
 * Get default signature when no signals available
 */
export function getDefaultSignature(): DomainSignature {
  return {
    domain: 'audio',
    quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
    temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
    intensity: 0.5,
    momentum: 0,
    volatility: 0,
    dominantFrequency: 440,
    harmonicResonance: 0.5,
    phaseAlignment: 0.5,
    extractedAt: Date.now(),
  };
}

/**
 * Extract full domain signature from signal history
 */
export function extractAudioSignature(signals: UniversalSignal[]): DomainSignature {
  if (signals.length === 0) {
    return getDefaultSignature();
  }

  const recentSignals = signals.slice(-100);
  
  const quadrantProfile = calculateQuadrantFromAudio(recentSignals);
  const temporalFlow = calculateTemporalFlow(recentSignals);
  
  const avgIntensity = recentSignals.reduce((sum, s) => sum + s.intensity, 0) / recentSignals.length;
  const intensityVariance = calculateVariance(recentSignals.map(s => s.intensity));
  
  return {
    domain: 'audio',
    quadrantProfile,
    temporalFlow,
    intensity: avgIntensity,
    momentum: calculateMomentum(recentSignals),
    volatility: Math.sqrt(intensityVariance),
    dominantFrequency: findDominantFrequency(recentSignals),
    harmonicResonance: calculateHarmonicResonance(recentSignals),
    phaseAlignment: calculateMusicalCoherence(recentSignals),
    extractedAt: Date.now(),
  };
}
