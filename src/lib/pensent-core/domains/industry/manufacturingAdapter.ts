/**
 * Manufacturing Domain Adapter
 * 
 * Maps machine sensor data (vibration, temperature, pressure) to 64-square
 * Color Flow Signatures for predictive maintenance and failure forecasting.
 * 
 * The 8x8 grid represents:
 * - Rows: Time windows (8 sequential samples)
 * - Columns: Sensor dimensions (vibration XYZ, temp, pressure, RPM, power, sound)
 */

import { TemporalSignature, QuadrantProfile, TemporalFlow, CriticalMoment } from '../../types/core';
import { 
  ManufacturingSensorData, 
  ManufacturingArchetype,
  MANUFACTURING_ARCHETYPES,
  SixtyFourSquareGrid,
  IndustryDataMapper 
} from './types';
import { generateFingerprint } from '../../signature/fingerprintGenerator';

// Color scale for manufacturing (blue = healthy, red = critical)
const HEALTH_COLORS = {
  nominal: '#22c55e',    // Green
  good: '#84cc16',       // Lime
  attention: '#eab308',  // Yellow
  warning: '#f97316',    // Orange
  critical: '#ef4444',   // Red
  danger: '#dc2626'      // Dark Red
};

function getHealthColor(normalizedValue: number): string {
  if (normalizedValue < 0.3) return HEALTH_COLORS.nominal;
  if (normalizedValue < 0.5) return HEALTH_COLORS.good;
  if (normalizedValue < 0.65) return HEALTH_COLORS.attention;
  if (normalizedValue < 0.8) return HEALTH_COLORS.warning;
  if (normalizedValue < 0.9) return HEALTH_COLORS.critical;
  return HEALTH_COLORS.danger;
}

/**
 * Normalize sensor value to 0-1 based on typical industrial ranges
 */
function normalizeSensorValue(value: number, min: number, max: number, isInverse: boolean = false): number {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return isInverse ? 1 - normalized : normalized;
}

/**
 * Map a single sensor reading to a row in the 64-square grid
 */
function mapSensorToRow(data: ManufacturingSensorData): number[] {
  return [
    normalizeSensorValue(data.vibration.amplitude, 0, 10),
    normalizeSensorValue(data.vibration.frequency, 0, 1000),
    normalizeSensorValue(Math.abs(data.vibration.x) + Math.abs(data.vibration.y) + Math.abs(data.vibration.z), 0, 30),
    normalizeSensorValue(data.temperature, 20, 150),
    normalizeSensorValue(data.pressure, 0, 200),
    normalizeSensorValue(data.rpm, 0, 5000),
    normalizeSensorValue(data.powerDraw, 0, 100),
    normalizeSensorValue(data.soundLevel ?? 0, 40, 120)
  ];
}

/**
 * Create the 64-square grid from 8 sequential sensor readings
 */
export function createManufacturingGrid(samples: ManufacturingSensorData[]): SixtyFourSquareGrid {
  // Ensure we have exactly 8 samples (pad or truncate)
  const normalizedSamples = samples.slice(0, 8);
  while (normalizedSamples.length < 8) {
    normalizedSamples.push(normalizedSamples[normalizedSamples.length - 1] || samples[0]);
  }

  const cells: number[][] = normalizedSamples.map(mapSensorToRow);
  const colorMap: string[][] = cells.map(row => row.map(getHealthColor));

  // Calculate quadrant averages
  const topLeft = cells.slice(0, 4).flatMap(r => r.slice(0, 4)).reduce((a, b) => a + b, 0) / 16;
  const topRight = cells.slice(0, 4).flatMap(r => r.slice(4, 8)).reduce((a, b) => a + b, 0) / 16;
  const bottomLeft = cells.slice(4, 8).flatMap(r => r.slice(0, 4)).reduce((a, b) => a + b, 0) / 16;
  const bottomRight = cells.slice(4, 8).flatMap(r => r.slice(4, 8)).reduce((a, b) => a + b, 0) / 16;

  return {
    cells,
    colorMap,
    quadrantColors: {
      topLeft: getHealthColor(topLeft),
      topRight: getHealthColor(topRight),
      bottomLeft: getHealthColor(bottomLeft),
      bottomRight: getHealthColor(bottomRight)
    },
    heatSignature: cells.flat().reduce((a, b) => a + b, 0) / 64,
    capturedAt: normalizedSamples[normalizedSamples.length - 1]?.timestamp || Date.now()
  };
}

/**
 * Classify manufacturing pattern into archetype
 */
export function classifyManufacturingArchetype(
  grid: SixtyFourSquareGrid,
  historicalGrids: SixtyFourSquareGrid[] = []
): ManufacturingArchetype {
  const { cells, heatSignature } = grid;
  
  // Calculate vibration trend (column 0-2)
  const vibrationTrend = cells.map(row => (row[0] + row[1] + row[2]) / 3);
  const vibrationIncreasing = vibrationTrend[7] > vibrationTrend[0] * 1.3;
  
  // Calculate temperature trend (column 3)
  const tempTrend = cells.map(row => row[3]);
  const tempRising = tempTrend[7] > tempTrend[0] * 1.2;
  
  // Check for harmonic patterns in vibration (bearing signature)
  const vibrationVariance = calculateVariance(vibrationTrend);
  const isHarmonicPattern = vibrationVariance > 0.1 && vibrationIncreasing;
  
  // Thermal runaway detection
  const powerTrend = cells.map(row => row[6]);
  const thermalPowerCorrelation = correlate(tempTrend, powerTrend);
  
  // Match to archetype
  if (isHarmonicPattern && heatSignature > 0.6) {
    return MANUFACTURING_ARCHETYPES.find(a => a.id === 'bearing_degradation')!;
  }
  
  if (tempRising && thermalPowerCorrelation > 0.7 && heatSignature > 0.7) {
    return MANUFACTURING_ARCHETYPES.find(a => a.id === 'thermal_runaway')!;
  }
  
  if (vibrationIncreasing && !isHarmonicPattern) {
    return MANUFACTURING_ARCHETYPES.find(a => a.id === 'imbalance_progression')!;
  }
  
  // Check oil/lubrication (if available)
  if (tempRising && !thermalPowerCorrelation) {
    return MANUFACTURING_ARCHETYPES.find(a => a.id === 'lubrication_starvation')!;
  }
  
  // Efficiency decline
  if (powerTrend[7] > powerTrend[0] * 1.15 && heatSignature > 0.4) {
    return MANUFACTURING_ARCHETYPES.find(a => a.id === 'efficiency_decline')!;
  }
  
  return MANUFACTURING_ARCHETYPES.find(a => a.id === 'stable_operation')!;
}

/**
 * Extract temporal signature from manufacturing grid sequence
 */
export function extractManufacturingSignature(grids: SixtyFourSquareGrid[]): TemporalSignature {
  if (grids.length === 0) {
    throw new Error('At least one grid required');
  }

  const latest = grids[grids.length - 1];
  const archetype = classifyManufacturingArchetype(latest, grids.slice(0, -1));
  
  // Calculate quadrant profile from latest grid
  const cells = latest.cells;
  const quadrantProfile: QuadrantProfile = {
    q1: cells.slice(0, 4).flatMap(r => r.slice(0, 4)).reduce((a, b) => a + b, 0) / 16,
    q2: cells.slice(0, 4).flatMap(r => r.slice(4, 8)).reduce((a, b) => a + b, 0) / 16,
    q3: cells.slice(4, 8).flatMap(r => r.slice(0, 4)).reduce((a, b) => a + b, 0) / 16,
    q4: cells.slice(4, 8).flatMap(r => r.slice(4, 8)).reduce((a, b) => a + b, 0) / 16
  };

  // Calculate temporal flow across grid sequence
  const heatHistory = grids.map(g => g.heatSignature);
  const thirds = Math.floor(heatHistory.length / 3);
  
  const temporalFlow: TemporalFlow = {
    opening: heatHistory.slice(0, thirds).reduce((a, b) => a + b, 0) / thirds || 0,
    middle: heatHistory.slice(thirds, thirds * 2).reduce((a, b) => a + b, 0) / thirds || 0,
    ending: heatHistory.slice(thirds * 2).reduce((a, b) => a + b, 0) / (heatHistory.length - thirds * 2) || 0,
    trend: determineTrend(heatHistory),
    momentum: calculateMomentum(heatHistory)
  };

  // Detect critical moments (spikes in any metric)
  const criticalMoments: CriticalMoment[] = detectCriticalMoments(grids);

  const fingerprint = generateFingerprint(quadrantProfile, temporalFlow, archetype.id, latest.heatSignature);

  return {
    fingerprint,
    archetype: archetype.name,
    dominantForce: quadrantProfile.q1 + quadrantProfile.q2 > quadrantProfile.q3 + quadrantProfile.q4 ? 'primary' : 'secondary',
    flowDirection: temporalFlow.trend === 'accelerating' ? 'forward' : 
                   temporalFlow.trend === 'declining' ? 'backward' : 'lateral',
    intensity: latest.heatSignature,
    quadrantProfile,
    temporalFlow,
    criticalMoments,
    domainData: {
      industry: 'manufacturing',
      archetype,
      failureRisk: archetype.failureRisk,
      timeToFailure: archetype.timeToFailure,
      recommendedAction: archetype.recommendedAction
    }
  };
}

// ===================== UTILITY FUNCTIONS =====================

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
}

function correlate(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  const meanA = a.reduce((s, v) => s + v, 0) / a.length;
  const meanB = b.reduce((s, v) => s + v, 0) / b.length;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < a.length; i++) {
    const dA = a[i] - meanA;
    const dB = b[i] - meanB;
    num += dA * dB;
    denA += dA * dA;
    denB += dB * dB;
  }
  return denA && denB ? num / Math.sqrt(denA * denB) : 0;
}

function determineTrend(values: number[]): TemporalFlow['trend'] {
  if (values.length < 2) return 'stable';
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const variance = calculateVariance(values);
  
  if (variance > 0.15) return 'volatile';
  if (secondAvg > firstAvg * 1.1) return 'accelerating';
  if (secondAvg < firstAvg * 0.9) return 'declining';
  return 'stable';
}

function calculateMomentum(values: number[]): number {
  if (values.length < 2) return 0;
  const recent = values.slice(-3);
  const earlier = values.slice(0, 3);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  return Math.max(-1, Math.min(1, (recentAvg - earlierAvg) * 2));
}

function detectCriticalMoments(grids: SixtyFourSquareGrid[]): CriticalMoment[] {
  const moments: CriticalMoment[] = [];
  const heatHistory = grids.map(g => g.heatSignature);
  
  for (let i = 1; i < heatHistory.length; i++) {
    const change = Math.abs(heatHistory[i] - heatHistory[i - 1]);
    if (change > 0.15) {
      moments.push({
        index: i,
        type: heatHistory[i] > heatHistory[i - 1] ? 'spike' : 'drop',
        severity: Math.min(1, change * 3),
        description: `Significant ${heatHistory[i] > heatHistory[i - 1] ? 'increase' : 'decrease'} in machine stress`
      });
    }
  }
  
  return moments;
}

/**
 * Manufacturing Data Mapper implementation
 */
export const manufacturingMapper: IndustryDataMapper<ManufacturingSensorData[]> = {
  vertical: 'manufacturing',
  name: 'Predictive Maintenance Mapper',
  description: 'Maps machine vibration, temperature, and power data to Color Flow Signatures for failure prediction',
  
  rowDefinitions: [
    'Time T-7 (oldest)',
    'Time T-6',
    'Time T-5',
    'Time T-4',
    'Time T-3',
    'Time T-2',
    'Time T-1',
    'Time T-0 (now)'
  ],
  
  columnDefinitions: [
    'Vibration Amplitude',
    'Vibration Frequency',
    'Vibration Sum (XYZ)',
    'Temperature',
    'Pressure',
    'RPM',
    'Power Draw',
    'Sound Level'
  ],
  
  mapToGrid(data: ManufacturingSensorData[]): SixtyFourSquareGrid {
    return createManufacturingGrid(data);
  },
  
  extractSignature(grids: SixtyFourSquareGrid[]): TemporalSignature {
    return extractManufacturingSignature(grids);
  }
};
