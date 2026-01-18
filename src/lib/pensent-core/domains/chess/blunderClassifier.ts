/**
 * Blunder Classification Engine
 * 
 * Distinguishes between:
 * - Computational Blunders: Pure knowledge gaps (engines make these too)
 * - Human Blunders: Emotional/psychological pressure-induced errors
 * 
 * The key insight: Engines blunder from complexity limits.
 * Humans blunder from time pressure, tilt, fatigue, and emotional states.
 */

export interface BlunderAnalysis {
  type: 'computational' | 'human' | 'hybrid';
  confidence: number;
  
  // Computational indicators
  complexityScore: number;      // Position complexity (0-1)
  depthRequired: number;        // Plies needed to see the issue
  tacticalPattern: string;      // e.g., 'fork', 'pin', 'discovered_attack'
  
  // Human indicators
  timePressureScore: number;    // Time remaining vs average (0-1)
  emotionalMarkers: EmotionalMarker[];
  patternFromProfile: boolean;  // Does this match player's blunder profile?
  tiltProbability: number;      // Likelihood of being "on tilt"
  
  // Cross-domain insight
  marketEquivalent: string;     // What this looks like in trading
}

export interface EmotionalMarker {
  type: 'frustration' | 'overconfidence' | 'fear' | 'fatigue' | 'revenge' | 'impatience';
  evidence: string;
  intensity: number;
}

export interface MoveContext {
  fen: string;
  movePlayed: string;
  bestMove: string;
  evalBefore: number;
  evalAfter: number;
  timeSpent: number;
  averageTimeSpent: number;
  moveNumber: number;
  totalMoves: number;
  previousBlunders: number;
  timeSinceLastBlunder: number;
  gamePhase: 'opening' | 'middlegame' | 'endgame';
}

/**
 * Classify a blunder as computational or human
 */
export function classifyBlunder(context: MoveContext): BlunderAnalysis {
  const evalDrop = Math.abs(context.evalAfter - context.evalBefore);
  
  // Computational indicators
  const complexityScore = calculateComplexityScore(context);
  const depthRequired = estimateDepthRequired(evalDrop, context.gamePhase);
  const tacticalPattern = detectTacticalPattern(context);
  
  // Human indicators
  const timePressureScore = calculateTimePressure(context);
  const emotionalMarkers = detectEmotionalMarkers(context);
  const tiltProbability = calculateTiltProbability(context);
  
  // Classification logic
  const computationalWeight = complexityScore * 0.4 + (depthRequired > 10 ? 0.3 : 0.1) + 0.2;
  const humanWeight = timePressureScore * 0.3 + tiltProbability * 0.3 + 
                     (emotionalMarkers.length > 0 ? 0.2 : 0) + 0.2;
  
  let type: 'computational' | 'human' | 'hybrid';
  let confidence: number;
  
  if (computationalWeight > humanWeight * 1.5) {
    type = 'computational';
    confidence = Math.min(0.95, computationalWeight / (computationalWeight + humanWeight));
  } else if (humanWeight > computationalWeight * 1.5) {
    type = 'human';
    confidence = Math.min(0.95, humanWeight / (computationalWeight + humanWeight));
  } else {
    type = 'hybrid';
    confidence = 0.6;
  }
  
  return {
    type,
    confidence,
    complexityScore,
    depthRequired,
    tacticalPattern,
    timePressureScore,
    emotionalMarkers,
    patternFromProfile: false, // Will be set by fingerprint matcher
    tiltProbability,
    marketEquivalent: mapToMarketBehavior(type, emotionalMarkers)
  };
}

function calculateComplexityScore(context: MoveContext): number {
  // Complexity indicators
  let score = 0;
  
  // Middlegame is most complex
  if (context.gamePhase === 'middlegame') score += 0.3;
  else if (context.gamePhase === 'opening') score += 0.1;
  
  // Position tension from eval swing potential
  const evalMagnitude = Math.abs(context.evalBefore);
  if (evalMagnitude < 1) score += 0.3; // Equal positions are complex
  
  // Move number in typical complexity curve
  if (context.moveNumber > 15 && context.moveNumber < 35) score += 0.2;
  
  // Time spent indicates perceived complexity
  if (context.timeSpent > context.averageTimeSpent * 1.5) score += 0.2;
  
  return Math.min(1, score);
}

function estimateDepthRequired(evalDrop: number, phase: string): number {
  // Rough estimate of calculation depth needed
  const baseDepth = evalDrop > 3 ? 5 : evalDrop > 1 ? 8 : 12;
  
  if (phase === 'endgame') return baseDepth + 5; // Endgames need deeper calc
  if (phase === 'opening') return baseDepth - 2; // Opening blunders are shallow
  
  return baseDepth;
}

function detectTacticalPattern(context: MoveContext): string {
  // Simplified pattern detection
  const evalDrop = context.evalAfter - context.evalBefore;
  
  if (evalDrop < -3) return 'material_loss';
  if (evalDrop < -1.5) return 'positional_collapse';
  if (evalDrop < -0.5) return 'tactical_oversight';
  
  return 'subtle_inaccuracy';
}

function calculateTimePressure(context: MoveContext): number {
  // Time pressure increases blunder likelihood
  const timeRatio = context.timeSpent / context.averageTimeSpent;
  
  if (timeRatio < 0.3) return 0.9; // Very rushed
  if (timeRatio < 0.5) return 0.7; // Rushed
  if (timeRatio < 0.8) return 0.4; // Slightly rushed
  if (timeRatio > 2) return 0.1;   // Overthinking (different pressure)
  
  return 0.2;
}

function detectEmotionalMarkers(context: MoveContext): EmotionalMarker[] {
  const markers: EmotionalMarker[] = [];
  
  // Revenge pattern: Quick move after being blundered against
  if (context.timeSinceLastBlunder < 3 && context.timeSpent < context.averageTimeSpent * 0.5) {
    markers.push({
      type: 'revenge',
      evidence: 'Quick response after opponent blunder',
      intensity: 0.7
    });
  }
  
  // Tilt pattern: Multiple blunders in sequence
  if (context.previousBlunders >= 2) {
    markers.push({
      type: 'frustration',
      evidence: `${context.previousBlunders} previous blunders in game`,
      intensity: Math.min(1, context.previousBlunders * 0.3)
    });
  }
  
  // Impatience in winning positions
  if (context.evalBefore > 2 && context.timeSpent < context.averageTimeSpent * 0.3) {
    markers.push({
      type: 'overconfidence',
      evidence: 'Rushing in winning position',
      intensity: 0.6
    });
  }
  
  // Fear in losing positions
  if (context.evalBefore < -2 && context.timeSpent > context.averageTimeSpent * 2) {
    markers.push({
      type: 'fear',
      evidence: 'Paralysis in losing position',
      intensity: 0.5
    });
  }
  
  return markers;
}

function calculateTiltProbability(context: MoveContext): number {
  let tilt = 0;
  
  // Previous blunders increase tilt
  tilt += context.previousBlunders * 0.15;
  
  // Late game fatigue
  if (context.moveNumber > 40) tilt += 0.1;
  if (context.moveNumber > 60) tilt += 0.15;
  
  // Time scramble
  if (context.timeSpent < context.averageTimeSpent * 0.2) tilt += 0.2;
  
  return Math.min(1, tilt);
}

/**
 * Map chess blunder patterns to equivalent market behaviors
 * This is the KEY insight for cross-domain pattern recognition
 */
function mapToMarketBehavior(
  type: 'computational' | 'human' | 'hybrid',
  markers: EmotionalMarker[]
): string {
  if (type === 'computational') {
    return 'algorithmic_edge_case'; // Like algos hitting unusual market conditions
  }
  
  const dominantEmotion = markers.length > 0 ? markers[0].type : null;
  
  switch (dominantEmotion) {
    case 'revenge':
      return 'revenge_trade'; // Doubling down after loss
    case 'frustration':
      return 'tilt_trading'; // Abandoning strategy
    case 'overconfidence':
      return 'overleveraged_greed'; // Position too large
    case 'fear':
      return 'panic_sell'; // Cutting winners too early
    case 'impatience':
      return 'fomo_entry'; // Chasing momentum
    case 'fatigue':
      return 'end_of_day_errors'; // Late session mistakes
    default:
      return 'mixed_pressure';
  }
}

/**
 * Detect if a market trade exhibits human vs algorithmic characteristics
 */
export function classifyTradeOrigin(tradePattern: {
  executionSpeed: number;      // Milliseconds
  sizeConsistency: number;     // How consistent with previous (0-1)
  timingPrecision: number;     // Deviation from round numbers
  reactionToNews: number;      // Speed of news reaction
  patternAdherence: number;    // Following technical levels
  emotionalIndicators: number; // Counter-trend behavior
}): { origin: 'algorithmic' | 'human' | 'unknown'; confidence: number; reasoning: string } {
  
  let algoScore = 0;
  let humanScore = 0;
  
  // Execution speed
  if (tradePattern.executionSpeed < 50) algoScore += 0.3;
  else if (tradePattern.executionSpeed > 500) humanScore += 0.2;
  
  // Size consistency
  if (tradePattern.sizeConsistency > 0.9) algoScore += 0.2;
  else if (tradePattern.sizeConsistency < 0.5) humanScore += 0.2;
  
  // Timing precision
  if (tradePattern.timingPrecision > 0.95) algoScore += 0.15;
  else if (tradePattern.timingPrecision < 0.7) humanScore += 0.15;
  
  // News reaction
  if (tradePattern.reactionToNews < 100) algoScore += 0.2;
  else if (tradePattern.reactionToNews > 1000) humanScore += 0.15;
  
  // Pattern adherence
  if (tradePattern.patternAdherence > 0.85) algoScore += 0.15;
  
  // Emotional indicators (counter-trend = human)
  if (tradePattern.emotionalIndicators > 0.6) humanScore += 0.25;
  
  const total = algoScore + humanScore;
  
  if (algoScore > humanScore * 1.5) {
    return {
      origin: 'algorithmic',
      confidence: algoScore / total,
      reasoning: 'High execution speed, consistent sizing, precise timing'
    };
  } else if (humanScore > algoScore * 1.5) {
    return {
      origin: 'human',
      confidence: humanScore / total,
      reasoning: 'Variable sizing, emotional patterns, slower execution'
    };
  }
  
  return {
    origin: 'unknown',
    confidence: 0.5,
    reasoning: 'Mixed signals - could be human-guided algorithm'
  };
}
