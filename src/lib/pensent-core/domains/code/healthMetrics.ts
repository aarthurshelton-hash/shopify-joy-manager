/**
 * Health Metrics Calculator
 * 
 * Calculates dimension and category health breakdowns.
 */

import { CodeFlowSignature } from './signatureExtractor';
import { FileAnalysis, CodeDimension, CodeCategory } from './types';
import { DimensionHealth, CategoryHealth } from './healthTypes';

const DIMENSIONS: CodeDimension[] = [
  'complexity', 'cohesion', 'coverage', 'velocity',
  'quality', 'architecture', 'performance', 'evolution'
];

const CATEGORIES: CodeCategory[] = [
  'core-sdk', 'chess-domain', 'market-domain', 'code-domain',
  'ui-components', 'hooks-stores', 'pages-routes', 'utils-types'
];

/**
 * Analyze health by dimension
 */
export function analyzeDimensionHealth(
  signature: CodeFlowSignature,
  files: FileAnalysis[]
): Record<CodeDimension, DimensionHealth> {
  const result = {} as Record<CodeDimension, DimensionHealth>;
  
  for (const dim of DIMENSIONS) {
    result[dim] = {
      score: signature.metricGrid.byDimension[dim] || 50,
      trend: 'stable',
      issues: 0,
      topConcern: null,
    };
  }
  
  return result;
}

/**
 * Analyze health by category
 */
export function analyzeCategoryHealth(
  signature: CodeFlowSignature,
  files: FileAnalysis[]
): Record<CodeCategory, CategoryHealth> {
  const result = {} as Record<CodeCategory, CategoryHealth>;
  
  for (const cat of CATEGORIES) {
    const catFiles = files.filter(f => f.category === cat);
    const avgDensity = catFiles.length > 0
      ? catFiles.reduce((sum, f) => sum + f.patternDensity, 0) / catFiles.length
      : 0;
    
    result[cat] = {
      score: signature.metricGrid.byCategory[cat] || 50,
      fileCount: catFiles.length,
      avgComplexity: getMostCommonComplexity(catFiles),
      patternDensity: avgDensity,
      topIssue: null,
    };
  }
  
  return result;
}

/**
 * Get most common complexity level from files
 */
function getMostCommonComplexity(files: FileAnalysis[]): string {
  if (files.length === 0) return 'n/a';
  
  const counts = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const f of files) {
    counts[f.complexity]++;
  }
  
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)[0][0];
}

/**
 * Calculate overall health score
 */
export function calculateOverallScore(
  signature: CodeFlowSignature,
  files: FileAnalysis[]
): number {
  const gridScore = signature.metricGrid.overallScore;
  const intensityScore = signature.intensity;
  
  // Penalty for critical files
  const criticalCount = files.filter(f => f.complexity === 'critical').length;
  const criticalPenalty = criticalCount * 5;
  
  // Penalty for low coverage
  const lowCoverageCount = files.filter(f => f.patternDensity < 0.2).length;
  const coveragePenalty = lowCoverageCount * 2;
  
  return Math.max(0, Math.min(100,
    (gridScore * 0.5) +
    (intensityScore * 0.3) +
    50 - // Base
    criticalPenalty -
    coveragePenalty
  ));
}

/**
 * Convert score to letter grade
 */
export function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}
