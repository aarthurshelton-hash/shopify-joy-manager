/**
 * En Pensent Core SDK - Temporal Flow Calculator
 * 
 * Analyzes activity sequences to determine temporal patterns
 */

import { TemporalFlow } from '../types';

export interface PhaseConfig {
  opening: number;
  middle: number;
}

const DEFAULT_PHASES: PhaseConfig = { opening: 0.25, middle: 0.5 };

/**
 * Calculate temporal flow from sequence of activity levels
 */
export function calculateTemporalFlow(
  activityLevels: number[],
  phases: PhaseConfig = DEFAULT_PHASES
): TemporalFlow {
  if (activityLevels.length === 0) {
    return {
      opening: 0,
      middle: 0,
      ending: 0,
      trend: 'stable',
      momentum: 0
    };
  }
  
  const { openingAvg, middleAvg, endingAvg } = calculatePhaseAverages(activityLevels, phases);
  const trend = determineTrend(activityLevels, openingAvg, endingAvg);
  const momentum = calculateMomentum(activityLevels);
  
  return {
    opening: openingAvg,
    middle: middleAvg,
    ending: endingAvg,
    trend,
    momentum
  };
}

/**
 * Calculate averages for each phase of the activity sequence
 */
function calculatePhaseAverages(
  activityLevels: number[],
  phases: PhaseConfig
): { openingAvg: number; middleAvg: number; endingAvg: number } {
  const total = activityLevels.length;
  const openingEnd = Math.floor(total * phases.opening);
  const middleEnd = Math.floor(total * (phases.opening + phases.middle));
  
  const openingActivity = activityLevels.slice(0, openingEnd);
  const middleActivity = activityLevels.slice(openingEnd, middleEnd);
  const endingActivity = activityLevels.slice(middleEnd);
  
  return {
    openingAvg: avg(openingActivity),
    middleAvg: avg(middleActivity),
    endingAvg: avg(endingActivity)
  };
}

/**
 * Determine the trend based on activity changes
 */
function determineTrend(
  activityLevels: number[],
  openingAvg: number,
  endingAvg: number
): TemporalFlow['trend'] {
  // Check for volatility first (high variation between consecutive values)
  if (activityLevels.length > 1) {
    const avgChange = activityLevels.slice(1).reduce((sum, val, i) =>
      sum + Math.abs(val - activityLevels[i]), 0) / (activityLevels.length - 1);
    if (avgChange > 0.3) {
      return 'volatile';
    }
  }

  const variance = Math.abs(endingAvg - openingAvg);

  if (variance < 0.1) {
    return 'stable';
  }

  if (endingAvg > openingAvg * 1.2) {
    return 'accelerating';
  }

  if (endingAvg < openingAvg * 0.8) {
    return 'declining';
  }

  return 'stable';
}

/**
 * Calculate momentum (-1 to 1) based on recent vs earlier activity
 */
function calculateMomentum(activityLevels: number[]): number {
  const total = activityLevels.length;
  const recentWindow = Math.max(1, Math.floor(total * 0.2));
  
  const recentActivity = activityLevels.slice(-recentWindow);
  const earlierActivity = activityLevels.slice(-recentWindow * 2, -recentWindow);
  
  const recentAvg = avg(recentActivity);
  const earlierAvg = avg(earlierActivity);
  
  return earlierAvg > 0 
    ? Math.max(-1, Math.min(1, (recentAvg - earlierAvg) / earlierAvg)) 
    : 0;
}

/**
 * Calculate average of an array
 */
function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
