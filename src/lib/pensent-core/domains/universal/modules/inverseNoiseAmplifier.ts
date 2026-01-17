/**
 * Inverse Noise Amplifier
 * 
 * Counter-intuitive module: Instead of filtering noise, it analyzes noise itself.
 * Noise patterns can predict order (calm before storm, storm before calm).
 * High entropy periods often precede directional moves.
 */

interface NoiseProfile {
  level: number; // 0-1, current noise level
  trend: 'increasing' | 'decreasing' | 'stable';
  frequency: number; // Dominant noise frequency
  structure: 'random' | 'patterned' | 'chaotic';
  signalToNoise: number;
}

interface NoiseAnomaly {
  type: 'noise_spike' | 'noise_collapse' | 'frequency_shift' | 'structure_change';
  magnitude: number;
  timestamp: number;
  predictiveValue: number;
}

interface InverseNoiseState {
  currentProfile: NoiseProfile;
  recentAnomalies: NoiseAnomaly[];
  predictionFromNoise: {
    direction: 'up' | 'down' | 'neutral';
    confidence: number;
    reasoning: string;
  };
  noiseOrderCycle: 'order_to_chaos' | 'chaos_to_order' | 'stable_chaos' | 'stable_order';
}

class InverseNoiseAmplifier {
  private noiseHistory: NoiseProfile[] = [];
  private anomalyHistory: NoiseAnomaly[] = [];
  private outcomeHistory: Array<{ noiseLevel: number; predictedDirection: string; wasCorrect: boolean }> = [];
  private readonly maxHistory = 500;
  private readonly regularization = 0.85;
  
  /**
   * Analyze noise characteristics from price data
   */
  analyzeNoise(priceData: number[], volumeData: number[]): NoiseProfile {
    const level = this.calculateNoiseLevel(priceData);
    const trend = this.calculateNoiseTrend();
    const frequency = this.calculateDominantFrequency(priceData);
    const structure = this.classifyNoiseStructure(priceData);
    const signalToNoise = this.calculateSNR(priceData);
    
    const profile: NoiseProfile = { level, trend, frequency, structure, signalToNoise };
    
    this.noiseHistory.push(profile);
    if (this.noiseHistory.length > this.maxHistory) {
      this.noiseHistory.shift();
    }
    
    // Detect anomalies
    this.detectAnomalies(profile);
    
    return profile;
  }
  
  /**
   * Calculate noise level using high-frequency variations
   */
  private calculateNoiseLevel(data: number[]): number {
    if (data.length < 3) return 0.5;
    
    // Calculate second-order differences (acceleration of price)
    const secondDiffs: number[] = [];
    for (let i = 2; i < data.length; i++) {
      const d1 = data[i - 1] - data[i - 2];
      const d2 = data[i] - data[i - 1];
      secondDiffs.push(d2 - d1);
    }
    
    // Noise is high when second derivatives are erratic
    const mean = secondDiffs.reduce((a, b) => a + b, 0) / secondDiffs.length;
    const variance = secondDiffs.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / secondDiffs.length;
    const normalizedVariance = Math.sqrt(variance) / (Math.abs(mean) + 0.001);
    
    return Math.min(1, normalizedVariance);
  }
  
  /**
   * Calculate noise trend from history
   */
  private calculateNoiseTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.noiseHistory.length < 10) return 'stable';
    
    const recent = this.noiseHistory.slice(-10);
    const older = this.noiseHistory.slice(-20, -10);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, p) => sum + p.level, 0) / recent.length;
    const olderAvg = older.reduce((sum, p) => sum + p.level, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    if (diff > 0.1) return 'increasing';
    if (diff < -0.1) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Calculate dominant frequency in the noise using autocorrelation
   */
  private calculateDominantFrequency(data: number[]): number {
    if (data.length < 20) return 0;
    
    // Detrend the data
    const trend = this.linearDetrend(data);
    const detrended = data.map((v, i) => v - trend[i]);
    
    // Simple autocorrelation to find periodicity
    let maxCorr = 0;
    let dominantPeriod = 0;
    
    for (let lag = 2; lag < Math.min(50, data.length / 2); lag++) {
      let correlation = 0;
      for (let i = 0; i < data.length - lag; i++) {
        correlation += detrended[i] * detrended[i + lag];
      }
      correlation /= (data.length - lag);
      
      if (correlation > maxCorr) {
        maxCorr = correlation;
        dominantPeriod = lag;
      }
    }
    
    // Convert period to frequency (normalized 0-1)
    return dominantPeriod > 0 ? 1 / dominantPeriod : 0;
  }
  
  /**
   * Linear detrending
   */
  private linearDetrend(data: number[]): number[] {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return data.map((_, i) => intercept + slope * i);
  }
  
  /**
   * Classify the structure of noise
   */
  private classifyNoiseStructure(data: number[]): 'random' | 'patterned' | 'chaotic' {
    if (data.length < 10) return 'random';
    
    const noiseLevel = this.calculateNoiseLevel(data);
    const frequency = this.calculateDominantFrequency(data);
    
    // Chaotic: high noise, no clear frequency
    if (noiseLevel > 0.7 && frequency < 0.1) return 'chaotic';
    
    // Patterned: moderate noise, clear frequency
    if (frequency > 0.2 && noiseLevel < 0.5) return 'patterned';
    
    // Random: low-medium noise, some frequency
    return 'random';
  }
  
  /**
   * Calculate signal-to-noise ratio
   */
  private calculateSNR(data: number[]): number {
    if (data.length < 5) return 1;
    
    // Signal: overall trend
    const first = data[0];
    const last = data[data.length - 1];
    const signalPower = Math.pow(last - first, 2);
    
    // Noise: sum of squared deviations from trend
    const trend = this.linearDetrend(data);
    const noisePower = data.reduce((sum, v, i) => sum + Math.pow(v - trend[i], 2), 0) / data.length;
    
    if (noisePower === 0) return 10; // Very clean signal
    return Math.min(10, signalPower / noisePower);
  }
  
  /**
   * Detect noise anomalies that might predict order
   */
  private detectAnomalies(current: NoiseProfile): void {
    if (this.noiseHistory.length < 5) return;
    
    const recent = this.noiseHistory.slice(-5, -1);
    const avgLevel = recent.reduce((sum, p) => sum + p.level, 0) / recent.length;
    const avgFreq = recent.reduce((sum, p) => sum + p.frequency, 0) / recent.length;
    
    // Noise spike
    if (current.level > avgLevel * 1.5 && current.level > 0.6) {
      this.anomalyHistory.push({
        type: 'noise_spike',
        magnitude: current.level - avgLevel,
        timestamp: Date.now(),
        predictiveValue: 0.7, // Spikes often precede reversals
      });
    }
    
    // Noise collapse
    if (current.level < avgLevel * 0.5 && current.level < 0.3) {
      this.anomalyHistory.push({
        type: 'noise_collapse',
        magnitude: avgLevel - current.level,
        timestamp: Date.now(),
        predictiveValue: 0.8, // Calm before storm
      });
    }
    
    // Frequency shift
    if (Math.abs(current.frequency - avgFreq) > 0.2) {
      this.anomalyHistory.push({
        type: 'frequency_shift',
        magnitude: Math.abs(current.frequency - avgFreq),
        timestamp: Date.now(),
        predictiveValue: 0.6,
      });
    }
    
    // Structure change
    const recentStructures = recent.map(p => p.structure);
    const mostCommon = this.mode(recentStructures);
    if (current.structure !== mostCommon) {
      this.anomalyHistory.push({
        type: 'structure_change',
        magnitude: 0.5,
        timestamp: Date.now(),
        predictiveValue: 0.65,
      });
    }
    
    // Prune old anomalies
    const hourAgo = Date.now() - 3600000;
    this.anomalyHistory = this.anomalyHistory.filter(a => a.timestamp > hourAgo);
  }
  
  /**
   * Get mode of an array
   */
  private mode<T>(arr: T[]): T {
    const counts = new Map<T, number>();
    for (const item of arr) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
    let maxCount = 0;
    let modeValue = arr[0];
    for (const [value, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        modeValue = value;
      }
    }
    return modeValue;
  }
  
  /**
   * Get full inverse noise analysis
   */
  getInverseNoiseState(priceData: number[], volumeData: number[]): InverseNoiseState {
    const currentProfile = this.analyzeNoise(priceData, volumeData);
    const recentAnomalies = this.anomalyHistory.slice(-10);
    
    // Determine noise-order cycle
    let noiseOrderCycle: InverseNoiseState['noiseOrderCycle'] = 'stable_order';
    if (currentProfile.level > 0.6 && currentProfile.trend === 'increasing') {
      noiseOrderCycle = 'order_to_chaos';
    } else if (currentProfile.level > 0.6 && currentProfile.trend === 'stable') {
      noiseOrderCycle = 'stable_chaos';
    } else if (currentProfile.level < 0.4 && currentProfile.trend === 'decreasing') {
      noiseOrderCycle = 'chaos_to_order';
    }
    
    // Generate prediction from noise analysis
    const prediction = this.predictFromNoise(currentProfile, recentAnomalies);
    
    return {
      currentProfile,
      recentAnomalies,
      predictionFromNoise: {
        ...prediction,
        confidence: prediction.confidence * this.regularization,
      },
      noiseOrderCycle,
    };
  }
  
  /**
   * Generate prediction based on noise patterns
   */
  private predictFromNoise(
    profile: NoiseProfile,
    anomalies: NoiseAnomaly[]
  ): { direction: 'up' | 'down' | 'neutral'; confidence: number; reasoning: string } {
    // Key insight: noise collapse often precedes big moves
    const noiseCollapse = anomalies.find(a => a.type === 'noise_collapse');
    if (noiseCollapse && noiseCollapse.timestamp > Date.now() - 3600000) {
      return {
        direction: 'neutral', // Don't know direction, but expect big move
        confidence: 0.7,
        reasoning: 'Noise collapse detected - calm before storm pattern',
      };
    }
    
    // Noise spike often precedes reversal
    const noiseSpike = anomalies.find(a => a.type === 'noise_spike');
    if (noiseSpike && noiseSpike.timestamp > Date.now() - 1800000) {
      // Check current structure for reversal direction hint
      if (profile.structure === 'chaotic') {
        return {
          direction: 'neutral',
          confidence: 0.5,
          reasoning: 'Noise spike in chaos - reversal likely but direction unclear',
        };
      }
    }
    
    // Structure change predicts trend change
    const structureChange = anomalies.find(a => a.type === 'structure_change');
    if (structureChange) {
      if (profile.structure === 'patterned') {
        return {
          direction: 'up', // Patterns emerging often bullish
          confidence: 0.55,
          reasoning: 'Noise structure becoming ordered - trend formation likely',
        };
      }
    }
    
    // Default: high noise = uncertain, low noise = continue trend
    if (profile.level < 0.3 && profile.signalToNoise > 2) {
      return {
        direction: 'up', // Low noise + high SNR = trend continuation
        confidence: 0.5,
        reasoning: 'Low noise environment - trend likely to continue',
      };
    }
    
    return {
      direction: 'neutral',
      confidence: 0.4,
      reasoning: 'No clear signal from noise analysis',
    };
  }
  
  /**
   * Record outcome for learning
   */
  recordOutcome(noiseLevel: number, predictedDirection: string, actualDirection: string): void {
    this.outcomeHistory.push({
      noiseLevel,
      predictedDirection,
      wasCorrect: predictedDirection === actualDirection,
    });
    
    if (this.outcomeHistory.length > this.maxHistory) {
      this.outcomeHistory.shift();
    }
  }
  
  /**
   * Get accuracy statistics
   */
  getAccuracyStats(): { overall: number; byNoiseLevel: Record<string, number> } {
    if (this.outcomeHistory.length < 10) {
      return { overall: 0.5, byNoiseLevel: { low: 0.5, medium: 0.5, high: 0.5 } };
    }
    
    const correct = this.outcomeHistory.filter(o => o.wasCorrect).length;
    
    const byLevel: Record<string, { correct: number; total: number }> = {
      low: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      high: { correct: 0, total: 0 },
    };
    
    for (const outcome of this.outcomeHistory) {
      const level = outcome.noiseLevel < 0.33 ? 'low' : outcome.noiseLevel < 0.66 ? 'medium' : 'high';
      byLevel[level].total++;
      if (outcome.wasCorrect) byLevel[level].correct++;
    }
    
    return {
      overall: correct / this.outcomeHistory.length,
      byNoiseLevel: {
        low: byLevel.low.total > 0 ? byLevel.low.correct / byLevel.low.total : 0.5,
        medium: byLevel.medium.total > 0 ? byLevel.medium.correct / byLevel.medium.total : 0.5,
        high: byLevel.high.total > 0 ? byLevel.high.correct / byLevel.high.total : 0.5,
      },
    };
  }
}

export const inverseNoiseAmplifier = new InverseNoiseAmplifier();
export type { NoiseProfile, NoiseAnomaly, InverseNoiseState };
