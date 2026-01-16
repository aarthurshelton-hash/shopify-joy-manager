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
 * 
 * v1.2.0 - Added event bus, caching, pipeline/middleware, and batch processing
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
  assessTrajectorySustainability,
  DEFAULT_PREDICTION_CONFIG,
  type PredictionConfig
} from './trajectoryPredictor';

// Archetype Resolution
export {
  ArchetypeResolver,
  createArchetypeResolver,
  classifyUniversalArchetype,
  calculateArchetypeSimilarity,
  DEFAULT_MATCH_CRITERIA,
  type ArchetypeMatchCriteria,
  type ArchetypeMatchResult
} from './archetypeResolver';

// Visualization Primitives
export {
  quadrantToRadarData,
  temporalFlowToChartData,
  criticalMomentsToTimeline,
  createIntensityGauge,
  createConfidenceGauge,
  signatureToVisualizationData,
  getColorForValue,
  getConfidenceColor,
  getIntensityColor,
  formatPercentage,
  formatTrend,
  formatArchetype,
  formatFlowDirection,
  formatDominantForce,
  createStaggeredDelays,
  DEFAULT_COLOR_SCALE,
  DEFAULT_ANIMATION_CONFIG,
  type TimeSeriesPoint,
  type RadarChartData,
  type HeatMapData,
  type FlowChartData,
  type GaugeData,
  type SignatureVisualizationData,
  type ColorScale,
  type AnimationConfig
} from './visualizationPrimitives';

// Event Bus (NEW in v1.2.0)
export {
  PensentEventBus,
  createEventBus,
  globalEventBus,
  type PensentEvent,
  type PensentEventType,
  type PensentEventHandler,
  type PensentEventFilter,
  type EventSubscription,
  type SignatureExtractedPayload,
  type PatternMatchedPayload,
  type PredictionGeneratedPayload,
  type BatchProgressPayload,
  type ErrorPayload
} from './eventBus';

// Caching (NEW in v1.2.0)
export {
  PensentCache,
  SignatureCache,
  MatchCache,
  PredictionCache,
  createCache,
  createCacheBundle,
  DEFAULT_CACHE_CONFIG,
  type CacheEntry,
  type CacheStats,
  type CacheConfig
} from './cache';

// Pipeline & Middleware (NEW in v1.2.0)
export {
  AnalysisPipeline,
  createPipeline,
  loggingMiddleware,
  validationMiddleware,
  cachingMiddleware,
  retryMiddleware,
  timeoutMiddleware,
  type PipelineContext,
  type PipelineMiddleware,
  type PipelineStep
} from './pipeline';

// Batch Processing (NEW in v1.2.0)
export {
  BatchProcessor,
  StreamProcessor,
  createBatchProcessor,
  createStreamProcessor,
  DEFAULT_BATCH_CONFIG,
  type BatchInput,
  type BatchResult,
  type BatchProgress,
  type BatchConfig,
  type BatchAggregation
} from './batch';

// Version
export const PENSENT_CORE_VERSION = '1.2.0';

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
    },
    
    /**
     * Create an analysis pipeline with middleware support
     */
    createPipeline() {
      const { createPipeline } = require('./pipeline');
      return createPipeline(adapter);
    },
    
    /**
     * Create a batch processor for bulk analysis
     */
    createBatchProcessor(config?: import('./batch').BatchConfig) {
      const { createBatchProcessor } = require('./batch');
      return createBatchProcessor(adapter, config);
    },
    
    /**
     * Create a stream processor for real-time analysis
     */
    createStreamProcessor(options?: {
      bufferSize?: number;
      flushIntervalMs?: number;
      onFlush?: (results: import('./batch').BatchResult<import('./types').TemporalSignature>[]) => void;
    }) {
      const { createStreamProcessor } = require('./batch');
      return createStreamProcessor(adapter, options);
    }
  };
}
