/**
 * En Pensent Core SDK - Core Signature Types
 * 
 * Fundamental temporal-spatial-chromatic pattern interfaces.
 */

/**
 * Universal quadrant/region profile for any 2D spatial domain
 */
export interface QuadrantProfile {
  /** Top-left or primary region activity (0-1) */
  q1: number;
  /** Top-right or secondary region activity (0-1) */
  q2: number;
  /** Bottom-left or tertiary region activity (0-1) */
  q3: number;
  /** Bottom-right or quaternary region activity (0-1) */
  q4: number;
  /** Optional: center region for domains with central focus */
  center?: number;
  /** Optional: custom named regions for domain-specific analysis */
  custom?: Record<string, number>;
}

/**
 * Temporal flow describes how activity evolves over time
 */
export interface TemporalFlow {
  /** Activity level in opening/early phase (0-1) */
  opening: number;
  /** Activity level in middle/development phase (0-1) */
  middle: number;
  /** Activity level in endgame/completion phase (0-1) */
  ending: number;
  /** Trend direction */
  trend: 'accelerating' | 'stable' | 'declining' | 'volatile';
  /** Momentum score (-1 to 1, negative = losing momentum) */
  momentum: number;
}

/**
 * Critical moments are turning points in the temporal sequence
 */
export interface CriticalMoment {
  /** Position in sequence (0-indexed) */
  index: number;
  /** Type of critical moment */
  type: string;
  /** Severity/importance (0-1) */
  severity: number;
  /** Human-readable description */
  description: string;
  /** Domain-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Universal temporal signature - the core pattern fingerprint
 */
export interface TemporalSignature {
  /** Unique hash fingerprint of this pattern */
  fingerprint: string;
  /** Strategic archetype classification */
  archetype: string;
  /** Dominant side/direction/force */
  dominantForce: 'primary' | 'secondary' | 'balanced';
  /** Flow direction tendency */
  flowDirection: 'forward' | 'lateral' | 'backward' | 'chaotic';
  /** Overall intensity/activity level (0-1) */
  intensity: number;
  /** Spatial distribution profile */
  quadrantProfile: QuadrantProfile;
  /** Temporal evolution profile */
  temporalFlow: TemporalFlow;
  /** Key turning points */
  criticalMoments: CriticalMoment[];
  /** Domain-specific extended data */
  domainData?: Record<string, unknown>;
}
