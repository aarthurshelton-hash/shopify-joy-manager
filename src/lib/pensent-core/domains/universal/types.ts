/**
 * Universal En Pensent Domain Types
 * Cross-domain temporal pattern recognition
 */

export interface UniversalSignal {
  domain: DomainType;
  timestamp: number;
  intensity: number;
  frequency: number;
  phase: number;
  harmonics: number[];
  rawData: number[];
}

export type DomainType = 
  | 'chess'      // The Brain - Strategic patterns
  | 'market'     // The Nervous System - Responsive signals
  | 'code'       // The Blood - Life force flow
  | 'light'      // Vision - Electromagnetic perception
  | 'network'    // Connectivity - Data flow patterns
  | 'bio'        // Life rhythms - Biological cycles
  | 'audio'      // Hearing - Sound wave patterns
  | 'music'      // The Heart - Musical temporal patterns
  | 'soul'       // The Spirit - Language, culture, archetypes
  | 'satellite'  // Orbital - Space-based observation
  | 'temporal-consciousness'  // Time perception across consciousness types
  // Future domains (Phase 2+)
  | 'photonic'   // Light-based computing
  | 'medical'    // Diagnostic patterns
  | 'climate'    // Environmental cycles
  | 'energy'     // Power grid patterns
  | 'quantum';   // Quantum state patterns

export interface DomainSignature {
  domain: DomainType;
  quadrantProfile: {
    aggressive: number;
    defensive: number;
    tactical: number;
    strategic: number;
  };
  temporalFlow: {
    early: number;
    mid: number;
    late: number;
  };
  intensity: number;
  momentum: number;
  volatility: number;
  dominantFrequency: number;
  harmonicResonance: number;
  phaseAlignment: number;
  extractedAt: number;
}

export interface CrossDomainCorrelation {
  domain1: DomainType;
  domain2: DomainType;
  correlation: number;
  leadLag: number; // positive = domain1 leads, negative = domain2 leads
  confidence: number;
  sampleSize: number;
  lastUpdated: number;
}

export interface UnifiedPrediction {
  direction: 'up' | 'down' | 'neutral';
  confidence: number;
  magnitude: number;
  timeHorizon: number;
  contributingDomains: DomainContribution[];
  consensusStrength: number;
  harmonicAlignment: number;
}

export interface DomainContribution {
  domain: DomainType;
  weight: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  resonanceScore: number;
}

export interface UniversalEngineState {
  isCalibrated: boolean;
  calibrationProgress: number;
  activeDomains: DomainType[];
  domainSignatures: Map<DomainType, DomainSignature>;
  correlationMatrix: CrossDomainCorrelation[];
  lastPrediction: UnifiedPrediction | null;
  predictionHistory: UnifiedPrediction[];
  accuracy: {
    overall: number;
    byDomain: Record<DomainType, number>;
    byTimeframe: Record<string, number>;
  };
  learningVelocity: number;
  evolutionGeneration: number;
}

export interface DomainAdapter<T = unknown> {
  domain: DomainType;
  name: string;
  isActive: boolean;
  lastUpdate: number;
  
  initialize(): Promise<void>;
  processRawData(data: T): UniversalSignal;
  extractSignature(signals: UniversalSignal[]): DomainSignature;
  getRealtimeStream?(): AsyncGenerator<UniversalSignal>;
  getHistoricalData?(start: number, end: number): Promise<UniversalSignal[]>;
}
