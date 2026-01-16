/**
 * En Pensent Core SDK - Trajectory Prediction
 * 
 * Universal, domain-agnostic algorithms for predicting future trajectories.
 * This file re-exports from focused modules for backward compatibility.
 */

import { 
  TemporalSignature,
  TrajectoryPrediction,
  PatternMatch,
  ArchetypeDefinition
} from './types';
import { 
  calculateOutcomeProbabilities, 
  getMostLikelyOutcome,
  calculateMatchConfidence 
} from './patternMatcher';

// Re-export configuration
export { DEFAULT_PREDICTION_CONFIG } from './trajectory/config';
export type { PredictionConfig } from './trajectory/config';

// Re-export helper functions
export { 
  generateMilestones, 
  formatArchetype, 
  getArchetypeRecommendation 
} from './trajectory/milestoneGenerator';

export { 
  generateStrategicGuidance, 
  formatOutcome 
} from './trajectory/guidanceGenerator';

export { 
  assessTrajectorySustainability, 
  calculateTrajectoryDivergence
} from './trajectory/sustainabilityAssessor';
export type { SustainabilityAssessment } from './trajectory/sustainabilityAssessor';

// Import for internal use
import { PredictionConfig, DEFAULT_PREDICTION_CONFIG } from './trajectory/config';
import { generateMilestones } from './trajectory/milestoneGenerator';
import { generateStrategicGuidance } from './trajectory/guidanceGenerator';

/**
 * Generate trajectory prediction from pattern matches
 * 
 * This function is domain-agnostic and works with any TemporalSignature.
 * It uses configurable outcome mappings to support different domains.
 */
export function generateTrajectoryPrediction(
  currentSignature: TemporalSignature,
  matches: PatternMatch[],
  archetypeDefinition: ArchetypeDefinition | null,
  currentPosition: number,
  totalExpectedLength: number,
  config: Partial<PredictionConfig> = {}
): TrajectoryPrediction {
  const cfg = { ...DEFAULT_PREDICTION_CONFIG, ...config };
  
  // Calculate outcome probabilities
  const outcomeProbabilities = calculateOutcomeProbabilities(matches);
  const mostLikely = getMostLikelyOutcome(matches);
  
  // Calculate confidence using configurable weights
  const matchConfidence = calculateMatchConfidence(matches, cfg.minSampleSize);
  const archetypeConfidence = archetypeDefinition?.confidence ?? 0.5;
  const overallConfidence = 
    (matchConfidence * cfg.matchConfidenceWeight) + 
    (archetypeConfidence * cfg.archetypeConfidenceWeight);
  
  // Determine win probabilities using flexible outcome mapping
  const primaryWinProb = findOutcomeProbability(
    outcomeProbabilities, 
    cfg.outcomeMapping?.primaryWin ?? []
  ) ?? 0.33;
  
  const secondaryWinProb = findOutcomeProbability(
    outcomeProbabilities, 
    cfg.outcomeMapping?.secondaryWin ?? []
  ) ?? 0.33;
  
  const drawProb = Math.max(0, 1 - primaryWinProb - secondaryWinProb);
  
  // Generate milestones based on signature analysis
  const milestones = generateMilestones(
    currentSignature,
    matches,
    currentPosition,
    totalExpectedLength
  );
  
  // Generate strategic guidance
  const strategicGuidance = generateStrategicGuidance(
    currentSignature,
    archetypeDefinition,
    outcomeProbabilities
  );
  
  // Calculate lookahead horizon (how far we can reliably predict)
  const remainingMoves = totalExpectedLength - currentPosition;
  const lookaheadHorizon = Math.min(
    remainingMoves,
    Math.floor(cfg.maxLookahead * overallConfidence)
  );
  
  return {
    predictedOutcome: mostLikely?.outcome ?? 'uncertain',
    confidence: overallConfidence,
    primaryWinProbability: primaryWinProb,
    secondaryWinProbability: secondaryWinProb,
    drawProbability: drawProb,
    milestones,
    strategicGuidance,
    lookaheadHorizon,
    patternSampleSize: matches.length
  };
}

/**
 * Find outcome probability from multiple possible keys
 */
function findOutcomeProbability(
  probabilities: Record<string, number>,
  keys: string[]
): number | null {
  for (const key of keys) {
    if (probabilities[key] !== undefined) {
      return probabilities[key];
    }
  }
  return null;
}
