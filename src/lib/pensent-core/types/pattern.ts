/**
 * En Pensent Core SDK - Pattern Matching Types
 */

import { TemporalSignature } from './core';

/**
 * A matched pattern from the database
 */
export interface PatternMatch {
  /** Pattern ID from database */
  patternId: string;
  /** Similarity score (0-1) */
  similarity: number;
  /** The matched pattern's signature */
  signature: TemporalSignature;
  /** Outcome of this historical pattern */
  outcome: string;
  /** Metadata about the source */
  sourceMetadata?: Record<string, unknown>;
}

/**
 * Pattern search criteria
 */
export interface PatternSearchCriteria {
  /** Target signature to match against */
  targetSignature: TemporalSignature;
  /** Minimum similarity threshold (0-1) */
  minSimilarity?: number;
  /** Maximum results to return */
  limit?: number;
  /** Filter by archetype */
  archetypeFilter?: string[];
  /** Filter by outcome */
  outcomeFilter?: string[];
}
