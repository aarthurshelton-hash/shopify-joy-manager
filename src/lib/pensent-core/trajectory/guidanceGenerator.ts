/**
 * En Pensent Core SDK - Strategic Guidance Generator
 * 
 * Generates strategic recommendations from analysis
 */

import { TemporalSignature, ArchetypeDefinition } from '../types';

/**
 * Generate strategic guidance based on analysis
 */
export function generateStrategicGuidance(
  signature: TemporalSignature,
  archetypeDefinition: ArchetypeDefinition | null,
  outcomeProbabilities: Record<string, number>
): string {
  const parts: string[] = [];
  
  addArchetypeGuidance(parts, archetypeDefinition);
  addFlowGuidance(parts, signature);
  addDominantForceGuidance(parts, signature);
  addProbabilityGuidance(parts, outcomeProbabilities);
  
  return parts.join('. ') + '.';
}

function addArchetypeGuidance(
  parts: string[],
  archetypeDefinition: ArchetypeDefinition | null
): void {
  if (archetypeDefinition) {
    parts.push(`Pattern matches "${archetypeDefinition.name}" archetype`);
    if (archetypeDefinition.successRate > 0.6) {
      parts.push(`historically successful ${Math.round(archetypeDefinition.successRate * 100)}% of the time`);
    }
  }
}

function addFlowGuidance(parts: string[], signature: TemporalSignature): void {
  switch (signature.temporalFlow.trend) {
    case 'accelerating':
      parts.push('Momentum is building - capitalize on current trajectory');
      break;
    case 'declining':
      parts.push('Activity declining - consider repositioning or intervention');
      break;
    case 'volatile':
      parts.push('High volatility detected - exercise caution');
      break;
    case 'stable':
      parts.push('Stable trajectory - maintain current course');
      break;
  }
}

function addDominantForceGuidance(parts: string[], signature: TemporalSignature): void {
  if (signature.dominantForce !== 'balanced') {
    parts.push(`${signature.dominantForce === 'primary' ? 'Primary' : 'Secondary'} force has initiative`);
  }
}

function addProbabilityGuidance(
  parts: string[],
  outcomeProbabilities: Record<string, number>
): void {
  const topOutcome = Object.entries(outcomeProbabilities)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (topOutcome && topOutcome[1] > 0.5) {
    parts.push(`${Math.round(topOutcome[1] * 100)}% trajectory toward ${formatOutcome(topOutcome[0])}`);
  }
}

/**
 * Format outcome for display
 */
export function formatOutcome(outcome: string): string {
  return outcome
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
