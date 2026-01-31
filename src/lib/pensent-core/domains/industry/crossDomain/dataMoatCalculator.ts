/**
 * Data Moat Calculator
 * Calculates the uniqueness and monetization potential of patterns
 */

import type { TemporalSignature } from '../../../types/core';
import { quadrantSimilarity } from './similarityCalculators';

export interface DataMoatValue {
  moatScore: number;
  rarity: string;
  monetizationPotential: string;
}

/**
 * Calculate the "data moat" value - how unique this pattern is across domains
 */
export function calculateDataMoatValue(
  signature: TemporalSignature,
  historicalPatterns: TemporalSignature[] = []
): DataMoatValue {
  // Check how unique this signature is
  let matchCount = 0;
  for (const historical of historicalPatterns) {
    const similarity = quadrantSimilarity(signature.quadrantProfile, historical.quadrantProfile);
    if (similarity > 0.85) matchCount++;
  }
  
  const rarity = matchCount === 0 ? 'ultra_rare' :
                 matchCount < 5 ? 'rare' :
                 matchCount < 20 ? 'uncommon' : 'common';
  
  const moatScore = 1 - (matchCount / Math.max(historicalPatterns.length, 1));
  
  const monetizationPotential = moatScore > 0.9 ? 'High: Unique predictive signal worth licensing' :
                                 moatScore > 0.7 ? 'Medium: Valuable for sector-specific insights' :
                                 moatScore > 0.4 ? 'Low: Confirmatory signal, combine with others' :
                                 'Minimal: Pattern too common for standalone value';
  
  return { moatScore, rarity, monetizationPotential };
}
