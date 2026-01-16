/**
 * En Pensent Core SDK - Hybrid Fusion Types
 */

import { TrajectoryPrediction } from './trajectory';

/**
 * Tactical insight from calculation-based analysis
 */
export interface TacticalInsight {
  /** Evaluation score (domain-specific units) */
  evaluation: number;
  /** Best calculated move/action */
  bestAction: string;
  /** Calculation depth */
  depth: number;
  /** Confidence in calculation (0-1) */
  confidence: number;
  /** Key tactical themes */
  themes: string[];
}

/**
 * Strategic insight from pattern-based analysis
 */
export interface StrategicInsight {
  /** Strategic archetype */
  archetype: string;
  /** Long-term trajectory assessment */
  trajectory: 'improving' | 'stable' | 'declining';
  /** Key strategic factors */
  factors: string[];
  /** Confidence in strategic assessment (0-1) */
  confidence: number;
}

/**
 * Fused recommendation combining tactical and strategic
 */
export interface FusedRecommendation {
  /** Primary recommended action */
  action: string;
  /** Tactical reasoning */
  tacticalReason: string;
  /** Strategic reasoning */
  strategicReason: string;
  /** Combined confidence (0-1) */
  confidence: number;
  /** Priority level */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Alternative actions */
  alternatives: string[];
}

/**
 * Complete hybrid prediction combining all analysis
 */
export interface HybridPrediction {
  /** Domain this prediction applies to */
  domain: string;
  /** Timestamp of analysis */
  timestamp: number;
  /** Position/state being analyzed */
  currentState: string;
  /** Tactical analysis results */
  tactical: TacticalInsight;
  /** Strategic analysis results */
  strategic: StrategicInsight;
  /** Fused recommendation */
  recommendation: FusedRecommendation;
  /** Full trajectory prediction */
  trajectory: TrajectoryPrediction;
  /** Overall confidence in hybrid prediction */
  overallConfidence: number;
}
