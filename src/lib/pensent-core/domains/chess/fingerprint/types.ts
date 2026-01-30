/**
 * Player Fingerprint Types
 * 
 * Type definitions for the behavioral signature system.
 */

import { EmotionalMarker } from '../blunderClassifier';

export interface PlayerFingerprint {
  // Anonymized identifier (hash of username or games)
  fingerprintId: string;
  
  // Style Profile
  styleProfile: StyleProfile;
  
  // Pressure Response Profile
  pressureProfile: PressureProfile;
  
  // Blunder Signature
  blunderSignature: BlunderSignature;
  
  // Temporal Patterns
  temporalPatterns: TemporalPatterns;
  
  // Games analyzed
  gamesAnalyzed: number;
  confidence: number;
  lastUpdated: number;
}

export interface StyleProfile {
  aggressiveness: number;      // 0 = defensive, 1 = attacking
  complexity: number;          // 0 = simple, 1 = complex positions
  speedPreference: number;     // 0 = slow, 1 = blitz
  riskTolerance: number;       // 0 = risk-averse, 1 = gambler
  endgameSkill: number;        // Relative to middlegame
}

export interface PressureProfile {
  tiltResistance: number;           // How well they handle setbacks
  timePressurePerformance: number;  // Performance under time trouble
  complicatingTendency: number;     // Do they complicate when losing?
  simplifyingTendency: number;      // Do they simplify when winning?
}

export interface BlunderSignature {
  dominantBlunderType: 'computational' | 'human' | 'hybrid';
  commonEmotionalTriggers: EmotionalMarker['type'][];
  blunderPhaseDistribution: {
    opening: number;
    middlegame: number;
    endgame: number;
  };
  averageTiltThreshold: number;  // Blunders before performance drops
}

export interface TemporalPatterns {
  bestPerformancePhase: 'opening' | 'middlegame' | 'endgame';
  averageMoveTime: number;
  criticalMomentBehavior: 'calculate' | 'intuition' | 'panic';
  comebackProbability: number;  // Likelihood of recovery from losing
}

export interface GameData {
  moves: Array<{
    san: string;
    timeSpent?: number;
    evalBefore?: number;
    evalAfter?: number;
  }>;
  result: 'white' | 'black' | 'draw';
  playerColor: 'white' | 'black';
  timeControl: string;
  opening?: string;
}

export interface GameAnalysis {
  moveCount: number;
  blunders: number;
  averageMoveTime: number;
  timePressureMoves: number;
  complexMoves: number;
  aggressiveMoves: number;
  won: boolean;
  wasLosing: boolean;
  cameBack: boolean;
  phaseBlunders: { opening: number; middlegame: number; endgame: number };
  emotionalMarkers: EmotionalMarker['type'][];
}
