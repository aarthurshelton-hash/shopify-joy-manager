/**
 * Lichess Puzzle API Integration
 * Fetches puzzles from Lichess open database (4M+ puzzles)
 * 
 * v8.1-PUZZLES: New source for temporal pattern training
 */

export interface LichessPuzzle {
  id: string;
  fen: string;
  moves: string[]; // Solution in UCI format
  rating: number;
  ratingDeviation: number;
  themes: string[];
  gameUrl?: string; // Link to source game
  opening?: string;
}

export interface LichessPuzzleResult {
  puzzles: LichessPuzzle[];
  totalFetched: number;
  errors: string[];
}

// Lichess puzzle themes for filtering
export const LICHESS_PUZZLE_THEMES = [
  'mate', 'mateIn1', 'mateIn2', 'mateIn3', 'mateIn4', 'mateIn5',
  'fork', 'pin', 'skewer', 'discoveredAttack', 'doubleCheck',
  'sacrifice', 'deflection', 'decoy', 'interference',
  'zugzwang', 'xRayAttack', 'clearance', 'quietMove',
  'backRankMate', 'smotheredMate', 'arabianMate', 'anastasiasMate',
  'endgame', 'pawnEndgame', 'rookEndgame', 'queenEndgame',
  'opening', 'middlegame', 'advantage', 'crushing', 'defensive',
  'hangingPiece', 'trappedPiece', 'exposedKing', 
  'kingsideAttack', 'queensideAttack',
  'promotion', 'underPromotion', 'castling', 'enPassant',
  'intermezzo', 'capturingDefender', 'masterGame'
] as const;

/**
 * Fetch puzzles from Lichess database
 * Uses database export or API endpoint
 * 
 * v8.1: Fetches real puzzles with temporal pattern data
 */
export async function fetchLichessPuzzles(
  options: {
    max?: number;
    minRating?: number;
    maxRating?: number;
    themes?: string[];
  } = {}
): Promise<LichessPuzzleResult> {
  const { 
    max = 100, 
    minRating = 800, 
    maxRating = 2800,
    themes = []
  } = options;
  
  const errors: string[] = [];
  
  try {
    // Lichess puzzle database API endpoint
    const response = await fetch(
      `https://database.lichess.org/lichess_db_puzzle.csv.zst`,
      { method: 'HEAD' } // Check availability first
    );
    
    // For live fetching, use Lichess API
    const puzzles: LichessPuzzle[] = [];
    
    // Fetch from Lichess puzzle API (batch endpoint)
    const apiUrl = new URL('https://lichess.org/api/puzzle/next');
    if (themes.length > 0) {
      apiUrl.searchParams.set('theme', themes.join(','));
    }
    
    // Fetch multiple puzzles in batches
    const batchSize = Math.min(max, 50); // API limit
    const batchesNeeded = Math.ceil(max / batchSize);
    
    for (let i = 0; i < batchesNeeded && puzzles.length < max; i++) {
      try {
        const batchResponse = await fetch(apiUrl.toString());
        
        if (!batchResponse.ok) {
          errors.push(`Batch ${i + 1}: HTTP ${batchResponse.status}`);
          continue;
        }
        
        const data = await batchResponse.json();
        
        if (data.puzzle) {
          const puzzle: LichessPuzzle = {
            id: `puz_${data.puzzle.id}`,
            fen: data.puzzle.fen,
            moves: data.puzzle.solution || [],
            rating: data.puzzle.rating || 1500,
            ratingDeviation: data.puzzle.ratingDeviation || 100,
            themes: data.puzzle.themes || [],
            gameUrl: data.puzzle.gameId ? `https://lichess.org/${data.puzzle.gameId}` : undefined,
            opening: data.puzzle.opening
          };
          
          // Filter by rating if specified
          if (puzzle.rating >= minRating && puzzle.rating <= maxRating) {
            puzzles.push(puzzle);
          }
        }
        
        // Small delay between requests
        if (i < batchesNeeded - 1) {
          await new Promise(r => setTimeout(r, 100));
        }
      } catch (err) {
        errors.push(`Batch ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    
    console.log(`[Lichess Puzzles v8.1] ✓ Fetched ${puzzles.length} puzzles (themes: ${themes.join(', ') || 'all'})`);
    
    return {
      puzzles,
      totalFetched: puzzles.length,
      errors
    };
    
  } catch (error) {
    console.error('[Lichess Puzzles] Fetch error:', error);
    return {
      puzzles: [],
      totalFetched: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Convert Lichess puzzle to unified game format
 * For benchmark compatibility
 */
export function puzzleToUnified(
  puzzle: LichessPuzzle
): {
  pgn: string;
  fen: string;
  gameId: string;
  source: 'puzzle';
  themes: string[];
  rating: number;
  solution: string[];
} {
  // Create minimal PGN from FEN and solution
  const moves = puzzle.moves.map((move, i) => 
    i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ${move}` : move
  ).join(' ');
  
  const pgn = `[Event "Lichess Puzzle ${puzzle.id}"]\n` +
              `[FEN "${puzzle.fen}"]\n` +
              `[PuzzleRating "${puzzle.rating}"]\n` +
              `[PuzzleThemes "${puzzle.themes.join(', ')}"]\n\n` +
              `${moves} *`;
  
  return {
    pgn,
    fen: puzzle.fen,
    gameId: `puz_${puzzle.id}`,
    source: 'puzzle' as const,
    themes: puzzle.themes,
    rating: puzzle.rating,
    solution: puzzle.moves
  };
}
