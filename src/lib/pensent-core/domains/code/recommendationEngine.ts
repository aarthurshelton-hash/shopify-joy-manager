/**
 * Recommendation Engine
 * 
 * Generates actionable recommendations based on health analysis.
 */

import { CodeFlowSignature } from './signatureExtractor';
import { CodeArchetype } from './archetypeTypes';
import { CODE_ARCHETYPES } from './archetypeDefinitions';
import { HealthIssue, HealthRecommendation } from './healthTypes';

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
  
  // Add archetype-based recommendations
  for (const action of archetypeDef.recommendedActions.slice(0, 2)) {
    recommendations.push({
      priority: 'medium',
      title: action,
      description: `Based on ${archetypeDef.name} archetype classification`,
      expectedImpact: 'Improved codebase alignment',
      relatedArchetypeEvolution: archetypeDef.evolutionPath,
    });
  }
  
  // Add issue-based recommendations
  if (criticalIssues.length > 0) {
    recommendations.unshift({
      priority: 'high',
      title: 'Address Critical Issues',
      description: `${criticalIssues.length} critical issues require immediate attention`,
      expectedImpact: 'Stabilized codebase health',
      relatedArchetypeEvolution: null,
    });
  }
  
  // Add warning-based recommendations
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
