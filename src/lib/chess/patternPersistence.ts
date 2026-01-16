/**
 * Pattern Persistence Layer
 * 
 * Handles saving and loading Color Flow patterns to/from Supabase
 * for cross-user pattern learning and trajectory prediction.
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  ColorFlowSignature, 
  StrategicArchetype,
  extractColorFlowSignature 
} from './colorFlowAnalysis';
import { GameData, simulateGame } from './gameSimulator';
import { generateGameHash } from '@/lib/visualizations/gameCanonical';

export interface PersistedPattern {
  id: string;
  fingerprint: string;
  archetype: StrategicArchetype;
  outcome: 'white_wins' | 'black_wins' | 'draw';
  total_moves: number;
  characteristics: PatternCharacteristics;
  opening_eco?: string;
  game_metadata?: GameMetadata;
  pgn_hash?: string;
  created_at: string;
  created_by?: string;
}

interface PatternCharacteristics {
  flowDirection: string;
  intensity: number;
  volatility: number;
  dominantSide: string;
  centerControl: number;
  kingsideActivity: number;
  queensideActivity: number;
}

interface GameMetadata {
  event?: string;
  white?: string;
  black?: string;
  date?: string;
}

/**
 * Save a pattern to the database
 */
export async function savePattern(
  signature: ColorFlowSignature,
  outcome: 'white_wins' | 'black_wins' | 'draw',
  gameData: GameData,
  totalMoves: number,
  pgnHash?: string
): Promise<{ success: boolean; patternId?: string; error?: string }> {
  try {
    const characteristics: PatternCharacteristics = {
      flowDirection: signature.flowDirection,
      intensity: signature.intensity,
      volatility: signature.temporalFlow.volatility,
      dominantSide: signature.dominantSide,
      centerControl: signature.quadrantProfile.center,
      kingsideActivity: (signature.quadrantProfile.kingsideWhite + signature.quadrantProfile.kingsideBlack) / 2,
      queensideActivity: (signature.quadrantProfile.queensideWhite + signature.quadrantProfile.queensideBlack) / 2,
    };

    const gameMetadata: GameMetadata = {
      event: gameData.event,
      white: gameData.white,
      black: gameData.black,
      date: gameData.date,
    };

    const { data, error } = await supabase
      .from('color_flow_patterns')
      .insert([{
        fingerprint: signature.fingerprint,
        archetype: signature.archetype as string,
        outcome: outcome as string,
        total_moves: totalMoves,
        characteristics: JSON.parse(JSON.stringify(characteristics)),
        game_metadata: JSON.parse(JSON.stringify(gameMetadata)),
        pgn_hash: pgnHash,
      }])
      .select('id')
      .single();

    if (error) {
      console.error('Error saving pattern:', error);
      return { success: false, error: error.message };
    }

    return { success: true, patternId: data.id };
  } catch (err) {
    console.error('Pattern save error:', err);
    return { success: false, error: 'Failed to save pattern' };
  }
}

/**
 * Find similar patterns in the database
 */
export async function findSimilarPatterns(
  signature: ColorFlowSignature,
  limit: number = 10
): Promise<PersistedPattern[]> {
  try {
    // First, fetch patterns with the same archetype
    const { data: sameArchetype, error: archetypeError } = await supabase
      .from('color_flow_patterns')
      .select('*')
      .eq('archetype', signature.archetype)
      .limit(limit);

    if (archetypeError) {
      console.error('Error fetching patterns:', archetypeError);
      return [];
    }

    // Also fetch patterns with related archetypes
    const relatedArchetypes = getRelatedArchetypes(signature.archetype);
    let relatedPatterns: PersistedPattern[] = [];

    if (relatedArchetypes.length > 0) {
      const { data: related, error: relatedError } = await supabase
        .from('color_flow_patterns')
        .select('*')
        .in('archetype', relatedArchetypes)
        .limit(Math.floor(limit / 2));

      if (!relatedError && related) {
        relatedPatterns = related.map(row => ({
          ...row,
          characteristics: row.characteristics as unknown as PatternCharacteristics,
          game_metadata: row.game_metadata as unknown as GameMetadata,
          archetype: row.archetype as StrategicArchetype,
          outcome: row.outcome as 'white_wins' | 'black_wins' | 'draw',
        })) as PersistedPattern[];
      }
    }

    // Combine and deduplicate
    const sameArchetypeTyped = (sameArchetype || []).map(row => ({
      ...row,
      characteristics: row.characteristics as unknown as PatternCharacteristics,
      game_metadata: row.game_metadata as unknown as GameMetadata,
      archetype: row.archetype as StrategicArchetype,
      outcome: row.outcome as 'white_wins' | 'black_wins' | 'draw',
    })) as PersistedPattern[];
    
    const allPatterns = [...sameArchetypeTyped, ...relatedPatterns];
    const uniquePatterns = allPatterns.filter(
      (pattern, index, self) => self.findIndex(p => p.id === pattern.id) === index
    );

    // Sort by similarity (calculated client-side for now)
    const scored = uniquePatterns.map(pattern => ({
      pattern,
      similarity: calculateSimilarity(signature, pattern.characteristics),
    }));

    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, limit).map(s => s.pattern);
  } catch (err) {
    console.error('Pattern search error:', err);
    return [];
  }
}

/**
 * Load all patterns for local caching
 */
export async function loadPatternBatch(
  archetype?: StrategicArchetype,
  limit: number = 100
): Promise<PersistedPattern[]> {
  try {
    let query = supabase
      .from('color_flow_patterns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (archetype) {
      query = query.eq('archetype', archetype);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading patterns:', error);
      return [];
    }

    return (data || []).map(row => ({
      ...row,
      characteristics: row.characteristics as unknown as PatternCharacteristics,
      game_metadata: row.game_metadata as unknown as GameMetadata,
      archetype: row.archetype as StrategicArchetype,
      outcome: row.outcome as 'white_wins' | 'black_wins' | 'draw',
    })) as PersistedPattern[];
  } catch (err) {
    console.error('Pattern load error:', err);
    return [];
  }
}

/**
 * Learn from a completed game and persist the pattern
 */
export async function learnAndPersistPattern(
  pgn: string,
  outcome: 'white_wins' | 'black_wins' | 'draw'
): Promise<{ success: boolean; patternId?: string; error?: string }> {
  try {
    // Generate hash to avoid duplicates
    const pgnHash = generateGameHash(pgn);

    // Check if pattern already exists for this game
    const { data: existing } = await supabase
      .from('color_flow_patterns')
      .select('id')
      .eq('pgn_hash', pgnHash)
      .single();

    if (existing) {
      return { success: true, patternId: existing.id };
    }

    // Simulate the game and extract signature
    const simulation = simulateGame(pgn);
    const signature = extractColorFlowSignature(
      simulation.board,
      simulation.gameData,
      simulation.totalMoves
    );

    // Save to database
    return await savePattern(
      signature,
      outcome,
      simulation.gameData,
      simulation.totalMoves,
      pgnHash
    );
  } catch (err) {
    console.error('Learn and persist error:', err);
    return { success: false, error: 'Failed to learn pattern' };
  }
}

/**
 * Get pattern database statistics
 */
export async function getPatternStats(): Promise<{
  totalPatterns: number;
  byArchetype: Record<string, number>;
  byOutcome: Record<string, number>;
}> {
  try {
    const { count: total } = await supabase
      .from('color_flow_patterns')
      .select('*', { count: 'exact', head: true });

    const { data: archetypeCounts } = await supabase
      .from('color_flow_patterns')
      .select('archetype');

    const { data: outcomeCounts } = await supabase
      .from('color_flow_patterns')
      .select('outcome');

    const byArchetype: Record<string, number> = {};
    const byOutcome: Record<string, number> = {};

    archetypeCounts?.forEach(row => {
      byArchetype[row.archetype] = (byArchetype[row.archetype] || 0) + 1;
    });

    outcomeCounts?.forEach(row => {
      byOutcome[row.outcome] = (byOutcome[row.outcome] || 0) + 1;
    });

    return {
      totalPatterns: total || 0,
      byArchetype,
      byOutcome,
    };
  } catch (err) {
    console.error('Stats error:', err);
    return { totalPatterns: 0, byArchetype: {}, byOutcome: {} };
  }
}

// Helper functions

function getRelatedArchetypes(archetype: StrategicArchetype): StrategicArchetype[] {
  const relations: Record<StrategicArchetype, StrategicArchetype[]> = {
    kingside_attack: ['sacrificial_attack', 'open_tactical'],
    queenside_expansion: ['positional_squeeze', 'closed_maneuvering'],
    central_domination: ['piece_harmony', 'positional_squeeze'],
    prophylactic_defense: ['closed_maneuvering', 'endgame_technique'],
    pawn_storm: ['kingside_attack', 'opposite_castling'],
    piece_harmony: ['central_domination', 'positional_squeeze'],
    opposite_castling: ['kingside_attack', 'pawn_storm'],
    closed_maneuvering: ['prophylactic_defense', 'positional_squeeze'],
    open_tactical: ['sacrificial_attack', 'kingside_attack'],
    endgame_technique: ['prophylactic_defense', 'positional_squeeze'],
    sacrificial_attack: ['open_tactical', 'kingside_attack'],
    positional_squeeze: ['central_domination', 'closed_maneuvering'],
    unknown: [],
  };
  return relations[archetype] || [];
}

function calculateSimilarity(
  signature: ColorFlowSignature,
  characteristics: PatternCharacteristics
): number {
  let score = 0;

  // Flow direction match (25 points)
  if (signature.flowDirection === characteristics.flowDirection) {
    score += 25;
  } else if (areFlowsRelated(signature.flowDirection, characteristics.flowDirection)) {
    score += 12;
  }

  // Intensity similarity (20 points)
  const intensityDiff = Math.abs(signature.intensity - characteristics.intensity);
  score += Math.max(0, 20 - intensityDiff / 2);

  // Volatility similarity (15 points)
  const volatilityDiff = Math.abs(signature.temporalFlow.volatility - characteristics.volatility);
  score += Math.max(0, 15 - volatilityDiff / 3);

  // Dominant side match (20 points)
  if (signature.dominantSide === characteristics.dominantSide) {
    score += 20;
  } else if (signature.dominantSide === 'contested' || characteristics.dominantSide === 'contested') {
    score += 10;
  }

  // Center control similarity (10 points)
  const centerDiff = Math.abs(signature.quadrantProfile.center - characteristics.centerControl);
  score += Math.max(0, 10 - centerDiff / 5);

  // Side activity similarity (10 points)
  const kingsideActivity = (signature.quadrantProfile.kingsideWhite + signature.quadrantProfile.kingsideBlack) / 2;
  const kingsideDiff = Math.abs(kingsideActivity - characteristics.kingsideActivity);
  score += Math.max(0, 5 - kingsideDiff / 10);

  const queensideActivity = (signature.quadrantProfile.queensideWhite + signature.quadrantProfile.queensideBlack) / 2;
  const queensideDiff = Math.abs(queensideActivity - characteristics.queensideActivity);
  score += Math.max(0, 5 - queensideDiff / 10);

  return Math.round(score);
}

function areFlowsRelated(a: string, b: string): boolean {
  const related: Record<string, string[]> = {
    kingside: ['central', 'diagonal'],
    queenside: ['central', 'diagonal'],
    central: ['kingside', 'queenside', 'balanced'],
    balanced: ['central'],
    diagonal: ['kingside', 'queenside'],
  };
  return related[a]?.includes(b) || false;
}
