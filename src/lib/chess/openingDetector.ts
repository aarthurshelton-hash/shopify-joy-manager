/**
 * Comprehensive Opening Detection System
 * 
 * Detects and classifies chess openings by name, ECO code, and category.
 * Includes all major openings and their popular variations.
 */

import { Chess } from 'chess.js';

export interface DetectedOpening {
  eco: string;
  name: string;
  variation?: string;
  fullName: string;
  moves: string;
  moveCount: number;
  category: 'open' | 'semi-open' | 'closed' | 'semi-closed' | 'flank' | 'irregular' | 'gambit';
  description: string;
}

interface OpeningEntry {
  eco: string;
  name: string;
  variation?: string;
  moves: string;
  category: DetectedOpening['category'];
  description: string;
}

// Comprehensive opening database with famous names
const OPENINGS_DATABASE: OpeningEntry[] = [
  // ========== OPEN GAMES (1.e4 e5) ==========
  // Italian Game Family
  { eco: 'C50', name: 'Italian Game', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4', category: 'open', description: 'Classic opening targeting f7' },
  { eco: 'C53', name: 'Giuoco Piano', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5', category: 'open', description: 'The "quiet game" - solid development' },
  { eco: 'C54', name: 'Giuoco Piano', variation: 'Main Line', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3', category: 'open', description: 'Preparing d4 push' },
  { eco: 'C55', name: 'Two Knights Defense', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6', category: 'open', description: 'Active defense, sharp play' },
  { eco: 'C57', name: 'Fried Liver Attack', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5 Nxd5 6.Nxf7', category: 'gambit', description: 'Famous knight sacrifice on f7' },
  { eco: 'C51', name: 'Evans Gambit', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4', category: 'gambit', description: 'Aggressive pawn sacrifice for tempo' },

  // Ruy Lopez / Spanish Game Family
  { eco: 'C60', name: 'Ruy Lopez', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5', category: 'open', description: 'The Spanish Game - most analyzed opening' },
  { eco: 'C65', name: 'Ruy Lopez', variation: 'Berlin Defense', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6', category: 'open', description: 'The Berlin Wall - extremely solid' },
  { eco: 'C68', name: 'Ruy Lopez', variation: 'Exchange Variation', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Bxc6', category: 'open', description: 'Doubled pawns but bishop pair' },
  { eco: 'C78', name: 'Ruy Lopez', variation: 'Morphy Defense', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4', category: 'open', description: 'Main line Ruy Lopez' },
  { eco: 'C80', name: 'Ruy Lopez', variation: 'Open Defense', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Nxe4', category: 'open', description: 'Taking the e4 pawn early' },
  { eco: 'C84', name: 'Ruy Lopez', variation: 'Closed Defense', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7', category: 'open', description: 'Most common main line' },
  { eco: 'C89', name: 'Marshall Attack', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 O-O 8.c3 d5', category: 'gambit', description: 'Famous gambit for attack on white king' },

  // Scotch Game Family
  { eco: 'C44', name: 'Scotch Game', moves: '1.e4 e5 2.Nf3 Nc6 3.d4', category: 'open', description: 'Immediate central confrontation' },
  { eco: 'C45', name: 'Scotch Game', variation: 'Classical', moves: '1.e4 e5 2.Nf3 Nc6 3.d4 exd4 4.Nxd4', category: 'open', description: 'Recapturing with knight' },
  { eco: 'C44', name: 'Scotch Gambit', moves: '1.e4 e5 2.Nf3 Nc6 3.d4 exd4 4.Bc4', category: 'gambit', description: 'Gambit for rapid development' },

  // King's Gambit Family
  { eco: 'C30', name: "King's Gambit", moves: '1.e4 e5 2.f4', category: 'gambit', description: 'Romantic era attacking opening' },
  { eco: 'C33', name: "King's Gambit Accepted", moves: '1.e4 e5 2.f4 exf4', category: 'gambit', description: 'Taking the gambit pawn' },
  { eco: 'C30', name: "King's Gambit Declined", moves: '1.e4 e5 2.f4 Bc5', category: 'open', description: 'Declining the gambit' },
  { eco: 'C39', name: "King's Gambit", variation: 'Muzio Gambit', moves: '1.e4 e5 2.f4 exf4 3.Nf3 g5 4.Bc4 g4 5.O-O', category: 'gambit', description: 'Piece sacrifice for massive attack' },

  // Philidor and Others
  { eco: 'C41', name: 'Philidor Defense', moves: '1.e4 e5 2.Nf3 d6', category: 'open', description: 'Solid but passive defense' },
  { eco: 'C42', name: 'Petrov Defense', moves: '1.e4 e5 2.Nf3 Nf6', category: 'open', description: 'The Russian Game - symmetrical and solid' },
  { eco: 'C40', name: 'Latvian Gambit', moves: '1.e4 e5 2.Nf3 f5', category: 'gambit', description: 'Risky counter-gambit' },
  { eco: 'C21', name: 'Danish Gambit', moves: '1.e4 e5 2.d4 exd4 3.c3', category: 'gambit', description: 'Sacrificing two pawns for development' },
  { eco: 'C46', name: 'Four Knights Game', moves: '1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6', category: 'open', description: 'Symmetrical development' },
  { eco: 'C47', name: 'Four Knights', variation: 'Scotch Variation', moves: '1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6 4.d4', category: 'open', description: 'Adding d4 to Four Knights' },

  // ========== SICILIAN DEFENSE (1.e4 c5) ==========
  { eco: 'B20', name: 'Sicilian Defense', moves: '1.e4 c5', category: 'semi-open', description: 'Fighting response to 1.e4' },
  { eco: 'B21', name: 'Sicilian Defense', variation: 'Grand Prix Attack', moves: '1.e4 c5 2.f4', category: 'semi-open', description: 'Aggressive anti-Sicilian' },
  { eco: 'B22', name: 'Sicilian Defense', variation: 'Alapin', moves: '1.e4 c5 2.c3', category: 'semi-open', description: 'Preparing d4 without Nc3' },
  { eco: 'B23', name: 'Sicilian Defense', variation: 'Closed', moves: '1.e4 c5 2.Nc3', category: 'semi-open', description: 'Delayed d4, flexible setup' },
  { eco: 'B27', name: 'Sicilian Defense', variation: 'Accelerated Dragon', moves: '1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 g6', category: 'semi-open', description: 'Dragon without d6' },
  { eco: 'B30', name: 'Sicilian Defense', variation: 'Old Sicilian', moves: '1.e4 c5 2.Nf3 Nc6', category: 'semi-open', description: 'Classical development' },
  { eco: 'B33', name: 'Sicilian Sveshnikov', moves: '1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 e5', category: 'semi-open', description: 'Dynamic with weak d5 but active pieces' },
  { eco: 'B52', name: 'Sicilian Rossolimo', moves: '1.e4 c5 2.Nf3 Nc6 3.Bb5', category: 'semi-open', description: 'Positional anti-Sicilian' },
  { eco: 'B60', name: 'Sicilian Richter-Rauzer', moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 Nc6 6.Bg5', category: 'semi-open', description: 'Sharp main line Sicilian' },
  { eco: 'B70', name: 'Sicilian Dragon', moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 g6', category: 'semi-open', description: 'Fianchetto kingside, very sharp' },
  { eco: 'B78', name: 'Sicilian Dragon', variation: 'Yugoslav Attack', moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 g6 6.Be3 Bg7 7.f3', category: 'semi-open', description: 'White attacks on kingside' },
  { eco: 'B80', name: 'Sicilian Scheveningen', moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 e6', category: 'semi-open', description: 'Flexible pawn structure' },
  { eco: 'B84', name: 'Sicilian Scheveningen', variation: 'Classical', moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 e6 6.Be2', category: 'semi-open', description: 'Main line Scheveningen' },
  { eco: 'B90', name: 'Sicilian Najdorf', moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6', category: 'semi-open', description: 'The most popular Sicilian' },
  { eco: 'B96', name: 'Sicilian Najdorf', variation: 'Poisoned Pawn', moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Bg5 e6 7.f4 Qb6', category: 'semi-open', description: 'Famous sharp line' },
  { eco: 'B21', name: 'Smith-Morra Gambit', moves: '1.e4 c5 2.d4 cxd4 3.c3', category: 'gambit', description: 'Gambit against Sicilian' },

  // ========== FRENCH DEFENSE (1.e4 e6) ==========
  { eco: 'C00', name: 'French Defense', moves: '1.e4 e6', category: 'semi-open', description: 'Solid but cramped defense' },
  { eco: 'C02', name: 'French Defense', variation: 'Advance Variation', moves: '1.e4 e6 2.d4 d5 3.e5', category: 'semi-open', description: 'Space advantage for White' },
  { eco: 'C03', name: 'French Defense', variation: 'Tarrasch Variation', moves: '1.e4 e6 2.d4 d5 3.Nd2', category: 'semi-open', description: 'Flexible knight placement' },
  { eco: 'C10', name: 'French Defense', variation: 'Rubinstein', moves: '1.e4 e6 2.d4 d5 3.Nc3 dxe4', category: 'semi-open', description: 'Trading center pawn' },
  { eco: 'C11', name: 'French Defense', variation: 'Classical', moves: '1.e4 e6 2.d4 d5 3.Nc3 Nf6', category: 'semi-open', description: 'Main line French' },
  { eco: 'C15', name: 'French Defense', variation: 'Winawer', moves: '1.e4 e6 2.d4 d5 3.Nc3 Bb4', category: 'semi-open', description: 'Sharp and complex' },

  // ========== CARO-KANN DEFENSE (1.e4 c6) ==========
  { eco: 'B10', name: 'Caro-Kann Defense', moves: '1.e4 c6', category: 'semi-open', description: 'Solid and reliable' },
  { eco: 'B12', name: 'Caro-Kann', variation: 'Advance Variation', moves: '1.e4 c6 2.d4 d5 3.e5', category: 'semi-open', description: 'Space advantage approach' },
  { eco: 'B13', name: 'Caro-Kann', variation: 'Exchange Variation', moves: '1.e4 c6 2.d4 d5 3.exd5 cxd5', category: 'semi-open', description: 'Symmetrical pawn structure' },
  { eco: 'B15', name: 'Caro-Kann', variation: 'Main Line', moves: '1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4', category: 'semi-open', description: 'Classical approach' },
  { eco: 'B17', name: 'Caro-Kann', variation: 'Steinitz Variation', moves: '1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Nd7', category: 'semi-open', description: 'Nd7 before Nf6' },
  { eco: 'B18', name: 'Caro-Kann', variation: 'Classical', moves: '1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5', category: 'semi-open', description: 'Developing the bad bishop' },

  // ========== SCANDINAVIAN DEFENSE (1.e4 d5) ==========
  { eco: 'B01', name: 'Scandinavian Defense', moves: '1.e4 d5', category: 'semi-open', description: 'Immediate counter in center' },
  { eco: 'B01', name: 'Scandinavian Defense', variation: 'Main Line', moves: '1.e4 d5 2.exd5 Qxd5', category: 'semi-open', description: 'Queen comes out early' },
  { eco: 'B01', name: 'Scandinavian Defense', variation: 'Modern', moves: '1.e4 d5 2.exd5 Nf6', category: 'semi-open', description: 'Not taking back immediately' },

  // ========== ALEKHINE'S DEFENSE (1.e4 Nf6) ==========
  { eco: 'B02', name: "Alekhine's Defense", moves: '1.e4 Nf6', category: 'semi-open', description: 'Provoke e5, attack White center' },
  { eco: 'B03', name: "Alekhine's Defense", variation: 'Four Pawns Attack', moves: '1.e4 Nf6 2.e5 Nd5 3.d4 d6 4.c4 Nb6 5.f4', category: 'semi-open', description: 'Aggressive pawn advance' },
  { eco: 'B04', name: "Alekhine's Defense", variation: 'Modern', moves: '1.e4 Nf6 2.e5 Nd5 3.d4 d6 4.Nf3', category: 'semi-open', description: 'Main line development' },

  // ========== PIRC AND MODERN DEFENSE ==========
  { eco: 'B06', name: 'Modern Defense', moves: '1.e4 g6', category: 'semi-open', description: 'Flexible, delays d6' },
  { eco: 'B07', name: 'Pirc Defense', moves: '1.e4 d6 2.d4 Nf6 3.Nc3 g6', category: 'semi-open', description: 'Hypermodern, lets White build center' },
  { eco: 'B08', name: 'Pirc Defense', variation: 'Classical', moves: '1.e4 d6 2.d4 Nf6 3.Nc3 g6 4.Nf3', category: 'semi-open', description: 'Standard development' },
  { eco: 'B09', name: 'Pirc Defense', variation: 'Austrian Attack', moves: '1.e4 d6 2.d4 Nf6 3.Nc3 g6 4.f4', category: 'semi-open', description: 'Aggressive f4 push' },

  // ========== QUEEN'S GAMBIT (1.d4 d5 2.c4) ==========
  { eco: 'D06', name: "Queen's Gambit", moves: '1.d4 d5 2.c4', category: 'closed', description: 'Classical opening for center control' },
  { eco: 'D20', name: "Queen's Gambit Accepted", moves: '1.d4 d5 2.c4 dxc4', category: 'closed', description: 'Taking the gambit pawn' },
  { eco: 'D30', name: "Queen's Gambit Declined", moves: '1.d4 d5 2.c4 e6', category: 'closed', description: 'Solid defense, maintaining d5' },
  { eco: 'D31', name: "Queen's Gambit Declined", variation: 'Albin Counter-Gambit', moves: '1.d4 d5 2.c4 e5', category: 'gambit', description: 'Aggressive counter' },
  { eco: 'D35', name: "Queen's Gambit Declined", variation: 'Exchange', moves: '1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.cxd5 exd5', category: 'closed', description: 'Symmetrical structure' },
  { eco: 'D37', name: "Queen's Gambit Declined", variation: 'Classical', moves: '1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Nf3', category: 'closed', description: 'Standard development' },
  { eco: 'D40', name: "Queen's Gambit Declined", variation: 'Semi-Tarrasch', moves: '1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Nf3 c5', category: 'closed', description: 'Counter in center with c5' },

  // ========== SLAV DEFENSE (1.d4 d5 2.c4 c6) ==========
  { eco: 'D10', name: 'Slav Defense', moves: '1.d4 d5 2.c4 c6', category: 'closed', description: 'Solid, supports d5 with c6' },
  { eco: 'D11', name: 'Slav Defense', variation: 'Main Line', moves: '1.d4 d5 2.c4 c6 3.Nf3', category: 'closed', description: 'Standard development' },
  { eco: 'D15', name: 'Slav Defense', variation: 'Three Knights', moves: '1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3', category: 'closed', description: 'Developing knights' },
  { eco: 'D17', name: 'Slav Defense', variation: 'Czech', moves: '1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 dxc4 5.a4 Bf5', category: 'closed', description: 'Taking and developing bishop' },

  // ========== INDIAN DEFENSES ==========
  // King's Indian Defense
  { eco: 'E60', name: "King's Indian Defense", moves: '1.d4 Nf6 2.c4 g6', category: 'semi-closed', description: 'Hypermodern, fianchetto kingside' },
  { eco: 'E62', name: "King's Indian Defense", variation: 'Fianchetto', moves: '1.d4 Nf6 2.c4 g6 3.g3', category: 'semi-closed', description: 'Quiet, positional approach' },
  { eco: 'E70', name: "King's Indian Defense", variation: 'Classical', moves: '1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.Nf3', category: 'semi-closed', description: 'Main line KID' },
  { eco: 'E76', name: "King's Indian Defense", variation: 'Four Pawns Attack', moves: '1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.f4', category: 'semi-closed', description: 'Aggressive pawn advance' },
  { eco: 'E80', name: "King's Indian Defense", variation: 'Sämisch', moves: '1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.f3', category: 'semi-closed', description: 'Solid, preparing Be3' },
  { eco: 'E97', name: "King's Indian Defense", variation: 'Mar del Plata', moves: '1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.Nf3 O-O 6.Be2 e5 7.O-O Nc6', category: 'semi-closed', description: 'Famous attacking variation' },

  // Nimzo-Indian Defense
  { eco: 'E20', name: 'Nimzo-Indian Defense', moves: '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4', category: 'semi-closed', description: 'Flexible and solid, pins Nc3' },
  { eco: 'E32', name: 'Nimzo-Indian Defense', variation: 'Classical', moves: '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 4.Qc2', category: 'semi-closed', description: 'Preventing doubled pawns' },
  { eco: 'E41', name: 'Nimzo-Indian Defense', variation: 'Huebner', moves: '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 4.e3 c5', category: 'semi-closed', description: 'Modern treatment' },
  { eco: 'E53', name: 'Nimzo-Indian Defense', variation: 'Main Line', moves: '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 4.e3 O-O 5.Bd3 d5 6.Nf3', category: 'semi-closed', description: 'Standard setup' },

  // Queen's Indian Defense
  { eco: 'E12', name: "Queen's Indian Defense", moves: '1.d4 Nf6 2.c4 e6 3.Nf3 b6', category: 'semi-closed', description: 'Control e4 with Bb7' },
  { eco: 'E15', name: "Queen's Indian Defense", variation: 'Main Line', moves: '1.d4 Nf6 2.c4 e6 3.Nf3 b6 4.g3', category: 'semi-closed', description: 'Fianchetto approach' },

  // Grünfeld Defense
  { eco: 'D70', name: 'Grünfeld Defense', moves: '1.d4 Nf6 2.c4 g6 3.Nc3 d5', category: 'semi-closed', description: 'Hypermodern counter to d4' },
  { eco: 'D85', name: 'Grünfeld Defense', variation: 'Exchange Variation', moves: '1.d4 Nf6 2.c4 g6 3.Nc3 d5 4.cxd5 Nxd5 5.e4', category: 'semi-closed', description: 'White builds big center' },
  { eco: 'D90', name: 'Grünfeld Defense', variation: 'Russian System', moves: '1.d4 Nf6 2.c4 g6 3.Nc3 d5 4.Nf3', category: 'semi-closed', description: 'Solid development' },

  // Bogo-Indian Defense
  { eco: 'E11', name: 'Bogo-Indian Defense', moves: '1.d4 Nf6 2.c4 e6 3.Nf3 Bb4+', category: 'semi-closed', description: 'Check with bishop early' },

  // ========== BENONI DEFENSE ==========
  { eco: 'A60', name: 'Benoni Defense', moves: '1.d4 Nf6 2.c4 c5 3.d5', category: 'semi-closed', description: 'Asymmetrical pawn structure' },
  { eco: 'A65', name: 'Benoni Defense', variation: 'Main Line', moves: '1.d4 Nf6 2.c4 c5 3.d5 e6 4.Nc3 exd5 5.cxd5 d6', category: 'semi-closed', description: 'Classical Benoni' },
  { eco: 'A67', name: 'Benko Gambit', moves: '1.d4 Nf6 2.c4 c5 3.d5 b5', category: 'gambit', description: 'Pawn sac for queenside pressure' },
  { eco: 'A57', name: 'Benko Gambit', variation: 'Accepted', moves: '1.d4 Nf6 2.c4 c5 3.d5 b5 4.cxb5 a6', category: 'gambit', description: 'Taking the gambit' },

  // ========== DUTCH DEFENSE (1.d4 f5) ==========
  { eco: 'A80', name: 'Dutch Defense', moves: '1.d4 f5', category: 'semi-closed', description: 'Aggressive response to d4' },
  { eco: 'A84', name: 'Dutch Defense', variation: 'Classical', moves: '1.d4 f5 2.c4 Nf6 3.Nc3 e6', category: 'semi-closed', description: 'Standard development' },
  { eco: 'A87', name: 'Dutch Defense', variation: 'Leningrad', moves: '1.d4 f5 2.c4 Nf6 3.g3 g6', category: 'semi-closed', description: 'Dragon-like setup' },
  { eco: 'A90', name: 'Dutch Defense', variation: 'Stonewall', moves: '1.d4 f5 2.c4 e6 3.Nc3 Nf6 4.e3 d5', category: 'semi-closed', description: 'Solid pawn structure' },

  // ========== FLANK OPENINGS ==========
  // English Opening
  { eco: 'A10', name: 'English Opening', moves: '1.c4', category: 'flank', description: 'Flexible flank opening' },
  { eco: 'A16', name: 'English Opening', variation: 'Anglo-Indian', moves: '1.c4 Nf6 2.Nc3', category: 'flank', description: 'English with Indian setup' },
  { eco: 'A20', name: 'English Opening', variation: 'Reversed Sicilian', moves: '1.c4 e5', category: 'flank', description: 'Sicilian with colors reversed' },
  { eco: 'A30', name: 'English Opening', variation: 'Symmetrical', moves: '1.c4 c5', category: 'flank', description: 'Both sides play c-pawn' },

  // Réti Opening
  { eco: 'A04', name: 'Réti Opening', moves: '1.Nf3 d5 2.c4', category: 'flank', description: 'Hypermodern, fianchetto setup' },
  { eco: 'A05', name: 'Réti Opening', variation: 'King\'s Indian Attack', moves: '1.Nf3 Nf6 2.g3', category: 'flank', description: 'Universal attacking setup' },

  // Bird's Opening
  { eco: 'A02', name: "Bird's Opening", moves: '1.f4', category: 'flank', description: 'Control e5 with f-pawn' },
  { eco: 'A02', name: 'From Gambit', moves: '1.f4 e5', category: 'gambit', description: 'Counter to Bird\'s Opening' },

  // Other Flank Openings
  { eco: 'A00', name: 'Hungarian Opening', moves: '1.g3', category: 'flank', description: 'Flexible, kingside fianchetto' },
  { eco: 'A01', name: 'Larsen\'s Opening', moves: '1.b3', category: 'flank', description: 'Queenside fianchetto' },
  { eco: 'A00', name: 'Grob Attack', moves: '1.g4', category: 'irregular', description: 'Eccentric opening' },

  // ========== LONDON SYSTEM AND SIMILAR ==========
  { eco: 'D00', name: 'London System', moves: '1.d4 d5 2.Bf4', category: 'closed', description: 'Solid, systematic setup' },
  { eco: 'D00', name: 'London System', variation: 'Main Line', moves: '1.d4 d5 2.Bf4 Nf6 3.e3', category: 'closed', description: 'Pyramidal pawn structure' },
  { eco: 'A45', name: 'Trompowsky Attack', moves: '1.d4 Nf6 2.Bg5', category: 'closed', description: 'Aggressive anti-Indian' },
  { eco: 'A46', name: 'Torre Attack', moves: '1.d4 Nf6 2.Nf3 e6 3.Bg5', category: 'closed', description: 'Pin knight, solid development' },
  { eco: 'D03', name: 'Torre Attack', variation: 'Classical', moves: '1.d4 d5 2.Nf3 Nf6 3.Bg5', category: 'closed', description: 'Against d5' },
  { eco: 'D01', name: 'Veresov Attack', moves: '1.d4 d5 2.Nc3 Nf6 3.Bg5', category: 'closed', description: 'Early Nc3 and Bg5' },
  { eco: 'D00', name: 'Blackmar-Diemer Gambit', moves: '1.d4 d5 2.e4 dxe4 3.Nc3 Nf6 4.f3', category: 'gambit', description: 'Aggressive gambit for development' },

  // ========== CATALAN OPENING ==========
  { eco: 'E01', name: 'Catalan Opening', moves: '1.d4 Nf6 2.c4 e6 3.g3', category: 'closed', description: 'Fianchetto bishop, pressure on d5' },
  { eco: 'E04', name: 'Catalan Opening', variation: 'Open', moves: '1.d4 Nf6 2.c4 e6 3.g3 d5 4.Bg2 dxc4', category: 'closed', description: 'Black takes on c4' },
  { eco: 'E06', name: 'Catalan Opening', variation: 'Closed', moves: '1.d4 Nf6 2.c4 e6 3.g3 d5 4.Bg2 Be7', category: 'closed', description: 'Black keeps tension' },

  // ========== IRREGULAR AND OTHERS ==========
  { eco: 'A40', name: 'Owen Defense', moves: '1.e4 b6', category: 'irregular', description: 'Fianchetto queenside early' },
  { eco: 'A40', name: "St. George Defense", moves: '1.e4 a6', category: 'irregular', description: 'Unusual but playable' },
  { eco: 'A00', name: 'Ware Opening', moves: '1.a4', category: 'irregular', description: 'Unusual first move' },
  { eco: 'A00', name: 'Polish Opening', moves: '1.b4', category: 'irregular', description: 'The Sokolsky, flank attack' },
  { eco: 'C20', name: "King's Pawn Game", moves: '1.e4 e5', category: 'open', description: 'Classic response to 1.e4' },
  { eco: 'D00', name: "Queen's Pawn Game", moves: '1.d4 d5', category: 'closed', description: 'Classic response to 1.d4' },
];

/**
 * Convert PGN moves to array of SAN notation
 */
function pgnToMoves(pgn: string): string[] {
  const movesSection = pgn.replace(/\[[^\]]*\]/g, '').trim();
  return movesSection
    .replace(/\{[^}]*\}/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\$\d+/g, '')
    .replace(/1-0|0-1|1\/2-1\/2|\*/g, '')
    .split(/\s+/)
    .filter(token => token && !token.match(/^\d+\.+$/) && token !== '...')
    .map(m => m.replace(/[+#!?]+$/, ''));
}

/**
 * Normalize move notation for comparison (remove captures, checks, etc.)
 */
function normalizeMove(move: string): string {
  return move
    .replace(/[+#!?x]/g, '')
    .replace(/=.+$/, '')  // Remove promotion suffix
    .toLowerCase()
    .trim();
}

/**
 * Detect the opening from a PGN string or move array
 */
export function detectOpeningFromPgn(pgn: string): DetectedOpening | undefined {
  const moves = pgnToMoves(pgn);
  return detectOpeningFromMoves(moves);
}

/**
 * Detect the opening from an array of moves
 */
export function detectOpeningFromMoves(moves: string[]): DetectedOpening | undefined {
  // Build move sequence by playing through the game
  const chess = new Chess();
  const playedMoves: string[] = [];
  
  for (const move of moves.slice(0, 25)) { // Only check first 25 moves for opening
    try {
      chess.move(move);
      playedMoves.push(move);
    } catch {
      break;
    }
  }
  
  if (playedMoves.length === 0) return undefined;
  
  // Find best matching opening (longest match wins, then most specific)
  let bestMatch: OpeningEntry | undefined;
  let bestMatchLength = 0;
  
  for (const opening of OPENINGS_DATABASE) {
    const openingMoves = pgnToMoves(opening.moves);
    let matchCount = 0;
    
    for (let i = 0; i < openingMoves.length && i < playedMoves.length; i++) {
      const openingMove = normalizeMove(openingMoves[i]);
      const playedMove = normalizeMove(playedMoves[i]);
      
      if (openingMove === playedMove) {
        matchCount++;
      } else {
        break;
      }
    }
    
    // Require full opening sequence to match
    // Prefer longer matches and variations over base openings
    if (matchCount >= openingMoves.length && matchCount > 0) {
      const isLongerMatch = matchCount > bestMatchLength;
      const isSameLengthButMoreSpecific = matchCount === bestMatchLength && 
        opening.variation && (!bestMatch || !bestMatch.variation);
      
      if (isLongerMatch || isSameLengthButMoreSpecific) {
        bestMatch = opening;
        bestMatchLength = matchCount;
      }
    }
  }
  
  if (!bestMatch) return undefined;
  
  // Build full name
  const fullName = bestMatch.variation 
    ? `${bestMatch.name}: ${bestMatch.variation}`
    : bestMatch.name;
  
  return {
    eco: bestMatch.eco,
    name: bestMatch.name,
    variation: bestMatch.variation,
    fullName,
    moves: bestMatch.moves,
    moveCount: pgnToMoves(bestMatch.moves).length,
    category: bestMatch.category,
    description: bestMatch.description,
  };
}

/**
 * Get opening name suitable for display
 */
export function getOpeningDisplayName(opening: DetectedOpening | undefined): string {
  if (!opening) return 'Unknown Opening';
  return opening.fullName;
}

/**
 * Check if the opening is a gambit
 */
export function isGambit(opening: DetectedOpening | undefined): boolean {
  if (!opening) return false;
  return opening.category === 'gambit' || opening.name.toLowerCase().includes('gambit');
}

/**
 * Get all openings in the database
 */
export function getAllOpenings(): OpeningEntry[] {
  return [...OPENINGS_DATABASE];
}

/**
 * Search openings by name
 */
export function searchOpenings(query: string): OpeningEntry[] {
  const lowerQuery = query.toLowerCase();
  return OPENINGS_DATABASE.filter(o => 
    o.name.toLowerCase().includes(lowerQuery) ||
    (o.variation && o.variation.toLowerCase().includes(lowerQuery)) ||
    o.eco.toLowerCase().includes(lowerQuery)
  );
}
