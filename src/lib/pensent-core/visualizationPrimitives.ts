/**
 * En Pensent Core SDK - Visualization Primitives
 * 
 * Universal visualization data structures and utilities that can be used
 * by any domain to render pattern analysis results.
 */

import { 
  TemporalSignature, 
  QuadrantProfile, 
  TemporalFlow,
  CriticalMoment 
} from './types';

// ===================== VISUALIZATION DATA TYPES =====================

/**
 * Normalized data point for any time-series visualization
 */
export interface TimeSeriesPoint {
  /** Position in sequence (0-1 normalized or absolute index) */
  position: number;
  /** Value at this position (typically 0-1 normalized) */
  value: number;
  /** Optional label for the point */
  label?: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Data for radar/spider chart visualizations
 */
export interface RadarChartData {
  axes: Array<{
    id: string;
    label: string;
    value: number; // 0-1 normalized
    maxValue?: number;
  }>;
  /** Optional comparison dataset */
  comparison?: Array<{
    id: string;
    value: number;
  }>;
}

/**
 * Data for heat map visualizations
 */
export interface HeatMapData {
  rows: number;
  cols: number;
  cells: Array<{
    row: number;
    col: number;
    value: number; // 0-1 intensity
    label?: string;
  }>;
  /** Row labels */
  rowLabels?: string[];
  /** Column labels */
  colLabels?: string[];
}

/**
 * Data for flow/timeline visualizations
 */
export interface FlowChartData {
  phases: Array<{
    id: string;
    label: string;
    value: number;
    startPosition: number;
    endPosition: number;
  }>;
  transitions: Array<{
    from: string;
    to: string;
    magnitude: number;
  }>;
  trend: 'accelerating' | 'declining' | 'stable' | 'volatile';
}

/**
 * Data for gauge/meter visualizations
 */
export interface GaugeData {
  value: number; // 0-1 or 0-100
  min: number;
  max: number;
  thresholds?: Array<{
    value: number;
    color: string;
    label: string;
  }>;
  label: string;
  unit?: string;
}

/**
 * Complete visualization bundle for a signature
 */
export interface SignatureVisualizationData {
  quadrantRadar: RadarChartData;
  temporalFlow: FlowChartData;
  intensityGauge: GaugeData;
  confidenceGauge: GaugeData;
  criticalMomentTimeline: TimeSeriesPoint[];
  heatMap?: HeatMapData;
}

// ===================== TRANSFORMATION FUNCTIONS =====================

/**
 * Transform quadrant profile to radar chart data
 */
export function quadrantToRadarData(
  profile: QuadrantProfile,
  labels?: { q1?: string; q2?: string; q3?: string; q4?: string }
): RadarChartData {
  return {
    axes: [
      {
        id: 'q1',
        label: labels?.q1 ?? 'Quadrant 1',
        value: profile.q1,
        maxValue: 1
      },
      {
        id: 'q2',
        label: labels?.q2 ?? 'Quadrant 2',
        value: profile.q2,
        maxValue: 1
      },
      {
        id: 'q3',
        label: labels?.q3 ?? 'Quadrant 3',
        value: profile.q3,
        maxValue: 1
      },
      {
        id: 'q4',
        label: labels?.q4 ?? 'Quadrant 4',
        value: profile.q4,
        maxValue: 1
      }
    ]
  };
}

/**
 * Transform temporal flow to flow chart data
 */
export function temporalFlowToChartData(
  flow: TemporalFlow,
  phaseLabels?: { opening?: string; middle?: string; ending?: string }
): FlowChartData {
  return {
    phases: [
      {
        id: 'opening',
        label: phaseLabels?.opening ?? 'Opening Phase',
        value: flow.opening,
        startPosition: 0,
        endPosition: 0.33
      },
      {
        id: 'middle',
        label: phaseLabels?.middle ?? 'Middle Phase',
        value: flow.middle,
        startPosition: 0.33,
        endPosition: 0.66
      },
      {
        id: 'ending',
        label: phaseLabels?.ending ?? 'Ending Phase',
        value: flow.ending,
        startPosition: 0.66,
        endPosition: 1
      }
    ],
    transitions: [
      {
        from: 'opening',
        to: 'middle',
        magnitude: Math.abs(flow.middle - flow.opening)
      },
      {
        from: 'middle',
        to: 'ending',
        magnitude: Math.abs(flow.ending - flow.middle)
      }
    ],
    trend: flow.trend
  };
}

/**
 * Transform critical moments to timeline points
 */
export function criticalMomentsToTimeline(
  moments: CriticalMoment[],
  totalLength?: number
): TimeSeriesPoint[] {
  const normalizer = totalLength ?? Math.max(...moments.map(m => m.index), 1);
  
  return moments.map(moment => ({
    position: moment.index / normalizer,
    value: moment.severity,
    label: moment.description,
    metadata: {
      type: moment.type,
      index: moment.index
    }
  }));
}

/**
 * Create intensity gauge data from signature
 */
export function createIntensityGauge(
  intensity: number,
  label?: string
): GaugeData {
  return {
    value: intensity * 100,
    min: 0,
    max: 100,
    thresholds: [
      { value: 30, color: 'hsl(var(--success))', label: 'Low' },
      { value: 60, color: 'hsl(var(--warning))', label: 'Moderate' },
      { value: 100, color: 'hsl(var(--destructive))', label: 'High' }
    ],
    label: label ?? 'Intensity',
    unit: '%'
  };
}

/**
 * Create confidence gauge data
 */
export function createConfidenceGauge(
  confidence: number,
  label?: string
): GaugeData {
  return {
    value: confidence * 100,
    min: 0,
    max: 100,
    thresholds: [
      { value: 40, color: 'hsl(var(--destructive))', label: 'Low' },
      { value: 70, color: 'hsl(var(--warning))', label: 'Moderate' },
      { value: 100, color: 'hsl(var(--success))', label: 'High' }
    ],
    label: label ?? 'Confidence',
    unit: '%'
  };
}

/**
 * Generate complete visualization data from a signature
 */
export function signatureToVisualizationData(
  signature: TemporalSignature,
  options?: {
    quadrantLabels?: { q1?: string; q2?: string; q3?: string; q4?: string };
    phaseLabels?: { opening?: string; middle?: string; ending?: string };
    totalSequenceLength?: number;
  }
): SignatureVisualizationData {
  return {
    quadrantRadar: quadrantToRadarData(signature.quadrantProfile, options?.quadrantLabels),
    temporalFlow: temporalFlowToChartData(signature.temporalFlow, options?.phaseLabels),
    intensityGauge: createIntensityGauge(signature.intensity),
    confidenceGauge: createConfidenceGauge(signature.temporalFlow.momentum > 0 ? 0.7 : 0.5),
    criticalMomentTimeline: criticalMomentsToTimeline(
      signature.criticalMoments,
      options?.totalSequenceLength
    )
  };
}

// ===================== COLOR UTILITIES =====================

/**
 * Color scale configuration for visualizations
 */
export interface ColorScale {
  min: string;
  mid: string;
  max: string;
  neutral?: string;
}

export const DEFAULT_COLOR_SCALE: ColorScale = {
  min: 'hsl(var(--destructive))',
  mid: 'hsl(var(--warning))',
  max: 'hsl(var(--success))',
  neutral: 'hsl(var(--muted))'
};

/**
 * Get color for a value based on a color scale
 */
export function getColorForValue(
  value: number,
  scale: ColorScale = DEFAULT_COLOR_SCALE
): string {
  if (value < 0.33) return scale.min;
  if (value < 0.66) return scale.mid;
  return scale.max;
}

/**
 * Get semantic color for confidence level
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.7) return 'hsl(var(--success))';
  if (confidence >= 0.4) return 'hsl(var(--warning))';
  return 'hsl(var(--destructive))';
}

/**
 * Get semantic color for intensity level
 */
export function getIntensityColor(intensity: number): string {
  if (intensity >= 0.7) return 'hsl(var(--destructive))';
  if (intensity >= 0.4) return 'hsl(var(--warning))';
  return 'hsl(var(--success))';
}

// ===================== FORMATTING UTILITIES =====================

/**
 * Format a decimal value as a percentage string
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format trend for display
 */
export function formatTrend(trend: TemporalFlow['trend']): string {
  const trendLabels: Record<TemporalFlow['trend'], string> = {
    accelerating: '↑ Accelerating',
    declining: '↓ Declining',
    stable: '→ Stable',
    volatile: '↕ Volatile'
  };
  return trendLabels[trend] ?? trend;
}

/**
 * Format archetype for display (convert snake_case to Title Case)
 */
export function formatArchetype(archetype: string): string {
  return archetype
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format flow direction for display
 */
export function formatFlowDirection(direction: string): string {
  const directionLabels: Record<string, string> = {
    ascending: '↗ Ascending',
    descending: '↘ Descending',
    lateral: '→ Lateral',
    chaotic: '⟳ Chaotic',
    balanced: '⟷ Balanced',
    kingside: '→ Kingside',
    queenside: '← Queenside',
    central: '◎ Central'
  };
  return directionLabels[direction] ?? direction;
}

/**
 * Format dominant force for display
 */
export function formatDominantForce(force: string): string {
  const forceLabels: Record<string, string> = {
    primary: '● Primary',
    secondary: '○ Secondary',
    balanced: '◐ Balanced',
    white: '○ White',
    black: '● Black'
  };
  return forceLabels[force] ?? force;
}

// ===================== ANIMATION UTILITIES =====================

/**
 * Animation configuration for visualizations
 */
export interface AnimationConfig {
  duration: number;
  delay: number;
  easing: string;
  stagger?: number;
}

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: 0.5,
  delay: 0,
  easing: 'easeOut',
  stagger: 0.1
};

/**
 * Create staggered animation delays for a list of items
 */
export function createStaggeredDelays(
  count: number,
  baseDelay: number = 0,
  stagger: number = 0.1
): number[] {
  return Array.from({ length: count }, (_, i) => baseDelay + (i * stagger));
}
