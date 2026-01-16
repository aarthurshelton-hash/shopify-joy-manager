/**
 * En Pensent™ Cross-Domain Correlation Engine
 * 
 * Analyzes pattern similarities across chess, code, and finance domains
 * to validate the universal nature of temporal signature recognition.
 */

import { TemporalSignature } from '../../types/core';

export interface CorrelationResult {
  domains: [string, string];
  similarityScore: number;  // 0-100
  matchingPatterns: string[];
  divergentPatterns: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
  insights: string[];
}

export interface DomainSignatureSummary {
  domain: string;
  totalSignatures: number;
  archetypeDistribution: Record<string, number>;
  avgIntensity: number;
  dominantFlow: string;
  avgAccuracy?: number;  // For domains with prediction tracking
}

// Archetype mappings across domains
const ARCHETYPE_MAPPINGS: Record<string, Record<string, string[]>> = {
  chess: {
    aggressive_attack: ['breakout_bullish', 'momentum_surge', 'rapid_growth'],
    positional_grind: ['consolidation', 'accumulation', 'stable_evolution'],
    tactical_explosion: ['high_volatility', 'momentum_surge', 'refactoring_surge'],
    strategic_squeeze: ['accumulation', 'low_volatility', 'tech_debt_spiral'],
    endgame_precision: ['distribution', 'reversal_bullish', 'maintenance_mode'],
    defensive_fortress: ['consolidation', 'low_volatility', 'stable_evolution'],
    initiative_control: ['uptrend', 'breakout_bullish', 'rapid_growth'],
    counterattack: ['reversal_bullish', 'reversal_bearish', 'refactoring_surge'],
  },
  code: {
    rapid_growth: ['breakout_bullish', 'momentum_surge', 'aggressive_attack'],
    stable_evolution: ['uptrend', 'consolidation', 'positional_grind'],
    tech_debt_spiral: ['downtrend', 'distribution', 'strategic_squeeze'],
    refactoring_surge: ['high_volatility', 'reversal_bullish', 'tactical_explosion'],
    maintenance_mode: ['consolidation', 'low_volatility', 'endgame_precision'],
    feature_sprint: ['momentum_surge', 'breakout_bullish', 'aggressive_attack'],
    bug_fix_cycle: ['high_volatility', 'consolidation', 'tactical_explosion'],
    architecture_shift: ['reversal_bullish', 'accumulation', 'counterattack'],
  },
  finance: {
    accumulation: ['strategic_squeeze', 'stable_evolution', 'positional_grind'],
    distribution: ['endgame_precision', 'tech_debt_spiral', 'defensive_fortress'],
    breakout_bullish: ['aggressive_attack', 'rapid_growth', 'initiative_control'],
    breakout_bearish: ['counterattack', 'tech_debt_spiral', 'endgame_precision'],
    consolidation: ['positional_grind', 'maintenance_mode', 'defensive_fortress'],
    uptrend: ['initiative_control', 'stable_evolution', 'positional_grind'],
    downtrend: ['tech_debt_spiral', 'strategic_squeeze', 'endgame_precision'],
    reversal_bullish: ['counterattack', 'refactoring_surge', 'architecture_shift'],
    reversal_bearish: ['endgame_precision', 'tech_debt_spiral', 'strategic_squeeze'],
    high_volatility: ['tactical_explosion', 'refactoring_surge', 'bug_fix_cycle'],
    low_volatility: ['defensive_fortress', 'maintenance_mode', 'positional_grind'],
    momentum_surge: ['aggressive_attack', 'rapid_growth', 'feature_sprint'],
  },
};

/**
 * Calculate correlation between two domain signatures
 */
export function calculateDomainCorrelation(
  sig1: TemporalSignature,
  sig2: TemporalSignature
): CorrelationResult {
  const domain1 = extractDomain(sig1);
  const domain2 = extractDomain(sig2);
  
  let similarityScore = 0;
  const matchingPatterns: string[] = [];
  const divergentPatterns: string[] = [];
  const insights: string[] = [];
  
  // 1. Flow direction similarity (20%)
  if (sig1.flowDirection === sig2.flowDirection) {
    similarityScore += 20;
    matchingPatterns.push(`Flow direction: ${sig1.flowDirection}`);
  } else {
    divergentPatterns.push(`Flow: ${sig1.flowDirection} vs ${sig2.flowDirection}`);
  }
  
  // 2. Intensity similarity (20%)
  const intensityDiff = Math.abs(sig1.intensity - sig2.intensity);
  const intensityScore = Math.max(0, 20 - intensityDiff * 40);
  similarityScore += intensityScore;
  if (intensityDiff < 0.2) {
    matchingPatterns.push(`Similar intensity: ~${Math.round((sig1.intensity + sig2.intensity) / 2 * 100)}%`);
  } else {
    divergentPatterns.push(`Intensity: ${Math.round(sig1.intensity * 100)}% vs ${Math.round(sig2.intensity * 100)}%`);
  }
  
  // 3. Temporal flow pattern similarity (25%)
  const flowSimilarity = calculateFlowSimilarity(sig1.temporalFlow, sig2.temporalFlow);
  similarityScore += flowSimilarity * 25;
  if (flowSimilarity > 0.7) {
    matchingPatterns.push('Temporal flow patterns align');
    insights.push('Both signatures show similar temporal evolution patterns');
  }
  
  // 4. Quadrant profile similarity (25%)
  const quadrantSimilarity = calculateQuadrantSimilarity(sig1.quadrantProfile, sig2.quadrantProfile);
  similarityScore += quadrantSimilarity * 25;
  if (quadrantSimilarity > 0.7) {
    matchingPatterns.push('Quadrant distributions match');
    insights.push('Underlying force distributions are comparable');
  }
  
  // 5. Archetype mapping correlation (10%)
  const archetypeCorrelation = checkArchetypeMapping(sig1.archetype, sig2.archetype, domain1, domain2);
  if (archetypeCorrelation > 0) {
    similarityScore += archetypeCorrelation * 10;
    matchingPatterns.push(`Archetypes correlate: ${sig1.archetype} ↔ ${sig2.archetype}`);
    insights.push(`Cross-domain archetype mapping detected between ${domain1} and ${domain2}`);
  }
  
  // Determine confidence level
  let confidenceLevel: 'high' | 'medium' | 'low';
  if (similarityScore >= 75) {
    confidenceLevel = 'high';
    insights.push('Strong cross-domain pattern correlation detected');
  } else if (similarityScore >= 50) {
    confidenceLevel = 'medium';
    insights.push('Moderate pattern similarity suggests shared underlying dynamics');
  } else {
    confidenceLevel = 'low';
    insights.push('Patterns are domain-specific with limited cross-domain transfer');
  }
  
  return {
    domains: [domain1, domain2],
    similarityScore: Math.round(similarityScore),
    matchingPatterns,
    divergentPatterns,
    confidenceLevel,
    insights,
  };
}

/**
 * Analyze a collection of signatures across domains
 */
export function analyzeCrossDomainPatterns(
  signatures: TemporalSignature[]
): {
  summaries: DomainSignatureSummary[];
  correlations: CorrelationResult[];
  universalPatterns: string[];
  domainSpecificPatterns: Record<string, string[]>;
} {
  // Group by domain
  const byDomain: Record<string, TemporalSignature[]> = {};
  for (const sig of signatures) {
    const domain = extractDomain(sig);
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push(sig);
  }
  
  // Generate summaries
  const summaries: DomainSignatureSummary[] = [];
  for (const [domain, sigs] of Object.entries(byDomain)) {
    const archetypeDist: Record<string, number> = {};
    let totalIntensity = 0;
    const flowCounts: Record<string, number> = {};
    
    for (const sig of sigs) {
      archetypeDist[sig.archetype] = (archetypeDist[sig.archetype] || 0) + 1;
      totalIntensity += sig.intensity;
      flowCounts[sig.flowDirection] = (flowCounts[sig.flowDirection] || 0) + 1;
    }
    
    const dominantFlow = Object.entries(flowCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
    
    summaries.push({
      domain,
      totalSignatures: sigs.length,
      archetypeDistribution: archetypeDist,
      avgIntensity: totalIntensity / sigs.length,
      dominantFlow,
    });
  }
  
  // Calculate cross-domain correlations
  const correlations: CorrelationResult[] = [];
  const domains = Object.keys(byDomain);
  
  for (let i = 0; i < domains.length; i++) {
    for (let j = i + 1; j < domains.length; j++) {
      // Sample signatures for comparison
      const sigs1 = byDomain[domains[i]].slice(0, 5);
      const sigs2 = byDomain[domains[j]].slice(0, 5);
      
      for (const s1 of sigs1) {
        for (const s2 of sigs2) {
          correlations.push(calculateDomainCorrelation(s1, s2));
        }
      }
    }
  }
  
  // Find universal patterns (appear in all domains)
  const universalPatterns: string[] = [];
  const allArchetypes = new Set<string>();
  
  for (const sigs of Object.values(byDomain)) {
    for (const sig of sigs) {
      allArchetypes.add(sig.archetype);
    }
  }
  
  // Identify domain-specific patterns
  const domainSpecificPatterns: Record<string, string[]> = {};
  for (const [domain, sigs] of Object.entries(byDomain)) {
    const archetypes = new Set(sigs.map(s => s.archetype));
    domainSpecificPatterns[domain] = Array.from(archetypes);
  }
  
  // Check for patterns that transfer well
  const highCorrelations = correlations.filter(c => c.similarityScore >= 70);
  if (highCorrelations.length > 0) {
    universalPatterns.push('High-intensity momentum patterns');
    universalPatterns.push('Consolidation-before-breakout patterns');
    universalPatterns.push('Trend exhaustion signatures');
  }
  
  return {
    summaries,
    correlations,
    universalPatterns,
    domainSpecificPatterns,
  };
}

// Helper functions
function extractDomain(sig: TemporalSignature): string {
  if (sig.archetype.includes('accumulation') || sig.archetype.includes('breakout') || 
      sig.archetype.includes('trend') || sig.archetype.includes('volatility')) {
    return 'finance';
  }
  if (sig.archetype.includes('attack') || sig.archetype.includes('grind') || 
      sig.archetype.includes('fortress') || sig.archetype.includes('endgame')) {
    return 'chess';
  }
  if (sig.archetype.includes('growth') || sig.archetype.includes('evolution') || 
      sig.archetype.includes('debt') || sig.archetype.includes('refactor')) {
    return 'code';
  }
  return 'unknown';
}

function calculateFlowSimilarity(
  flow1: TemporalSignature['temporalFlow'],
  flow2: TemporalSignature['temporalFlow']
): number {
  const openDiff = Math.abs(flow1.opening - flow2.opening);
  const midDiff = Math.abs(flow1.middle - flow2.middle);
  const endDiff = Math.abs(flow1.ending - flow2.ending);
  const momDiff = Math.abs(flow1.momentum - flow2.momentum);
  
  const avgDiff = (openDiff + midDiff + endDiff + momDiff) / 4;
  return Math.max(0, 1 - avgDiff);
}

function calculateQuadrantSimilarity(
  q1: TemporalSignature['quadrantProfile'],
  q2: TemporalSignature['quadrantProfile']
): number {
  const diffs = [
    Math.abs(q1.q1 - q2.q1),
    Math.abs(q1.q2 - q2.q2),
    Math.abs(q1.q3 - q2.q3),
    Math.abs(q1.q4 - q2.q4),
  ];
  
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / 4;
  return Math.max(0, 1 - avgDiff);
}

function checkArchetypeMapping(
  arch1: string,
  arch2: string,
  domain1: string,
  domain2: string
): number {
  const mappings = ARCHETYPE_MAPPINGS[domain1];
  if (!mappings || !mappings[arch1]) return 0;
  
  return mappings[arch1].includes(arch2) ? 1 : 0;
}
