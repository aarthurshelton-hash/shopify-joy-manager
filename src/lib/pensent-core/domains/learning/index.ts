/**
 * Learning Domain - Universal Cross-Domain Intelligence
 * 
 * En Pensent™ Unified Learning System
 * 
 * Connects Chess, Code, and Market domains into a single
 * self-evolving organism where every pattern teaches all domains.
 * 
 * Core Components:
 * 1. Cross-Domain Learning Pipeline - Pattern transfer across domains
 * 2. Historical Game Importer - Bulk pattern extraction from Lichess/Chess.com
 * 3. IBKR Intelligence Collector - Real-time market pattern learning
 * 
 * "The Code is the BLOOD, The Market is the NERVOUS SYSTEM,
 *  Chess is the BRAIN - all are ONE organism"
 */

// Cross-domain learning
export {
  crossDomainLearningPipeline,
  type DomainLesson,
  type CrossDomainPattern,
  type LearningState,
} from './crossDomainLearningPipeline';

// Historical game import
export {
  historicalGameImporter,
  type ImportProgress,
  type ImportOptions,
} from './historicalGameImporter';

// IBKR intelligence
export {
  ibkrIntelligenceCollector,
  type IBKRTradeIntelligence,
  type MarketConditions,
  type IntelligenceState,
} from './ibkrIntelligenceCollector';
