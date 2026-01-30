/**
 * Code Archetype Type Definitions
 * 
 * Defines the archetype taxonomy for codebase classification.
 */

/**
 * Code Archetype Definitions
 */
export type CodeArchetype =
  | 'core_fortress'      // Strong core, protected boundaries
  | 'rapid_expansion'    // Fast growth, high velocity
  | 'pattern_master'     // High pattern density throughout
  | 'modular_army'       // Well-separated, independent modules
  | 'monolith_giant'     // Large, tightly coupled
  | 'microservice_swarm' // Many small, specialized modules
  | 'hybrid_fusion'      // Balanced across all dimensions
  | 'technical_debt'     // Accumulated issues, needs refactoring
  | 'emerging_startup'   // Small but growing rapidly
  | 'legacy_evolution'   // Older codebase being modernized
  | 'innovation_lab'     // Experimental, high change rate
  | 'production_stable'; // Mature, stable, low change

export interface ArchetypeDefinition {
  id: CodeArchetype;
  name: string;
  description: string;
  characteristics: string[];
  recommendedActions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  evolutionPath: CodeArchetype | null;
}

export interface ArchetypeClassificationResult {
  archetype: CodeArchetype;
  definition: ArchetypeDefinition;
  confidence: number;
  secondaryArchetype: CodeArchetype | null;
}
