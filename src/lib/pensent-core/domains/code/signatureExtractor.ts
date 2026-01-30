/**
 * Code Flow Signature Extractor
 * 
 * Extracts the 64-metric signature from a codebase,
 * creating a unique fingerprint analogous to Chess Color Flow.
 * 
 * "Every codebase has a signature - we make it visible"
 */

import {
  CodeDimension,
  CodeCategory,
  CodeMetric,
  CodeMetricGrid,
  CodeTemporalFlow,
  CodeCriticalMoment,
  CodeQuadrantProfile,
  FileAnalysis,
} from './types';

// All 8 dimensions
const DIMENSIONS: CodeDimension[] = [
  'complexity', 'cohesion', 'coverage', 'velocity',
  'quality', 'architecture', 'performance', 'evolution'
];

// All 8 categories
const CATEGORIES: CodeCategory[] = [
  'core-sdk', 'chess-domain', 'market-domain', 'code-domain',
  'ui-components', 'hooks-stores', 'pages-routes', 'utils-types'
];

/**
 * Complete Code Flow Signature
 */
export interface CodeFlowSignature {
  /** Unique hash of the 64-metric state */
  fingerprint: string;
  
  /** The full 64-metric grid */
  metricGrid: CodeMetricGrid;
  
  /** Quadrant-based territorial view */
  quadrantProfile: CodeQuadrantProfile;
  
  /** Temporal evolution */
  temporalFlow: CodeTemporalFlow;
  
  /** Key inflection points */
  criticalMoments: CodeCriticalMoment[];
  
  /** Dominant characteristic */
  dominantDimension: CodeDimension;
  
  /** Strongest category */
  strongestCategory: CodeCategory;
  
  /** Weakest category (needs attention) */
  weakestCategory: CodeCategory;
  
  /** Overall intensity (0-100) */
  intensity: number;
  
  /** Extraction timestamp */
  extractedAt: number;
}

/**
 * Extract the complete Code Flow Signature from analyzed files
 */
export function extractCodeFlowSignature(
  files: FileAnalysis[],
  previousSignature?: CodeFlowSignature
): CodeFlowSignature {
  // Build the 64-metric grid
  const metricGrid = buildMetricGrid(files);
  
  // Calculate quadrant profile
  const quadrantProfile = calculateQuadrantProfile(metricGrid);
  
  // Determine temporal flow
  const temporalFlow = calculateTemporalFlow(metricGrid, previousSignature);
  
  // Find critical moments
  const criticalMoments = findCriticalMoments(files, previousSignature);
  
  // Determine dominant characteristics
  const { dominantDimension, strongestCategory, weakestCategory } = 
    findDominantCharacteristics(metricGrid);
  
  // Calculate overall intensity
  const intensity = calculateIntensity(metricGrid, files);
  
  // Generate unique fingerprint
  const fingerprint = generateFingerprint(metricGrid);
  
  return {
    fingerprint,
    metricGrid,
    quadrantProfile,
    temporalFlow,
    criticalMoments,
    dominantDimension,
    strongestCategory,
    weakestCategory,
    intensity,
    extractedAt: Date.now(),
  };
}

/**
 * Build the complete 64-metric grid
 */
function buildMetricGrid(files: FileAnalysis[]): CodeMetricGrid {
  const metrics: CodeMetric[] = [];
  
  // Generate all 64 combinations
  for (const dimension of DIMENSIONS) {
    for (const category of CATEGORIES) {
      const categoryFiles = files.filter(f => f.category === category);
      const metric = calculateMetric(dimension, category, categoryFiles, files);
      metrics.push(metric);
    }
  }
  
  // Aggregate by dimension
  const byDimension = {} as Record<CodeDimension, number>;
  for (const dim of DIMENSIONS) {
    const dimMetrics = metrics.filter(m => m.dimension === dim);
    byDimension[dim] = dimMetrics.reduce((sum, m) => sum + m.value * m.weight, 0) / 
                       dimMetrics.reduce((sum, m) => sum + m.weight, 0);
  }
  
  // Aggregate by category
  const byCategory = {} as Record<CodeCategory, number>;
  for (const cat of CATEGORIES) {
    const catMetrics = metrics.filter(m => m.category === cat);
    byCategory[cat] = catMetrics.reduce((sum, m) => sum + m.value * m.weight, 0) /
                      catMetrics.reduce((sum, m) => sum + m.weight, 0);
  }
  
  // Calculate overall score
  const overallScore = metrics.reduce((sum, m) => sum + m.value * m.weight, 0) /
                       metrics.reduce((sum, m) => sum + m.weight, 0);
  
  return {
    metrics,
    timestamp: Date.now(),
    version: '1.0.0',
    byDimension,
    byCategory,
    overallScore,
  };
}

/**
 * Calculate a single metric for a dimension/category combination
 */
function calculateMetric(
  dimension: CodeDimension,
  category: CodeCategory,
  categoryFiles: FileAnalysis[],
  allFiles: FileAnalysis[]
): CodeMetric {
  let rawValue = 0;
  let weight = 1.0;
  
  const totalLoc = categoryFiles.reduce((sum, f) => sum + f.linesOfCode, 0);
  const avgPatternDensity = categoryFiles.length > 0
    ? categoryFiles.reduce((sum, f) => sum + f.patternDensity, 0) / categoryFiles.length
    : 0;
  const criticalFiles = categoryFiles.filter(f => f.complexity === 'critical').length;
  const highComplexFiles = categoryFiles.filter(f => f.complexity === 'high').length;
  
  switch (dimension) {
    case 'complexity':
      // Lower is better - inverted for scoring
      rawValue = 100 - ((criticalFiles * 25) + (highComplexFiles * 10));
      weight = category === 'core-sdk' ? 1.5 : 1.0;
      break;
      
    case 'cohesion':
      // Based on import/export balance
      const avgImports = categoryFiles.length > 0
        ? categoryFiles.reduce((sum, f) => sum + f.importCount, 0) / categoryFiles.length
        : 0;
      rawValue = Math.max(0, 100 - (avgImports * 3));
      weight = category === 'hooks-stores' ? 1.3 : 1.0;
      break;
      
    case 'coverage':
      // Pattern density and SDK integration
      const sdkFiles = categoryFiles.filter(f => f.hasCoreSdkImport).length;
      const sdkRatio = categoryFiles.length > 0 ? sdkFiles / categoryFiles.length : 0;
      rawValue = (avgPatternDensity * 60) + (sdkRatio * 40);
      weight = category === 'core-sdk' ? 0.5 : 1.2; // Core SDK doesn't need to import itself
      break;
      
    case 'velocity':
      // Placeholder - would need git history
      rawValue = 50; // Neutral baseline
      weight = 0.8;
      break;
      
    case 'quality':
      // Based on issue count
      const issues = categoryFiles.reduce((sum, f) => sum + f.issues.length, 0);
      const criticalIssues = categoryFiles.reduce((sum, f) => 
        sum + f.issues.filter(i => i.severity === 'critical').length, 0);
      rawValue = Math.max(0, 100 - (issues * 5) - (criticalIssues * 15));
      weight = 1.2;
      break;
      
    case 'architecture':
      // Based on file count and distribution
      const fileRatio = allFiles.length > 0 
        ? categoryFiles.length / allFiles.length 
        : 0;
      // Penalize if any category is too large or too small
      const idealRatio = 1 / CATEGORIES.length;
      rawValue = 100 - Math.abs(fileRatio - idealRatio) * 500;
      weight = 1.0;
      break;
      
    case 'performance':
      // Based on LOC (larger files = potential performance concern)
      const avgLoc = categoryFiles.length > 0 ? totalLoc / categoryFiles.length : 0;
      rawValue = Math.max(0, 100 - (avgLoc / 5));
      weight = category === 'ui-components' ? 1.4 : 1.0;
      break;
      
    case 'evolution':
      // Growth trajectory - placeholder
      rawValue = 60;
      weight = 0.7;
      break;
  }
  
  return {
    dimension,
    category,
    value: Math.max(0, Math.min(100, rawValue)),
    rawValue,
    weight,
    trend: 'stable', // Would compare with previous
  };
}

/**
 * Calculate the quadrant profile (territorial view)
 */
function calculateQuadrantProfile(grid: CodeMetricGrid): CodeQuadrantProfile {
  return {
    coreTerritory: (
      (grid.byCategory['core-sdk'] || 0) * 0.4 +
      (grid.byCategory['chess-domain'] || 0) * 0.3 +
      (grid.byCategory['market-domain'] || 0) * 0.3
    ),
    mobilityZone: (
      (grid.byCategory['ui-components'] || 0) * 0.7 +
      (grid.byCategory['pages-routes'] || 0) * 0.3
    ),
    structuralPower: (
      (grid.byCategory['hooks-stores'] || 0) * 0.8 +
      (grid.byCategory['core-sdk'] || 0) * 0.2
    ),
    tacticalSupport: (
      (grid.byCategory['utils-types'] || 0) * 0.6 +
      (grid.byCategory['code-domain'] || 0) * 0.4
    ),
    center: grid.overallScore,
  };
}

/**
 * Calculate temporal flow from current and previous signatures
 */
function calculateTemporalFlow(
  grid: CodeMetricGrid,
  previous?: CodeFlowSignature
): CodeTemporalFlow {
  const current = grid.overallScore;
  const baseline = previous?.metricGrid.overallScore ?? current;
  const velocity = previous 
    ? (current - baseline) / ((Date.now() - previous.extractedAt) / (1000 * 60 * 60 * 24))
    : 0;
  
  return {
    baseline,
    postRefactor: baseline * 1.05, // Placeholder
    current,
    projected: Math.max(0, Math.min(100, current + velocity * 30)),
    velocity,
  };
}

/**
 * Find critical moments by comparing with previous state
 */
function findCriticalMoments(
  files: FileAnalysis[],
  previous?: CodeFlowSignature
): CodeCriticalMoment[] {
  const moments: CodeCriticalMoment[] = [];
  
  // Check for major complexity spikes
  const criticalFiles = files.filter(f => f.complexity === 'critical');
  if (criticalFiles.length > 3) {
    moments.push({
      timestamp: Date.now(),
      type: 'quality-drop',
      magnitude: criticalFiles.length * 10,
      description: `${criticalFiles.length} files with critical complexity detected`,
      affectedFiles: criticalFiles.map(f => f.path),
    });
  }
  
  // Check for low coverage areas
  const lowCoverage = files.filter(f => f.patternDensity < 0.2 && f.linesOfCode > 100);
  if (lowCoverage.length > 5) {
    moments.push({
      timestamp: Date.now(),
      type: 'coverage-jump',
      magnitude: lowCoverage.length * 5,
      description: `${lowCoverage.length} files need En Pensent integration`,
      affectedFiles: lowCoverage.map(f => f.path),
    });
  }
  
  return moments.slice(0, 5);
}

/**
 * Find the dominant characteristics
 */
function findDominantCharacteristics(grid: CodeMetricGrid): {
  dominantDimension: CodeDimension;
  strongestCategory: CodeCategory;
  weakestCategory: CodeCategory;
} {
  // Find best dimension
  let bestDim: CodeDimension = 'quality';
  let bestDimScore = 0;
  for (const [dim, score] of Object.entries(grid.byDimension)) {
    if (score > bestDimScore) {
      bestDimScore = score;
      bestDim = dim as CodeDimension;
    }
  }
  
  // Find best and worst categories
  let bestCat: CodeCategory = 'core-sdk';
  let worstCat: CodeCategory = 'utils-types';
  let bestCatScore = 0;
  let worstCatScore = 100;
  
  for (const [cat, score] of Object.entries(grid.byCategory)) {
    if (score > bestCatScore) {
      bestCatScore = score;
      bestCat = cat as CodeCategory;
    }
    if (score < worstCatScore) {
      worstCatScore = score;
      worstCat = cat as CodeCategory;
    }
  }
  
  return {
    dominantDimension: bestDim,
    strongestCategory: bestCat,
    weakestCategory: worstCat,
  };
}

/**
 * Calculate overall intensity
 */
function calculateIntensity(grid: CodeMetricGrid, files: FileAnalysis[]): number {
  const avgDensity = files.length > 0
    ? files.reduce((sum, f) => sum + f.patternDensity, 0) / files.length
    : 0;
  
  // Combine overall score with pattern density
  return (grid.overallScore * 0.6) + (avgDensity * 100 * 0.4);
}

/**
 * Generate unique fingerprint hash
 */
function generateFingerprint(grid: CodeMetricGrid): string {
  const values = grid.metrics.map(m => m.value.toFixed(1)).join('|');
  
  let hash = 0;
  for (let i = 0; i < values.length; i++) {
    const char = values.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `code-${Math.abs(hash).toString(36)}-${grid.timestamp.toString(36)}`;
}
