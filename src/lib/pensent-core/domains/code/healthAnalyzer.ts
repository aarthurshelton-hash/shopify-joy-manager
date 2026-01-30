/**
 * Code Health Analyzer
 * 
 * Generates comprehensive health reports for codebases,
 * identifying issues and recommending improvements.
 */

import { CodeFlowSignature } from './signatureExtractor';
import { CodeArchetype, classifyCodeArchetype, CODE_ARCHETYPES } from './archetypeClassifier';
import { CodeExchangeValue, calculateCodeExchangeValue } from './exchangeValue';
import { FileAnalysis, CodeCategory, CodeDimension } from './types';

/**
 * Complete health report for a codebase
 */
export interface CodeHealthReport {
  /** Overall health grade */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  
  /** Health score (0-100) */
  score: number;
  
  /** Trend direction */
  trend: 'improving' | 'stable' | 'declining';
  
  /** Classified archetype */
  archetype: CodeArchetype;
  archetypeConfidence: number;
  
  /** Exchange value */
  exchangeValue: CodeExchangeValue;
  
  /** Critical issues requiring immediate attention */
  criticalIssues: HealthIssue[];
  
  /** Warnings that should be addressed */
  warnings: HealthIssue[];
  
  /** Positive aspects of the codebase */
  strengths: HealthStrength[];
  
  /** Recommended improvements */
  recommendations: HealthRecommendation[];
  
  /** Dimension-level breakdown */
  dimensionHealth: Record<CodeDimension, DimensionHealth>;
  
  /** Category-level breakdown */
  categoryHealth: Record<CodeCategory, CategoryHealth>;
  
  /** Generation timestamp */
  generatedAt: number;
}

export interface HealthIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: CodeCategory;
  dimension: CodeDimension;
  title: string;
  description: string;
  affectedFiles: string[];
  suggestedFix: string;
  estimatedEffort: 'hours' | 'days' | 'weeks';
}

export interface HealthStrength {
  category: CodeCategory;
  dimension: CodeDimension;
  title: string;
  description: string;
  score: number;
}

export interface HealthRecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  relatedArchetypeEvolution: CodeArchetype | null;
}

export interface DimensionHealth {
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  issues: number;
  topConcern: string | null;
}

export interface CategoryHealth {
  score: number;
  fileCount: number;
  avgComplexity: string;
  patternDensity: number;
  topIssue: string | null;
}

/**
 * Analyze codebase health from signature and files
 */
export function analyzeCodeHealth(
  signature: CodeFlowSignature,
  files: FileAnalysis[],
  totalLoc: number,
  previousReport?: CodeHealthReport
): CodeHealthReport {
  // Calculate exchange value
  const patternCount = files.filter(f => f.patternDensity > 0.3).length;
  const exchangeValue = calculateCodeExchangeValue(
    signature,
    totalLoc,
    patternCount,
    previousReport?.exchangeValue
  );
  
  // Classify archetype
  const { archetype, confidence } = classifyCodeArchetype(signature);
  
  // Calculate overall score
  const score = calculateOverallScore(signature, files);
  
  // Determine grade
  const grade = getGrade(score);
  
  // Determine trend
  const trend = previousReport
    ? score > previousReport.score + 2
      ? 'improving'
      : score < previousReport.score - 2
        ? 'declining'
        : 'stable'
    : 'stable';
  
  // Find issues
  const criticalIssues = findCriticalIssues(signature, files);
  const warnings = findWarnings(signature, files);
  
  // Identify strengths
  const strengths = findStrengths(signature, files);
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    signature,
    archetype,
    criticalIssues,
    warnings
  );
  
  // Dimension health
  const dimensionHealth = analyzeDimensionHealth(signature, files);
  
  // Category health
  const categoryHealth = analyzeCategoryHealth(signature, files);
  
  return {
    grade,
    score,
    trend,
    archetype,
    archetypeConfidence: confidence,
    exchangeValue,
    criticalIssues,
    warnings,
    strengths,
    recommendations,
    dimensionHealth,
    categoryHealth,
    generatedAt: Date.now(),
  };
}

function calculateOverallScore(
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
    (50) - // Base
    criticalPenalty -
    coveragePenalty
  ));
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function findCriticalIssues(
  signature: CodeFlowSignature,
  files: FileAnalysis[]
): HealthIssue[] {
  const issues: HealthIssue[] = [];
  
  // Critical complexity files
  const criticalFiles = files.filter(f => f.complexity === 'critical');
  if (criticalFiles.length > 0) {
    issues.push({
      id: 'critical-complexity',
      severity: 'critical',
      category: 'core-sdk',
      dimension: 'complexity',
      title: 'Critical Complexity Detected',
      description: `${criticalFiles.length} files have critical complexity levels`,
      affectedFiles: criticalFiles.map(f => f.path),
      suggestedFix: 'Split large files into smaller, focused modules',
      estimatedEffort: criticalFiles.length > 3 ? 'weeks' : 'days',
    });
  }
  
  // Very low pattern density in core files
  const lowPatternCore = files.filter(
    f => f.category === 'core-sdk' && f.patternDensity < 0.1
  );
  if (lowPatternCore.length > 0) {
    issues.push({
      id: 'core-sdk-coverage',
      severity: 'critical',
      category: 'core-sdk',
      dimension: 'coverage',
      title: 'Core SDK Coverage Gap',
      description: 'Core SDK files lack pattern integration',
      affectedFiles: lowPatternCore.map(f => f.path),
      suggestedFix: 'Integrate En Pensent patterns into core modules',
      estimatedEffort: 'days',
    });
  }
  
  return issues;
}

function findWarnings(
  signature: CodeFlowSignature,
  files: FileAnalysis[]
): HealthIssue[] {
  const warnings: HealthIssue[] = [];
  
  // High complexity files
  const highComplexity = files.filter(f => f.complexity === 'high');
  if (highComplexity.length > 5) {
    warnings.push({
      id: 'high-complexity',
      severity: 'high',
      category: 'utils-types',
      dimension: 'complexity',
      title: 'High Complexity Files',
      description: `${highComplexity.length} files have high complexity`,
      affectedFiles: highComplexity.slice(0, 5).map(f => f.path),
      suggestedFix: 'Consider refactoring to reduce complexity',
      estimatedEffort: 'days',
    });
  }
  
  // Low pattern density
  const lowPattern = files.filter(
    f => f.patternDensity < 0.3 && f.linesOfCode > 50
  );
  if (lowPattern.length > 10) {
    warnings.push({
      id: 'low-pattern-density',
      severity: 'medium',
      category: 'ui-components',
      dimension: 'coverage',
      title: 'Low Pattern Integration',
      description: `${lowPattern.length} files have low En Pensent integration`,
      affectedFiles: lowPattern.slice(0, 5).map(f => f.path),
      suggestedFix: 'Add pattern-based abstractions and SDK usage',
      estimatedEffort: 'weeks',
    });
  }
  
  return warnings;
}

function findStrengths(
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
        title: `Strong ${dim.charAt(0).toUpperCase() + dim.slice(1)}`,
        description: `Excellent ${dim} score across the codebase`,
        score,
      });
    }
  }
  
  // High pattern density
  const avgDensity = files.reduce((sum, f) => sum + f.patternDensity, 0) / files.length;
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

function generateRecommendations(
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
  
  return recommendations;
}

function analyzeDimensionHealth(
  signature: CodeFlowSignature,
  files: FileAnalysis[]
): Record<CodeDimension, DimensionHealth> {
  const result = {} as Record<CodeDimension, DimensionHealth>;
  
  const dimensions: CodeDimension[] = [
    'complexity', 'cohesion', 'coverage', 'velocity',
    'quality', 'architecture', 'performance', 'evolution'
  ];
  
  for (const dim of dimensions) {
    result[dim] = {
      score: signature.metricGrid.byDimension[dim] || 50,
      trend: 'stable',
      issues: 0,
      topConcern: null,
    };
  }
  
  return result;
}

function analyzeCategoryHealth(
  signature: CodeFlowSignature,
  files: FileAnalysis[]
): Record<CodeCategory, CategoryHealth> {
  const result = {} as Record<CodeCategory, CategoryHealth>;
  
  const categories: CodeCategory[] = [
    'core-sdk', 'chess-domain', 'market-domain', 'code-domain',
    'ui-components', 'hooks-stores', 'pages-routes', 'utils-types'
  ];
  
  for (const cat of categories) {
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

function getMostCommonComplexity(files: FileAnalysis[]): string {
  if (files.length === 0) return 'n/a';
  
  const counts = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const f of files) {
    counts[f.complexity]++;
  }
  
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)[0][0];
}
