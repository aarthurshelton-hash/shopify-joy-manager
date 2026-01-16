/**
 * En Pensent Core SDK
 * 
 * Universal Temporal Pattern Recognition Engine
 * 
 * The core paradigm: Sequential events → Visual signatures → Pattern matching → Trajectory prediction
 * 
 * This SDK can be applied to any domain with:
 * - Spatial structure (grid, regions, zones)
 * - Chromatic/intensity values (colors, weights, activity levels)
 * - Temporal evolution (sequence of states over time)
 * 
 * Domains: Chess, Code, Music, Light, Health, Finance, and beyond
 */

// Core Types
export * from './types';

// Signature Extraction
export {
  generateFingerprint,
  calculateQuadrantProfile,
  calculateTemporalFlow,
  detectCriticalMoments,
  calculateIntensity,
  determineDominantForce,
  determineFlowDirection,
  extractSignature,
  hashString
} from './signatureExtractor';

// Pattern Matching
export {
  quadrantSimilarity,
  temporalFlowSimilarity,
  calculateSignatureSimilarity,
  findSimilarPatterns,
  calculateOutcomeProbabilities,
  getMostLikelyOutcome,
  calculatePatternDiversity,
  calculateMatchConfidence
} from './patternMatcher';

// Trajectory Prediction
export {
  generateTrajectoryPrediction,
  calculateTrajectoryDivergence,
  assessTrajectorySustainability
} from './trajectoryPredictor';

// Version
export const PENSENT_CORE_VERSION = '1.0.0';

/**
 * Create a new En Pensent engine for a domain
 */
export function createPensentEngine<TInput, TState>(
  adapter: import('./types').DomainAdapter<TInput, TState>
) {
  return {
    domain: adapter.domain,
    
    /**
     * Extract signature from input
     */
    extractSignature(input: TInput) {
      const states = adapter.parseInput(input);
      return adapter.extractSignature(states);
    },
    
    /**
     * Classify signature into archetype
     */
    classifyArchetype(signature: import('./types').TemporalSignature) {
      return adapter.classifyArchetype(signature);
    },
    
    /**
     * Find similar patterns
     */
    findSimilarPatterns(
      signature: import('./types').TemporalSignature,
      patterns: { id: string; signature: import('./types').TemporalSignature; outcome: string }[],
      options?: { minSimilarity?: number; limit?: number }
    ) {
      const { findSimilarPatterns } = require('./patternMatcher');
      return findSimilarPatterns(signature, patterns, {
        targetSignature: signature,
        ...options
      });
    },
    
    /**
     * Generate trajectory prediction
     */
    predictTrajectory(
      signature: import('./types').TemporalSignature,
      matches: import('./types').PatternMatch[],
      currentPosition: number,
      totalExpectedLength: number
    ) {
      const archetypeRegistry = adapter.getArchetypeRegistry();
      const archetypeDef = archetypeRegistry.archetypes[signature.archetype] ?? null;
      
      const { generateTrajectoryPrediction } = require('./trajectoryPredictor');
      return generateTrajectoryPrediction(
        signature,
        matches,
        archetypeDef,
        currentPosition,
        totalExpectedLength
      );
    },
    
    /**
     * Get archetype registry
     */
    getArchetypes() {
      return adapter.getArchetypeRegistry();
    },
    
    /**
     * Calculate similarity between two signatures
     */
    calculateSimilarity(a: import('./types').TemporalSignature, b: import('./types').TemporalSignature) {
      return adapter.calculateSimilarity(a, b);
    }
  };
}
