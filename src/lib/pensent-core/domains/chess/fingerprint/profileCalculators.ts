/**
 * Profile Calculators Module
 * 
 * Functions to calculate various fingerprint profiles from game analyses.
 */

import { 
  GameAnalysis, 
  StyleProfile, 
  PressureProfile, 
  BlunderSignature, 
  TemporalPatterns 
} from './types';

/**
 * Calculate style profile from analyzed games
 */
export function calculateStyleProfile(analyses: GameAnalysis[]): StyleProfile {
  if (analyses.length === 0) {
    return getDefaultStyleProfile();
  }
  
  const avgComplexMoves = analyses.reduce((sum, a) => sum + a.complexMoves / a.moveCount, 0) / analyses.length;
  const avgBlunders = analyses.reduce((sum, a) => sum + a.blunders, 0) / analyses.length;
  const avgMoveTime = analyses.reduce((sum, a) => sum + a.averageMoveTime, 0) / analyses.length;
  const totalBlunders = analyses.reduce((sum, a) => sum + a.blunders, 0);
  const endgameBlunders = analyses.reduce((sum, a) => sum + a.phaseBlunders.endgame, 0);
  
  return {
    aggressiveness: Math.min(1, avgBlunders * 0.2),
    complexity: avgComplexMoves * 2,
    speedPreference: 1 - (avgMoveTime / 60),
    riskTolerance: analyses.filter(a => a.wasLosing).length / analyses.length,
    endgameSkill: 1 - (endgameBlunders / Math.max(1, totalBlunders))
  };
}

/**
 * Calculate pressure response profile
 */
export function calculatePressureProfile(analyses: GameAnalysis[]): PressureProfile {
  if (analyses.length === 0) {
    return getDefaultPressureProfile();
  }
  
  const comebacks = analyses.filter(a => a.cameBack).length;
  const losingGames = analyses.filter(a => a.wasLosing).length;
  const avgTimePressureRatio = analyses.reduce((sum, a) => sum + a.timePressureMoves / a.moveCount, 0) / analyses.length;
  
  return {
    tiltResistance: comebacks / Math.max(1, losingGames),
    timePressurePerformance: 1 - avgTimePressureRatio,
    complicatingTendency: 0.5, // Would need deeper analysis
    simplifyingTendency: 0.5
  };
}

/**
 * Calculate blunder signature
 */
export function calculateBlunderSignature(analyses: GameAnalysis[]): BlunderSignature {
  const totalBlunders = analyses.reduce((sum, a) => sum + a.blunders, 0);
  const opening = analyses.reduce((sum, a) => sum + a.phaseBlunders.opening, 0);
  const middlegame = analyses.reduce((sum, a) => sum + a.phaseBlunders.middlegame, 0);
  const endgame = analyses.reduce((sum, a) => sum + a.phaseBlunders.endgame, 0);
  
  return {
    dominantBlunderType: 'human',
    commonEmotionalTriggers: ['frustration', 'impatience'],
    blunderPhaseDistribution: {
      opening: opening / Math.max(1, totalBlunders),
      middlegame: middlegame / Math.max(1, totalBlunders),
      endgame: endgame / Math.max(1, totalBlunders)
    },
    averageTiltThreshold: 2
  };
}

/**
 * Calculate temporal patterns
 */
export function calculateTemporalPatterns(analyses: GameAnalysis[]): TemporalPatterns {
  if (analyses.length === 0) {
    return getDefaultTemporalPatterns();
  }
  
  const avgMoveTime = analyses.reduce((sum, a) => sum + a.averageMoveTime, 0) / analyses.length;
  const losingGames = analyses.filter(a => a.wasLosing);
  const comebackRate = losingGames.length > 0 
    ? analyses.filter(a => a.cameBack && a.won).length / losingGames.length
    : 0;
  
  // Find best phase (lowest blunder rate)
  const phaseRates = {
    opening: analyses.reduce((sum, a) => sum + a.phaseBlunders.opening, 0),
    middlegame: analyses.reduce((sum, a) => sum + a.phaseBlunders.middlegame, 0),
    endgame: analyses.reduce((sum, a) => sum + a.phaseBlunders.endgame, 0)
  };
  
  const bestPhase = Object.entries(phaseRates)
    .sort((a, b) => a[1] - b[1])[0][0] as 'opening' | 'middlegame' | 'endgame';
  
  return {
    bestPerformancePhase: bestPhase,
    averageMoveTime: avgMoveTime,
    criticalMomentBehavior: avgMoveTime > 30 ? 'calculate' : 'intuition',
    comebackProbability: comebackRate
  };
}

// Default values for empty analyses
function getDefaultStyleProfile(): StyleProfile {
  return {
    aggressiveness: 0.5,
    complexity: 0.5,
    speedPreference: 0.5,
    riskTolerance: 0.5,
    endgameSkill: 0.5
  };
}

function getDefaultPressureProfile(): PressureProfile {
  return {
    tiltResistance: 0.5,
    timePressurePerformance: 0.5,
    complicatingTendency: 0.5,
    simplifyingTendency: 0.5
  };
}

function getDefaultTemporalPatterns(): TemporalPatterns {
  return {
    bestPerformancePhase: 'middlegame',
    averageMoveTime: 30,
    criticalMomentBehavior: 'intuition',
    comebackProbability: 0.3
  };
}
