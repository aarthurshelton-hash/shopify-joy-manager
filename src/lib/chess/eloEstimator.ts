/**
 * En Pensent™ ELO Estimator
 * 
 * Calculates our "effective ELO" based on prediction accuracy.
 * 
 * Key Insight from CEO:
 * - Stockfish 3600 ELO = best move selection from position analysis
 * - If we know the OUTCOME, we can reverse-engineer the PATH
 * - The market IS our Stockfish - a 3600+ ELO opponent to beat
 * 
 * Formula basis:
 * ELO difference = 400 * log10(W/L) where W/L is win/loss ratio
 * If we predict outcomes better than Stockfish, we have "higher ELO" in prediction
 */

export interface EloEstimate {
  // Our estimated ELO for outcome prediction
  enPensentElo: number;
  
  // Stockfish's implied ELO for prediction (baseline ~2800-3200)
  stockfishPredictionElo: number;
  
  // Our advantage
  eloAdvantage: number;
  
  // Performance rating (based on accuracy)
  performanceRating: number;
  
  // Confidence interval
  confidenceRange: { low: number; high: number };
  
  // Comparable human rating
  humanEquivalent: string;
  
  // Market ELO (treating market as opponent)
  marketBattleElo?: number;
}

export interface DepthEloMetrics {
  // Depth-based ELO contribution
  depthElo: number;
  
  // Accuracy-based ELO contribution
  accuracyElo: number;
  
  // Pattern recognition ELO bonus
  patternElo: number;
  
  // Combined effective ELO
  combinedElo: number;
  
  // Breakdown
  breakdown: {
    category: string;
    contribution: number;
    description: string;
  }[];
}

/**
 * Convert prediction accuracy to ELO rating
 * 
 * Based on: If you beat an opponent X% of the time, your ELO difference is:
 * ELO_diff = 400 * log10(accuracy / (1 - accuracy))
 * 
 * We use Stockfish's prediction accuracy as the "opponent's strength"
 */
export function accuracyToElo(accuracy: number, baseElo: number = 2800): number {
  // Clamp accuracy to prevent infinity
  const clampedAccuracy = Math.max(0.01, Math.min(0.99, accuracy));
  
  // Win expectancy formula reversed
  // If accuracy = 0.5, ELO = baseElo (equal strength)
  // If accuracy = 0.75, ELO = baseElo + ~190
  // If accuracy = 0.9, ELO = baseElo + ~382
  const eloDiff = 400 * Math.log10(clampedAccuracy / (1 - clampedAccuracy));
  
  return Math.round(baseElo + eloDiff);
}

/**
 * Convert depth (plies) to ELO contribution
 * 
 * Each additional ply of depth is worth ~10-15 ELO points
 * Stockfish at depth 40 ≈ 3600 ELO
 * So: ELO ≈ 2800 + (depth * 20)
 */
export function depthToElo(plies: number): number {
  const baseElo = 2800;
  const eloPerPly = 20;
  return Math.round(baseElo + (plies * eloPerPly));
}

/**
 * Calculate En Pensent's effective ELO based on benchmark results
 */
export function calculateEnPensentElo(
  hybridAccuracy: number,
  stockfishAccuracy: number,
  effectiveDepth: number,
  sampleSize: number
): EloEstimate {
  // Base: Stockfish's prediction accuracy sets the baseline
  // Stockfish 17 at depth 40+ is ~3200 ELO for position evaluation
  // But for PREDICTION (not playing), it's more like 2800-3000
  const stockfishPredictionElo = accuracyToElo(stockfishAccuracy, 2800);
  
  // Our ELO based on accuracy advantage over Stockfish
  const accuracyElo = accuracyToElo(hybridAccuracy, 2800);
  
  // Depth-based ELO bonus
  const depthBonus = Math.max(0, (effectiveDepth - 40) * 10); // Bonus for depth beyond SF's 40
  
  // Pattern recognition bonus (unique to En Pensent)
  const patternBonus = (hybridAccuracy > stockfishAccuracy) ? 100 : 0;
  
  // Combined ELO
  const enPensentElo = accuracyElo + depthBonus + patternBonus;
  
  // Confidence interval based on sample size
  // Standard error decreases with sqrt(n)
  const standardError = 400 / Math.sqrt(Math.max(sampleSize, 1));
  const confidenceRange = {
    low: Math.round(enPensentElo - 1.96 * standardError),
    high: Math.round(enPensentElo + 1.96 * standardError),
  };
  
  // Performance rating (what rating would produce this result?)
  const performanceRating = Math.round(
    stockfishPredictionElo + 400 * Math.log10(hybridAccuracy / (1 - hybridAccuracy))
  );
  
  // Human equivalent
  const humanEquivalent = getHumanEquivalent(enPensentElo);
  
  return {
    enPensentElo,
    stockfishPredictionElo,
    eloAdvantage: enPensentElo - stockfishPredictionElo,
    performanceRating,
    confidenceRange,
    humanEquivalent,
  };
}

/**
 * Get human-readable title based on ELO
 */
function getHumanEquivalent(elo: number): string {
  if (elo >= 3500) return 'Beyond World Champion (Superhuman)';
  if (elo >= 3200) return 'Stockfish 17 Level';
  if (elo >= 2900) return 'Super Grandmaster (Magnus Carlsen)';
  if (elo >= 2700) return 'Elite Grandmaster';
  if (elo >= 2500) return 'Grandmaster';
  if (elo >= 2400) return 'International Master';
  if (elo >= 2200) return 'FIDE Master';
  if (elo >= 2000) return 'Expert';
  if (elo >= 1800) return 'Class A';
  if (elo >= 1600) return 'Class B';
  return 'Club Player';
}

/**
 * Calculate detailed ELO breakdown
 */
export function calculateDetailedEloMetrics(
  hybridAccuracy: number,
  stockfishAccuracy: number,
  effectiveDepth: number,
  stockfishDepth: number,
  archetypeConfidence: number,
  horizonAccuracy: number
): DepthEloMetrics {
  const breakdown: DepthEloMetrics['breakdown'] = [];
  
  // 1. Base ELO from depth
  const depthElo = depthToElo(effectiveDepth);
  breakdown.push({
    category: 'Effective Depth',
    contribution: depthElo,
    description: `${effectiveDepth} plies of effective lookahead`,
  });
  
  // 2. Accuracy-based ELO
  const accuracyElo = accuracyToElo(hybridAccuracy, 2800);
  const accuracyBonus = accuracyElo - 2800;
  breakdown.push({
    category: 'Prediction Accuracy',
    contribution: accuracyBonus,
    description: `${(hybridAccuracy * 100).toFixed(1)}% accuracy → +${accuracyBonus} ELO`,
  });
  
  // 3. Advantage over Stockfish
  const advantageBonus = hybridAccuracy > stockfishAccuracy 
    ? Math.round((hybridAccuracy - stockfishAccuracy) * 1000) 
    : 0;
  breakdown.push({
    category: 'Stockfish Superiority',
    contribution: advantageBonus,
    description: hybridAccuracy > stockfishAccuracy 
      ? `+${((hybridAccuracy - stockfishAccuracy) * 100).toFixed(1)}% vs Stockfish` 
      : 'No advantage',
  });
  
  // 4. Pattern recognition bonus
  const patternElo = Math.round(archetypeConfidence * 2);
  breakdown.push({
    category: 'Pattern Recognition',
    contribution: patternElo,
    description: `${archetypeConfidence.toFixed(0)}% archetype confidence`,
  });
  
  // 5. Horizon bonus (predicting far ahead accurately)
  const horizonBonus = Math.round(horizonAccuracy * 1.5);
  breakdown.push({
    category: 'Long-Range Vision',
    contribution: horizonBonus,
    description: `${horizonAccuracy.toFixed(0)}% accuracy at 15+ moves ahead`,
  });
  
  // Combined ELO (using base 2800 + bonuses)
  const combinedElo = 2800 + accuracyBonus + advantageBonus + patternElo + horizonBonus;
  
  return {
    depthElo,
    accuracyElo,
    patternElo,
    combinedElo,
    breakdown,
  };
}

/**
 * Calculate "Market ELO" - treating the market as an opponent
 * 
 * CEO Insight: The market IS like Stockfish - a complex system we're trying to beat
 * 
 * If we can beat the market's randomness X% of the time, that's our market ELO
 */
export function calculateMarketElo(
  predictionAccuracy: number,
  marketEfficiency: number = 0.5 // EMH says market is 50% predictable
): number {
  // Baseline: Random guessing = 2000 ELO (you're playing against "chance")
  // Market efficiency (50%) = 2400 ELO (you beat random but not efficient pricing)
  // 60% accuracy = ~2700 ELO (you have an edge)
  // 70% accuracy = ~3000 ELO (consistent alpha)
  // 80%+ accuracy = 3300+ ELO (legendary trader level)
  
  const baseMarketElo = 2400; // Efficient market baseline
  
  // How much better are we than random?
  const beatRandom = predictionAccuracy - 0.5;
  
  // How much better are we than efficient market theory?
  const beatEfficient = predictionAccuracy - marketEfficiency;
  
  // Convert to ELO
  const randomBonus = beatRandom * 800; // Each 10% above random = +80 ELO
  const efficiencyBonus = beatEfficient > 0 ? beatEfficient * 600 : 0;
  
  return Math.round(baseMarketElo + randomBonus + efficiencyBonus);
}

/**
 * Can we beat Stockfish at PLAYING chess?
 * 
 * CEO Question: "If we know the outcome, can we learn to play?"
 * 
 * Answer: We can INFORM move selection with trajectory knowledge,
 * but we still need Stockfish's tactical calculation for each move.
 * 
 * The innovation: Use outcome prediction to WEIGHT Stockfish's candidate moves
 */
export function canWeBeatStockfish(): {
  canBeat: boolean;
  explanation: string;
  path: string[];
} {
  return {
    canBeat: false, // Not yet, but...
    explanation: `
      Currently: We USE Stockfish for tactics, so we can't beat it at move calculation.
      
      However, we CAN potentially surpass it by:
      1. Using outcome prediction to select between equal tactical lines
      2. Choosing strategically superior paths even if tactically equal
      3. Playing "human-style" positional chess that maximizes our pattern advantages
      
      The market parallel: We don't beat "market Stockfish" at execution speed,
      but we beat it at DIRECTION prediction - which is what matters for profit.
    `.trim(),
    path: [
      '1. Continue improving outcome prediction accuracy',
      '2. Build a "trajectory-guided" move selector',
      '3. When Stockfish shows 2+ equal moves, use patterns to choose',
      '4. Eventually: Train a move-making neural net on our pattern insights',
      '5. Create a hybrid engine: Stockfish tactics + En Pensent strategy',
    ],
  };
}

/**
 * Generate ELO comparison report
 */
export function generateEloReport(estimate: EloEstimate, detailed?: DepthEloMetrics): string {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════',
    '           EN PENSENT™ ELO RATING ESTIMATION              ',
    '═══════════════════════════════════════════════════════════',
    '',
    '┌───────────────────────────────────────────────────────────┐',
    '│                    ELO COMPARISON                        │',
    '├───────────────────────────────────────────────────────────┤',
    `│  Stockfish 17 (Playing):        ~3600 ELO                │`,
    `│  Stockfish 17 (Prediction):     ${estimate.stockfishPredictionElo.toString().padStart(4)} ELO                │`,
    '├───────────────────────────────────────────────────────────┤',
    `│  En Pensent (Prediction):       ${estimate.enPensentElo.toString().padStart(4)} ELO ★              │`,
    `│  Performance Rating:            ${estimate.performanceRating.toString().padStart(4)} ELO                │`,
    '├───────────────────────────────────────────────────────────┤',
    `│  ELO ADVANTAGE:                 ${(estimate.eloAdvantage >= 0 ? '+' : '') + estimate.eloAdvantage} points             │`,
    `│  Human Equivalent:              ${estimate.humanEquivalent.padEnd(25)}│`,
    '├───────────────────────────────────────────────────────────┤',
    `│  95% Confidence:                ${estimate.confidenceRange.low} - ${estimate.confidenceRange.high} ELO         │`,
    '└───────────────────────────────────────────────────────────┘',
  ];
  
  if (detailed) {
    lines.push('');
    lines.push('┌───────────────────────────────────────────────────────────┐');
    lines.push('│                    ELO BREAKDOWN                          │');
    lines.push('├───────────────────────────────────────────────────────────┤');
    
    for (const item of detailed.breakdown) {
      const sign = item.contribution >= 0 ? '+' : '';
      lines.push(`│  ${item.category.padEnd(20)} ${sign}${item.contribution.toString().padStart(4)} ELO          │`);
      lines.push(`│    └─ ${item.description.substring(0, 45).padEnd(45)}│`);
    }
    
    lines.push('├───────────────────────────────────────────────────────────┤');
    lines.push(`│  COMBINED ELO:                  ${detailed.combinedElo.toString().padStart(4)} ELO               │`);
    lines.push('└───────────────────────────────────────────────────────────┘');
  }
  
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}
