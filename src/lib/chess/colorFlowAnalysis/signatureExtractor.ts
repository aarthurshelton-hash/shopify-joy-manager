/**
 * Color Flow Signature Extractor
 * 
 * Core signature extraction from board visualization data
 */

import { SquareData, GameData } from '../gameSimulator';
import { 
  ColorFlowSignature, 
  QuadrantProfile, 
  TemporalFlow, 
  CriticalMoment,
  StrategicArchetype 
} from './types';

/**
 * Extract the complete Color Flow Signature from a visualization
 */
export function extractColorFlowSignature(
  board: SquareData[][],
  gameData: GameData,
  totalMoves: number
): ColorFlowSignature {
  // Generate fingerprint hash
  const fingerprint = generateColorFingerprint(board);
  
  // Calculate quadrant profile
  const quadrantProfile = calculateQuadrantProfile(board);
  
  // Determine flow direction
  const flowDirection = determineFlowDirection(quadrantProfile);
  
  // Calculate temporal flow from move progression
  const temporalFlow = calculateTemporalFlow(board, totalMoves);
  
  // Find critical color shift moments
  const criticalMoments = findCriticalMoments(board, totalMoves);
  
  // Classify strategic archetype
  const archetype = classifyArchetype(quadrantProfile, temporalFlow, criticalMoments, totalMoves);
  
  // Calculate overall intensity
  const intensity = calculateOverallIntensity(board);
  
  // Determine dominant side
  const dominantSide = determineDominantSide(quadrantProfile);
  
  return {
    fingerprint,
    dominantSide,
    flowDirection,
    intensity,
    archetype,
    quadrantProfile,
    temporalFlow,
    criticalMoments,
  };
}

/**
 * Generate a unique fingerprint hash from the board color state
 */
function generateColorFingerprint(board: SquareData[][]): string {
  const colorMap: string[] = [];
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file];
      const visitCount = square.visits.length;
      const dominantColor = square.visits.length > 0 
        ? square.visits[square.visits.length - 1].color 
        : 'x';
      colorMap.push(`${visitCount}${dominantColor}`);
    }
  }
  
  const mapString = colorMap.join('');
  let hash = 0;
  for (let i = 0; i < mapString.length; i++) {
    const char = mapString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `cf-${Math.abs(hash).toString(36)}`;
}

/**
 * Calculate color dominance in each board quadrant
 */
function calculateQuadrantProfile(board: SquareData[][]): QuadrantProfile {
  let kingsideWhite = 0, kingsideBlack = 0;
  let queensideWhite = 0, queensideBlack = 0;
  let center = 0;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file];
      
      let whiteVisits = 0, blackVisits = 0;
      for (const visit of square.visits) {
        if (visit.color === 'w') whiteVisits++;
        else blackVisits++;
      }
      
      const balance = whiteVisits - blackVisits;
      
      const isKingside = file >= 4;
      const isWhiteSide = rank < 4;
      const isCenter = (file >= 3 && file <= 4) && (rank >= 3 && rank <= 4);
      
      if (isCenter) {
        center += balance;
      } else if (isKingside && isWhiteSide) {
        kingsideWhite += balance;
      } else if (isKingside && !isWhiteSide) {
        kingsideBlack += balance;
      } else if (!isKingside && isWhiteSide) {
        queensideWhite += balance;
      } else {
        queensideBlack += balance;
      }
    }
  }
  
  const normalize = (val: number) => Math.max(-100, Math.min(100, val * 5));
  
  return {
    kingsideWhite: normalize(kingsideWhite),
    kingsideBlack: normalize(kingsideBlack),
    queensideWhite: normalize(queensideWhite),
    queensideBlack: normalize(queensideBlack),
    center: normalize(center),
  };
}

/**
 * Determine the primary direction of color flow
 */
function determineFlowDirection(
  profile: QuadrantProfile
): 'kingside' | 'queenside' | 'central' | 'balanced' | 'diagonal' {
  const kingsideTotal = Math.abs(profile.kingsideWhite) + Math.abs(profile.kingsideBlack);
  const queensideTotal = Math.abs(profile.queensideWhite) + Math.abs(profile.queensideBlack);
  const centerIntensity = Math.abs(profile.center);
  
  const diagonalA = Math.abs(profile.kingsideWhite) + Math.abs(profile.queensideBlack);
  const diagonalB = Math.abs(profile.queensideWhite) + Math.abs(profile.kingsideBlack);
  
  if (Math.max(diagonalA, diagonalB) > kingsideTotal * 1.5 && 
      Math.max(diagonalA, diagonalB) > queensideTotal * 1.5) {
    return 'diagonal';
  }
  
  if (centerIntensity > kingsideTotal && centerIntensity > queensideTotal) {
    return 'central';
  }
  
  if (kingsideTotal > queensideTotal * 1.5) {
    return 'kingside';
  }
  
  if (queensideTotal > kingsideTotal * 1.5) {
    return 'queenside';
  }
  
  return 'balanced';
}

/**
 * Calculate how color intensity evolved through game phases
 */
function calculateTemporalFlow(board: SquareData[][], totalMoves: number): TemporalFlow {
  let openingBalance = 0, middlegameBalance = 0, endgameBalance = 0;
  let volatility = 0;
  let prevBalance = 0;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file];
      
      for (const visit of square.visits) {
        const balance = visit.color === 'w' ? 1 : -1;
        
        if (visit.moveNumber <= 10) {
          openingBalance += balance;
        } else if (visit.moveNumber <= 25) {
          middlegameBalance += balance;
        } else {
          endgameBalance += balance;
        }
        
        volatility += Math.abs(balance - prevBalance);
        prevBalance = balance;
      }
    }
  }
  
  const normalize = (val: number, phase: number) => 
    Math.max(-100, Math.min(100, (val / Math.max(phase, 1)) * 10));
  
  return {
    opening: normalize(openingBalance, 10),
    middlegame: normalize(middlegameBalance, 15),
    endgame: normalize(endgameBalance, Math.max(0, totalMoves - 25)),
    volatility: Math.min(100, (volatility / totalMoves) * 5),
  };
}

/**
 * Identify critical moments where color balance shifted dramatically
 */
function findCriticalMoments(board: SquareData[][], totalMoves: number): CriticalMoment[] {
  const moments: CriticalMoment[] = [];
  const moveBalances: number[] = new Array(totalMoves + 1).fill(0);
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file];
      for (const visit of square.visits) {
        moveBalances[visit.moveNumber] += visit.color === 'w' ? 1 : -1;
      }
    }
  }
  
  for (let move = 2; move <= totalMoves; move++) {
    const shift = Math.abs(moveBalances[move] - moveBalances[move - 1]);
    if (shift >= 3) {
      moments.push({
        moveNumber: move,
        shiftMagnitude: shift,
        description: moveBalances[move] > moveBalances[move - 1] 
          ? 'White territorial surge'
          : 'Black territorial surge',
        squaresAffected: [],
      });
    }
  }
  
  return moments.slice(0, 5);
}

/**
 * Classify the game into a strategic archetype based on color patterns
 * FIX: Diversified classification to prevent collapse to single archetype
 */
function classifyArchetype(
  quadrant: QuadrantProfile,
  temporal: TemporalFlow,
  moments: CriticalMoment[],
  totalMoves: number
): StrategicArchetype {
  // Priority-ordered classification with stricter criteria
  
  // 1. Kingside attack - requires high kingside activity AND volatility
  if (Math.abs(quadrant.kingsideBlack) > 60 && temporal.volatility > 45) {
    return 'kingside_attack';
  }
  
  // 2. Queenside expansion - requires clear queenside dominance
  if (Math.abs(quadrant.queensideBlack) > 55 || Math.abs(quadrant.queensideWhite) > 55) {
    return 'queenside_expansion';
  }
  
  // 3. Central domination - requires very high center control
  if (Math.abs(quadrant.center) > 65) {
    return 'central_domination';
  }
  
  // 4. Sacrificial attack - multiple big shifts
  if (moments.length >= 4 && moments.some(m => m.shiftMagnitude > 5)) {
    return 'sacrificial_attack';
  }
  
  // 5. Open tactical - high volatility with many moments
  if (temporal.volatility > 55 && moments.length >= 3) {
    return 'open_tactical';
  }
  
  // 6. Endgame technique - late game with low volatility
  if (totalMoves > 40 && Math.abs(temporal.endgame) > 20 && temporal.volatility < 35) {
    return 'endgame_technique';
  }
  
  // 7. Closed maneuvering - very low volatility in long games
  if (temporal.volatility < 20 && totalMoves > 35) {
    return 'closed_maneuvering';
  }
  
  // 8. Positional squeeze - endgame stronger than opening with moderate volatility
  if (temporal.endgame > temporal.opening + 15 && temporal.volatility < 45) {
    return 'positional_squeeze';
  }
  
  // 9. Piece harmony - balanced center with moderate volatility
  if (quadrant.center > 35 && quadrant.center < 60 && temporal.volatility >= 30 && temporal.volatility <= 50) {
    return 'piece_harmony';
  }
  
  // 10. Prophylactic defense - ONLY for truly quiet positions
  // Stricter criteria: low middlegame activity AND low volatility AND shorter games
  if (Math.abs(temporal.middlegame) < 15 && temporal.volatility < 25 && totalMoves < 35) {
    return 'prophylactic_defense';
  }
  
  // Default to unknown rather than prophylactic_defense
  return 'unknown';
}

/**
 * Calculate overall color intensity across the board
 */
function calculateOverallIntensity(board: SquareData[][]): number {
  let totalVisits = 0;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      totalVisits += board[rank][file].visits.length;
    }
  }
  
  return Math.min(100, (totalVisits / 200) * 50);
}

/**
 * Determine which side has overall color dominance
 */
function determineDominantSide(profile: QuadrantProfile): 'white' | 'black' | 'contested' {
  const totalBalance = profile.kingsideWhite + profile.kingsideBlack +
                       profile.queensideWhite + profile.queensideBlack + profile.center;
  
  if (totalBalance > 30) return 'white';
  if (totalBalance < -30) return 'black';
  return 'contested';
}
