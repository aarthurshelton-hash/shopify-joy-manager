/**
 * Pattern Learning Types
 */

import { StrategicArchetype } from '../colorFlowAnalysis';

export interface PatternRecord {
  id: string;
  fingerprint: string;
  archetype: StrategicArchetype;
  outcome: 'white_wins' | 'black_wins' | 'draw';
  totalMoves: number;
  characteristics: PatternCharacteristics;
  openingEco?: string;
  gameMetadata?: {
    event?: string;
    white?: string;
    black?: string;
    date?: string;
  };
}

export interface PatternCharacteristics {
  flowDirection: string;
  intensity: number;
  volatility: number;
  dominantSide: string;
  centerControl: number;
  kingsideActivity: number;
  queensideActivity: number;
}

export interface PatternMatch {
  pattern: PatternRecord;
  similarity: number;
  matchingFactors: string[];
  predictedOutcome: 'white_wins' | 'black_wins' | 'draw';
  confidence: number;
}

export interface PatternPrediction {
  topMatches: PatternMatch[];
  aggregatePrediction: {
    whiteWinProbability: number;
    blackWinProbability: number;
    drawProbability: number;
  };
  mostLikelyOutcome: 'white_wins' | 'black_wins' | 'draw';
  confidence: number;
  lookaheadMoves: number;
  insights: string[];
}
