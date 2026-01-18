/**
 * Pattern-to-Move Translator
 * 
 * The bridge from outcome prediction to move selection.
 * This is the path from "knowing who will win" to "knowing how to play."
 * 
 * Architecture:
 * 1. Use Color Flow patterns to understand strategic trajectory
 * 2. Use Stockfish for tactical validation
 * 3. Synthesize: Choose moves that align with predicted winning trajectory
 * 
 * Goal: Eventually enable move-selection superiority over Stockfish by
 * choosing strategically correct moves that engines might not prioritize.
 */

import { Chess, Move } from 'chess.js';

export interface PatternMoveContext {
  archetype: string;
  dominantForce: 'material' | 'position' | 'initiative' | 'structure';
  flowDirection: 'aggressive' | 'defensive' | 'balanced' | 'transitional';
  intensity: number;
  trajectoryPrediction: 'WHITE_WINS' | 'BLACK_WINS' | 'DRAW';
  trajectoryConfidence: number;
}

export interface MoveCandidate {
  move: Move;
  san: string;
  strategicScore: number;
  tacticalScore: number;
  compositeScore: number;
  alignsWithTrajectory: boolean;
  reasoning: string;
}

export interface StrategicMoveTheme {
  theme: string;
  description: string;
  movePatterns: string[];
  archetypeAffinity: string[];
}

// Strategic themes that pattern recognition can identify
const STRATEGIC_THEMES: StrategicMoveTheme[] = [
  {
    theme: 'SPACE_EXPANSION',
    description: 'Pushing pawns to claim territory',
    movePatterns: ['e4', 'd4', 'c4', 'f4', 'e5', 'd5', 'c5'],
    archetypeAffinity: ['GRAND_MASTER_CONTROL', 'POSITIONAL_PYTHON']
  },
  {
    theme: 'PIECE_ACTIVATION',
    description: 'Developing pieces to active squares',
    movePatterns: ['Nf3', 'Nc3', 'Bc4', 'Bb5', 'Bf4', 'Bg5'],
    archetypeAffinity: ['TACTICAL_STORM', 'DYNAMIC_BALANCE']
  },
  {
    theme: 'KING_SAFETY',
    description: 'Castling and securing the king',
    movePatterns: ['O-O', 'O-O-O', 'Kg1', 'Kh1'],
    archetypeAffinity: ['FORTRESS_BUILDER', 'ENDGAME_SPECIALIST']
  },
  {
    theme: 'CENTRAL_CONTROL',
    description: 'Controlling key central squares',
    movePatterns: ['e4', 'd4', 'Nc3', 'Nf3', 'Bc4', 'Bd3'],
    archetypeAffinity: ['GRAND_MASTER_CONTROL', 'CLASSICAL_MAESTRO']
  },
  {
    theme: 'FLANK_ATTACK',
    description: 'Attacking on the flanks while center is stable',
    movePatterns: ['h4', 'g4', 'a4', 'b4', 'h5', 'g5'],
    archetypeAffinity: ['AGGRESSIVE_ATTACKER', 'TACTICAL_STORM']
  },
  {
    theme: 'EXCHANGE_SIMPLIFICATION',
    description: 'Trading pieces to simplify to favorable endgame',
    movePatterns: ['Bxc6', 'Nxd5', 'Rxe8', 'Qxd8'],
    archetypeAffinity: ['ENDGAME_SPECIALIST', 'GRINDER']
  },
  {
    theme: 'PROPHYLAXIS',
    description: 'Preventing opponent threats before they materialize',
    movePatterns: ['h3', 'a3', 'Be3', 'Bf4'],
    archetypeAffinity: ['FORTRESS_BUILDER', 'POSITIONAL_PYTHON']
  },
  {
    theme: 'BREAKTHROUGH_PREPARATION',
    description: 'Preparing a pawn break to open lines',
    movePatterns: ['f5', 'c5', 'b5', 'd5', 'e5'],
    archetypeAffinity: ['TACTICAL_STORM', 'DYNAMIC_BALANCE']
  }
];

class PatternToMoveTranslator {
  /**
   * Analyze all legal moves and score them based on pattern context
   */
  analyzeMoves(
    fen: string,
    context: PatternMoveContext,
    stockfishEvals?: Map<string, number>
  ): MoveCandidate[] {
    const chess = new Chess(fen);
    const legalMoves = chess.moves({ verbose: true });
    const candidates: MoveCandidate[] = [];
    
    const isWhiteToMove = chess.turn() === 'w';
    const weArePredictedWinner = 
      (isWhiteToMove && context.trajectoryPrediction === 'WHITE_WINS') ||
      (!isWhiteToMove && context.trajectoryPrediction === 'BLACK_WINS');
    
    for (const move of legalMoves) {
      const strategicScore = this.calculateStrategicScore(move, context, chess);
      const tacticalScore = stockfishEvals?.get(move.san) ?? 0.5;
      
      // Composite score weighs strategy higher when we're predicted to win
      // (maintain winning trajectory) vs. tactics when losing (seek complications)
      const strategyWeight = weArePredictedWinner ? 0.6 : 0.35;
      const tacticsWeight = 1 - strategyWeight;
      
      const compositeScore = (strategicScore * strategyWeight) + (tacticalScore * tacticsWeight);
      
      const alignsWithTrajectory = this.checkTrajectoryAlignment(move, context, chess);
      
      candidates.push({
        move,
        san: move.san,
        strategicScore,
        tacticalScore,
        compositeScore,
        alignsWithTrajectory,
        reasoning: this.generateMoveReasoning(move, context, strategicScore, alignsWithTrajectory)
      });
    }
    
    // Sort by composite score
    candidates.sort((a, b) => b.compositeScore - a.compositeScore);
    
    return candidates;
  }

  /**
   * Calculate strategic score for a move based on pattern context
   */
  private calculateStrategicScore(
    move: Move,
    context: PatternMoveContext,
    chess: Chess
  ): number {
    let score = 0.5; // Neutral baseline
    
    // 1. Theme alignment
    const relevantThemes = STRATEGIC_THEMES.filter(t => 
      t.archetypeAffinity.some(a => context.archetype.includes(a) || a.includes(context.archetype))
    );
    
    for (const theme of relevantThemes) {
      if (theme.movePatterns.some(pattern => this.moveMatchesPattern(move.san, pattern))) {
        score += 0.15;
      }
    }
    
    // 2. Flow direction alignment
    switch (context.flowDirection) {
      case 'aggressive':
        // Prefer captures, checks, forward pawn moves
        if (move.flags.includes('c') || move.flags.includes('e')) score += 0.1;
        if (move.san.includes('+')) score += 0.1;
        if (move.piece === 'p' && this.isPawnAdvancing(move, chess.turn())) score += 0.05;
        break;
      case 'defensive':
        // Prefer consolidating moves, king safety
        if (move.san.includes('O-O')) score += 0.15;
        if (move.piece === 'k' && this.isKingTowardsSafety(move)) score += 0.1;
        break;
      case 'balanced':
        // Prefer central control, development
        if (this.isCentralSquare(move.to)) score += 0.1;
        break;
      case 'transitional':
        // Prefer flexible moves that don't commit
        if (!move.flags.includes('c') && !move.san.includes('+')) score += 0.05;
        break;
    }
    
    // 3. Dominant force alignment
    switch (context.dominantForce) {
      case 'material':
        // Prefer material-gaining moves
        if (move.captured) {
          const pieceValues: Record<string, number> = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9 };
          score += (pieceValues[move.captured] || 0) * 0.02;
        }
        break;
      case 'position':
        // Prefer piece placement improvement
        if (this.isBetterSquare(move)) score += 0.1;
        break;
      case 'initiative':
        // Prefer tempo-gaining moves
        if (move.san.includes('+') || this.isThreatCreating(move, chess)) score += 0.1;
        break;
      case 'structure':
        // Prefer pawn structure improvement
        if (move.piece === 'p' && !this.createsPawnWeakness(move, chess)) score += 0.1;
        break;
    }
    
    // 4. Intensity scaling
    // Higher intensity = more decisive moves preferred
    if (context.intensity > 0.7) {
      if (move.san.includes('+') || move.captured) score += 0.1;
    } else if (context.intensity < 0.3) {
      if (!move.captured && !move.san.includes('+')) score += 0.05;
    }
    
    // Clamp to 0-1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Check if move aligns with predicted trajectory
   */
  private checkTrajectoryAlignment(
    move: Move,
    context: PatternMoveContext,
    chess: Chess
  ): boolean {
    const isWhite = chess.turn() === 'w';
    const predictedWinner = context.trajectoryPrediction;
    
    // If we're the predicted winner, prefer consolidating moves
    // If we're the predicted loser, prefer complicating moves
    
    if ((isWhite && predictedWinner === 'WHITE_WINS') || 
        (!isWhite && predictedWinner === 'BLACK_WINS')) {
      // We're winning - avoid unnecessary risks
      if (move.san.includes('O-O')) return true; // Castling is safe
      if (move.captured && this.isSafeCapture(move, chess)) return true;
      return !this.isRiskyMove(move, chess);
    } else if ((isWhite && predictedWinner === 'BLACK_WINS') || 
               (!isWhite && predictedWinner === 'WHITE_WINS')) {
      // We're losing - seek complications
      if (move.san.includes('+')) return true;
      if (this.isThreatCreating(move, chess)) return true;
      return this.isRiskyMove(move, chess); // Risky moves are good when losing
    }
    
    // Draw prediction - prefer simplification
    return move.captured !== undefined;
  }

  /**
   * Generate human-readable reasoning for a move
   */
  private generateMoveReasoning(
    move: Move,
    context: PatternMoveContext,
    strategicScore: number,
    alignsWithTrajectory: boolean
  ): string {
    const parts: string[] = [];
    
    // Move type description
    if (move.san.includes('O-O')) {
      parts.push('Secures king safety');
    } else if (move.captured) {
      parts.push(`Captures ${move.captured}`);
    } else if (move.san.includes('+')) {
      parts.push('Gives check');
    } else if (move.flags.includes('p')) {
      parts.push('Promotes pawn');
    } else {
      parts.push(`Develops ${move.piece.toUpperCase()} to ${move.to}`);
    }
    
    // Strategic alignment
    if (strategicScore > 0.7) {
      parts.push(`strongly aligns with ${context.archetype} strategy`);
    } else if (strategicScore > 0.5) {
      parts.push(`supports ${context.flowDirection} flow`);
    }
    
    // Trajectory alignment
    if (alignsWithTrajectory) {
      parts.push(`maintains winning trajectory`);
    }
    
    return parts.join(', ');
  }

  // Helper methods
  private moveMatchesPattern(san: string, pattern: string): boolean {
    return san.startsWith(pattern) || san === pattern;
  }

  private isPawnAdvancing(move: Move, turn: 'w' | 'b'): boolean {
    if (move.piece !== 'p') return false;
    const fromRank = parseInt(move.from[1]);
    const toRank = parseInt(move.to[1]);
    return turn === 'w' ? toRank > fromRank : toRank < fromRank;
  }

  private isKingTowardsSafety(move: Move): boolean {
    // King moving toward corner is generally safer
    const safeSquares = ['g1', 'h1', 'g8', 'h8', 'b1', 'a1', 'b8', 'a8'];
    return safeSquares.includes(move.to);
  }

  private isCentralSquare(square: string): boolean {
    const central = ['d4', 'd5', 'e4', 'e5', 'c4', 'c5', 'f4', 'f5'];
    return central.includes(square);
  }

  private isBetterSquare(move: Move): boolean {
    // Pieces generally prefer central and active squares
    return this.isCentralSquare(move.to) || 
           (move.piece === 'n' && ['c3', 'c6', 'f3', 'f6'].includes(move.to));
  }

  private isThreatCreating(move: Move, chess: Chess): boolean {
    // Simplified: checks and attacks on high-value pieces
    return move.san.includes('+') || 
           (move.captured && ['q', 'r'].includes(move.captured));
  }

  private createsPawnWeakness(move: Move, chess: Chess): boolean {
    // Simplified: doubled pawns, isolated pawns
    // Would need more complex logic in production
    return false;
  }

  private isSafeCapture(move: Move, chess: Chess): boolean {
    // Simplified: captures that don't leave piece hanging
    // Would need SEE (Static Exchange Evaluation) in production
    return move.captured !== undefined;
  }

  private isRiskyMove(move: Move, chess: Chess): boolean {
    // Moves that change the character of the position
    return move.san.includes('+') || 
           move.flags.includes('e') || // en passant
           (move.piece === 'q' && !move.captured); // Queen moves without capture
  }

  /**
   * Get the recommended move based on pattern analysis
   */
  getRecommendedMove(
    fen: string,
    context: PatternMoveContext,
    stockfishEvals?: Map<string, number>
  ): MoveCandidate | null {
    const candidates = this.analyzeMoves(fen, context, stockfishEvals);
    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * Find "Brilliant Moves" (!!) - moves that align strongly with pattern
   * but might not be the engine's top choice
   */
  findBrilliantMoves(
    candidates: MoveCandidate[],
    stockfishTopMove: string
  ): MoveCandidate[] {
    return candidates.filter(c => 
      c.san !== stockfishTopMove &&
      c.strategicScore > 0.75 &&
      c.alignsWithTrajectory &&
      c.compositeScore > 0.65
    );
  }
}

export const patternToMoveTranslator = new PatternToMoveTranslator();
