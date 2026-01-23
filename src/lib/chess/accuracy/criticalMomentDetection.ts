/**
 * Critical Moment Detection - v7.53-ACCURACY
 * 
 * Identifies positions where the game outcome is most influenced.
 * Predictions near critical moments should be weighted higher.
 */

export type CriticalMomentType = 
  | 'tension_break'      // When a pawn tension resolves
  | 'piece_exchange'     // Major piece trade decision
  | 'king_safety'        // Castling or king exposure decision
  | 'pawn_structure'     // Irreversible pawn move
  | 'material_imbalance' // Sacrifice or winning material
  | 'time_pressure'      // Critical time management moment
  | 'breakthrough'       // Breaking through defensive structure
  | 'transition';        // Phase transition (opening->middle, middle->end)

export interface CriticalMoment {
  moveNumber: number;
  type: CriticalMomentType;
  severity: number;  // 0-1, how critical
  description: string;
  predictiveValue: number;  // How much this moment affects outcome
  expectedOutcome?: 'white_advantage' | 'black_advantage' | 'unclear';
}

export interface TensionPoint {
  square: string;
  attackers: number;
  defenders: number;
  value: number;  // Material value at stake
}

/**
 * Severity weights for different critical moment types
 */
export const MOMENT_WEIGHTS: Record<CriticalMomentType, number> = {
  tension_break: 0.7,
  piece_exchange: 0.65,
  king_safety: 0.9,
  pawn_structure: 0.5,
  material_imbalance: 0.85,
  time_pressure: 0.6,
  breakthrough: 0.8,
  transition: 0.55,
};

/**
 * Detect if a position is near a critical moment
 */
export function detectCriticalMoment(
  currentEval: number,
  previousEval: number,
  moveNumber: number,
  pieceCount: number,
  previousPieceCount: number
): CriticalMoment | null {
  const evalSwing = Math.abs(currentEval - previousEval);
  const pieceChange = previousPieceCount - pieceCount;
  
  // Large evaluation swing = something critical happened
  if (evalSwing > 100) {
    return {
      moveNumber,
      type: 'material_imbalance',
      severity: Math.min(1, evalSwing / 300),
      description: `Evaluation swing of ${evalSwing}cp`,
      predictiveValue: 0.85,
      expectedOutcome: currentEval > 100 ? 'white_advantage' : 
                       currentEval < -100 ? 'black_advantage' : 'unclear',
    };
  }
  
  // Major piece trade
  if (pieceChange >= 2) {
    return {
      moveNumber,
      type: 'piece_exchange',
      severity: pieceChange / 4,
      description: `${pieceChange} pieces exchanged`,
      predictiveValue: 0.7,
    };
  }
  
  // Transition detection
  if (pieceCount <= 14 && previousPieceCount > 14) {
    return {
      moveNumber,
      type: 'transition',
      severity: 0.6,
      description: 'Entering endgame phase',
      predictiveValue: 0.75,
    };
  }
  
  // Phase transitions
  if (moveNumber === 12 || moveNumber === 25) {
    return {
      moveNumber,
      type: 'transition',
      severity: 0.5,
      description: moveNumber === 12 ? 'Opening to middlegame' : 'Middlegame deepening',
      predictiveValue: 0.55,
    };
  }
  
  return null;
}

/**
 * Calculate tension level in position
 */
export function calculatePositionTension(
  attackedSquares: number,
  defendedSquares: number,
  hangingPieces: number
): number {
  // High attacked/defended ratio = high tension
  const attackRatio = defendedSquares > 0 ? attackedSquares / defendedSquares : attackedSquares;
  const hangingFactor = hangingPieces * 0.2;
  
  return Math.min(1, (attackRatio * 0.3) + hangingFactor);
}

/**
 * Detect if we're approaching a tension break
 */
export function detectTensionBreakPoint(
  tensions: number[],
  threshold: number = 0.3
): { isBreakPoint: boolean; confidence: number } {
  if (tensions.length < 3) {
    return { isBreakPoint: false, confidence: 0 };
  }
  
  const recentTensions = tensions.slice(-5);
  const avgTension = recentTensions.reduce((a, b) => a + b, 0) / recentTensions.length;
  const currentTension = tensions[tensions.length - 1];
  
  // Tension dropping suddenly = break point
  if (avgTension > 0.5 && currentTension < threshold) {
    return { 
      isBreakPoint: true, 
      confidence: (avgTension - currentTension) / avgTension,
    };
  }
  
  // Tension building = approaching break
  const tensionTrend = recentTensions[recentTensions.length - 1] - recentTensions[0];
  if (tensionTrend > 0.2 && currentTension > 0.7) {
    return { 
      isBreakPoint: true, 
      confidence: currentTension * 0.8,
    };
  }
  
  return { isBreakPoint: false, confidence: 0 };
}

/**
 * Aggregate critical moments for prediction weighting
 */
export function aggregateCriticalMoments(
  moments: CriticalMoment[]
): { 
  overallCriticality: number; 
  dominantType: CriticalMomentType | null;
  predictionBoost: number;
} {
  if (moments.length === 0) {
    return { overallCriticality: 0, dominantType: null, predictionBoost: 1.0 };
  }
  
  // Calculate weighted criticality
  const totalCriticality = moments.reduce((sum, m) => 
    sum + (m.severity * MOMENT_WEIGHTS[m.type]), 0
  );
  const overallCriticality = Math.min(1, totalCriticality / moments.length);
  
  // Find dominant moment type
  const typeCounts = moments.reduce((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + m.severity;
    return acc;
  }, {} as Record<string, number>);
  
  const dominantType = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] as CriticalMomentType | undefined;
  
  // Prediction boost - predictions near critical moments are more valuable
  const avgPredictiveValue = moments.reduce((sum, m) => sum + m.predictiveValue, 0) / moments.length;
  const predictionBoost = 1.0 + (avgPredictiveValue * 0.5);
  
  return {
    overallCriticality,
    dominantType: dominantType || null,
    predictionBoost,
  };
}

/**
 * Score a position's proximity to decision point
 */
export function scoreDecisionProximity(
  evalHistory: number[],
  moveNumber: number,
  recentMoments: CriticalMoment[]
): number {
  if (evalHistory.length < 2) return 0.5;
  
  // Volatility in recent evaluations
  const recentEvals = evalHistory.slice(-5);
  const evalVariance = calculateVariance(recentEvals);
  const volatilityScore = Math.min(1, evalVariance / 10000);
  
  // Recent critical moments boost
  const recentMomentScore = recentMoments.length > 0 ?
    recentMoments.slice(-2).reduce((sum, m) => sum + m.severity, 0) / 2 : 0;
  
  return (volatilityScore * 0.6) + (recentMomentScore * 0.4);
}

/**
 * Helper: Calculate variance
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
}
