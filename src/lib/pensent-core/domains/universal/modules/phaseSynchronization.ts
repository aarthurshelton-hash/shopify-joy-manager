/**
 * Phase Synchronization Detector
 * Identifies when biological, cosmic, and market cycles enter phase-lock
 * Like pendulums on a shared platform, independent cycles can synchronize
 */

import { DomainType } from '../types';

// Cycle Definition
export interface CycleDefinition {
  name: string;
  domain: DomainType | 'geological' | 'linguistic';
  periodMs: number;         // Cycle period in milliseconds
  currentPhase: number;     // 0-1 (0 = start, 0.5 = mid, 1 = end/restart)
  amplitude: number;        // Strength of the cycle
  lastPeakAt?: number;      // Timestamp of last peak
  lastTroughAt?: number;    // Timestamp of last trough
}

// Phase Lock Event
export interface PhaseLockEvent {
  id: string;
  timestamp: number;
  synchronizedCycles: string[];   // Names of cycles that synchronized
  lockStrength: number;           // 0-1 how strongly locked
  commonPhase: number;            // The phase they're locked at
  predictedDuration: number;      // How long lock expected to last (ms)
  marketImplication: 'strong_trend' | 'reversal_imminent' | 'volatility_expansion' | 'consolidation';
  resolved?: {
    actualDuration: number;
    wasCorrect: boolean;
  };
}

// Phase Coherence Calculation Result
export interface PhaseCoherence {
  overallCoherence: number;       // 0-1 average phase alignment
  dominantPhase: number;          // The phase most cycles are near
  cycleCount: number;             // Number of cycles analyzed
  synchronizedPairs: [string, string, number][]; // [cycle1, cycle2, correlation]
  isSignificant: boolean;         // Whether coherence exceeds random chance
}

// Known Natural Cycles
export const KNOWN_CYCLES: Record<string, CycleDefinition> = {
  // Cosmic Cycles
  lunar: {
    name: 'Lunar Cycle',
    domain: 'bio',
    periodMs: 29.5 * 24 * 60 * 60 * 1000, // ~29.5 days
    currentPhase: 0,
    amplitude: 0.7
  },
  solar_rotation: {
    name: 'Solar Rotation',
    domain: 'satellite',
    periodMs: 27 * 24 * 60 * 60 * 1000, // ~27 days
    currentPhase: 0,
    amplitude: 0.5
  },
  mercury_synodic: {
    name: 'Mercury Synodic',
    domain: 'satellite',
    periodMs: 116 * 24 * 60 * 60 * 1000, // ~116 days
    currentPhase: 0,
    amplitude: 0.4
  },
  
  // Biological Cycles
  circadian: {
    name: 'Circadian Rhythm',
    domain: 'bio',
    periodMs: 24 * 60 * 60 * 1000, // 24 hours
    currentPhase: 0,
    amplitude: 0.9
  },
  ultradian: {
    name: 'Ultradian (90min)',
    domain: 'bio',
    periodMs: 90 * 60 * 1000, // 90 minutes
    currentPhase: 0,
    amplitude: 0.6
  },
  weekly: {
    name: 'Weekly Rhythm',
    domain: 'bio',
    periodMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    currentPhase: 0,
    amplitude: 0.5
  },
  
  // Market Cycles
  options_expiry: {
    name: 'Options Expiry',
    domain: 'market',
    periodMs: 30 * 24 * 60 * 60 * 1000, // ~monthly
    currentPhase: 0,
    amplitude: 0.8
  },
  quarterly: {
    name: 'Quarterly Cycle',
    domain: 'market',
    periodMs: 91 * 24 * 60 * 60 * 1000, // ~91 days
    currentPhase: 0,
    amplitude: 0.7
  },
  
  // Geological
  tidal: {
    name: 'Tidal Cycle',
    domain: 'geological',
    periodMs: 12.42 * 60 * 60 * 1000, // ~12.42 hours
    currentPhase: 0,
    amplitude: 0.4
  }
};

// Calculate phase from timestamp
export function calculatePhase(
  timestamp: number,
  periodMs: number,
  epochOffset: number = 0
): number {
  const elapsed = timestamp - epochOffset;
  return (elapsed % periodMs) / periodMs;
}

// Calculate phase difference between two cycles
export function phaseDifference(phase1: number, phase2: number): number {
  const diff = Math.abs(phase1 - phase2);
  return Math.min(diff, 1 - diff); // Circular distance
}

// Check if two phases are synchronized
export function arePhasesSynchronized(
  phase1: number,
  phase2: number,
  tolerance: number = 0.1
): boolean {
  return phaseDifference(phase1, phase2) <= tolerance;
}

// Phase Synchronization Detector Class
export class PhaseSynchronizationDetector {
  private cycles: Map<string, CycleDefinition> = new Map();
  private events: PhaseLockEvent[] = [];
  private epochReference: number;

  constructor(epochReference?: number) {
    // Use January 1, 2000 as default epoch
    this.epochReference = epochReference || new Date('2000-01-01T00:00:00Z').getTime();
    
    // Initialize with known cycles
    Object.entries(KNOWN_CYCLES).forEach(([key, cycle]) => {
      this.cycles.set(key, { ...cycle });
    });
  }

  // Update all cycle phases to current time
  updateCyclePhases(timestamp: number = Date.now()): void {
    for (const [key, cycle] of this.cycles) {
      cycle.currentPhase = calculatePhase(timestamp, cycle.periodMs, this.epochReference);
    }
  }

  // Add a custom cycle
  addCycle(key: string, cycle: CycleDefinition): void {
    this.cycles.set(key, cycle);
  }

  // Analyze current phase coherence
  analyzePhaseCoherence(): PhaseCoherence {
    this.updateCyclePhases();
    
    const cycleArray = Array.from(this.cycles.entries());
    const phases = cycleArray.map(([_, c]) => c.currentPhase);
    
    // Calculate pairwise synchronization
    const synchronizedPairs: [string, string, number][] = [];
    
    for (let i = 0; i < cycleArray.length; i++) {
      for (let j = i + 1; j < cycleArray.length; j++) {
        const [name1, cycle1] = cycleArray[i];
        const [name2, cycle2] = cycleArray[j];
        
        const diff = phaseDifference(cycle1.currentPhase, cycle2.currentPhase);
        const correlation = 1 - diff * 2; // Convert to correlation-like score
        
        if (correlation > 0.6) {
          synchronizedPairs.push([name1, name2, correlation]);
        }
      }
    }
    
    // Calculate overall coherence (Kuramoto order parameter approximation)
    const sumCos = phases.reduce((sum, p) => sum + Math.cos(2 * Math.PI * p), 0);
    const sumSin = phases.reduce((sum, p) => sum + Math.sin(2 * Math.PI * p), 0);
    const overallCoherence = Math.sqrt(sumCos * sumCos + sumSin * sumSin) / phases.length;
    
    // Dominant phase (average angular position)
    const dominantPhase = (Math.atan2(sumSin, sumCos) / (2 * Math.PI) + 1) % 1;
    
    // Is this level of coherence significant?
    // Random phases would have coherence ~0.2-0.3, significant would be >0.5
    const isSignificant = overallCoherence > 0.5;
    
    return {
      overallCoherence,
      dominantPhase,
      cycleCount: phases.length,
      synchronizedPairs,
      isSignificant
    };
  }

  // Detect phase lock event
  detectPhaseLock(): PhaseLockEvent | null {
    const coherence = this.analyzePhaseCoherence();
    
    if (!coherence.isSignificant) return null;
    
    // Find which cycles are most synchronized
    const syncedCycleNames = new Set<string>();
    coherence.synchronizedPairs.forEach(([c1, c2, _]) => {
      syncedCycleNames.add(c1);
      syncedCycleNames.add(c2);
    });
    
    if (syncedCycleNames.size < 3) return null; // Need at least 3 cycles
    
    // Determine market implication based on phase and cycles involved
    let marketImplication: PhaseLockEvent['marketImplication'];
    
    if (coherence.dominantPhase < 0.25 || coherence.dominantPhase > 0.75) {
      marketImplication = 'reversal_imminent';
    } else if (coherence.dominantPhase > 0.4 && coherence.dominantPhase < 0.6) {
      marketImplication = 'strong_trend';
    } else if (coherence.overallCoherence > 0.7) {
      marketImplication = 'volatility_expansion';
    } else {
      marketImplication = 'consolidation';
    }
    
    // Estimate duration based on shortest synchronized cycle
    const syncedCycles = Array.from(syncedCycleNames)
      .map(name => this.cycles.get(name))
      .filter(Boolean) as CycleDefinition[];
    
    const shortestPeriod = Math.min(...syncedCycles.map(c => c.periodMs));
    const predictedDuration = shortestPeriod * 0.2; // ~20% of shortest cycle
    
    const event: PhaseLockEvent = {
      id: `plock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synchronizedCycles: Array.from(syncedCycleNames),
      lockStrength: coherence.overallCoherence,
      commonPhase: coherence.dominantPhase,
      predictedDuration,
      marketImplication
    };
    
    this.events.push(event);
    return event;
  }

  // Get prediction based on current synchronization
  getSynchronizationPrediction(): {
    confidence: number;
    direction: 'bullish' | 'bearish' | 'neutral';
    reasoning: string;
    synchronizedCycles: string[];
  } {
    const coherence = this.analyzePhaseCoherence();
    
    if (!coherence.isSignificant) {
      return {
        confidence: 0.3,
        direction: 'neutral',
        reasoning: 'Cycles are desynchronized - no clear directional bias',
        synchronizedCycles: []
      };
    }
    
    // Phase position determines direction tendency
    // 0-0.25: Recovery/early bull
    // 0.25-0.5: Bull run
    // 0.5-0.75: Topping/early bear
    // 0.75-1.0: Bear market/bottoming
    
    let direction: 'bullish' | 'bearish' | 'neutral';
    let reasoning: string;
    
    if (coherence.dominantPhase < 0.25) {
      direction = 'bullish';
      reasoning = 'Synchronized cycles in early expansion phase';
    } else if (coherence.dominantPhase < 0.5) {
      direction = 'bullish';
      reasoning = 'Synchronized cycles in mid-cycle growth phase';
    } else if (coherence.dominantPhase < 0.75) {
      direction = 'bearish';
      reasoning = 'Synchronized cycles in late cycle/distribution phase';
    } else {
      direction = 'neutral';
      reasoning = 'Synchronized cycles near inflection point - reversal likely';
    }
    
    // Confidence based on coherence strength
    const confidence = 0.4 + (coherence.overallCoherence * 0.5);
    
    const syncedNames = coherence.synchronizedPairs.flatMap(([c1, c2]) => [c1, c2]);
    const uniqueNames = [...new Set(syncedNames)];
    
    return {
      confidence: Math.min(0.9, confidence),
      direction,
      reasoning,
      synchronizedCycles: uniqueNames
    };
  }

  // Resolve a phase lock event
  resolvePhaseLockEvent(eventId: string, actualDuration: number, wasCorrect: boolean): void {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.resolved = { actualDuration, wasCorrect };
    }
  }

  // Get synchronization strength score for engine integration
  getSynchronizationScore(): number {
    const coherence = this.analyzePhaseCoherence();
    return coherence.overallCoherence;
  }

  // Get recent phase lock events
  getRecentEvents(limit: number = 10): PhaseLockEvent[] {
    return [...this.events]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Calculate accuracy of phase lock predictions
  getAccuracyStats(): {
    totalEvents: number;
    resolvedEvents: number;
    correctPredictions: number;
    accuracy: number;
  } {
    const resolved = this.events.filter(e => e.resolved);
    const correct = resolved.filter(e => e.resolved?.wasCorrect);
    
    return {
      totalEvents: this.events.length,
      resolvedEvents: resolved.length,
      correctPredictions: correct.length,
      accuracy: resolved.length > 0 ? correct.length / resolved.length : 0
    };
  }

  // Export for persistence
  exportState(): { cycles: [string, CycleDefinition][]; events: PhaseLockEvent[] } {
    return {
      cycles: Array.from(this.cycles.entries()),
      events: [...this.events]
    };
  }

  // Import from persistence
  importState(state: { cycles: [string, CycleDefinition][]; events: PhaseLockEvent[] }): void {
    this.cycles = new Map(state.cycles);
    this.events = state.events;
  }
}

// Singleton instance
export const phaseSynchronizationDetector = new PhaseSynchronizationDetector();

export default phaseSynchronizationDetector;
