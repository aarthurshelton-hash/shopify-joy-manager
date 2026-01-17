/**
 * Audio/Music Domain Adapter
 * Converts sound waves to En Pensent temporal signatures
 * 
 * Music and sound carry temporal patterns that resonate
 * with human emotion and market psychology.
 * This adapter extracts temporal patterns from:
 * - Frequency spectrum analysis
 * - Rhythm and tempo patterns
 * - Harmonic relationships
 * - Dynamic range
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

interface AudioData {
  fundamentalHz: number; // Fundamental frequency
  amplitude: number; // 0-1 normalized
  spectralCentroid: number; // "Brightness" of sound
  tempo: number; // BPM
  key: number; // Musical key (0-11 for C to B)
  mode: 'major' | 'minor' | 'neutral';
  timestamp: number;
}

class AudioDomainAdapter implements DomainAdapter<AudioData> {
  domain = 'audio' as const;
  name = 'Audio Pattern Analyzer';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 1000;
  
  // Musical frequency references
  private readonly A4 = 440; // Hz
  
  // Tempo classifications
  private readonly TEMPO = {
    largo: { min: 40, max: 60 },
    adagio: { min: 60, max: 80 },
    andante: { min: 80, max: 100 },
    moderato: { min: 100, max: 120 },
    allegro: { min: 120, max: 160 },
    presto: { min: 160, max: 200 },
  };

  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[AudioAdapter] Initialized - Audio pattern recognition active');
  }

  processRawData(data: AudioData): UniversalSignal {
    const { fundamentalHz, amplitude, spectralCentroid, tempo, key, mode, timestamp } = data;
    
    // Frequency as base oscillation
    const frequency = fundamentalHz;
    
    // Amplitude as intensity
    const intensity = amplitude;
    
    // Musical key affects phase (emotional resonance)
    const phase = (key / 12) * Math.PI * 2;
    
    // Extract harmonics from audio characteristics
    const harmonics = this.extractHarmonics(fundamentalHz, spectralCentroid, tempo, key, mode);
    
    const signal: UniversalSignal = {
      domain: 'audio',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [fundamentalHz, amplitude, spectralCentroid, tempo, key, mode === 'major' ? 1 : mode === 'minor' ? -1 : 0],
    };
    
    this.signalBuffer.push(signal);
    if (this.signalBuffer.length > this.BUFFER_SIZE) {
      this.signalBuffer.shift();
    }
    
    this.lastUpdate = timestamp;
    return signal;
  }

  extractSignature(signals: UniversalSignal[]): DomainSignature {
    if (signals.length === 0) {
      return this.getDefaultSignature();
    }

    const recentSignals = signals.slice(-100);
    
    // Calculate quadrant profile from audio characteristics
    const quadrantProfile = this.calculateQuadrantFromAudio(recentSignals);
    
    // Temporal flow from dynamic patterns
    const temporalFlow = this.calculateTemporalFlow(recentSignals);
    
    // Calculate advanced metrics
    const avgIntensity = recentSignals.reduce((sum, s) => sum + s.intensity, 0) / recentSignals.length;
    const intensityVariance = this.calculateVariance(recentSignals.map(s => s.intensity));
    const dominantFreq = this.findDominantFrequency(recentSignals);
    const harmonicRes = this.calculateHarmonicResonance(recentSignals);
    const musicalCoherence = this.calculateMusicalCoherence(recentSignals);
    
    return {
      domain: 'audio',
      quadrantProfile,
      temporalFlow,
      intensity: avgIntensity,
      momentum: this.calculateMomentum(recentSignals),
      volatility: Math.sqrt(intensityVariance),
      dominantFrequency: dominantFreq,
      harmonicResonance: harmonicRes,
      phaseAlignment: musicalCoherence,
      extractedAt: Date.now(),
    };
  }

  private extractHarmonics(fundamental: number, centroid: number, tempo: number, key: number, mode: 'major' | 'minor' | 'neutral'): number[] {
    // Create harmonic series from fundamental
    const modeMultiplier = mode === 'major' ? 1.2 : mode === 'minor' ? 0.8 : 1;
    const tempoNorm = tempo / 120;
    const keyNorm = key / 12;
    
    return [
      fundamental / 1000,
      (fundamental * 2) / 1000 * modeMultiplier,
      (fundamental * 3) / 1000,
      (fundamental * 4) / 1000 * modeMultiplier,
      centroid / 5000,
      tempoNorm,
      keyNorm,
      Math.sin(keyNorm * Math.PI * 2) * modeMultiplier,
    ];
  }

  private calculateQuadrantFromAudio(signals: UniversalSignal[]): DomainSignature['quadrantProfile'] {
    // Map audio characteristics to quadrants
    // High tempo = aggressive (energy)
    // Low spectral centroid = defensive (warm, grounded)
    // High amplitude variation = tactical (dynamic)
    // Strong harmonic coherence = strategic (structured)
    
    const avgTempo = signals.reduce((sum, s) => sum + s.rawData[3], 0) / signals.length;
    const avgCentroid = signals.reduce((sum, s) => sum + s.rawData[2], 0) / signals.length;
    const ampVariation = this.calculateVariance(signals.map(s => s.intensity));
    const modeSum = signals.reduce((sum, s) => sum + s.rawData[5], 0);
    
    // Normalize
    const tempoScore = Math.min((avgTempo - 60) / 140, 1); // 60-200 BPM
    const warmthScore = 1 - Math.min(avgCentroid / 5000, 1);
    const dynamicScore = Math.min(ampVariation * 4, 1);
    const structureScore = Math.abs(modeSum / signals.length);
    
    const total = tempoScore + warmthScore + dynamicScore + structureScore || 1;
    
    return {
      aggressive: tempoScore / total,
      defensive: warmthScore / total,
      tactical: dynamicScore / total,
      strategic: structureScore / total,
    };
  }

  private calculateTemporalFlow(signals: UniversalSignal[]): DomainSignature['temporalFlow'] {
    const len = signals.length;
    const third = Math.floor(len / 3);
    
    const earlyEnergy = signals.slice(0, third).reduce((sum, s) => sum + s.intensity * s.frequency, 0) / third || 0;
    const midEnergy = signals.slice(third, 2 * third).reduce((sum, s) => sum + s.intensity * s.frequency, 0) / third || 0;
    const lateEnergy = signals.slice(2 * third).reduce((sum, s) => sum + s.intensity * s.frequency, 0) / third || 0;
    
    const total = earlyEnergy + midEnergy + lateEnergy || 1;
    
    return {
      early: earlyEnergy / total,
      mid: midEnergy / total,
      late: lateEnergy / total,
    };
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  private calculateMusicalCoherence(signals: UniversalSignal[]): number {
    // Measure how consistent the musical key and mode are
    if (signals.length < 2) return 0.5;
    
    let coherenceSum = 0;
    for (let i = 1; i < signals.length; i++) {
      const keyDiff = Math.abs(signals[i].rawData[4] - signals[i - 1].rawData[4]);
      const modeDiff = Math.abs(signals[i].rawData[5] - signals[i - 1].rawData[5]);
      
      // Closer keys = more coherence
      const keyCoherence = 1 - (keyDiff / 6); // 6 semitones = max difference
      const modeCoherence = 1 - (modeDiff / 2);
      
      coherenceSum += (keyCoherence + modeCoherence) / 2;
    }
    
    return coherenceSum / (signals.length - 1);
  }

  private findDominantFrequency(signals: UniversalSignal[]): number {
    const freqBuckets = new Map<number, number>();
    
    signals.forEach(s => {
      // Bucket by octave
      const octave = Math.floor(Math.log2(s.frequency / 27.5));
      const bucket = 27.5 * Math.pow(2, octave);
      freqBuckets.set(bucket, (freqBuckets.get(bucket) || 0) + s.intensity);
    });
    
    let maxBucket = 440;
    let maxValue = 0;
    freqBuckets.forEach((value, bucket) => {
      if (value > maxValue) {
        maxValue = value;
        maxBucket = bucket;
      }
    });
    
    return maxBucket;
  }

  private calculateHarmonicResonance(signals: UniversalSignal[]): number {
    if (signals.length < 2) return 0;
    
    let resonanceSum = 0;
    for (let i = 1; i < signals.length; i++) {
      const h1 = signals[i].harmonics;
      const h2 = signals[i - 1].harmonics;
      
      let dotProduct = 0;
      let mag1 = 0;
      let mag2 = 0;
      
      for (let j = 0; j < h1.length; j++) {
        dotProduct += h1[j] * h2[j];
        mag1 += h1[j] * h1[j];
        mag2 += h2[j] * h2[j];
      }
      
      const denom = Math.sqrt(mag1) * Math.sqrt(mag2);
      const cosineSim = denom > 0 ? dotProduct / denom : 0;
      resonanceSum += (cosineSim + 1) / 2;
    }
    
    return resonanceSum / (signals.length - 1);
  }

  private calculateMomentum(signals: UniversalSignal[]): number {
    if (signals.length < 10) return 0;
    
    const recent = signals.slice(-10);
    const older = signals.slice(-20, -10);
    
    const recentEnergy = recent.reduce((sum, s) => sum + s.intensity * s.frequency, 0) / recent.length;
    const olderEnergy = older.length > 0 
      ? older.reduce((sum, s) => sum + s.intensity * s.frequency, 0) / older.length 
      : recentEnergy;
    
    return (recentEnergy - olderEnergy) / (olderEnergy || 1);
  }

  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'audio',
      quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
      temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0,
      dominantFrequency: 440,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now(),
    };
  }

  // Generate audio signal correlated with market mood
  generateMarketCorrelatedSignal(marketMomentum: number, marketVolatility: number): AudioData {
    // Market momentum affects musical mode and tempo
    const mode: 'major' | 'minor' | 'neutral' = 
      marketMomentum > 0.2 ? 'major' : 
      marketMomentum < -0.2 ? 'minor' : 'neutral';
    
    // Volatility affects tempo (higher volatility = faster tempo)
    const tempo = 80 + (marketVolatility * 80);
    
    // Momentum affects fundamental frequency (bullish = higher pitch)
    const fundamentalHz = 220 + (marketMomentum * 220);
    
    // Volatility affects amplitude (uncertainty = louder)
    const amplitude = 0.4 + (marketVolatility * 0.5);
    
    // Spectral centroid rises with excitement
    const spectralCentroid = 2000 + (marketVolatility * 2000) + (Math.abs(marketMomentum) * 500);
    
    // Key selection based on momentum direction
    // C major (0) for positive, A minor (9) for negative
    const key = marketMomentum >= 0 ? 0 : 9;
    
    return {
      fundamentalHz: Math.max(55, Math.min(880, fundamentalHz)),
      amplitude: Math.max(0, Math.min(1, amplitude)),
      spectralCentroid: Math.max(500, Math.min(8000, spectralCentroid)),
      tempo: Math.max(40, Math.min(200, tempo)),
      key,
      mode,
      timestamp: Date.now(),
    };
  }
}

export const audioAdapter = new AudioDomainAdapter();
export type { AudioData };
