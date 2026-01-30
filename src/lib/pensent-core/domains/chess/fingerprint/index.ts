/**
 * Player Fingerprint System
 * 
 * Creates unique behavioral signatures WITHOUT storing personal data.
 * We only care about the PATTERN, not the person.
 * 
 * Each fingerprint captures:
 * - Playing style tendencies
 * - Blunder patterns under pressure
 * - Emotional response signatures
 * - Time management habits
 */

// Types
export type {
  PlayerFingerprint,
  StyleProfile,
  PressureProfile,
  BlunderSignature,
  TemporalPatterns,
  GameData,
  GameAnalysis
} from './types';

// Game analysis
export { analyzeGame } from './gameAnalyzer';

// Profile calculators
export {
  calculateStyleProfile,
  calculatePressureProfile,
  calculateBlunderSignature,
  calculateTemporalPatterns
} from './profileCalculators';

// Fingerprint building
export { buildFingerprint, mergeFingerprints } from './fingerprintBuilder';

// Fingerprint comparison
export { 
  compareFingerprintSimilarity, 
  getDetailedSimilarity,
  type FingerprintSimilarity 
} from './fingerprintComparator';
