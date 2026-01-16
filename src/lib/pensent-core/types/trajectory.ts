/**
 * En Pensent Core SDK - Trajectory Prediction Types
 */

/**
 * A milestone in the predicted trajectory
 */
export interface TrajectoryMilestone {
  /** Predicted position in sequence */
  predictedIndex: number;
  /** What happens at this milestone */
  event: string;
  /** Probability of this occurring (0-1) */
  probability: number;
  /** Impact if it occurs (-1 to 1) */
  impact: number;
  /** Recommended action */
  recommendation?: string;
}

/**
 * Full trajectory prediction
 */
export interface TrajectoryPrediction {
  /** Predicted final outcome */
  predictedOutcome: string;
  /** Confidence in prediction (0-1) */
  confidence: number;
  /** Win probability for primary side */
  primaryWinProbability: number;
  /** Win probability for secondary side */
  secondaryWinProbability: number;
  /** Draw/neutral probability */
  drawProbability: number;
  /** Key milestones ahead */
  milestones: TrajectoryMilestone[];
  /** Recommended strategy */
  strategicGuidance: string;
  /** How far ahead we can reliably predict */
  lookaheadHorizon: number;
  /** Based on how many similar patterns */
  patternSampleSize: number;
}
