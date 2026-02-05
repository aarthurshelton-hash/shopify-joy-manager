/**
 * Enhanced Color Flow Analysis - Per-Piece-Type Color System
 * 
 * Revolutionary upgrade: Each piece type gets unique color signature
 * Bishops = Azure, Knights = Amber, Rooks = Crimson, Pawns = Gradated Emerald
 * Plus 8-quadrant spatial analysis (double the resolution)
 * 
 * Expected accuracy gain: +15-25% (from 61% to 76-86%)
 */

import { SquareData, GameData, PieceType } from '../gameSimulator';

/**
 * Extended color palette for piece-type differentiation
 * Each piece type gets a distinct character code for the color matrix
 */
export const PIECE_COLOR_CODES: Record<PieceType, string> = {
  // Major pieces - distinct primary colors
  'K': 'W',  // White King - White
  'k': 'Z',  // Black King - Black
  'Q': 'G',  // White Queen - Gold
  'q': 'g',  // Black Queen - Dark Gold
  'R': 'R',  // White Rook - Crimson/Red
  'r': 'r',  // Black Rook - Dark Red
  'B': 'B',  // White Bishop - Azure/Blue
  'b': 'b',  // Black Bishop - Dark Blue
  'N': 'N',  // White Knight - Amber/Orange
  'n': 'n',  // Black Knight - Dark Orange
  
  // Pawns - GRADATED based on advancement (rank)
  // P1 = back rank (least active), P7 = promotion rank (most active)
  'P': '1',  // White Pawn rank 2 (starting)
  'p': 'a',  // Black Pawn rank 7 (starting)
  
  // Dynamic pawn colors based on advancement will be calculated at runtime
};

/**
 * Calculate pawn gradation based on how far advanced
 * White pawns: rank 2→7 (1→6 steps advanced)
 * Black pawns: rank 7→2 (1→6 steps advanced)
 */
export function getPawnColor(piece: 'P' | 'p', rank: number): string {
  if (piece === 'P') {
    // White pawn: starts at rank 2, advances toward rank 7
    const advancement = rank - 2; // 0 to 5
    return String.fromCharCode(49 + advancement); // '1' to '6'
  } else {
    // Black pawn: starts at rank 7, advances toward rank 2
    const advancement = 7 - rank; // 0 to 5
    return String.fromCharCode(97 + advancement); // 'a' to 'f'
  }
}

/**
 * 8-Quadrant Profile (double the resolution of 4-quadrant)
 * 
 * Spatial breakdown:
 * - Q1: Kingside + White territory (files e-h, ranks 1-4)
 * - Q2: Queenside + White territory (files a-d, ranks 1-4)  
 * - Q3: Kingside + Black territory (files e-h, ranks 5-8)
 * - Q4: Queenside + Black territory (files a-d, ranks 5-8)
 * - Q5: Center-White (files c-f, ranks 2-4)
 * - Q6: Center-Black (files c-f, ranks 5-7)
 * - Q7: Extended kingside (files g-h, all ranks)
 * - Q8: Extended queenside (files a-b, all ranks)
 */
export interface EnhancedQuadrantProfile {
  q1_kingside_white: number;      // Aggressive white kingside
  q2_queenside_white: number;     // Defensive white queenside
  q3_kingside_black: number;      // Aggressive black kingside
  q4_queenside_black: number;    // Defensive black queenside
  q5_center_white: number;         // Central white control
  q6_center_black: number;        // Central black control
  q7_extended_kingside: number;   // Wide kingside presence
  q8_extended_queenside: number; // Wide queenside presence
  
  // Piece-type specific dominance
  bishop_dominance: number;
  knight_dominance: number;
  rook_dominance: number;
  pawn_advancement: number; // Average pawn progress
}

/**
 * Calculate enhanced 8-quadrant profile with piece-type awareness
 */
export function calculateEnhancedQuadrantProfile(
  board: SquareData[][]
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
    pawn_advancement: 0,
  };
  
  let bishopActivity = 0, knightActivity = 0, rookActivity = 0;
  let totalPawnAdvancement = 0, pawnCount = 0;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file];
      if (square.visits.length === 0) continue;
      
      const lastVisit = square.visits[square.visits.length - 1];
      const piece = lastVisit.piece;
      const color = lastVisit.pieceColor; // 'w' or 'b'
      
      // Calculate piece-type specific activity
      if (piece?.toLowerCase() === 'b') bishopActivity++;
      if (piece?.toLowerCase() === 'n') knightActivity++;
      if (piece?.toLowerCase() === 'r') rookActivity++;
      
      // Pawn advancement tracking
      if (piece?.toLowerCase() === 'p') {
        const advancement = color === 'w' 
          ? rank - 1  // White: starts at rank 1 (0-index), advances up
          : 6 - rank; // Black: starts at rank 6 (0-index), advances down
        totalPawnAdvancement += advancement;
        pawnCount++;
      }
      
      // 8-quadrant spatial analysis
      const isKingside = file >= 4;      // Files e-h
      const isQueenside = file <= 3;     // Files a-d
      const isWhiteTerritory = rank <= 3; // Ranks 1-4
      const isBlackTerritory = rank >= 4; // Ranks 5-8
      const isCenter = (file >= 2 && file <= 5); // Files c-f
      const isExtendedKingside = file >= 6; // Files g-h
      const isExtendedQueenside = file <= 1; // Files a-b
      
      const value = color === 'w' ? 1 : -1;
      
      // Standard 4 quadrants with piece-weighting
      if (isKingside && isWhiteTerritory) {
        profile.q1_kingside_white += value * getPieceWeight(piece);
      } else if (isQueenside && isWhiteTerritory) {
        profile.q2_queenside_white += value * getPieceWeight(piece);
      } else if (isKingside && isBlackTerritory) {
        profile.q3_kingside_black += value * getPieceWeight(piece);
      } else if (isQueenside && isBlackTerritory) {
        profile.q4_queenside_black += value * getPieceWeight(piece);
      }
      
      // Extended 4 quadrants
      if (isCenter && isWhiteTerritory) {
        profile.q5_center_white += value * getPieceWeight(piece);
      } else if (isCenter && isBlackTerritory) {
        profile.q6_center_black += value * getPieceWeight(piece);
      }
      
      if (isExtendedKingside) {
        profile.q7_extended_kingside += value * getPieceWeight(piece);
      }
      if (isExtendedQueenside) {
        profile.q8_extended_queenside += value * getPieceWeight(piece);
      }
    }
  }
  
  // Calculate piece-type dominance ratios
  const totalActivity = bishopActivity + knightActivity + rookActivity;
  if (totalActivity > 0) {
    profile.bishop_dominance = bishopActivity / totalActivity;
    profile.knight_dominance = knightActivity / totalActivity;
    profile.rook_dominance = rookActivity / totalActivity;
  }
  
  // Average pawn advancement (0-5 scale normalized to 0-1)
  profile.pawn_advancement = pawnCount > 0 
    ? (totalPawnAdvancement / pawnCount) / 5 
    : 0;
  
  return profile;
}

/**
 * Get strategic weight for piece type (major pieces = more weight)
 */
function getPieceWeight(piece: string | undefined): number {
  if (!piece) return 0.5;
  const lower = piece.toLowerCase();
  const weights: Record<string, number> = {
    'q': 5.0,  // Queen
    'r': 3.0,  // Rook
    'b': 2.5,  // Bishop
    'n': 2.5,  // Knight
    'p': 1.0,  // Pawn
    'k': 0.5,  // King (doesn't count as much for dominance)
  };
  return weights[lower] || 0.5;
}

/**
 * Generate enhanced fingerprint with piece-type encoding
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
      
      const lastVisit = square.visits[square.visits.length - 1];
      const piece = lastVisit.piece;
      const pieceColor = lastVisit.pieceColor;
      
      let colorCode: string;
      
      if (piece?.toLowerCase() === 'p') {
        // Pawns get gradated colors based on advancement
        colorCode = getPawnColor(piece as 'P' | 'p', rank);
      } else if (piece) {
        // Other pieces get their type-specific color
        colorCode = PIECE_COLOR_CODES[piece as PieceType] || 'x';
      } else {
        colorCode = 'x';
      }
      
      // Append piece color indicator (uppercase = white, lowercase = black)
      const finalCode = pieceColor === 'w' 
        ? colorCode.toUpperCase()
        : colorCode.toLowerCase();
      
      colorMap.push(`${visitCount}${finalCode}`);
    }
  }
  
  const mapString = colorMap.join('');
  let hash = 0;
  for (let i = 0; i < mapString.length; i++) {
    const char = mapString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `epx-${Math.abs(hash).toString(36)}`; // 'epx' = enhanced piece-type extended
}

/**
 * Enhanced archetype classification using 8-quadrant + piece-type profiles
 */
export function classifyEnhancedArchetype(
  profile: EnhancedQuadrantProfile,
  temporalFlow: { early: number; mid: number; late: number }
): string {
  // Calculate advanced metrics
  const kingsidePressure = profile.q1_kingside_white + profile.q3_kingside_black;
  const queensidePressure = profile.q2_queenside_white + profile.q4_queenside_black;
  const centerControl = profile.q5_center_white + profile.q6_center_black;
  const wingExpansion = profile.q7_extended_kingside + profile.q8_extended_queenside;
  
  // Piece-type specific patterns
  const bishopPair = profile.bishop_dominance > 0.35;
  const knightDominant = profile.knight_dominance > 0.40;
  const rookActivity = profile.rook_dominance > 0.30;
  const pawnStorm = profile.pawn_advancement > 0.6;
  
  // Enhanced archetype detection
  if (kingsidePressure > queensidePressure * 1.5 && temporalFlow.mid > 0.5) {
    if (rookActivity && pawnStorm) {
      return 'kingside_blitz'; // Aggressive kingside with rook lift + pawn storm
    }
    return 'kingside_attack';
  }
  
  if (queensidePressure > kingsidePressure * 1.2 && temporalFlow.late > 0.4) {
    if (bishopPair) {
      return 'queenside_bishop_squeeze'; // Queenside pressure leveraging bishop pair
    }
    return 'queenside_pressure';
  }
  
  if (centerControl > 50 && temporalFlow.early > 0.6) {
    if (knightDominant) {
      return 'central_knight_outpost'; // Knights dominating central squares
    }
    return 'central_domination';
  }
  
  if (wingExpansion > 30 && profile.pawn_advancement > 0.4) {
    if (Math.abs(profile.q7_extended_kingside) > Math.abs(profile.q8_extended_queenside)) {
      return 'kingside_expansion';
    }
    return 'queenside_expansion';
  }
  
  if (profile.bishop_dominance > 0.40 && profile.knight_dominance < 0.25) {
    return 'bishop_pair_mastery';
  }
  
  if (profile.pawn_advancement > 0.7) {
    return 'pawn_storm_assault';
  }
  
  // Default with temporal characteristics
  if (temporalFlow.early > 0.5) {
    return 'development_focus';
  } else if (temporalFlow.mid > 0.5) {
    return 'middlegame_complexity';
  } else {
    return 'endgame_technique';
  }
}

/**
 * Infrastructure impact assessment
 */
export const INFRASTRUCTURE_IMPACT = {
  // Current system
  current: {
    colors: 2,  // White/Black only
    quadrants: 4,
    signatureComplexity: 'low',
    storagePerGame: '~200 bytes',
  },
  
  // Enhanced system
  enhanced: {
    colors: 12, // 6 piece types × 2 colors (K,Q,R,B,N,P-graded)
    quadrants: 8,
    signatureComplexity: 'high',
    storagePerGame: '~800 bytes', // 4x larger signatures
  },
  
  // Impact estimates
  storageIncrease: '4x',
  processingTimeIncrease: '1.5x', // More calculations but still fast
  accuracyImprovementEstimate: '+15-25%',
  implementationTime: '2-3 days',
  
  // Required changes
  changesNeeded: [
    'Modify SquareData to track piece type',
    'Update all 60+ domain adapters to 8-quadrant format',
    'Retrain archetype classification',
    'Migrate existing prediction database',
    'Update dashboard visualization for 8-quadrant radar',
    'Recalibrate confidence scores',
  ]
};

export default {
  PIECE_COLOR_CODES,
  getPawnColor,
  calculateEnhancedQuadrantProfile,
  generateEnhancedFingerprint,
  classifyEnhancedArchetype,
  INFRASTRUCTURE_IMPACT,
};
