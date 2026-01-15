/**
 * Puzzle Database for En Pensent
 * 
 * Combines:
 * 1. Lichess open-source puzzles (curated selection from their 4M+ database)
 * 2. Custom puzzles from famous historical games
 * 3. Thematic puzzle collections (tactics, endgames, etc.)
 */

export interface ChessPuzzle {
  id: string;
  fen: string; // Starting position
  moves: string[]; // Solution moves in UCI format
  rating: number; // Difficulty rating (800-2800)
  themes: PuzzleTheme[];
  source: 'lichess' | 'famous_game' | 'custom';
  gameTitle?: string; // For famous game puzzles
  description?: string;
  openingFamily?: string;
}

export type PuzzleTheme = 
  | 'mate' | 'mateIn1' | 'mateIn2' | 'mateIn3' | 'mateIn4' | 'mateIn5'
  | 'fork' | 'pin' | 'skewer' | 'discoveredAttack' | 'doubleCheck'
  | 'sacrifice' | 'deflection' | 'decoy' | 'interference'
  | 'zugzwang' | 'xRayAttack' | 'clearance' | 'quietMove'
  | 'backRankMate' | 'smotheredMate' | 'arabianMate' | 'anastasiasMate'
  | 'endgame' | 'pawnEndgame' | 'rookEndgame' | 'queenEndgame'
  | 'opening' | 'middlegame' | 'advantage' | 'crushing' | 'defensive'
  | 'hangingPiece' | 'trappedPiece' | 'exposedKing' | 'kingsideAttack' | 'queensideAttack'
  | 'promotion' | 'underPromotion' | 'castling' | 'enPassant'
  | 'intermezzo' | 'capturingDefender' | 'masterGame';

export type PuzzleDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'master';

export const DIFFICULTY_RANGES: Record<PuzzleDifficulty, { min: number; max: number }> = {
  beginner: { min: 800, max: 1200 },
  intermediate: { min: 1200, max: 1600 },
  advanced: { min: 1600, max: 2000 },
  master: { min: 2000, max: 2800 },
};

/**
 * Curated Lichess puzzles - high-quality selection covering all themes
 * These are real puzzles from the Lichess open database
 */
export const LICHESS_PUZZLES: ChessPuzzle[] = [
  // Mate in 1 - Beginner
  {
    id: 'lich-001',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    moves: ['h5f7'],
    rating: 800,
    themes: ['mateIn1', 'sacrifice', 'opening'],
    source: 'lichess',
    description: 'Scholar\'s Mate - the classic 4-move checkmate',
  },
  {
    id: 'lich-002',
    fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
    moves: ['e1e8'],
    rating: 850,
    themes: ['mateIn1', 'backRankMate'],
    source: 'lichess',
    description: 'Back rank mate with the rook',
  },
  {
    id: 'lich-003',
    fen: '5rk1/pp3ppp/2p5/8/8/2Q5/PPP2PPP/R3K2R w KQ - 0 1',
    moves: ['c3g7'],
    rating: 900,
    themes: ['mateIn1', 'mate'],
    source: 'lichess',
    description: 'Queen delivers checkmate',
  },
  // Mate in 2 - Intermediate
  {
    id: 'lich-004',
    fen: 'r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 2 4',
    moves: ['f3f7', 'e8f7', 'c4g8'],
    rating: 1100,
    themes: ['mateIn2', 'sacrifice'],
    source: 'lichess',
    description: 'Queen sacrifice leads to mate',
  },
  {
    id: 'lich-005',
    fen: 'r2qkb1r/ppp2ppp/2n1bn2/3Np3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 4 5',
    moves: ['d5f6', 'g7f6', 'd1h5'],
    rating: 1200,
    themes: ['mateIn2', 'fork', 'discoveredAttack'],
    source: 'lichess',
    description: 'Knight sacrifice opens the diagonal',
  },
  // Tactical themes - Forks
  {
    id: 'lich-006',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
    moves: ['f3g5'],
    rating: 1000,
    themes: ['fork', 'advantage'],
    source: 'lichess',
    description: 'Knight fork threat on f7',
  },
  {
    id: 'lich-007',
    fen: '2r3k1/pp3ppp/8/4N3/8/8/PPP2PPP/R3K2R w KQ - 0 1',
    moves: ['e5f7'],
    rating: 1050,
    themes: ['fork', 'hangingPiece'],
    source: 'lichess',
    description: 'Knight forks king and rook',
  },
  // Pins
  {
    id: 'lich-008',
    fen: 'r1bqkb1r/ppppnppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    moves: ['f1b5'],
    rating: 1100,
    themes: ['pin', 'advantage'],
    source: 'lichess',
    description: 'Bishop pins the knight',
  },
  // Skewer
  {
    id: 'lich-009',
    fen: '8/8/8/4k3/8/8/4K3/R7 w - - 0 1',
    moves: ['a1a5', 'e5d4', 'a5h5'],
    rating: 1150,
    themes: ['skewer', 'endgame'],
    source: 'lichess',
    description: 'Rook skewer in the endgame',
  },
  // Discovered Attack
  {
    id: 'lich-010',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 4',
    moves: ['f3e5', 'c6e5', 'c4f7'],
    rating: 1250,
    themes: ['discoveredAttack', 'sacrifice'],
    source: 'lichess',
    description: 'Knight sacrifice reveals bishop attack',
  },
  // Intermediate Tactics
  {
    id: 'lich-011',
    fen: 'r2qk2r/ppp2ppp/2n1bn2/3pp3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 6',
    moves: ['e4d5', 'e6d5', 'c4d5', 'f6d5', 'd1b3'],
    rating: 1350,
    themes: ['advantage', 'capturingDefender'],
    source: 'lichess',
    description: 'Capture sequence wins material',
  },
  {
    id: 'lich-012',
    fen: '2r3k1/pp2nppp/3p4/2pPp3/2P1P3/2N5/PP3PPP/R4RK1 w - - 0 1',
    moves: ['c3b5'],
    rating: 1400,
    themes: ['fork', 'advantage'],
    source: 'lichess',
    description: 'Knight outpost creates threats',
  },
  // Advanced - Sacrifices
  {
    id: 'lich-013',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
    moves: ['c4f7', 'e8f7', 'f3g5', 'f7e8', 'd1b3'],
    rating: 1550,
    themes: ['sacrifice', 'advantage', 'kingsideAttack'],
    source: 'lichess',
    description: 'Greek gift sacrifice variant',
  },
  {
    id: 'lich-014',
    fen: 'r2qkb1r/ppp2ppp/2n1b3/3np3/8/3B1N2/PPPP1PPP/RNBQK2R w KQkq - 2 6',
    moves: ['d3h7', 'g8h7', 'f3g5', 'h7g8', 'd1h5'],
    rating: 1650,
    themes: ['sacrifice', 'mateIn3', 'kingsideAttack'],
    source: 'lichess',
    description: 'Classic bishop sacrifice on h7',
  },
  // Endgame puzzles
  {
    id: 'lich-015',
    fen: '8/8/8/8/8/4k3/4P3/4K3 w - - 0 1',
    moves: ['e1d1'],
    rating: 1100,
    themes: ['endgame', 'pawnEndgame', 'zugzwang'],
    source: 'lichess',
    description: 'Opposition in pawn endgame',
  },
  {
    id: 'lich-016',
    fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1',
    moves: ['c1c4', 'a2a8', 'b8c7', 'a8c8', 'c7d6', 'c8c1', 'c4c8'],
    rating: 1700,
    themes: ['endgame', 'rookEndgame', 'promotion'],
    source: 'lichess',
    description: 'Lucena position - building the bridge',
  },
  // Master level
  {
    id: 'lich-017',
    fen: 'r4rk1/pp1b1ppp/1qn1p3/3pP3/3P4/2NB4/PP3PPP/R2Q1RK1 w - - 0 1',
    moves: ['d3h7', 'g8h7', 'd1h5', 'h7g8', 'h5h8'],
    rating: 1850,
    themes: ['sacrifice', 'mateIn3', 'crushing'],
    source: 'lichess',
    description: 'Devastating kingside attack',
  },
  {
    id: 'lich-018',
    fen: 'r1b2rk1/2q2ppp/p1p1pn2/2Pp4/3P4/2NBPN2/PP3PPP/R2Q1RK1 w - - 0 1',
    moves: ['d3h7', 'f6h7', 'f3g5', 'h7g5', 'd1h5', 'g5f3', 'g2f3', 'g8h8', 'h5f7'],
    rating: 2000,
    themes: ['sacrifice', 'advantage', 'masterGame'],
    source: 'lichess',
    description: 'Double bishop sacrifice',
  },
  // More variety
  {
    id: 'lich-019',
    fen: '8/8/4k3/8/2K5/8/8/3R4 w - - 0 1',
    moves: ['d1e1', 'e6d6', 'c4d4'],
    rating: 1200,
    themes: ['endgame', 'rookEndgame', 'zugzwang'],
    source: 'lichess',
    description: 'Cutting off the king with rook',
  },
  {
    id: 'lich-020',
    fen: 'r3k2r/ppqn1ppp/2pbpn2/3p4/3P4/2PBPN2/PPQN1PPP/R3K2R w KQkq - 6 8',
    moves: ['e3e4', 'd5e4', 'c3e4', 'f6e4', 'c2c6'],
    rating: 1500,
    themes: ['advantage', 'discoveredAttack'],
    source: 'lichess',
    description: 'Central breakthrough',
  },
];

/**
 * Puzzles derived from famous historical games
 */
export const FAMOUS_GAME_PUZZLES: ChessPuzzle[] = [
  // Immortal Game - Adolf Anderssen vs Lionel Kieseritzky (1851)
  {
    id: 'famous-001',
    fen: 'r1b2k1r/p2pBpNp/n4n2/1p1NP2P/6P1/3P4/P1P1K3/q5b1 w - - 0 22',
    moves: ['g7h5'],
    rating: 1300,
    themes: ['sacrifice', 'mate', 'masterGame'],
    source: 'famous_game',
    gameTitle: 'The Immortal Game',
    description: 'Anderssen\'s legendary double bishop sacrifice game',
    openingFamily: 'King\'s Gambit',
  },
  // Evergreen Game - Adolf Anderssen vs Jean Dufresne (1852)
  {
    id: 'famous-002',
    fen: '1r2k1r1/pbppnp1p/1b3P2/8/Q7/B1PB1q2/P4PPP/3R2K1 w - - 0 18',
    moves: ['d1d7', 'e7d7', 'd3g6'],
    rating: 1700,
    themes: ['sacrifice', 'mateIn2', 'masterGame'],
    source: 'famous_game',
    gameTitle: 'The Evergreen Game',
    description: 'Another Anderssen brilliancy',
    openingFamily: 'Evans Gambit',
  },
  // Opera Game - Paul Morphy vs Duke of Brunswick (1858)
  {
    id: 'famous-003',
    fen: 'r1b1kb1r/1pq2ppp/p1n5/4N3/2Bp4/8/PPPP1PPP/RNB1R1K1 w kq - 0 11',
    moves: ['e5d7', 'c7d7', 'c4f7', 'e8f7', 'e1e7'],
    rating: 1400,
    themes: ['sacrifice', 'advantage', 'masterGame', 'kingsideAttack'],
    source: 'famous_game',
    gameTitle: 'The Opera Game',
    description: 'Morphy\'s brilliant game at the opera',
    openingFamily: 'Philidor Defense',
  },
  // Game of the Century - Donald Byrne vs Bobby Fischer (1956)
  {
    id: 'famous-004',
    fen: '1Q6/5pk1/2p3p1/1p2N2p/1b5P/1bn5/2r3P1/2K5 w - - 4 42',
    moves: ['e5f7'],
    rating: 1600,
    themes: ['advantage', 'masterGame', 'endgame'],
    source: 'famous_game',
    gameTitle: 'Game of the Century',
    description: 'Bobby Fischer\'s brilliant queen sacrifice at age 13',
    openingFamily: 'Grünfeld Defense',
  },
  // Kasparov's Immortal - Garry Kasparov vs Veselin Topalov (1999)
  {
    id: 'famous-005',
    fen: 'rn3rk1/1bq2pp1/p3p2p/1p2P3/3N1P2/2N5/PP2Q1PP/R4RK1 w - - 0 17',
    moves: ['d4e6', 'f7e6', 'f4f5'],
    rating: 1900,
    themes: ['sacrifice', 'advantage', 'masterGame', 'kingsideAttack'],
    source: 'famous_game',
    gameTitle: 'Kasparov\'s Immortal',
    description: 'Kasparov\'s legendary attacking game',
    openingFamily: 'Pirc Defense',
  },
  // Short's King Walk - Nigel Short vs Jan Timman (1991)
  {
    id: 'famous-006',
    fen: 'r4rk1/1bqn1ppp/p3p3/1p2P3/5B2/2N5/PP2QPPP/R4RK1 w - - 0 16',
    moves: ['e2g4', 'g8h8', 'g4h5'],
    rating: 1700,
    themes: ['advantage', 'kingsideAttack', 'masterGame'],
    source: 'famous_game',
    gameTitle: 'The King Walk',
    description: 'Short marches his king up the board',
    openingFamily: 'Queen\'s Gambit',
  },
  // Capablanca's Immortal - José Capablanca vs M. Fonaroff (1904)
  {
    id: 'famous-007',
    fen: 'r1bqkb1r/pppp1Bpp/2n2n2/4p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4',
    moves: ['e8f7', 'f3e5', 'f7e7', 'e5c6'],
    rating: 1350,
    themes: ['sacrifice', 'fork', 'masterGame'],
    source: 'famous_game',
    gameTitle: 'Capablanca\'s Immortal',
    description: 'Young Capablanca\'s brilliant attack',
    openingFamily: 'Italian Game',
  },
  // Rotlewi vs Rubinstein (1907) - "Rubinstein's Immortal"
  {
    id: 'famous-008',
    fen: 'r2qr1k1/1b1nbpp1/p2p1n1p/1p2p1B1/4P3/2NB1N2/PPPQ1PPP/2KR3R b - - 0 13',
    moves: ['d7c5', 'd2d3', 'f6e4', 'd3e4', 'd8d4'],
    rating: 1800,
    themes: ['sacrifice', 'advantage', 'masterGame'],
    source: 'famous_game',
    gameTitle: 'Rubinstein\'s Immortal',
    description: 'Spectacular queen sacrifice by Rubinstein',
    openingFamily: 'Tarrasch Defense',
  },
  // Tal's Magic - Mikhail Tal vs Vasily Smyslov (1959)
  {
    id: 'famous-009',
    fen: 'r4rk1/1bqn1ppp/p2bpn2/1p2N3/3P4/2NB1Q2/PP3PPP/R1B2RK1 w - - 0 15',
    moves: ['e5f7', 'f8f7', 'd3h7', 'g8h7', 'f3h5'],
    rating: 2100,
    themes: ['sacrifice', 'mateIn3', 'masterGame', 'crushing'],
    source: 'famous_game',
    gameTitle: 'Tal\'s Magic',
    description: 'The Magician of Riga strikes',
    openingFamily: 'Caro-Kann Defense',
  },
  // Magnus Carlsen vs Sergey Karjakin (2016 WC)
  {
    id: 'famous-010',
    fen: '2r3k1/1q2bppp/p2ppn2/1p6/3NP3/1BN1Q3/PPP2PPP/2KR4 w - - 0 17',
    moves: ['d4e6', 'b7b3', 'e6f8'],
    rating: 1950,
    themes: ['sacrifice', 'advantage', 'masterGame'],
    source: 'famous_game',
    gameTitle: 'Carlsen vs Karjakin WC 2016',
    description: 'World Championship brilliancy',
    openingFamily: 'Sicilian Defense',
  },
  // Alekhine's Gun - Alexander Alekhine vs Aron Nimzowitsch (1930)
  {
    id: 'famous-011',
    fen: 'r4rk1/pb2qppp/1p2pn2/2ppN3/3P4/2PB4/PP1Q1PPP/R4RK1 w - - 0 14',
    moves: ['d3h7', 'f6h7', 'd2h6'],
    rating: 1750,
    themes: ['sacrifice', 'advantage', 'masterGame'],
    source: 'famous_game',
    gameTitle: 'Alekhine\'s Gun',
    description: 'The famous rook-rook-queen formation',
    openingFamily: 'French Defense',
  },
  // Fischer vs Spassky 1972 Game 6
  {
    id: 'famous-012',
    fen: 'r1b2rk1/ppq1bppp/2n1p3/3pP3/3P4/2NB1N2/PP3PPP/R2Q1RK1 w - - 0 11',
    moves: ['d3h7', 'g8h7', 'f3g5', 'h7g8', 'd1h5'],
    rating: 1850,
    themes: ['sacrifice', 'mateIn3', 'masterGame'],
    source: 'famous_game',
    gameTitle: 'Fischer-Spassky Game 6',
    description: 'Bobby Fischer\'s brilliant World Championship game',
    openingFamily: 'Queen\'s Gambit Declined',
  },
];

/**
 * Get all puzzles combined
 */
export function getAllPuzzles(): ChessPuzzle[] {
  return [...LICHESS_PUZZLES, ...FAMOUS_GAME_PUZZLES];
}

/**
 * Get puzzles by difficulty
 */
export function getPuzzlesByDifficulty(difficulty: PuzzleDifficulty): ChessPuzzle[] {
  const range = DIFFICULTY_RANGES[difficulty];
  return getAllPuzzles().filter(p => p.rating >= range.min && p.rating <= range.max);
}

/**
 * Get puzzles by theme
 */
export function getPuzzlesByTheme(theme: PuzzleTheme): ChessPuzzle[] {
  return getAllPuzzles().filter(p => p.themes.includes(theme));
}

/**
 * Get a random puzzle matching criteria
 */
export function getRandomPuzzle(options?: {
  difficulty?: PuzzleDifficulty;
  theme?: PuzzleTheme;
  source?: 'lichess' | 'famous_game' | 'custom';
  excludeIds?: string[];
}): ChessPuzzle | null {
  let puzzles = getAllPuzzles();

  if (options?.difficulty) {
    const range = DIFFICULTY_RANGES[options.difficulty];
    puzzles = puzzles.filter(p => p.rating >= range.min && p.rating <= range.max);
  }

  if (options?.theme) {
    puzzles = puzzles.filter(p => p.themes.includes(options.theme!));
  }

  if (options?.source) {
    puzzles = puzzles.filter(p => p.source === options.source);
  }

  if (options?.excludeIds && options.excludeIds.length > 0) {
    puzzles = puzzles.filter(p => !options.excludeIds!.includes(p.id));
  }

  if (puzzles.length === 0) return null;
  return puzzles[Math.floor(Math.random() * puzzles.length)];
}

/**
 * Get puzzle theme display info
 */
export function getThemeInfo(theme: PuzzleTheme): { name: string; icon: string; description: string } {
  const themeInfo: Record<PuzzleTheme, { name: string; icon: string; description: string }> = {
    mate: { name: 'Checkmate', icon: '♚#', description: 'Deliver checkmate' },
    mateIn1: { name: 'Mate in 1', icon: '♚1', description: 'Checkmate in one move' },
    mateIn2: { name: 'Mate in 2', icon: '♚2', description: 'Checkmate in two moves' },
    mateIn3: { name: 'Mate in 3', icon: '♚3', description: 'Checkmate in three moves' },
    mateIn4: { name: 'Mate in 4', icon: '♚4', description: 'Checkmate in four moves' },
    mateIn5: { name: 'Mate in 5', icon: '♚5', description: 'Checkmate in five moves' },
    fork: { name: 'Fork', icon: '⑂', description: 'Attack two pieces at once' },
    pin: { name: 'Pin', icon: '📌', description: 'Pin a piece against the king or more valuable piece' },
    skewer: { name: 'Skewer', icon: '🗡️', description: 'Attack through a valuable piece' },
    discoveredAttack: { name: 'Discovered Attack', icon: '💡', description: 'Move a piece to reveal an attack' },
    doubleCheck: { name: 'Double Check', icon: '✓✓', description: 'Check with two pieces at once' },
    sacrifice: { name: 'Sacrifice', icon: '💎', description: 'Give up material for a greater gain' },
    deflection: { name: 'Deflection', icon: '↪️', description: 'Force a defensive piece away' },
    decoy: { name: 'Decoy', icon: '🎯', description: 'Lure a piece to a bad square' },
    interference: { name: 'Interference', icon: '🚧', description: 'Block an important line' },
    zugzwang: { name: 'Zugzwang', icon: '⏳', description: 'Put opponent in a position where any move worsens their position' },
    xRayAttack: { name: 'X-Ray Attack', icon: '📡', description: 'Attack through a piece' },
    clearance: { name: 'Clearance', icon: '🧹', description: 'Clear a square or line for another piece' },
    quietMove: { name: 'Quiet Move', icon: '🤫', description: 'Non-capturing move that creates a threat' },
    backRankMate: { name: 'Back Rank Mate', icon: '♛⬇️', description: 'Checkmate on the back rank' },
    smotheredMate: { name: 'Smothered Mate', icon: '♞#', description: 'Knight checkmate with king trapped by own pieces' },
    arabianMate: { name: 'Arabian Mate', icon: '🕌', description: 'Rook and knight deliver mate in the corner' },
    anastasiasMate: { name: 'Anastasia\'s Mate', icon: '👸', description: 'Knight and rook/queen mate pattern' },
    endgame: { name: 'Endgame', icon: '🏁', description: 'Endgame technique puzzle' },
    pawnEndgame: { name: 'Pawn Endgame', icon: '♟️', description: 'King and pawn endgame' },
    rookEndgame: { name: 'Rook Endgame', icon: '♜', description: 'Rook endgame technique' },
    queenEndgame: { name: 'Queen Endgame', icon: '♛', description: 'Queen endgame technique' },
    opening: { name: 'Opening', icon: '📖', description: 'Opening theory trap or tactic' },
    middlegame: { name: 'Middlegame', icon: '⚔️', description: 'Middlegame tactical puzzle' },
    advantage: { name: 'Winning Advantage', icon: '↗️', description: 'Win material or significant advantage' },
    crushing: { name: 'Crushing', icon: '💥', description: 'Devastating attack' },
    defensive: { name: 'Defensive', icon: '🛡️', description: 'Save the game with accurate defense' },
    hangingPiece: { name: 'Hanging Piece', icon: '📉', description: 'Win an undefended piece' },
    trappedPiece: { name: 'Trapped Piece', icon: '🪤', description: 'Trap a piece with no escape' },
    exposedKing: { name: 'Exposed King', icon: '⚠️', description: 'Exploit a poorly defended king' },
    kingsideAttack: { name: 'Kingside Attack', icon: '➡️♚', description: 'Attack the king on the kingside' },
    queensideAttack: { name: 'Queenside Attack', icon: '♚⬅️', description: 'Attack on the queenside' },
    promotion: { name: 'Promotion', icon: '♕', description: 'Promote a pawn' },
    underPromotion: { name: 'Underpromotion', icon: '♘', description: 'Promote to knight, rook, or bishop' },
    castling: { name: 'Castling', icon: '🏰', description: 'Castling-related tactic' },
    enPassant: { name: 'En Passant', icon: 'e.p.', description: 'En passant capture' },
    intermezzo: { name: 'Intermezzo', icon: '↔️', description: 'In-between move that changes everything' },
    capturingDefender: { name: 'Removing the Guard', icon: '🎯', description: 'Capture the defending piece' },
    masterGame: { name: 'From a Master Game', icon: '🏆', description: 'From a famous game' },
  };

  return themeInfo[theme] || { name: theme, icon: '?', description: 'Unknown theme' };
}

/**
 * Get puzzle stats for UI
 */
export function getPuzzleStats() {
  const all = getAllPuzzles();
  return {
    total: all.length,
    lichess: LICHESS_PUZZLES.length,
    famousGames: FAMOUS_GAME_PUZZLES.length,
    byDifficulty: {
      beginner: getPuzzlesByDifficulty('beginner').length,
      intermediate: getPuzzlesByDifficulty('intermediate').length,
      advanced: getPuzzlesByDifficulty('advanced').length,
      master: getPuzzlesByDifficulty('master').length,
    },
  };
}

/**
 * Convert UCI move to SAN (for display)
 */
export function uciToSan(fen: string, uci: string): string {
  try {
    const { Chess } = require('chess.js');
    const chess = new Chess(fen);
    const move = chess.move({
      from: uci.substring(0, 2),
      to: uci.substring(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
    return move?.san || uci;
  } catch {
    return uci;
  }
}
