/**
 * Code Archetype Classifier
 * 
 * Classifies codebases into strategic archetypes,
 * mirroring the Chess archetype system.
 * 
 * Each archetype represents a distinct "personality"
 * of how the codebase approaches problems.
 */

import { CodeFlowSignature } from './signatureExtractor';
import { CodeQuadrantProfile } from './types';

/**
 * Code Archetype Definitions
 */
export type CodeArchetype =
  | 'core_fortress'      // Strong core, protected boundaries
  | 'rapid_expansion'    // Fast growth, high velocity
  | 'pattern_master'     // High pattern density throughout
  | 'modular_army'       // Well-separated, independent modules
  | 'monolith_giant'     // Large, tightly coupled
  | 'microservice_swarm' // Many small, specialized modules
  | 'hybrid_fusion'      // Balanced across all dimensions
  | 'technical_debt'     // Accumulated issues, needs refactoring
  | 'emerging_startup'   // Small but growing rapidly
  | 'legacy_evolution'   // Older codebase being modernized
  | 'innovation_lab'     // Experimental, high change rate
  | 'production_stable'; // Mature, stable, low change

export interface ArchetypeDefinition {
  id: CodeArchetype;
  name: string;
  description: string;
  characteristics: string[];
  recommendedActions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  evolutionPath: CodeArchetype | null; // What it should evolve into
}

export const CODE_ARCHETYPES: Record<CodeArchetype, ArchetypeDefinition> = {
  core_fortress: {
    id: 'core_fortress',
    name: 'Core Fortress',
    description: 'Strong foundational code with well-protected core modules',
    characteristics: [
      'High core SDK scores',
      'Clear separation of concerns',
      'Strong architectural patterns',
      'Good test coverage on critical paths'
    ],
    recommendedActions: [
      'Expand pattern usage to peripheral modules',
      'Document core patterns for team adoption',
      'Consider creating abstractions for common patterns'
    ],
    riskLevel: 'low',
    evolutionPath: 'pattern_master'
  },
  
  rapid_expansion: {
    id: 'rapid_expansion',
    name: 'Rapid Expansion',
    description: 'Fast-growing codebase with high development velocity',
    characteristics: [
      'High commit frequency',
      'Expanding file count',
      'Possibly inconsistent patterns',
      'New features over refactoring'
    ],
    recommendedActions: [
      'Establish coding standards',
      'Add architectural reviews',
      'Schedule regular refactoring sprints',
      'Implement automated quality gates'
    ],
    riskLevel: 'medium',
    evolutionPath: 'modular_army'
  },
  
  pattern_master: {
    id: 'pattern_master',
    name: 'Pattern Master',
    description: 'Highly pattern-integrated codebase with strong En Pensent adoption',
    characteristics: [
      'High pattern density (>70%)',
      'Consistent SDK usage',
      'Clear archetype signatures',
      'Cross-domain applicability'
    ],
    recommendedActions: [
      'Document unique patterns',
      'Share patterns with community',
      'Consider patent documentation',
      'Optimize performance-critical paths'
    ],
    riskLevel: 'low',
    evolutionPath: null // Already optimal
  },
  
  modular_army: {
    id: 'modular_army',
    name: 'Modular Army',
    description: 'Well-organized codebase with independent, reusable modules',
    characteristics: [
      'Low coupling between modules',
      'High cohesion within modules',
      'Clear module boundaries',
      'Easy to test in isolation'
    ],
    recommendedActions: [
      'Increase pattern integration',
      'Create shared pattern library',
      'Document module contracts',
      'Consider micro-frontend architecture'
    ],
    riskLevel: 'low',
    evolutionPath: 'pattern_master'
  },
  
  monolith_giant: {
    id: 'monolith_giant',
    name: 'Monolith Giant',
    description: 'Large, tightly coupled codebase requiring careful refactoring',
    characteristics: [
      'High file sizes',
      'Deep dependency chains',
      'Difficult to modify safely',
      'Long build times'
    ],
    recommendedActions: [
      'Identify module boundaries',
      'Create strangler pattern refactors',
      'Add integration tests before splitting',
      'Prioritize by business value'
    ],
    riskLevel: 'high',
    evolutionPath: 'modular_army'
  },
  
  microservice_swarm: {
    id: 'microservice_swarm',
    name: 'Microservice Swarm',
    description: 'Many small, specialized modules with distributed architecture',
    characteristics: [
      'Many small files',
      'Clear single responsibilities',
      'Potential coordination overhead',
      'May need centralized patterns'
    ],
    recommendedActions: [
      'Create shared pattern library',
      'Establish service contracts',
      'Add observability patterns',
      'Consider service mesh for common concerns'
    ],
    riskLevel: 'medium',
    evolutionPath: 'pattern_master'
  },
  
  hybrid_fusion: {
    id: 'hybrid_fusion',
    name: 'Hybrid Fusion',
    description: 'Balanced codebase with elements from multiple archetypes',
    characteristics: [
      'Mixed patterns',
      'Moderate metrics across dimensions',
      'Flexible but potentially unfocused',
      'Room for specialization'
    ],
    recommendedActions: [
      'Define strategic direction',
      'Choose primary archetype target',
      'Consolidate patterns',
      'Create architecture decision records'
    ],
    riskLevel: 'medium',
    evolutionPath: 'core_fortress'
  },
  
  technical_debt: {
    id: 'technical_debt',
    name: 'Technical Debt',
    description: 'Accumulated issues requiring systematic remediation',
    characteristics: [
      'High issue count',
      'Low code quality scores',
      'Inconsistent patterns',
      'Frequent production issues'
    ],
    recommendedActions: [
      'Prioritize critical fixes',
      'Establish quality baseline',
      'Create debt payoff roadmap',
      'Add automated code quality checks'
    ],
    riskLevel: 'high',
    evolutionPath: 'hybrid_fusion'
  },
  
  emerging_startup: {
    id: 'emerging_startup',
    name: 'Emerging Startup',
    description: 'Small but rapidly growing codebase with high potential',
    characteristics: [
      'Small file count',
      'High change velocity',
      'Early-stage patterns',
      'Focus on feature delivery'
    ],
    recommendedActions: [
      'Establish patterns early',
      'Create architecture guidelines',
      'Balance speed with quality',
      'Document key decisions'
    ],
    riskLevel: 'medium',
    evolutionPath: 'rapid_expansion'
  },
  
  legacy_evolution: {
    id: 'legacy_evolution',
    name: 'Legacy Evolution',
    description: 'Older codebase being modernized with new patterns',
    characteristics: [
      'Mixed old and new patterns',
      'Gradual modernization',
      'Compatibility constraints',
      'Careful migration required'
    ],
    recommendedActions: [
      'Create migration guides',
      'Add adapter patterns',
      'Isolate legacy code',
      'Measure modernization progress'
    ],
    riskLevel: 'medium',
    evolutionPath: 'modular_army'
  },
  
  innovation_lab: {
    id: 'innovation_lab',
    name: 'Innovation Lab',
    description: 'Experimental codebase with frequent changes and prototypes',
    characteristics: [
      'High experimentation',
      'Rapid prototyping',
      'May lack production polish',
      'Creative problem solving'
    ],
    recommendedActions: [
      'Create graduation criteria',
      'Separate production-ready code',
      'Document experiments',
      'Track successful patterns'
    ],
    riskLevel: 'medium',
    evolutionPath: 'rapid_expansion'
  },
  
  production_stable: {
    id: 'production_stable',
    name: 'Production Stable',
    description: 'Mature codebase with low change rate and high stability',
    characteristics: [
      'Low change velocity',
      'High test coverage',
      'Well-documented',
      'Predictable behavior'
    ],
    recommendedActions: [
      'Monitor for stagnation',
      'Plan for modernization',
      'Keep dependencies updated',
      'Consider strategic refactoring'
    ],
    riskLevel: 'low',
    evolutionPath: 'pattern_master'
  }
};

/**
 * Classify a codebase into an archetype based on its signature
 */
export function classifyCodeArchetype(signature: CodeFlowSignature): {
  archetype: CodeArchetype;
  definition: ArchetypeDefinition;
  confidence: number;
  secondaryArchetype: CodeArchetype | null;
} {
  const grid = signature.metricGrid;
  const quadrant = signature.quadrantProfile;
  const temporal = signature.temporalFlow;
  
  // Score each archetype
  const scores: Record<CodeArchetype, number> = {} as Record<CodeArchetype, number>;
  
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
  
  // Modular Army: High architecture, low cohesion (good separation)
  scores.modular_army = 
    (grid.byDimension['architecture'] * 0.4) +
    (100 - grid.byDimension['cohesion']) * 0.3 + // Inverted
    (quadrant.structuralPower * 0.3);
  
  // Monolith Giant: Low architecture, high complexity
  scores.monolith_giant = 
    ((100 - grid.byDimension['architecture']) * 0.4) +
    ((100 - grid.byDimension['complexity']) * 0.4) + // Low score = high complexity
    (grid.byDimension['cohesion'] * 0.2); // High cohesion = tightly coupled
  
  // Microservice Swarm: Many small modules
  scores.microservice_swarm = 
    (grid.byDimension['architecture'] * 0.3) +
    ((100 - grid.byDimension['performance']) * 0.3) + // Small files
    (quadrant.tacticalSupport * 0.4);
  
  // Hybrid Fusion: Balanced scores
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
    ((100 - grid.byDimension['performance']) * 0.2); // Small = high performance
  
  // Legacy Evolution: Mixed patterns, moderate velocity
  scores.legacy_evolution = 
    (Math.abs(temporal.postRefactor - temporal.baseline) * 0.3) +
    (grid.byDimension['evolution'] * 0.4) +
    (50); // Base score
  
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
  
  // Find best match
  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);
  
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
