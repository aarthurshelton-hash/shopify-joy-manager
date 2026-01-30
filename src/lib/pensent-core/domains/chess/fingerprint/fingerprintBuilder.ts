/**
 * Fingerprint Builder Module
 * 
 * Core functions for building and merging player fingerprints.
 */

import { hashString } from '../../../signature/fingerprintGenerator';
import { PlayerFingerprint, GameData } from './types';
import { analyzeGame } from './gameAnalyzer';
import {
  calculateStyleProfile,
  calculatePressureProfile,
  calculateBlunderSignature,
  calculateTemporalPatterns
} from './profileCalculators';

/**
 * Build or update a player fingerprint from game data
 */
export function buildFingerprint(
  games: GameData[],
  existingFingerprint?: PlayerFingerprint
): PlayerFingerprint {
  const gamesHash = hashString(games.map(g => g.moves.map(m => m.san).join('')).join('|'));
  
  // Analyze all games
  const analyses = games.map(analyzeGame);
  
  // Build profiles
  const styleProfile = calculateStyleProfile(analyses);
  const pressureProfile = calculatePressureProfile(analyses);
  const blunderSignature = calculateBlunderSignature(analyses);
  const temporalPatterns = calculateTemporalPatterns(analyses);
  
  const newFingerprint: PlayerFingerprint = {
    fingerprintId: existingFingerprint?.fingerprintId || `FP-${gamesHash}`,
    styleProfile,
    pressureProfile,
    blunderSignature,
    temporalPatterns,
    gamesAnalyzed: (existingFingerprint?.gamesAnalyzed || 0) + games.length,
    confidence: Math.min(0.95, 0.3 + games.length * 0.05),
    lastUpdated: Date.now()
  };
  
  // Merge with existing if available
  if (existingFingerprint && existingFingerprint.gamesAnalyzed > 0) {
    return mergeFingerprints(existingFingerprint, newFingerprint);
  }
  
  return newFingerprint;
}

/**
 * Merge two fingerprints with weighted averaging
 */
export function mergeFingerprints(
  existing: PlayerFingerprint,
  newData: PlayerFingerprint
): PlayerFingerprint {
  const totalGames = existing.gamesAnalyzed + newData.gamesAnalyzed;
  const existingWeight = existing.gamesAnalyzed / totalGames;
  const newWeight = newData.gamesAnalyzed / totalGames;
  
  const mergeValue = (a: number, b: number) => a * existingWeight + b * newWeight;
  
  return {
    fingerprintId: existing.fingerprintId,
    styleProfile: {
      aggressiveness: mergeValue(existing.styleProfile.aggressiveness, newData.styleProfile.aggressiveness),
      complexity: mergeValue(existing.styleProfile.complexity, newData.styleProfile.complexity),
      speedPreference: mergeValue(existing.styleProfile.speedPreference, newData.styleProfile.speedPreference),
      riskTolerance: mergeValue(existing.styleProfile.riskTolerance, newData.styleProfile.riskTolerance),
      endgameSkill: mergeValue(existing.styleProfile.endgameSkill, newData.styleProfile.endgameSkill)
    },
    pressureProfile: {
      tiltResistance: mergeValue(existing.pressureProfile.tiltResistance, newData.pressureProfile.tiltResistance),
      timePressurePerformance: mergeValue(existing.pressureProfile.timePressurePerformance, newData.pressureProfile.timePressurePerformance),
      complicatingTendency: mergeValue(existing.pressureProfile.complicatingTendency, newData.pressureProfile.complicatingTendency),
      simplifyingTendency: mergeValue(existing.pressureProfile.simplifyingTendency, newData.pressureProfile.simplifyingTendency)
    },
    blunderSignature: existing.blunderSignature, // Keep more established signature
    temporalPatterns: {
      ...existing.temporalPatterns,
      averageMoveTime: mergeValue(existing.temporalPatterns.averageMoveTime, newData.temporalPatterns.averageMoveTime),
      comebackProbability: mergeValue(existing.temporalPatterns.comebackProbability, newData.temporalPatterns.comebackProbability)
    },
    gamesAnalyzed: totalGames,
    confidence: Math.min(0.95, 0.3 + totalGames * 0.01),
    lastUpdated: Date.now()
  };
}
