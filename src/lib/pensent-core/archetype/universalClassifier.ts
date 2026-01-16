/**
 * En Pensent Core SDK - Universal Archetype Classification
 */

import { TemporalSignature, ArchetypeRegistry } from '../types';

/**
 * Universal archetype classification based purely on signature metrics
 * This can be used when no domain-specific archetype registry is available
 */
export function classifyUniversalArchetype(signature: TemporalSignature): string {
  const { intensity, temporalFlow, quadrantProfile, criticalMoments } = signature;
  
  // High intensity + accelerating = aggressive pattern
  if (intensity > 0.7 && temporalFlow.trend === 'accelerating') {
    return 'aggressive_expansion';
  }
  
  // Low intensity + stable = maintenance pattern
  if (intensity < 0.3 && temporalFlow.trend === 'stable') {
    return 'maintenance_mode';
  }
  
  // High volatility + many critical moments = chaotic pattern
  if (temporalFlow.trend === 'volatile' && criticalMoments.length > 3) {
    return 'chaotic_evolution';
  }
  
  // Declining trend + negative momentum = decline pattern
  if (temporalFlow.trend === 'declining' && temporalFlow.momentum < -0.3) {
    return 'controlled_decline';
  }
  
  // Check quadrant concentration
  const { q1, q2, q3, q4 } = quadrantProfile;
  const maxQuadrant = Math.max(q1, q2, q3, q4);
  const minQuadrant = Math.min(q1, q2, q3, q4);
  
  if (maxQuadrant - minQuadrant > 0.5) {
    return 'concentrated_activity';
  }
  
  // Balanced distribution
  if (Math.abs(q1 - q2) < 0.1 && Math.abs(q3 - q4) < 0.1) {
    return 'balanced_approach';
  }
  
  return 'standard_evolution';
}

/**
 * Calculate archetype similarity between two archetypes
 */
export function calculateArchetypeSimilarity(
  archetypeA: string,
  archetypeB: string,
  registry: ArchetypeRegistry
): number {
  if (archetypeA === archetypeB) return 1;
  
  const defA = registry.archetypes[archetypeA];
  const defB = registry.archetypes[archetypeB];
  
  if (!defA || !defB) return 0;
  
  // Check if they're related archetypes
  if (defA.relatedArchetypes?.includes(archetypeB) || 
      defB.relatedArchetypes?.includes(archetypeA)) {
    return 0.7;
  }
  
  // Compare keywords overlap
  const keywordsA = new Set(defA.keywords ?? []);
  const keywordsB = new Set(defB.keywords ?? []);
  
  let overlap = 0;
  for (const k of keywordsA) {
    if (keywordsB.has(k)) overlap++;
  }
  
  const totalKeywords = keywordsA.size + keywordsB.size - overlap;
  const keywordSimilarity = totalKeywords > 0 ? overlap / totalKeywords : 0;
  
  // Compare success rates
  const successRateDiff = Math.abs(defA.successRate - defB.successRate);
  const successSimilarity = 1 - successRateDiff;
  
  return (keywordSimilarity * 0.6) + (successSimilarity * 0.4);
}
