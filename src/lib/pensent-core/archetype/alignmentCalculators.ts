/**
 * En Pensent Core SDK - Alignment Calculators for Archetype Matching
 */

import { TemporalSignature, ArchetypeDefinition } from '../types';

/**
 * Calculate intensity alignment with archetype expectations
 */
export function calculateIntensityAlignment(
  signature: TemporalSignature, 
  definition: ArchetypeDefinition
): number {
  // Use archetype success rate as a proxy for expected intensity pattern
  // High success rate archetypes typically have controlled intensity
  const expectedIntensity = definition.successRate > 0.6 ? 0.6 : 0.4;
  const difference = Math.abs(signature.intensity - expectedIntensity);
  return 1 - Math.min(difference, 1);
}

/**
 * Calculate temporal flow alignment with archetype patterns
 */
export function calculateFlowAlignment(
  signature: TemporalSignature,
  definition: ArchetypeDefinition
): number {
  // Check if flow direction matches archetype characteristics
  const flowTerms = definition.keywords?.filter(k => 
    ['ascending', 'descending', 'stable', 'volatile', 'chaotic', 
     'accelerating', 'declining', 'steady'].includes(k.toLowerCase())
  ) ?? [];
  
  if (flowTerms.length === 0) return 0.5; // Neutral if no flow keywords
  
  const trendMatch = flowTerms.some(t => 
    t.toLowerCase() === signature.temporalFlow.trend.toLowerCase()
  );
  
  return trendMatch ? 1 : 0.3;
}

/**
 * Calculate quadrant distribution alignment
 */
export function calculateQuadrantAlignment(
  signature: TemporalSignature,
  definition: ArchetypeDefinition
): number {
  const { q1, q2, q3, q4 } = signature.quadrantProfile;
  const values = [q1, q2, q3, q4];
  
  // Calculate distribution evenness
  const avg = values.reduce((a, b) => a + b, 0) / 4;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / 4;
  const isBalanced = variance < 0.1;
  
  // Some archetypes favor balanced distribution, others favor concentration
  const prefersBalance = definition.keywords?.some(k => 
    ['balanced', 'stable', 'even', 'distributed'].includes(k.toLowerCase())
  ) ?? false;
  
  if (prefersBalance) return isBalanced ? 1 : 0.4;
  return isBalanced ? 0.4 : 1;
}
