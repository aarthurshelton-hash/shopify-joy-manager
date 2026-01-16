/**
 * En Pensent Core SDK - Signature Term Extraction
 */

import { TemporalSignature } from '../types';

/**
 * Extract searchable terms from a signature for keyword matching
 */
export function extractSignatureTerms(signature: TemporalSignature): string[] {
  const terms: string[] = [
    signature.archetype.toLowerCase(),
    signature.flowDirection.toLowerCase(),
    signature.dominantForce.toLowerCase(),
    signature.temporalFlow.trend.toLowerCase()
  ];
  
  // Add intensity-based terms
  if (signature.intensity > 0.8) {
    terms.push('high', 'intense', 'aggressive');
  } else if (signature.intensity > 0.5) {
    terms.push('moderate', 'active');
  } else {
    terms.push('low', 'passive', 'quiet');
  }
  
  // Add momentum-based terms
  if (signature.temporalFlow.momentum > 0.5) {
    terms.push('accelerating', 'growing');
  } else if (signature.temporalFlow.momentum < -0.5) {
    terms.push('declining', 'slowing');
  } else {
    terms.push('stable', 'steady');
  }
  
  return terms;
}

/**
 * Match signature characteristics against archetype keywords
 */
export function matchKeywords(signature: TemporalSignature, keywords: string[]): number {
  const signatureTerms = extractSignatureTerms(signature);
  let matches = 0;
  
  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase();
    if (signatureTerms.some(term => 
      term.includes(normalizedKeyword) || normalizedKeyword.includes(term)
    )) {
      matches++;
    }
  }
  
  return keywords.length > 0 ? matches / keywords.length : 0;
}
