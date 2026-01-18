/**
 * Live ELO Tracker
 * 
 * Continuously calculates and updates FIDE ELO estimates for En Pensent
 * compared against Stockfish 17's baseline of 3600-3700 ELO.
 * 
 * Uses official FIDE formulas with TCEC-calibrated D(P) values.
 */

import { getExpectedScore } from './eloCalculator';

// Stockfish 17 TCEC/CCRL calibrated ratings
export const STOCKFISH_17_ELO = {
  baseline: 3650,      // Mid-point estimate
  cloud: 3580,         // Lichess Cloud (cached, lower depth)
  localDepth20: 3200,  // WASM depth 20
  localDepth30: 3450,  // WASM depth 30  
  localDepth40: 3550,  // WASM depth 40
  localDepth50: 3620,  // WASM depth 50
  localDepth60: 3700,  // WASM depth 60 (maximum)
  unlimited: 3700,     // True unlimited (TCEC conditions)
} as const;

export interface LiveEloState {
  enPensentElo: number;
  stockfishElo: number;
  gamesAnalyzed: number;
  wins: number;
  losses: number;
  draws: number;
  performanceRating: number;
  confidenceInterval: [number, number];
  title: string;
  titleColor: string;
  vsStockfish: 'winning' | 'losing' | 'even';
  eloDifference: number;
}

export interface GameResult {
  enPensentCorrect: boolean;
  stockfishCorrect: boolean;
  stockfishDepth: number;
}

// FIDE D(P) table - maps win probability to rating difference
const FIDE_DP_TABLE: [number, number][] = [
  [1.00, 800], [0.99, 677], [0.98, 589], [0.97, 538], [0.96, 501],
  [0.95, 470], [0.94, 444], [0.93, 422], [0.92, 401], [0.91, 383],
  [0.90, 366], [0.89, 351], [0.88, 336], [0.87, 322], [0.86, 309],
  [0.85, 296], [0.84, 284], [0.83, 273], [0.82, 262], [0.81, 251],
  [0.80, 240], [0.79, 230], [0.78, 220], [0.77, 211], [0.76, 202],
  [0.75, 193], [0.74, 184], [0.73, 175], [0.72, 166], [0.71, 158],
  [0.70, 149], [0.69, 141], [0.68, 133], [0.67, 125], [0.66, 117],
  [0.65, 110], [0.64, 102], [0.63, 95], [0.62, 87], [0.61, 80],
  [0.60, 72], [0.59, 65], [0.58, 57], [0.57, 50], [0.56, 43],
  [0.55, 36], [0.54, 29], [0.53, 21], [0.52, 14], [0.51, 7],
  [0.50, 0]
];

/**
 * Get FIDE D(P) value from performance percentage
 */
function getDpFromPerformance(p: number): number {
  if (p <= 0) return -800;
  if (p >= 1) return 800;
  
  // Find closest entry in table
  for (let i = 0; i < FIDE_DP_TABLE.length; i++) {
    if (p >= FIDE_DP_TABLE[i][0]) {
      return FIDE_DP_TABLE[i][1];
    }
  }
  
  // Mirror for losses
  return -getDpFromPerformance(1 - p);
}

/**
 * Get Stockfish ELO based on analysis depth
 */
export function getStockfishEloForDepth(depth: number): number {
  if (depth >= 60) return STOCKFISH_17_ELO.unlimited;
  if (depth >= 50) return STOCKFISH_17_ELO.localDepth50;
  if (depth >= 40) return STOCKFISH_17_ELO.localDepth40;
  if (depth >= 30) return STOCKFISH_17_ELO.localDepth30;
  if (depth >= 20) return STOCKFISH_17_ELO.localDepth20;
  
  // Linear interpolation for other depths
  const baseElo = 2800;
  const maxElo = 3700;
  const ratio = Math.min(1, depth / 60);
  return Math.round(baseElo + (maxElo - baseElo) * ratio);
}

/**
 * Calculate FIDE performance rating
 */
export function calculatePerformanceRating(
  wins: number,
  losses: number,
  draws: number,
  opponentElo: number
): number {
  const totalGames = wins + losses + draws;
  if (totalGames === 0) return opponentElo;
  
  const score = wins + (draws * 0.5);
  const performance = score / totalGames;
  
  const dp = getDpFromPerformance(performance);
  return Math.round(opponentElo + dp);
}

/**
 * Get title based on ELO rating
 */
export function getEloTitle(elo: number): { title: string; color: string } {
  if (elo >= 3800) return { title: 'Transcendent', color: 'from-purple-400 via-pink-500 to-red-500' };
  if (elo >= 3700) return { title: 'Beyond Stockfish 17', color: 'from-yellow-400 via-amber-500 to-orange-500' };
  if (elo >= 3600) return { title: 'Stockfish 17 Equivalent', color: 'from-blue-400 to-cyan-500' };
  if (elo >= 3500) return { title: 'Super-GM Level', color: 'from-purple-500 to-violet-600' };
  if (elo >= 3400) return { title: 'Elite Engine', color: 'from-green-500 to-emerald-500' };
  if (elo >= 3200) return { title: 'Strong Engine', color: 'from-teal-500 to-cyan-500' };
  if (elo >= 3000) return { title: 'Master Level', color: 'from-blue-500 to-indigo-500' };
  if (elo >= 2800) return { title: 'Grandmaster', color: 'from-orange-500 to-red-500' };
  if (elo >= 2600) return { title: 'International Master', color: 'from-yellow-500 to-orange-500' };
  return { title: 'Strong Player', color: 'from-gray-400 to-gray-500' };
}

/**
 * Calculate confidence interval based on game count
 */
function calculateConfidenceInterval(elo: number, games: number): [number, number] {
  // Standard error decreases with sqrt of games
  const baseError = 200;
  const error = Math.round(baseError / Math.sqrt(Math.max(1, games / 10)));
  return [Math.max(2400, elo - error), elo + error];
}

/**
 * Create initial ELO state
 */
export function createInitialEloState(): LiveEloState {
  return {
    enPensentElo: 3400, // Starting estimate
    stockfishElo: STOCKFISH_17_ELO.baseline,
    gamesAnalyzed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    performanceRating: 3400,
    confidenceInterval: [3200, 3600],
    title: 'Elite Engine',
    titleColor: 'from-green-500 to-emerald-500',
    vsStockfish: 'even',
    eloDifference: 0,
  };
}

/**
 * Update ELO state after a game result
 */
export function updateEloState(
  state: LiveEloState,
  result: GameResult
): LiveEloState {
  const newState = { ...state };
  
  // Determine outcome
  // Win = En Pensent correct AND Stockfish wrong (or both correct with higher confidence)
  // Loss = Stockfish correct AND En Pensent wrong
  // Draw = Both correct or both wrong
  
  if (result.enPensentCorrect && !result.stockfishCorrect) {
    newState.wins++;
  } else if (!result.enPensentCorrect && result.stockfishCorrect) {
    newState.losses++;
  } else {
    newState.draws++;
  }
  
  newState.gamesAnalyzed++;
  
  // Get Stockfish ELO for this depth
  newState.stockfishElo = getStockfishEloForDepth(result.stockfishDepth);
  
  // Calculate performance rating
  newState.performanceRating = calculatePerformanceRating(
    newState.wins,
    newState.losses,
    newState.draws,
    newState.stockfishElo
  );
  
  // Update En Pensent ELO with momentum
  const k = newState.gamesAnalyzed < 30 ? 40 : 20;
  const score = (newState.wins + newState.draws * 0.5) / newState.gamesAnalyzed;
  const expected = getExpectedScore(state.enPensentElo, newState.stockfishElo);
  const actualChange = k * (score - expected);
  
  // Blend performance rating with incremental update
  const performanceWeight = Math.min(0.7, newState.gamesAnalyzed / 50);
  newState.enPensentElo = Math.round(
    newState.performanceRating * performanceWeight +
    (state.enPensentElo + actualChange) * (1 - performanceWeight)
  );
  
  // Ensure reasonable bounds
  newState.enPensentElo = Math.max(2400, Math.min(4000, newState.enPensentElo));
  
  // Calculate confidence interval
  newState.confidenceInterval = calculateConfidenceInterval(
    newState.enPensentElo,
    newState.gamesAnalyzed
  );
  
  // Get title
  const titleInfo = getEloTitle(newState.enPensentElo);
  newState.title = titleInfo.title;
  newState.titleColor = titleInfo.color;
  
  // Compare to Stockfish
  newState.eloDifference = newState.enPensentElo - newState.stockfishElo;
  if (newState.eloDifference > 50) {
    newState.vsStockfish = 'winning';
  } else if (newState.eloDifference < -50) {
    newState.vsStockfish = 'losing';
  } else {
    newState.vsStockfish = 'even';
  }
  
  return newState;
}

/**
 * Calculate ELO from benchmark results
 */
export function calculateEloFromBenchmark(
  hybridAccuracy: number,
  stockfishAccuracy: number,
  hybridWins: number,
  stockfishWins: number,
  bothCorrect: number,
  totalGames: number,
  averageDepth: number
): LiveEloState {
  const stockfishElo = getStockfishEloForDepth(averageDepth);
  
  // Calculate score (wins = 1, draws = 0.5, losses = 0)
  const draws = bothCorrect + (totalGames - hybridWins - stockfishWins - bothCorrect);
  const wins = hybridWins;
  const losses = stockfishWins;
  
  // Performance rating
  const performanceRating = calculatePerformanceRating(wins, losses, draws, stockfishElo);
  
  // Get title
  const titleInfo = getEloTitle(performanceRating);
  
  // Confidence interval
  const confidenceInterval = calculateConfidenceInterval(performanceRating, totalGames);
  
  // Vs Stockfish comparison
  const eloDifference = performanceRating - stockfishElo;
  let vsStockfish: 'winning' | 'losing' | 'even';
  if (eloDifference > 50) vsStockfish = 'winning';
  else if (eloDifference < -50) vsStockfish = 'losing';
  else vsStockfish = 'even';
  
  return {
    enPensentElo: performanceRating,
    stockfishElo,
    gamesAnalyzed: totalGames,
    wins,
    losses,
    draws,
    performanceRating,
    confidenceInterval,
    title: titleInfo.title,
    titleColor: titleInfo.color,
    vsStockfish,
    eloDifference,
  };
}

/**
 * Format ELO for display
 */
export function formatElo(elo: number): string {
  return Math.round(elo).toString();
}

/**
 * Get ELO comparison description
 */
export function getEloComparisonText(state: LiveEloState): string {
  const diff = Math.abs(state.eloDifference);
  
  if (state.vsStockfish === 'winning') {
    if (diff > 200) return `Dominating Stockfish 17 by +${diff} ELO`;
    if (diff > 100) return `Outperforming Stockfish 17 by +${diff} ELO`;
    return `Slightly ahead of Stockfish 17 (+${diff} ELO)`;
  } else if (state.vsStockfish === 'losing') {
    if (diff > 200) return `Behind Stockfish 17 by -${diff} ELO`;
    if (diff > 100) return `Trailing Stockfish 17 by -${diff} ELO`;
    return `Slightly behind Stockfish 17 (-${diff} ELO)`;
  }
  
  return 'Competitive with Stockfish 17';
}
