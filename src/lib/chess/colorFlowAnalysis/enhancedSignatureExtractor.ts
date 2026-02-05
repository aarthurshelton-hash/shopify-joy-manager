/**
 * Enhanced Color Flow Signature Extractor
 * 8-Quadrant + Per-Piece-Type Color System
 * 
 * Revolutionary upgrade that transforms binary (2-color) signatures
 * into rich typological (12-color) signatures with double spatial resolution
 */

import { SquareData, GameData, SimulationResult } from '../gameSimulator';
import { PieceType, PieceColor } from '../pieceColors';

/**
 * Enhanced 12-color palette with piece-type differentiation
 * Each piece gets a unique color code character
 */
export const ENHANCED_COLOR_CODES: Record<string, string> = {
  // White pieces (uppercase)
  'K': 'W',  // White King - Royal White
  'Q': 'G',  // White Queen - Gold
  'R': 'R',  // White Rook - Crimson Red
  'B': 'B',  // White Bishop - Azure Blue
  'N': 'N',  // White Knight - Amber Orange
  'P': 'E',  // White Pawn - Emerald (gradated below)
  
  // Black pieces (lowercase)
  'k': 'z',  // Black King - Royal Black
  'q': 'g',  // Black Queen - Dark Gold
  'r': 'r',  // Black Rook - Dark Red
  'b': 'b',  // Black Bishop - Dark Blue
  'n': 'n',  // Black Knight - Dark Orange
  'p': 'e',  // Black Pawn - Dark Emerald (gradated below)
};

/**
 * Calculate gradated pawn color based on advancement
 * White pawns: rank 1→6 (0-index), advancing toward rank 7
 * Black pawns: rank 6→1 (0-index), advancing toward rank 0
 * 
 * @param piece 'P' for white, 'p' for black
 * @param rank 0-7 (0=rank1, 7=rank8)
 * @returns Gradated color code (1-6 for white, a-f for black)
 */
export function getGradatedPawnColor(piece: 'P' | 'p', rank: number): string {
  if (piece === 'P') {
    // White pawn: starts at rank 1 (index 1), advances to rank 7 (index 7)
    // advancement: 0 (starting) to 6 (ready to promote)
    const advancement = Math.min(Math.max(rank - 1, 0), 6);
    // Return '1' through '6' (char codes 49-54)
    return String.fromCharCode(49 + advancement);
  } else {
    // Black pawn: starts at rank 6 (index 6), advances to rank 0 (index 0)
    // advancement: 0 (starting) to 6 (ready to promote)
    const advancement = Math.min(Math.max(6 - rank, 0), 6);
    // Return 'a' through 'f' (char codes 97-102)
    return String.fromCharCode(97 + advancement);
  }
}

/**
 * Enhanced 8-Quadrant Profile
 * Double the spatial resolution of the 4-quadrant system
 */
export interface EnhancedQuadrantProfile {
  // Core 4 quadrants (original)
  q1_kingside_white: number;      // Files e-h, ranks 1-4
  q2_queenside_white: number;     // Files a-d, ranks 1-4
  q3_kingside_black: number;      // Files e-h, ranks 5-8
  q4_queenside_black: number;    // Files a-d, ranks 5-8
  
  // Extended 4 quadrants (new)
  q5_center_white: number;        // Files c-f, ranks 1-4 (central white)
  q6_center_black: number;       // Files c-f, ranks 5-8 (central black)
  q7_extended_kingside: number;   // Files g-h, all ranks (wide kingside)
  q8_extended_queenside: number; // Files a-b, all ranks (wide queenside)
  
  // Piece-type specific metrics
  bishop_dominance: number;       // % of piece activity from bishops
  knight_dominance: number;       // % of piece activity from knights
  rook_dominance: number;        // % of piece activity from rooks
  queen_dominance: number;       // % of piece activity from queens
  pawn_advancement: number;      // Average pawn progress (0-1)
  
  // Temporal flow (unchanged from original)
  temporalFlow: {
    early: number;   // Moves 1-15
    mid: number;     // Moves 16-40
    late: number;    // Moves 41+
  };
}

/**
 * Calculate enhanced 8-quadrant profile with piece-type weighting
 */
export function calculateEnhancedQuadrantProfile(
  board: SquareData[][],
  totalMoves: number
): EnhancedQuadrantProfile {
  const profile: EnhancedQuadrantProfile = {
    q1_kingside_white: 0,
    q2_queenside_white: 0,
    q3_kingside_black: 0,
    q4_queenside_black: 0,
    q5_center_white: 0,
    q6_center_black: 0,
    q7_extended_kingside: 0,
    q8_extended_queenside: 0,
    bishop_dominance: 0,
    knight_dominance: 0,
    rook_dominance: 0,
    queen_dominance: 0,
    pawn_advancement: 0,
    temporalFlow: { early: 0, mid: 0, late: 0 },
  };
  
  let bishopActivity = 0, knightActivity = 0, rookActivity = 0, queenActivity = 0;
  let totalPawnAdvancement = 0, pawnCount = 0;
  let earlyMoves = 0, midMoves = 0, lateMoves = 0;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file];
      if (square.visits.length === 0) continue;
      
      // Get the most recent visit for current piece presence
      const lastVisit = square.visits[square.visits.length - 1];
      const piece = lastVisit.piece;
      const color = lastVisit.color;
      
      // Calculate temporal distribution
      for (const visit of square.visits) {
        if (visit.moveNumber <= 15) earlyMoves++;
        else if (visit.moveNumber <= 40) midMoves++;
        else lateMoves++;
      }
      
      // Piece-type activity tracking (piece types are lowercase 'k', 'q', 'r', 'b', 'n', 'p')
      if (piece === 'b') bishopActivity++;
      if (piece === 'n') knightActivity++;
      if (piece === 'r') rookActivity++;
      if (piece === 'q') queenActivity++;
      
      // Pawn advancement tracking (piece types are lowercase 'p' for both colors)
      if (piece === 'p') {
        const advancement = color === 'w' 
          ? Math.min(Math.max(rank - 1, 0), 6)  // White: 0-6
          : Math.min(Math.max(6 - rank, 0), 6); // Black: 0-6
        totalPawnAdvancement += advancement;
        pawnCount++;
      }
      
      // 8-quadrant spatial analysis with piece-weighting
      const isKingside = file >= 4;        // Files e-h (indices 4-7)
      const isQueenside = file <= 3;       // Files a-d (indices 0-3)
      const isWhiteTerritory = rank <= 3;   // Ranks 1-4 (indices 0-3)
      const isBlackTerritory = rank >= 4;   // Ranks 5-8 (indices 4-7)
      const isCenter = (file >= 2 && file <= 5); // Files c-f (indices 2-5)
      const isExtendedKingside = file >= 6; // Files g-h (indices 6-7)
      const isExtendedQueenside = file <= 1; // Files a-b (indices 0-1)
      
      const value = color === 'w' ? 1 : -1;
      const weight = getPieceWeight(piece);
      
      // Core 4 quadrants
      if (isKingside && isWhiteTerritory) {
        profile.q1_kingside_white += value * weight;
      } else if (isQueenside && isWhiteTerritory) {
        profile.q2_queenside_white += value * weight;
      } else if (isKingside && isBlackTerritory) {
        profile.q3_kingside_black += value * weight;
      } else if (isQueenside && isBlackTerritory) {
        profile.q4_queenside_black += value * weight;
      }
      
      // Extended 4 quadrants
      if (isCenter && isWhiteTerritory) {
        profile.q5_center_white += value * weight;
      } else if (isCenter && isBlackTerritory) {
        profile.q6_center_black += value * weight;
      }
      
      if (isExtendedKingside) {
        profile.q7_extended_kingside += value * weight;
      }
      if (isExtendedQueenside) {
        profile.q8_extended_queenside += value * weight;
      }
    }
  }
  
  // Calculate piece-type dominance ratios
  const totalPieceActivity = bishopActivity + knightActivity + rookActivity + queenActivity;
  if (totalPieceActivity > 0) {
    profile.bishop_dominance = bishopActivity / totalPieceActivity;
    profile.knight_dominance = knightActivity / totalPieceActivity;
    profile.rook_dominance = rookActivity / totalPieceActivity;
    profile.queen_dominance = queenActivity / totalPieceActivity;
  }
  
  // Average pawn advancement (0-6 scale normalized to 0-1)
  profile.pawn_advancement = pawnCount > 0 
    ? (totalPawnAdvancement / pawnCount) / 6 
    : 0;
  
  // Temporal flow calculation
  const totalTemporal = earlyMoves + midMoves + lateMoves;
  if (totalTemporal > 0) {
    profile.temporalFlow.early = earlyMoves / totalTemporal;
    profile.temporalFlow.mid = midMoves / totalTemporal;
    profile.temporalFlow.late = lateMoves / totalTemporal;
  }
  
  return profile;
}

/**
 * Get strategic weight for piece type (major pieces = more weight)
 */
function getPieceWeight(piece: PieceType | undefined): number {
  if (!piece) return 0.5;
  const weights: Record<PieceType, number> = {
    'q': 5.0,  // Queen
    'r': 3.0,  // Rook
    'b': 2.5,  // Bishop
    'n': 2.5,  // Knight
    'p': 1.0,  // Pawn
    'k': 0.5,  // King (doesn't count as much for dominance)
  };
  return weights[piece.toLowerCase() as PieceType] || 0.5;
}

/**
 * Generate enhanced fingerprint with piece-type encoding
 * Creates unique signatures based on piece types and their positions
 */
export function generateEnhancedFingerprint(board: SquareData[][]): string {
  const colorMap: string[] = [];
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file];
      const visitCount = square.visits.length;
      
      if (square.visits.length === 0) {
        colorMap.push(`${visitCount}x`);
        continue;
      }
      
      // Get the most recent visit
      const lastVisit = square.visits[square.visits.length - 1];
      const piece = lastVisit.piece;
      
      let colorCode: string;
      
      if (piece === 'p') {
        // Pawns get gradated colors based on advancement
        colorCode = getGradatedPawnColor(piece, rank);
      } else if (piece) {
        // Other pieces get their type-specific color (piece is lowercase, map to uppercase for white)
        const isWhite = lastVisit.color === 'w';
        const lookupKey = isWhite ? piece.toUpperCase() : piece;
        colorCode = ENHANCED_COLOR_CODES[lookupKey] || 'x';
      } else {
        colorCode = 'x';
      }
      
      // Append visit count for temporal weighting
      colorMap.push(`${visitCount}${colorCode}`);
    }
  }
  
  // Generate hash from color map
  const mapString = colorMap.join('');
  let hash = 0;
  for (let i = 0; i < mapString.length; i++) {
    const char = mapString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `ep8-${Math.abs(hash).toString(36)}`; // 'ep8' = enpensent 8-quadrant
}

/**
 * Enhanced archetype classification using 8-quadrant + piece-type profiles
 * Detects 24+ distinct strategic patterns (vs 12 in 4-quadrant system)
 */
export function classifyEnhancedArchetype(profile: EnhancedQuadrantProfile): string {
  // Calculate advanced metrics
  const kingsidePressure = Math.abs(profile.q1_kingside_white) + Math.abs(profile.q3_kingside_black);
  const queensidePressure = Math.abs(profile.q2_queenside_white) + Math.abs(profile.q4_queenside_black);
  const centerControl = Math.abs(profile.q5_center_white) + Math.abs(profile.q6_center_black);
  const wingExpansion = Math.abs(profile.q7_extended_kingside) + Math.abs(profile.q8_extended_queenside);
  
  // Piece-type specific patterns
  const bishopPair = profile.bishop_dominance > 0.30;
  const knightDominant = profile.knight_dominance > 0.35;
  const rookActivity = profile.rook_dominance > 0.25;
  const queenEarly = profile.queen_dominance > 0.30 && profile.temporalFlow.early > 0.3;
  const pawnStorm = profile.pawn_advancement > 0.5;
  const wingPlay = wingExpansion > 20;
  
  // 24 enhanced archetypes
  
  // 1-4: Kingside attacks with piece-type variations
  if (kingsidePressure > queensidePressure * 1.5 && profile.temporalFlow.mid > 0.4) {
    if (rookActivity && pawnStorm) {
      return 'kingside_rook_lift_blitz';
    }
    if (knightDominant) {
      return 'kingside_knight_charge';
    }
    if (bishopPair) {
      return 'kingside_bishop_battery';
    }
    return 'kingside_attack';
  }
  
  // 5-8: Queenside pressure with piece-type variations
  if (queensidePressure > kingsidePressure * 1.2 && profile.temporalFlow.late > 0.3) {
    if (bishopPair) {
      return 'queenside_bishop_squeeze';
    }
    if (queenEarly) {
      return 'queenside_queen_seventh';
    }
    if (rookActivity) {
      return 'queenside_rook_majority';
    }
    return 'queenside_pressure';
  }
  
  // 9-12: Central control patterns
  if (centerControl > 40 && profile.temporalFlow.early > 0.5) {
    if (knightDominant) {
      return 'central_knight_outpost';
    }
    if (bishopPair) {
      return 'central_bishop_cross';
    }
    if (pawnStorm) {
      return 'central_pawn_roller';
    }
    return 'central_domination';
  }
  
  // 13-16: Wing expansion patterns
  if (wingPlay && profile.pawn_advancement > 0.4) {
    if (Math.abs(profile.q7_extended_kingside) > Math.abs(profile.q8_extended_queenside) * 1.5) {
      return 'kingside_expansion';
    }
    if (Math.abs(profile.q8_extended_queenside) > Math.abs(profile.q7_extended_kingside) * 1.5) {
      return 'queenside_expansion';
    }
    if (bishopPair) {
      return 'wing_bishop_deployment';
    }
    return 'wing_play';
  }
  
  // 17-20: Piece-type specific patterns
  if (profile.bishop_dominance > 0.35 && profile.knight_dominance < 0.20) {
    return 'bishop_pair_mastery';
  }
  
  if (profile.knight_dominance > 0.40 && profile.bishop_dominance < 0.15) {
    return 'knight_complex_superiority';
  }
  
  if (profile.rook_dominance > 0.35 && profile.temporalFlow.mid > 0.5) {
    return 'rook_activity_maximum';
  }
  
  if (pawnStorm && profile.pawn_advancement > 0.6) {
    return 'pawn_storm_assault';
  }
  
  // 21-24: Advanced combined patterns
  if (bishopPair && knightDominant) {
    return 'minor_piece_coordination';
  }
  
  if (rookActivity && wingPlay) {
    return 'rook_wing_domination';
  }
  
  if (centerControl > 30 && kingsidePressure > 20) {
    return 'center_kingside_break';
  }
  
  if (profile.pawn_advancement > 0.7 && profile.temporalFlow.late > 0.4) {
    return 'passed_pawn_race';
  }
  
  // Default archetypes based on temporal characteristics
  if (profile.temporalFlow.early > 0.5) {
    return 'development_focus';
  } else if (profile.temporalFlow.mid > 0.5) {
    return 'middlegame_complexity';
  } else {
    return 'endgame_technique';
  }
}

/**
 * Extract complete enhanced color flow signature
 * This is the main entry point for signature extraction
 */
export function extractEnhancedColorFlowSignature(
  simulationResult: SimulationResult
): {
  fingerprint: string;
  quadrantProfile: EnhancedQuadrantProfile;
  archetype: string;
  complexity: number;
  colorRichness: number;
} {
  const { board, totalMoves } = simulationResult;
  
  // Generate enhanced fingerprint
  const fingerprint = generateEnhancedFingerprint(board);
  
  // Calculate 8-quadrant profile
  const quadrantProfile = calculateEnhancedQuadrantProfile(board, totalMoves);
  
  // Classify archetype
  const archetype = classifyEnhancedArchetype(quadrantProfile);
  
  // Calculate complexity (total piece activity)
  let totalActivity = 0;
  const uniquePieces = new Set<string>();
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file];
      totalActivity += square.visits.length;
      for (const visit of square.visits) {
        uniquePieces.add(visit.piece);
      }
    }
  }
  
  const complexity = totalActivity / 64; // Average visits per square
  const colorRichness = uniquePieces.size / 12; // Ratio of piece types present (out of 12 possible)
  
  return {
    fingerprint,
    quadrantProfile,
    archetype,
    complexity,
    colorRichness,
  };
}

/**
 * Compare two enhanced quadrant profiles
 * Returns similarity score (0-1, higher = more similar)
 */
export function compareEnhancedProfiles(
  profile1: EnhancedQuadrantProfile,
  profile2: EnhancedQuadrantProfile
): number {
  const quadrants = [
    'q1_kingside_white', 'q2_queenside_white', 'q3_kingside_black', 'q4_queenside_black',
    'q5_center_white', 'q6_center_black', 'q7_extended_kingside', 'q8_extended_queenside',
  ] as const;
  
  let totalDiff = 0;
  let totalWeight = 0;
  
  // Compare 8 quadrants
  for (const q of quadrants) {
    const v1 = profile1[q];
    const v2 = profile2[q];
    const diff = Math.abs(v1 - v2);
    const maxVal = Math.max(Math.abs(v1), Math.abs(v2), 1);
    totalDiff += diff / maxVal;
    totalWeight += 1;
  }
  
  // Compare piece-type dominance
  const pieceTypes = ['bishop_dominance', 'knight_dominance', 'rook_dominance', 'queen_dominance'] as const;
  for (const pt of pieceTypes) {
    const diff = Math.abs(profile1[pt] - profile2[pt]);
    totalDiff += diff * 2; // Weight piece types more heavily
    totalWeight += 2;
  }
  
  // Compare pawn advancement
  const pawnDiff = Math.abs(profile1.pawn_advancement - profile2.pawn_advancement);
  totalDiff += pawnDiff * 3; // Weight pawn structure heavily
  totalWeight += 3;
  
  return 1 - (totalDiff / totalWeight);
}

export default {
  ENHANCED_COLOR_CODES,
  getGradatedPawnColor,
  calculateEnhancedQuadrantProfile,
  generateEnhancedFingerprint,
  classifyEnhancedArchetype,
  extractEnhancedColorFlowSignature,
  compareEnhancedProfiles,
};
