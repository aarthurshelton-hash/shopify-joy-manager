/**
 * Draw Outlook — "will this position resolve decisively?"
 *
 * Queries the prediction corpus for the historical outcome distribution
 * of positions sharing this archetype, optionally restricted to the
 * ambiguous 0-50cp eval zone (where raw engine evals say "equal" but
 * the trajectory still tells you how these games usually end).
 */

import { supabase } from '@/integrations/supabase/client';
import type { StrategicArchetype } from '../colorFlowAnalysis';
import { loadArchetypeStats, getArchetypePrediction } from '../accuracy/archetypeHistoricalRates';

export interface DrawOutlook {
  archetype: StrategicArchetype;
  /** Positions in the corpus sample. */
  sampleSize: number;
  /** 0-1 outcomes among corpus positions matching the filter. */
  whiteWinRate: number;
  blackWinRate: number;
  drawRate: number;
  /** 1 - drawRate — probability the position resolves to a winner. */
  decisiveRate: number;
  /** Whether stats came from the live corpus or baseline rates. */
  source: 'corpus' | 'corpus_eval_zone' | 'baseline';
  /** Eval-band the query was restricted to, if any. */
  evalZone: 'all' | '0-50cp';
}

const EPS = 1e-9;

function toOutlook(
  archetype: StrategicArchetype,
  white: number,
  black: number,
  draws: number,
  source: DrawOutlook['source'],
  evalZone: DrawOutlook['evalZone']
): DrawOutlook {
  const total = white + black + draws;
  if (total === 0) {
    return {
      archetype, sampleSize: 0,
      whiteWinRate: 0, blackWinRate: 0, drawRate: 0, decisiveRate: 0,
      source, evalZone,
    };
  }
  const drawRate = draws / total;
  return {
    archetype,
    sampleSize: total,
    whiteWinRate: white / total,
    blackWinRate: black / total,
    drawRate,
    decisiveRate: 1 - drawRate,
    source,
    evalZone,
  };
}

async function queryOutcomes(
  archetype: StrategicArchetype,
  evalZone: 'all' | '0-50cp',
  limit = 20000
): Promise<{ white: number; black: number; draws: number }> {
  let q = supabase
    .from('chess_prediction_attempts')
    .select('actual_result')
    .eq('hybrid_archetype', archetype)
    .not('actual_result', 'is', null)
    .limit(limit);

  if (evalZone === '0-50cp') {
    q = q.gte('stockfish_eval', -50).lte('stockfish_eval', 50);
  }

  const { data, error } = await q;
  if (error || !data) return { white: 0, black: 0, draws: 0 };

  let white = 0, black = 0, draws = 0;
  for (const row of data) {
    if (row.actual_result === 'white_wins') white++;
    else if (row.actual_result === 'black_wins') black++;
    else if (row.actual_result === 'draw') draws++;
  }
  return { white, black, draws };
}

/**
 * Get the draw/decisive outlook for a strategic archetype.
 *
 * Tries the 0-50cp corpus zone first (positions where the eval bar says
 * "equal"), falls back to all-eval corpus stats, then baseline rates.
 */
export async function fetchDrawOutlook(
  archetype: StrategicArchetype,
  dominantSide?: 'white' | 'black' | 'contested'
): Promise<DrawOutlook> {
  // 1. Corpus, restricted to ambiguous-eval zone
  try {
    const zoned = await queryOutcomes(archetype, '0-50cp');
    if (zoned.white + zoned.black + zoned.draws >= 50) {
      return toOutlook(archetype, zoned.white, zoned.black, zoned.draws, 'corpus_eval_zone', '0-50cp');
    }
  } catch {
    // fall through
  }

  // 2. Corpus, all evals
  try {
    const all = await queryOutcomes(archetype, 'all');
    if (all.white + all.black + all.draws >= 20) {
      return toOutlook(archetype, all.white, all.black, all.draws, 'corpus', 'all');
    }
  } catch {
    // fall through
  }

  // 3. Baseline rates (offline / no corpus access)
  try {
    await loadArchetypeStats();
  } catch {
    // ignore — defaults still work
  }
  const pred = getArchetypePrediction(archetype, dominantSide);
  return {
    archetype,
    sampleSize: 0,
    whiteWinRate: pred.probabilities.white + EPS,
    blackWinRate: pred.probabilities.black + EPS,
    drawRate: pred.probabilities.draw + EPS,
    decisiveRate: 1 - pred.probabilities.draw,
    source: 'baseline',
    evalZone: 'all',
  };
}
