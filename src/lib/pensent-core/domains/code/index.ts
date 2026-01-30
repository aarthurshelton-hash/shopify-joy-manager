/**
 * Code Domain - Universal Pattern Recognition
 * 
 * Patent-Pending: En Pensent™ Code Flow Signatures
 * 
 * Just as Chess uses 64 squares for territorial analysis,
 * Code uses 64 metrics across 8 dimensions × 8 categories
 * to create universal exchange value signatures.
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

// Types
export * from './types';

// 64-Metric Signature Extractor
export { extractCodeFlowSignature, type CodeFlowSignature } from './signatureExtractor';

// Universal Exchange Value Calculator
export { 
  calculateCodeExchangeValue, 
  type CodeExchangeValue,
  type CodeValueFactors 
} from './exchangeValue';

// Code Archetype Classifier
export { classifyCodeArchetype, CODE_ARCHETYPES, type CodeArchetype } from './archetypeClassifier';

// Health Analyzer
export { analyzeCodeHealth, type CodeHealthReport } from './healthAnalyzer';

// Pattern Matcher (cross-domain)
export { matchCodeToChessPatterns, type CodeChessMapping } from './patternMatcher';
