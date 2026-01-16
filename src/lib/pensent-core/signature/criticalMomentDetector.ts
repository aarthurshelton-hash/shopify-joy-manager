/**
 * En Pensent Core SDK - Critical Moment Detector
 * 
 * Detects significant changes in value sequences
 */

import { CriticalMoment } from '../types';

export interface DetectionOptions {
  /** Minimum change threshold to detect */
  threshold?: number;
  /** Minimum severity to include in results */
  minSeverity?: number;
  /** Maximum number of moments to return */
  maxMoments?: number;
}

const DEFAULT_OPTIONS: Required<DetectionOptions> = {
  threshold: 0.3,
  minSeverity: 0.5,
  maxMoments: 10
};

/**
 * Detect critical moments from a sequence of values
 */
export function detectCriticalMoments(
  values: number[],
  options: DetectionOptions = {}
): CriticalMoment[] {
  const { threshold, minSeverity, maxMoments } = { ...DEFAULT_OPTIONS, ...options };
  
  if (values.length < 3) return [];
  
  const changes = findSignificantChanges(values, threshold);
  const filteredMoments = convertToMoments(changes, minSeverity);
  
  return sortChronologically(filteredMoments).slice(0, maxMoments);
}

/**
 * Find changes that exceed the threshold
 */
function findSignificantChanges(
  values: number[],
  threshold: number
): { index: number; change: number; direction: 'up' | 'down' }[] {
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
  
  return changes;
}

/**
 * Convert changes to critical moments, filtering by severity
 */
function convertToMoments(
  changes: { index: number; change: number; direction: 'up' | 'down' }[],
  minSeverity: number
): CriticalMoment[] {
  // Sort by magnitude to get top changes
  const sorted = [...changes].sort((a, b) => b.change - a.change);
  
  const moments: CriticalMoment[] = [];
  
  for (const change of sorted) {
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
  
  return moments;
}

/**
 * Sort moments chronologically by index
 */
function sortChronologically(moments: CriticalMoment[]): CriticalMoment[] {
  return [...moments].sort((a, b) => a.index - b.index);
}
