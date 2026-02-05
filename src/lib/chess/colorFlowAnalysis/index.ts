// v8.07-AGREEMENT-CALIBRATED exports
export { calibrateConfidence, getSfPrediction, forceArchetypeAssignment, ARCHETYPE_HISTORICAL_ACCURACY } from './archetypeCalibration';

/**
 * Color Flow Analysis Engine
 * 
 * Patent-Pending Technology: En Pensent™ Color Flow Signatures
 * 
 * This module extracts visual pattern signatures from chess games,
 * mapping them to strategic archetypes for trajectory prediction.
 * 
 * Unlike Stockfish's position-by-position calculation, this system
 * identifies "game arcs" through color flow patterns - enabling
 * strategic predictions that complement tactical analysis.
 * 
 * Core Innovation: Compress 64 squares × N moves into a visual fingerprint
 * that can match historical patterns across thousands of games.
 * 
 * v7.52-SYNC: Integrated prophylactic variation analysis
 */

// Re-export types
export * from './types';

// Re-export archetype definitions
export { ARCHETYPE_DEFINITIONS } from './archetypeDefinitions';

// Re-export signature extractor with prophylactic deep analysis
export { extractColorFlowSignature, getLastProphylacticAnalysis } from './signatureExtractor';

// Re-export prediction engine with equilibrium system
export { predictFromColorFlow, getLastEquilibriumScores } from './predictionEngine';

// Re-export equilibrium predictor
export { calculateEquilibriumScores, type EquilibriumScores } from './equilibriumPredictor';

// Re-export prophylactic variation system
export {
  classifyProphylacticVariation,
  getProphylacticTradingSignal,
  PROPHYLACTIC_VARIATIONS,
  type ProphylacticVariation,
  type ProphylacticAnalysis,
} from './prophylacticVariations';

// Default export
import { extractColorFlowSignature } from './signatureExtractor';
export default extractColorFlowSignature;

// ═══════════════════════════════════════════════════════════════
// ENHANCED 8-QUADRANT SIGNATURE SYSTEM (v9.0)
// ═══════════════════════════════════════════════════════════════
// 
// Revolutionary expansion from 4-quadrant to 8-quadrant analysis
// with piece-type specific colors (12-color palette vs 2-color binary)
// 
// Expected accuracy improvement: 61% → 76-86%

// Enhanced signature extractor (8-quadrant, 12-color)
export {
  extractEnhancedColorFlowSignature,
  generateEnhancedFingerprint,
  calculateEnhancedQuadrantProfile,
  classifyEnhancedArchetype,
  compareEnhancedProfiles,
  ENHANCED_COLOR_CODES,
  getGradatedPawnColor,
  type EnhancedQuadrantProfile,
} from './enhancedSignatureExtractor';

// A/B Testing framework for validation
export {
  runSingleABTest,
  runBatchABTest,
  calculateABTestStatistics,
  generateABTestReport,
  exportABTestResults,
  type ABTestResult,
  type ABTestStatistics,
} from './abTestingFramework';

// Enhanced piece color definitions
export {
  PIECE_COLOR_CODES,
  type PieceColorCode,
} from './enhancedPieceColors';
