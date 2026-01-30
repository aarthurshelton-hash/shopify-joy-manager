/**
 * Code Domain Types
 * 
 * 64-Metric Grid: 8 Dimensions × 8 Categories
 * Mirrors the Chess 64-square territorial analysis
 */

// ===================== 64-METRIC GRID =====================

/**
 * The 8 Core Dimensions of Code Analysis
 */
export type CodeDimension = 
  | 'complexity'    // How tangled is the logic?
  | 'cohesion'      // How well do modules work together?
  | 'coverage'      // How much is pattern-integrated?
  | 'velocity'      // How fast does it change?
  | 'quality'       // How healthy is the codebase?
  | 'architecture'  // How well structured?
  | 'performance'   // How efficient at runtime?
  | 'evolution';    // How is it growing over time?

/**
 * The 8 Categories within each Dimension
 */
export type CodeCategory = 
  | 'core-sdk'      // Pensent core modules
  | 'chess-domain'  // Chess-specific code
  | 'market-domain' // Market/finance code
  | 'code-domain'   // Code analysis code (meta!)
  | 'ui-components' // Visual components
  | 'hooks-stores'  // State management
  | 'pages-routes'  // Page-level code
  | 'utils-types';  // Utilities and types

/**
 * Single metric in the 64-metric grid
 */
export interface CodeMetric {
  dimension: CodeDimension;
  category: CodeCategory;
  value: number;        // 0-100 normalized
  rawValue: number;     // Original measurement
  weight: number;       // Importance multiplier
  trend: 'improving' | 'stable' | 'degrading';
}

/**
 * The complete 64-metric grid
 */
export interface CodeMetricGrid {
  metrics: CodeMetric[];
  timestamp: number;
  version: string;
  
  // Aggregated views
  byDimension: Record<CodeDimension, number>;
  byCategory: Record<CodeCategory, number>;
  
  // Overall score (weighted average)
  overallScore: number;
}

// ===================== TEMPORAL FLOW =====================

/**
 * How code health evolved over analysis phases
 */
export interface CodeTemporalFlow {
  /** Initial codebase state */
  baseline: number;
  /** After major refactors */
  postRefactor: number;
  /** Current state */
  current: number;
  /** Predicted future if trends continue */
  projected: number;
  /** Rate of change per analysis cycle */
  velocity: number;
}

// ===================== CRITICAL MOMENTS =====================

/**
 * Significant events in code evolution
 */
export interface CodeCriticalMoment {
  timestamp: number;
  type: 'major-refactor' | 'breaking-change' | 'performance-spike' | 
        'quality-drop' | 'coverage-jump' | 'architecture-shift';
  magnitude: number;
  description: string;
  affectedFiles: string[];
  resolution?: string;
}

// ===================== FILE ANALYSIS =====================

export interface FileAnalysis {
  path: string;
  category: CodeCategory;
  
  // Raw metrics
  linesOfCode: number;
  functionCount: number;
  exportCount: number;
  importCount: number;
  
  // Calculated scores
  complexity: 'low' | 'medium' | 'high' | 'critical';
  patternDensity: number;
  
  // En Pensent integration
  pensentScore: number;
  hasCoreSdkImport: boolean;
  hasPensentUIImport: boolean;
  
  // Issues
  issues: FileIssue[];
}

export interface FileIssue {
  type: 'low-density' | 'high-complexity' | 'missing-coverage' | 
        'refactor-needed' | 'performance-concern';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
}

// ===================== QUADRANT PROFILE =====================

/**
 * Maps to Chess quadrant concept:
 * - Core SDK = King's territory (critical to protect)
 * - UI = Queen's mobility (needs flexibility)
 * - Hooks/Stores = Rooks (structural power)
 * - Utils = Knights/Bishops (tactical support)
 */
export interface CodeQuadrantProfile {
  coreTerritory: number;    // SDK + Domain code health
  mobilityZone: number;     // UI component flexibility
  structuralPower: number;  // Hooks/Stores stability
  tacticalSupport: number;  // Utils/Types coverage
  center: number;           // Cross-cutting concerns
}

// ===================== PREDICTION TYPES =====================

export interface CodeFlowPrediction {
  trajectory: 'improving' | 'stable' | 'degrading' | 'critical';
  confidence: number;
  timeHorizon: string; // e.g., "30 days"
  
  risks: Array<{
    area: CodeCategory;
    likelihood: number;
    impact: string;
  }>;
  
  opportunities: Array<{
    area: CodeCategory;
    potential: number;
    action: string;
  }>;
}
