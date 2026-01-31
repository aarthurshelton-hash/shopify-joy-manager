/**
 * Meta-Learning System for Chess Predictions - Priority 3.1
 * 
 * Implements archetype-specific learning rates and adaptive
 * confidence recalibration based on historical performance.
 * 
 * Patent Pending - Alec Arthur Shelton
 */

// ============================================================================
// ARCHETYPE LEARNING RATE CONFIGURATION
// ============================================================================

export interface ArchetypeLearningRate {
  archetype: string;
  baseRate: number;           // Base learning rate (0.01 - 0.10)
  volatilityAdjustment: number; // Multiplier for volatile positions (0.5 - 2.0)
  recencyWeight: number;      // Weight given to recent predictions (0.3 - 0.9)
  minSamplesForAdaptation: number; // Minimum samples before adapting
}

/**
 * Archetype-specific learning rate configurations
 * Tactical archetypes need faster adaptation; positional ones are more stable
 */
export const ARCHETYPE_LEARNING_RATES: Record<string, ArchetypeLearningRate> = {
  // HIGH VOLATILITY ARCHETYPES (fast learning)
  'tactical_storm': { 
    archetype: 'tactical_storm',
    baseRate: 0.05, 
    volatilityAdjustment: 1.5, 
    recencyWeight: 0.7,
    minSamplesForAdaptation: 5
  },
  'king_hunt': { 
    archetype: 'king_hunt',
    baseRate: 0.06, 
    volatilityAdjustment: 1.6, 
    recencyWeight: 0.75,
    minSamplesForAdaptation: 4
  },
  'aggressive_attack': {
    archetype: 'aggressive_attack',
    baseRate: 0.05,
    volatilityAdjustment: 1.4,
    recencyWeight: 0.7,
    minSamplesForAdaptation: 5
  },
  'exchange_sacrifice': {
    archetype: 'exchange_sacrifice',
    baseRate: 0.055,
    volatilityAdjustment: 1.5,
    recencyWeight: 0.72,
    minSamplesForAdaptation: 6
  },
  'open_tactical': {
    archetype: 'open_tactical',
    baseRate: 0.048,
    volatilityAdjustment: 1.35,
    recencyWeight: 0.68,
    minSamplesForAdaptation: 6
  },
  
  // MEDIUM VOLATILITY ARCHETYPES (balanced learning)
  'kingside_attack': { 
    archetype: 'kingside_attack',
    baseRate: 0.04, 
    volatilityAdjustment: 1.2, 
    recencyWeight: 0.6,
    minSamplesForAdaptation: 7
  },
  'queenside_expansion': { 
    archetype: 'queenside_expansion',
    baseRate: 0.035, 
    volatilityAdjustment: 1.1, 
    recencyWeight: 0.55,
    minSamplesForAdaptation: 8
  },
  'central_domination': {
    archetype: 'central_domination',
    baseRate: 0.035,
    volatilityAdjustment: 1.15,
    recencyWeight: 0.55,
    minSamplesForAdaptation: 7
  },
  'piece_harmony': {
    archetype: 'piece_harmony',
    baseRate: 0.038,
    volatilityAdjustment: 1.1,
    recencyWeight: 0.58,
    minSamplesForAdaptation: 7
  },
  'dynamic_imbalance': {
    archetype: 'dynamic_imbalance',
    baseRate: 0.042,
    volatilityAdjustment: 1.25,
    recencyWeight: 0.62,
    minSamplesForAdaptation: 6
  },
  
  // LOW VOLATILITY ARCHETYPES (slow, stable learning)
  'positional_grind': { 
    archetype: 'positional_grind',
    baseRate: 0.03, 
    volatilityAdjustment: 0.8, 
    recencyWeight: 0.5,
    minSamplesForAdaptation: 10
  },
  'prophylactic_defense': {
    archetype: 'prophylactic_defense',
    baseRate: 0.028,
    volatilityAdjustment: 0.75,
    recencyWeight: 0.48,
    minSamplesForAdaptation: 12
  },
  'closed_maneuvering': {
    archetype: 'closed_maneuvering',
    baseRate: 0.03,
    volatilityAdjustment: 0.8,
    recencyWeight: 0.5,
    minSamplesForAdaptation: 10
  },
  'strategic_squeeze': {
    archetype: 'strategic_squeeze',
    baseRate: 0.032,
    volatilityAdjustment: 0.85,
    recencyWeight: 0.52,
    minSamplesForAdaptation: 9
  },
  
  // ENDGAME ARCHETYPES (high confidence, moderate learning)
  'endgame_technique': {
    archetype: 'endgame_technique',
    baseRate: 0.035,
    volatilityAdjustment: 0.9,
    recencyWeight: 0.55,
    minSamplesForAdaptation: 8
  },
  'endgame_virtuoso': {
    archetype: 'endgame_virtuoso',
    baseRate: 0.032,
    volatilityAdjustment: 0.85,
    recencyWeight: 0.52,
    minSamplesForAdaptation: 9
  },
  'endgame_conversion': {
    archetype: 'endgame_conversion',
    baseRate: 0.034,
    volatilityAdjustment: 0.88,
    recencyWeight: 0.54,
    minSamplesForAdaptation: 8
  },
  
  // UNIVERSAL/BALANCED ARCHETYPES
  'universal_player': {
    archetype: 'universal_player',
    baseRate: 0.025,
    volatilityAdjustment: 1.0,
    recencyWeight: 0.5,
    minSamplesForAdaptation: 15
  },
  'balanced': {
    archetype: 'balanced',
    baseRate: 0.025,
    volatilityAdjustment: 1.0,
    recencyWeight: 0.5,
    minSamplesForAdaptation: 15
  },
  'white_initiative': {
    archetype: 'white_initiative',
    baseRate: 0.035,
    volatilityAdjustment: 1.1,
    recencyWeight: 0.55,
    minSamplesForAdaptation: 8
  },
  'black_initiative': {
    archetype: 'black_initiative',
    baseRate: 0.035,
    volatilityAdjustment: 1.1,
    recencyWeight: 0.55,
    minSamplesForAdaptation: 8
  },
  'diagonal_play': {
    archetype: 'diagonal_play',
    baseRate: 0.033,
    volatilityAdjustment: 1.05,
    recencyWeight: 0.52,
    minSamplesForAdaptation: 9
  },
};

// Default learning rate for unknown archetypes
const DEFAULT_LEARNING_RATE: ArchetypeLearningRate = {
  archetype: 'unknown',
  baseRate: 0.025,
  volatilityAdjustment: 1.0,
  recencyWeight: 0.5,
  minSamplesForAdaptation: 15
};

// ============================================================================
// ADAPTIVE LEARNING RATE CALCULATION
// ============================================================================

/**
 * Get the adaptive learning rate for an archetype based on current performance
 * 
 * Logic:
 * - Higher accuracy → slower learning (trust established patterns)
 * - Lower accuracy → faster learning (need to adapt quickly)
 * - Small sample size → faster learning (explore more)
 * - Large sample size → slower learning (exploit knowledge)
 */
export function getAdaptiveLearningRate(
  archetype: string,
  recentAccuracy: number,
  sampleSize: number,
  isVolatilePosition: boolean = false
): number {
  const config = ARCHETYPE_LEARNING_RATES[archetype] || DEFAULT_LEARNING_RATE;
  
  // Base rate from config
  let rate = config.baseRate;
  
  // Accuracy-based adjustment
  // High accuracy (>70%) = slower learning (factor 0.5)
  // Low accuracy (<50%) = faster learning (factor 1.5)
  const accuracyFactor = recentAccuracy > 0.7 
    ? 0.5 
    : recentAccuracy < 0.5 
      ? 1.5 
      : 1.0;
  
  // Sample size adjustment
  // Small sample (<10) = faster learning (factor 2.0)
  // Large sample (>100) = slower learning (factor 0.7)
  const sampleFactor = sampleSize < config.minSamplesForAdaptation 
    ? 2.0 
    : sampleSize > 100 
      ? 0.7 
      : 1.0;
  
  // Volatility adjustment from config
  const volatilityFactor = isVolatilePosition ? config.volatilityAdjustment : 1.0;
  
  // Calculate final rate
  rate = rate * accuracyFactor * sampleFactor * volatilityFactor;
  
  // Clamp to reasonable bounds
  return Math.max(0.005, Math.min(0.15, rate));
}

// ============================================================================
// CONFIDENCE RECALIBRATION (Platt Scaling)
// ============================================================================

/**
 * Recalibrate confidence using Platt scaling principles
 * 
 * If we're historically overconfident (accuracy < confidence), reduce confidence
 * If we're historically underconfident (accuracy > confidence), increase confidence
 */
export function recalibrateConfidence(
  rawConfidence: number,
  archetype: string,
  historicalAccuracy: number,
  sampleSize: number
): { calibratedConfidence: number; calibrationFactor: number; reason: string } {
  // Not enough data for calibration
  if (sampleSize < 10) {
    return {
      calibratedConfidence: rawConfidence,
      calibrationFactor: 1.0,
      reason: 'Insufficient samples for calibration'
    };
  }
  
  // Target accuracy for calibration (we aim for 70% as "well-calibrated")
  const TARGET_ACCURACY = 0.70;
  
  // Calibration factor: historical accuracy / target
  const calibrationFactor = historicalAccuracy / TARGET_ACCURACY;
  
  // Apply calibration
  let calibrated = rawConfidence * calibrationFactor;
  
  // Archetype-specific adjustments
  const config = ARCHETYPE_LEARNING_RATES[archetype];
  if (config) {
    // Tactical positions are more volatile - reduce confidence slightly
    if (config.volatilityAdjustment > 1.3) {
      calibrated *= 0.95;
    }
    // Endgames are more deterministic - increase confidence
    else if (archetype.includes('endgame')) {
      calibrated *= 1.05;
    }
  }
  
  // Clamp to valid range
  calibrated = Math.max(0.30, Math.min(0.95, calibrated));
  
  // Generate reason
  let reason = '';
  if (calibrationFactor > 1.1) {
    reason = `Underconfident (historical ${(historicalAccuracy * 100).toFixed(0)}% > target ${(TARGET_ACCURACY * 100).toFixed(0)}%)`;
  } else if (calibrationFactor < 0.9) {
    reason = `Overconfident (historical ${(historicalAccuracy * 100).toFixed(0)}% < target ${(TARGET_ACCURACY * 100).toFixed(0)}%)`;
  } else {
    reason = 'Well-calibrated';
  }
  
  return {
    calibratedConfidence: calibrated,
    calibrationFactor,
    reason
  };
}

// ============================================================================
// ENSEMBLE PREDICTION (Priority 5.2)
// ============================================================================

export interface PredictionComponent {
  prediction: string;     // 'white', 'black', 'draw'
  confidence: number;     // 0-1
  weight: number;         // Component weight in ensemble
  source: string;         // 'color_flow', 'material', 'space', 'time_pressure'
}

export interface MaterialAnalysis {
  prediction: string;
  confidence: number;
  materialBalance: number; // Positive = white advantage
}

export interface SpaceAnalysis {
  prediction: string;
  confidence: number;
  spaceAdvantage: number; // Positive = white has more space
}

export interface TimeAnalysis {
  prediction: string;
  confidence: number;
  timePressure: number;   // 0-1: how much time pressure exists
}

/**
 * Combine multiple analysis methods into a single prediction
 * 
 * Components:
 * 1. Color Flow pattern analysis (50% weight) - primary method
 * 2. Material flow trajectory (25% weight) - captures to material
 * 3. Space advantage evolution (15% weight) - positional pressure
 * 4. Time pressure indicators (10% weight) - clock considerations
 */
export function ensemblePrediction(
  colorFlowResult: { prediction: string; confidence: number },
  materialTrajectory: MaterialAnalysis,
  spaceEvolution: SpaceAnalysis,
  timePressure: TimeAnalysis
): {
  prediction: string;
  confidence: number;
  components: PredictionComponent[];
  unanimity: boolean;
} {
  const components: PredictionComponent[] = [
    { 
      prediction: colorFlowResult.prediction, 
      confidence: colorFlowResult.confidence, 
      weight: 0.50,
      source: 'color_flow'
    },
    { 
      prediction: materialTrajectory.prediction, 
      confidence: materialTrajectory.confidence, 
      weight: 0.25,
      source: 'material'
    },
    { 
      prediction: spaceEvolution.prediction, 
      confidence: spaceEvolution.confidence, 
      weight: 0.15,
      source: 'space'
    },
    { 
      prediction: timePressure.prediction, 
      confidence: timePressure.confidence, 
      weight: 0.10,
      source: 'time_pressure'
    },
  ];
  
  // Weighted vote calculation
  const votes: Record<string, number> = {
    'white': 0,
    'black': 0,
    'draw': 0,
  };
  
  for (const component of components) {
    const pred = component.prediction.toLowerCase().includes('white') ? 'white' :
                 component.prediction.toLowerCase().includes('black') ? 'black' : 'draw';
    votes[pred] += component.confidence * component.weight;
  }
  
  // Find winner
  const entries = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  const winner = entries[0];
  
  // Check for unanimity (all components agree)
  const predictions = components.map(c => {
    return c.prediction.toLowerCase().includes('white') ? 'white' :
           c.prediction.toLowerCase().includes('black') ? 'black' : 'draw';
  });
  const unanimity = new Set(predictions).size === 1;
  
  // Boost confidence if unanimous
  let finalConfidence = winner[1];
  if (unanimity) {
    finalConfidence = Math.min(0.95, finalConfidence * 1.15);
  }
  
  return {
    prediction: winner[0],
    confidence: finalConfidence,
    components,
    unanimity,
  };
}

// ============================================================================
// HELPER FUNCTIONS FOR ENSEMBLE COMPONENTS
// ============================================================================

/**
 * Analyze material trajectory from moves
 */
export function analyzeMaterialTrajectory(moves: string[]): MaterialAnalysis {
  let whiteMaterial = 0;
  let blackMaterial = 0;
  
  // Count captures by color
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const isWhite = i % 2 === 0;
    
    if (move.includes('x')) {
      // Estimate captured piece value
      let value = 1; // Pawn default
      if (move.includes('Q') || move.toLowerCase().includes('q')) value = 9;
      else if (move.includes('R') || move.toLowerCase().includes('r')) value = 5;
      else if (move.includes('B') || move.toLowerCase().includes('b')) value = 3;
      else if (move.includes('N') || move.toLowerCase().includes('n')) value = 3;
      
      if (isWhite) whiteMaterial += value;
      else blackMaterial += value;
    }
  }
  
  const balance = whiteMaterial - blackMaterial;
  
  let prediction = 'draw';
  let confidence = 0.5;
  
  if (balance > 3) {
    prediction = 'white';
    confidence = 0.6 + Math.min(0.3, balance / 15);
  } else if (balance < -3) {
    prediction = 'black';
    confidence = 0.6 + Math.min(0.3, Math.abs(balance) / 15);
  }
  
  return { prediction, confidence, materialBalance: balance };
}

/**
 * Analyze space advantage evolution
 */
export function analyzeSpaceEvolution(moves: string[]): SpaceAnalysis {
  let whiteSpace = 0;
  let blackSpace = 0;
  
  // Analyze pawn advances and piece development
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const isWhite = i % 2 === 0;
    
    // Pawn advances gain space
    if (/^[a-h][4-8]/.test(move) && isWhite) whiteSpace += 1;
    if (/^[a-h][1-5]/.test(move) && !isWhite) blackSpace += 1;
    
    // Central pawns worth more
    if (/^[de][4-5]/.test(move)) {
      if (isWhite) whiteSpace += 2;
      else blackSpace += 2;
    }
  }
  
  const spaceAdvantage = whiteSpace - blackSpace;
  
  let prediction = 'draw';
  let confidence = 0.5;
  
  if (spaceAdvantage > 4) {
    prediction = 'white';
    confidence = 0.55 + Math.min(0.25, spaceAdvantage / 20);
  } else if (spaceAdvantage < -4) {
    prediction = 'black';
    confidence = 0.55 + Math.min(0.25, Math.abs(spaceAdvantage) / 20);
  }
  
  return { prediction, confidence, spaceAdvantage };
}

/**
 * Analyze time pressure indicators
 */
export function analyzeTimePressure(moves: string[], timeControl?: string): TimeAnalysis {
  const moveCount = moves.length;
  
  // Estimate time pressure based on game phase
  let timePressure = 0;
  
  if (timeControl) {
    if (timeControl.includes('bullet')) timePressure = 0.7;
    else if (timeControl.includes('blitz')) timePressure = 0.5;
    else if (timeControl.includes('rapid')) timePressure = 0.3;
    else timePressure = 0.1;
  } else {
    // Estimate from move count
    timePressure = moveCount > 60 ? 0.6 : moveCount > 40 ? 0.4 : 0.2;
  }
  
  // Late game moves often have more errors
  const lateGameMoves = moves.slice(-10);
  const lateErrors = lateGameMoves.filter(m => 
    !m.includes('+') && !m.includes('x') && m.length > 3
  ).length;
  
  // Higher late errors = player under pressure
  if (lateErrors > 6) {
    timePressure = Math.min(1, timePressure + 0.2);
  }
  
  // In time pressure, the player with initiative often wins
  const whiteLastMoves = moves.slice(-10).filter((_, i) => i % 2 === 0).length;
  const blackLastMoves = moves.slice(-10).filter((_, i) => i % 2 === 1).length;
  
  let prediction = 'draw';
  let confidence = 0.45;
  
  if (timePressure > 0.5) {
    // High time pressure - momentum matters more
    const whiteMomentum = moves.slice(-6).filter((m, i) => i % 2 === 0 && (m.includes('+') || m.includes('x'))).length;
    const blackMomentum = moves.slice(-6).filter((m, i) => i % 2 === 1 && (m.includes('+') || m.includes('x'))).length;
    
    if (whiteMomentum > blackMomentum + 1) {
      prediction = 'white';
      confidence = 0.55;
    } else if (blackMomentum > whiteMomentum + 1) {
      prediction = 'black';
      confidence = 0.55;
    }
  }
  
  return { prediction, confidence, timePressure };
}
