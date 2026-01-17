/**
 * Fractal Time Compression
 * 
 * Detects self-similar patterns at different timescales (minutes, hours, days, weeks).
 * Markets are fractal - patterns that appear on 5-minute charts often mirror
 * patterns on daily charts, just compressed/expanded in time.
 */

interface FractalPattern {
  id: string;
  signature: number[];
  timescale: 'minute' | 'hour' | 'day' | 'week';
  startIndex: number;
  endIndex: number;
  similarity: number;
  predictedContinuation: number[];
}

interface TimescalePattern {
  timescale: 'minute' | 'hour' | 'day' | 'week';
  patterns: FractalPattern[];
  dominantPattern: FractalPattern | null;
  coherence: number; // How consistent patterns are within this timescale
}

interface FractalState {
  timescalePatterns: TimescalePattern[];
  crossTimescaleCoherence: number;
  activeFractals: FractalPattern[];
  predictionConfidence: number;
  suggestedDirection: 'up' | 'down' | 'neutral';
}

class FractalTimeCompressor {
  private patternLibrary: Map<string, FractalPattern[]> = new Map();
  private readonly minPatternLength = 5;
  private readonly similarityThreshold = 0.7;
  private readonly regularizationFactor = 0.9;
  private outcomeHistory: Array<{ patternId: string; wasCorrect: boolean }> = [];
  
  /**
   * Analyze data at multiple timescales to find fractal patterns
   */
  analyzeFractals(
    minuteData: number[],
    hourData: number[],
    dayData: number[],
    weekData: number[]
  ): FractalState {
    const timescalePatterns: TimescalePattern[] = [
      this.analyzeTimescale(minuteData, 'minute'),
      this.analyzeTimescale(hourData, 'hour'),
      this.analyzeTimescale(dayData, 'day'),
      this.analyzeTimescale(weekData, 'week'),
    ];
    
    // Find cross-timescale similarities
    const activeFractals = this.findCrossTimescalePatterns(timescalePatterns);
    
    // Calculate cross-timescale coherence
    const crossTimescaleCoherence = this.calculateCrossTimescaleCoherence(timescalePatterns);
    
    // Generate prediction based on fractal alignment
    const prediction = this.generatePrediction(activeFractals, crossTimescaleCoherence);
    
    return {
      timescalePatterns,
      crossTimescaleCoherence,
      activeFractals,
      predictionConfidence: prediction.confidence * this.regularizationFactor,
      suggestedDirection: prediction.direction,
    };
  }
  
  /**
   * Analyze patterns within a single timescale
   */
  private analyzeTimescale(data: number[], timescale: 'minute' | 'hour' | 'day' | 'week'): TimescalePattern {
    if (data.length < this.minPatternLength * 2) {
      return { timescale, patterns: [], dominantPattern: null, coherence: 0 };
    }
    
    const patterns: FractalPattern[] = [];
    const normalized = this.normalizeData(data);
    
    // Look for repeating patterns using sliding window
    for (let windowSize = this.minPatternLength; windowSize <= Math.min(20, data.length / 2); windowSize++) {
      const recentWindow = normalized.slice(-windowSize);
      
      // Search for similar patterns in history
      for (let i = 0; i < normalized.length - windowSize * 2; i++) {
        const historicalWindow = normalized.slice(i, i + windowSize);
        const similarity = this.calculateSimilarity(recentWindow, historicalWindow);
        
        if (similarity > this.similarityThreshold) {
          // Found a matching pattern - what came after?
          const continuation = normalized.slice(i + windowSize, i + windowSize * 2);
          
          patterns.push({
            id: `${timescale}_${i}_${windowSize}`,
            signature: historicalWindow,
            timescale,
            startIndex: i,
            endIndex: i + windowSize,
            similarity,
            predictedContinuation: continuation,
          });
        }
      }
    }
    
    // Find dominant pattern (highest similarity with most occurrences)
    const patternGroups = this.groupSimilarPatterns(patterns);
    let dominantPattern: FractalPattern | null = null;
    let maxScore = 0;
    
    for (const group of patternGroups) {
      const avgSimilarity = group.reduce((sum, p) => sum + p.similarity, 0) / group.length;
      const score = avgSimilarity * Math.sqrt(group.length);
      if (score > maxScore) {
        maxScore = score;
        dominantPattern = group[0];
      }
    }
    
    // Calculate pattern coherence within timescale
    const coherence = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.similarity, 0) / patterns.length
      : 0;
    
    return { timescale, patterns, dominantPattern, coherence };
  }
  
  /**
   * Normalize data to -1 to 1 range for comparison
   */
  private normalizeData(data: number[]): number[] {
    if (data.length === 0) return [];
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    if (range === 0) return data.map(() => 0);
    return data.map(v => ((v - min) / range) * 2 - 1);
  }
  
  /**
   * Calculate similarity between two patterns using DTW-inspired approach
   */
  private calculateSimilarity(pattern1: number[], pattern2: number[]): number {
    if (pattern1.length === 0 || pattern2.length === 0) return 0;
    
    // Simple correlation coefficient
    const n = Math.min(pattern1.length, pattern2.length);
    let sumXY = 0, sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumXY += pattern1[i] * pattern2[i];
      sumX += pattern1[i];
      sumY += pattern2[i];
      sumX2 += pattern1[i] * pattern1[i];
      sumY2 += pattern2[i] * pattern2[i];
    }
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    if (denominator === 0) return 0;
    
    // Map correlation (-1 to 1) to similarity (0 to 1)
    return (numerator / denominator + 1) / 2;
  }
  
  /**
   * Group similar patterns together
   */
  private groupSimilarPatterns(patterns: FractalPattern[]): FractalPattern[][] {
    const groups: FractalPattern[][] = [];
    const used = new Set<number>();
    
    for (let i = 0; i < patterns.length; i++) {
      if (used.has(i)) continue;
      
      const group = [patterns[i]];
      used.add(i);
      
      for (let j = i + 1; j < patterns.length; j++) {
        if (used.has(j)) continue;
        
        const sim = this.calculateSimilarity(patterns[i].signature, patterns[j].signature);
        if (sim > 0.8) {
          group.push(patterns[j]);
          used.add(j);
        }
      }
      
      groups.push(group);
    }
    
    return groups;
  }
  
  /**
   * Find patterns that appear across multiple timescales
   */
  private findCrossTimescalePatterns(timescalePatterns: TimescalePattern[]): FractalPattern[] {
    const crossTimescalePatterns: FractalPattern[] = [];
    
    // Compare dominant patterns across timescales
    const dominants = timescalePatterns
      .filter(tp => tp.dominantPattern !== null)
      .map(tp => tp.dominantPattern!);
    
    for (let i = 0; i < dominants.length; i++) {
      for (let j = i + 1; j < dominants.length; j++) {
        // Resample to same length for comparison
        const resampled1 = this.resample(dominants[i].signature, 20);
        const resampled2 = this.resample(dominants[j].signature, 20);
        
        const similarity = this.calculateSimilarity(resampled1, resampled2);
        
        if (similarity > this.similarityThreshold) {
          // Found a fractal! Same pattern at different timescales
          crossTimescalePatterns.push({
            ...dominants[i],
            similarity,
            id: `fractal_${dominants[i].timescale}_${dominants[j].timescale}`,
          });
        }
      }
    }
    
    return crossTimescalePatterns;
  }
  
  /**
   * Resample pattern to target length
   */
  private resample(data: number[], targetLength: number): number[] {
    if (data.length === targetLength) return data;
    if (data.length === 0) return new Array(targetLength).fill(0);
    
    const result: number[] = [];
    const ratio = (data.length - 1) / (targetLength - 1);
    
    for (let i = 0; i < targetLength; i++) {
      const srcIndex = i * ratio;
      const lower = Math.floor(srcIndex);
      const upper = Math.min(lower + 1, data.length - 1);
      const fraction = srcIndex - lower;
      
      result.push(data[lower] * (1 - fraction) + data[upper] * fraction);
    }
    
    return result;
  }
  
  /**
   * Calculate coherence across timescales
   */
  private calculateCrossTimescaleCoherence(timescalePatterns: TimescalePattern[]): number {
    const coherences = timescalePatterns.map(tp => tp.coherence).filter(c => c > 0);
    if (coherences.length === 0) return 0;
    
    // Average coherence across timescales
    const avgCoherence = coherences.reduce((a, b) => a + b, 0) / coherences.length;
    
    // Bonus for having patterns at multiple timescales
    const timescaleBonus = coherences.length / 4;
    
    return Math.min(1, avgCoherence * (1 + timescaleBonus * 0.2));
  }
  
  /**
   * Generate prediction based on fractal patterns
   */
  private generatePrediction(
    activeFractals: FractalPattern[],
    coherence: number
  ): { direction: 'up' | 'down' | 'neutral'; confidence: number } {
    if (activeFractals.length === 0 || coherence < 0.3) {
      return { direction: 'neutral', confidence: 0.3 };
    }
    
    // Average predicted continuation direction
    let upVotes = 0;
    let downVotes = 0;
    
    for (const fractal of activeFractals) {
      if (fractal.predictedContinuation.length > 0) {
        const trend = this.calculateTrend(fractal.predictedContinuation);
        if (trend > 0.05) upVotes += fractal.similarity;
        else if (trend < -0.05) downVotes += fractal.similarity;
      }
    }
    
    const total = upVotes + downVotes;
    if (total < 0.1) {
      return { direction: 'neutral', confidence: 0.3 };
    }
    
    const confidence = Math.min(0.85, coherence * (Math.abs(upVotes - downVotes) / total));
    
    return {
      direction: upVotes > downVotes ? 'up' : 'down',
      confidence,
    };
  }
  
  /**
   * Calculate trend from data points
   */
  private calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;
    
    const first = data.slice(0, Math.ceil(data.length / 2));
    const second = data.slice(Math.ceil(data.length / 2));
    
    const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
    const secondAvg = second.reduce((a, b) => a + b, 0) / second.length;
    
    return secondAvg - firstAvg;
  }
  
  /**
   * Record outcome for learning
   */
  recordOutcome(patternId: string, wasCorrect: boolean): void {
    this.outcomeHistory.push({ patternId, wasCorrect });
    if (this.outcomeHistory.length > 500) {
      this.outcomeHistory.shift();
    }
  }
  
  /**
   * Get overall accuracy
   */
  getAccuracy(): number {
    if (this.outcomeHistory.length < 10) return 0.5;
    const correct = this.outcomeHistory.filter(o => o.wasCorrect).length;
    return correct / this.outcomeHistory.length;
  }
  
  /**
   * Get confidence modifier based on fractal coherence
   */
  getConfidenceModifier(coherence: number): number {
    const baseModifier = 0.9 + coherence * 0.2;
    const accuracyModifier = 0.8 + this.getAccuracy() * 0.4;
    return baseModifier * accuracyModifier * this.regularizationFactor;
  }
}

export const fractalTimeCompressor = new FractalTimeCompressor();
export type { FractalPattern, TimescalePattern, FractalState };
