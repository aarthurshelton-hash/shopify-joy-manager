/**
 * En Pensent Core SDK - Fingerprint Generator
 * 
 * Creates unique fingerprints for signatures
 */

import { QuadrantProfile, TemporalFlow } from '../types';

/**
 * Generate a fingerprint hash from signature components
 */
export function generateFingerprint(
  quadrantProfile: QuadrantProfile,
  temporalFlow: TemporalFlow,
  archetype: string,
  intensity: number
): string {
  const components = buildComponentString(quadrantProfile, temporalFlow, archetype, intensity);
  const hash = computeHash(components);
  
  return `EP-${Math.abs(hash).toString(16).padStart(8, '0').toUpperCase()}`;
}

/**
 * Build deterministic string from signature components
 */
function buildComponentString(
  quadrantProfile: QuadrantProfile,
  temporalFlow: TemporalFlow,
  archetype: string,
  intensity: number
): string {
  return [
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
}

/**
 * Compute a simple hash from a string
 */
function computeHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Hash any string for deduplication
 */
export function hashString(str: string): string {
  const hash = computeHash(str);
  return Math.abs(hash).toString(16).padStart(8, '0');
}
