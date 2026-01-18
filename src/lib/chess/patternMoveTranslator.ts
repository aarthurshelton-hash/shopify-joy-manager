/**
 * Pattern-to-Move Translation Layer
 * 
 * THE PARADIGM SHIFT:
 * Instead of calculating "best move" from position evaluation,
 * we select moves that ALIGN with winning trajectory patterns.
 * 
 * Core Insight (CEO Alec Arthur Shelton):
 * "If we know the destination (outcome), we can navigate the path (moves)"
 * 
 * This module translates learned archetype patterns into move preferences,
 * enabling En Pensent to PLAY chess using pattern recognition rather than
 * brute-force calculation.
 */

import { Chess, Move } from 'chess.js';

export interface PatternSignature {
  fingerprint: string;
  archetype: string;
  outcome: 'white_wins' | 'black_wins' | 'draw';
  confidence: number;
  characteristics: {
    tension: number;
    momentum: number;
    complexity: number;
    phase: 'opening' | 'middlegame' | 'endgame';
  };
  movePatterns: MovePattern[];
}

export interface MovePattern {
  moveNumber: number;
  phase: string;
  pieceActivity: Record<string, number>;
  centerControl: number;
  kingSafety: number;
  pawnStructure: string;
  tacticalThemes: string[];
}

export interface MoveScore {
  move: Move;
  san: string;
  trajectoryAlignment: number;  // How well this move aligns with winning patterns
  patternMatch: number;         // Similarity to known winning move patterns
  momentumScore: number;        // Does this maintain/build momentum?
  riskScore: number;            // Deviation from safe trajectory
  compositeScore: number;       // Final weighted score
  reasoning: string;
}

export interface TranslationContext {
  currentFen: string;
  moveHistory: string[];
  detectedArchetype: string;
  trajectoryConfidence: number;
  targetOutcome: 'white_wins' | 'black_wins' | 'draw';
  learnedPatterns: PatternSignature[];
}

/**
 * Extract position characteristics for pattern matching
 */
export function extractPositionCharacteristics(chess: Chess): MovePattern {
  const fen = chess.fen();
  const history = chess.history({ verbose: true });
  const moveNumber = Math.floor(history.length / 2) + 1;
  
  // Determine phase
  let phase: 'opening' | 'middlegame' | 'endgame' = 'opening';
  const pieceCount = countPieces(fen);
  if (pieceCount <= 14) phase = 'endgame';
  else if (moveNumber > 15 || pieceCount <= 24) phase = 'middlegame';
  
  // Calculate center control
  const centerControl = calculateCenterControl(chess);
  
  // Assess king safety
  const kingSafety = assessKingSafety(chess);
  
  // Analyze pawn structure
  const pawnStructure = analyzePawnStructure(fen);
  
  // Detect tactical themes
  const tacticalThemes = detectTacticalThemes(chess);
  
  // Calculate piece activity
  const pieceActivity = calculatePieceActivity(chess);
  
  return {
    moveNumber,
    phase,
    pieceActivity,
    centerControl,
    kingSafety,
    pawnStructure,
    tacticalThemes
  };
}

/**
 * Count total pieces on the board
 */
function countPieces(fen: string): number {
  const position = fen.split(' ')[0];
  return position.replace(/[^pnbrqkPNBRQK]/g, '').length;
}

/**
 * Calculate control of center squares (d4, d5, e4, e5)
 */
function calculateCenterControl(chess: Chess): number {
  const centerSquares = ['d4', 'd5', 'e4', 'e5'] as const;
  let whiteControl = 0;
  let blackControl = 0;
  
  for (const square of centerSquares) {
    const piece = chess.get(square);
    if (piece) {
      if (piece.color === 'w') whiteControl += 2;
      else blackControl += 2;
    }
    
    // Check attacks on center
    // Simplified: check if pieces can move to center
    const moves = chess.moves({ verbose: true });
    for (const move of moves) {
      if (move.to === square) {
        if (chess.turn() === 'w') whiteControl += 0.5;
        else blackControl += 0.5;
      }
    }
  }
  
  // Return normalized value (-1 = black control, +1 = white control)
  const total = whiteControl + blackControl;
  if (total === 0) return 0;
  return (whiteControl - blackControl) / total;
}

/**
 * Assess king safety for both sides
 */
function assessKingSafety(chess: Chess): number {
  const fen = chess.fen();
  const position = fen.split(' ')[0];
  
  // Check if kings are castled (simplified heuristic)
  let whiteSafety = 0;
  let blackSafety = 0;
  
  // White king on g1/h1 with pawns in front = castled kingside
  if (position.includes('K') && (fen.includes('Kg1') || fen.includes('Kh1'))) {
    whiteSafety += 0.5;
  }
  // White king on c1/b1 = castled queenside
  if (position.includes('K') && (fen.includes('Kc1') || fen.includes('Kb1'))) {
    whiteSafety += 0.4;
  }
  
  // Similar for black
  if (position.includes('k') && (fen.includes('kg8') || fen.includes('kh8'))) {
    blackSafety += 0.5;
  }
  if (position.includes('k') && (fen.includes('kc8') || fen.includes('kb8'))) {
    blackSafety += 0.4;
  }
  
  // Pawn shield bonus (simplified)
  const ranks = position.split('/');
  // Check white's pawn shield (rank 2)
  const whitePawns = (ranks[6] || '').match(/P/g)?.length || 0;
  whiteSafety += whitePawns * 0.1;
  
  // Check black's pawn shield (rank 7)
  const blackPawns = (ranks[1] || '').match(/p/g)?.length || 0;
  blackSafety += blackPawns * 0.1;
  
  return (whiteSafety - blackSafety);
}

/**
 * Analyze pawn structure and return a fingerprint
 */
function analyzePawnStructure(fen: string): string {
  const position = fen.split(' ')[0];
  const files = { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0, h: 0 };
  
  // Count pawns per file
  for (const char of position) {
    if (char === 'P' || char === 'p') {
      // This is simplified - in reality we'd track exact positions
    }
  }
  
  // Detect structures
  const structures: string[] = [];
  
  // Check for doubled pawns, isolated pawns, etc. (simplified)
  if (position.includes('PP') || position.includes('pp')) {
    structures.push('doubled');
  }
  
  // Check for pawn chains
  if (position.match(/P.*P.*P/i)) {
    structures.push('chain');
  }
  
  return structures.join(',') || 'standard';
}

/**
 * Detect tactical themes present in the position
 */
function detectTacticalThemes(chess: Chess): string[] {
  const themes: string[] = [];
  const moves = chess.moves({ verbose: true });
  
  // Check for checks
  for (const move of moves) {
    if (move.san.includes('+')) {
      themes.push('check_available');
      break;
    }
  }
  
  // Check for captures
  const captures = moves.filter(m => m.captured);
  if (captures.length > 0) {
    themes.push('captures_available');
  }
  
  // Check for promotions
  const promotions = moves.filter(m => m.promotion);
  if (promotions.length > 0) {
    themes.push('promotion_available');
  }
  
  // Check if in check
  if (chess.inCheck()) {
    themes.push('in_check');
  }
  
  return themes;
}

/**
 * Calculate piece activity scores
 */
function calculatePieceActivity(chess: Chess): Record<string, number> {
  const activity: Record<string, number> = {
    knights: 0,
    bishops: 0,
    rooks: 0,
    queens: 0
  };
  
  const moves = chess.moves({ verbose: true });
  
  for (const move of moves) {
    switch (move.piece) {
      case 'n': activity.knights += 0.1; break;
      case 'b': activity.bishops += 0.1; break;
      case 'r': activity.rooks += 0.1; break;
      case 'q': activity.queens += 0.1; break;
    }
  }
  
  return activity;
}

/**
 * Score a move based on trajectory alignment
 */
export function scoreMoveByTrajectory(
  chess: Chess,
  move: Move,
  context: TranslationContext
): MoveScore {
  const testChess = new Chess(chess.fen());
  testChess.move(move.san);
  
  const beforePattern = extractPositionCharacteristics(chess);
  const afterPattern = extractPositionCharacteristics(testChess);
  
  // Calculate trajectory alignment
  const trajectoryAlignment = calculateTrajectoryAlignment(
    beforePattern,
    afterPattern,
    context.targetOutcome,
    context.detectedArchetype
  );
  
  // Calculate pattern match against learned patterns
  const patternMatch = calculatePatternMatch(
    afterPattern,
    context.learnedPatterns,
    context.targetOutcome
  );
  
  // Calculate momentum score
  const momentumScore = calculateMomentumScore(
    beforePattern,
    afterPattern,
    context.targetOutcome
  );
  
  // Calculate risk score (deviation from known paths)
  const riskScore = calculateRiskScore(
    move,
    context.learnedPatterns,
    afterPattern
  );
  
  // Composite score with learned weights
  const compositeScore = (
    trajectoryAlignment * 0.35 +
    patternMatch * 0.30 +
    momentumScore * 0.20 +
    (1 - riskScore) * 0.15
  );
  
  // Generate reasoning
  const reasoning = generateMoveReasoning(
    move,
    trajectoryAlignment,
    patternMatch,
    momentumScore,
    riskScore,
    context
  );
  
  return {
    move,
    san: move.san,
    trajectoryAlignment,
    patternMatch,
    momentumScore,
    riskScore,
    compositeScore,
    reasoning
  };
}

/**
 * Calculate how well a move aligns with the target trajectory
 */
function calculateTrajectoryAlignment(
  before: MovePattern,
  after: MovePattern,
  targetOutcome: string,
  archetype: string
): number {
  let alignment = 0.5; // Neutral baseline
  
  const isWhiteWinning = targetOutcome === 'white_wins';
  
  // Center control alignment
  if (isWhiteWinning && after.centerControl > before.centerControl) {
    alignment += 0.1;
  } else if (!isWhiteWinning && after.centerControl < before.centerControl) {
    alignment += 0.1;
  }
  
  // King safety alignment
  if (isWhiteWinning && after.kingSafety > before.kingSafety) {
    alignment += 0.1;
  } else if (!isWhiteWinning && after.kingSafety < before.kingSafety) {
    alignment += 0.1;
  }
  
  // Archetype-specific adjustments
  switch (archetype) {
    case 'The Constrictor':
      // Favor moves that increase control
      if (after.centerControl > before.centerControl) alignment += 0.15;
      break;
    case 'The Tactician':
      // Favor moves with tactical themes
      if (after.tacticalThemes.length > before.tacticalThemes.length) alignment += 0.15;
      break;
    case 'The Attacker':
      // Favor aggressive moves
      if (after.tacticalThemes.includes('check_available')) alignment += 0.15;
      break;
    case 'The Positional Master':
      // Favor quiet improvements
      if (after.pieceActivity.bishops > before.pieceActivity.bishops) alignment += 0.1;
      if (after.pieceActivity.knights > before.pieceActivity.knights) alignment += 0.1;
      break;
  }
  
  return Math.min(1, Math.max(0, alignment));
}

/**
 * Calculate match against learned winning patterns
 */
function calculatePatternMatch(
  position: MovePattern,
  learnedPatterns: PatternSignature[],
  targetOutcome: string
): number {
  if (learnedPatterns.length === 0) return 0.5; // No data yet
  
  // Filter patterns by target outcome
  const relevantPatterns = learnedPatterns.filter(p => p.outcome === targetOutcome);
  if (relevantPatterns.length === 0) return 0.5;
  
  let totalMatch = 0;
  let totalWeight = 0;
  
  for (const pattern of relevantPatterns) {
    // Find move patterns in same phase
    const phasePatterns = pattern.movePatterns.filter(mp => mp.phase === position.phase);
    
    for (const mp of phasePatterns) {
      let matchScore = 0;
      
      // Compare center control
      const centerDiff = Math.abs(mp.centerControl - position.centerControl);
      matchScore += (1 - centerDiff) * 0.3;
      
      // Compare king safety
      const safetyDiff = Math.abs(mp.kingSafety - position.kingSafety);
      matchScore += (1 - Math.min(1, safetyDiff)) * 0.3;
      
      // Compare tactical themes
      const commonThemes = mp.tacticalThemes.filter(t => 
        position.tacticalThemes.includes(t)
      ).length;
      matchScore += (commonThemes / Math.max(1, mp.tacticalThemes.length)) * 0.4;
      
      totalMatch += matchScore * pattern.confidence;
      totalWeight += pattern.confidence;
    }
  }
  
  return totalWeight > 0 ? totalMatch / totalWeight : 0.5;
}

/**
 * Calculate momentum score - are we building or losing momentum?
 */
function calculateMomentumScore(
  before: MovePattern,
  after: MovePattern,
  targetOutcome: string
): number {
  let momentum = 0.5;
  
  const isWhiteWinning = targetOutcome === 'white_wins';
  
  // Activity increase = momentum
  const beforeActivity = Object.values(before.pieceActivity).reduce((a, b) => a + b, 0);
  const afterActivity = Object.values(after.pieceActivity).reduce((a, b) => a + b, 0);
  
  if (afterActivity > beforeActivity) {
    momentum += 0.15;
  }
  
  // Phase transitions
  if (before.phase === 'opening' && after.phase === 'middlegame') {
    momentum += 0.1; // Transitioning is progress
  }
  
  // Center control change aligned with goal
  if (isWhiteWinning && after.centerControl > before.centerControl) {
    momentum += 0.1;
  } else if (!isWhiteWinning && after.centerControl < before.centerControl) {
    momentum += 0.1;
  }
  
  return Math.min(1, Math.max(0, momentum));
}

/**
 * Calculate risk of deviating from known winning paths
 */
function calculateRiskScore(
  move: Move,
  learnedPatterns: PatternSignature[],
  afterPosition: MovePattern
): number {
  if (learnedPatterns.length === 0) return 0.5; // Unknown = medium risk
  
  let risk = 0.3; // Base risk
  
  // Piece sacrifices are higher risk
  if (move.captured) {
    const pieceValues: Record<string, number> = {
      'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9
    };
    const capturedValue = pieceValues[move.captured] || 0;
    const movingValue = pieceValues[move.piece] || 0;
    
    if (movingValue > capturedValue + 1) {
      risk += 0.2; // Sacrificing material
    }
  }
  
  // Moving into check indicators
  if (afterPosition.tacticalThemes.includes('in_check')) {
    risk += 0.1;
  }
  
  // Unknown territory (no matching patterns)
  const hasMatchingPhasePatterns = learnedPatterns.some(p =>
    p.movePatterns.some(mp => mp.phase === afterPosition.phase)
  );
  if (!hasMatchingPhasePatterns) {
    risk += 0.2;
  }
  
  return Math.min(1, risk);
}

/**
 * Generate human-readable reasoning for move selection
 */
function generateMoveReasoning(
  move: Move,
  trajectoryAlignment: number,
  patternMatch: number,
  momentumScore: number,
  riskScore: number,
  context: TranslationContext
): string {
  const reasons: string[] = [];
  
  if (trajectoryAlignment > 0.7) {
    reasons.push(`Strongly aligns with ${context.detectedArchetype} trajectory`);
  } else if (trajectoryAlignment > 0.5) {
    reasons.push(`Maintains ${context.detectedArchetype} pattern`);
  }
  
  if (patternMatch > 0.7) {
    reasons.push('Matches learned winning patterns');
  }
  
  if (momentumScore > 0.7) {
    reasons.push('Builds momentum toward target outcome');
  }
  
  if (riskScore < 0.3) {
    reasons.push('Low deviation from known paths');
  } else if (riskScore > 0.6) {
    reasons.push('Higher risk but potentially high reward');
  }
  
  if (move.captured) {
    reasons.push(`Captures ${move.captured}`);
  }
  
  if (move.san.includes('+')) {
    reasons.push('Delivers check');
  }
  
  if (move.promotion) {
    reasons.push(`Promotes to ${move.promotion}`);
  }
  
  return reasons.length > 0 
    ? reasons.join('. ') + '.'
    : 'Standard continuation.';
}

/**
 * Rank all legal moves by trajectory alignment
 */
export function rankMovesByTrajectory(
  chess: Chess,
  context: TranslationContext
): MoveScore[] {
  const moves = chess.moves({ verbose: true });
  
  const scoredMoves = moves.map(move => 
    scoreMoveByTrajectory(chess, move, context)
  );
  
  // Sort by composite score (highest first)
  return scoredMoves.sort((a, b) => b.compositeScore - a.compositeScore);
}

/**
 * Select the best move based on pattern-trajectory alignment
 */
export function selectBestMove(
  chess: Chess,
  context: TranslationContext
): MoveScore | null {
  const rankedMoves = rankMovesByTrajectory(chess, context);
  
  if (rankedMoves.length === 0) return null;
  
  // Return the highest-scoring move
  return rankedMoves[0];
}
