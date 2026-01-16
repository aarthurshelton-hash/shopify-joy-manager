/**
 * En Pensent Core SDK - Archetype Matching Criteria
 */

/**
 * Archetype matching criteria - domain-agnostic thresholds
 */
export interface ArchetypeMatchCriteria {
  /** Minimum intensity threshold for activity-based archetypes */
  intensityThreshold: number;
  /** Volatility threshold for chaos detection */
  volatilityThreshold: number;
  /** Momentum threshold for trend classification */
  momentumThreshold: number;
  /** Minimum quadrant imbalance for directional archetypes */
  quadrantImbalanceThreshold: number;
}

export const DEFAULT_MATCH_CRITERIA: ArchetypeMatchCriteria = {
  intensityThreshold: 0.6,
  volatilityThreshold: 0.5,
  momentumThreshold: 0.3,
  quadrantImbalanceThreshold: 0.25
};

/**
 * Archetype match result with confidence scoring
 */
export interface ArchetypeMatchResult {
  archetype: string;
  confidence: number;
  matchReasons: string[];
  alternativeArchetypes: Array<{ archetype: string; confidence: number }>;
}
