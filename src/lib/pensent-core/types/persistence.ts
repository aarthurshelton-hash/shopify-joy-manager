/**
 * En Pensent Core SDK - Persistence Types
 */

import { TemporalSignature } from './core';

/**
 * Persisted pattern record
 */
export interface PersistedPattern {
  id: string;
  domain: string;
  fingerprint: string;
  archetype: string;
  outcome: string;
  signature: TemporalSignature;
  metadata: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
}

/**
 * Pattern statistics
 */
export interface PatternStats {
  domain: string;
  totalPatterns: number;
  byArchetype: Record<string, number>;
  byOutcome: Record<string, number>;
  averageSimilarityScore: number;
  oldestPattern: string;
  newestPattern: string;
}
