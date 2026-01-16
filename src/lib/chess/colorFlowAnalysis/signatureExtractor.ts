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
 */
function classifyArchetype(
  quadrant: QuadrantProfile,
  temporal: TemporalFlow,
  moments: CriticalMoment[],
  totalMoves: number
): StrategicArchetype {
  if (Math.abs(quadrant.kingsideBlack) > 60 && temporal.volatility > 40) {
    return 'kingside_attack';
  }
  
  if (Math.abs(quadrant.queensideBlack) > 60 || Math.abs(quadrant.queensideWhite) > 60) {
    return 'queenside_expansion';
  }
  
  if (Math.abs(quadrant.center) > 70) {
    return 'central_domination';
  }
  
  if (totalMoves > 40 && temporal.endgame !== 0 && temporal.volatility < 30) {
    return 'endgame_technique';
  }
  
  if (temporal.volatility > 60 && moments.length >= 3) {
    return 'open_tactical';
  }
  
  if (temporal.volatility < 25 && totalMoves > 30) {
    return 'closed_maneuvering';
  }
  
  if (Math.abs(temporal.middlegame) < 20 && temporal.volatility < 40) {
    return 'prophylactic_defense';
  }
  
  if (quadrant.center > 40 && temporal.volatility < 50) {
    return 'piece_harmony';
  }
  
  if (moments.length >= 4 && moments.some(m => m.shiftMagnitude > 5)) {
    return 'sacrificial_attack';
  }
  
  if (temporal.endgame > temporal.opening && temporal.volatility < 40) {
    return 'positional_squeeze';
  }
  
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
