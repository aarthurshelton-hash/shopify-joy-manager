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

// Re-export prediction engine
export { predictFromColorFlow } from './predictionEngine';

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
