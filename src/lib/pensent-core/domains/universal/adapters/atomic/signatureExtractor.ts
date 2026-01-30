/**
 * Signature Extractor Module
 * 
 * Extracts temporal signatures from atomic data.
 */

import type { DomainSignature } from '../../types';
import type { AtomicData } from './types';
import { PERIODIC_PATTERNS } from './periodicPatterns';
import { QUANTUM_PATTERNS } from './quantumPatterns';

type TemporalSignature = DomainSignature;

/**
 * Extract a temporal signature from atomic data
 */
export function extractAtomicSignature(data: AtomicData): TemporalSignature {
  const quantumKey = `n${data.quantumState.principalLevel}` as keyof typeof QUANTUM_PATTERNS.principalQuantum;
  const spin = QUANTUM_PATTERNS.spinQuantum[data.quantumState.spin];
  
  // Calculate quadrant profile based on atomic properties
  const orbitalTactical = getOrbitalTacticalValue(data.quantumState.orbitalType);
  
  const quadrantProfile = {
    aggressive: data.reactivityPotential * 0.8 + (1 - data.stabilityIndex) * 0.2,
    defensive: data.stabilityIndex * 0.8 + (1 - data.reactivityPotential) * 0.2,
    tactical: orbitalTactical,
    strategic: 1 - orbitalTactical,
  };
  
  // Calculate intensity from energy and reactivity
  const intensity = (data.spectralEnergy + data.reactivityPotential) / 2;
  
  return {
    domain: 'bio', // Using closest available domain type
    quadrantProfile,
    temporalFlow: {
      early: data.reactivityPotential,
      mid: data.spectralEnergy,
      late: data.stabilityIndex,
    },
    intensity,
    momentum: data.spectralEnergy,
    volatility: data.reactivityPotential,
    dominantFrequency: data.resonanceFrequency,
    harmonicResonance: data.stabilityIndex,
    phaseAlignment: (data.quantumState.principalLevel / 5),
    extractedAt: Date.now(),
  };
}

/**
 * Get tactical value based on orbital type
 */
function getOrbitalTacticalValue(orbitalType: string): number {
  switch (orbitalType) {
    case 's': return 0.9;
    case 'p': return 0.7;
    case 'd': return 0.4;
    case 'f': return 0.2;
    default: return 0.5;
  }
}
