/**
 * En Pensent Core SDK - Archetype Resolution
 * 
 * Universal archetype matching logic that can be used by any domain adapter.
 * Extracts common patterns from signature analysis to classify archetypes.
 */

import { 
  TemporalSignature, 
  ArchetypeDefinition, 
  ArchetypeRegistry 
} from './types';

/**
 * Archetype matching criteria - domain-agnostic thresholds
 */
export interface ArchetypeMatchCriteria {
  /** Minimum intensity threshold for activity-based archetypes */
  intensityThreshold: number;
  /** Volatility threshold for chaos detection */
  volatilityThreshold: number;
  /** Momentum threshold for trend classification */
  momentumThreshold: number;
  /** Minimum quadrant imbalance for directional archetypes */
  quadrantImbalanceThreshold: number;
}

export const DEFAULT_MATCH_CRITERIA: ArchetypeMatchCriteria = {
  intensityThreshold: 0.6,
  volatilityThreshold: 0.5,
  momentumThreshold: 0.3,
  quadrantImbalanceThreshold: 0.25
};

/**
 * Archetype match result with confidence scoring
 */
export interface ArchetypeMatchResult {
  archetype: string;
  confidence: number;
  matchReasons: string[];
  alternativeArchetypes: Array<{ archetype: string; confidence: number }>;
}

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
      const keywordMatch = this.matchKeywords(signature, definition.keywords);
      score += keywordMatch * 0.3;
      factors += 0.3;
    }
    
    // Factor 2: Intensity alignment
    const intensityFactor = this.calculateIntensityAlignment(signature, definition);
    score += intensityFactor * 0.25;
    factors += 0.25;
    
    // Factor 3: Flow pattern matching
    const flowFactor = this.calculateFlowAlignment(signature, definition);
    score += flowFactor * 0.25;
    factors += 0.25;
    
    // Factor 4: Quadrant distribution matching
    const quadrantFactor = this.calculateQuadrantAlignment(signature, definition);
    score += quadrantFactor * 0.2;
    factors += 0.2;
    
    return factors > 0 ? score / factors : 0;
  }

  /**
   * Match signature characteristics against archetype keywords
   */
  private matchKeywords(signature: TemporalSignature, keywords: string[]): number {
    const signatureTerms = this.extractSignatureTerms(signature);
    let matches = 0;
    
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      if (signatureTerms.some(term => term.includes(normalizedKeyword) || normalizedKeyword.includes(term))) {
        matches++;
      }
    }
    
    return keywords.length > 0 ? matches / keywords.length : 0;
  }

  /**
   * Extract searchable terms from a signature
   */
  private extractSignatureTerms(signature: TemporalSignature): string[] {
    const terms: string[] = [
      signature.archetype.toLowerCase(),
      signature.flowDirection.toLowerCase(),
      signature.dominantForce.toLowerCase(),
      signature.temporalFlow.trend.toLowerCase()
    ];
    
    // Add intensity-based terms
    if (signature.intensity > 0.8) terms.push('high', 'intense', 'aggressive');
    else if (signature.intensity > 0.5) terms.push('moderate', 'active');
    else terms.push('low', 'passive', 'quiet');
    
    // Add momentum-based terms
    if (signature.temporalFlow.momentum > 0.5) terms.push('accelerating', 'growing');
    else if (signature.temporalFlow.momentum < -0.5) terms.push('declining', 'slowing');
    else terms.push('stable', 'steady');
    
    return terms;
  }

  /**
   * Calculate intensity alignment with archetype expectations
   */
  private calculateIntensityAlignment(
    signature: TemporalSignature, 
    definition: ArchetypeDefinition
  ): number {
    // Use archetype success rate as a proxy for expected intensity pattern
    // High success rate archetypes typically have controlled intensity
    const expectedIntensity = definition.successRate > 0.6 ? 0.6 : 0.4;
    const difference = Math.abs(signature.intensity - expectedIntensity);
    return 1 - Math.min(difference, 1);
  }

  /**
   * Calculate temporal flow alignment with archetype patterns
   */
  private calculateFlowAlignment(
    signature: TemporalSignature,
    definition: ArchetypeDefinition
  ): number {
    // Check if flow direction matches archetype characteristics
    const flowTerms = definition.keywords?.filter(k => 
      ['ascending', 'descending', 'stable', 'volatile', 'chaotic', 
       'accelerating', 'declining', 'steady'].includes(k.toLowerCase())
    ) ?? [];
    
    if (flowTerms.length === 0) return 0.5; // Neutral if no flow keywords
    
    const trendMatch = flowTerms.some(t => 
      t.toLowerCase() === signature.temporalFlow.trend.toLowerCase()
    );
    
    return trendMatch ? 1 : 0.3;
  }

  /**
   * Calculate quadrant distribution alignment
   */
  private calculateQuadrantAlignment(
    signature: TemporalSignature,
    definition: ArchetypeDefinition
  ): number {
    const { q1, q2, q3, q4 } = signature.quadrantProfile;
    const values = [q1, q2, q3, q4];
    
    // Calculate distribution evenness
    const avg = values.reduce((a, b) => a + b, 0) / 4;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / 4;
    const isBalanced = variance < 0.1;
    
    // Some archetypes favor balanced distribution, others favor concentration
    const prefersBalance = definition.keywords?.some(k => 
      ['balanced', 'stable', 'even', 'distributed'].includes(k.toLowerCase())
    ) ?? false;
    
    if (prefersBalance) return isBalanced ? 1 : 0.4;
    return isBalanced ? 0.4 : 1;
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

/**
 * Universal archetype classification based purely on signature metrics
 * This can be used when no domain-specific archetype registry is available
 */
export function classifyUniversalArchetype(signature: TemporalSignature): string {
  const { intensity, temporalFlow, quadrantProfile, criticalMoments } = signature;
  
  // High intensity + accelerating = aggressive pattern
  if (intensity > 0.7 && temporalFlow.trend === 'accelerating') {
    return 'aggressive_expansion';
  }
  
  // Low intensity + stable = maintenance pattern
  if (intensity < 0.3 && temporalFlow.trend === 'stable') {
    return 'maintenance_mode';
  }
  
  // High volatility + many critical moments = chaotic pattern
  if (temporalFlow.trend === 'volatile' && criticalMoments.length > 3) {
    return 'chaotic_evolution';
  }
  
  // Declining trend + negative momentum = decline pattern
  if (temporalFlow.trend === 'declining' && temporalFlow.momentum < -0.3) {
    return 'controlled_decline';
  }
  
  // Check quadrant concentration
  const { q1, q2, q3, q4 } = quadrantProfile;
  const maxQuadrant = Math.max(q1, q2, q3, q4);
  const minQuadrant = Math.min(q1, q2, q3, q4);
  
  if (maxQuadrant - minQuadrant > 0.5) {
    return 'concentrated_activity';
  }
  
  // Balanced distribution
  if (Math.abs(q1 - q2) < 0.1 && Math.abs(q3 - q4) < 0.1) {
    return 'balanced_approach';
  }
  
  return 'standard_evolution';
}

/**
 * Calculate archetype similarity between two archetypes
 */
export function calculateArchetypeSimilarity(
  archetypeA: string,
  archetypeB: string,
  registry: ArchetypeRegistry
): number {
  if (archetypeA === archetypeB) return 1;
  
  const defA = registry.archetypes[archetypeA];
  const defB = registry.archetypes[archetypeB];
  
  if (!defA || !defB) return 0;
  
  // Check if they're related archetypes
  if (defA.relatedArchetypes?.includes(archetypeB) || 
      defB.relatedArchetypes?.includes(archetypeA)) {
    return 0.7;
  }
  
  // Compare keywords overlap
  const keywordsA = new Set(defA.keywords ?? []);
  const keywordsB = new Set(defB.keywords ?? []);
  
  let overlap = 0;
  for (const k of keywordsA) {
    if (keywordsB.has(k)) overlap++;
  }
  
  const totalKeywords = keywordsA.size + keywordsB.size - overlap;
  const keywordSimilarity = totalKeywords > 0 ? overlap / totalKeywords : 0;
  
  // Compare success rates
  const successRateDiff = Math.abs(defA.successRate - defB.successRate);
  const successSimilarity = 1 - successRateDiff;
  
  return (keywordSimilarity * 0.6) + (successSimilarity * 0.4);
}
