/**
 * Atomic Adapter Types
 * 
 * Type definitions for the atomic domain adapter.
 */

import type { PeriodicGroup } from './periodicPatterns';
import type { OrbitalType, SpinType } from './quantumPatterns';

export interface AtomicData {
  elementGroup: PeriodicGroup;
  quantumState: {
    principalLevel: number;
    orbitalType: OrbitalType;
    spin: SpinType;
  };
  spectralEnergy: number; // Normalized 0-1
  stabilityIndex: number; // Noble gas similarity
  reactivityPotential: number; // Valence electron availability
  resonanceFrequency: number; // Hz normalized
}
