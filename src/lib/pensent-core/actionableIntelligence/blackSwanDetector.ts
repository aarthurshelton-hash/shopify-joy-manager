/**
 * Black Swan Detector
 * Detects cross-domain "Black Swan" discovery alerts
 */

import type { DomainSignature, DomainType } from '../domains/universal/types';

export interface BlackSwanCorrelation {
  discovery: string;
  domains: DomainType[];
  significance: number;
}

/**
 * Calculate profile similarity between two quadrant profiles
 */
function calculateProfileSimilarity(
  profile1: { aggressive: number; defensive: number; tactical: number; strategic: number },
  profile2: { aggressive: number; defensive: number; tactical: number; strategic: number }
): number {
  const diff = Math.abs(profile1.aggressive - profile2.aggressive) +
               Math.abs(profile1.defensive - profile2.defensive) +
               Math.abs(profile1.tactical - profile2.tactical) +
               Math.abs(profile1.strategic - profile2.strategic);
  
  return 1 - (diff / 4); // Normalized to 0-1
}

/**
 * Generate cross-domain "Black Swan" discovery alerts
 */
export function detectBlackSwanCorrelations(
  signatures: DomainSignature[]
): BlackSwanCorrelation[] {
  const discoveries: BlackSwanCorrelation[] = [];
  
  // Look for unusual correlations between domains
  for (let i = 0; i < signatures.length; i++) {
    for (let j = i + 1; j < signatures.length; j++) {
      const sig1 = signatures[i];
      const sig2 = signatures[j];
      
      // Check for similar quadrant profiles across different domains
      const profileSimilarity = calculateProfileSimilarity(
        sig1.quadrantProfile, 
        sig2.quadrantProfile
      );
      
      if (profileSimilarity > 0.85) {
        discoveries.push({
          discovery: `Unusual pattern match: ${sig1.domain} and ${sig2.domain} show ${(profileSimilarity * 100).toFixed(0)}% quadrant profile similarity`,
          domains: [sig1.domain, sig2.domain],
          significance: profileSimilarity,
        });
      }
      
      // Check for opposing momentum (potential arbitrage)
      if (Math.abs(sig1.momentum - sig2.momentum) > 0.6) {
        discoveries.push({
          discovery: `Momentum divergence detected: ${sig1.domain} (${sig1.momentum > 0 ? '+' : ''}${sig1.momentum.toFixed(2)}) vs ${sig2.domain} (${sig2.momentum > 0 ? '+' : ''}${sig2.momentum.toFixed(2)})`,
          domains: [sig1.domain, sig2.domain],
          significance: Math.abs(sig1.momentum - sig2.momentum),
        });
      }
    }
  }
  
  return discoveries.sort((a, b) => b.significance - a.significance);
}
