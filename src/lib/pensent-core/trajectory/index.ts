/**
 * En Pensent Core SDK - Trajectory Module
 * 
 * Re-exports all trajectory prediction functions
 */

export { DEFAULT_PREDICTION_CONFIG } from './config';
export type { PredictionConfig } from './config';
export { generateMilestones, formatArchetype, getArchetypeRecommendation } from './milestoneGenerator';
export { generateStrategicGuidance, formatOutcome } from './guidanceGenerator';
export { 
  assessTrajectorySustainability, 
  calculateTrajectoryDivergence
} from './sustainabilityAssessor';
export type { SustainabilityAssessment } from './sustainabilityAssessor';
