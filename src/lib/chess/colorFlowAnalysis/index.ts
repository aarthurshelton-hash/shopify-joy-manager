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
 */

// Re-export types
export * from './types';

// Re-export archetype definitions
export { ARCHETYPE_DEFINITIONS } from './archetypeDefinitions';

// Re-export signature extractor
export { extractColorFlowSignature } from './signatureExtractor';

// Re-export prediction engine
export { predictFromColorFlow } from './predictionEngine';

// Default export
import { extractColorFlowSignature } from './signatureExtractor';
export default extractColorFlowSignature;
