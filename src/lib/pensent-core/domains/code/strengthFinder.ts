/**
 * Strength Finder
 * 
 * Identifies positive aspects and strengths in codebase analysis.
 */

import { CodeFlowSignature } from './signatureExtractor';
import { FileAnalysis, CodeDimension } from './types';
import { HealthStrength } from './healthTypes';

/**
 * Find strengths in the codebase
 */
export function findStrengths(
  signature: CodeFlowSignature,
  files: FileAnalysis[]
): HealthStrength[] {
  const strengths: HealthStrength[] = [];
  const grid = signature.metricGrid;
  
  // Find high-scoring dimensions
  for (const [dim, score] of Object.entries(grid.byDimension)) {
    if (score >= 75) {
      strengths.push({
        category: 'core-sdk',
        dimension: dim as CodeDimension,
        title: `Strong ${capitalize(dim)}`,
        description: `Excellent ${dim} score across the codebase`,
        score,
      });
    }
  }
  
  // High pattern density
  const avgDensity = files.length > 0 
    ? files.reduce((sum, f) => sum + f.patternDensity, 0) / files.length
    : 0;
  
  if (avgDensity > 0.5) {
    strengths.push({
      category: 'core-sdk',
      dimension: 'coverage',
      title: 'High Pattern Integration',
      description: 'Strong En Pensent pattern adoption across codebase',
      score: avgDensity * 100,
    });
  }
  
  return strengths;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
