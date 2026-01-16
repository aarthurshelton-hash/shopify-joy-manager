/**
 * En Pensent Core SDK - Archetype System Types
 */

/**
 * Archetype definition describes a strategic pattern category
 */
export interface ArchetypeDefinition {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of this pattern type */
  description: string;
  /** Historical success rate (0-1) */
  successRate: number;
  /** Typical outcome prediction */
  predictedOutcome: 'primary_wins' | 'secondary_wins' | 'draw' | 'uncertain';
  /** Confidence in predictions for this archetype (0-1) */
  confidence: number;
  /** Keywords for matching */
  keywords: string[];
  /** Related archetypes for fuzzy matching */
  relatedArchetypes: string[];
}

/**
 * Archetype registry for a domain
 */
export interface ArchetypeRegistry {
  /** Domain name */
  domain: string;
  /** Version of archetype definitions */
  version: string;
  /** All archetype definitions */
  archetypes: Record<string, ArchetypeDefinition>;
}
