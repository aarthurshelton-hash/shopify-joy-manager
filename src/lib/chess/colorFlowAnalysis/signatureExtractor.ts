/**
 * Color Flow Signature Extractor
 * 
 * Core signature extraction from board visualization data
 * v7.52-PROPHYLACTIC: Enhanced with sub-archetype variation detection
 */

import { SquareData, GameData } from '../gameSimulator';
import { 
  ColorFlowSignature, 
  QuadrantProfile, 
  TemporalFlow, 
  CriticalMoment,
  StrategicArchetype 
} from './types';
import { 
  classifyProphylacticVariation, 
  ProphylacticAnalysis 
} from './prophylacticVariations';

// Store last prophylactic analysis for external access
let lastProphylacticAnalysis: ProphylacticAnalysis | null = null;

/**
 * Get the last prophylactic variation analysis (if archetype was prophylactic_defense)
 */
export function getLastProphylacticAnalysis(): ProphylacticAnalysis | null {
  return lastProphylacticAnalysis;
}

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
  
  // v7.52-PROPHYLACTIC: Deep analysis for prophylactic defense archetype
  if (archetype === 'prophylactic_defense') {
    lastProphylacticAnalysis = classifyProphylacticVariation(
      quadrantProfile, 
      temporalFlow, 
      criticalMoments, 
      totalMoves
    );
  } else {
    lastProphylacticAnalysis = null;
  }
  
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
 * v6.83-DIVERSE: Lowered thresholds + added missing archetypes for better distribution
 */
function classifyArchetype(
  quadrant: QuadrantProfile,
  temporal: TemporalFlow,
  moments: CriticalMoment[],
  totalMoves: number
): StrategicArchetype {
  // Calculate aggregate metrics for smarter classification
  const kingsideTotal = Math.abs(quadrant.kingsideWhite) + Math.abs(quadrant.kingsideBlack);
  const queensideTotal = Math.abs(quadrant.queensideWhite) + Math.abs(quadrant.queensideBlack);
  const totalActivity = kingsideTotal + queensideTotal + Math.abs(quadrant.center);
  const avgMomentMagnitude = moments.length > 0 
    ? moments.reduce((sum, m) => sum + m.shiftMagnitude, 0) / moments.length 
    : 0;
  
  // 1. Opposite castling - asymmetric flank activity (NEW)
  const kingsideImbalance = Math.abs(quadrant.kingsideWhite - quadrant.kingsideBlack);
  const queensideImbalance = Math.abs(quadrant.queensideWhite - quadrant.queensideBlack);
  if (kingsideImbalance > 30 && queensideImbalance > 30 && temporal.volatility > 35) {
    return 'opposite_castling';
  }
  
  // 2. Pawn storm - linear progression with increasing endgame pressure (NEW)
  if (temporal.endgame > temporal.opening + 25 && temporal.endgame > temporal.middlegame) {
    return 'pawn_storm';
  }
  
  // 3. Kingside attack - high kingside activity (lowered threshold)
  if (kingsideTotal > 80 && kingsideTotal > queensideTotal * 1.3) {
    return 'kingside_attack';
  }
  
  // 4. Queenside expansion - clear queenside focus (lowered threshold)
  if (queensideTotal > 70 && queensideTotal > kingsideTotal * 1.3) {
    return 'queenside_expansion';
  }
  
  // 5. Central domination - strong center control (lowered threshold)
  if (Math.abs(quadrant.center) > 45 && Math.abs(quadrant.center) > kingsideTotal * 0.5) {
    return 'central_domination';
  }
  
  // 6. Sacrificial attack - dramatic shifts with high average magnitude
  if (moments.length >= 3 && avgMomentMagnitude > 4) {
    return 'sacrificial_attack';
  }
  
  // 7. Open tactical - high volatility games (lowered threshold)
  if (temporal.volatility > 40 && moments.length >= 2) {
    return 'open_tactical';
  }
  
  // 8. Endgame technique - long games with late-game focus
  if (totalMoves > 35 && Math.abs(temporal.endgame) > 15) {
    return 'endgame_technique';
  }
  
  // 9. Closed maneuvering - low volatility in longer games (lowered thresholds)
  if (temporal.volatility < 30 && totalMoves > 30) {
    return 'closed_maneuvering';
  }
  
  // 10. Positional squeeze - gradual improvement over phases
  if (temporal.middlegame > temporal.opening && temporal.endgame > temporal.middlegame) {
    return 'positional_squeeze';
  }
  
  // 11. Piece harmony - moderate center with balanced activity
  if (quadrant.center > 20 && temporal.volatility >= 25 && temporal.volatility <= 55) {
    return 'piece_harmony';
  }
  
  // 12. Prophylactic defense - TIGHTENED: requires truly defensive characteristics
  // v7.85: Much stricter criteria - must show actual defensive patterns not just low activity
  const hasDefensiveCharacter = (
    // Black must have genuine territorial presence (not just white being passive)
    (quadrant.kingsideBlack < -10 || quadrant.queensideBlack < -10) &&
    // Temporal shows black gaining or maintaining (not white building advantage)
    (temporal.middlegame <= temporal.opening || temporal.endgame <= temporal.middlegame) &&
    // Low crisis moments - true prophylaxis prevents tactics
    moments.length <= 2
  );
  
  if (totalActivity < 120 && temporal.volatility < 25 && hasDefensiveCharacter) {
    return 'prophylactic_defense';
  }
  
  // Fallback: Use activity ratios to pick something reasonable
  if (kingsideTotal > queensideTotal) {
    return 'kingside_attack';
  } else if (queensideTotal > kingsideTotal) {
    return 'queenside_expansion';
  }
  
  return 'piece_harmony'; // Reasonable default instead of 'unknown'
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
 * v7.91-FIX: Calculate white and black activity SEPARATELY to avoid inherent bias
 * 
 * Previously: summed all values (white=+, black=-) which biased toward white
 * Now: count absolute activity for each side independently
 */
function determineDominantSide(profile: QuadrantProfile): 'white' | 'black' | 'contested' {
  // White activity = positive values from white-controlled areas
  const whiteActivity = Math.max(0, profile.kingsideWhite) + 
                        Math.max(0, profile.queensideWhite) + 
                        Math.max(0, profile.center);
  
  // Black activity = absolute value of negative values from black-controlled areas
  // Note: kingsideBlack/queensideBlack store NEGATIVE values for black control
  const blackActivity = Math.max(0, -profile.kingsideBlack) + 
                        Math.max(0, -profile.queensideBlack) + 
                        Math.max(0, -profile.center);
  
  // Also count invasion: white controlling black territory, black controlling white territory
  const whiteInvasion = Math.max(0, profile.kingsideBlack) + Math.max(0, profile.queensideBlack);
  const blackInvasion = Math.max(0, -profile.kingsideWhite) + Math.max(0, -profile.queensideWhite);
  
  const whiteTotal = whiteActivity + whiteInvasion * 0.5;
  const blackTotal = blackActivity + blackInvasion * 0.5;
  
  const diff = whiteTotal - blackTotal;
  
  // Symmetric thresholds
  if (diff > 25) return 'white';
  if (diff < -25) return 'black';
  return 'contested';
}
