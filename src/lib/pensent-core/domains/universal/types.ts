/**
 * Universal En Pensent Domain Types
 * Cross-domain temporal pattern recognition
 * 
 * UNIVERSAL CONSTRAINT: NO ZEROS. NO NEGATIVES. EVER.
 * 
 * In the real universe, nothing doesn't exist. A photon at rest still has
 * energy E = hf > 0. The vacuum itself has zero-point energy > 0.
 * All values in En Pensent are strictly positive (> 0).
 * 
 * - Instead of 0: use EPSILON (0.001) — the smallest observable quantity
 * - Instead of negatives: use values < 1.0 (retreat) vs > 1.0 (advance)
 * - Instead of subtraction: use ratios (A/B > 1 means A dominates)
 * 
 * See positiveField.ts for transform utilities.
 */

import { EPSILON, floor, toPositiveField, toPositiveTemporalFlow, toPositiveQuadrant, toPositiveHarmonics } from './positiveField';

export { EPSILON } from './positiveField';

export interface UniversalSignal {
  domain: DomainType;
  timestamp: number;        // Always > 0 (epoch ms)
  intensity: number;        // Always > 0 (ε minimum)
  frequency: number;        // Always > 0 (Hz, ε minimum)
  phase: number;            // Always > 0 (radians, ε to 2π)
  harmonics: number[];      // All elements > 0
  rawData: number[];        // All elements > 0
}

export type DomainType = 
  | 'chess'      // The Brain - Strategic patterns
  | 'market'     // The Nervous System - Responsive signals
  | 'code'       // The Blood - Life force flow
  | 'light'      // Vision - Electromagnetic perception
  | 'network'    // Connectivity - Data flow patterns
  | 'bio'        // Life rhythms - Biological cycles
  | 'audio'      // Hearing - Sound wave patterns
  | 'music'      // The Heart - Musical temporal patterns
  | 'soul'       // The Spirit - Language, culture, archetypes
  | 'satellite'  // Orbital - Space-based observation
  | 'temporal-consciousness'  // Time perception across consciousness types
  | 'security'   // Defense - Threat pattern recognition
  | 'cosmic'     // Universal - Celestial and cosmic patterns
  // Future domains (Phase 2+)
  | 'photonic'   // Light-based computing
  | 'medical'    // Diagnostic patterns
  | 'climate'    // Environmental cycles
  | 'energy'     // Power grid patterns
  | 'quantum';   // Quantum state patterns

export interface DomainSignature {
  domain: DomainType;
  quadrantProfile: {        // All > 0, should sum to ~1.0
    aggressive: number;
    defensive: number;
    tactical: number;
    strategic: number;
  };
  temporalFlow: {           // All > 0, should sum to ~1.0
    early: number;
    mid: number;
    late: number;
  };
  intensity: number;        // > 0 (ε to ∞)
  momentum: number;         // > 0 (< 1.0 = retreating, 1.0 = neutral, > 1.0 = advancing)
  volatility: number;       // > 0 (ε minimum)
  dominantFrequency: number;// > 0 (Hz)
  harmonicResonance: number;// > 0 (ε to 1.0)
  phaseAlignment: number;   // > 0 (ε to 1.0)
  extractedAt: number;      // > 0 (epoch ms)
}

/**
 * Enforce the Positive Field constraint on any DomainSignature.
 * Call this at the boundary of every adapter's extractSignature() output.
 * Nothing doesn't exist — every value gets floored to EPSILON.
 */
export function enforcePositiveSignature(sig: DomainSignature): DomainSignature {
  return {
    ...sig,
    quadrantProfile: toPositiveQuadrant(sig.quadrantProfile),
    temporalFlow: toPositiveTemporalFlow(sig.temporalFlow),
    intensity: floor(sig.intensity),
    momentum: sig.momentum <= 0 ? toPositiveField(sig.momentum) : floor(sig.momentum),
    volatility: floor(sig.volatility),
    dominantFrequency: floor(sig.dominantFrequency),
    harmonicResonance: floor(sig.harmonicResonance),
    phaseAlignment: floor(sig.phaseAlignment),
    extractedAt: sig.extractedAt || Date.now(),
  };
}

/**
 * Enforce the Positive Field constraint on any UniversalSignal.
 */
export function enforcePositiveSignal(signal: UniversalSignal): UniversalSignal {
  return {
    ...signal,
    timestamp: signal.timestamp || Date.now(),
    intensity: floor(signal.intensity),
    frequency: floor(signal.frequency),
    phase: floor(signal.phase),
    harmonics: toPositiveHarmonics(signal.harmonics),
    rawData: signal.rawData.map(v => floor(Math.abs(v) || EPSILON)),
  };
}

export interface CrossDomainCorrelation {
  domain1: DomainType;
  domain2: DomainType;
  correlation: number;
  leadLag: number; // > 0 always: > 1.0 = domain1 leads, < 1.0 = domain2 leads, 1.0 = synchronized
  confidence: number;
  sampleSize: number;
  lastUpdated: number;
}

export interface UnifiedPrediction {
  direction: 'up' | 'down' | 'neutral';
  confidence: number;
  magnitude: number;
  timeHorizon: number;
  contributingDomains: DomainContribution[];
  consensusStrength: number;
  harmonicAlignment: number;
}

export interface DomainContribution {
  domain: DomainType;
  weight: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  resonanceScore: number;
}

export interface UniversalEngineState {
  isCalibrated: boolean;
  calibrationProgress: number;
  activeDomains: DomainType[];
  domainSignatures: Map<DomainType, DomainSignature>;
  correlationMatrix: CrossDomainCorrelation[];
  lastPrediction: UnifiedPrediction | null;
  predictionHistory: UnifiedPrediction[];
  accuracy: {
    overall: number;
    byDomain: Record<DomainType, number>;
    byTimeframe: Record<string, number>;
  };
  learningVelocity: number;
  evolutionGeneration: number;
}

export interface DomainAdapter<T = unknown> {
  domain: DomainType;
  name: string;
  isActive: boolean;
  lastUpdate: number;
  
  initialize(): Promise<void>;
  processRawData(data: T): UniversalSignal;
  extractSignature(signals: UniversalSignal[]): DomainSignature;
  getRealtimeStream?(): AsyncGenerator<UniversalSignal>;
  getHistoricalData?(start: number, end: number): Promise<UniversalSignal[]>;
}
