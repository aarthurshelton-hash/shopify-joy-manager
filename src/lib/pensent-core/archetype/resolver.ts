/**
 * En Pensent Core SDK - Archetype Resolver Class
 */

import { TemporalSignature, ArchetypeDefinition, ArchetypeRegistry } from '../types';
import { ArchetypeMatchCriteria, ArchetypeMatchResult, DEFAULT_MATCH_CRITERIA } from './criteria';
import { matchKeywords } from './termExtractor';
import { 
  calculateIntensityAlignment, 
  calculateFlowAlignment, 
  calculateQuadrantAlignment 
} from './alignmentCalculators';

/**
 * Universal archetype resolver that works across domains
 */
export class ArchetypeResolver {
  private registry: ArchetypeRegistry;
  private criteria: ArchetypeMatchCriteria;

  constructor(registry: ArchetypeRegistry, criteria?: Partial<ArchetypeMatchCriteria>) {
    this.registry = registry;
    this.criteria = { ...DEFAULT_MATCH_CRITERIA, ...criteria };
  }

  /**
   * Resolve archetype from a temporal signature using universal pattern matching
   */
  resolve(signature: TemporalSignature): ArchetypeMatchResult {
    const candidates = this.scoreAllArchetypes(signature);
    
    // Sort by confidence
    candidates.sort((a, b) => b.confidence - a.confidence);
    
    const best = candidates[0];
    const alternatives = candidates.slice(1, 4);
    
    return {
      archetype: best?.archetype ?? 'unknown',
      confidence: best?.confidence ?? 0,
      matchReasons: this.generateMatchReasons(signature, best?.archetype ?? 'unknown'),
      alternativeArchetypes: alternatives
    };
  }

  /**
   * Score all archetypes against a signature
   */
  private scoreAllArchetypes(
    signature: TemporalSignature
  ): Array<{ archetype: string; confidence: number }> {
    const scores: Array<{ archetype: string; confidence: number }> = [];
    
    for (const [id, definition] of Object.entries(this.registry.archetypes)) {
      const confidence = this.calculateArchetypeMatch(signature, definition);
      scores.push({ archetype: id, confidence });
    }
    
    return scores;
  }

  /**
   * Calculate match confidence between signature and archetype definition
   */
  private calculateArchetypeMatch(
    signature: TemporalSignature,
    definition: ArchetypeDefinition
  ): number {
    let score = 0;
    let factors = 0;
    
    // Factor 1: Keyword matching from signature characteristics
    if (definition.keywords && definition.keywords.length > 0) {
      const keywordMatch = matchKeywords(signature, definition.keywords);
      score += keywordMatch * 0.3;
      factors += 0.3;
    }
    
    // Factor 2: Intensity alignment
    const intensityFactor = calculateIntensityAlignment(signature, definition);
    score += intensityFactor * 0.25;
    factors += 0.25;
    
    // Factor 3: Flow pattern matching
    const flowFactor = calculateFlowAlignment(signature, definition);
    score += flowFactor * 0.25;
    factors += 0.25;
    
    // Factor 4: Quadrant distribution matching
    const quadrantFactor = calculateQuadrantAlignment(signature, definition);
    score += quadrantFactor * 0.2;
    factors += 0.2;
    
    return factors > 0 ? score / factors : 0;
  }

  /**
   * Generate human-readable match reasons
   */
  private generateMatchReasons(signature: TemporalSignature, archetype: string): string[] {
    const reasons: string[] = [];
    const definition = this.registry.archetypes[archetype];
    
    if (!definition) {
      return ['No matching archetype definition found'];
    }
    
    reasons.push(`Pattern matches "${definition.name}" archetype`);
    
    if (signature.temporalFlow.trend === 'accelerating') {
      reasons.push('Momentum is building in current trajectory');
    } else if (signature.temporalFlow.trend === 'declining') {
      reasons.push('Activity shows declining trend');
    }
    
    if (signature.intensity > 0.7) {
      reasons.push('High intensity activity detected');
    }
    
    if (definition.successRate > 0.6) {
      reasons.push(`Historical success rate: ${Math.round(definition.successRate * 100)}%`);
    }
    
    return reasons;
  }

  /**
   * Get archetype definition by ID
   */
  getArchetypeDefinition(archetypeId: string): ArchetypeDefinition | null {
    return this.registry.archetypes[archetypeId] ?? null;
  }

  /**
   * Get all registered archetypes
   */
  getAllArchetypes(): ArchetypeDefinition[] {
    return Object.values(this.registry.archetypes);
  }

  /**
   * Check if a signature matches a specific archetype
   */
  matchesArchetype(signature: TemporalSignature, archetypeId: string): boolean {
    const result = this.resolve(signature);
    return result.archetype === archetypeId && result.confidence > 0.5;
  }
}

/**
 * Create an archetype resolver for a domain
 */
export function createArchetypeResolver(
  registry: ArchetypeRegistry,
  criteria?: Partial<ArchetypeMatchCriteria>
): ArchetypeResolver {
  return new ArchetypeResolver(registry, criteria);
}
