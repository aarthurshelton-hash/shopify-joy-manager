/**
 * Chess.com Puzzle API Integration
 * Fetches daily puzzles and puzzle rush data
 * 
 * v8.1-PUZZLES: New source for temporal pattern training
 */

export interface ChessComPuzzle {
  id: string;
  fen: string;
  moves: string[]; // Solution in SAN format
  rating: number;
  themes: string[];
  daily?: boolean; // Is this the daily puzzle?
  rushMode?: 'bullet' | 'blitz' | 'rapid';
}

export interface ChessComPuzzleResult {
  puzzles: ChessComPuzzle[];
  totalFetched: number;
  errors: string[];
}

// Chess.com puzzle themes mapping
export const CHESSCOM_PUZZLE_THEMES = [
  'Mate',
  'Material Advantage',
  'Endgame Technique',
  'Tactical Patterns',
  'Defense',
  'Attack',
  'Fork',
  'Pin',
  'Skewer',
  'Discovered Attack',
  'Sacrifice',
  'Clearance',
  'Blocking',
  'Interference',
  'Attraction',
  'Deflection',
  'Decoy',
  'Desperado',
  'Passed Pawns',
  'Promotion',
  'Stalemate',
  'Perpetual Check',
  'Zugzwang',
  'Kingside Attack',
  'Queenside Attack',
  'Center Control',
  'Piece Coordination',
  'Prophylaxis',
  'Space Advantage',
  'Time Trouble'
] as const;

/**
 * Fetch daily puzzle from Chess.com
 * Returns today's featured puzzle
 */
export async function fetchChessComDailyPuzzle(): Promise<ChessComPuzzle | null> {
  try {
    const response = await fetch('https://api.chess.com/pub/puzzle');
    
    if (!response.ok) {
      console.warn(`[Chess.com Puzzles] Daily puzzle fetch failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    return {
      id: `ccp_${data.id}`,
      fen: data.fen,
      moves: data.pgn ? parsePgnToMoves(data.pgn) : [],
      rating: data.rating || 1500,
      themes: data.themes || [],
      daily: true
    };
  } catch (error) {
    console.error('[Chess.com Puzzles] Daily puzzle error:', error);
    return null;
  }
}

/**
 * Fetch random puzzles from Chess.com
 * Note: Chess.com has limited public puzzle API
 * Uses daily puzzle + archive approach
 */
export async function fetchChessComPuzzles(
  options: {
    max?: number;
    minRating?: number;
    maxRating?: number;
  } = {}
): Promise<ChessComPuzzleResult> {
  const { max = 50, minRating = 800, maxRating = 2800 } = options;
  
  const puzzles: ChessComPuzzle[] = [];
  const errors: string[] = [];
  
  try {
    // Fetch daily puzzle first
    const dailyPuzzle = await fetchChessComDailyPuzzle();
    if (dailyPuzzle && 
        dailyPuzzle.rating >= minRating && 
        dailyPuzzle.rating <= maxRating) {
      puzzles.push(dailyPuzzle);
    }
    
    // Fetch from archive if available
    // Chess.com doesn't have a direct "random puzzle" API
    // So we fetch from their daily archive
    const archiveResponse = await fetch('https://api.chess.com/pub/puzzle/history');
    
    if (archiveResponse.ok) {
      const archive = await archiveResponse.json();
      const puzzleIds = Object.keys(archive.puzzles || {}).slice(0, max - puzzles.length);
      
      for (const puzzleId of puzzleIds) {
        if (puzzles.length >= max) break;
        
        try {
          const puzzleData = archive.puzzles[puzzleId];
          
          if (puzzleData.rating >= minRating && puzzleData.rating <= maxRating) {
            puzzles.push({
              id: `ccp_${puzzleId}`,
              fen: puzzleData.fen,
              moves: puzzleData.solution || [],
              rating: puzzleData.rating,
              themes: puzzleData.themes || [],
              daily: false
            });
          }
        } catch (err) {
          errors.push(`Puzzle ${puzzleId}: ${err instanceof Error ? err.message : 'Parse error'}`);
        }
      }
    }
    
    console.log(`[Chess.com Puzzles v8.1] ✓ Fetched ${puzzles.length} puzzles (daily: ${puzzles.filter(p => p.daily).length})`);
    
    return {
      puzzles,
      totalFetched: puzzles.length,
      errors
    };
    
  } catch (error) {
    console.error('[Chess.com Puzzles] Fetch error:', error);
    return {
      puzzles,
      totalFetched: puzzles.length,
      errors: [error instanceof Error ? error.message : 'Unknown error', ...errors]
    };
  }
}

/**
 * Parse PGN moves to array
 */
function parsePgnToMoves(pgn: string): string[] {
  // Remove headers
  const moveSection = pgn.replace(/\[.*?\]/g, '').trim();
  
  // Extract moves (simplified parsing)
  const moves: string[] = [];
  const tokens = moveSection.split(/\s+/);
  
  for (const token of tokens) {
    // Skip move numbers and results
    if (token.match(/^\d+\.$/) || token.match(/^(1-0|0-1|1\/2-1\/2|\*)$/)) {
      continue;
    }
    // Keep actual moves
    if (token.length > 0 && !token.includes('{') && !token.includes('}')) {
      moves.push(token);
    }
  }
  
  return moves;
}

/**
 * Convert Chess.com puzzle to unified format
 */
export function chessComPuzzleToUnified(
  puzzle: ChessComPuzzle
): {
  pgn: string;
  fen: string;
  gameId: string;
  source: 'puzzle_cc';
  themes: string[];
  rating: number;
  solution: string[];
  daily: boolean;
} {
  const moves = puzzle.moves.map((move, i) => 
    i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ${move}` : move
  ).join(' ');
  
  const pgn = `[Event "Chess.com Puzzle ${puzzle.id}"]\n` +
              `[FEN "${puzzle.fen}"]\n` +
              `[PuzzleRating "${puzzle.rating}"]\n` +
              `[PuzzleThemes "${puzzle.themes.join(', ')}"]\n` +
              `[Daily "${puzzle.daily ? 'Yes' : 'No'}"]\n\n` +
              `${moves} *`;
  
  return {
    pgn,
    fen: puzzle.fen,
    gameId: `ccp_${puzzle.id.replace('ccp_', '')}`,
    source: 'puzzle_cc' as const,
    themes: puzzle.themes,
    rating: puzzle.rating,
    solution: puzzle.moves,
    daily: puzzle.daily || false
  };
}
