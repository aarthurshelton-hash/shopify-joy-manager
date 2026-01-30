/**
 * Fingerprint Comparator Module
 * 
 * Functions for comparing fingerprint similarity.
 */

import { PlayerFingerprint } from './types';

export interface FingerprintSimilarity {
  similarity: number;
  matchingTraits: string[];
}

/**
 * Compare two fingerprints for similarity
 * Used to detect if two accounts might be the same player
 * or if market behavior matches a chess player profile
 */
export function compareFingerprintSimilarity(
  fp1: PlayerFingerprint,
  fp2: PlayerFingerprint
): FingerprintSimilarity {
  const matchingTraits: string[] = [];
  let totalSimilarity = 0;
  
  // Style comparison
  const styleDiff = Math.abs(fp1.styleProfile.aggressiveness - fp2.styleProfile.aggressiveness) +
                   Math.abs(fp1.styleProfile.riskTolerance - fp2.styleProfile.riskTolerance);
  if (styleDiff < 0.3) {
    matchingTraits.push('similar_risk_style');
    totalSimilarity += 0.25;
  }
  
  // Pressure response comparison
  const pressureDiff = Math.abs(fp1.pressureProfile.tiltResistance - fp2.pressureProfile.tiltResistance);
  if (pressureDiff < 0.2) {
    matchingTraits.push('similar_pressure_response');
    totalSimilarity += 0.25;
  }
  
  // Blunder pattern comparison
  if (fp1.blunderSignature.dominantBlunderType === fp2.blunderSignature.dominantBlunderType) {
    matchingTraits.push('same_blunder_type');
    totalSimilarity += 0.25;
  }
  
  // Temporal behavior comparison
  const timeDiff = Math.abs(fp1.temporalPatterns.averageMoveTime - fp2.temporalPatterns.averageMoveTime);
  if (timeDiff < 5) {
    matchingTraits.push('similar_time_management');
    totalSimilarity += 0.25;
  }
  
  return {
    similarity: Math.min(1, totalSimilarity),
    matchingTraits
  };
}

/**
 * Calculate detailed similarity breakdown
 */
export function getDetailedSimilarity(
  fp1: PlayerFingerprint,
  fp2: PlayerFingerprint
): Record<string, number> {
  return {
    styleAggressive: 1 - Math.abs(fp1.styleProfile.aggressiveness - fp2.styleProfile.aggressiveness),
    styleComplexity: 1 - Math.abs(fp1.styleProfile.complexity - fp2.styleProfile.complexity),
    styleSpeed: 1 - Math.abs(fp1.styleProfile.speedPreference - fp2.styleProfile.speedPreference),
    styleRisk: 1 - Math.abs(fp1.styleProfile.riskTolerance - fp2.styleProfile.riskTolerance),
    styleEndgame: 1 - Math.abs(fp1.styleProfile.endgameSkill - fp2.styleProfile.endgameSkill),
    pressureTilt: 1 - Math.abs(fp1.pressureProfile.tiltResistance - fp2.pressureProfile.tiltResistance),
    pressureTime: 1 - Math.abs(fp1.pressureProfile.timePressurePerformance - fp2.pressureProfile.timePressurePerformance),
    temporalMoveTime: 1 - Math.abs(fp1.temporalPatterns.averageMoveTime - fp2.temporalPatterns.averageMoveTime) / 60,
    temporalComeback: 1 - Math.abs(fp1.temporalPatterns.comebackProbability - fp2.temporalPatterns.comebackProbability),
    blunderType: fp1.blunderSignature.dominantBlunderType === fp2.blunderSignature.dominantBlunderType ? 1 : 0
  };
}
