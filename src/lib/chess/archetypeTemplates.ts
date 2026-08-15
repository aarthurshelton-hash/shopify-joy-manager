// Archetype Auto-Template System
// Maps detected strategic archetypes → palette templates + poetry feel.
// Every classification event is persisted (evolution_state + game_data on save)
// so the archetype ↔ colour-wheel pairing data accumulates over time.

import type { SimulationResult } from '@/lib/chess/gameSimulator';
import { extractColorFlowSignature } from '@/lib/chess/colorFlowAnalysis/signatureExtractor';
import { ColorFlowSignature, StrategicArchetype } from '@/lib/chess/colorFlowAnalysis/types';
import { ARCHETYPE_DEFINITIONS } from '@/lib/chess/colorFlowAnalysis/archetypeDefinitions';
import { PaletteId, getActivePalette } from '@/lib/chess/pieceColors';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface ArchetypeTemplate {
  /** Base archetype family this template belongs to */
  family: StrategicArchetype;
  /** Palette that matches the feel of this archetype */
  paletteId: PaletteId;
  /** One-word mood used for subtle UI labeling */
  mood: string;
  /** Poetry style matching gamePoetry.ts conventions */
  poetryStyle: 'haiku' | 'couplet' | 'quatrain' | 'free verse' | 'epigram';
  /** Deterministic poem seeds — one is chosen by game hash */
  poemSeeds: string[];
}

// Base archetype → template. Enhanced archetypes resolve to a family below.
export const ARCHETYPE_TEMPLATES: Record<string, ArchetypeTemplate> = {
  kingside_attack: {
    family: 'kingside_attack',
    paletteId: 'hotCold',
    mood: 'Blazing',
    poetryStyle: 'haiku',
    poemSeeds: [
      "Fire gathers eastward—\nThe king's shelter splinters slow.\nWarm colors converge.",
      "Storm on the h-file,\nEvery piece leans toward one square—\nThe monarch's last light.",
    ],
  },
  queenside_expansion: {
    family: 'queenside_expansion',
    paletteId: 'nordic',
    mood: 'Expansive',
    poetryStyle: 'couplet',
    poemSeeds: [
      "Westward the colors slowly claim their ground—\nA quiet empire grows without a sound.",
      "File by file the wing unfolds its plan,\nSpace taken gently, as the game began.",
    ],
  },
  central_domination: {
    family: 'central_domination',
    paletteId: 'roman',
    mood: 'Imperial',
    poetryStyle: 'quatrain',
    poemSeeds: [
      "Four squares of marble hold the whole affair,\nEach piece a column raised upon the field.\nThe center taken is the crown declared.",
      "All roads converge where d and e collide—\nThe legions mass, the flanks have nowhere left to hide.",
    ],
  },
  prophylactic_defense: {
    family: 'prophylactic_defense',
    paletteId: 'medieval',
    mood: 'Fortified',
    poetryStyle: 'epigram',
    poemSeeds: [
      "The strongest move prevents the move unplayed.",
      "Walls answer questions that were never asked.",
    ],
  },
  pawn_storm: {
    family: 'pawn_storm',
    paletteId: 'autumn',
    mood: 'Advancing',
    poetryStyle: 'haiku',
    poemSeeds: [
      "Small soldiers marching—\nA single color trailing\nToward the final rank.",
      "Leaves driven by wind,\nThe pawn chain climbs one square each—\nAutumn takes the board.",
    ],
  },
  piece_harmony: {
    family: 'piece_harmony',
    paletteId: 'japanese',
    mood: 'Harmonious',
    poetryStyle: 'haiku',
    poemSeeds: [
      "Colors layer soft—\nEach piece defends another.\nThe board breathes as one.",
      "No square stands alone,\nKnight and bishop share their light—\nQuiet symmetry.",
    ],
  },
  opposite_castling: {
    family: 'opposite_castling',
    paletteId: 'cyberpunk',
    mood: 'Electric',
    poetryStyle: 'couplet',
    poemSeeds: [
      "Two storms race down opposing wings of night—\nWhoever lands the first blow owns the light.",
      "Split territories, neon against flame,\nA race where hesitation loses the game.",
    ],
  },
  closed_maneuvering: {
    family: 'closed_maneuvering',
    paletteId: 'vintage',
    mood: 'Patient',
    poetryStyle: 'epigram',
    poemSeeds: [
      "Behind closed pawns, the knights rehearse their patience.",
      "Slow colors shift like furniture in an old house.",
    ],
  },
  open_tactical: {
    family: 'open_tactical',
    paletteId: 'tropical',
    mood: 'Wild',
    poetryStyle: 'free verse',
    poemSeeds: [
      "Pieces fly off the board like sparks—\nEvery exchange a small explosion,\nThe position refuses to sit still.",
      "Open lines, open wounds,\nCalculation is the only shelter here.",
    ],
  },
  endgame_technique: {
    family: 'endgame_technique',
    paletteId: 'desert',
    mood: 'Sparse',
    poetryStyle: 'haiku',
    poemSeeds: [
      "Few colors remain—\nKing and pawn cross empty sand.\nPrecision is all.",
      "The board grows quiet,\nEach step measured twice, then made—\nTechnique becomes art.",
    ],
  },
  sacrificial_attack: {
    family: 'sacrificial_attack',
    paletteId: 'egyptian',
    mood: 'Ritual',
    poetryStyle: 'quatrain',
    poemSeeds: [
      "Material offered on the altar's flame,\nThe queen departs so that the file may open.\nInitiative is worth more than its name.",
      "What is given is not lost but spent—\nEach sacrifice a golden monument.",
    ],
  },
  positional_squeeze: {
    family: 'positional_squeeze',
    paletteId: 'ocean',
    mood: 'Tidal',
    poetryStyle: 'couplet',
    poemSeeds: [
      "The tide comes in one square at a time—\nUntil the shore has nowhere left to climb.",
      "No blow is struck, yet breathing room grows thin,\nThe slow blue water always finds its way in.",
    ],
  },
  unknown: {
    family: 'unknown',
    paletteId: 'modern',
    mood: 'Uncharted',
    poetryStyle: 'epigram',
    poemSeeds: [
      "A pattern the archive has not yet named.",
      "New shapes on old squares—the collection grows.",
    ],
  },
};

// Keyword routing for enhanced/v3 archetypes → base family templates
const FAMILY_KEYWORDS: Array<[RegExp, StrategicArchetype]> = [
  [/king_hunt|kingside/, 'kingside_attack'],
  [/queenside/, 'queenside_expansion'],
  [/central|center/, 'central_domination'],
  [/prophylactic|fortress|defense|defensive/, 'prophylactic_defense'],
  [/pawn_storm|passed_pawn|pawn/, 'pawn_storm'],
  [/harmony|coordination|development/, 'piece_harmony'],
  [/opposite|castling/, 'opposite_castling'],
  [/closed|maneuv/, 'closed_maneuvering'],
  [/tactical|complexity|blitz|charge|battery/, 'open_tactical'],
  [/endgame/, 'endgame_technique'],
  [/sacrific/, 'sacrificial_attack'],
  [/squeeze|bind|restriction/, 'positional_squeeze'],
];

/** Resolve any archetype (base, enhanced, or v3) to its template. */
export function resolveArchetypeTemplate(archetype: StrategicArchetype): ArchetypeTemplate {
  if (ARCHETYPE_TEMPLATES[archetype]) return ARCHETYPE_TEMPLATES[archetype];
  for (const [pattern, family] of FAMILY_KEYWORDS) {
    if (pattern.test(archetype)) return ARCHETYPE_TEMPLATES[family];
  }
  return ARCHETYPE_TEMPLATES.unknown;
}

export interface GameArchetypeClassification {
  archetype: StrategicArchetype;
  archetypeName: string;
  template: ArchetypeTemplate;
  intensity: number;
  fingerprint: string;
  quadrantProfile: ColorFlowSignature['quadrantProfile'];
  signature: ColorFlowSignature;
}

/** Classify a simulated game into its strategic archetype. Returns null for positions/tiny games. */
export function classifyGameArchetype(simulation: SimulationResult): GameArchetypeClassification | null {
  if (!simulation?.board || (simulation.totalMoves ?? 0) < 6) return null;
  try {
    const signature = extractColorFlowSignature(simulation.board, simulation.gameData, simulation.totalMoves);
    const template = resolveArchetypeTemplate(signature.archetype);
    const def = ARCHETYPE_DEFINITIONS[template.family] || ARCHETYPE_DEFINITIONS.unknown;
    return {
      archetype: signature.archetype,
      archetypeName: def.name,
      template,
      intensity: signature.intensity,
      fingerprint: signature.fingerprint,
      quadrantProfile: signature.quadrantProfile,
      signature,
    };
  } catch (e) {
    console.warn('[ArchetypeTemplate] Classification failed:', e);
    return null;
  }
}

/** Deterministic string hash (no randomness — same game always maps to same poem). */
function stableHash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

export interface ArchetypePoetry {
  poem: string;
  style: ArchetypeTemplate['poetryStyle'];
  mood: string;
  archetypeName: string;
}

/** Generate deterministic archetype-toned poetry for any game (fills the gap for non-famous games). */
export function generateArchetypePoetry(
  classification: GameArchetypeClassification,
  pgn: string
): ArchetypePoetry {
  const { template, archetypeName } = classification;
  const idx = stableHash(pgn || classification.fingerprint) % template.poemSeeds.length;
  return {
    poem: template.poemSeeds[idx],
    style: template.poetryStyle,
    mood: template.mood,
    archetypeName,
  };
}

const MANUAL_PALETTE_KEY = 'ep-palette-manual-choice';

/** Record that the user manually chose a palette — auto template will not override it. */
export function markManualPaletteChoice(paletteId: PaletteId): void {
  try {
    localStorage.setItem(MANUAL_PALETTE_KEY, paletteId);
  } catch { /* storage unavailable */ }
}

export function getManualPaletteChoice(): PaletteId | null {
  try {
    return (localStorage.getItem(MANUAL_PALETTE_KEY) as PaletteId) || null;
  } catch {
    return null;
  }
}

/** Build the colour-wheel snapshot embedded in game_data and logged to evolution_state. */
export function buildColorWheelSnapshot(classification: GameArchetypeClassification | null) {
  const palette = getActivePalette();
  return {
    paletteId: palette.id,
    paletteName: palette.name,
    white: { ...palette.white },
    black: { ...palette.black },
    archetype: classification?.archetype ?? null,
    archetypeName: classification?.archetypeName ?? null,
    archetypeFamily: classification?.template.family ?? null,
    templatePaletteId: classification?.template.paletteId ?? null,
    mood: classification?.template.mood ?? null,
    intensity: classification?.intensity ?? null,
    fingerprint: classification?.fingerprint ?? null,
    quadrantProfile: (classification?.quadrantProfile ?? null) as unknown as Json,
  };
}

/**
 * Persist an archetype ↔ colour-wheel event so no sorting data is ever lost,
 * even when the user never saves the visualization.
 * Stored in evolution_state (state_type: 'archetype_color_wheel').
 */
export async function logArchetypeColorWheelEvent(params: {
  classification: GameArchetypeClassification;
  gameHash: string;
  autoApplied: boolean;
  manualPaletteId: PaletteId | null;
  gameTitle?: string;
}): Promise<void> {
  try {
    const { classification, gameHash, autoApplied, manualPaletteId, gameTitle } = params;
    const genes = {
      version: 1,
      game_hash: gameHash,
      game_title: gameTitle || null,
      auto_applied: autoApplied,
      manual_palette_id: manualPaletteId,
      color_wheel: buildColorWheelSnapshot(classification),
      recorded_at: new Date().toISOString(),
    } as unknown as Json;

    const { error } = await supabase.from('evolution_state').insert({
      state_type: 'archetype_color_wheel',
      genes,
      fitness_score: classification.intensity > 0 ? classification.intensity / 100 : 0.01,
    });
    if (error) console.warn('[ArchetypeTemplate] Log insert warning:', error.message);
  } catch (e) {
    console.warn('[ArchetypeTemplate] Failed to log color wheel event:', e);
  }
}
