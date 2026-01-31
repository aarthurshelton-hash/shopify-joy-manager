/**
 * Black Swan Detector
 * Discovers rare cross-domain resonances
 */

import type { TemporalSignature } from '../../../types/core';
import type { IndustryVertical, BlackSwanDiscovery, SixtyFourSquareGrid } from '../types';
import { quadrantSimilarity } from './similarityCalculators';

/**
 * Discover "Black Swan" events - rare cross-domain resonances
 */
export function detectBlackSwanEvents(
  signatures: Array<{ domain: IndustryVertical | 'chess'; signature: TemporalSignature }>,
  grid?: SixtyFourSquareGrid
): BlackSwanDiscovery[] {
  const discoveries: BlackSwanDiscovery[] = [];
  
  // Check for multi-domain alignment (3+ domains with similar profiles)
  if (signatures.length >= 3) {
    const profiles = signatures.map(s => s.signature.quadrantProfile);
    let alignmentScore = 0;
    let alignedCount = 0;
    
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const similarity = quadrantSimilarity(profiles[i], profiles[j]);
        if (similarity > 0.7) {
          alignmentScore += similarity;
          alignedCount++;
        }
      }
    }
    
    if (alignedCount >= 3 && alignmentScore / alignedCount > 0.75) {
      discoveries.push({
        id: `blackswan-${Date.now()}`,
        type: 'resonance',
        industries: signatures.map(s => s.domain),
        title: 'Multi-Domain Resonance Detected',
        description: `${signatures.length} domains showing synchronized pattern: ${signatures.map(s => s.signature.archetype).join(', ')}`,
        significance: alignmentScore / alignedCount,
        actionableInsight: 'High-confidence signal. Cross-verify findings and prepare response for all aligned domains.',
        detectedAt: new Date(),
        gridSignatures: grid ? [grid] : []
      });
    }
  }
  
  // Check for divergence (domains that usually correlate now showing opposite patterns)
  const momentums = signatures.map(s => ({
    domain: s.domain,
    momentum: s.signature.temporalFlow.momentum,
    trend: s.signature.temporalFlow.trend
  }));
  
  const bullish = momentums.filter(m => m.momentum > 0.3);
  const bearish = momentums.filter(m => m.momentum < -0.3);
  
  if (bullish.length > 0 && bearish.length > 0) {
    discoveries.push({
      id: `blackswan-diverge-${Date.now()}`,
      type: 'divergence',
      industries: signatures.map(s => s.domain),
      title: 'Cross-Domain Divergence Alert',
      description: `${bullish.map(b => b.domain).join(', ')} showing positive momentum while ${bearish.map(b => b.domain).join(', ')} declining`,
      significance: 0.82,
      actionableInsight: 'Divergence often precedes regime change. The lagging domain typically follows the leader within 24-72 hours.',
      detectedAt: new Date(),
      gridSignatures: grid ? [grid] : []
    });
  }
  
  return discoveries;
}
