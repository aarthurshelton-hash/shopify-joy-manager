/**
 * En Pensent Core SDK - Quadrant Profile Calculator
 * 
 * Calculates quadrant distributions from activity data
 */

import { QuadrantProfile } from '../types';

/**
 * Calculate quadrant profile from activity distribution
 */
export function calculateQuadrantProfile(
  activities: { region: 'q1' | 'q2' | 'q3' | 'q4' | 'center'; weight: number }[]
): QuadrantProfile {
  const totals = { q1: 0, q2: 0, q3: 0, q4: 0, center: 0 };
  let totalWeight = 0;
  
  for (const activity of activities) {
    totals[activity.region] += activity.weight;
    totalWeight += activity.weight;
  }
  
  if (totalWeight === 0) {
    return { q1: 0.25, q2: 0.25, q3: 0.25, q4: 0.25, center: 0 };
  }
  
  return {
    q1: totals.q1 / totalWeight,
    q2: totals.q2 / totalWeight,
    q3: totals.q3 / totalWeight,
    q4: totals.q4 / totalWeight,
    center: totals.center / totalWeight
  };
}

/**
 * Determine flow direction from quadrant profile
 */
export function determineFlowDirection(
  quadrantProfile: QuadrantProfile
): 'forward' | 'lateral' | 'backward' | 'chaotic' {
  const { q1, q2, q3, q4 } = quadrantProfile;
  
  // Forward: activity concentrated in q1/q2 (top)
  const forwardness = (q1 + q2) - (q3 + q4);
  // Lateral: activity spread evenly or side-concentrated
  const lateralness = Math.abs((q1 + q3) - (q2 + q4));
  
  const maxValue = Math.max(forwardness, -forwardness, lateralness);
  
  if (maxValue < 0.15) {
    return 'chaotic';
  }
  
  if (lateralness === maxValue) {
    return 'lateral';
  }
  
  return forwardness > 0 ? 'forward' : 'backward';
}
