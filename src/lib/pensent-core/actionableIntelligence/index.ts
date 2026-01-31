/**
 * Actionable Intelligence Engine
 * 
 * Transforms pattern classifications into specific, high-value action recommendations.
 * Addresses the "So What?" test - every insight must lead to a concrete action.
 * 
 * Modular structure:
 * - types.ts: Type definitions
 * - chessActions.ts: Chess domain action maps
 * - codeActions.ts: Code domain action maps  
 * - marketActions.ts: Market domain action maps
 * - insightGenerator.ts: Main insight generation logic
 * - blackSwanDetector.ts: Cross-domain anomaly detection
 */

// Re-export types
export type {
  ActionableInsight,
  ChessAction,
  CodeAction,
  MarketAction,
  DomainActionMap,
  ActionMapEntry,
} from './types';

// Re-export action maps
export { CHESS_ACTIONABLE_MAP } from './chessActions';
export { CODE_ACTIONABLE_MAP } from './codeActions';
export { MARKET_ACTIONABLE_MAP } from './marketActions';

// Re-export main functions
export { generateActionableInsights } from './insightGenerator';
export { 
  detectBlackSwanCorrelations,
  type BlackSwanCorrelation 
} from './blackSwanDetector';
