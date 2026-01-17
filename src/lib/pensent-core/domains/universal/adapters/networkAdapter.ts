/**
 * Network Infrastructure Domain Adapter
 * Converts network traffic patterns to En Pensent temporal signatures
 * 
 * Network traffic reveals human behavior patterns at scale.
 * This adapter extracts temporal patterns from:
 * - Packet flow dynamics
 * - Latency fluctuations
 * - Bandwidth utilization
 * - Connection patterns
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

interface NetworkData {
  packetsPerSecond: number;
  bytesPerSecond: number;
  latencyMs: number;
  connectionCount: number;
  errorRate: number;
  timestamp: number;
}

class NetworkDomainAdapter implements DomainAdapter<NetworkData> {
  domain = 'network' as const;
  name = 'Network Flow Analyzer';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 1000;
  
  // Network health thresholds
  private readonly THRESHOLDS = {
    lowLatency: 20,
    highLatency: 200,
    lowPacketRate: 100,
    highPacketRate: 10000,
    criticalErrorRate: 0.05,
  };

  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[NetworkAdapter] Initialized - Network pattern recognition active');
  }

  processRawData(data: NetworkData): UniversalSignal {
    const { packetsPerSecond, bytesPerSecond, latencyMs, connectionCount, errorRate, timestamp } = data;
    
    // Normalize packet rate to frequency (treat as oscillation frequency)
    const frequency = Math.log10(packetsPerSecond + 1) * 100;
    
    // Latency affects intensity inversely
    const intensity = 1 - Math.min(latencyMs / this.THRESHOLDS.highLatency, 1);
    
    // Error rate affects phase (errors create "noise" in the signal)
    const phase = errorRate * Math.PI * 2;
    
    // Extract harmonics from multi-dimensional network data
    const harmonics = this.extractHarmonics(packetsPerSecond, bytesPerSecond, connectionCount);
    
    const signal: UniversalSignal = {
      domain: 'network',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [packetsPerSecond, bytesPerSecond, latencyMs, connectionCount, errorRate],
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
    
    // Calculate quadrant profile from network behavior
    const quadrantProfile = this.calculateQuadrantFromNetwork(recentSignals);
    
    // Temporal flow from traffic patterns
    const temporalFlow = this.calculateTemporalFlow(recentSignals);
    
    // Calculate advanced metrics
    const avgIntensity = recentSignals.reduce((sum, s) => sum + s.intensity, 0) / recentSignals.length;
    const intensityVariance = this.calculateVariance(recentSignals.map(s => s.intensity));
    const dominantFreq = this.findDominantFrequency(recentSignals);
    const harmonicRes = this.calculateHarmonicResonance(recentSignals);
    const phaseNoise = this.calculatePhaseNoise(recentSignals);
    
    return {
      domain: 'network',
      quadrantProfile,
      temporalFlow,
      intensity: avgIntensity,
      momentum: this.calculateMomentum(recentSignals),
      volatility: Math.sqrt(intensityVariance),
      dominantFrequency: dominantFreq,
      harmonicResonance: harmonicRes,
      phaseAlignment: 1 - phaseNoise, // Less noise = more alignment
      extractedAt: Date.now(),
    };
  }

  private extractHarmonics(packets: number, bytes: number, connections: number): number[] {
    // Create harmonic components from different network metrics
    const baseFreq = Math.log10(packets + 1);
    const byteRatio = bytes / (packets || 1);
    const connDensity = connections / (packets || 1);
    
    return [
      baseFreq,
      baseFreq * 2 * (byteRatio / 1000),
      baseFreq * 3 * connDensity,
      Math.sin(baseFreq),
      Math.cos(baseFreq * 2),
      (byteRatio / 1500) * Math.sin(baseFreq * 3),
      connDensity * Math.cos(baseFreq * 4),
      Math.sin(baseFreq * 5) * Math.cos(byteRatio / 1000),
    ];
  }

  private calculateQuadrantFromNetwork(signals: UniversalSignal[]): DomainSignature['quadrantProfile'] {
    // Map network behavior to quadrants
    // High throughput = aggressive (pushing data)
    // Low latency = defensive (maintaining stability)
    // High connection count = tactical (many actions)
    // Low error rate = strategic (quality over quantity)
    
    const avgPackets = signals.reduce((sum, s) => sum + s.rawData[0], 0) / signals.length;
    const avgLatency = signals.reduce((sum, s) => sum + s.rawData[2], 0) / signals.length;
    const avgConnections = signals.reduce((sum, s) => sum + s.rawData[3], 0) / signals.length;
    const avgErrors = signals.reduce((sum, s) => sum + s.rawData[4], 0) / signals.length;
    
    // Normalize
    const throughputScore = Math.min(avgPackets / this.THRESHOLDS.highPacketRate, 1);
    const latencyScore = 1 - Math.min(avgLatency / this.THRESHOLDS.highLatency, 1);
    const connectionScore = Math.min(avgConnections / 1000, 1);
    const qualityScore = 1 - Math.min(avgErrors / this.THRESHOLDS.criticalErrorRate, 1);
    
    const total = throughputScore + latencyScore + connectionScore + qualityScore || 1;
    
    return {
      aggressive: throughputScore / total,
      defensive: latencyScore / total,
      tactical: connectionScore / total,
      strategic: qualityScore / total,
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
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  private calculatePhaseNoise(signals: UniversalSignal[]): number {
    if (signals.length < 2) return 0;
    
    let noiseSum = 0;
    for (let i = 1; i < signals.length; i++) {
      noiseSum += Math.abs(signals[i].phase - signals[i - 1].phase);
    }
    
    return noiseSum / ((signals.length - 1) * Math.PI * 2);
  }

  private findDominantFrequency(signals: UniversalSignal[]): number {
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
      domain: 'network',
      quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
      temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0,
      dominantFrequency: 100,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now(),
    };
  }

  // Generate network signal correlated with market activity
  generateMarketCorrelatedSignal(marketVolume: number, marketVolatility: number): NetworkData {
    // High market activity = high network activity
    const packetsPerSecond = 1000 + (marketVolume * 5000);
    const bytesPerSecond = packetsPerSecond * (500 + Math.random() * 500);
    
    // Market volatility increases latency (uncertainty)
    const latencyMs = 20 + (marketVolatility * 180);
    
    // Active trading = more connections
    const connectionCount = 50 + Math.floor(marketVolume * 500);
    
    // Volatility can cause errors
    const errorRate = Math.min(0.001 + (marketVolatility * 0.04), 0.1);
    
    return {
      packetsPerSecond,
      bytesPerSecond,
      latencyMs,
      connectionCount,
      errorRate,
      timestamp: Date.now(),
    };
  }
}

export const networkAdapter = new NetworkDomainAdapter();
export type { NetworkData };
