/**
 * Timeline Analysis Utilities
 * 
 * Unified analysis functions for extracting timeline moments from PGN,
 * including tactics, special moves, move quality, and phase detection.
 */

import { Chess, Move, PieceSymbol, Square } from 'chess.js';
import { classifyMoves, MoveQuality, ClassifiedMove } from './moveQuality';
import { 
  analyzeGame, 
  GameAnalysis, 
  TacticalMotif, 
  SpecialMove, 
  GamePhase 
} from './chessAnalysis';
import { TimelineMoment, MomentType } from '@/components/chess/EnhancedTimelineMarker';

export interface TimelineAnalysisResult {
  moments: TimelineMoment[];
  phases: GamePhase[];
  tactics: TacticalMotif[];
  specialMoves: SpecialMove[];
  classifiedMoves: ClassifiedMove[];
  summary: {
    totalMoves: number;
    captureCount: number;
    checkCount: number;
    checkmateCount: number;
    castleCount: number;
    brilliantCount: number;
    greatCount: number;
    blunderCount: number;
    mistakeCount: number;
    inaccuracyCount: number;
    forkCount: number;
    pinCount: number;
    sacrificeCount: number;
    promotionCount: number;
    enPassantCount: number;
    accuracy: number;
  };
}

/**
 * Performs comprehensive timeline analysis on a PGN
 */
export function analyzeTimeline(pgn: string, moves: string[]): TimelineAnalysisResult {
  const moments: TimelineMoment[] = [];
  const summary = {
    totalMoves: moves.length,
    captureCount: 0,
    checkCount: 0,
    checkmateCount: 0,
    castleCount: 0,
    brilliantCount: 0,
    greatCount: 0,
    blunderCount: 0,
    mistakeCount: 0,
    inaccuracyCount: 0,
    forkCount: 0,
    pinCount: 0,
    sacrificeCount: 0,
    promotionCount: 0,
    enPassantCount: 0,
    accuracy: 0,
  };

  // Get classified moves for quality analysis
  let classifiedMoves: ClassifiedMove[] = [];
  try {
    classifiedMoves = classifyMoves(pgn);
  } catch {
    // Silent fail
  }

  // Get full game analysis for tactics and special moves
  let gameAnalysis: GameAnalysis | null = null;
  try {
    gameAnalysis = analyzeGame(pgn);
  } catch {
    // Silent fail
  }

  // Process each move for basic events and quality
  moves.forEach((move, index) => {
    const moveNumber = index + 1;
    const player: 'white' | 'black' = index % 2 === 0 ? 'white' : 'black';
    const classified = classifiedMoves[index];
    const quality = classified?.quality;

    // Move quality moments (prioritize these as they're most significant)
    if (quality === 'brilliant') {
      moments.push({ 
        moveNumber, 
        type: 'brilliant', 
        move, 
        player, 
        quality,
        description: 'An exceptional move that dramatically improves the position, often involving a brilliant sacrifice.'
      });
      summary.brilliantCount++;
    } else if (quality === 'great') {
      moments.push({ 
        moveNumber, 
        type: 'great', 
        move, 
        player, 
        quality,
        description: 'A strong move that significantly strengthens the position.'
      });
      summary.greatCount++;
    } else if (quality === 'blunder') {
      moments.push({ 
        moveNumber, 
        type: 'blunder', 
        move, 
        player, 
        quality,
        description: 'A severe error that may lose the game.'
      });
      summary.blunderCount++;
    } else if (quality === 'mistake') {
      moments.push({ 
        moveNumber, 
        type: 'mistake', 
        move, 
        player, 
        quality,
        description: 'A clear error losing material or significant advantage.'
      });
      summary.mistakeCount++;
    } else if (quality === 'inaccuracy') {
      moments.push({ 
        moveNumber, 
        type: 'inaccuracy', 
        move, 
        player, 
        quality,
        description: 'A slightly imprecise move that gives up some advantage.'
      });
      summary.inaccuracyCount++;
    }

    // Checkmate (highest priority event)
    if (move.includes('#')) {
      moments.push({ 
        moveNumber, 
        type: 'checkmate', 
        move, 
        player,
        description: `${player === 'white' ? 'White' : 'Black'} delivers checkmate! The game ends in victory.`
      });
      summary.checkmateCount++;
    }
    // Check
    else if (move.includes('+')) {
      moments.push({ 
        moveNumber, 
        type: 'check', 
        move, 
        player,
        description: `${player === 'white' ? 'White' : 'Black'} puts the king in check.`
      });
      summary.checkCount++;
    }

    // Capture (only if not already a quality move to avoid duplicates)
    if (move.includes('x') && !quality) {
      const capturedPiece = guessCapturedPiece(move);
      moments.push({ 
        moveNumber, 
        type: 'capture', 
        move, 
        player,
        description: capturedPiece 
          ? `${player === 'white' ? 'White' : 'Black'} captures the ${capturedPiece}.`
          : `A piece is captured, shifting the material balance.`
      });
      summary.captureCount++;
    }

    // Castling
    if (move.includes('O-O') || move.includes('0-0')) {
      const isKingside = move === 'O-O' || move === '0-0';
      moments.push({ 
        moveNumber, 
        type: 'castling', 
        move, 
        player,
        description: `${player === 'white' ? 'White' : 'Black'} castles ${isKingside ? 'kingside' : 'queenside'}, bringing the king to safety.`
      });
      summary.castleCount++;
    }

    // Promotion
    if (move.includes('=')) {
      const promotedTo = move.match(/=([QRBN])/)?.[1];
      const isUnderpromotion = promotedTo && promotedTo !== 'Q';
      moments.push({ 
        moveNumber, 
        type: isUnderpromotion ? 'underpromotion' : 'promotion', 
        move, 
        player,
        description: isUnderpromotion
          ? `Strategic underpromotion to ${getPieceName(promotedTo as PieceSymbol)}!`
          : `Pawn promotes to ${getPieceName((promotedTo || 'Q') as PieceSymbol)}!`
      });
      summary.promotionCount++;
    }
  });

  // Add tactical moments from game analysis
  if (gameAnalysis) {
    for (const tactic of gameAnalysis.tactics) {
      const existingMoment = moments.find(m => m.moveNumber === tactic.moveNumber);
      
      if (tactic.type === 'fork' || tactic.type === 'pin' || tactic.type === 'skewer' || 
          tactic.type === 'discovery' || tactic.type === 'sacrifice') {
        // Add as new moment or enrich existing
        if (!existingMoment || existingMoment.type === 'capture') {
          moments.push({
            moveNumber: tactic.moveNumber,
            type: tactic.type as MomentType,
            move: tactic.notation,
            player: tactic.moveNumber % 2 === 1 ? 'white' : 'black',
            tactic,
            description: tactic.description
          });
          
          if (tactic.type === 'fork') summary.forkCount++;
          if (tactic.type === 'pin') summary.pinCount++;
          if (tactic.type === 'sacrifice') summary.sacrificeCount++;
        } else if (existingMoment) {
          existingMoment.tactic = tactic;
        }
      }
    }

    // Add special moves
    for (const special of gameAnalysis.specialMoves) {
      if (special.type === 'en_passant') {
        const existingIdx = moments.findIndex(m => m.moveNumber === special.moveNumber && m.type === 'capture');
        if (existingIdx >= 0) {
          moments[existingIdx].type = 'en_passant';
          moments[existingIdx].description = 'En passant capture! A special pawn capture.';
        }
        summary.enPassantCount++;
      }
    }
  }

  // Calculate accuracy
  if (classifiedMoves.length > 0) {
    const goodMoves = classifiedMoves.filter(m => 
      ['brilliant', 'great', 'best', 'good', 'book'].includes(m.quality)
    ).length;
    summary.accuracy = Math.round((goodMoves / classifiedMoves.length) * 100);
  }

  // Sort moments by move number and remove duplicates
  const uniqueMoments = deduplicateMoments(moments.sort((a, b) => a.moveNumber - b.moveNumber));

  return {
    moments: uniqueMoments,
    phases: gameAnalysis?.phases || getDefaultPhases(moves.length),
    tactics: gameAnalysis?.tactics || [],
    specialMoves: gameAnalysis?.specialMoves || [],
    classifiedMoves,
    summary
  };
}

/**
 * Remove duplicate moments at the same move number, keeping the most significant
 */
function deduplicateMoments(moments: TimelineMoment[]): TimelineMoment[] {
  const seen = new Map<number, TimelineMoment[]>();
  
  for (const moment of moments) {
    const existing = seen.get(moment.moveNumber) || [];
    existing.push(moment);
    seen.set(moment.moveNumber, existing);
  }
  
  const result: TimelineMoment[] = [];
  const priority: Record<MomentType, number> = {
    checkmate: 100,
    brilliant: 95,
    sacrifice: 90,
    fork: 85,
    pin: 80,
    skewer: 78,
    discovery: 75,
    blunder: 70,
    great: 65,
    mistake: 60,
    promotion: 55,
    underpromotion: 54,
    en_passant: 50,
    check: 45,
    inaccuracy: 40,
    castling: 35,
    capture: 30,
  };
  
  for (const [, group] of seen) {
    // Take top 2 most significant moments per move
    const sorted = group.sort((a, b) => (priority[b.type] || 0) - (priority[a.type] || 0));
    result.push(...sorted.slice(0, 2));
  }
  
  return result.sort((a, b) => a.moveNumber - b.moveNumber);
}

/**
 * Get default phase breakdown when analysis isn't available
 */
function getDefaultPhases(totalMoves: number): GamePhase[] {
  const openingEnd = Math.min(Math.floor(totalMoves * 0.2), 30);
  const endgameStart = Math.max(Math.floor(totalMoves * 0.7), openingEnd + 1);
  
  return [
    {
      name: 'opening',
      startMove: 1,
      endMove: openingEnd,
      description: 'Development and central control',
      keyEvents: ['Piece development', 'King safety', 'Center control']
    },
    {
      name: 'middlegame',
      startMove: openingEnd + 1,
      endMove: endgameStart - 1,
      description: 'Tactical battles and strategic maneuvering',
      keyEvents: ['Attack building', 'Piece coordination', 'Tactical opportunities']
    },
    {
      name: 'endgame',
      startMove: endgameStart,
      endMove: totalMoves,
      description: 'King activation and pawn promotion',
      keyEvents: ['King activation', 'Pawn advancement', 'Technique']
    }
  ];
}

/**
 * Guess the captured piece from move notation
 */
function guessCapturedPiece(move: string): string | null {
  // Simple heuristic - in SAN, captures don't explicitly state what was captured
  // We can only guess based on destination square patterns
  if (move.includes('x')) {
    // If lowercase after x, it's just the square
    // We can't reliably determine what was captured without board state
    return null;
  }
  return null;
}

/**
 * Get full piece name from symbol
 */
function getPieceName(piece: PieceSymbol): string {
  const names: Record<string, string> = {
    'Q': 'Queen',
    'R': 'Rook', 
    'B': 'Bishop',
    'N': 'Knight',
    'K': 'King',
    'q': 'Queen',
    'r': 'Rook',
    'b': 'Bishop',
    'n': 'Knight',
    'k': 'King',
    'p': 'Pawn',
  };
  return names[piece] || piece;
}

/**
 * Get moment counts grouped by category
 */
export function getMomentCounts(moments: TimelineMoment[]) {
  const counts: Record<MomentType, number> = {
    capture: 0, check: 0, checkmate: 0, castling: 0,
    brilliant: 0, great: 0, blunder: 0, mistake: 0, inaccuracy: 0,
    fork: 0, pin: 0, skewer: 0, discovery: 0, sacrifice: 0,
    en_passant: 0, promotion: 0, underpromotion: 0,
  };
  
  for (const moment of moments) {
    counts[moment.type]++;
  }
  
  return counts;
}
