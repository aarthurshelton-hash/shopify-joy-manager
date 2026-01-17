/**
 * Light/Photonic Domain Adapter
 * Converts photonic signals to En Pensent temporal signatures
 * 
 * Light carries information at the fundamental level of reality.
 * This adapter extracts temporal patterns from:
 * - Electromagnetic spectrum variations
 * - Photon intensity fluctuations
 * - Wavelength harmonics
 * - Phase relationships
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

interface PhotonicData {
  wavelength: number; // nanometers
  intensity: number; // 0-1
  phase: number; // radians
  polarization: number; // degrees
  timestamp: number;
}

class LightDomainAdapter implements DomainAdapter<PhotonicData> {
  domain = 'light' as const;
  name = 'Photonic Pattern Analyzer';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 1000;
  
  // Visible light spectrum boundaries
  private readonly SPECTRUM = {
    violet: { min: 380, max: 450 },
    blue: { min: 450, max: 495 },
    green: { min: 495, max: 570 },
    yellow: { min: 570, max: 590 },
    orange: { min: 590, max: 620 },
    red: { min: 620, max: 750 },
  };

  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[LightAdapter] Initialized - Photonic pattern recognition active');
  }

  processRawData(data: PhotonicData): UniversalSignal {
    const { wavelength, intensity, phase, polarization, timestamp } = data;
    
    // Normalize wavelength to frequency (THz)
    const frequency = (3e8 / (wavelength * 1e-9)) / 1e12;
    
    // Extract harmonic components from the light signal
    const harmonics = this.extractHarmonics(wavelength, intensity, phase);
    
    const signal: UniversalSignal = {
      domain: 'light',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [wavelength, intensity, phase, polarization],
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
    
    // Calculate quadrant profile based on spectral distribution
    const quadrantProfile = this.calculateQuadrantFromSpectrum(recentSignals);
    
    // Temporal flow from signal intensity patterns
    const temporalFlow = this.calculateTemporalFlow(recentSignals);
    
    // Calculate advanced metrics
    const avgIntensity = recentSignals.reduce((sum, s) => sum + s.intensity, 0) / recentSignals.length;
    const intensityVariance = this.calculateVariance(recentSignals.map(s => s.intensity));
    const phaseCoherence = this.calculatePhaseCoherence(recentSignals);
    const dominantFreq = this.findDominantFrequency(recentSignals);
    const harmonicRes = this.calculateHarmonicResonance(recentSignals);
    
    return {
      domain: 'light',
      quadrantProfile,
      temporalFlow,
      intensity: avgIntensity,
      momentum: this.calculateMomentum(recentSignals),
      volatility: Math.sqrt(intensityVariance),
      dominantFrequency: dominantFreq,
      harmonicResonance: harmonicRes,
      phaseAlignment: phaseCoherence,
      extractedAt: Date.now(),
    };
  }

  private extractHarmonics(wavelength: number, intensity: number, phase: number): number[] {
    // Extract first 8 harmonic components
    const fundamentalFreq = 3e8 / (wavelength * 1e-9);
    return Array.from({ length: 8 }, (_, i) => {
      const harmonicNum = i + 1;
      const amplitude = intensity / Math.pow(harmonicNum, 1.5);
      const phaseShift = (phase * harmonicNum) % (2 * Math.PI);
      return amplitude * Math.cos(phaseShift);
    });
  }

  private calculateQuadrantFromSpectrum(signals: UniversalSignal[]): DomainSignature['quadrantProfile'] {
    // Map spectral characteristics to quadrants
    // High frequency (blue/violet) = aggressive
    // Low frequency (red/infrared) = defensive
    // High intensity = tactical
    // Phase coherence = strategic
    
    const avgFreq = signals.reduce((sum, s) => sum + s.frequency, 0) / signals.length;
    const avgIntensity = signals.reduce((sum, s) => sum + s.intensity, 0) / signals.length;
    const phaseCoherence = this.calculatePhaseCoherence(signals);
    
    // Normalize to 0-1 range
    const freqNorm = Math.min(avgFreq / 800, 1); // THz
    const intensityNorm = avgIntensity;
    const coherenceNorm = phaseCoherence;
    
    const total = freqNorm + (1 - freqNorm) + intensityNorm + coherenceNorm;
    
    return {
      aggressive: freqNorm / total,
      defensive: (1 - freqNorm) / total,
      tactical: intensityNorm / total,
      strategic: coherenceNorm / total,
    };
  }

  private calculateTemporalFlow(signals: UniversalSignal[]): DomainSignature['temporalFlow'] {
    const len = signals.length;
    const third = Math.floor(len / 3);
    
    const earlyIntensity = signals.slice(0, third).reduce((sum, s) => sum + s.intensity, 0) / third || 0;
    const midIntensity = signals.slice(third, 2 * third).reduce((sum, s) => sum + s.intensity, 0) / third || 0;
    const lateIntensity = signals.slice(2 * third).reduce((sum, s) => sum + s.intensity, 0) / third || 0;
    
    const total = earlyIntensity + midIntensity + lateIntensity || 1;
    
    return {
      early: earlyIntensity / total,
      mid: midIntensity / total,
      late: lateIntensity / total,
    };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  private calculatePhaseCoherence(signals: UniversalSignal[]): number {
    if (signals.length < 2) return 0;
    
    let coherenceSum = 0;
    for (let i = 1; i < signals.length; i++) {
      const phaseDiff = Math.abs(signals[i].phase - signals[i - 1].phase);
      coherenceSum += Math.cos(phaseDiff);
    }
    
    return (coherenceSum / (signals.length - 1) + 1) / 2; // Normalize to 0-1
  }

  private findDominantFrequency(signals: UniversalSignal[]): number {
    // Simple peak detection in frequency domain
    const freqBuckets = new Map<number, number>();
    
    signals.forEach(s => {
      const bucket = Math.round(s.frequency / 10) * 10;
      freqBuckets.set(bucket, (freqBuckets.get(bucket) || 0) + s.intensity);
    });
    
    let maxBucket = 0;
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
    // Measure how well harmonics align across signals
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
      
      const cosineSim = dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2) || 1);
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
      domain: 'light',
      quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
      temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0,
      dominantFrequency: 550,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now(),
    };
  }

  // Simulate photonic data for market correlation
  generateMarketCorrelatedSignal(marketMomentum: number, marketVolatility: number): PhotonicData {
    const baseWavelength = 550; // Green - neutral
    
    // Market momentum shifts the wavelength (blue = bullish, red = bearish)
    const wavelengthShift = -marketMomentum * 100; // Negative momentum -> red shift
    const wavelength = Math.max(380, Math.min(750, baseWavelength + wavelengthShift));
    
    // Volatility affects intensity
    const intensity = 0.5 + (marketVolatility * 0.5);
    
    // Momentum affects phase
    const phase = (marketMomentum + 1) * Math.PI;
    
    return {
      wavelength,
      intensity: Math.max(0, Math.min(1, intensity)),
      phase: phase % (2 * Math.PI),
      polarization: Math.random() * 360,
      timestamp: Date.now(),
    };
  }
}

export const lightAdapter = new LightDomainAdapter();
export type { PhotonicData };
