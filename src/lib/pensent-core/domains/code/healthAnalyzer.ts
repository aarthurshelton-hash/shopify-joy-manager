/**
 * Code Health Analyzer
 * 
 * Generates comprehensive health reports for codebases,
 * identifying issues and recommending improvements.
 */

import { CodeFlowSignature } from './signatureExtractor';
import { classifyCodeArchetype } from './archetypeClassifier';
import { calculateCodeExchangeValue } from './exchangeValue';
import { FileAnalysis } from './types';
import { CodeHealthReport } from './healthTypes';
import { findCriticalIssues, findWarnings } from './issueFinder';
import { findStrengths } from './strengthFinder';
import { generateRecommendations } from './recommendationEngine';
import { 
  analyzeDimensionHealth, 
  analyzeCategoryHealth,
  calculateOverallScore,
  getGrade
} from './healthMetrics';

// Re-export types for backwards compatibility
export type {
  CodeHealthReport,
  HealthIssue,
  HealthStrength,
  HealthRecommendation,
  DimensionHealth,
  CategoryHealth,
} from './healthTypes';

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
  
  // Find issues and strengths
  const criticalIssues = findCriticalIssues(signature, files);
  const warnings = findWarnings(signature, files);
  const strengths = findStrengths(signature, files);
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    signature,
    archetype,
    criticalIssues,
    warnings
  );
  
  // Analyze dimensions and categories
  const dimensionHealth = analyzeDimensionHealth(signature, files);
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
