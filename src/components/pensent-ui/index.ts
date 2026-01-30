/**
 * Pensent UI Components
 * 
 * Reusable visualization components for temporal signatures,
 * archetype displays, and pattern overlays.
 * 
 * These components work across all domain adapters (chess, code, market, future domains).
 * 
 * Patent-Pending: En Pensent™ Universal Pattern Recognition
 */

// Core visualizations
export { ArchetypeBadge, type ArchetypeBadgeProps, type ArchetypeCategory } from './ArchetypeBadge';
export { TemporalFlowChart, type TemporalFlowChartProps, type TemporalFlowData } from './TemporalFlowChart';
export { QuadrantRadar, type QuadrantRadarProps, type QuadrantData } from './QuadrantRadar';
export { SignatureOverlay, type SignatureOverlayProps, type SignatureData } from './SignatureOverlay';
export { PredictionGauge, type PredictionGaugeProps } from './PredictionGauge';
export { SignatureComparison, type SignatureComparisonProps } from './SignatureComparison';

// 64-Metric Code Domain visualizations
export { MetricGrid64, type MetricGrid64Props } from './MetricGrid64';
export { ExchangeValueDisplay, type ExchangeValueDisplayProps, type ExchangeValue } from './ExchangeValueDisplay';
export { CodeHealthGauge, type CodeHealthGaugeProps, type CodeHealthData } from './CodeHealthGauge';
export { ArchetypeEvolutionPath, type ArchetypeEvolutionPathProps } from './ArchetypeEvolutionPath';
