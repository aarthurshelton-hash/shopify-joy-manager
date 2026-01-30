/**
 * Code Archetype Definitions
 * 
 * Complete definition catalog for all 12 code archetypes.
 */

import { CodeArchetype, ArchetypeDefinition } from './archetypeTypes';

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
    evolutionPath: null
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
