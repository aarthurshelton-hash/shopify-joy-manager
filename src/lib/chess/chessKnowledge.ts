/**
 * Comprehensive Chess Knowledge Database
 * 
 * This module provides a unified knowledge base for:
 * - Opening theory and ECO codes
 * - Gambit patterns and compensation
 * - Tactical pattern recognition
 * - Endgame theory
 * - Famous game templates
 * - Position evaluation heuristics
 */

import { PieceSymbol, Square } from 'chess.js';

// ===================== OPENING KNOWLEDGE =====================

export interface OpeningKnowledge {
  eco: string;
  name: string;
  variation?: string;
  moves: string;
  description: string;
  category: 'open' | 'semi-open' | 'closed' | 'semi-closed' | 'flank' | 'irregular';
  popularity: 'elite' | 'common' | 'rare' | 'historical';
  keyIdeas: string[];
  typicalPlans: {
    white: string[];
    black: string[];
  };
  criticalPositions?: string[]; // FEN strings of key positions
}

// Extended opening database with strategic ideas
export const OPENING_KNOWLEDGE: OpeningKnowledge[] = [
  // OPEN GAMES (1.e4 e5)
  {
    eco: 'C50',
    name: 'Italian Game',
    moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4',
    description: 'Classic opening targeting f7 with rapid piece development',
    category: 'open',
    popularity: 'elite',
    keyIdeas: ['Target f7 weakness', 'Control d5 with c3-d4', 'Quick castling'],
    typicalPlans: {
      white: ['Push d4 to open center', 'Attack on kingside', 'Piece pressure on f7'],
      black: ['Develop Bc5 or Be7', 'Castle quickly', 'Counter in center with d6-d5'],
    },
  },
  {
    eco: 'C51',
    name: 'Evans Gambit',
    moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4',
    description: 'Sacrifices b-pawn for rapid development and attacking chances',
    category: 'open',
    popularity: 'common',
    keyIdeas: ['Sacrifice pawn for tempo', 'Open lines for pieces', 'Attack before Black develops'],
    typicalPlans: {
      white: ['Develop rapidly after Bxb4', 'Push d4, seize center', 'Attack on f7 and kingside'],
      black: ['Return pawn if overwhelmed', 'Develop harmoniously', 'Counter-attack e4'],
    },
  },
  {
    eco: 'C60',
    name: 'Ruy Lopez',
    moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5',
    description: 'The most thoroughly analyzed opening - pressure on e5 through c6',
    category: 'open',
    popularity: 'elite',
    keyIdeas: ['Indirect pressure on e5', 'Slow strategic build-up', 'Maintain center tension'],
    typicalPlans: {
      white: ['Maintain tension', 'Maneuver knight via d2-f1-g3', 'Prepare d4 break'],
      black: ['Fianchetto with b5, Bb7', 'Counter with d6-d5', 'Active piece play'],
    },
  },
  {
    eco: 'C30',
    name: "King's Gambit",
    moves: '1.e4 e5 2.f4',
    description: 'Romantic era attacking opening - sacrifice f-pawn for open f-file',
    category: 'open',
    popularity: 'historical',
    keyIdeas: ['Open f-file for attack', 'Rapid piece development', 'Aggressive king attack'],
    typicalPlans: {
      white: ['Recapture control of center', 'Attack via f-file', 'Develop Bc4, Nf3'],
      black: ['Hold extra pawn', 'Counter-attack e4', 'Develop safely'],
    },
  },
  
  // SICILIAN DEFENSE (1.e4 c5)
  {
    eco: 'B90',
    name: 'Sicilian Najdorf',
    moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6',
    description: 'The most popular Sicilian - flexible, fighting, and deeply analyzed',
    category: 'semi-open',
    popularity: 'elite',
    keyIdeas: ['Control b5 and e5', 'Flexible pawn structure', 'Counter-attack chances'],
    typicalPlans: {
      white: ['English Attack (Be3, f3, Qd2, g4)', 'Classical with Be2', 'Sharp Bg5 lines'],
      black: ['Queenside expansion b5-b4', 'Central break e5 or d5', 'Piece activity'],
    },
  },
  {
    eco: 'B33',
    name: 'Sicilian Sveshnikov',
    moves: '1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 e5',
    description: 'Dynamic with weak d5 but incredibly active pieces',
    category: 'semi-open',
    popularity: 'elite',
    keyIdeas: ['Accept weak d5 for activity', 'Piece pressure compensates', 'Sharp tactical play'],
    typicalPlans: {
      white: ['Exploit d5 outpost', 'Attack backward d6 pawn', 'Control light squares'],
      black: ['Active piece play', 'Queenside expansion', 'Break with f5'],
    },
  },
  
  // FRENCH DEFENSE (1.e4 e6)
  {
    eco: 'C00',
    name: 'French Defense',
    moves: '1.e4 e6',
    description: 'Solid but cramped - aims to undermine e4 with d5',
    category: 'semi-open',
    popularity: 'elite',
    keyIdeas: ['Challenge e4 with d5', 'Solid pawn chain', 'Counter-attack on queenside'],
    typicalPlans: {
      white: ['Advance with e5', 'Kingside attack', 'Exploit cramped Black position'],
      black: ['Undermine with c5', 'Break with f6', 'Exchange bad bishop'],
    },
  },
  
  // QUEEN'S GAMBIT (1.d4 d5 2.c4)
  {
    eco: 'D06',
    name: "Queen's Gambit",
    moves: '1.d4 d5 2.c4',
    description: 'Classical opening - fight for central control with pawn sacrifice',
    category: 'closed',
    popularity: 'elite',
    keyIdeas: ['Undermine d5', 'Control center', 'Positional play'],
    typicalPlans: {
      white: ['Develop pieces behind pawns', 'Minority attack', 'Pressure d-file'],
      black: ['Maintain d5', 'Develop harmoniously', 'Counter-play on c-file'],
    },
  },
  
  // INDIAN DEFENSES
  {
    eco: 'E70',
    name: "King's Indian Defense",
    moves: '1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6',
    description: 'Hypermodern defense - allow White center then attack it',
    category: 'semi-closed',
    popularity: 'elite',
    keyIdeas: ['Fianchetto bishop', 'Strike with e5 or c5', 'Dynamic imbalanced play'],
    typicalPlans: {
      white: ['Space advantage', 'Queenside expansion', 'Prophylaxis against e5'],
      black: ['Kingside attack with f5-f4', 'Central break e5', 'Piece activity'],
    },
  },
  {
    eco: 'E20',
    name: 'Nimzo-Indian Defense',
    moves: '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4',
    description: 'Flexible and solid - pins c3 knight and controls e4',
    category: 'semi-closed',
    popularity: 'elite',
    keyIdeas: ['Pin Nc3', 'Control e4', 'Flexible pawn structure'],
    typicalPlans: {
      white: ['Resolve pin', 'Build center with e3 or f3', 'Exploit bishop pair'],
      black: ['Maintain pressure', 'Double pawns if beneficial', 'Central control'],
    },
  },
  {
    eco: 'D70',
    name: 'Grünfeld Defense',
    moves: '1.d4 Nf6 2.c4 g6 3.Nc3 d5',
    description: 'Hypermodern counter to d4 - attack the center from flanks',
    category: 'semi-closed',
    popularity: 'elite',
    keyIdeas: ['Challenge center immediately', 'Pressure d4 with Bg7', 'Active piece play'],
    typicalPlans: {
      white: ['Build pawn center e4', 'Use space advantage', 'Attack on queenside'],
      black: ['Undermine center with c5', 'Pressure d4', 'Piece activity'],
    },
  },
  
  // FLANK OPENINGS
  {
    eco: 'A10',
    name: 'English Opening',
    moves: '1.c4',
    description: 'Flexible flank opening - can transpose to many systems',
    category: 'flank',
    popularity: 'elite',
    keyIdeas: ['Control d5', 'Flexible development', 'Avoid main lines'],
    typicalPlans: {
      white: ['Fianchetto Bg2', 'Control center from distance', 'Flexible pawn structure'],
      black: ['Symmetric with c5', 'Reversed Sicilian', 'Central control'],
    },
  },
  {
    eco: 'D00',
    name: 'London System',
    moves: '1.d4 d5 2.Bf4',
    description: 'Solid system opening - same setup regardless of Black\'s play',
    category: 'closed',
    popularity: 'common',
    keyIdeas: ['Early Bf4 development', 'Solid pawn pyramid', 'Safe kingside'],
    typicalPlans: {
      white: ['Pyramidal pawn structure', 'Control e5 square', 'Kingside attack if allowed'],
      black: ['Challenge Bf4', 'Central counter-play', 'Queenside expansion'],
    },
  },
];

// ===================== TACTICAL PATTERNS =====================

export interface TacticalPattern {
  name: string;
  type: 'fork' | 'pin' | 'skewer' | 'discovery' | 'double_attack' | 'deflection' | 'decoy' | 'interference' | 'overloading' | 'x-ray' | 'windmill' | 'zugzwang';
  description: string;
  prerequisites: string[];
  execution: string[];
  commonPieces: PieceSymbol[];
  examples: string[];
}

export const TACTICAL_PATTERNS: TacticalPattern[] = [
  {
    name: 'Knight Fork',
    type: 'fork',
    description: 'Knight attacks two or more pieces simultaneously',
    prerequisites: ['Knight can reach forking square', 'Target pieces on knight-attackable squares'],
    execution: ['Move knight to square attacking multiple pieces', 'Opponent can only save one'],
    commonPieces: ['n'],
    examples: ['Royal fork (King + Queen)', 'Family fork (King + Queen + Rook)'],
  },
  {
    name: 'Absolute Pin',
    type: 'pin',
    description: 'Pinned piece cannot move because it would expose the king',
    prerequisites: ['Piece between attacker and king', 'Same file, rank, or diagonal'],
    execution: ['Pin piece to king with sliding piece', 'Attack the pinned piece'],
    commonPieces: ['b', 'r', 'q'],
    examples: ['Bishop pins knight to king', 'Rook pins queen to king'],
  },
  {
    name: 'Relative Pin',
    type: 'pin',
    description: 'Pinned piece can move but would lose more valuable piece behind',
    prerequisites: ['Piece between attacker and valuable piece', 'Pinned piece less valuable'],
    execution: ['Create pin to valuable piece', 'Attack pinned piece or exploit immobility'],
    commonPieces: ['b', 'r', 'q'],
    examples: ['Pin knight to queen', 'Pin rook to queen'],
  },
  {
    name: 'Skewer',
    type: 'skewer',
    description: 'Attack valuable piece that must move, exposing less valuable piece behind',
    prerequisites: ['Two pieces on same line', 'More valuable piece in front'],
    execution: ['Attack valuable piece', 'When it moves, capture piece behind'],
    commonPieces: ['b', 'r', 'q'],
    examples: ['Skewer king to queen', 'Skewer queen to rook'],
  },
  {
    name: 'Discovered Attack',
    type: 'discovery',
    description: 'Moving one piece reveals attack from another piece',
    prerequisites: ['Piece blocking line of attack', 'Target on blocked line'],
    execution: ['Move blocking piece (often with threat)', 'Revealed attack hits target'],
    commonPieces: ['n', 'b', 'r'],
    examples: ['Knight moves revealing bishop attack', 'Discovered check'],
  },
  {
    name: 'Deflection',
    type: 'deflection',
    description: 'Force defending piece away from protecting key square/piece',
    prerequisites: ['Defender overloaded or uniquely protecting', 'Attacker can force defender away'],
    execution: ['Attack the defender', 'When it moves, exploit what it was protecting'],
    commonPieces: ['q', 'r', 'b'],
    examples: ['Deflect queen from defending back rank', 'Deflect bishop from protecting pawn'],
  },
  {
    name: 'Decoy',
    type: 'decoy',
    description: 'Lure piece to unfavorable square where it can be exploited',
    prerequisites: ['Target square leads to tactical advantage', 'Bait piece can attract target'],
    execution: ['Sacrifice or threaten to lure piece', 'Execute tactical strike on new position'],
    commonPieces: ['q', 'r'],
    examples: ['Decoy king to fork square', 'Decoy queen to pin line'],
  },
  {
    name: 'X-Ray Attack',
    type: 'x-ray',
    description: 'Piece attacks through another piece on same line',
    prerequisites: ['Piece between attacker and target', 'Same file, rank, or diagonal'],
    execution: ['Attack "through" intervening piece', 'If piece moves, attack continues'],
    commonPieces: ['r', 'q', 'b'],
    examples: ['Rook x-rays through queen to rook', 'Queen x-rays to back rank'],
  },
  {
    name: 'Windmill',
    type: 'windmill',
    description: 'Repeated discovered checks winning material with each revolution',
    prerequisites: ['Piece giving discovered check', 'Target piece capturable each cycle'],
    execution: ['Discover check', 'Capture piece', 'Return for next discovery', 'Repeat'],
    commonPieces: ['r', 'b'],
    examples: ['Torre vs. Lasker windmill', 'Rook+Bishop windmill'],
  },
  {
    name: 'Zugzwang',
    type: 'zugzwang',
    description: 'Position where any move worsens position - being forced to move is harmful',
    prerequisites: ['All moves lead to material loss or checkmate', 'Common in endgames'],
    execution: ['Maneuver to put opponent in zugzwang', 'Pass move obligation to opponent'],
    commonPieces: ['k', 'p'],
    examples: ['King and pawn endgames', 'Opposition battles'],
  },
];

// ===================== CHECKMATE PATTERNS =====================

export interface CheckmatePattern {
  name: string;
  description: string;
  pieces: PieceSymbol[];
  setup: string;
  recognitionHints: string[];
  famous?: string; // Famous game example
}

export const CHECKMATE_PATTERNS: CheckmatePattern[] = [
  {
    name: 'Back Rank Mate',
    description: 'Queen or rook delivers checkmate on the back rank with king trapped by own pawns',
    pieces: ['q', 'r'],
    setup: 'King on back rank, blocked by pawns or pieces, rook/queen delivers mate',
    recognitionHints: ['King has no escape squares', 'Back rank undefended', 'No interposing pieces'],
  },
  {
    name: 'Smothered Mate',
    description: 'Knight checkmates king completely surrounded by own pieces',
    pieces: ['n'],
    setup: 'King in corner, surrounded by own pieces, knight delivers inescapable mate',
    recognitionHints: ['King has no squares', 'Often follows queen sacrifice', 'Corner position'],
    famous: 'Philidor\'s Legacy',
  },
  {
    name: "Scholar's Mate",
    description: 'Quick checkmate targeting f7 with queen and bishop in 4 moves',
    pieces: ['q', 'b'],
    setup: '1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6?? 4.Qxf7#',
    recognitionHints: ['Early queen attack', 'f7 weakness', 'Beginner trap'],
  },
  {
    name: "Fool's Mate",
    description: 'Fastest possible checkmate in 2 moves',
    pieces: ['q'],
    setup: '1.f3 e5 2.g4 Qh4#',
    recognitionHints: ['Weakened kingside', 'f and g pawns moved', 'Only 2 moves'],
  },
  {
    name: 'Anastasia\'s Mate',
    description: 'Knight and rook combine on h-file with pawn barrier',
    pieces: ['n', 'r'],
    setup: 'Knight on e7 or similar, rook delivers mate on h-file, pawn blocks escape',
    recognitionHints: ['Knight controls escape', 'Rook on h-file', 'Pawn blocks g-file'],
  },
  {
    name: 'Arabian Mate',
    description: 'Rook and knight combine in corner - knight protects rook and blocks escape',
    pieces: ['r', 'n'],
    setup: 'Rook on back rank, knight on f6/c6 area controls escape and protects rook',
    recognitionHints: ['Corner king', 'Rook on edge', 'Knight controls key square'],
  },
  {
    name: 'Boden\'s Mate',
    description: 'Two bishops on criss-crossing diagonals checkmate castled king',
    pieces: ['b', 'b'],
    setup: 'Bishops on crossing diagonals, often after queen sacrifice opens lines',
    recognitionHints: ['Two bishops on diagonals', 'Often follows Qxc3', 'King on queenside'],
    famous: 'Schulder vs. Boden 1853',
  },
  {
    name: 'Epaulette Mate',
    description: 'Queen checkmates king flanked by own rooks on either side (like epaulettes)',
    pieces: ['q'],
    setup: 'King on back rank with rooks on adjacent files blocking escape',
    recognitionHints: ['King flanked by rooks', 'Queen delivers horizontal mate', 'Visual pattern'],
  },
  {
    name: 'Greco\'s Mate',
    description: 'Bishop and rook combine on h-file with bishop covering escape',
    pieces: ['b', 'r'],
    setup: 'Rook on h-file, bishop covers g7/g2 escape square',
    recognitionHints: ['Kingside attack', 'Bishop on diagonal', 'Rook on h-file'],
  },
  {
    name: 'Hook Mate',
    description: 'Rook on edge file, knight covers escape, pawn blocks other squares',
    pieces: ['r', 'n'],
    setup: 'Rook delivers check, knight and pawn block escape squares',
    recognitionHints: ['Corner or edge king', 'Coordinated R+N', 'Pawn involvement'],
  },
  {
    name: 'Legal\'s Mate',
    description: 'Famous queen sacrifice leading to quick mate with minor pieces',
    pieces: ['n', 'b'],
    setup: 'Queen sacrificed on e5, bishop and two knights deliver mate',
    recognitionHints: ['Queen sacrifice', 'Minor piece coordination', 'Trap pattern'],
    famous: 'Legal vs. Saint Brie 1750',
  },
  {
    name: 'Lolli\'s Mate',
    description: 'Queen and pawn combine near king\'s original position',
    pieces: ['q', 'p'],
    setup: 'Pawn on g6, queen delivers mate on h7 or similar',
    recognitionHints: ['Advanced pawn', 'Queen and pawn coordination', 'Kingside'],
  },
  {
    name: 'Opera Mate',
    description: 'Rook supported by bishop delivers mate on back rank',
    pieces: ['r', 'b'],
    setup: 'Bishop supports rook\'s back rank attack, king trapped',
    recognitionHints: ['Back rank mate', 'Bishop supports rook', 'Often from fianchetto'],
    famous: 'Morphy vs. Duke/Count (Opera Game) 1858',
  },
  {
    name: 'Suffocation Mate',
    description: 'Knight delivers mate with all escape squares covered by various pieces',
    pieces: ['n'],
    setup: 'King surrounded, knight gives checkmate from distance',
    recognitionHints: ['Similar to smothered mate', 'Mixed piece blocking', 'Knight finishes'],
  },
];

// ===================== ENDGAME THEORY =====================

export interface EndgameKnowledge {
  name: string;
  pieces: string; // e.g., "K+R vs K" or "K+P vs K"
  result: 'win' | 'draw' | 'complex';
  keyTechniques: string[];
  commonMistakes: string[];
  maxMoves?: number; // Tablebase-proven max moves to win
}

export const ENDGAME_KNOWLEDGE: EndgameKnowledge[] = [
  {
    name: 'King and Queen vs King',
    pieces: 'K+Q vs K',
    result: 'win',
    keyTechniques: ['Drive king to edge with queen', 'Bring king closer', 'Deliver mate on edge'],
    commonMistakes: ['Stalemating opponent', 'Taking too long'],
    maxMoves: 10,
  },
  {
    name: 'King and Rook vs King',
    pieces: 'K+R vs K',
    result: 'win',
    keyTechniques: ['Box method - restrict king', 'Opposition', 'Edge mate'],
    commonMistakes: ['Stalemating', 'Inefficient technique'],
    maxMoves: 16,
  },
  {
    name: 'King and Pawn vs King',
    pieces: 'K+P vs K',
    result: 'complex',
    keyTechniques: ['Opposition', 'Key squares', 'Outflanking'],
    commonMistakes: ['Losing opposition', 'Wrong king position'],
  },
  {
    name: 'King and Two Bishops vs King',
    pieces: 'K+B+B vs K',
    result: 'win',
    keyTechniques: ['Bishops work together', 'Drive to corner of bishop color', 'Coordinate pieces'],
    commonMistakes: ['Wrong corner', 'Stalemate'],
    maxMoves: 19,
  },
  {
    name: 'King, Bishop and Knight vs King',
    pieces: 'K+B+N vs K',
    result: 'win',
    keyTechniques: ['W maneuver', 'Drive to corner matching bishop', 'Careful coordination'],
    commonMistakes: ['Wrong corner (50 move rule)', 'Losing coordination'],
    maxMoves: 33,
  },
  {
    name: 'Lucena Position',
    pieces: 'K+R+P vs K+R',
    result: 'win',
    keyTechniques: ['Building a bridge', 'King shelter', 'Rook lift'],
    commonMistakes: ['Not using bridge technique', 'Premature pawn push'],
  },
  {
    name: 'Philidor Position',
    pieces: 'K+R vs K+R+P',
    result: 'draw',
    keyTechniques: ['3rd rank defense', 'Cut off king', 'Checks from behind'],
    commonMistakes: ['Passive rook placement', 'Not using 3rd rank'],
  },
  {
    name: 'Rook vs Bishop',
    pieces: 'K+R vs K+B',
    result: 'draw',
    keyTechniques: ['Keep bishop active', 'Avoid edges', 'Block rook checks'],
    commonMistakes: ['Wrong corner', 'Passive defense'],
  },
  {
    name: 'Opposite Color Bishops',
    pieces: 'K+B+P vs K+B (opposite colors)',
    result: 'draw',
    keyTechniques: ['Blockade on opposite color', 'King proximity', 'Right positioning'],
    commonMistakes: ['Not understanding drawing mechanism'],
  },
];

// ===================== PIECE VALUE SYSTEM =====================

export const PIECE_VALUES = {
  standard: { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 },
  modified: { p: 1, n: 3.25, b: 3.35, r: 5, q: 9.75, k: 0 }, // Modern values
  endgame: { p: 1.5, n: 3, b: 3.5, r: 5, q: 9, k: 4 }, // King becomes active
} as const;

// ===================== POSITION EVALUATION HEURISTICS =====================

export interface PositionalFactor {
  name: string;
  description: string;
  evaluation: 'good' | 'bad' | 'contextual';
  examples: string[];
}

export const POSITIONAL_FACTORS: PositionalFactor[] = [
  {
    name: 'Doubled Pawns',
    description: 'Two pawns of same color on same file',
    evaluation: 'bad',
    examples: ['After Bxc6 bxc6', 'Can block files', 'Weak if isolated'],
  },
  {
    name: 'Isolated Pawn',
    description: 'Pawn with no friendly pawns on adjacent files',
    evaluation: 'bad',
    examples: ['Isolated queen pawn (IQP)', 'Cannot be defended by pawns', 'Creates weak squares'],
  },
  {
    name: 'Passed Pawn',
    description: 'Pawn with no enemy pawns blocking or controlling promotion path',
    evaluation: 'good',
    examples: ['Potential queen', 'Ties down enemy pieces', 'Endgame strength'],
  },
  {
    name: 'Backward Pawn',
    description: 'Pawn that cannot advance without being captured, no pawn support behind',
    evaluation: 'bad',
    examples: ['Common on d6 in Sicilian', 'Fixed target', 'Weak square in front'],
  },
  {
    name: 'Outpost',
    description: 'Square that cannot be attacked by enemy pawns, ideal for knight',
    evaluation: 'good',
    examples: ['Knight on d5 or e5', 'Piece dominates', 'Strategic anchor'],
  },
  {
    name: 'Open File',
    description: 'File with no pawns - ideal for rooks',
    evaluation: 'good',
    examples: ['Rook on open file', 'Control key squares', 'Infiltration point'],
  },
  {
    name: 'Bishop Pair',
    description: 'Having both bishops while opponent has none or one',
    evaluation: 'good',
    examples: ['Open positions favor bishops', 'Long-range coordination', 'Endgame advantage'],
  },
  {
    name: 'Bad Bishop',
    description: 'Bishop blocked by own pawns on same color squares',
    evaluation: 'bad',
    examples: ['French Defense bishop on c8', 'Limited mobility', 'Exchange if possible'],
  },
  {
    name: 'Fianchetto',
    description: 'Bishop on b2/g2/b7/g7 controlling long diagonal',
    evaluation: 'contextual',
    examples: ['Controls key diagonal', 'Protects king', 'Can become bad if pawns block'],
  },
  {
    name: 'Weak Back Rank',
    description: 'King on back rank with no escape squares - vulnerable to mate',
    evaluation: 'bad',
    examples: ['Create luft (h3 or a3)', 'Back rank mate threat', 'Tie down defenders'],
  },
];

// ===================== FAMOUS GAMES KNOWLEDGE =====================

export interface FamousGameKnowledge {
  id: string;
  name: string;
  year: number;
  white: string;
  black: string;
  significance: string;
  keyMoment: string;
  lessonsTaught: string[];
}

export const FAMOUS_GAMES_KNOWLEDGE: FamousGameKnowledge[] = [
  {
    id: 'immortal-game',
    name: 'The Immortal Game',
    year: 1851,
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    significance: 'Epitome of Romantic chess - sacrificing major pieces for checkmate',
    keyMoment: 'Anderssen sacrifices both rooks, bishop, and queen to deliver mate with minor pieces',
    lessonsTaught: ['Material is not everything', 'King safety matters', 'Beautiful combinations exist'],
  },
  {
    id: 'evergreen-game',
    name: 'The Evergreen Game',
    year: 1852,
    white: 'Adolf Anderssen',
    black: 'Jean Dufresne',
    significance: 'Timeless brilliancy showcasing attacking chess',
    keyMoment: 'Queen sacrifice leading to unavoidable checkmate',
    lessonsTaught: ['Attack with purpose', 'Coordinate pieces', 'Calculate accurately'],
  },
  {
    id: 'opera-game',
    name: 'The Opera Game',
    year: 1858,
    white: 'Paul Morphy',
    black: 'Duke & Count',
    significance: 'Perfect example of rapid development and piece coordination',
    keyMoment: 'Queen sacrifice leading to Opera Mate pattern',
    lessonsTaught: ['Development over material', 'Attack with all pieces', 'Classic mating patterns'],
  },
  {
    id: 'game-of-century',
    name: 'Game of the Century',
    year: 1956,
    white: 'Donald Byrne',
    black: 'Bobby Fischer',
    significance: '13-year-old Fischer plays stunning queen sacrifice',
    keyMoment: 'Qb6!! sacrificing queen for devastating attack',
    lessonsTaught: ['Prodigious talent exists', 'Dynamic play trumps material', 'Calculate deeply'],
  },
  {
    id: 'kasparov-topalov',
    name: 'Kasparov\'s Immortal',
    year: 1999,
    white: 'Garry Kasparov',
    black: 'Veselin Topalov',
    significance: 'Computer-verified brilliancy with stunning rook sacrifice',
    keyMoment: 'Rxd4!! sacrificing exchange for devastating attack',
    lessonsTaught: ['Modern attacking chess', 'Computer analysis validates beauty', 'Intuitive sacrifices'],
  },
  {
    id: 'deep-blue',
    name: 'Kasparov vs Deep Blue Game 6',
    year: 1997,
    white: 'Deep Blue',
    black: 'Garry Kasparov',
    significance: 'Machine defeats world champion in decisive game',
    keyMoment: 'Kasparov resigns in seemingly holdable position',
    lessonsTaught: ['Computer chess emergence', 'Psychological pressure', 'Historical moment'],
  },
];

// ===================== UTILITY FUNCTIONS =====================

/**
 * Get opening knowledge by ECO code
 */
export function getOpeningByEco(eco: string): OpeningKnowledge | undefined {
  return OPENING_KNOWLEDGE.find(o => o.eco === eco);
}

/**
 * Get opening knowledge by name (partial match)
 */
export function getOpeningByName(name: string): OpeningKnowledge | undefined {
  const lower = name.toLowerCase();
  return OPENING_KNOWLEDGE.find(o => 
    o.name.toLowerCase().includes(lower) || 
    (o.variation && o.variation.toLowerCase().includes(lower))
  );
}

/**
 * Get tactical pattern by type
 */
export function getTacticalPattern(type: TacticalPattern['type']): TacticalPattern | undefined {
  return TACTICAL_PATTERNS.find(p => p.type === type);
}

/**
 * Get checkmate pattern by name
 */
export function getCheckmatePattern(name: string): CheckmatePattern | undefined {
  const lower = name.toLowerCase();
  return CHECKMATE_PATTERNS.find(p => p.name.toLowerCase().includes(lower));
}

/**
 * Get endgame knowledge by pieces
 */
export function getEndgameKnowledge(pieces: string): EndgameKnowledge | undefined {
  return ENDGAME_KNOWLEDGE.find(e => e.pieces === pieces);
}

/**
 * Calculate material value for a position
 */
export function calculateMaterialValue(pieces: { piece: PieceSymbol; color: 'w' | 'b' }[]): { white: number; black: number; balance: number } {
  let white = 0;
  let black = 0;
  
  for (const p of pieces) {
    const value = PIECE_VALUES.standard[p.piece] || 0;
    if (p.color === 'w') {
      white += value;
    } else {
      black += value;
    }
  }
  
  return { white, black, balance: white - black };
}

/**
 * Get strategic advice based on opening
 */
export function getOpeningAdvice(opening: OpeningKnowledge, color: 'white' | 'black'): string[] {
  return opening.typicalPlans[color];
}
