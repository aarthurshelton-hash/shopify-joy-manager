/**
 * Code Exchange Value Calculator
 * 
 * Patent-Pending: En Pensent™ Universal Exchange Value
 * 
 * Calculates the "worth" of code patterns in universal units,
 * enabling cross-domain value comparison:
 * - 1 Chess pattern unit ≈ X Code pattern units
 * - 1 Market pattern unit ≈ Y Code pattern units
 * 
 * This creates a unified "intelligence currency" that can
 * quantify the value of pattern recognition across domains.
 */

import { CodeFlowSignature } from './signatureExtractor';
import { CodeCategory, CodeDimension } from './types';

/**
 * Value factors that contribute to code worth
 */
export interface CodeValueFactors {
  // Pattern Recognition Value
  patternDensity: number;      // 0-100: How pattern-rich is the code?
  archetypeClarity: number;    // 0-100: How clearly defined is the archetype?
  signatureUniqueness: number; // 0-100: How unique is this fingerprint?
  
  // Strategic Value
  coreImportance: number;      // 0-100: Criticality to system function
  evolutionPotential: number;  // 0-100: Growth and improvement potential
  crossDomainValue: number;    // 0-100: Applicability across domains
  
  // Operational Value
  healthScore: number;         // 0-100: Current code health
  fixEfficiency: number;       // 0-100: How well issues get resolved
  velocityScore: number;       // 0-100: Development momentum
  
  // Network Value (Metcalfe's Law applied to code)
  integrationDepth: number;    // 0-100: How connected to other modules
  reusabilityFactor: number;   // 0-100: Potential for reuse
  knowledgeCapture: number;    // 0-100: Institutional knowledge encoded
}

/**
 * Complete exchange value assessment
 */
export interface CodeExchangeValue {
  /** Total exchange value in universal units */
  totalValue: number;
  
  /** Value breakdown by factor */
  factors: CodeValueFactors;
  
  /** Value per line of code */
  valuePerLoc: number;
  
  /** Value per pattern */
  valuePerPattern: number;
  
  /** Chess equivalent (how many chess patterns) */
  chessEquivalent: number;
  
  /** Market equivalent (how many market patterns) */
  marketEquivalent: number;
  
  /** Category-level values */
  categoryValues: Record<CodeCategory, number>;
  
  /** Dimension-level values */
  dimensionValues: Record<CodeDimension, number>;
  
  /** Confidence in the valuation */
  confidence: number;
  
  /** Trend direction */
  trend: 'appreciating' | 'stable' | 'depreciating';
}

// Universal exchange rates (calibrated through benchmarks)
const EXCHANGE_RATES = {
  // 1 code pattern ≈ 0.8 chess patterns (chess is more established)
  codeToChess: 0.8,
  // 1 code pattern ≈ 1.2 market patterns (code has more structure)
  codeToMarket: 1.2,
  // Base value per LOC (in universal units)
  baseLOCValue: 0.1,
  // Pattern multiplier
  patternMultiplier: 10,
  // Core SDK bonus
  coreSdkBonus: 2.0,
};

// Weight factors for value calculation
const VALUE_WEIGHTS = {
  patternRecognition: 0.35,
  strategic: 0.30,
  operational: 0.20,
  network: 0.15,
};

// Category importance weights
const CATEGORY_WEIGHTS: Record<CodeCategory, number> = {
  'core-sdk': 2.5,
  'chess-domain': 2.0,
  'market-domain': 2.0,
  'code-domain': 1.8,
  'hooks-stores': 1.5,
  'ui-components': 1.2,
  'pages-routes': 1.0,
  'utils-types': 0.8,
};

/**
 * Calculate the complete exchange value from a Code Flow Signature
 */
export function calculateCodeExchangeValue(
  signature: CodeFlowSignature,
  totalLoc: number,
  totalPatterns: number,
  previousValue?: CodeExchangeValue
): CodeExchangeValue {
  // Calculate individual factors
  const factors = calculateFactors(signature);
  
  // Calculate component values
  const patternRecognitionValue = calculatePatternRecognitionValue(factors);
  const strategicValue = calculateStrategicValue(factors);
  const operationalValue = calculateOperationalValue(factors);
  const networkValue = calculateNetworkValue(factors);
  
  // Weighted total
  const totalValue = 
    patternRecognitionValue * VALUE_WEIGHTS.patternRecognition +
    strategicValue * VALUE_WEIGHTS.strategic +
    operationalValue * VALUE_WEIGHTS.operational +
    networkValue * VALUE_WEIGHTS.network;
  
  // Scale by codebase size
  const sizeMultiplier = Math.log10(Math.max(1000, totalLoc)) / 4;
  const scaledValue = totalValue * sizeMultiplier * 1000;
  
  // Calculate per-unit values
  const valuePerLoc = totalLoc > 0 ? scaledValue / totalLoc : 0;
  const valuePerPattern = totalPatterns > 0 ? scaledValue / totalPatterns : 0;
  
  // Cross-domain equivalents
  const chessEquivalent = (scaledValue / 100) * EXCHANGE_RATES.codeToChess;
  const marketEquivalent = (scaledValue / 100) * EXCHANGE_RATES.codeToMarket;
  
  // Category breakdown
  const categoryValues = calculateCategoryValues(signature);
  
  // Dimension breakdown
  const dimensionValues = signature.metricGrid.byDimension;
  
  // Determine trend
  const trend = previousValue
    ? scaledValue > previousValue.totalValue * 1.02
      ? 'appreciating'
      : scaledValue < previousValue.totalValue * 0.98
        ? 'depreciating'
        : 'stable'
    : 'stable';
  
  // Confidence based on data completeness
  const confidence = calculateConfidence(signature, totalLoc);
  
  return {
    totalValue: Math.round(scaledValue * 100) / 100,
    factors,
    valuePerLoc: Math.round(valuePerLoc * 1000) / 1000,
    valuePerPattern: Math.round(valuePerPattern * 100) / 100,
    chessEquivalent: Math.round(chessEquivalent * 10) / 10,
    marketEquivalent: Math.round(marketEquivalent * 10) / 10,
    categoryValues,
    dimensionValues,
    confidence,
    trend,
  };
}

/**
 * Calculate all value factors from signature
 */
function calculateFactors(signature: CodeFlowSignature): CodeValueFactors {
  const grid = signature.metricGrid;
  
  return {
    // Pattern Recognition
    patternDensity: signature.intensity,
    archetypeClarity: Math.min(100, signature.intensity * 1.2),
    signatureUniqueness: calculateUniqueness(signature.fingerprint),
    
    // Strategic
    coreImportance: grid.byCategory['core-sdk'] || 50,
    evolutionPotential: signature.temporalFlow.velocity > 0 
      ? Math.min(100, 60 + signature.temporalFlow.velocity * 20)
      : Math.max(0, 60 + signature.temporalFlow.velocity * 10),
    crossDomainValue: calculateCrossDomainValue(signature),
    
    // Operational
    healthScore: grid.overallScore,
    fixEfficiency: Math.max(0, 100 - signature.criticalMoments.length * 15),
    velocityScore: 50 + signature.temporalFlow.velocity * 25,
    
    // Network
    integrationDepth: grid.byDimension['cohesion'] || 50,
    reusabilityFactor: (grid.byCategory['utils-types'] || 50) * 0.6 +
                       (grid.byCategory['hooks-stores'] || 50) * 0.4,
    knowledgeCapture: signature.intensity * 0.8,
  };
}

/**
 * Calculate pattern recognition value
 */
function calculatePatternRecognitionValue(factors: CodeValueFactors): number {
  return (
    factors.patternDensity * 0.4 +
    factors.archetypeClarity * 0.35 +
    factors.signatureUniqueness * 0.25
  );
}

/**
 * Calculate strategic value
 */
function calculateStrategicValue(factors: CodeValueFactors): number {
  return (
    factors.coreImportance * 0.4 +
    factors.evolutionPotential * 0.35 +
    factors.crossDomainValue * 0.25
  );
}

/**
 * Calculate operational value
 */
function calculateOperationalValue(factors: CodeValueFactors): number {
  return (
    factors.healthScore * 0.5 +
    factors.fixEfficiency * 0.25 +
    factors.velocityScore * 0.25
  );
}

/**
 * Calculate network value
 */
function calculateNetworkValue(factors: CodeValueFactors): number {
  return (
    factors.integrationDepth * 0.35 +
    factors.reusabilityFactor * 0.35 +
    factors.knowledgeCapture * 0.30
  );
}

/**
 * Calculate uniqueness score from fingerprint
 */
function calculateUniqueness(fingerprint: string): number {
  // Hash entropy as proxy for uniqueness
  const chars = new Set(fingerprint.split(''));
  const entropy = (chars.size / fingerprint.length) * 100;
  return Math.min(100, entropy * 2);
}

/**
 * Calculate cross-domain applicability
 */
function calculateCrossDomainValue(signature: CodeFlowSignature): number {
  // Higher if multiple domains are strong
  const grid = signature.metricGrid;
  const domainScores = [
    grid.byCategory['chess-domain'] || 0,
    grid.byCategory['market-domain'] || 0,
    grid.byCategory['code-domain'] || 0,
  ];
  
  const avgDomainScore = domainScores.reduce((a, b) => a + b, 0) / domainScores.length;
  const domainBalance = 100 - (Math.max(...domainScores) - Math.min(...domainScores));
  
  return (avgDomainScore * 0.6) + (domainBalance * 0.4);
}

/**
 * Calculate category-level values
 */
function calculateCategoryValues(
  signature: CodeFlowSignature
): Record<CodeCategory, number> {
  const result = {} as Record<CodeCategory, number>;
  
  for (const [cat, score] of Object.entries(signature.metricGrid.byCategory)) {
    const weight = CATEGORY_WEIGHTS[cat as CodeCategory] || 1.0;
    result[cat as CodeCategory] = Math.round(score * weight * 10) / 10;
  }
  
  return result;
}

/**
 * Calculate confidence in the valuation
 */
function calculateConfidence(signature: CodeFlowSignature, totalLoc: number): number {
  // More code = more confident
  const sizeConfidence = Math.min(100, (totalLoc / 10000) * 100);
  
  // More metrics filled = more confident
  const metricsCovered = signature.metricGrid.metrics.filter(m => m.value > 0).length;
  const coverageConfidence = (metricsCovered / 64) * 100;
  
  // Stronger intensity = more confident
  const intensityConfidence = signature.intensity;
  
  return Math.round(
    sizeConfidence * 0.3 +
    coverageConfidence * 0.4 +
    intensityConfidence * 0.3
  );
}
