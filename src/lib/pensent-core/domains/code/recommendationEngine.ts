/**
 * Enhanced Recommendation Engine
 * 
 * Generates actionable recommendations based on health analysis.
 * Addresses the "So What?" test - every insight leads to a concrete action.
 */

import { CodeFlowSignature } from './signatureExtractor';
import { CodeArchetype } from './archetypeTypes';
import { CODE_ARCHETYPES } from './archetypeDefinitions';
import { HealthIssue, HealthRecommendation } from './healthTypes';

/**
 * Specific, high-value actions for each archetype
 * Answers: "If I see this pattern, what EXACTLY should I do?"
 */
const ARCHETYPE_SPECIFIC_ACTIONS: Record<CodeArchetype, { 
  immediateAction: string;
  expectedOutcome: string;
  timeframe: string;
  priority: 'high' | 'medium' | 'low';
}> = {
  core_fortress: {
    immediateAction: 'Document your core patterns as ADRs (Architecture Decision Records). Share with team.',
    expectedOutcome: 'Team alignment on proven patterns, reduced review friction',
    timeframe: 'This sprint',
    priority: 'medium',
  },
  rapid_expansion: {
    immediateAction: 'STOP adding features. Schedule 2-day refactoring sprint. Add ESLint/Prettier.',
    expectedOutcome: 'Sustainable velocity, reduced tech debt accumulation',
    timeframe: 'Immediately',
    priority: 'high',
  },
  pattern_master: {
    immediateAction: 'Create internal pattern library package. Consider open-sourcing generic utilities.',
    expectedOutcome: 'Reusable assets across projects, industry recognition',
    timeframe: 'This quarter',
    priority: 'low',
  },
  modular_army: {
    immediateAction: 'Define module API contracts. Add integration tests at boundaries.',
    expectedOutcome: 'Safe independent deployments, clearer team ownership',
    timeframe: 'Next 2 sprints',
    priority: 'medium',
  },
  monolith_giant: {
    immediateAction: 'Identify 3 modules with clearest boundaries. Start strangler fig extraction.',
    expectedOutcome: 'Reduced coupling, faster builds, easier testing',
    timeframe: 'Next quarter',
    priority: 'high',
  },
  microservice_swarm: {
    immediateAction: 'Add distributed tracing (Jaeger/Zipkin). Create service mesh for cross-cutting concerns.',
    expectedOutcome: 'Debuggable system, centralized auth/logging',
    timeframe: 'This month',
    priority: 'medium',
  },
  hybrid_fusion: {
    immediateAction: 'Create Architecture Decision Record defining target state. Pick ONE archetype goal.',
    expectedOutcome: 'Focused direction, measurable progress',
    timeframe: 'This week',
    priority: 'medium',
  },
  technical_debt: {
    immediateAction: 'Run SonarQube/CodeClimate. Fix ALL critical issues before ANY new features.',
    expectedOutcome: 'Stability, developer confidence, fewer production issues',
    timeframe: 'Blocker - do first',
    priority: 'high',
  },
  emerging_startup: {
    immediateAction: 'Establish coding conventions NOW. Create 3 ADRs for biggest decisions.',
    expectedOutcome: 'Scalable foundation as team grows',
    timeframe: 'This week',
    priority: 'high',
  },
  legacy_evolution: {
    immediateAction: 'Create adapter layer between old and new code. Never modify legacy directly.',
    expectedOutcome: 'Safe modernization, preserved functionality',
    timeframe: 'Ongoing - each feature',
    priority: 'medium',
  },
  innovation_lab: {
    immediateAction: 'Create "graduation criteria" checklist. Separate experiments from production code.',
    expectedOutcome: 'Clear path from prototype to product',
    timeframe: 'This sprint',
    priority: 'medium',
  },
  production_stable: {
    immediateAction: 'Audit dependencies for CVEs. Plan strategic refresh for oldest components.',
    expectedOutcome: 'Security compliance, prevented stagnation',
    timeframe: 'Monthly review',
    priority: 'low',
  },
};

/**
 * Generate recommendations based on archetype and issues
 */
export function generateRecommendations(
  signature: CodeFlowSignature,
  archetype: CodeArchetype,
  criticalIssues: HealthIssue[],
  warnings: HealthIssue[]
): HealthRecommendation[] {
  const recommendations: HealthRecommendation[] = [];
  const archetypeDef = CODE_ARCHETYPES[archetype];
  const specificAction = ARCHETYPE_SPECIFIC_ACTIONS[archetype];
  
  // Priority 1: Add specific actionable recommendation (addresses "So What?" test)
  recommendations.push({
    priority: specificAction.priority,
    title: specificAction.immediateAction,
    description: `Based on ${archetypeDef.name} archetype. Timeframe: ${specificAction.timeframe}`,
    expectedImpact: specificAction.expectedOutcome,
    relatedArchetypeEvolution: archetypeDef.evolutionPath,
  });
  
  // Priority 2: Add archetype-based recommendations from definitions
  for (const action of archetypeDef.recommendedActions.slice(0, 2)) {
    recommendations.push({
      priority: 'medium',
      title: action,
      description: `Standard practice for ${archetypeDef.name} codebase`,
      expectedImpact: 'Improved codebase alignment',
      relatedArchetypeEvolution: archetypeDef.evolutionPath,
    });
  }
  
  // Priority 3: Add issue-based recommendations
  if (criticalIssues.length > 0) {
    recommendations.unshift({
      priority: 'high',
      title: `Fix ${criticalIssues.length} Critical Issues`,
      description: criticalIssues.slice(0, 3).map(i => i.description).join('; '),
      expectedImpact: 'Stabilized codebase health',
      relatedArchetypeEvolution: null,
    });
  }
  
  // Priority 4: Add warning-based recommendations
  if (warnings.length > 3) {
    recommendations.push({
      priority: 'medium',
      title: 'Reduce Technical Warnings',
      description: `${warnings.length} warnings indicate areas for improvement`,
      expectedImpact: 'Improved code quality metrics',
      relatedArchetypeEvolution: null,
    });
  }
  
  return recommendations;
}
