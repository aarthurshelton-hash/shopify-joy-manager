/**
 * En Pensent™ Industry Domain Types
 * 
 * Universal pattern recognition for high-value industrial verticals.
 * Maps ANY sequential sensor/event data to 64-square Color Flow Signatures.
 */

import { DomainType, DomainSignature, UniversalSignal } from '../universal/types';
import { TemporalSignature, QuadrantProfile } from '../../types/core';

// ===================== INDUSTRY VERTICAL TYPES =====================

export type IndustryVertical = 
  | 'manufacturing'     // Predictive Maintenance, Quality Control
  | 'supply_chain'      // Logistics, Inventory, Resilience
  | 'healthcare'        // Patient Vitals, Diagnostic Patterns
  | 'cybersecurity'     // Network Traffic, Attack Patterns
  | 'fintech'           // Fraud Detection, Transaction Patterns
  | 'energy'            // Grid Load, Renewable Optimization
  | 'agriculture'       // Crop Health, Weather Correlation
  | 'sports'            // Athlete Performance, Fatigue Prediction
  | 'aviation'          // Flight Patterns, Maintenance Scheduling
  | 'telecommunications'; // Network Load, Service Degradation

// ===================== 64-METRIC GRID MAPPING =====================

/**
 * Universal 64-Square Grid for ANY domain
 * Maps sensor data to an 8x8 matrix like a chess board
 */
export interface SixtyFourSquareGrid {
  /** 8x8 matrix of normalized values (0-1) */
  cells: number[][];
  /** Color encoding for each cell (HSL or hex) */
  colorMap: string[][];
  /** Dominant color per quadrant */
  quadrantColors: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
  /** Overall intensity heat signature */
  heatSignature: number;
  /** Timestamp of capture */
  capturedAt: number;
}

/**
 * Maps raw industry data to the 64-square grid
 */
export interface IndustryDataMapper<TRawData = unknown> {
  vertical: IndustryVertical;
  name: string;
  description: string;
  
  /** Convert raw sensor/event data to 64-square grid */
  mapToGrid(data: TRawData): SixtyFourSquareGrid;
  
  /** Extract temporal signature from grid sequence */
  extractSignature(grids: SixtyFourSquareGrid[]): TemporalSignature;
  
  /** Define the 8 rows meaning for this vertical */
  rowDefinitions: string[];
  
  /** Define the 8 column meaning for this vertical */
  columnDefinitions: string[];
}

// ===================== MANUFACTURING / PREDICTIVE MAINTENANCE =====================

export interface ManufacturingSensorData {
  machineId: string;
  timestamp: number;
  vibration: {
    x: number;
    y: number;
    z: number;
    frequency: number;
    amplitude: number;
  };
  temperature: number;
  pressure: number;
  rpm: number;
  powerDraw: number;
  oilViscosity?: number;
  soundLevel?: number;
  humidity?: number;
}

export interface ManufacturingArchetype {
  id: string;
  name: string;
  description: string;
  failureRisk: 'critical' | 'high' | 'moderate' | 'low' | 'nominal';
  timeToFailure?: number; // hours
  recommendedAction: string;
  historicalAccuracy: number;
}

export const MANUFACTURING_ARCHETYPES: ManufacturingArchetype[] = [
  {
    id: 'bearing_degradation',
    name: 'Bearing Degradation',
    description: 'Vibration signature shows increasing harmonic frequencies typical of bearing wear',
    failureRisk: 'critical',
    timeToFailure: 24,
    recommendedAction: 'Schedule immediate bearing inspection and replacement',
    historicalAccuracy: 0.87
  },
  {
    id: 'thermal_runaway',
    name: 'Thermal Runaway Pattern',
    description: 'Temperature spikes correlating with power draw increases',
    failureRisk: 'critical',
    timeToFailure: 8,
    recommendedAction: 'Immediate cooling system inspection, reduce load',
    historicalAccuracy: 0.92
  },
  {
    id: 'imbalance_progression',
    name: 'Rotational Imbalance',
    description: 'Vibration pattern indicates progressive shaft misalignment',
    failureRisk: 'high',
    timeToFailure: 72,
    recommendedAction: 'Schedule alignment check within 3 days',
    historicalAccuracy: 0.84
  },
  {
    id: 'lubrication_starvation',
    name: 'Lubrication Starvation',
    description: 'Oil viscosity and temperature correlation indicates lubrication issues',
    failureRisk: 'high',
    timeToFailure: 48,
    recommendedAction: 'Check oil levels and quality, schedule fluid change',
    historicalAccuracy: 0.79
  },
  {
    id: 'stable_operation',
    name: 'Stable Operation',
    description: 'All metrics within normal variance, balanced quadrant profile',
    failureRisk: 'nominal',
    recommendedAction: 'Continue standard monitoring interval',
    historicalAccuracy: 0.95
  },
  {
    id: 'efficiency_decline',
    name: 'Efficiency Decline',
    description: 'Power consumption increasing without corresponding output increase',
    failureRisk: 'moderate',
    timeToFailure: 168,
    recommendedAction: 'Schedule preventive maintenance within 1 week',
    historicalAccuracy: 0.76
  }
];

// ===================== SUPPLY CHAIN / LOGISTICS =====================

export interface SupplyChainEventData {
  shipmentId: string;
  timestamp: number;
  location: { lat: number; lng: number };
  transitTime: number; // hours
  delays: number;
  inventoryLevel: number;
  demandForecast: number;
  supplierReliability: number;
  routeEfficiency: number;
  weatherImpact: number;
  geopoliticalRisk?: number;
}

export interface SupplyChainArchetype {
  id: string;
  name: string;
  description: string;
  resilienceScore: number; // 0-1
  bottleneckRisk: 'critical' | 'high' | 'moderate' | 'low';
  recommendedAction: string;
  chessEquivalent?: string; // For cross-domain pattern matching
}

export const SUPPLY_CHAIN_ARCHETYPES: SupplyChainArchetype[] = [
  {
    id: 'single_point_failure',
    name: 'Single Point of Failure',
    description: 'Over-reliance on single supplier/route creating vulnerability',
    resilienceScore: 0.2,
    bottleneckRisk: 'critical',
    recommendedAction: 'Immediately diversify supplier base and establish backup routes',
    chessEquivalent: 'king_exposed' // Like an exposed king with no escape squares
  },
  {
    id: 'bullwhip_cascade',
    name: 'Bullwhip Effect Cascade',
    description: 'Demand signal amplification causing inventory oscillation',
    resilienceScore: 0.35,
    bottleneckRisk: 'high',
    recommendedAction: 'Implement demand smoothing and increase visibility upstream',
    chessEquivalent: 'overextension' // Like overextended pawns creating weaknesses
  },
  {
    id: 'resilient_network',
    name: 'Resilient Network',
    description: 'Diversified suppliers with redundant routes and buffer inventory',
    resilienceScore: 0.85,
    bottleneckRisk: 'low',
    recommendedAction: 'Maintain current strategy, optimize for efficiency',
    chessEquivalent: 'fortress_defense' // Solid defensive structure
  },
  {
    id: 'agile_response',
    name: 'Agile Response Pattern',
    description: 'High flexibility with quick pivot capability',
    resilienceScore: 0.75,
    bottleneckRisk: 'moderate',
    recommendedAction: 'Leverage agility for competitive advantage',
    chessEquivalent: 'dynamic_attack' // Active piece play
  }
];

// ===================== HEALTHCARE / DIAGNOSTICS =====================

export interface PatientVitalsData {
  patientId: string;
  timestamp: number;
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  oxygenSaturation: number;
  temperature: number;
  respiratoryRate: number;
  bloodGlucose?: number;
  ecgSignal?: number[];
  mobility?: number;
  sleepQuality?: number;
}

export interface HealthcareArchetype {
  id: string;
  name: string;
  description: string;
  urgency: 'emergency' | 'urgent' | 'routine' | 'preventive';
  timeHorizon: string;
  recommendedAction: string;
  icdCorrelation?: string; // ICD-10 code correlation
}

export const HEALTHCARE_ARCHETYPES: HealthcareArchetype[] = [
  {
    id: 'sepsis_precursor',
    name: 'Sepsis Precursor Pattern',
    description: 'Vital signature shows early sepsis warning: temp + HR elevation with BP instability',
    urgency: 'emergency',
    timeHorizon: '2-6 hours before clinical presentation',
    recommendedAction: 'Immediate sepsis protocol activation, blood cultures',
    icdCorrelation: 'A41.9'
  },
  {
    id: 'cardiac_deterioration',
    name: 'Cardiac Deterioration',
    description: 'Progressive heart rate variability decline with subtle BP changes',
    urgency: 'urgent',
    timeHorizon: '12-24 hours',
    recommendedAction: 'Cardiology consult, continuous monitoring upgrade',
    icdCorrelation: 'I50.9'
  },
  {
    id: 'respiratory_decline',
    name: 'Respiratory Decline Pattern',
    description: 'O2 sat trending down with compensatory respiratory rate increase',
    urgency: 'urgent',
    timeHorizon: '4-8 hours',
    recommendedAction: 'Respiratory therapy evaluation, consider imaging',
    icdCorrelation: 'J96.0'
  },
  {
    id: 'stable_recovery',
    name: 'Stable Recovery Trajectory',
    description: 'All vitals trending toward baseline with balanced temporal flow',
    urgency: 'routine',
    timeHorizon: 'Discharge within 24-48 hours',
    recommendedAction: 'Continue current treatment, prepare discharge planning'
  }
];

// ===================== CYBERSECURITY / THREAT DETECTION =====================

export interface NetworkTrafficData {
  timestamp: number;
  sourceIp: string;
  destIp: string;
  protocol: string;
  bytesIn: number;
  bytesOut: number;
  packetsPerSecond: number;
  connectionDuration: number;
  portSequence?: number[];
  geoLocation?: string;
  tlsVersion?: string;
  userAgent?: string;
}

export interface CybersecurityArchetype {
  id: string;
  name: string;
  description: string;
  threatLevel: 'critical' | 'high' | 'medium' | 'low' | 'info';
  attackVector: string;
  recommendedAction: string;
  chessTrapEquivalent?: string; // For cross-domain correlation
}

export const CYBERSECURITY_ARCHETYPES: CybersecurityArchetype[] = [
  {
    id: 'lateral_movement',
    name: 'Lateral Movement Pattern',
    description: 'Sequential internal IP access pattern indicating credential compromise',
    threatLevel: 'critical',
    attackVector: 'Post-exploitation lateral spread',
    recommendedAction: 'Isolate affected segments, force password reset, forensic analysis',
    chessTrapEquivalent: 'piece_sacrifice_attack' // Like sacrificing material for deep invasion
  },
  {
    id: 'exfiltration_pattern',
    name: 'Data Exfiltration Signature',
    description: 'Unusual outbound data volume to rare destination with encrypted channel',
    threatLevel: 'critical',
    attackVector: 'Data theft/APT final stage',
    recommendedAction: 'Block destination, capture traffic, incident response',
    chessTrapEquivalent: 'back_rank_weakness' // Exploiting a fundamental vulnerability
  },
  {
    id: 'reconnaissance_sweep',
    name: 'Reconnaissance Sweep',
    description: 'Port scanning and service enumeration from single source',
    threatLevel: 'medium',
    attackVector: 'Pre-attack intelligence gathering',
    recommendedAction: 'Block source, increase monitoring, review firewall rules',
    chessTrapEquivalent: 'opening_preparation' // Like studying opponent before game
  },
  {
    id: 'normal_variance',
    name: 'Normal Traffic Variance',
    description: 'Traffic patterns within expected parameters and seasonal norms',
    threatLevel: 'info',
    attackVector: 'None detected',
    recommendedAction: 'Continue baseline monitoring'
  }
];

// ===================== FINTECH / FRAUD DETECTION =====================

export interface TransactionData {
  transactionId: string;
  timestamp: number;
  amount: number;
  merchantCategory: string;
  location: { lat: number; lng: number };
  deviceFingerprint: string;
  velocity: number; // transactions per hour
  accountAge: number; // days
  distanceFromHome: number;
  timeOfDay: number;
  isInternational: boolean;
}

export interface FraudArchetype {
  id: string;
  name: string;
  description: string;
  fraudProbability: number; // 0-1
  trapType: string;
  recommendedAction: string;
  chessTrapEquivalent?: string;
}

export const FRAUD_ARCHETYPES: FraudArchetype[] = [
  {
    id: 'velocity_attack',
    name: 'Velocity Attack Pattern',
    description: 'Rapid successive transactions testing card limits',
    fraudProbability: 0.92,
    trapType: 'Card testing attack',
    recommendedAction: 'Decline + temporary card lock + SMS verification',
    chessTrapEquivalent: 'blitz_tactics' // Fast, forcing sequences
  },
  {
    id: 'geographic_impossible',
    name: 'Geographic Impossibility',
    description: 'Transactions in locations impossible to reach in timeframe',
    fraudProbability: 0.95,
    trapType: 'Account takeover / Card clone',
    recommendedAction: 'Immediate decline + freeze + customer contact',
    chessTrapEquivalent: 'illegal_move' // Impossible by the rules
  },
  {
    id: 'synthetic_identity',
    name: 'Synthetic Identity Pattern',
    description: 'New account with inconsistent behavioral patterns',
    fraudProbability: 0.78,
    trapType: 'Synthetic identity fraud',
    recommendedAction: 'Enhanced verification + manual review',
    chessTrapEquivalent: 'elephant_trap' // Looks legitimate but is a setup
  },
  {
    id: 'legitimate_variation',
    name: 'Legitimate Behavior Variation',
    description: 'Unusual but explainable pattern (travel, large purchase)',
    fraudProbability: 0.12,
    trapType: 'False positive risk',
    recommendedAction: 'Soft verification (app notification), allow transaction'
  }
];

// ===================== CROSS-DOMAIN CORRELATION =====================

/**
 * Maps patterns between industries and chess archetypes
 * This is where "Black Swan" discoveries emerge
 */
export interface CrossIndustryCorrelation {
  sourceIndustry: IndustryVertical;
  sourceArchetype: string;
  targetIndustry: IndustryVertical | 'chess';
  targetArchetype: string;
  correlationStrength: number; // 0-1
  discoveredAt: Date;
  sampleSize: number;
  description: string;
  actionableInsight: string;
}

/**
 * Result of cross-domain pattern matching
 */
export interface BlackSwanDiscovery {
  id: string;
  type: 'correlation' | 'divergence' | 'resonance';
  industries: (IndustryVertical | 'chess')[];
  title: string;
  description: string;
  significance: number; // 0-1
  actionableInsight: string;
  detectedAt: Date;
  gridSignatures: SixtyFourSquareGrid[];
}
