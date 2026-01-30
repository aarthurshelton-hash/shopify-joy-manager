/**
 * Code Archetype Classifier
 * 
 * Classifies codebases into strategic archetypes,
 * mirroring the Chess archetype system.
 */

import { CodeFlowSignature } from './signatureExtractor';
import { CodeArchetype, ArchetypeDefinition, ArchetypeClassificationResult } from './archetypeTypes';
import { CODE_ARCHETYPES } from './archetypeDefinitions';

// Re-export for backwards compatibility
export type { CodeArchetype, ArchetypeDefinition, ArchetypeClassificationResult };
export { CODE_ARCHETYPES };

/**
 * Classify a codebase into an archetype based on its signature
 */
export function classifyCodeArchetype(signature: CodeFlowSignature): ArchetypeClassificationResult {
  const scores = calculateArchetypeScores(signature);
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  
  const bestArchetype = sorted[0][0] as CodeArchetype;
  const bestScore = sorted[0][1];
  const secondScore = sorted[1][1];
  
  return {
    archetype: bestArchetype,
    definition: CODE_ARCHETYPES[bestArchetype],
    confidence: Math.min(100, (bestScore / Math.max(1, secondScore)) * 50),
    secondaryArchetype: sorted[1][0] as CodeArchetype,
  };
}

/**
 * Calculate scores for each archetype based on signature metrics
 */
function calculateArchetypeScores(signature: CodeFlowSignature): Record<CodeArchetype, number> {
  const grid = signature.metricGrid;
  const quadrant = signature.quadrantProfile;
  const temporal = signature.temporalFlow;
  
  const scores = {} as Record<CodeArchetype, number>;
  
  // Core Fortress: High core territory, good architecture
  scores.core_fortress = 
    (quadrant.coreTerritory * 0.4) +
    (grid.byDimension['architecture'] * 0.3) +
    (grid.byDimension['quality'] * 0.3);
  
  // Rapid Expansion: High velocity, growing
  scores.rapid_expansion = 
    (temporal.velocity > 0 ? temporal.velocity * 20 : 0) +
    (grid.byDimension['velocity'] * 0.5) +
    (50 - Math.abs(temporal.current - temporal.baseline));
  
  // Pattern Master: High intensity and pattern density
  scores.pattern_master = 
    (signature.intensity * 0.5) +
    (grid.byDimension['coverage'] * 0.3) +
    (grid.overallScore * 0.2);
  
  // Modular Army: High architecture, good separation
  scores.modular_army = 
    (grid.byDimension['architecture'] * 0.4) +
    (100 - grid.byDimension['cohesion']) * 0.3 +
    (quadrant.structuralPower * 0.3);
  
  // Monolith Giant: Low architecture, high complexity
  scores.monolith_giant = 
    ((100 - grid.byDimension['architecture']) * 0.4) +
    ((100 - grid.byDimension['complexity']) * 0.4) +
    (grid.byDimension['cohesion'] * 0.2);
  
  // Microservice Swarm: Many small modules
  scores.microservice_swarm = 
    (grid.byDimension['architecture'] * 0.3) +
    ((100 - grid.byDimension['performance']) * 0.3) +
    (quadrant.tacticalSupport * 0.4);
  
  // Hybrid Fusion: Balanced scores (low variance)
  const avgScore = grid.overallScore;
  const variance = Object.values(grid.byDimension)
    .reduce((sum, v) => sum + Math.pow(v - avgScore, 2), 0) / 8;
  scores.hybrid_fusion = Math.max(0, 80 - variance * 0.5);
  
  // Technical Debt: Low quality, many issues
  scores.technical_debt = 
    ((100 - grid.byDimension['quality']) * 0.5) +
    (signature.criticalMoments.length * 10) +
    ((100 - grid.overallScore) * 0.3);
  
  // Emerging Startup: Small, growing
  scores.emerging_startup = 
    (temporal.velocity > 0 ? temporal.velocity * 30 : 0) +
    ((100 - grid.byDimension['performance']) * 0.2);
  
  // Legacy Evolution: Mixed patterns, moderate velocity
  scores.legacy_evolution = 
    (Math.abs(temporal.postRefactor - temporal.baseline) * 0.3) +
    (grid.byDimension['evolution'] * 0.4) +
    50;
  
  // Innovation Lab: High velocity, variable quality
  scores.innovation_lab = 
    (grid.byDimension['velocity'] * 0.5) +
    (Math.abs(temporal.velocity) * 20) +
    ((100 - grid.byDimension['quality']) * 0.2);
  
  // Production Stable: Low velocity, high quality
  scores.production_stable = 
    ((100 - grid.byDimension['velocity']) * 0.4) +
    (grid.byDimension['quality'] * 0.4) +
    (temporal.velocity < 5 ? 30 : 0);
  
  return scores;
}
