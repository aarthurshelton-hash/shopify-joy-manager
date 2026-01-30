/**
 * En Pensent™ Code Domain
 * 
 * Code Flow Signature analysis using the 64-metric grid
 * mirroring chess board structure for codebase intelligence.
 * 
 * The 8 Dimensions:
 * 1. Complexity (cyclomatic, cognitive, halstead)
 * 2. Cohesion (module coupling, dependency depth)
 * 3. Coverage (pattern density, SDK integration)
 * 4. Velocity (change frequency, churn rate)
 * 5. Quality (issue density, fix rate)
 * 6. Architecture (modularity, separation of concerns)
 * 7. Performance (bundle size, render cycles)
 * 8. Evolution (refactor history, growth trajectory)
 * 
 * "Code is the BLOOD of the Universal Organism"
 */

// Core types
export * from './types';
export * from './archetypeTypes';
export * from './healthTypes';

// Signature extraction
export { extractCodeFlowSignature } from './signatureExtractor';
export type { CodeFlowSignature } from './signatureExtractor';

// Archetype classification
export { classifyCodeArchetype, CODE_ARCHETYPES } from './archetypeClassifier';
export type { CodeArchetype, ArchetypeDefinition, ArchetypeClassificationResult } from './archetypeTypes';

// Exchange value
export { calculateCodeExchangeValue } from './exchangeValue';
export type { CodeExchangeValue, CodeValueFactors } from './exchangeValue';

// Health analysis
export { analyzeCodeHealth } from './healthAnalyzer';
export type { 
  CodeHealthReport,
  HealthIssue,
  HealthStrength,
  HealthRecommendation,
  DimensionHealth,
  CategoryHealth,
} from './healthTypes';

// Pattern matching
export { matchCodeToChessPatterns } from './patternMatcher';
export type { CodeChessMapping } from './patternMatcher';

// Sub-modules for direct access
export { findCriticalIssues, findWarnings } from './issueFinder';
export { findStrengths } from './strengthFinder';
export { generateRecommendations } from './recommendationEngine';
export { 
  analyzeDimensionHealth, 
  analyzeCategoryHealth,
  calculateOverallScore,
  getGrade 
} from './healthMetrics';
