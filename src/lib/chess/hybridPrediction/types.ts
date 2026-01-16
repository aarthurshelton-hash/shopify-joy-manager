/**
 * Hybrid Prediction Engine Types
 * 
 * En Pensent™ Patent-Pending Technology
 */

import { StrategicArchetype } from '../colorFlowAnalysis';

// ===================== HYBRID PREDICTION TYPES =====================

export interface HybridPrediction {
  /** Combined tactical + strategic evaluation */
  combinedScore: number;
  
  /** Stockfish tactical analysis */
  tacticalAnalysis: TacticalInsight;
  
  /** Color Flow strategic analysis */
  strategicAnalysis: StrategicInsight;
  
  /** Fused prediction with confidence-weighted recommendations */
  fusedRecommendation: FusedRecommendation;
  
  /** Trajectory prediction: where the game is headed */
  trajectoryPrediction: TrajectoryPrediction;
  
  /** Confidence metrics for the hybrid prediction */
  confidence: HybridConfidence;
}

export interface TacticalInsight {
  bestMove: string;
  evaluation: number;
  mateIn?: number;
  principalVariation: string[];
  tacticalThemes: string[];
  immediateThreats: string[];
}

export interface StrategicInsight {
  archetype: StrategicArchetype;
  archetypeName: string;
  flowDirection: string;
  dominantSide: string;
  strategicGuidance: string[];
  criticalSquares: string[];
}

export interface FusedRecommendation {
  /** The recommended move (may differ from pure Stockfish) */
  move: string;
  
  /** Why this move is recommended (fused reasoning) */
  reasoning: string[];
  
  /** How this move fits the strategic trajectory */
  trajectoryAlignment: string;
  
  /** Short-term gain vs long-term position trade-off */
  tradeoffAnalysis: string;
  
  /** Confidence in this specific recommendation */
  moveConfidence: number;
}

export interface TrajectoryPrediction {
  /** Predicted game outcome */
  predictedOutcome: 'white_wins' | 'black_wins' | 'draw' | 'unclear';
  
  /** Number of moves this prediction covers */
  horizonMoves: number;
  
  /** Key moments expected in the trajectory */
  expectedMilestones: TrajectoryMilestone[];
  
  /** Probability distribution for outcomes */
  outcomeProbabilities: {
    whiteWin: number;
    blackWin: number;
    draw: number;
  };
  
  /** What would need to happen to change trajectory */
  trajectoryBreakers: string[];
}

export interface TrajectoryMilestone {
  approximateMoveNumber: number;
  description: string;
  criticalSquares: string[];
  expectedColorFlow: string;
}

export interface HybridConfidence {
  /** Overall confidence in hybrid prediction (0-100) */
  overall: number;
  
  /** Tactical confidence (Stockfish depth quality) */
  tactical: number;
  
  /** Strategic confidence (archetype match quality) */
  strategic: number;
  
  /** How well tactics and strategy align */
  alignment: number;
  
  /** Explanation of confidence factors */
  factors: string[];
}
