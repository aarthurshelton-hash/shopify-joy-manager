/**
 * Chess Domain Actionable Maps
 * Chess archetype → specific strategic actions
 */

import type { ActionMapEntry } from './types';

export const CHESS_ACTIONABLE_MAP: Record<string, ActionMapEntry> = {
  aggressive_attacker: {
    action: 'Look for forcing moves: checks, captures, and threats. Prioritize king-side attack.',
    expectedOutcome: 'Create immediate pressure leading to material or positional advantage',
    timeframe: 'Next 3-5 moves',
  },
  positional_strategist: {
    action: 'Control key squares (d4/d5/e4/e5). Improve worst-placed piece. Avoid premature attacks.',
    expectedOutcome: 'Gradual space advantage and piece coordination',
    timeframe: 'Next 8-15 moves',
  },
  tactical_opportunist: {
    action: 'Calculate all captures and checks. Look for hanging pieces and tactical patterns.',
    expectedOutcome: 'Material gain or winning attack',
    timeframe: 'Next 2-4 moves',
  },
  queenside_expansion: {
    action: 'Push queenside pawns (a4, b4, c4/c5). Open the a and b files. Target enemy queenside weaknesses.',
    expectedOutcome: 'Create passed pawn or win queenside material',
    timeframe: 'Next 10-20 moves',
  },
  pawn_storm: {
    action: 'Advance pawns toward enemy king. Create hooks (h4-h5-h6 or similar). Open lines.',
    expectedOutcome: 'Breach enemy king safety',
    timeframe: 'Next 5-10 moves',
  },
  central_domination: {
    action: 'Occupy e4/d4 (or e5/d5) with pieces. Control central files with rooks.',
    expectedOutcome: 'Piece mobility advantage, easier defense',
    timeframe: 'Next 5-8 moves',
  },
  flank_attack: {
    action: 'Attack on the wing opposite to where opponent is castled. Use fianchetto bishops.',
    expectedOutcome: 'Catch opponent off-guard, create asymmetric pressure',
    timeframe: 'Next 8-12 moves',
  },
  closed_maneuvering: {
    action: 'Improve piece placement without opening the position. Wait for opponent errors.',
    expectedOutcome: 'Slow squeeze, eventual breakthrough',
    timeframe: 'Next 15-25 moves',
  },
  defensive_fortress: {
    action: 'Consolidate king safety. Exchange attacking pieces. Create impenetrable structure.',
    expectedOutcome: 'Draw or slow counterattack',
    timeframe: 'Endgame transition',
  },
  endgame_technique: {
    action: 'Activate king. Create passed pawns. Calculate precisely - every tempo matters.',
    expectedOutcome: 'Convert advantage or hold draw',
    timeframe: 'Final 10-30 moves',
  },
};
