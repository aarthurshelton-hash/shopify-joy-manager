/**
 * En Pensent Core SDK - Trajectory Prediction
 * 
 * Universal, domain-agnostic algorithms for predicting future trajectories
 * from pattern analysis using only the base TemporalSignature interface.
 */

import { 
  TemporalSignature,
  TrajectoryPrediction,
  TrajectoryMilestone,
  PatternMatch,
  ArchetypeDefinition
} from './types';
import { 
  calculateOutcomeProbabilities, 
  getMostLikelyOutcome,
  calculateMatchConfidence 
} from './patternMatcher';

// ===================== CONFIGURATION =====================

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

// ===================== MAIN PREDICTION FUNCTIONS =====================

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

/**
 * Generate milestones based on pattern analysis
 */
function generateMilestones(
  signature: TemporalSignature,
  matches: PatternMatch[],
  currentPosition: number,
  totalExpectedLength: number
): TrajectoryMilestone[] {
  const milestones: TrajectoryMilestone[] = [];
  const remaining = totalExpectedLength - currentPosition;
  
  if (remaining <= 0) return milestones;
  
  // Milestone 1: Critical decision point (25% into remaining)
  const criticalPoint = Math.floor(currentPosition + remaining * 0.25);
  milestones.push({
    predictedIndex: criticalPoint,
    event: 'Critical Decision Point',
    probability: 0.75,
    impact: signature.intensity > 0.6 ? 0.8 : 0.5,
    recommendation: signature.temporalFlow.trend === 'accelerating' 
      ? 'Maintain momentum' 
      : 'Consider strategic pivot'
  });
  
  // Milestone 2: Trajectory confirmation (50% into remaining)
  const confirmationPoint = Math.floor(currentPosition + remaining * 0.5);
  milestones.push({
    predictedIndex: confirmationPoint,
    event: 'Trajectory Confirmation',
    probability: 0.65,
    impact: 0.6,
    recommendation: 'Evaluate if current pattern holds'
  });
  
  // Milestone 3: Based on archetype
  if (signature.archetype && remaining > 10) {
    const archetypeMilestone = Math.floor(currentPosition + remaining * 0.7);
    milestones.push({
      predictedIndex: archetypeMilestone,
      event: `${formatArchetype(signature.archetype)} Phase`,
      probability: 0.7,
      impact: 0.7,
      recommendation: getArchetypeRecommendation(signature.archetype)
    });
  }
  
  // Milestone 4: Critical moments from signature
  for (const moment of signature.criticalMoments.slice(0, 2)) {
    if (moment.index > currentPosition) {
      milestones.push({
        predictedIndex: moment.index,
        event: moment.description,
        probability: moment.severity,
        impact: moment.severity,
        recommendation: `Prepare for ${moment.type}`
      });
    }
  }
  
  // Sort by index
  milestones.sort((a, b) => a.predictedIndex - b.predictedIndex);
  
  return milestones.slice(0, 5); // Return top 5 milestones
}

/**
 * Generate strategic guidance based on analysis
 */
function generateStrategicGuidance(
  signature: TemporalSignature,
  archetypeDefinition: ArchetypeDefinition | null,
  outcomeProbabilities: Record<string, number>
): string {
  const parts: string[] = [];
  
  // Archetype-based guidance
  if (archetypeDefinition) {
    parts.push(`Pattern matches "${archetypeDefinition.name}" archetype`);
    if (archetypeDefinition.successRate > 0.6) {
      parts.push(`historically successful ${Math.round(archetypeDefinition.successRate * 100)}% of the time`);
    }
  }
  
  // Flow-based guidance
  switch (signature.temporalFlow.trend) {
    case 'accelerating':
      parts.push('Momentum is building - capitalize on current trajectory');
      break;
    case 'declining':
      parts.push('Activity declining - consider repositioning or intervention');
      break;
    case 'volatile':
      parts.push('High volatility detected - exercise caution');
      break;
    case 'stable':
      parts.push('Stable trajectory - maintain current course');
      break;
  }
  
  // Dominant force guidance
  if (signature.dominantForce !== 'balanced') {
    parts.push(`${signature.dominantForce === 'primary' ? 'Primary' : 'Secondary'} force has initiative`);
  }
  
  // Probability-based guidance
  const topOutcome = Object.entries(outcomeProbabilities)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (topOutcome && topOutcome[1] > 0.5) {
    parts.push(`${Math.round(topOutcome[1] * 100)}% trajectory toward ${formatOutcome(topOutcome[0])}`);
  }
  
  return parts.join('. ') + '.';
}

/**
 * Format archetype name for display
 */
function formatArchetype(archetype: string): string {
  return archetype
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format outcome for display
 */
function formatOutcome(outcome: string): string {
  return outcome
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get recommendation for archetype
 */
function getArchetypeRecommendation(archetype: string): string {
  const recommendations: Record<string, string> = {
    'rapid_growth': 'Sustain growth rate while building infrastructure',
    'refactor_cycle': 'Complete refactoring before adding new features',
    'tech_debt_spiral': 'Address technical debt immediately',
    'stability_plateau': 'Consider innovation to avoid stagnation',
    'feature_burst': 'Consolidate gains and improve test coverage',
    'death_march': 'Reduce scope and prioritize sustainability',
    'kingside_attack': 'Press the attack while maintaining defense',
    'queenside_attack': 'Expand territorial control',
    'central_domination': 'Leverage central control for flexibility',
    'tactical_chaos': 'Calculate carefully, avoid simplification'
  };
  
  return recommendations[archetype] ?? 'Continue current strategy with vigilance';
}

/**
 * Calculate trajectory divergence (how much current path differs from historical patterns)
 */
export function calculateTrajectoryDivergence(
  currentSignature: TemporalSignature,
  matches: PatternMatch[]
): number {
  if (matches.length === 0) return 1; // Maximum divergence if no matches
  
  // Calculate average signature of matches
  const avgIntensity = matches.reduce((sum, m) => sum + m.signature.intensity, 0) / matches.length;
  const avgMomentum = matches.reduce((sum, m) => sum + m.signature.temporalFlow.momentum, 0) / matches.length;
  
  // Calculate divergence from average
  const intensityDivergence = Math.abs(currentSignature.intensity - avgIntensity);
  const momentumDivergence = Math.abs(currentSignature.temporalFlow.momentum - avgMomentum) / 2;
  
  return (intensityDivergence + momentumDivergence) / 2;
}

/**
 * Predict if current trajectory is sustainable
 */
export function assessTrajectorySustainability(
  signature: TemporalSignature
): { sustainable: boolean; reason: string; riskLevel: 'low' | 'medium' | 'high' } {
  const { temporalFlow, intensity, criticalMoments } = signature;
  
  // Check for unsustainable patterns
  if (temporalFlow.trend === 'accelerating' && intensity > 0.8) {
    return {
      sustainable: false,
      reason: 'High intensity with accelerating trend may lead to burnout',
      riskLevel: 'high'
    };
  }
  
  if (temporalFlow.trend === 'declining' && temporalFlow.momentum < -0.5) {
    return {
      sustainable: false,
      reason: 'Declining trend with negative momentum indicates loss of direction',
      riskLevel: 'high'
    };
  }
  
  if (criticalMoments.filter(m => m.severity > 0.7).length > 3) {
    return {
      sustainable: false,
      reason: 'Too many critical moments indicate instability',
      riskLevel: 'medium'
    };
  }
  
  if (temporalFlow.trend === 'volatile') {
    return {
      sustainable: true,
      reason: 'Volatile but may stabilize',
      riskLevel: 'medium'
    };
  }
  
  return {
    sustainable: true,
    reason: 'Current trajectory appears sustainable',
    riskLevel: 'low'
  };
}
