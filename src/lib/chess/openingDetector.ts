/**
 * Comprehensive Opening Detection System
 * 
 * Detects and classifies chess openings by name, ECO code, and category.
 * Includes all major openings and their popular variations from the Book of Openings.
 * 
 * TABLE OF CONTENTS:
 * - Open Games (1.e4 e5): Centre, King's Gambit, Bishop's, Vienna, King's Knight, Spanish, Italian, Scotch, Philidor, Petrov
 * - Semi-Open Defenses: Scandinavian, French, Caro-Kann, Sicilian, Alekhine, Modern/Pirc
 * - Closed Games: Queen's Gambit
 * - Indian Defenses: Nimzo-Indian, King's Indian, Queen's Indian
 * - Flank Openings: Réti, English, Bird's
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
  marketingDescription?: string;
  famousPlayers?: string[];
  historicalSignificance?: string;
  valueBonus?: number; // Percentage bonus for recognized book opening
}

interface OpeningEntry {
  eco: string;
  name: string;
  variation?: string;
  moves: string;
  category: DetectedOpening['category'];
  description: string;
  marketingDescription?: string;
  famousPlayers?: string[];
  historicalSignificance?: string;
  valueBonus?: number;
}

// Comprehensive opening database with famous names and marketing data
const OPENINGS_DATABASE: OpeningEntry[] = [
  // ═══════════════════════════════════════════════════════════════════
  // OPEN GAMES (1.e4 e5)
  // ═══════════════════════════════════════════════════════════════════
  
  // King's Pawn Opening
  { 
    eco: 'C20', name: "King's Pawn Game", moves: '1.e4 e5', category: 'open', 
    description: 'Classic response to 1.e4',
    valueBonus: 5,
  },

  // ─────────────────────────────────────────────────────────────────────
  // Centre Game
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'C21', name: 'Centre Game', moves: '1.e4 e5 2.d4', category: 'open', 
    description: 'Direct central strike',
    marketingDescription: '💥 The Centre Game - Strike at the heart! An immediate challenge to Black\'s control of the center. Simple, direct, devastating.',
    famousPlayers: ['Mieses', 'Blackburne'],
    historicalSignificance: 'Popular in the 19th century romantic era. A direct approach favored by attacking players.',
    valueBonus: 8,
  },
  { eco: 'C21', name: 'Centre Game', variation: 'Accepted', moves: '1.e4 e5 2.d4 exd4', category: 'open', description: 'Taking the center pawn', valueBonus: 8 },
  { eco: 'C22', name: 'Centre Game', variation: 'Main Line', moves: '1.e4 e5 2.d4 exd4 3.Qxd4', category: 'open', description: 'Queen recapture, developing quickly', valueBonus: 8 },

  // ─────────────────────────────────────────────────────────────────────
  // King's Gambit
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'C30', name: "King's Gambit", moves: '1.e4 e5 2.f4', category: 'gambit', 
    description: 'Romantic era attacking opening',
    marketingDescription: '👑 The King\'s Gambit - The ultimate romantic gambit. Sacrificing the f-pawn for glory, this opening defined the golden age of chess.',
    famousPlayers: ['Anderssen', 'Morphy', 'Spassky', 'Fischer', 'Short'],
    historicalSignificance: 'The weapon of choice in the Romantic Era. Used in the famous "Immortal Game" and "Evergreen Game".',
    valueBonus: 15,
  },
  { eco: 'C33', name: "King's Gambit Accepted", moves: '1.e4 e5 2.f4 exf4', category: 'gambit', description: 'Taking the gambit pawn', valueBonus: 15 },
  { eco: 'C30', name: "King's Gambit Declined", moves: '1.e4 e5 2.f4 Bc5', category: 'open', description: 'Declining the gambit', valueBonus: 12 },
  { eco: 'C39', name: "King's Gambit", variation: 'Muzio Gambit', moves: '1.e4 e5 2.f4 exf4 3.Nf3 g5 4.Bc4 g4 5.O-O', category: 'gambit', description: 'Piece sacrifice for massive attack', valueBonus: 18 },
  { eco: 'C34', name: "King's Gambit", variation: 'Fischer Defense', moves: '1.e4 e5 2.f4 exf4 3.Nf3 d6', category: 'gambit', description: 'Fischer\'s solid approach', valueBonus: 15 },

  // ─────────────────────────────────────────────────────────────────────
  // Bishop's Opening
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'C23', name: "Bishop's Opening", moves: '1.e4 e5 2.Bc4', category: 'open', 
    description: 'Early bishop development to active square',
    marketingDescription: '🧿 The Bishop\'s Opening - Target f7 from move two! A flexible and potent weapon that can transpose into Italian or King\'s Gambit lines.',
    famousPlayers: ['Philidor', 'Morphy', 'Short'],
    historicalSignificance: 'One of the oldest openings, predating 1.e4 e5 2.Nf3. Recommended by Philidor.',
    valueBonus: 10,
  },
  { eco: 'C23', name: "Bishop's Opening", variation: 'Classical', moves: '1.e4 e5 2.Bc4 Bc5', category: 'open', description: 'Symmetrical development', valueBonus: 10 },
  { eco: 'C24', name: "Bishop's Opening", variation: 'Berlin Defense', moves: '1.e4 e5 2.Bc4 Nf6', category: 'open', description: 'Active knight development', valueBonus: 10 },

  // ─────────────────────────────────────────────────────────────────────
  // Vienna Game
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'C25', name: 'Vienna Game', moves: '1.e4 e5 2.Nc3', category: 'open', 
    description: 'Flexible preparation for f4',
    marketingDescription: '🎭 The Vienna Game - The sophisticated cousin of the King\'s Gambit. Prepare f4 without committing, then unleash the attack.',
    famousPlayers: ['Steinitz', 'Spielmann', 'Larsen'],
    historicalSignificance: 'Named after the Viennese masters who developed it. A strategic alternative to the King\'s Gambit.',
    valueBonus: 10,
  },
  { eco: 'C26', name: 'Vienna Game', variation: 'Max Lange Defense', moves: '1.e4 e5 2.Nc3 Nc6', category: 'open', description: 'Natural knight development', valueBonus: 10 },
  { eco: 'C29', name: 'Vienna Gambit', moves: '1.e4 e5 2.Nc3 Nf6 3.f4', category: 'gambit', description: 'Delayed King\'s Gambit', valueBonus: 12 },
  { eco: 'C27', name: 'Vienna Game', variation: 'Frankenstein-Dracula Variation', moves: '1.e4 e5 2.Nc3 Nf6 3.Bc4 Nxe4', category: 'gambit', description: 'Sharp tactical battle', valueBonus: 15 },

  // ─────────────────────────────────────────────────────────────────────
  // King's Knight Opening
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'C40', name: "King's Knight Opening", moves: '1.e4 e5 2.Nf3', category: 'open', 
    description: 'The most natural developing move',
    marketingDescription: '🐴 The King\'s Knight Opening - The universal foundation. From here springs the Italian, Spanish, Scotch, and countless masterpieces.',
    famousPlayers: ['All World Champions'],
    historicalSignificance: 'The starting point for nearly all classical 1.e4 e5 openings. The foundation of opening theory.',
    valueBonus: 5,
  },

  // ─────────────────────────────────────────────────────────────────────
  // Spanish Game (Ruy Lopez)
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'C60', name: 'Spanish Game', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5', category: 'open', 
    description: 'The Spanish Game - most analyzed opening',
    marketingDescription: '🏰 The Spanish Game (Ruy Lopez) - The royal weapon of world champions. Five centuries of theory have only deepened its strategic mysteries.',
    famousPlayers: ['Lasker', 'Capablanca', 'Fischer', 'Karpov', 'Anand', 'Carlsen'],
    historicalSignificance: 'Named after 16th century Spanish priest Ruy López de Segura. The most respected opening at the highest levels.',
    valueBonus: 12,
  },
  { eco: 'C60', name: 'Ruy Lopez', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5', category: 'open', description: 'The Spanish Game - most analyzed opening', valueBonus: 12 },
  { eco: 'C65', name: 'Ruy Lopez', variation: 'Berlin Defense', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6', category: 'open', description: 'The Berlin Wall - extremely solid', valueBonus: 12 },
  { eco: 'C68', name: 'Ruy Lopez', variation: 'Exchange Variation', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Bxc6', category: 'open', description: 'Doubled pawns but bishop pair', valueBonus: 10 },
  { eco: 'C78', name: 'Ruy Lopez', variation: 'Morphy Defense', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4', category: 'open', description: 'Main line Ruy Lopez', valueBonus: 12 },
  { eco: 'C80', name: 'Ruy Lopez', variation: 'Open Defense', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Nxe4', category: 'open', description: 'Taking the e4 pawn early', valueBonus: 12 },
  { eco: 'C84', name: 'Ruy Lopez', variation: 'Closed Defense', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7', category: 'open', description: 'Most common main line', valueBonus: 12 },
  { eco: 'C89', name: 'Marshall Attack', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 O-O 8.c3 d5', category: 'gambit', description: 'Famous gambit for attack on white king', valueBonus: 18 },

  // ─────────────────────────────────────────────────────────────────────
  // Italian Game
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'C50', name: 'Italian Game', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4', category: 'open', 
    description: 'Classic opening targeting f7',
    marketingDescription: '🍕 The Italian Game - A Renaissance masterpiece that has withstood five centuries of chess evolution. The opening of choice for artistic players who appreciate classical beauty.',
    famousPlayers: ['Greco', 'Morphy', 'Fischer', 'Caruana'],
    historicalSignificance: 'One of the oldest recorded openings, dating back to the 16th century Italian masters.',
    valueBonus: 12,
  },
  { eco: 'C53', name: 'Giuoco Piano', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5', category: 'open', description: 'The "quiet game" - solid development', valueBonus: 10 },
  { eco: 'C54', name: 'Giuoco Piano', variation: 'Main Line', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3', category: 'open', description: 'Preparing d4 push', valueBonus: 10 },
  { eco: 'C55', name: 'Two Knights Defense', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6', category: 'open', description: 'Active defense, sharp play', valueBonus: 10 },
  { eco: 'C57', name: 'Fried Liver Attack', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5 Nxd5 6.Nxf7', category: 'gambit', description: 'Famous knight sacrifice on f7', valueBonus: 18 },
  { eco: 'C51', name: 'Evans Gambit', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4', category: 'gambit', description: 'Aggressive pawn sacrifice for tempo', valueBonus: 15 },

  // ─────────────────────────────────────────────────────────────────────
  // Scotch Game
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'C44', name: 'Scotch Game', moves: '1.e4 e5 2.Nf3 Nc6 3.d4', category: 'open', 
    description: 'Immediate central confrontation',
    marketingDescription: '🥃 The Scotch Game - Bold and direct, favored by players who demand immediate action. Kasparov brought it back to elite play.',
    famousPlayers: ['Kasparov', 'Caruana', 'Nakamura'],
    historicalSignificance: 'Named after the 1824 correspondence match between Edinburgh and London chess clubs.',
    valueBonus: 10,
  },
  { eco: 'C45', name: 'Scotch Game', variation: 'Classical', moves: '1.e4 e5 2.Nf3 Nc6 3.d4 exd4 4.Nxd4', category: 'open', description: 'Recapturing with knight', valueBonus: 10 },
  { eco: 'C44', name: 'Scotch Gambit', moves: '1.e4 e5 2.Nf3 Nc6 3.d4 exd4 4.Bc4', category: 'gambit', description: 'Gambit for rapid development', valueBonus: 12 },
  { eco: 'C45', name: 'Scotch Game', variation: 'Mieses Variation', moves: '1.e4 e5 2.Nf3 Nc6 3.d4 exd4 4.Nxd4 Nf6 5.Nxc6 bxc6 6.e5', category: 'open', description: 'Sharp pawn push variation', valueBonus: 10 },

  // ─────────────────────────────────────────────────────────────────────
  // Philidor Defense
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'C41', name: 'Philidor Defense', moves: '1.e4 e5 2.Nf3 d6', category: 'open', 
    description: 'Solid but passive defense',
    marketingDescription: '🛡️ The Philidor Defense - "Pawns are the soul of chess" - Named after the greatest player of the 18th century. Solid, resilient, timeless.',
    famousPlayers: ['Philidor', 'Larsen', 'Ivanchuk'],
    historicalSignificance: 'Named after François-André Danican Philidor, who dominated chess for 50 years in the 1700s.',
    valueBonus: 10,
  },
  { eco: 'C41', name: 'Philidor Defense', variation: 'Hanham Variation', moves: '1.e4 e5 2.Nf3 d6 3.d4 Nd7', category: 'open', description: 'Flexible knight placement', valueBonus: 10 },
  { eco: 'C41', name: 'Philidor Defense', variation: 'Lion Variation', moves: '1.e4 e5 2.Nf3 d6 3.d4 Nf6', category: 'open', description: 'Active counterplay', valueBonus: 10 },

  // ─────────────────────────────────────────────────────────────────────
  // Petrov Defense (Russian Game)
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'C42', name: 'Petrov Defense', moves: '1.e4 e5 2.Nf3 Nf6', category: 'open', 
    description: 'The Russian Game - symmetrical and solid',
    marketingDescription: '🇷🇺 The Petrov Defense - The fortress of Russian chess. Symmetrical, solid, and the choice of players seeking equality with Black.',
    famousPlayers: ['Petrov', 'Karpov', 'Kramnik', 'Caruana'],
    historicalSignificance: 'Named after Russian master Alexander Petrov. The favorite of defensive specialists seeking peace.',
    valueBonus: 10,
  },
  { eco: 'C42', name: 'Petrov Defense', variation: 'Classical Attack', moves: '1.e4 e5 2.Nf3 Nf6 3.Nxe5 d6 4.Nf3 Nxe4', category: 'open', description: 'Main line continuation', valueBonus: 10 },
  { eco: 'C43', name: 'Petrov Defense', variation: 'Steinitz Attack', moves: '1.e4 e5 2.Nf3 Nf6 3.d4', category: 'open', description: 'Aggressive center strike', valueBonus: 10 },

  // Other Open Games
  { eco: 'C40', name: 'Latvian Gambit', moves: '1.e4 e5 2.Nf3 f5', category: 'gambit', description: 'Risky counter-gambit', valueBonus: 15 },
  { eco: 'C21', name: 'Danish Gambit', moves: '1.e4 e5 2.d4 exd4 3.c3', category: 'gambit', description: 'Sacrificing two pawns for development', valueBonus: 15 },
  { eco: 'C46', name: 'Four Knights Game', moves: '1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6', category: 'open', description: 'Symmetrical development', valueBonus: 8 },
  { eco: 'C47', name: 'Four Knights', variation: 'Scotch Variation', moves: '1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6 4.d4', category: 'open', description: 'Adding d4 to Four Knights', valueBonus: 8 },
  { eco: 'C48', name: 'Four Knights', variation: 'Spanish Variation', moves: '1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6 4.Bb5', category: 'open', description: 'Spanish flavor in Four Knights', valueBonus: 8 },
  {
    eco: 'C42', name: 'Stafford Gambit', moves: '1.e4 e5 2.Nf3 Nf6 3.Nxe5 Nc6', category: 'gambit',
    description: 'Dangerous trap-laden gambit',
    marketingDescription: '🎯 The Stafford Gambit - The ultimate trickster opening. Loaded with deadly traps that have claimed countless victims.',
    famousPlayers: ['Eric Rosen'],
    historicalSignificance: 'Made famous in the internet era by IM Eric Rosen, creating chaos with deceptive simplicity.',
    valueBonus: 15,
  },

  // ═══════════════════════════════════════════════════════════════════
  // SEMI-OPEN DEFENSES
  // ═══════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────────
  // Scandinavian Defense
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'B01', name: 'Scandinavian Defense', moves: '1.e4 d5', category: 'semi-open', 
    description: 'Immediate counter in center',
    marketingDescription: '🗡️ The Scandinavian Defense - Strike immediately! The fearless queen sortie that demands White prove their worth from move one.',
    famousPlayers: ['Bent Larsen', 'Tiviakov', 'Anand'],
    historicalSignificance: 'One of the oldest defenses to 1.e4, dating to the 15th century. Brought to elite level by Bent Larsen.',
    valueBonus: 10,
  },
  { eco: 'B01', name: 'Scandinavian Defense', variation: 'Main Line', moves: '1.e4 d5 2.exd5 Qxd5', category: 'semi-open', description: 'Queen comes out early', valueBonus: 10 },
  { eco: 'B01', name: 'Scandinavian Defense', variation: 'Modern', moves: '1.e4 d5 2.exd5 Nf6', category: 'semi-open', description: 'Not taking back immediately', valueBonus: 10 },
  { eco: 'B01', name: 'Scandinavian Defense', variation: 'Icelandic Gambit', moves: '1.e4 d5 2.exd5 Nf6 3.c4 e6', category: 'gambit', description: 'Aggressive pawn sacrifice', valueBonus: 12 },

  // ─────────────────────────────────────────────────────────────────────
  // French Defense
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'C00', name: 'French Defense', moves: '1.e4 e6', category: 'semi-open', 
    description: 'Solid but cramped defense',
    marketingDescription: '🗼 The French Defense - La Défense Française! Solid as the Eiffel Tower. Accept a cramped position, then strike back with devastating counterplay.',
    famousPlayers: ['Botvinnik', 'Petrosian', 'Short', 'Morozevich'],
    historicalSignificance: 'Named after a correspondence match between London and Paris in 1834. The thinking player\'s defense.',
    valueBonus: 10,
  },
  { eco: 'C02', name: 'French Defense', variation: 'Advance Variation', moves: '1.e4 e6 2.d4 d5 3.e5', category: 'semi-open', description: 'Space advantage for White', valueBonus: 10 },
  { eco: 'C03', name: 'French Defense', variation: 'Tarrasch Variation', moves: '1.e4 e6 2.d4 d5 3.Nd2', category: 'semi-open', description: 'Flexible knight placement', valueBonus: 10 },
  { eco: 'C10', name: 'French Defense', variation: 'Rubinstein', moves: '1.e4 e6 2.d4 d5 3.Nc3 dxe4', category: 'semi-open', description: 'Trading center pawn', valueBonus: 10 },
  { eco: 'C11', name: 'French Defense', variation: 'Classical', moves: '1.e4 e6 2.d4 d5 3.Nc3 Nf6', category: 'semi-open', description: 'Main line French', valueBonus: 10 },
  { eco: 'C15', name: 'French Defense', variation: 'Winawer', moves: '1.e4 e6 2.d4 d5 3.Nc3 Bb4', category: 'semi-open', description: 'Sharp and complex', valueBonus: 12 },

  // ─────────────────────────────────────────────────────────────────────
  // Caro-Kann Defense
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'B10', name: 'Caro-Kann Defense', moves: '1.e4 c6', category: 'semi-open', 
    description: 'Solid and reliable',
    marketingDescription: '🏛️ The Caro-Kann Defense - The fortress opening. Solid as stone, yet with hidden attacking venom. Chosen by positional masters.',
    famousPlayers: ['Karpov', 'Capablanca', 'Petrosian', 'Anand'],
    historicalSignificance: 'Named after Horatio Caro and Marcus Kann. A favorite of world champions seeking solidity with Black.',
    valueBonus: 10,
  },
  { eco: 'B12', name: 'Caro-Kann', variation: 'Advance Variation', moves: '1.e4 c6 2.d4 d5 3.e5', category: 'semi-open', description: 'Space advantage approach', valueBonus: 10 },
  { eco: 'B13', name: 'Caro-Kann', variation: 'Exchange Variation', moves: '1.e4 c6 2.d4 d5 3.exd5 cxd5', category: 'semi-open', description: 'Symmetrical pawn structure', valueBonus: 8 },
  { eco: 'B14', name: 'Caro-Kann', variation: 'Panov-Botvinnik Attack', moves: '1.e4 c6 2.d4 d5 3.exd5 cxd5 4.c4', category: 'semi-open', description: 'IQP structures', valueBonus: 10 },
  { eco: 'B15', name: 'Caro-Kann', variation: 'Main Line', moves: '1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4', category: 'semi-open', description: 'Classical approach', valueBonus: 10 },
  { eco: 'B17', name: 'Caro-Kann', variation: 'Steinitz Variation', moves: '1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Nd7', category: 'semi-open', description: 'Nd7 before Nf6', valueBonus: 10 },
  { eco: 'B18', name: 'Caro-Kann', variation: 'Classical', moves: '1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5', category: 'semi-open', description: 'Developing the bad bishop', valueBonus: 10 },

  // ─────────────────────────────────────────────────────────────────────
  // Sicilian Defense
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'B20', name: 'Sicilian Defense', moves: '1.e4 c5', category: 'semi-open', 
    description: 'Fighting response to 1.e4',
    marketingDescription: '🌋 The Sicilian Defense - The ultimate fighting defense. Asymmetrical, complex, and uncompromising. Chosen by champions who refuse to draw.',
    famousPlayers: ['Fischer', 'Kasparov', 'Carlsen', 'Nakamura', 'Caruana'],
    historicalSignificance: 'The most popular response to 1.e4 at all levels. Has decided more world championship games than any other opening.',
    valueBonus: 12,
  },
  { eco: 'B21', name: 'Sicilian Defense', variation: 'Grand Prix Attack', moves: '1.e4 c5 2.f4', category: 'semi-open', description: 'Aggressive anti-Sicilian', valueBonus: 10 },
  { eco: 'B22', name: 'Sicilian Defense', variation: 'Alapin', moves: '1.e4 c5 2.c3', category: 'semi-open', description: 'Preparing d4 without Nc3', valueBonus: 10 },
  { eco: 'B23', name: 'Sicilian Defense', variation: 'Closed', moves: '1.e4 c5 2.Nc3', category: 'semi-open', description: 'Delayed d4, flexible setup', valueBonus: 10 },
  { eco: 'B27', name: 'Sicilian Defense', variation: 'Accelerated Dragon', moves: '1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 g6', category: 'semi-open', description: 'Dragon without d6', valueBonus: 10 },
  { eco: 'B30', name: 'Sicilian Defense', variation: 'Old Sicilian', moves: '1.e4 c5 2.Nf3 Nc6', category: 'semi-open', description: 'Classical development', valueBonus: 10 },
  { eco: 'B33', name: 'Sicilian Sveshnikov', moves: '1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 e5', category: 'semi-open', description: 'Dynamic with weak d5 but active pieces', valueBonus: 12 },
  { eco: 'B52', name: 'Sicilian Rossolimo', moves: '1.e4 c5 2.Nf3 Nc6 3.Bb5', category: 'semi-open', description: 'Positional anti-Sicilian', valueBonus: 10 },
  { eco: 'B60', name: 'Sicilian Richter-Rauzer', moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 Nc6 6.Bg5', category: 'semi-open', description: 'Sharp main line Sicilian', valueBonus: 12 },
  { eco: 'B70', name: 'Sicilian Dragon', moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 g6', category: 'semi-open', description: 'Fianchetto kingside, very sharp', valueBonus: 12 },
  { eco: 'B78', name: 'Sicilian Dragon', variation: 'Yugoslav Attack', moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 g6 6.Be3 Bg7 7.f3', category: 'semi-open', description: 'White attacks on kingside', valueBonus: 15 },
  { eco: 'B80', name: 'Sicilian Scheveningen', moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 e6', category: 'semi-open', description: 'Flexible pawn structure', valueBonus: 12 },
  { eco: 'B84', name: 'Sicilian Scheveningen', variation: 'Classical', moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 e6 6.Be2', category: 'semi-open', description: 'Main line Scheveningen', valueBonus: 12 },
  { eco: 'B90', name: 'Sicilian Najdorf', moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6', category: 'semi-open', description: 'The most popular Sicilian', valueBonus: 12 },
  { eco: 'B96', name: 'Sicilian Najdorf', variation: 'Poisoned Pawn', moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Bg5 e6 7.f4 Qb6', category: 'semi-open', description: 'Famous sharp line', valueBonus: 15 },
  { 
    eco: 'B21', name: 'Smith-Morra Gambit', moves: '1.e4 c5 2.d4 cxd4 3.c3', category: 'gambit', 
    description: 'Gambit against Sicilian',
    marketingDescription: '⚔️ The Smith-Morra Gambit - Sacrifice a pawn, gain a lead in development. The aggressive answer to the Sicilian that keeps opponents off-balance.',
    famousPlayers: ['Ken Smith', 'Esserman'],
    historicalSignificance: 'Popular among club players seeking to avoid heavy Sicilian theory while maintaining attacking chances.',
    valueBonus: 12,
  },

  // ─────────────────────────────────────────────────────────────────────
  // Alekhine's Defense
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'B02', name: "Alekhine's Defense", moves: '1.e4 Nf6', category: 'semi-open', 
    description: 'Provoke e5, attack White center',
    marketingDescription: '🔫 Alekhine\'s Defense - Named after the 4th World Champion. Provoke White to over-extend, then systematically destroy their center.',
    famousPlayers: ['Alekhine', 'Fischer', 'Nakamura'],
    historicalSignificance: 'Alexander Alekhine used this hypermodern defense to confound opponents who expected classical play.',
    valueBonus: 12,
  },
  { eco: 'B03', name: "Alekhine's Defense", variation: 'Four Pawns Attack', moves: '1.e4 Nf6 2.e5 Nd5 3.d4 d6 4.c4 Nb6 5.f4', category: 'semi-open', description: 'Aggressive pawn advance', valueBonus: 12 },
  { eco: 'B04', name: "Alekhine's Defense", variation: 'Modern Variation', moves: '1.e4 Nf6 2.e5 Nd5 3.d4 d6 4.Nf3', category: 'semi-open', description: 'Main line development', valueBonus: 10 },
  { eco: 'B05', name: "Alekhine's Defense", variation: 'Modern Main Line', moves: '1.e4 Nf6 2.e5 Nd5 3.d4 d6 4.Nf3 Bg4', category: 'semi-open', description: 'Most popular continuation', valueBonus: 10 },

  // ─────────────────────────────────────────────────────────────────────
  // Modern & Pirc Defense
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'B06', name: 'Modern Defense', moves: '1.e4 g6', category: 'semi-open', 
    description: 'Flexible, delays d6',
    marketingDescription: '🦎 The Modern Defense - The chameleon opening. Flexible and provocative, inviting White to overextend before striking back.',
    famousPlayers: ['Suttles', 'Speelman', 'Ljubojevic'],
    historicalSignificance: 'A hypermodern approach that became popular in the 1960s-70s.',
    valueBonus: 10,
  },
  { 
    eco: 'B07', name: 'Pirc Defense', moves: '1.e4 d6 2.d4 Nf6 3.Nc3 g6', category: 'semi-open', 
    description: 'Hypermodern, lets White build center',
    marketingDescription: '🐍 The Pirc Defense - Named after Grandmaster Vasja Pirc. Allow White to build a center, then strike with lethal precision.',
    famousPlayers: ['Pirc', 'Spassky', 'Smyslov'],
    historicalSignificance: 'Named after Yugoslav GM Vasja Pirc. A hypermodern approach that influenced modern chess.',
    valueBonus: 10,
  },
  { eco: 'B08', name: 'Pirc Defense', variation: 'Classical', moves: '1.e4 d6 2.d4 Nf6 3.Nc3 g6 4.Nf3', category: 'semi-open', description: 'Standard development', valueBonus: 10 },
  { eco: 'B09', name: 'Pirc Defense', variation: 'Austrian Attack', moves: '1.e4 d6 2.d4 Nf6 3.Nc3 g6 4.f4', category: 'semi-open', description: 'Aggressive f4 push', valueBonus: 12 },

  // ═══════════════════════════════════════════════════════════════════
  // CLOSED GAMES (1.d4 d5)
  // ═══════════════════════════════════════════════════════════════════

  // Queen's Pawn Game base
  { eco: 'D00', name: "Queen's Pawn Game", moves: '1.d4 d5', category: 'closed', description: 'Classic response to 1.d4', valueBonus: 5 },

  // ─────────────────────────────────────────────────────────────────────
  // Queen's Gambit
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'D06', name: "Queen's Gambit", moves: '1.d4 d5 2.c4', category: 'closed', 
    description: 'Classical opening for center control',
    marketingDescription: '👸 The Queen\'s Gambit - The opening that launched a cultural phenomenon. Elegant, strategic, and timeless. The crown jewel of classical chess.',
    famousPlayers: ['Lasker', 'Capablanca', 'Botvinnik', 'Kasparov', 'Carlsen'],
    historicalSignificance: 'One of the oldest recorded openings. Made globally famous by the Netflix series, but respected for centuries by grandmasters.',
    valueBonus: 15,
  },
  { eco: 'D20', name: "Queen's Gambit Accepted", moves: '1.d4 d5 2.c4 dxc4', category: 'closed', description: 'Taking the gambit pawn', valueBonus: 12 },
  { eco: 'D30', name: "Queen's Gambit Declined", moves: '1.d4 d5 2.c4 e6', category: 'closed', description: 'Solid defense, maintaining d5', valueBonus: 12 },
  { eco: 'D31', name: "Queen's Gambit Declined", variation: 'Albin Counter-Gambit', moves: '1.d4 d5 2.c4 e5', category: 'gambit', description: 'Aggressive counter', valueBonus: 15 },
  { eco: 'D35', name: "Queen's Gambit Declined", variation: 'Exchange', moves: '1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.cxd5 exd5', category: 'closed', description: 'Symmetrical structure', valueBonus: 10 },
  { eco: 'D37', name: "Queen's Gambit Declined", variation: 'Classical', moves: '1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Nf3', category: 'closed', description: 'Standard development', valueBonus: 12 },
  { eco: 'D40', name: "Queen's Gambit Declined", variation: 'Semi-Tarrasch', moves: '1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Nf3 c5', category: 'closed', description: 'Counter in center with c5', valueBonus: 12 },
  { eco: 'D32', name: "Tarrasch Defense", moves: '1.d4 d5 2.c4 e6 3.Nc3 c5', category: 'closed', description: 'Active isolated queen pawn', valueBonus: 10 },

  // Slav Defense
  { eco: 'D10', name: 'Slav Defense', moves: '1.d4 d5 2.c4 c6', category: 'closed', description: 'Solid, supports d5 with c6', valueBonus: 10 },
  { eco: 'D11', name: 'Slav Defense', variation: 'Main Line', moves: '1.d4 d5 2.c4 c6 3.Nf3', category: 'closed', description: 'Standard development', valueBonus: 10 },
  { eco: 'D15', name: 'Slav Defense', variation: 'Three Knights', moves: '1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3', category: 'closed', description: 'Developing knights', valueBonus: 10 },
  { eco: 'D17', name: 'Slav Defense', variation: 'Czech', moves: '1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 dxc4 5.a4 Bf5', category: 'closed', description: 'Taking and developing bishop', valueBonus: 10 },

  // ═══════════════════════════════════════════════════════════════════
  // INDIAN DEFENSES
  // ═══════════════════════════════════════════════════════════════════

  { 
    eco: 'E60', name: "Indian Game", moves: '1.d4 Nf6', category: 'semi-closed', 
    description: 'Hypermodern response to d4',
    marketingDescription: '🕉️ The Indian Game - A family of hypermodern defenses from the subcontinent. Flexible, dynamic, and full of hidden counterplay.',
    famousPlayers: ['Nimzowitsch', 'Fischer', 'Kasparov', 'Giri'],
    historicalSignificance: 'The Indian systems revolutionized chess theory in the 20th century, proving that controlling the center doesn\'t require occupying it.',
    valueBonus: 10,
  },

  // ─────────────────────────────────────────────────────────────────────
  // Nimzo-Indian Defense
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'E20', name: 'Nimzo-Indian Defense', moves: '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4', category: 'semi-closed', 
    description: 'Flexible and solid, pins Nc3',
    marketingDescription: '🎩 The Nimzo-Indian Defense - Aron Nimzowitsch\'s masterpiece. Pin the knight, control the center indirectly. The elite\'s favorite response to 1.d4.',
    famousPlayers: ['Nimzowitsch', 'Capablanca', 'Karpov', 'Kasparov', 'Carlsen'],
    historicalSignificance: 'Created by Aron Nimzowitsch. Revolutionized chess by showing positional pressure can replace material.',
    valueBonus: 12,
  },
  { eco: 'E32', name: 'Nimzo-Indian Defense', variation: 'Classical', moves: '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 4.Qc2', category: 'semi-closed', description: 'Preventing doubled pawns', valueBonus: 12 },
  { eco: 'E41', name: 'Nimzo-Indian Defense', variation: 'Huebner', moves: '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 4.e3 c5', category: 'semi-closed', description: 'Modern treatment', valueBonus: 12 },
  { eco: 'E53', name: 'Nimzo-Indian Defense', variation: 'Main Line', moves: '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 4.e3 O-O 5.Bd3 d5 6.Nf3', category: 'semi-closed', description: 'Standard setup', valueBonus: 12 },

  // ─────────────────────────────────────────────────────────────────────
  // King's Indian Defense
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'E60', name: "King's Indian Defense", moves: '1.d4 Nf6 2.c4 g6', category: 'semi-closed', 
    description: 'Hypermodern, fianchetto kingside',
    marketingDescription: '⚔️ The King\'s Indian Defense - The warrior\'s choice. Concede the center, then launch a devastating kingside attack.',
    famousPlayers: ['Bronstein', 'Fischer', 'Kasparov', 'Nakamura'],
    historicalSignificance: 'Kasparov\'s primary weapon with Black. Created some of the most memorable games in chess history.',
    valueBonus: 12,
  },
  { eco: 'E62', name: "King's Indian Defense", variation: 'Fianchetto', moves: '1.d4 Nf6 2.c4 g6 3.g3', category: 'semi-closed', description: 'Quiet, positional approach', valueBonus: 10 },
  { eco: 'E70', name: "King's Indian Defense", variation: 'Classical', moves: '1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.Nf3', category: 'semi-closed', description: 'Main line KID', valueBonus: 12 },
  { eco: 'E76', name: "King's Indian Defense", variation: 'Four Pawns Attack', moves: '1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.f4', category: 'semi-closed', description: 'Aggressive pawn advance', valueBonus: 12 },
  { eco: 'E80', name: "King's Indian Defense", variation: 'Sämisch', moves: '1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.f3', category: 'semi-closed', description: 'Solid, preparing Be3', valueBonus: 12 },
  { eco: 'E97', name: "King's Indian Defense", variation: 'Mar del Plata', moves: '1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.Nf3 O-O 6.Be2 e5 7.O-O Nc6', category: 'semi-closed', description: 'Famous attacking variation', valueBonus: 15 },

  // ─────────────────────────────────────────────────────────────────────
  // Queen's Indian Defense
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'E12', name: "Queen's Indian Defense", moves: '1.d4 Nf6 2.c4 e6 3.Nf3 b6', category: 'semi-closed', 
    description: 'Control e4 with Bb7',
    marketingDescription: '👑 The Queen\'s Indian Defense - Control e4 with the fianchettoed bishop. Solid, flexible, and elegant.',
    famousPlayers: ['Karpov', 'Anand', 'Kramnik'],
    historicalSignificance: 'Developed as an alternative when 3.Nc3 is avoided. A positional masterpiece.',
    valueBonus: 10,
  },
  { eco: 'E15', name: "Queen's Indian Defense", variation: 'Main Line', moves: '1.d4 Nf6 2.c4 e6 3.Nf3 b6 4.g3', category: 'semi-closed', description: 'Fianchetto approach', valueBonus: 10 },
  { eco: 'E17', name: "Queen's Indian Defense", variation: 'Classical', moves: '1.d4 Nf6 2.c4 e6 3.Nf3 b6 4.g3 Bb7 5.Bg2 Be7', category: 'semi-closed', description: 'Traditional setup', valueBonus: 10 },

  // Grünfeld Defense
  { 
    eco: 'D70', name: 'Grünfeld Defense', moves: '1.d4 Nf6 2.c4 g6 3.Nc3 d5', category: 'semi-closed', 
    description: 'Hypermodern counter to d4',
    marketingDescription: '💣 The Grünfeld Defense - Ernst Grünfeld\'s revolutionary concept. Give White the center, then blow it up.',
    famousPlayers: ['Kasparov', 'Svidler', 'Giri'],
    historicalSignificance: 'Introduced by Ernst Grünfeld in 1922. Kasparov\'s most trusted weapon.',
    valueBonus: 12,
  },
  { eco: 'D85', name: 'Grünfeld Defense', variation: 'Exchange Variation', moves: '1.d4 Nf6 2.c4 g6 3.Nc3 d5 4.cxd5 Nxd5 5.e4', category: 'semi-closed', description: 'White builds big center', valueBonus: 12 },
  { eco: 'D90', name: 'Grünfeld Defense', variation: 'Russian System', moves: '1.d4 Nf6 2.c4 g6 3.Nc3 d5 4.Nf3', category: 'semi-closed', description: 'Solid development', valueBonus: 12 },

  // Bogo-Indian Defense
  { eco: 'E11', name: 'Bogo-Indian Defense', moves: '1.d4 Nf6 2.c4 e6 3.Nf3 Bb4+', category: 'semi-closed', description: 'Check with bishop early', valueBonus: 10 },

  // Benoni Defense
  { eco: 'A60', name: 'Benoni Defense', moves: '1.d4 Nf6 2.c4 c5 3.d5', category: 'semi-closed', description: 'Asymmetrical pawn structure', valueBonus: 10 },
  { eco: 'A65', name: 'Benoni Defense', variation: 'Main Line', moves: '1.d4 Nf6 2.c4 c5 3.d5 e6 4.Nc3 exd5 5.cxd5 d6', category: 'semi-closed', description: 'Classical Benoni', valueBonus: 10 },
  { eco: 'A67', name: 'Benko Gambit', moves: '1.d4 Nf6 2.c4 c5 3.d5 b5', category: 'gambit', description: 'Pawn sac for queenside pressure', valueBonus: 12 },
  { eco: 'A57', name: 'Benko Gambit', variation: 'Accepted', moves: '1.d4 Nf6 2.c4 c5 3.d5 b5 4.cxb5 a6', category: 'gambit', description: 'Taking the gambit', valueBonus: 12 },

  // Dutch Defense
  { 
    eco: 'A80', name: 'Dutch Defense', moves: '1.d4 f5', category: 'semi-closed', 
    description: 'Aggressive response to d4',
    marketingDescription: '🌷 The Dutch Defense - From the land of tulips and windmills. An unbalancing choice that leads to unique middlegame positions.',
    famousPlayers: ['Alekhine', 'Botvinnik', 'Short', 'Nakamura'],
    historicalSignificance: 'Played by world champions seeking winning chances with Black.',
    valueBonus: 10,
  },
  { eco: 'A84', name: 'Dutch Defense', variation: 'Classical', moves: '1.d4 f5 2.c4 Nf6 3.Nc3 e6', category: 'semi-closed', description: 'Standard development', valueBonus: 10 },
  { eco: 'A87', name: 'Dutch Defense', variation: 'Leningrad', moves: '1.d4 f5 2.c4 Nf6 3.g3 g6', category: 'semi-closed', description: 'Dragon-like setup', valueBonus: 10 },
  { eco: 'A90', name: 'Dutch Defense', variation: 'Stonewall', moves: '1.d4 f5 2.c4 e6 3.Nc3 Nf6 4.e3 d5', category: 'semi-closed', description: 'Solid pawn structure', valueBonus: 10 },

  // ═══════════════════════════════════════════════════════════════════
  // FLANK OPENINGS
  // ═══════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────────
  // Réti Opening
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'A04', name: 'Réti Opening', moves: '1.Nf3', category: 'flank', 
    description: 'Hypermodern, flexible setup',
    marketingDescription: '♟️ The Réti Opening - Richard Réti\'s hypermodern revolution. Control the center without occupying it.',
    famousPlayers: ['Réti', 'Larsen', 'Kramnik'],
    historicalSignificance: 'Named after Richard Réti, who beat Capablanca with it when the Cuban was undefeated.',
    valueBonus: 10,
  },
  { eco: 'A05', name: 'Réti Opening', variation: "King's Indian Attack", moves: '1.Nf3 Nf6 2.g3', category: 'flank', description: 'Universal attacking setup', valueBonus: 10 },
  { eco: 'A09', name: 'Réti Opening', variation: 'Advance Variation', moves: '1.Nf3 d5 2.c4', category: 'flank', description: 'Challenging the center', valueBonus: 10 },

  // ─────────────────────────────────────────────────────────────────────
  // English Opening
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'A10', name: 'English Opening', moves: '1.c4', category: 'flank', 
    description: 'Flexible flank opening',
    marketingDescription: '🇬🇧 The English Opening - The flexible weapon of positional masters. Delays commitment, maximizes options, dominates from the flanks.',
    famousPlayers: ['Botvinnik', 'Kramnik', 'Caruana'],
    historicalSignificance: 'Named for the English master Howard Staunton. The backbone of 1.c4 players seeking long-term positional advantage.',
    valueBonus: 10,
  },
  { eco: 'A16', name: 'English Opening', variation: 'Anglo-Indian', moves: '1.c4 Nf6 2.Nc3', category: 'flank', description: 'English with Indian setup', valueBonus: 10 },
  { eco: 'A20', name: 'English Opening', variation: 'Reversed Sicilian', moves: '1.c4 e5', category: 'flank', description: 'Sicilian with colors reversed', valueBonus: 10 },
  { eco: 'A30', name: 'English Opening', variation: 'Symmetrical', moves: '1.c4 c5', category: 'flank', description: 'Both sides play c-pawn', valueBonus: 10 },
  { eco: 'A36', name: 'English Opening', variation: 'Symmetrical Four Knights', moves: '1.c4 c5 2.Nc3 Nc6 3.g3 g6 4.Bg2 Bg7 5.Nf3 Nf6', category: 'flank', description: 'Symmetrical with full development', valueBonus: 10 },

  // ─────────────────────────────────────────────────────────────────────
  // Bird's Opening
  // ─────────────────────────────────────────────────────────────────────
  { 
    eco: 'A02', name: "Bird's Opening", moves: '1.f4', category: 'flank', 
    description: 'Control e5 with f-pawn',
    marketingDescription: '🦅 Bird\'s Opening - Named after Henry Bird. An unusual but dangerous weapon that leads to unique positions.',
    famousPlayers: ['Bird', 'Larsen', 'Nakamura'],
    historicalSignificance: 'Named after Henry Bird, 19th century English master. A surprise weapon at any level.',
    valueBonus: 10,
  },
  { eco: 'A03', name: "Bird's Opening", variation: 'Dutch Variation', moves: '1.f4 d5', category: 'flank', description: 'Reversed Dutch setup', valueBonus: 10 },
  { eco: 'A02', name: 'From Gambit', moves: '1.f4 e5', category: 'gambit', description: "Counter to Bird's Opening", valueBonus: 12 },

  // ═══════════════════════════════════════════════════════════════════
  // LONDON SYSTEM & SIMILAR
  // ═══════════════════════════════════════════════════════════════════

  { 
    eco: 'D00', name: 'London System', moves: '1.d4 d5 2.Bf4', category: 'closed', 
    description: 'Solid, systematic setup',
    marketingDescription: '🏛️ The London System - Named after the 1922 London tournament. Simple to learn, hard to beat. The workhorse of club chess.',
    famousPlayers: ['Kamsky', 'Carlsen', 'Jobava'],
    historicalSignificance: 'Experienced a renaissance in modern chess due to its solid, low-theory nature.',
    valueBonus: 10,
  },
  { eco: 'D00', name: 'London System', variation: 'Main Line', moves: '1.d4 d5 2.Bf4 Nf6 3.e3', category: 'closed', description: 'Pyramidal pawn structure', valueBonus: 10 },
  { eco: 'A45', name: 'Trompowsky Attack', moves: '1.d4 Nf6 2.Bg5', category: 'closed', description: 'Aggressive anti-Indian', valueBonus: 10 },
  { eco: 'A46', name: 'Torre Attack', moves: '1.d4 Nf6 2.Nf3 e6 3.Bg5', category: 'closed', description: 'Pin knight, solid development', valueBonus: 10 },
  { eco: 'D03', name: 'Torre Attack', variation: 'Classical', moves: '1.d4 d5 2.Nf3 Nf6 3.Bg5', category: 'closed', description: 'Against d5', valueBonus: 10 },
  { eco: 'D01', name: 'Veresov Attack', moves: '1.d4 d5 2.Nc3 Nf6 3.Bg5', category: 'closed', description: 'Early Nc3 and Bg5', valueBonus: 10 },
  { eco: 'D00', name: 'Blackmar-Diemer Gambit', moves: '1.d4 d5 2.e4 dxe4 3.Nc3 Nf6 4.f3', category: 'gambit', description: 'Aggressive gambit for development', valueBonus: 15 },

  // Catalan Opening
  { eco: 'E01', name: 'Catalan Opening', moves: '1.d4 Nf6 2.c4 e6 3.g3', category: 'closed', description: 'Fianchetto bishop, pressure on d5', valueBonus: 10 },
  { eco: 'E04', name: 'Catalan Opening', variation: 'Open', moves: '1.d4 Nf6 2.c4 e6 3.g3 d5 4.Bg2 dxc4', category: 'closed', description: 'Black takes on c4', valueBonus: 10 },
  { eco: 'E06', name: 'Catalan Opening', variation: 'Closed', moves: '1.d4 Nf6 2.c4 e6 3.g3 d5 4.Bg2 Be7', category: 'closed', description: 'Black keeps tension', valueBonus: 10 },

  // ═══════════════════════════════════════════════════════════════════
  // IRREGULAR OPENINGS
  // ═══════════════════════════════════════════════════════════════════

  { eco: 'A00', name: 'Hungarian Opening', moves: '1.g3', category: 'flank', description: 'Flexible, kingside fianchetto', valueBonus: 8 },
  { eco: 'A01', name: "Larsen's Opening", moves: '1.b3', category: 'flank', description: 'Queenside fianchetto', valueBonus: 8 },
  { 
    eco: 'A00', name: 'Grob Attack', moves: '1.g4', category: 'irregular', 
    description: 'Eccentric opening',
    marketingDescription: '🗑️ The Grob Attack - The most audacious first move in chess. For those who dare to be different and embrace chaos from move one.',
    famousPlayers: ['Henri Grob', 'Basman'],
    historicalSignificance: 'Named after Swiss master Henri Grob. A psychological weapon that signals immediate aggression.',
    valueBonus: 15,
  },
  { 
    eco: 'A00', name: 'Bongcloud Attack', moves: '1.e4 e5 2.Ke2', category: 'irregular',
    description: 'The ultimate troll opening',
    marketingDescription: '☁️ The Bongcloud Attack - Made famous by Hikaru Nakamura and Magnus Carlsen playing it in official games! Pure chaos.',
    famousPlayers: ['Nakamura', 'Carlsen'],
    historicalSignificance: 'Became a meme, then was played by world champions in titled events. Chess will never be the same.',
    valueBonus: 20,
  },
  {
    eco: 'A00', name: 'Cow Opening', moves: '1.e4 e5 2.f4 exf4 3.d4', category: 'gambit',
    description: 'Moo! A rare gambit',
    marketingDescription: '🐄 The Cow Opening - An udder-ly unexpected opening! Sacrifice material for fun and confusion.',
    famousPlayers: [],
    historicalSignificance: 'A novelty opening that proves chess can still surprise.',
    valueBonus: 18,
  },
  { eco: 'A40', name: 'Owen Defense', moves: '1.e4 b6', category: 'irregular', description: 'Fianchetto queenside early', valueBonus: 10 },
  { eco: 'A40', name: "St. George Defense", moves: '1.e4 a6', category: 'irregular', description: 'Unusual but playable', valueBonus: 10 },
  { eco: 'A00', name: 'Ware Opening', moves: '1.a4', category: 'irregular', description: 'Unusual first move', valueBonus: 8 },
  { eco: 'A00', name: 'Polish Opening', moves: '1.b4', category: 'irregular', description: 'The Sokolsky, flank attack', valueBonus: 10 },
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
    .replace(/=.+$/, '')
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
  const chess = new Chess();
  const playedMoves: string[] = [];
  
  for (const move of moves.slice(0, 25)) {
    try {
      chess.move(move);
      playedMoves.push(move);
    } catch {
      break;
    }
  }
  
  if (playedMoves.length === 0) return undefined;
  
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
    marketingDescription: bestMatch.marketingDescription,
    famousPlayers: bestMatch.famousPlayers,
    historicalSignificance: bestMatch.historicalSignificance,
    valueBonus: bestMatch.valueBonus,
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

/**
 * Get opening categories for filtering
 */
export function getOpeningCategories(): string[] {
  const categories = new Set(OPENINGS_DATABASE.map(o => o.category));
  return Array.from(categories);
}

/**
 * Calculate opening value bonus percentage
 */
export function getOpeningValueBonus(opening: DetectedOpening | undefined): number {
  if (!opening) return 0;
  return opening.valueBonus || 5; // Default 5% for any recognized opening
}
