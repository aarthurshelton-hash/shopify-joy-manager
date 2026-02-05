/**
 * A/B Testing Framework for Enhanced Signature System
 * 
 * Compares 4-quadrant (baseline) vs 8-quadrant (enhanced) accuracy
 * Runs parallel predictions and tracks performance metrics
 */

import { simulateGame } from '../gameSimulator';
import { extractEnhancedColorFlowSignature, EnhancedQuadrantProfile, compareEnhancedProfiles } from './enhancedSignatureExtractor';
import { extractColorFlowSignature } from './signatureExtractor';
import { QuadrantProfile, TemporalFlow, ColorFlowSignature } from './types';

/**
 * A/B Test Result for a single game
 */
export interface ABTestResult {
  gameId: string;
  white: string;
  black: string;
  result: string;
  
  // Baseline (4-quadrant) prediction
  baseline: {
    archetype: string;
    confidence: number;
    quadrantProfile: QuadrantProfile;
    fingerprint: string;
    predictedResult: '1-0' | '0-1' | '1/2-1/2';
  };
  
  // Enhanced (8-quadrant) prediction
  enhanced: {
    archetype: string;
    confidence: number;
    quadrantProfile: EnhancedQuadrantProfile;
    fingerprint: string;
    predictedResult: '1-0' | '0-1' | '1/2-1/2';
    colorRichness: number;
    complexity: number;
  };
  
  // Comparison
  correctPrediction: {
    baseline: boolean;
    enhanced: boolean;
  };
  profileSimilarity: number; // 0-1, how similar are the profiles
  confidenceDelta: number;    // Enhanced - Baseline confidence
  archetypeMatch: boolean;    // Do both predict same archetype family
}

/**
 * Aggregate A/B Test Statistics
 */
export interface ABTestStatistics {
  totalGames: number;
  baselineAccuracy: number;
  enhancedAccuracy: number;
  accuracyImprovement: number; // percentage points
  
  // Confidence metrics
  avgBaselineConfidence: number;
  avgEnhancedConfidence: number;
  confidenceImprovement: number;
  
  // Archetype analysis
  archetypeMatchRate: number;
  mostImprovedArchetypes: Array<{ archetype: string; improvement: number }>;
  leastImprovedArchetypes: Array<{ archetype: string; improvement: number }>;
  
  // Enhanced-specific metrics
  avgColorRichness: number;
  avgComplexity: number;
  profileSimilarityAvg: number;
}

/**
 * Predict game result based on archetype (simplified heuristic)
 * Used for A/B testing - in production would use actual ML model
 */
function predictResultFromArchetype(
  archetype: string,
  quadrantProfile: QuadrantProfile | EnhancedQuadrantProfile,
  isEnhanced: boolean
): { result: '1-0' | '0-1' | '1/2-1/2'; confidence: number } {
  let whiteAdvantage = 0;
  let confidence = 0.5;
  
  if (isEnhanced) {
    const enhanced = quadrantProfile as EnhancedQuadrantProfile;
    
    // Calculate advantage from 8-quadrant profile
    whiteAdvantage += enhanced.q1_kingside_white * 0.3;
    whiteAdvantage += enhanced.q2_queenside_white * 0.3;
    whiteAdvantage -= enhanced.q3_kingside_black * 0.3;
    whiteAdvantage -= enhanced.q4_queenside_black * 0.3;
    whiteAdvantage += enhanced.q5_center_white * 0.4;
    whiteAdvantage -= enhanced.q6_center_black * 0.4;
    whiteAdvantage += enhanced.q7_extended_kingside * 0.2;
    whiteAdvantage += enhanced.q8_extended_queenside * 0.2;
    
    // Piece-type advantages
    if (enhanced.bishop_dominance > 0.35) {
      whiteAdvantage += 0.5;
      confidence += 0.1;
    }
    if (enhanced.knight_dominance > 0.40) {
      whiteAdvantage += 0.3;
      confidence += 0.05;
    }
    if (enhanced.pawn_advancement > 0.5) {
      whiteAdvantage += 0.4;
      confidence += 0.08;
    }
    
    // Archetype-specific adjustments
    if (archetype.includes('kingside') && archetype.includes('white')) {
      whiteAdvantage += 0.6;
      confidence += 0.15;
    } else if (archetype.includes('kingside') && archetype.includes('black')) {
      whiteAdvantage -= 0.6;
      confidence += 0.15;
    } else if (archetype.includes('queenside') && archetype.includes('white')) {
      whiteAdvantage += 0.4;
      confidence += 0.1;
    } else if (archetype.includes('queenside') && archetype.includes('black')) {
      whiteAdvantage -= 0.4;
      confidence += 0.1;
    }
  } else {
    // Baseline 4-quadrant calculation
    whiteAdvantage += (quadrantProfile as QuadrantProfile).kingsideWhite * 0.5;
    whiteAdvantage += (quadrantProfile as QuadrantProfile).queensideWhite * 0.4;
    whiteAdvantage -= (quadrantProfile as QuadrantProfile).kingsideBlack * 0.5;
    whiteAdvantage -= (quadrantProfile as QuadrantProfile).queensideBlack * 0.4;
    
    if (archetype.includes('kingside_attack')) {
      whiteAdvantage += 0.5;
      confidence += 0.1;
    } else if (archetype.includes('queenside_pressure')) {
      whiteAdvantage += 0.3;
      confidence += 0.08;
    } else if (archetype.includes('prophylactic')) {
      whiteAdvantage += 0.2;
      confidence += 0.05;
    }
  }
  
  // Determine result
  let result: '1-0' | '0-1' | '1/2-1/2';
  if (whiteAdvantage > 0.8) {
    result = '1-0';
    confidence += 0.15;
  } else if (whiteAdvantage < -0.8) {
    result = '0-1';
    confidence += 0.15;
  } else {
    result = '1/2-1/2';
  }
  
  // Cap confidence at 0.95
  confidence = Math.min(confidence, 0.95);
  
  return { result, confidence };
}

/**
 * Run A/B test on a single game
 */
export function runSingleABTest(
  gameId: string,
  pgn: string,
  actualResult: string
): ABTestResult {
  const simulation = simulateGame(pgn);
  
  // Baseline extraction (4-quadrant)
  const baselineSignature = extractColorFlowSignature(simulation.board, simulation.gameData, simulation.totalMoves);
  const baselinePrediction = predictResultFromArchetype(
    baselineSignature.archetype,
    baselineSignature.quadrantProfile,
    false
  );
  
  // Enhanced extraction (8-quadrant)
  const enhancedSignature = extractEnhancedColorFlowSignature(simulation);
  const enhancedPrediction = predictResultFromArchetype(
    enhancedSignature.archetype,
    enhancedSignature.quadrantProfile,
    true
  );
  
  // Compare profiles (convert baseline to enhanced format for comparison)
  const baselineAsEnhanced: EnhancedQuadrantProfile = {
    q1_kingside_white: baselineSignature.quadrantProfile.kingsideWhite || 0,
    q2_queenside_white: baselineSignature.quadrantProfile.queensideWhite || 0,
    q3_kingside_black: baselineSignature.quadrantProfile.kingsideBlack || 0,
    q4_queenside_black: baselineSignature.quadrantProfile.queensideBlack || 0,
    q5_center_white: baselineSignature.quadrantProfile.center > 0 ? baselineSignature.quadrantProfile.center : 0,
    q6_center_black: baselineSignature.quadrantProfile.center < 0 ? baselineSignature.quadrantProfile.center : 0,
    q7_extended_kingside: 0,
    q8_extended_queenside: 0,
    bishop_dominance: 0,
    knight_dominance: 0,
    rook_dominance: 0,
    queen_dominance: 0,
    pawn_advancement: 0,
    temporalFlow: {
      early: baselineSignature.temporalFlow ? (baselineSignature.temporalFlow.opening + baselineSignature.temporalFlow.middlegame) / 2 : 0,
      mid: baselineSignature.temporalFlow ? baselineSignature.temporalFlow.middlegame : 0,
      late: baselineSignature.temporalFlow ? baselineSignature.temporalFlow.endgame : 0,
    },
  };
  
  const profileSimilarity = compareEnhancedProfiles(
    baselineAsEnhanced,
    enhancedSignature.quadrantProfile
  );
  
  // Determine correctness
  const normalizeResult = (r: string): string => {
    if (r === '1-0' || r === '1-0 ') return '1-0';
    if (r === '0-1' || r === '0-1 ') return '0-1';
    if (r.includes('1/2')) return '1/2-1/2';
    if (r === '*') return 'unknown';
    return r;
  };
  
  const normalizedActual = normalizeResult(actualResult);
  const baselineCorrect = normalizeResult(baselinePrediction.result) === normalizedActual;
  const enhancedCorrect = normalizeResult(enhancedPrediction.result) === normalizedActual;
  
  // Check archetype family match
  const baselineFamily = baselineSignature.archetype.split('_')[0];
  const enhancedFamily = enhancedSignature.archetype.split('_')[0];
  const archetypeMatch = baselineFamily === enhancedFamily;
  
  return {
    gameId,
    white: simulation.gameData.white,
    black: simulation.gameData.black,
    result: actualResult,
    baseline: {
      archetype: baselineSignature.archetype,
      confidence: baselinePrediction.confidence,
      quadrantProfile: baselineSignature.quadrantProfile,
      fingerprint: baselineSignature.fingerprint,
      predictedResult: baselinePrediction.result,
    },
    enhanced: {
      archetype: enhancedSignature.archetype,
      confidence: enhancedPrediction.confidence,
      quadrantProfile: enhancedSignature.quadrantProfile,
      fingerprint: enhancedSignature.fingerprint,
      predictedResult: enhancedPrediction.result,
      colorRichness: enhancedSignature.colorRichness,
      complexity: enhancedSignature.complexity,
    },
    correctPrediction: {
      baseline: baselineCorrect,
      enhanced: enhancedCorrect,
    },
    profileSimilarity,
    confidenceDelta: enhancedPrediction.confidence - baselinePrediction.confidence,
    archetypeMatch,
  };
}

/**
 * Run batch A/B test on multiple games
 */
export function runBatchABTest(
  games: Array<{ gameId: string; pgn: string; result: string }>
): { results: ABTestResult[]; statistics: ABTestStatistics } {
  const results: ABTestResult[] = [];
  
  for (const game of games) {
    try {
      const testResult = runSingleABTest(game.gameId, game.pgn, game.result);
      results.push(testResult);
    } catch (e) {
      console.error(`Failed to process game ${game.gameId}:`, e);
    }
  }
  
  const statistics = calculateABTestStatistics(results);
  
  return { results, statistics };
}

/**
 * Calculate aggregate statistics from A/B test results
 */
export function calculateABTestStatistics(results: ABTestResult[]): ABTestStatistics {
  if (results.length === 0) {
    return {
      totalGames: 0,
      baselineAccuracy: 0,
      enhancedAccuracy: 0,
      accuracyImprovement: 0,
      avgBaselineConfidence: 0,
      avgEnhancedConfidence: 0,
      confidenceImprovement: 0,
      archetypeMatchRate: 0,
      mostImprovedArchetypes: [],
      leastImprovedArchetypes: [],
      avgColorRichness: 0,
      avgComplexity: 0,
      profileSimilarityAvg: 0,
    };
  }
  
  // Basic counts
  const totalGames = results.length;
  const baselineCorrect = results.filter(r => r.correctPrediction.baseline).length;
  const enhancedCorrect = results.filter(r => r.correctPrediction.enhanced).length;
  const archetypeMatches = results.filter(r => r.archetypeMatch).length;
  
  // Calculate averages
  const avgBaselineConfidence = results.reduce((sum, r) => sum + r.baseline.confidence, 0) / totalGames;
  const avgEnhancedConfidence = results.reduce((sum, r) => sum + r.enhanced.confidence, 0) / totalGames;
  const avgColorRichness = results.reduce((sum, r) => sum + r.enhanced.colorRichness, 0) / totalGames;
  const avgComplexity = results.reduce((sum, r) => sum + r.enhanced.complexity, 0) / totalGames;
  const profileSimilarityAvg = results.reduce((sum, r) => sum + r.profileSimilarity, 0) / totalGames;
  
  // Archetype-specific analysis
  const archetypeStats: Record<string, { baseline: number; enhanced: number; count: number }> = {};
  
  for (const result of results) {
    const arch = result.enhanced.archetype;
    if (!archetypeStats[arch]) {
      archetypeStats[arch] = { baseline: 0, enhanced: 0, count: 0 };
    }
    archetypeStats[arch].count++;
    if (result.correctPrediction.baseline) archetypeStats[arch].baseline++;
    if (result.correctPrediction.enhanced) archetypeStats[arch].enhanced++;
  }
  
  // Calculate improvements per archetype
  const archetypeImprovements = Object.entries(archetypeStats)
    .filter(([, stats]) => stats.count >= 3) // Need at least 3 samples
    .map(([archetype, stats]) => ({
      archetype,
      improvement: (stats.enhanced / stats.count) - (stats.baseline / stats.count),
    }))
    .sort((a, b) => b.improvement - a.improvement);
  
  return {
    totalGames,
    baselineAccuracy: (baselineCorrect / totalGames) * 100,
    enhancedAccuracy: (enhancedCorrect / totalGames) * 100,
    accuracyImprovement: ((enhancedCorrect - baselineCorrect) / totalGames) * 100,
    avgBaselineConfidence,
    avgEnhancedConfidence,
    confidenceImprovement: avgEnhancedConfidence - avgBaselineConfidence,
    archetypeMatchRate: (archetypeMatches / totalGames) * 100,
    mostImprovedArchetypes: archetypeImprovements.slice(0, 5),
    leastImprovedArchetypes: archetypeImprovements.slice(-5).reverse(),
    avgColorRichness,
    avgComplexity,
    profileSimilarityAvg,
  };
}

/**
 * Generate A/B test report
 */
export function generateABTestReport(statistics: ABTestStatistics): string {
  const improvement = statistics.accuracyImprovement >= 0 
    ? `+${statistics.accuracyImprovement.toFixed(1)}%` 
    : `${statistics.accuracyImprovement.toFixed(1)}%`;
  
  return `
╔══════════════════════════════════════════════════════════════╗
║         ENHANCED SIGNATURE A/B TEST RESULTS                   ║
╠══════════════════════════════════════════════════════════════╣
║ Games Tested:       ${statistics.totalGames.toString().padEnd(35)} ║
║                                                               ║
║ BASELINE (4-Quadrant)    vs    ENHANCED (8-Quadrant)          ║
║ ───────────────────────────────────────────────────────────── ║
║ Accuracy:     ${statistics.baselineAccuracy.toFixed(1)}%    →    ${statistics.enhancedAccuracy.toFixed(1)}%    (${improvement})            ║
║ Confidence:   ${(statistics.avgBaselineConfidence * 100).toFixed(1)}%   →   ${(statistics.avgEnhancedConfidence * 100).toFixed(1)}%   (${(statistics.confidenceImprovement * 100).toFixed(1)}%)            ║
║                                                               ║
║ ENHANCED METRICS:                                             ║
║ ───────────────────────────────────────────────────────────── ║
║ Color Richness:     ${(statistics.avgColorRichness * 100).toFixed(1)}% (12 piece types utilized)            ║
║ Complexity:         ${statistics.avgComplexity.toFixed(2)} (visits per square)                 ║
║ Profile Similarity: ${(statistics.profileSimilarityAvg * 100).toFixed(1)}% (vs baseline)                     ║
║ Archetype Match:    ${statistics.archetypeMatchRate.toFixed(1)}% (same family)                    ║
║                                                               ║
║ TOP IMPROVEMENTS:                                               ║
${statistics.mostImprovedArchetypes.slice(0, 3).map(a => 
  `║   • ${a.archetype.padEnd(25)} +${(a.improvement * 100).toFixed(1)}%                  ║`
).join('\n')}
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
`;
}

/**
 * Export results for further analysis
 */
export function exportABTestResults(
  results: ABTestResult[],
  filename: string
): void {
  const jsonData = JSON.stringify(results, null, 2);
  
  // In Node.js environment, would write to file
  // For browser, return data for download
  if (typeof window !== 'undefined') {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default {
  runSingleABTest,
  runBatchABTest,
  calculateABTestStatistics,
  generateABTestReport,
  exportABTestResults,
};
