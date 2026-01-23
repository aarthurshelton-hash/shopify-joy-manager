/**
 * Opponent Modeling - v7.53-ACCURACY
 * 
 * Weights predictions based on player tendencies and style DNA.
 * Different players respond to the same position differently.
 */

export type PlayStyle = 
  | 'tactical'      // Calculates deeply, seeks complications
  | 'positional'    // Slow maneuvering, structure focus
  | 'aggressive'    // Always attacks, sacrifices
  | 'solid'         // Avoids risk, draws acceptable
  | 'universal'     // Adapts to opponent
  | 'unknown';

export interface PlayerProfile {
  id: string;
  name?: string;
  elo: number;
  style: PlayStyle;
  
  // Statistical tendencies
  winRateWhite: number;
  winRateBlack: number;
  drawRate: number;
  
  // Behavioral patterns
  timeManagement: 'fast' | 'normal' | 'slow';
  riskTolerance: number;  // 0-1, higher = more risk-seeking
  
  // Opening preferences
  preferredOpenings: string[];
  avoidedOpenings: string[];
}

/**
 * Style matchup matrix - how styles interact
 * Positive = first style has advantage
 */
export const STYLE_MATCHUPS: Record<PlayStyle, Record<PlayStyle, number>> = {
  tactical: {
    tactical: 0,
    positional: -0.05,
    aggressive: 0.1,
    solid: -0.1,
    universal: 0,
    unknown: 0,
  },
  positional: {
    tactical: 0.05,
    positional: 0,
    aggressive: 0.15,
    solid: -0.05,
    universal: 0,
    unknown: 0,
  },
  aggressive: {
    tactical: -0.1,
    positional: -0.15,
    aggressive: 0,
    solid: -0.2,
    universal: -0.05,
    unknown: 0,
  },
  solid: {
    tactical: 0.1,
    positional: 0.05,
    aggressive: 0.2,
    solid: 0,
    universal: 0.05,
    unknown: 0,
  },
  universal: {
    tactical: 0,
    positional: 0,
    aggressive: 0.05,
    solid: -0.05,
    universal: 0,
    unknown: 0,
  },
  unknown: {
    tactical: 0,
    positional: 0,
    aggressive: 0,
    solid: 0,
    universal: 0,
    unknown: 0,
  },
};

/**
 * Infer playing style from ELO and limited data
 */
export function inferPlayStyle(
  elo: number,
  winRate: number,
  drawRate: number
): PlayStyle {
  // High draw rate suggests solid/positional
  if (drawRate > 0.35) {
    return winRate > 0.4 ? 'positional' : 'solid';
  }
  
  // Very high win rate at high ELO = universal
  if (elo > 2600 && winRate > 0.55) {
    return 'universal';
  }
  
  // High win rate, low draws = aggressive/tactical
  if (winRate > 0.5 && drawRate < 0.2) {
    return 'aggressive';
  }
  
  // Moderate stats = tactical
  if (winRate > 0.4) {
    return 'tactical';
  }
  
  return 'unknown';
}

/**
 * Create player profile from basic data
 */
export function createPlayerProfile(
  id: string,
  elo: number,
  name?: string,
  stats?: { wins: number; losses: number; draws: number }
): PlayerProfile {
  const total = stats ? stats.wins + stats.losses + stats.draws : 0;
  const winRateWhite = stats && total > 0 ? stats.wins / total : 0.45;
  const drawRate = stats && total > 0 ? stats.draws / total : 0.25;
  
  return {
    id,
    name,
    elo,
    style: inferPlayStyle(elo, winRateWhite, drawRate),
    winRateWhite,
    winRateBlack: winRateWhite * 0.9, // Black typically lower
    drawRate,
    timeManagement: elo > 2400 ? 'normal' : 'fast',
    riskTolerance: elo > 2500 ? 0.4 : 0.6,
    preferredOpenings: [],
    avoidedOpenings: [],
  };
}

/**
 * Calculate style matchup adjustment
 */
export function getStyleMatchupAdjustment(
  whiteProfile: PlayerProfile,
  blackProfile: PlayerProfile
): number {
  const baseMatchup = STYLE_MATCHUPS[whiteProfile.style][blackProfile.style];
  
  // ELO difference adjustment
  const eloDiff = whiteProfile.elo - blackProfile.elo;
  const eloAdjustment = Math.tanh(eloDiff / 400) * 0.1;
  
  return baseMatchup + eloAdjustment;
}

/**
 * Adjust win probabilities based on player profiles
 */
export function adjustProbabilitiesForProfiles(
  baseWhiteWin: number,
  baseBlackWin: number,
  baseDraw: number,
  whiteProfile: PlayerProfile,
  blackProfile: PlayerProfile
): { whiteWin: number; blackWin: number; draw: number } {
  const matchupAdj = getStyleMatchupAdjustment(whiteProfile, blackProfile);
  
  // Adjust based on matchup
  let whiteWin = baseWhiteWin + matchupAdj;
  let blackWin = baseBlackWin - matchupAdj;
  let draw = baseDraw;
  
  // Style-specific draw rate adjustments
  if (whiteProfile.style === 'solid' || blackProfile.style === 'solid') {
    draw += 0.05;
    whiteWin -= 0.025;
    blackWin -= 0.025;
  }
  
  if (whiteProfile.style === 'aggressive' && blackProfile.style === 'aggressive') {
    draw -= 0.1;
    // Split the removed draw probability
    whiteWin += 0.05;
    blackWin += 0.05;
  }
  
  // Normalize to ensure sum = 1
  const total = whiteWin + blackWin + draw;
  return {
    whiteWin: Math.max(0, Math.min(1, whiteWin / total)),
    blackWin: Math.max(0, Math.min(1, blackWin / total)),
    draw: Math.max(0, Math.min(1, draw / total)),
  };
}

/**
 * Predict which player is more likely to blunder under pressure
 */
export function predictBlunderProbability(
  profile: PlayerProfile,
  timeRemaining: number,
  positionComplexity: number
): number {
  // Base blunder rate inversely related to ELO
  const baseRate = Math.max(0.01, 0.15 - (profile.elo / 20000));
  
  // Time pressure multiplier
  const timePressure = timeRemaining < 60 ? 2.0 : 
                       timeRemaining < 180 ? 1.5 : 1.0;
  
  // Complexity multiplier
  const complexityMultiplier = 1 + (positionComplexity * 0.5);
  
  // Style adjustment
  const styleMultiplier = profile.style === 'tactical' ? 0.8 :
                          profile.style === 'aggressive' ? 1.2 :
                          profile.style === 'solid' ? 0.7 : 1.0;
  
  return Math.min(0.5, baseRate * timePressure * complexityMultiplier * styleMultiplier);
}
