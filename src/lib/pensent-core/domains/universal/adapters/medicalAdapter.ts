/**
 * Medical Domain Adapter
 * 
 * Temporal pattern recognition for diagnostic data
 * Patient monitoring, disease progression, treatment response
 * 
 * Applications:
 * - Patient monitoring: Vital signs, ECG, EEG patterns
 * - Disease progression: Cancer markers, chronic conditions
 * - Treatment response: Medication efficacy, side effects
 * - Epidemiology: Disease spread patterns, outbreak detection
 * - Imaging: MRI/CT temporal sequences, tumor growth
 * 
 * Patent-Pending: En Pensent™ Medical Temporal Analysis
 */

import type { DomainSignature } from '../types';

// Medical telemetry point
export interface MedicalPoint {
  timestamp: number;
  
  // Vital signs
  heartRate: number;           // BPM (normalized 0-1)
  bloodPressureSystolic: number; // mmHg (normalized)
  bloodPressureDiastolic: number;
  temperature: number;         // Celsius (normalized)
  respiratoryRate: number;     // Breaths per minute (normalized)
  oxygenSaturation: number;    // SpO2 % (normalized)
  
  // Lab values
  whiteBloodCellCount: number; // WBC (normalized)
  glucoseLevel: number;        // mg/dL (normalized)
  creatinine: number;          // Kidney function (normalized)
  
  // Disease markers
  tumorMarker: number;         // PSA, CA-125, etc. (normalized)
  viralLoad: number;           // For infectious diseases (normalized)
  inflammationIndex: number;   // CRP, ESR composite (normalized)
  
  // Treatment metrics
  medicationDose: number;      // Current dose level (normalized)
  treatmentPhase: 'induction' | 'maintenance' | 'tapering' | 'observation';
  sideEffectSeverity: number;  // 0-1 scale
  
  // Patient location/status
  ward: string;
  bedNumber: number;
  mobilityScore: number;       // 0-1 (bedridden to fully mobile)
  consciousnessLevel: number;  // GCS normalized (0-1)
}

// Organ system status
export interface OrganSystem {
  name: 'cardiac' | 'respiratory' | 'renal' | 'hepatic' | 'neurological' | 'immune';
  functionScore: number;       // 0-1 (normal to failure)
  trend: 'improving' | 'stable' | 'declining' | 'critical';
  lastUpdate: number;
}

// Medical case data
export interface MedicalData {
  patientId: string;
  diagnosis: string;
  diseaseStage: 'early' | 'localized' | 'advanced' | 'terminal' | 'remission';
  treatmentProtocol: string;
  
  points: MedicalPoint[];
  organSystems: OrganSystem[];
  
  timeRange: {
    start: number;
    end: number;
  };
  
  metadata?: {
    hospital?: string;
    attendingPhysician?: string;
    age?: number;
    sex?: 'male' | 'female' | 'other';
    comorbidities?: string[];
  };
}

// Medical archetypes (patient trajectories)
export type MedicalArchetype =
  | 'stable_recovery'          // Normal healing trajectory
  | 'acute_deterioration'      // Sudden decline requiring intervention
  | 'chronic_management'       // Long-term stable condition
  | 'treatment_response'       // Positive reaction to therapy
  | 'treatment_resistance'     // No response to standard care
  | 'inflammatory_cascade'     // Cytokine storm, sepsis pattern
  | 'organ_failure_progression' // Multi-organ decline
  | 'immune_reconstitution'    // Post-chemo recovery
  | 'viral_clearance'          // Infectious disease recovery
  | 'viral_replication_burst'  // Rapid viral proliferation
  | 'medication_toxicity'      // Adverse drug reaction
  | 'surgical_recovery'        // Post-operative healing
  | 'palliative_decline'      // End-of-life trajectory
  | 'spontaneous_remission'    // Unexpected recovery
  | 'diagnostic_odyssey';      // Long uncertain diagnosis process

// Archetype definitions with clinical significance
export const MEDICAL_ARCHETYPES: Record<MedicalArchetype, {
  description: string;
  color: string;
  urgencyLevel: 'routine' | 'urgent' | 'emergent' | 'critical';
  typicalDuration: number; // hours
  interventionRequired: boolean;
}> = {
  stable_recovery: {
    description: 'Normal healing trajectory with improving vitals',
    color: '#22C55E', // Green
    urgencyLevel: 'routine',
    typicalDuration: 72,
    interventionRequired: false
  },
  acute_deterioration: {
    description: 'Sudden decline requiring immediate intervention',
    color: '#DC2626', // Red
    urgencyLevel: 'critical',
    typicalDuration: 2,
    interventionRequired: true
  },
  chronic_management: {
    description: 'Long-term stable condition with baseline vitals',
    color: '#3B82F6', // Blue
    urgencyLevel: 'routine',
    typicalDuration: 8760, // 1 year
    interventionRequired: false
  },
  treatment_response: {
    description: 'Positive reaction to therapy, markers improving',
    color: '#10B981', // Emerald
    urgencyLevel: 'routine',
    typicalDuration: 168, // 1 week
    interventionRequired: false
  },
  treatment_resistance: {
    description: 'No response to standard care, consider alternatives',
    color: '#F59E0B', // Amber
    urgencyLevel: 'urgent',
    typicalDuration: 336, // 2 weeks
    interventionRequired: true
  },
  inflammatory_cascade: {
    description: 'Cytokine storm, sepsis pattern - aggressive care needed',
    color: '#7F1D1D', // Dark red
    urgencyLevel: 'critical',
    typicalDuration: 6,
    interventionRequired: true
  },
  organ_failure_progression: {
    description: 'Multi-organ decline, ICU care required',
    color: '#991B1B', // Very dark red
    urgencyLevel: 'critical',
    typicalDuration: 24,
    interventionRequired: true
  },
  immune_reconstitution: {
    description: 'Post-chemotherapy immune system recovery',
    color: '#8B5CF6', // Purple
    urgencyLevel: 'urgent',
    typicalDuration: 720, // 30 days
    interventionRequired: true
  },
  viral_clearance: {
    description: 'Infectious disease recovery, viral load decreasing',
    color: '#06B6D4', // Cyan
    urgencyLevel: 'routine',
    typicalDuration: 336, // 2 weeks
    interventionRequired: false
  },
  viral_replication_burst: {
    description: 'Rapid viral proliferation, antiviral intervention needed',
    color: '#EF4444', // Red
    urgencyLevel: 'emergent',
    typicalDuration: 48,
    interventionRequired: true
  },
  medication_toxicity: {
    description: 'Adverse drug reaction, dose adjustment needed',
    color: '#F97316', // Orange
    urgencyLevel: 'urgent',
    typicalDuration: 12,
    interventionRequired: true
  },
  surgical_recovery: {
    description: 'Post-operative healing with expected trajectory',
    color: '#84CC16', // Lime
    urgencyLevel: 'routine',
    typicalDuration: 168, // 1 week
    interventionRequired: false
  },
  palliative_decline: {
    description: 'End-of-life trajectory, comfort care focus',
    color: '#78716C', // Gray
    urgencyLevel: 'urgent',
    typicalDuration: 168, // 1 week
    interventionRequired: false
  },
  spontaneous_remission: {
    description: 'Unexpected recovery, document for research',
    color: '#A855F7', // Violet
    urgencyLevel: 'routine',
    typicalDuration: 720, // 30 days
    interventionRequired: false
  },
  diagnostic_odyssey: {
    description: 'Long uncertain diagnosis process, multiple specialties',
    color: '#6366F1', // Indigo
    urgencyLevel: 'urgent',
    typicalDuration: 2160, // 90 days
    interventionRequired: true
  }
};

/**
 * Build organ system status map
 */
function buildOrganMap(data: MedicalData): Map<string, OrganSystem> {
  const organMap = new Map<string, OrganSystem>();
  
  data.organSystems.forEach(organ => {
    organMap.set(organ.name, organ);
  });
  
  return organMap;
}

/**
 * Generate medical fingerprint
 */
function generateMedicalFingerprint(points: MedicalPoint[]): string {
  const recent = points.slice(-10); // Last 10 readings
  const avgHR = recent.reduce((sum, p) => sum + p.heartRate, 0) / recent.length;
  const avgTemp = recent.reduce((sum, p) => sum + p.temperature, 0) / recent.length;
  const avgWBC = recent.reduce((sum, p) => sum + p.whiteBloodCellCount, 0) / recent.length;
  
  const signature = `${Math.round(avgHR * 100)}-${Math.round(avgTemp * 100)}-${Math.round(avgWBC * 100)}`;
  
  let hash = 0;
  for (let i = 0; i < signature.length; i++) {
    const char = signature.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `med-${Math.abs(hash).toString(36).substring(0, 8)}`;
}

/**
 * Calculate medical quadrant profile
 */
function calculateMedicalQuadrantProfile(data: MedicalData): {
  aggressive: number;    // Acute severity
  defensive: number;     // Protective response
  tactical: number;      // Immediate interventions
  strategic: number;     // Long-term prognosis
} {
  const recentPoints = data.points.slice(-20);
  
  // Acute severity (aggressive)
  const abnormalVitals = recentPoints.filter(p => 
    p.heartRate > 0.8 || 
    p.temperature > 0.75 || 
    p.oxygenSaturation < 0.9
  ).length;
  const aggressive = abnormalVitals / recentPoints.length;
  
  // Protective response (defensive)
  const immuneActive = recentPoints.filter(p => 
    p.whiteBloodCellCount > 0.6 || 
    p.inflammationIndex > 0.5
  ).length;
  const defensive = immuneActive / recentPoints.length;
  
  // Immediate interventions (tactical)
  const interventions = recentPoints.filter(p => 
    p.medicationDose > 0.7 || 
    p.sideEffectSeverity > 0.5
  ).length;
  const tactical = interventions / recentPoints.length;
  
  // Long-term prognosis (strategic)
  const trendPoints = data.points;
  const earlyAvg = trendPoints.slice(0, Math.floor(trendPoints.length * 0.2))
    .reduce((sum, p) => sum + p.consciousnessLevel, 0) / (trendPoints.length * 0.2);
  const lateAvg = trendPoints.slice(-Math.floor(trendPoints.length * 0.2))
    .reduce((sum, p) => sum + p.consciousnessLevel, 0) / (trendPoints.length * 0.2);
  const strategic = lateAvg > earlyAvg ? 0.7 : 0.3;
  
  return {
    aggressive: Math.min(1, aggressive),
    defensive: Math.min(1, defensive),
    tactical: Math.min(1, tactical),
    strategic
  };
}

/**
 * Calculate temporal flow for treatment phases
 */
function calculateMedicalTemporalFlow(data: MedicalData): {
  early: number;   // Diagnosis/Induction
  mid: number;     // Active treatment
  late: number;    // Recovery/Maintenance
} {
  const duration = data.timeRange.end - data.timeRange.start;
  
  const inductionCount = data.points.filter(p => 
    p.treatmentPhase === 'induction'
  ).length;
  const maintenanceCount = data.points.filter(p => 
    p.treatmentPhase === 'maintenance'
  ).length;
  const observationCount = data.points.filter(p => 
    p.treatmentPhase === 'observation'
  ).length;
  
  const total = data.points.length || 1;
  
  return {
    early: inductionCount / total,
    mid: maintenanceCount / total,
    late: observationCount / total
  };
}

/**
 * Find critical medical moments
 */
function findMedicalCriticalMoments(data: MedicalData): Array<{
  timestamp: number;
  severity: number;
  type: string;
  description: string;
}> {
  const moments: Array<{
    timestamp: number;
    severity: number;
    type: string;
    description: string;
  }> = [];
  
  const sortedPoints = [...data.points].sort((a, b) => a.timestamp - b.timestamp);
  
  for (let i = 1; i < sortedPoints.length; i++) {
    const prev = sortedPoints[i - 1];
    const curr = sortedPoints[i];
    
    // Detect code events
    if (curr.heartRate > 0.9 || curr.oxygenSaturation < 0.85) {
      moments.push({
        timestamp: curr.timestamp,
        severity: 1.0,
        type: 'code_blue',
        description: 'Cardiac/respiratory emergency'
      });
    }
    
    // Detect rapid decline
    const consciousnessDrop = prev.consciousnessLevel - curr.consciousnessLevel;
    if (consciousnessDrop > 0.3) {
      moments.push({
        timestamp: curr.timestamp,
        severity: 0.8,
        type: 'neurological_decline',
        description: 'Acute consciousness deterioration'
      });
    }
    
    // Detect sepsis indicators
    if (curr.temperature > 0.8 && curr.whiteBloodCellCount > 0.8 && curr.heartRate > 0.8) {
      moments.push({
        timestamp: curr.timestamp,
        severity: 0.9,
        type: 'sepsis_alert',
        description: 'Systemic inflammatory response'
      });
    }
    
    // Detect treatment toxicity
    if (curr.sideEffectSeverity > 0.7) {
      moments.push({
        timestamp: curr.timestamp,
        severity: 0.6,
        type: 'toxicity_event',
        description: 'Severe adverse drug reaction'
      });
    }
  }
  
  return moments.slice(0, 10); // Top 10 critical events
}

/**
 * Classify medical archetype
 */
function classifyMedicalArchetype(
  data: MedicalData,
  quadrant: { aggressive: number; defensive: number; tactical: number; strategic: number },
  moments: ReturnType<typeof findMedicalCriticalMoments>
): MedicalArchetype {
  // Check for emergencies first
  const codeEvents = moments.filter(m => m.type === 'code_blue');
  if (codeEvents.length > 0) return 'acute_deterioration';
  
  const sepsisEvents = moments.filter(m => m.type === 'sepsis_alert');
  if (sepsisEvents.length > 0) return 'inflammatory_cascade';
  
  // Check organ failure
  const failingOrgans = data.organSystems.filter(o => o.functionScore < 0.3).length;
  if (failingOrgans > 2) return 'organ_failure_progression';
  
  // Check treatment response
  const treatmentResistant = data.points.filter(p => 
    p.treatmentPhase === 'maintenance' && p.tumorMarker > 0.8
  ).length;
  if (treatmentResistant > 5) return 'treatment_resistance';
  
  const treatmentResponsive = data.points.filter(p => 
    p.treatmentPhase === 'maintenance' && p.tumorMarker < 0.3
  ).length;
  if (treatmentResponsive > 5) return 'treatment_response';
  
  // Check viral patterns
  const viralClearing = data.points.filter(p => 
    p.viralLoad < 0.2 && p.immuneReconstitution > 0.5
  ).length;
  if (viralClearing > 3) return 'viral_clearance';
  
  const viralBurst = data.points.filter(p => p.viralLoad > 0.8).length;
  if (viralBurst > 3) return 'viral_replication_burst';
  
  // Check chronic vs acute
  if (quadrant.aggressive < 0.2 && quadrant.strategic > 0.7) {
    return 'chronic_management';
  }
  
  // Check recovery
  if (quadrant.strategic > 0.6 && moments.length === 0) {
    return 'stable_recovery';
  }
  
  // Default to diagnostic odyssey if unclear
  return 'diagnostic_odyssey';
}

/**
 * Extract complete medical signature
 */
export function extractMedicalSignature(data: MedicalData): DomainSignature & {
  fingerprint: string;
  archetype: MedicalArchetype;
  criticalMoments: Array<{
    timestamp: number;
    severity: number;
    type: string;
    description: string;
  }>;
  organMap: Map<string, OrganSystem>;
  prognosisScore: number;
} {
  const organMap = buildOrganMap(data);
  const quadrantProfile = calculateMedicalQuadrantProfile(data);
  const temporalFlow = calculateMedicalTemporalFlow(data);
  const criticalMoments = findMedicalCriticalMoments(data);
  const archetype = classifyMedicalArchetype(data, quadrantProfile, criticalMoments);
  const fingerprint = generateMedicalFingerprint(data.points);
  
  // Calculate intensity (overall severity)
  const avgSeverity = data.points.reduce((sum, p) => 
    sum + (p.heartRate + p.temperature + (1 - p.oxygenSaturation)) / 3, 0
  ) / data.points.length;
  const intensity = Math.min(1, avgSeverity);
  
  // Prognosis score
  const prognosisScore = (quadrantProfile.strategic * 0.5 + 
                         (1 - intensity) * 0.3 + 
                         (criticalMoments.length < 3 ? 0.2 : 0));
  
  return {
    domain: 'chess', // Using closest available
    quadrantProfile: {
      aggressive: quadrantProfile.aggressive,
      defensive: quadrantProfile.defensive,
      tactical: quadrantProfile.tactical,
      strategic: quadrantProfile.strategic
    },
    temporalFlow,
    intensity,
    momentum: intensity > 0.7 ? -0.5 : 0.5, // Negative momentum = declining
    volatility: criticalMoments.length / 5,
    dominantFrequency: data.points.length / ((data.timeRange.end - data.timeRange.start) / 3600000), // Points per hour
    harmonicResonance: 1 - Math.abs(quadrantProfile.aggressive - quadrantProfile.defensive),
    phaseAlignment: prognosisScore,
    extractedAt: Date.now(),
    fingerprint,
    archetype,
    criticalMoments,
    organMap,
    prognosisScore
  };
}

/**
 * Predict medical outcome
 */
export function predictMedicalOutcome(
  signature: ReturnType<typeof extractMedicalSignature>
): {
  predictedOutcome: 'recovery' | 'stable_chronic' | 'deterioration' | 'critical_event' | 'remission';
  confidence: number;
  timeToEvent: number; // hours
  recommendations: string[];
  alertLevel: 'green' | 'yellow' | 'orange' | 'red' | 'purple';
} {
  const archetype = MEDICAL_ARCHETYPES[signature.archetype];
  const urgencyLevel = archetype.urgencyLevel;
  
  let predictedOutcome: 'recovery' | 'stable_chronic' | 'deterioration' | 'critical_event' | 'remission';
  let recommendations: string[] = [];
  let alertLevel: 'green' | 'yellow' | 'orange' | 'red' | 'purple';
  
  switch (signature.archetype) {
    case 'acute_deterioration':
    case 'inflammatory_cascade':
    case 'organ_failure_progression':
      predictedOutcome = 'critical_event';
      recommendations = [
        'ACTIVATE RAPID RESPONSE TEAM',
        'Prepare for ICU transfer',
        'Initiate advanced life support protocols',
        'Notify family and attending physician'
      ];
      alertLevel = 'purple';
      break;
      
    case 'treatment_resistance':
      predictedOutcome = 'deterioration';
      recommendations = [
        'Oncology consultation for second-line therapy',
        'Consider clinical trial enrollment',
        'Palliative care consultation',
        'Reassess treatment goals with patient'
      ];
      alertLevel = 'orange';
      break;
      
    case 'treatment_response':
    case 'viral_clearance':
    case 'stable_recovery':
      predictedOutcome = 'recovery';
      recommendations = [
        'Continue current treatment protocol',
        `Prognosis: ${Math.round(signature.prognosisScore * 100)}% favorable`,
        'Schedule follow-up in 2-4 weeks',
        'Maintain current monitoring frequency'
      ];
      alertLevel = 'green';
      break;
      
    case 'chronic_management':
      predictedOutcome = 'stable_chronic';
      recommendations = [
        'Continue maintenance medications',
        'Routine follow-up schedule',
        'Patient education on warning signs',
        'Quality of life optimization'
      ];
      alertLevel = 'yellow';
      break;
      
    case 'spontaneous_remission':
      predictedOutcome = 'remission';
      recommendations = [
        'Document case for research publication',
        'Continue surveillance imaging',
        'Monitor for late recurrence',
        'Consider tapering therapy'
      ];
      alertLevel = 'green';
      break;
      
    default:
      predictedOutcome = 'stable_chronic';
      recommendations = [
        'Continue current management',
        'Reassess in 24-48 hours',
        'Monitor for trend changes',
        'Consider specialist consultation'
      ];
      alertLevel = 'yellow';
  }
  
  // Confidence calculation
  const dataQuality = Math.min(1, signature.criticalMoments.length / 3);
  const patternClarity = 1 - signature.volatility;
  const confidence = (dataQuality * 0.3 + patternClarity * 0.4 + signature.prognosisScore * 0.3);
  
  // Time to event
  const timeToEvent = alertLevel === 'purple' ? 2 :
                      alertLevel === 'red' ? 6 :
                      alertLevel === 'orange' ? 24 :
                      alertLevel === 'yellow' ? 72 : 168;
  
  return {
    predictedOutcome,
    confidence,
    timeToEvent,
    recommendations,
    alertLevel
  };
}

// Type exports
export type { MedicalData, MedicalPoint, OrganSystem, MedicalArchetype };
