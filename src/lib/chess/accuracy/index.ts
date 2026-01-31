/**
 * Chess Accuracy Enhancement Suite - v7.56-SMART-FALLBACK
 * 
 * Unified exports for all chess prediction accuracy improvements.
 */

// Temporal Phase Weighting
export {
  type GamePhase,
  type PhaseWeight,
  PHASE_WEIGHTS,
  detectGamePhase,
  getPhaseAdjustedConfidence,
  getOptimalHorizon,
  blendScores,
} from './temporalPhaseWeighting';

// Move Order Sensitivity
export {
  type MoveSequence,
  type SequencePattern,
  STRATEGIC_SEQUENCES,
  classifyMove,
  extractMoveTypeSequence,
  sequenceSimilarity,
  findMatchingSequences,
  calculateSequenceMomentum,
  detectCascade,
} from './moveOrderSensitivity';

// Opponent Modeling
export {
  type PlayStyle,
  type PlayerProfile,
  STYLE_MATCHUPS,
  inferPlayStyle,
  createPlayerProfile,
  getStyleMatchupAdjustment,
  adjustProbabilitiesForProfiles,
  predictBlunderProbability,
} from './opponentModeling';

// Critical Moment Detection
export {
  type CriticalMomentType,
  type CriticalMoment,
  type TensionPoint,
  MOMENT_WEIGHTS,
  detectCriticalMoment,
  calculatePositionTension,
  detectTensionBreakPoint,
  aggregateCriticalMoments,
  scoreDecisionProximity,
} from './criticalMomentDetection';

// v7.56: Archetype Historical Rates (Smart Fallback)
export {
  type ArchetypeStats,
  loadArchetypeStats,
  getArchetypePrediction,
  invalidateArchetypeCache,
} from './archetypeHistoricalRates';

// v7.85: Meta-Learning System
export {
  ARCHETYPE_LEARNING_RATES,
  getAdaptiveLearningRate,
  recalibrateConfidence,
  ensemblePrediction,
  analyzeMaterialTrajectory,
  analyzeSpaceEvolution,
  analyzeTimePressure,
} from './metaLearning';

// v7.85: Disagreement Analysis
export {
  recordDisagreementOutcome,
  getDisagreementWinRate,
  getConfidenceBoostFromDisagreements,
  analyzeArchetypeDisagreements,
  getGlobalDisagreementStats,
  initializeDisagreementAnalysis,
  detectPositionType,
} from './disagreementAnalysis';

// v7.85: ELO-Tier Adaptive Sampling
export {
  ELO_TIERS,
  getAdaptiveTierWeights,
  getEloTier,
  getGameEloTier,
  loadEloTierPerformance,
  getCurrentAdaptiveWeights,
  selectTierByWeight,
} from './eloTierAdaptive';

// v7.85: Chess Truth Validation (Cross-Domain)
export {
  validateChessPrediction,
  buildUniversalContext,
  quickConfidenceAdjust,
} from './chessTruthValidation';

// v7.85: Enhanced Intelligence Compounding
export {
  getMetaEnhancedConfidence,
  recordPredictionWithContext,
} from './intelligenceCompounding';
