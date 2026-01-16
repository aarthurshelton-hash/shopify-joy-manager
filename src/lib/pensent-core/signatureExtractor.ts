/**
 * En Pensent Core SDK - Signature Extraction
 * 
 * Universal algorithms for extracting temporal signatures from any domain
 */

import { 
  TemporalSignature, 
  QuadrantProfile, 
  TemporalFlow, 
  CriticalMoment,
  DomainAdapter 
} from './types';

/**
 * Generate a fingerprint hash from signature components
 */
export function generateFingerprint(
  quadrantProfile: QuadrantProfile,
  temporalFlow: TemporalFlow,
  archetype: string,
  intensity: number
): string {
  // Create a deterministic string from signature components
  const components = [
    Math.round(quadrantProfile.q1 * 100),
    Math.round(quadrantProfile.q2 * 100),
    Math.round(quadrantProfile.q3 * 100),
    Math.round(quadrantProfile.q4 * 100),
    Math.round(temporalFlow.opening * 100),
    Math.round(temporalFlow.middle * 100),
    Math.round(temporalFlow.ending * 100),
    temporalFlow.trend.charAt(0),
    archetype.substring(0, 4),
    Math.round(intensity * 100)
  ].join('-');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `EP-${Math.abs(hash).toString(16).padStart(8, '0').toUpperCase()}`;
}

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
 * Calculate temporal flow from sequence of activity levels
 */
export function calculateTemporalFlow(
  activityLevels: number[],
  phases: { opening: number; middle: number } = { opening: 0.25, middle: 0.5 }
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
  
  const total = activityLevels.length;
  const openingEnd = Math.floor(total * phases.opening);
  const middleEnd = Math.floor(total * (phases.opening + phases.middle));
  
  const openingActivity = activityLevels.slice(0, openingEnd);
  const middleActivity = activityLevels.slice(openingEnd, middleEnd);
  const endingActivity = activityLevels.slice(middleEnd);
  
  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  
  const openingAvg = avg(openingActivity);
  const middleAvg = avg(middleActivity);
  const endingAvg = avg(endingActivity);
  
  // Calculate trend
  let trend: TemporalFlow['trend'];
  const variance = Math.abs(endingAvg - openingAvg);
  
  if (variance < 0.1) {
    trend = 'stable';
  } else if (endingAvg > openingAvg * 1.2) {
    trend = 'accelerating';
  } else if (endingAvg < openingAvg * 0.8) {
    trend = 'declining';
  } else {
    // Check for volatility
    const avgChange = activityLevels.slice(1).reduce((sum, val, i) => 
      sum + Math.abs(val - activityLevels[i]), 0) / (activityLevels.length - 1);
    trend = avgChange > 0.3 ? 'volatile' : 'stable';
  }
  
  // Calculate momentum (-1 to 1)
  const recentWindow = Math.max(1, Math.floor(total * 0.2));
  const recentActivity = activityLevels.slice(-recentWindow);
  const earlierActivity = activityLevels.slice(-recentWindow * 2, -recentWindow);
  
  const recentAvg = avg(recentActivity);
  const earlierAvg = avg(earlierActivity);
  const momentum = earlierAvg > 0 ? Math.max(-1, Math.min(1, (recentAvg - earlierAvg) / earlierAvg)) : 0;
  
  return {
    opening: openingAvg,
    middle: middleAvg,
    ending: endingAvg,
    trend,
    momentum
  };
}

/**
 * Detect critical moments from a sequence of values
 */
export function detectCriticalMoments(
  values: number[],
  options: {
    threshold?: number;
    minSeverity?: number;
    maxMoments?: number;
  } = {}
): CriticalMoment[] {
  const { threshold = 0.3, minSeverity = 0.5, maxMoments = 10 } = options;
  const moments: CriticalMoment[] = [];
  
  if (values.length < 3) return moments;
  
  // Calculate changes between consecutive values
  const changes: { index: number; change: number; direction: 'up' | 'down' }[] = [];
  
  for (let i = 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    if (Math.abs(change) > threshold) {
      changes.push({
        index: i,
        change: Math.abs(change),
        direction: change > 0 ? 'up' : 'down'
      });
    }
  }
  
  // Sort by magnitude and take top moments
  changes.sort((a, b) => b.change - a.change);
  
  for (const change of changes.slice(0, maxMoments)) {
    const severity = Math.min(1, change.change);
    if (severity >= minSeverity) {
      moments.push({
        index: change.index,
        type: change.direction === 'up' ? 'surge' : 'drop',
        severity,
        description: `${change.direction === 'up' ? 'Significant increase' : 'Significant decrease'} at position ${change.index}`
      });
    }
  }
  
  // Sort by index for chronological order
  moments.sort((a, b) => a.index - b.index);
  
  return moments;
}

/**
 * Calculate overall intensity from various activity metrics
 */
export function calculateIntensity(
  metrics: { value: number; weight: number }[]
): number {
  if (metrics.length === 0) return 0;
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const metric of metrics) {
    weightedSum += metric.value * metric.weight;
    totalWeight += metric.weight;
  }
  
  return totalWeight > 0 ? Math.min(1, Math.max(0, weightedSum / totalWeight)) : 0;
}

/**
 * Determine dominant force from two competing values
 */
export function determineDominantForce(
  primary: number,
  secondary: number,
  balanceThreshold: number = 0.1
): 'primary' | 'secondary' | 'balanced' {
  const difference = primary - secondary;
  
  if (Math.abs(difference) < balanceThreshold) {
    return 'balanced';
  }
  
  return difference > 0 ? 'primary' : 'secondary';
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

/**
 * Universal signature extraction using a domain adapter
 */
export function extractSignature<TInput, TState>(
  input: TInput,
  adapter: DomainAdapter<TInput, TState>
): TemporalSignature {
  const states = adapter.parseInput(input);
  return adapter.extractSignature(states);
}

/**
 * Hash any string for deduplication
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
