/**
 * En Pensent Core SDK - Milestone Generator
 * 
 * Generates trajectory milestones from signature analysis
 */

import { TemporalSignature, TrajectoryMilestone, PatternMatch } from '../types';

/**
 * Generate milestones based on pattern analysis
 */
export function generateMilestones(
  signature: TemporalSignature,
  _matches: PatternMatch[],
  currentPosition: number,
  totalExpectedLength: number
): TrajectoryMilestone[] {
  const milestones: TrajectoryMilestone[] = [];
  const remaining = totalExpectedLength - currentPosition;
  
  if (remaining <= 0) return milestones;
  
  addCriticalDecisionPoint(milestones, signature, currentPosition, remaining);
  addTrajectoryConfirmation(milestones, currentPosition, remaining);
  addArchetypeMilestone(milestones, signature, currentPosition, remaining);
  addCriticalMomentMilestones(milestones, signature, currentPosition);
  
  // Sort by index and return top 5
  milestones.sort((a, b) => a.predictedIndex - b.predictedIndex);
  return milestones.slice(0, 5);
}

function addCriticalDecisionPoint(
  milestones: TrajectoryMilestone[],
  signature: TemporalSignature,
  currentPosition: number,
  remaining: number
): void {
  const criticalPoint = Math.floor(currentPosition + remaining * 0.25);
  milestones.push({
    predictedIndex: criticalPoint,
    event: 'Critical Decision Point',
    probability: 0.75,
    impact: signature.intensity > 0.6 ? 0.8 : 0.5,
    recommendation: signature.temporalFlow.trend === 'accelerating' 
      ? 'Maintain momentum' 
      : 'Consider strategic pivot'
  });
}

function addTrajectoryConfirmation(
  milestones: TrajectoryMilestone[],
  currentPosition: number,
  remaining: number
): void {
  const confirmationPoint = Math.floor(currentPosition + remaining * 0.5);
  milestones.push({
    predictedIndex: confirmationPoint,
    event: 'Trajectory Confirmation',
    probability: 0.65,
    impact: 0.6,
    recommendation: 'Evaluate if current pattern holds'
  });
}

function addArchetypeMilestone(
  milestones: TrajectoryMilestone[],
  signature: TemporalSignature,
  currentPosition: number,
  remaining: number
): void {
  if (signature.archetype && remaining > 10) {
    const archetypeMilestone = Math.floor(currentPosition + remaining * 0.7);
    milestones.push({
      predictedIndex: archetypeMilestone,
      event: `${formatArchetype(signature.archetype)} Phase`,
      probability: 0.7,
      impact: 0.7,
      recommendation: getArchetypeRecommendation(signature.archetype)
    });
  }
}

function addCriticalMomentMilestones(
  milestones: TrajectoryMilestone[],
  signature: TemporalSignature,
  currentPosition: number
): void {
  for (const moment of signature.criticalMoments.slice(0, 2)) {
    if (moment.index > currentPosition) {
      milestones.push({
        predictedIndex: moment.index,
        event: moment.description,
        probability: moment.severity,
        impact: moment.severity,
        recommendation: `Prepare for ${moment.type}`
      });
    }
  }
}

/**
 * Format archetype name for display
 */
export function formatArchetype(archetype: string): string {
  return archetype
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get recommendation for archetype
 */
export function getArchetypeRecommendation(archetype: string): string {
  const recommendations: Record<string, string> = {
    'rapid_growth': 'Sustain growth rate while building infrastructure',
    'refactor_cycle': 'Complete refactoring before adding new features',
    'tech_debt_spiral': 'Address technical debt immediately',
    'stability_plateau': 'Consider innovation to avoid stagnation',
    'feature_burst': 'Consolidate gains and improve test coverage',
    'death_march': 'Reduce scope and prioritize sustainability',
    'kingside_attack': 'Press the attack while maintaining defense',
    'queenside_attack': 'Expand territorial control',
    'central_domination': 'Leverage central control for flexibility',
    'tactical_chaos': 'Calculate carefully, avoid simplification'
  };
  
  return recommendations[archetype] ?? 'Continue current strategy with vigilance';
}
