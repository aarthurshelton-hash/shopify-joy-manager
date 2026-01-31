/**
 * Supply Chain Domain Adapter
 * 
 * Maps logistics events, inventory levels, and transit data to 64-square
 * Color Flow Signatures for resilience analysis and bottleneck prediction.
 * 
 * The 8x8 grid represents:
 * - Rows: Time windows (8 sequential periods)
 * - Columns: Supply chain dimensions (inventory, transit, delays, demand, etc.)
 */

import { TemporalSignature, QuadrantProfile, TemporalFlow, CriticalMoment } from '../../types/core';
import { 
  SupplyChainEventData, 
  SupplyChainArchetype,
  SUPPLY_CHAIN_ARCHETYPES,
  SixtyFourSquareGrid,
  IndustryDataMapper 
} from './types';
import { generateFingerprint } from '../../signature/fingerprintGenerator';

// Color scale for supply chain (green = resilient, red = at risk)
const RESILIENCE_COLORS = {
  excellent: '#22c55e',
  good: '#84cc16',
  moderate: '#eab308',
  stressed: '#f97316',
  critical: '#ef4444',
  failing: '#dc2626'
};

function getResilienceColor(normalizedValue: number): string {
  // Inverse: lower values = higher resilience
  if (normalizedValue < 0.2) return RESILIENCE_COLORS.excellent;
  if (normalizedValue < 0.4) return RESILIENCE_COLORS.good;
  if (normalizedValue < 0.55) return RESILIENCE_COLORS.moderate;
  if (normalizedValue < 0.7) return RESILIENCE_COLORS.stressed;
  if (normalizedValue < 0.85) return RESILIENCE_COLORS.critical;
  return RESILIENCE_COLORS.failing;
}

/**
 * Normalize supply chain metric to 0-1 (higher = more risk)
 */
function normalizeMetric(value: number, min: number, max: number, invert: boolean = false): number {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return invert ? 1 - normalized : normalized;
}

/**
 * Map a single supply chain snapshot to a row in the 64-square grid
 */
function mapEventToRow(data: SupplyChainEventData): number[] {
  return [
    normalizeMetric(data.inventoryLevel, 0, 100, true), // Low inventory = high risk
    normalizeMetric(data.transitTime, 0, 168), // 0-168 hours, longer = riskier
    normalizeMetric(data.delays, 0, 10), // Number of delays
    normalizeMetric(data.demandForecast, 0, 200), // Demand pressure
    normalizeMetric(data.supplierReliability, 0, 1, true), // High reliability = low risk
    normalizeMetric(data.routeEfficiency, 0, 1, true), // High efficiency = low risk
    normalizeMetric(data.weatherImpact, 0, 1), // Weather disruption
    normalizeMetric(data.geopoliticalRisk ?? 0, 0, 1) // Geopolitical risk
  ];
}

/**
 * Create the 64-square grid from 8 sequential supply chain snapshots
 */
export function createSupplyChainGrid(samples: SupplyChainEventData[]): SixtyFourSquareGrid {
  const normalizedSamples = samples.slice(0, 8);
  while (normalizedSamples.length < 8) {
    normalizedSamples.push(normalizedSamples[normalizedSamples.length - 1] || samples[0]);
  }

  const cells: number[][] = normalizedSamples.map(mapEventToRow);
  const colorMap: string[][] = cells.map(row => row.map(getResilienceColor));

  const topLeft = cells.slice(0, 4).flatMap(r => r.slice(0, 4)).reduce((a, b) => a + b, 0) / 16;
  const topRight = cells.slice(0, 4).flatMap(r => r.slice(4, 8)).reduce((a, b) => a + b, 0) / 16;
  const bottomLeft = cells.slice(4, 8).flatMap(r => r.slice(0, 4)).reduce((a, b) => a + b, 0) / 16;
  const bottomRight = cells.slice(4, 8).flatMap(r => r.slice(4, 8)).reduce((a, b) => a + b, 0) / 16;

  return {
    cells,
    colorMap,
    quadrantColors: {
      topLeft: getResilienceColor(topLeft),
      topRight: getResilienceColor(topRight),
      bottomLeft: getResilienceColor(bottomLeft),
      bottomRight: getResilienceColor(bottomRight)
    },
    heatSignature: cells.flat().reduce((a, b) => a + b, 0) / 64,
    capturedAt: normalizedSamples[normalizedSamples.length - 1]?.timestamp || Date.now()
  };
}

/**
 * Classify supply chain pattern into archetype
 */
export function classifySupplyChainArchetype(
  grid: SixtyFourSquareGrid
): SupplyChainArchetype {
  const { cells, heatSignature } = grid;
  
  // Check supplier concentration (column 4)
  const supplierRisk = cells.map(row => row[4]).reduce((a, b) => a + b, 0) / 8;
  
  // Check demand amplification (bullwhip)
  const demandVariance = calculateVariance(cells.map(row => row[3]));
  
  // Check route efficiency trends
  const routeEfficiency = cells.map(row => row[5]).reduce((a, b) => a + b, 0) / 8;
  
  // Single point of failure detection
  if (supplierRisk > 0.7 && heatSignature > 0.5) {
    return SUPPLY_CHAIN_ARCHETYPES.find(a => a.id === 'single_point_failure')!;
  }
  
  // Bullwhip effect detection
  if (demandVariance > 0.15) {
    return SUPPLY_CHAIN_ARCHETYPES.find(a => a.id === 'bullwhip_cascade')!;
  }
  
  // Resilient network (all metrics healthy)
  if (heatSignature < 0.3 && supplierRisk < 0.3) {
    return SUPPLY_CHAIN_ARCHETYPES.find(a => a.id === 'resilient_network')!;
  }
  
  // Agile response (moderate risk but good efficiency)
  if (heatSignature < 0.5 && routeEfficiency < 0.4) {
    return SUPPLY_CHAIN_ARCHETYPES.find(a => a.id === 'agile_response')!;
  }
  
  return SUPPLY_CHAIN_ARCHETYPES.find(a => a.id === 'agile_response')!;
}

/**
 * Extract temporal signature from supply chain grid sequence
 */
export function extractSupplyChainSignature(grids: SixtyFourSquareGrid[]): TemporalSignature {
  if (grids.length === 0) throw new Error('At least one grid required');

  const latest = grids[grids.length - 1];
  const archetype = classifySupplyChainArchetype(latest);
  
  const cells = latest.cells;
  const quadrantProfile: QuadrantProfile = {
    q1: cells.slice(0, 4).flatMap(r => r.slice(0, 4)).reduce((a, b) => a + b, 0) / 16,
    q2: cells.slice(0, 4).flatMap(r => r.slice(4, 8)).reduce((a, b) => a + b, 0) / 16,
    q3: cells.slice(4, 8).flatMap(r => r.slice(0, 4)).reduce((a, b) => a + b, 0) / 16,
    q4: cells.slice(4, 8).flatMap(r => r.slice(4, 8)).reduce((a, b) => a + b, 0) / 16
  };

  const heatHistory = grids.map(g => g.heatSignature);
  const thirds = Math.floor(heatHistory.length / 3);
  
  const temporalFlow: TemporalFlow = {
    opening: heatHistory.slice(0, thirds).reduce((a, b) => a + b, 0) / thirds || 0,
    middle: heatHistory.slice(thirds, thirds * 2).reduce((a, b) => a + b, 0) / thirds || 0,
    ending: heatHistory.slice(thirds * 2).reduce((a, b) => a + b, 0) / (heatHistory.length - thirds * 2) || 0,
    trend: determineTrend(heatHistory),
    momentum: calculateMomentum(heatHistory)
  };

  const criticalMoments: CriticalMoment[] = detectCriticalMoments(grids);
  const fingerprint = generateFingerprint(quadrantProfile, temporalFlow, archetype.id, latest.heatSignature);

  return {
    fingerprint,
    archetype: archetype.name,
    dominantForce: archetype.resilienceScore > 0.5 ? 'primary' : 'secondary',
    flowDirection: temporalFlow.trend === 'accelerating' ? 'forward' : 
                   temporalFlow.trend === 'declining' ? 'backward' : 'lateral',
    intensity: latest.heatSignature,
    quadrantProfile,
    temporalFlow,
    criticalMoments,
    domainData: {
      industry: 'supply_chain',
      archetype,
      resilienceScore: archetype.resilienceScore,
      bottleneckRisk: archetype.bottleneckRisk,
      recommendedAction: archetype.recommendedAction,
      chessEquivalent: archetype.chessEquivalent
    }
  };
}

// Utility functions
function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
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
  return Math.max(-1, Math.min(1, 
    ((recent.reduce((a, b) => a + b, 0) / recent.length) - 
     (earlier.reduce((a, b) => a + b, 0) / earlier.length)) * 2
  ));
}

function detectCriticalMoments(grids: SixtyFourSquareGrid[]): CriticalMoment[] {
  const moments: CriticalMoment[] = [];
  const heatHistory = grids.map(g => g.heatSignature);
  
  for (let i = 1; i < heatHistory.length; i++) {
    const change = Math.abs(heatHistory[i] - heatHistory[i - 1]);
    if (change > 0.15) {
      moments.push({
        index: i,
        type: heatHistory[i] > heatHistory[i - 1] ? 'disruption' : 'recovery',
        severity: Math.min(1, change * 3),
        description: `Supply chain ${heatHistory[i] > heatHistory[i - 1] ? 'stress increased' : 'resilience improved'}`
      });
    }
  }
  
  return moments;
}

export const supplyChainMapper: IndustryDataMapper<SupplyChainEventData[]> = {
  vertical: 'supply_chain',
  name: 'Supply Chain Resilience Mapper',
  description: 'Maps logistics and inventory data to Color Flow Signatures for resilience prediction',
  
  rowDefinitions: [
    'Period T-7 (oldest)',
    'Period T-6',
    'Period T-5',
    'Period T-4',
    'Period T-3',
    'Period T-2',
    'Period T-1',
    'Period T-0 (now)'
  ],
  
  columnDefinitions: [
    'Inventory Level',
    'Transit Time',
    'Delay Count',
    'Demand Forecast',
    'Supplier Reliability',
    'Route Efficiency',
    'Weather Impact',
    'Geopolitical Risk'
  ],
  
  mapToGrid(data: SupplyChainEventData[]): SixtyFourSquareGrid {
    return createSupplyChainGrid(data);
  },
  
  extractSignature(grids: SixtyFourSquareGrid[]): TemporalSignature {
    return extractSupplyChainSignature(grids);
  }
};
