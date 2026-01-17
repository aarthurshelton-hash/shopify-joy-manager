/**
 * Biological/Health Domain Adapter
 * Converts biological rhythms to En Pensent temporal signatures
 * 
 * Biological systems exhibit universal patterns that reflect
 * the same temporal dynamics found in markets and nature.
 * This adapter extracts temporal patterns from:
 * - Heart rate variability (HRV)
 * - Circadian rhythms
 * - Hormonal cycles
 * - Neural oscillations
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

interface BioData {
  heartRate: number; // BPM
  hrvMs: number; // Heart rate variability in ms
  cortisol: number; // 0-1 normalized stress hormone
  melatonin: number; // 0-1 normalized sleep hormone
  brainwaveHz: number; // Dominant brainwave frequency
  timestamp: number;
}

type BrainwaveState = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

class BioDomainAdapter implements DomainAdapter<BioData> {
  domain = 'bio' as const;
  name = 'Biological Rhythm Analyzer';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 1000;
  
  // Brainwave frequency ranges
  private readonly BRAINWAVES: Record<BrainwaveState, { min: number; max: number }> = {
    delta: { min: 0.5, max: 4 },   // Deep sleep
    theta: { min: 4, max: 8 },     // Meditation, drowsy
    alpha: { min: 8, max: 13 },    // Relaxed, calm
    beta: { min: 13, max: 30 },    // Alert, focused
    gamma: { min: 30, max: 100 },  // Peak performance
  };

  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[BioAdapter] Initialized - Biological pattern recognition active');
  }

  processRawData(data: BioData): UniversalSignal {
    const { heartRate, hrvMs, cortisol, melatonin, brainwaveHz, timestamp } = data;
    
    // Heart rate as base frequency (normalized)
    const frequency = heartRate / 60; // Hz
    
    // HRV indicates system health/adaptability
    const intensity = Math.min(hrvMs / 100, 1);
    
    // Stress-relaxation balance affects phase
    const stressBalance = cortisol - melatonin;
    const phase = (stressBalance + 1) * Math.PI;
    
    // Extract harmonics from bio signals
    const harmonics = this.extractHarmonics(heartRate, hrvMs, cortisol, melatonin, brainwaveHz);
    
    const signal: UniversalSignal = {
      domain: 'bio',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [heartRate, hrvMs, cortisol, melatonin, brainwaveHz],
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
    
    // Calculate quadrant profile from biological state
    const quadrantProfile = this.calculateQuadrantFromBio(recentSignals);
    
    // Temporal flow from circadian patterns
    const temporalFlow = this.calculateTemporalFlow(recentSignals);
    
    // Calculate advanced metrics
    const avgIntensity = recentSignals.reduce((sum, s) => sum + s.intensity, 0) / recentSignals.length;
    const hrvVariance = this.calculateVariance(recentSignals.map(s => s.rawData[1]));
    const dominantFreq = this.findDominantFrequency(recentSignals);
    const harmonicRes = this.calculateHarmonicResonance(recentSignals);
    const coherence = this.calculateHeartBrainCoherence(recentSignals);
    
    return {
      domain: 'bio',
      quadrantProfile,
      temporalFlow,
      intensity: avgIntensity,
      momentum: this.calculateMomentum(recentSignals),
      volatility: Math.sqrt(hrvVariance) / 50, // Normalize HRV variance
      dominantFrequency: dominantFreq,
      harmonicResonance: harmonicRes,
      phaseAlignment: coherence,
      extractedAt: Date.now(),
    };
  }

  private extractHarmonics(hr: number, hrv: number, cortisol: number, melatonin: number, brainwave: number): number[] {
    const hrNorm = hr / 100;
    const hrvNorm = Math.min(hrv / 100, 1);
    const brainNorm = brainwave / 50;
    
    return [
      hrNorm,
      hrvNorm,
      cortisol,
      melatonin,
      brainNorm,
      Math.sin(hrNorm * Math.PI) * hrvNorm,
      Math.cos(brainNorm * Math.PI) * cortisol,
      (1 - cortisol) * melatonin,
    ];
  }

  private getBrainwaveState(hz: number): BrainwaveState {
    if (hz < this.BRAINWAVES.delta.max) return 'delta';
    if (hz < this.BRAINWAVES.theta.max) return 'theta';
    if (hz < this.BRAINWAVES.alpha.max) return 'alpha';
    if (hz < this.BRAINWAVES.beta.max) return 'beta';
    return 'gamma';
  }

  private calculateQuadrantFromBio(signals: UniversalSignal[]): DomainSignature['quadrantProfile'] {
    // Map biological state to quadrants
    // High heart rate = aggressive (fight response)
    // High HRV = defensive (adaptability)
    // High cortisol = tactical (stress response)
    // High brainwave coherence = strategic (peak performance)
    
    const avgHR = signals.reduce((sum, s) => sum + s.rawData[0], 0) / signals.length;
    const avgHRV = signals.reduce((sum, s) => sum + s.rawData[1], 0) / signals.length;
    const avgCortisol = signals.reduce((sum, s) => sum + s.rawData[2], 0) / signals.length;
    const avgBrainwave = signals.reduce((sum, s) => sum + s.rawData[4], 0) / signals.length;
    
    // Normalize
    const hrScore = Math.min((avgHR - 60) / 60, 1); // 60-120 BPM range
    const hrvScore = Math.min(avgHRV / 80, 1);
    const stressScore = avgCortisol;
    const focusScore = Math.min(avgBrainwave / 30, 1); // Higher beta/gamma = focus
    
    const total = hrScore + hrvScore + stressScore + focusScore || 1;
    
    return {
      aggressive: hrScore / total,
      defensive: hrvScore / total,
      tactical: stressScore / total,
      strategic: focusScore / total,
    };
  }

  private calculateTemporalFlow(signals: UniversalSignal[]): DomainSignature['temporalFlow'] {
    const len = signals.length;
    const third = Math.floor(len / 3);
    
    const earlyHRV = signals.slice(0, third).reduce((sum, s) => sum + s.rawData[1], 0) / third || 0;
    const midHRV = signals.slice(third, 2 * third).reduce((sum, s) => sum + s.rawData[1], 0) / third || 0;
    const lateHRV = signals.slice(2 * third).reduce((sum, s) => sum + s.rawData[1], 0) / third || 0;
    
    const total = earlyHRV + midHRV + lateHRV || 1;
    
    return {
      early: earlyHRV / total,
      mid: midHRV / total,
      late: lateHRV / total,
    };
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  private calculateHeartBrainCoherence(signals: UniversalSignal[]): number {
    // Measure correlation between heart rate and brainwave patterns
    if (signals.length < 10) return 0.5;
    
    const hrValues = signals.map(s => s.rawData[0]);
    const brainValues = signals.map(s => s.rawData[4]);
    
    const hrMean = hrValues.reduce((a, b) => a + b, 0) / hrValues.length;
    const brainMean = brainValues.reduce((a, b) => a + b, 0) / brainValues.length;
    
    let numerator = 0;
    let hrDenom = 0;
    let brainDenom = 0;
    
    for (let i = 0; i < signals.length; i++) {
      const hrDiff = hrValues[i] - hrMean;
      const brainDiff = brainValues[i] - brainMean;
      numerator += hrDiff * brainDiff;
      hrDenom += hrDiff * hrDiff;
      brainDenom += brainDiff * brainDiff;
    }
    
    const denom = Math.sqrt(hrDenom * brainDenom);
    const correlation = denom > 0 ? numerator / denom : 0;
    
    return (correlation + 1) / 2; // Normalize to 0-1
  }

  private findDominantFrequency(signals: UniversalSignal[]): number {
    const freqBuckets = new Map<number, number>();
    
    signals.forEach(s => {
      const bucket = Math.round(s.frequency * 10) / 10;
      freqBuckets.set(bucket, (freqBuckets.get(bucket) || 0) + s.intensity);
    });
    
    let maxBucket = 1;
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
    
    const recentAvg = recent.reduce((sum, s) => sum + s.intensity, 0) / recent.length;
    const olderAvg = older.length > 0 
      ? older.reduce((sum, s) => sum + s.intensity, 0) / older.length 
      : recentAvg;
    
    return (recentAvg - olderAvg) / (olderAvg || 1);
  }

  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'bio',
      quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
      temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0,
      dominantFrequency: 1.2,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now(),
    };
  }

  // Generate bio signal correlated with market stress
  generateMarketCorrelatedSignal(marketVolatility: number, marketDirection: number): BioData {
    // Market volatility increases stress response
    const baseHR = 70;
    const heartRate = baseHR + (marketVolatility * 40); // Higher volatility = higher HR
    
    // HRV decreases under stress
    const hrvMs = 80 - (marketVolatility * 60);
    
    // Cortisol rises with market uncertainty
    const cortisol = 0.3 + (marketVolatility * 0.6);
    
    // Melatonin inversely related to stress
    const melatonin = Math.max(0.1, 0.7 - (marketVolatility * 0.5));
    
    // Brainwave shifts with market direction
    // Positive market = alpha/beta (calm focus)
    // Negative market = beta/gamma (stress/hyper-focus)
    const brainwaveHz = 12 + (marketVolatility * 20) + (marketDirection < 0 ? 5 : -3);
    
    return {
      heartRate: Math.max(50, Math.min(150, heartRate)),
      hrvMs: Math.max(10, Math.min(100, hrvMs)),
      cortisol: Math.max(0, Math.min(1, cortisol)),
      melatonin: Math.max(0, Math.min(1, melatonin)),
      brainwaveHz: Math.max(0.5, Math.min(50, brainwaveHz)),
      timestamp: Date.now(),
    };
  }
}

export const bioAdapter = new BioDomainAdapter();
export type { BioData };
