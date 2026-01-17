/**
 * Morphic Field Adapter
 * 
 * Inspired by Rupert Sheldrake's morphic resonance theory.
 * Tracks how patterns propagate across geographically and temporally
 * separate markets/systems as if influenced by a shared "field."
 */

interface MorphicPattern {
  id: string;
  signature: number[]; // Pattern fingerprint
  firstObserved: number;
  locations: string[]; // Markets/domains where observed
  propagationSpeed: number; // How fast it spread
  strength: number;
  isActive: boolean;
}

interface FieldResonance {
  patternId: string;
  currentStrength: number;
  propagatingTo: string[];
  expectedArrivalMs: number;
  confidence: number;
}

interface MorphicFieldState {
  activePatterns: MorphicPattern[];
  resonances: FieldResonance[];
  fieldCoherence: number; // 0-1, how aligned the field is
  dominantPattern: MorphicPattern | null;
}

class MorphicFieldAdapter {
  private patterns: Map<string, MorphicPattern> = new Map();
  private observations: Map<string, Array<{ location: string; timestamp: number; signature: number[] }>> = new Map();
  private readonly patternSimilarityThreshold = 0.75;
  private readonly patternDecayRate = 0.99; // Per hour
  private readonly regularizationFactor = 0.8; // Prevent overfitting to morphic patterns
  
  /**
   * Record an observation that might form or match a morphic pattern
   */
  recordObservation(location: string, signature: number[]): MorphicPattern | null {
    const now = Date.now();
    const signatureHash = this.hashSignature(signature);
    
    // Check for matching existing patterns
    for (const [id, pattern] of this.patterns) {
      if (this.calculateSimilarity(pattern.signature, signature) > this.patternSimilarityThreshold) {
        // Pattern resonance detected
        if (!pattern.locations.includes(location)) {
          pattern.locations.push(location);
          pattern.propagationSpeed = this.calculatePropagationSpeed(pattern, now);
        }
        pattern.strength = Math.min(1, pattern.strength + 0.1);
        pattern.isActive = true;
        return pattern;
      }
    }
    
    // Store observation for potential new pattern formation
    if (!this.observations.has(signatureHash)) {
      this.observations.set(signatureHash, []);
    }
    
    const obs = this.observations.get(signatureHash)!;
    obs.push({ location, timestamp: now, signature });
    
    // Check if we have enough observations across different locations to form a pattern
    const uniqueLocations = new Set(obs.map(o => o.location));
    if (uniqueLocations.size >= 3) {
      const newPattern = this.createPattern(signatureHash, obs);
      this.patterns.set(newPattern.id, newPattern);
      this.observations.delete(signatureHash);
      return newPattern;
    }
    
    return null;
  }
  
  /**
   * Calculate similarity between two signatures using cosine similarity
   */
  private calculateSimilarity(sig1: number[], sig2: number[]): number {
    const minLength = Math.min(sig1.length, sig2.length);
    if (minLength === 0) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < minLength; i++) {
      dotProduct += sig1[i] * sig2[i];
      norm1 += sig1[i] * sig1[i];
      norm2 += sig2[i] * sig2[i];
    }
    
    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator > 0 ? dotProduct / denominator : 0;
  }
  
  /**
   * Create a unique hash for a signature
   */
  private hashSignature(signature: number[]): string {
    // Quantize and hash
    const quantized = signature.map(v => Math.round(v * 10) / 10);
    return quantized.join(',');
  }
  
  /**
   * Calculate how fast a pattern is propagating
   */
  private calculatePropagationSpeed(pattern: MorphicPattern, now: number): number {
    const timeSinceFirst = now - pattern.firstObserved;
    if (timeSinceFirst === 0) return 0;
    
    // Locations per hour
    return (pattern.locations.length * 3600000) / timeSinceFirst;
  }
  
  /**
   * Create a new morphic pattern from observations
   */
  private createPattern(
    id: string, 
    observations: Array<{ location: string; timestamp: number; signature: number[] }>
  ): MorphicPattern {
    // Average the signatures
    const avgSignature = this.averageSignatures(observations.map(o => o.signature));
    
    return {
      id: `morphic_${id.substring(0, 8)}_${Date.now()}`,
      signature: avgSignature,
      firstObserved: Math.min(...observations.map(o => o.timestamp)),
      locations: [...new Set(observations.map(o => o.location))],
      propagationSpeed: 0,
      strength: 0.5,
      isActive: true,
    };
  }
  
  /**
   * Average multiple signatures
   */
  private averageSignatures(signatures: number[][]): number[] {
    if (signatures.length === 0) return [];
    
    const maxLength = Math.max(...signatures.map(s => s.length));
    const result: number[] = new Array(maxLength).fill(0);
    
    for (let i = 0; i < maxLength; i++) {
      let sum = 0;
      let count = 0;
      for (const sig of signatures) {
        if (i < sig.length) {
          sum += sig[i];
          count++;
        }
      }
      result[i] = count > 0 ? sum / count : 0;
    }
    
    return result;
  }
  
  /**
   * Detect resonances (patterns likely to appear in new locations)
   */
  detectResonances(targetLocation: string): FieldResonance[] {
    const resonances: FieldResonance[] = [];
    
    for (const [id, pattern] of this.patterns) {
      if (!pattern.isActive) continue;
      if (pattern.locations.includes(targetLocation)) continue;
      
      // Patterns with high strength and fast propagation are likely to resonate
      if (pattern.strength > 0.4 && pattern.locations.length >= 2) {
        const avgPropagationTime = pattern.propagationSpeed > 0 
          ? 3600000 / pattern.propagationSpeed 
          : 86400000; // Default 24 hours
        
        resonances.push({
          patternId: pattern.id,
          currentStrength: pattern.strength * this.regularizationFactor,
          propagatingTo: [targetLocation],
          expectedArrivalMs: avgPropagationTime,
          confidence: Math.min(0.8, pattern.strength * (pattern.locations.length / 10)),
        });
      }
    }
    
    return resonances.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }
  
  /**
   * Get the current state of the morphic field
   */
  getFieldState(): MorphicFieldState {
    this.decayPatterns();
    
    const activePatterns = Array.from(this.patterns.values()).filter(p => p.isActive);
    
    // Calculate field coherence (how aligned patterns are)
    let coherence = 0;
    if (activePatterns.length >= 2) {
      let totalSimilarity = 0;
      let comparisons = 0;
      
      for (let i = 0; i < activePatterns.length; i++) {
        for (let j = i + 1; j < activePatterns.length; j++) {
          totalSimilarity += this.calculateSimilarity(
            activePatterns[i].signature,
            activePatterns[j].signature
          );
          comparisons++;
        }
      }
      
      coherence = comparisons > 0 ? totalSimilarity / comparisons : 0;
    }
    
    const dominantPattern = activePatterns.length > 0
      ? activePatterns.reduce((a, b) => a.strength > b.strength ? a : b)
      : null;
    
    const resonances: FieldResonance[] = [];
    for (const pattern of activePatterns) {
      if (pattern.propagationSpeed > 0.5) {
        resonances.push({
          patternId: pattern.id,
          currentStrength: pattern.strength,
          propagatingTo: [], // Would need target location context
          expectedArrivalMs: 3600000 / pattern.propagationSpeed,
          confidence: pattern.strength * 0.8,
        });
      }
    }
    
    return {
      activePatterns,
      resonances,
      fieldCoherence: coherence,
      dominantPattern,
    };
  }
  
  /**
   * Decay inactive patterns over time
   */
  private decayPatterns(): void {
    const now = Date.now();
    
    for (const [id, pattern] of this.patterns) {
      const hoursSinceUpdate = (now - pattern.firstObserved) / 3600000;
      pattern.strength *= Math.pow(this.patternDecayRate, hoursSinceUpdate / 24);
      
      if (pattern.strength < 0.1) {
        pattern.isActive = false;
      }
      
      // Remove very old inactive patterns
      if (pattern.strength < 0.01 && hoursSinceUpdate > 168) { // 1 week
        this.patterns.delete(id);
      }
    }
  }
  
  /**
   * Get confidence modifier based on morphic field state
   */
  getConfidenceModifier(): number {
    const state = this.getFieldState();
    
    // Higher coherence = more confidence
    const coherenceBoost = 1 + (state.fieldCoherence * 0.15);
    
    // Active resonances boost confidence
    const resonanceBoost = state.resonances.length > 0 
      ? 1 + Math.min(0.1, state.resonances.length * 0.02)
      : 1;
    
    // Apply regularization to prevent overfitting
    return (coherenceBoost * resonanceBoost) * this.regularizationFactor;
  }
  
  /**
   * Record outcome for pattern accuracy tracking
   */
  recordOutcome(patternId: string, wasAccurate: boolean): void {
    const pattern = this.patterns.get(patternId);
    if (pattern) {
      if (wasAccurate) {
        pattern.strength = Math.min(1, pattern.strength * 1.05);
      } else {
        pattern.strength *= 0.9;
      }
    }
  }
}

export const morphicFieldAdapter = new MorphicFieldAdapter();
export type { MorphicPattern, FieldResonance, MorphicFieldState };
