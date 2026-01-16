/**
 * En Pensent Core SDK - Universal Types
 * 
 * Domain-agnostic pattern recognition interfaces that can be applied
 * to any temporal-spatial-chromatic domain: chess, code, music, light, health, etc.
 */

// Core signature types
export type {
  QuadrantProfile,
  TemporalFlow,
  CriticalMoment,
  TemporalSignature,
} from './core';

// Archetype system
export type {
  ArchetypeDefinition,
  ArchetypeRegistry,
} from './archetype';

// Pattern matching
export type {
  PatternMatch,
  PatternSearchCriteria,
} from './pattern';

// Trajectory prediction
export type {
  TrajectoryMilestone,
  TrajectoryPrediction,
} from './trajectory';

// Hybrid fusion
export type {
  TacticalInsight,
  StrategicInsight,
  FusedRecommendation,
  HybridPrediction,
} from './hybrid';

// Domain adapter
export type { DomainAdapter } from './adapter';

// Persistence
export type {
  PersistedPattern,
  PatternStats,
} from './persistence';
