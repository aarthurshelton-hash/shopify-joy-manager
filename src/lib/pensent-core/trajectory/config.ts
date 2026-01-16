/**
 * En Pensent Core SDK - Trajectory Prediction Configuration
 */

/**
 * Domain-agnostic prediction configuration
 */
export interface PredictionConfig {
  /** Weight for pattern match confidence in overall score */
  matchConfidenceWeight: number;
  /** Weight for archetype confidence in overall score */
  archetypeConfidenceWeight: number;
  /** Maximum lookahead horizon (in sequence units) */
  maxLookahead: number;
  /** Minimum sample size for reliable predictions */
  minSampleSize: number;
  /** Outcome key mappings for domain flexibility */
  outcomeMapping?: {
    primaryWin?: string[];
    secondaryWin?: string[];
    draw?: string[];
  };
}

export const DEFAULT_PREDICTION_CONFIG: PredictionConfig = {
  matchConfidenceWeight: 0.6,
  archetypeConfidenceWeight: 0.4,
  maxLookahead: 80,
  minSampleSize: 5,
  outcomeMapping: {
    primaryWin: ['primary_wins', 'white_wins', 'success', 'win'],
    secondaryWin: ['secondary_wins', 'black_wins', 'failure', 'loss'],
    draw: ['draw', 'neutral', 'uncertain', 'tie']
  }
};
