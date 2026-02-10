/**
 * Market Prediction Audit Trail
 * 
 * Logs every market prediction to Supabase with the same rigor as chess predictions.
 * Mirrors the chess_prediction_attempts pattern for 4th domain proof.
 * 
 * Flow: prediction → log → resolve → accuracy
 * 
 * RULES:
 * - All data must be REAL (Yahoo Finance, no simulation fallback)
 * - Every prediction traceable to source data
 * - SHA-256 signature hashes for deduplication
 * - Outcomes resolved against real price data only
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { StockPrediction } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface MarketPredictionRecord {
  symbol: string;
  time_horizon: string;
  prediction_source: string;
  predicted_direction: string;
  confidence: number;
  archetype: string | null;
  signature_hash: string | null;
  target_move: number | null;
  price_at_prediction: number;
  volume_at_prediction: number | null;
  baseline_direction: string | null;
  baseline_confidence: number | null;
  chess_archetype_resonance: string | null;
  cross_domain_confidence: number | null;
  data_source: string;
  candle_count: number | null;
  prediction_metadata: Json | null;
}

export interface PredictionResolution {
  id: string;
  price_at_resolution: number;
  actual_direction: string;
  actual_move: number;
  ep_correct: boolean;
  baseline_correct: boolean;
}

export interface MarketAccuracyStats {
  total_predictions: number;
  resolved_predictions: number;
  ep_correct: number;
  ep_accuracy: number;
  baseline_correct: number;
  baseline_accuracy: number;
  improvement_pp: number;
  by_archetype: Record<string, { total: number; correct: number; accuracy: number }>;
  by_symbol: Record<string, { total: number; correct: number; accuracy: number }>;
  by_time_horizon: Record<string, { total: number; correct: number; accuracy: number }>;
}

// ============================================================================
// SIGNATURE HASHING
// ============================================================================

async function hashSignature(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// LOG PREDICTION
// ============================================================================

/**
 * Log a market prediction to the audit trail.
 * Returns the prediction ID for later resolution.
 */
export async function logMarketPrediction(
  prediction: StockPrediction,
  options: {
    baselineDirection?: string;
    baselineConfidence?: number;
    chessArchetypeResonance?: string;
    crossDomainConfidence?: number;
    volume?: number;
    candleCount?: number;
    source?: string;
  } = {}
): Promise<string | null> {
  try {
    const signatureData = `${prediction.symbol}|${prediction.archetype}|${prediction.signature}|${prediction.timestamp}`;
    const signatureHash = await hashSignature(signatureData);

    const record: MarketPredictionRecord = {
      symbol: prediction.symbol,
      time_horizon: prediction.prediction.timeHorizon,
      prediction_source: options.source || 'ep_finance_engine',
      predicted_direction: prediction.prediction.direction,
      confidence: prediction.prediction.confidence,
      archetype: prediction.archetype || null,
      signature_hash: signatureHash,
      target_move: prediction.prediction.targetMove || null,
      price_at_prediction: prediction.priceAtPrediction,
      volume_at_prediction: options.volume || null,
      baseline_direction: options.baselineDirection || null,
      baseline_confidence: options.baselineConfidence || null,
      chess_archetype_resonance: options.chessArchetypeResonance || null,
      cross_domain_confidence: options.crossDomainConfidence || null,
      data_source: 'yahoo_finance',
      candle_count: options.candleCount || null,
      prediction_metadata: {
        archetype: prediction.archetype,
        fingerprint: prediction.signature,
        engine_timestamp: prediction.timestamp,
      } as Json,
    };

    const { data, error } = await supabase
      .from('market_prediction_attempts')
      .insert(record)
      .select('id')
      .single();

    if (error) {
      // Dedup conflict is expected — not an error
      if (error.code === '23505') {
        console.log(`[MarketAudit] Dedup: ${prediction.symbol} ${prediction.prediction.timeHorizon} already logged this minute`);
        return null;
      }
      console.error('[MarketAudit] Log error:', error.message);
      return null;
    }

    console.log(`[MarketAudit] Logged: ${prediction.symbol} ${prediction.prediction.direction} (${prediction.prediction.confidence}%) → id=${data.id}`);
    return data.id;
  } catch (err) {
    console.error('[MarketAudit] Unexpected error:', err);
    return null;
  }
}

// ============================================================================
// RESOLVE PREDICTION
// ============================================================================

/**
 * Resolve a prediction by checking the actual price after the time horizon.
 * Direction threshold: >0.5% = bullish, <-0.5% = bearish, else neutral.
 */
export async function resolveMarketPrediction(
  predictionId: string,
  currentPrice: number
): Promise<PredictionResolution | null> {
  try {
    // Fetch the original prediction
    const { data: prediction, error: fetchError } = await supabase
      .from('market_prediction_attempts')
      .select('*')
      .eq('id', predictionId)
      .is('resolved_at', null)
      .single();

    if (fetchError || !prediction) {
      return null;
    }

    const priceChange = (currentPrice - prediction.price_at_prediction) / prediction.price_at_prediction;
    const actualMove = Math.abs(priceChange * 100);

    let actualDirection: string;
    if (priceChange > 0.005) {
      actualDirection = 'bullish';
    } else if (priceChange < -0.005) {
      actualDirection = 'bearish';
    } else {
      actualDirection = 'neutral';
    }

    const epCorrect = prediction.predicted_direction === actualDirection;
    const baselineCorrect = prediction.baseline_direction
      ? prediction.baseline_direction === actualDirection
      : false;

    const resolution: PredictionResolution = {
      id: predictionId,
      price_at_resolution: currentPrice,
      actual_direction: actualDirection,
      actual_move: Math.round(actualMove * 100) / 100,
      ep_correct: epCorrect,
      baseline_correct: baselineCorrect,
    };

    const { error: updateError } = await supabase
      .from('market_prediction_attempts')
      .update({
        resolved_at: new Date().toISOString(),
        price_at_resolution: currentPrice,
        actual_direction: actualDirection,
        actual_move: resolution.actual_move,
        ep_correct: epCorrect,
        baseline_correct: baselineCorrect,
      })
      .eq('id', predictionId);

    if (updateError) {
      console.error('[MarketAudit] Resolve error:', updateError.message);
      return null;
    }

    console.log(`[MarketAudit] Resolved: ${prediction.symbol} predicted=${prediction.predicted_direction} actual=${actualDirection} correct=${epCorrect}`);
    return resolution;
  } catch (err) {
    console.error('[MarketAudit] Resolve unexpected error:', err);
    return null;
  }
}

/**
 * Batch-resolve all unresolved predictions older than their time horizon.
 * Requires a price lookup function that returns current price for a symbol.
 */
export async function resolveExpiredPredictions(
  priceLookup: (symbol: string) => Promise<number | null>
): Promise<{ resolved: number; errors: number }> {
  const horizonMs: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
  };

  let resolved = 0;
  let errors = 0;

  // Fetch unresolved predictions
  const { data: unresolved, error } = await supabase
    .from('market_prediction_attempts')
    .select('id, symbol, time_horizon, created_at')
    .is('resolved_at', null)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error || !unresolved) {
    console.error('[MarketAudit] Fetch unresolved error:', error?.message);
    return { resolved: 0, errors: 1 };
  }

  const now = Date.now();

  for (const pred of unresolved) {
    const createdAt = new Date(pred.created_at).getTime();
    const horizon = horizonMs[pred.time_horizon] || horizonMs['1d'];

    // Only resolve if past the time horizon
    if (now - createdAt < horizon) continue;

    const price = await priceLookup(pred.symbol);
    if (price === null) {
      errors++;
      continue;
    }

    const result = await resolveMarketPrediction(pred.id, price);
    if (result) {
      resolved++;
    } else {
      errors++;
    }
  }

  if (resolved > 0) {
    console.log(`[MarketAudit] Batch resolved: ${resolved} predictions, ${errors} errors`);
  }

  return { resolved, errors };
}

// ============================================================================
// ACCURACY STATS
// ============================================================================

/**
 * Get comprehensive accuracy statistics from the audit trail.
 * All numbers from real DB data — no estimates.
 */
export async function getMarketAccuracyStats(): Promise<MarketAccuracyStats | null> {
  try {
    // Get all resolved predictions
    const { data: predictions, error } = await supabase
      .from('market_prediction_attempts')
      .select('symbol, time_horizon, archetype, predicted_direction, ep_correct, baseline_correct')
      .not('resolved_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10000);

    if (error || !predictions) {
      console.error('[MarketAudit] Stats error:', error?.message);
      return null;
    }

    // Get total count (including unresolved)
    const { count: totalCount } = await supabase
      .from('market_prediction_attempts')
      .select('id', { count: 'exact', head: true });

    const resolved = predictions.length;
    const epCorrectCount = predictions.filter(p => p.ep_correct === true).length;
    const baselineCorrectCount = predictions.filter(p => p.baseline_correct === true).length;

    const epAccuracy = resolved > 0 ? (epCorrectCount / resolved) * 100 : 0;
    const baselineAccuracy = resolved > 0 ? (baselineCorrectCount / resolved) * 100 : 0;

    // Breakdown by archetype
    const byArchetype: MarketAccuracyStats['by_archetype'] = {};
    for (const p of predictions) {
      const key = p.archetype || 'unknown';
      if (!byArchetype[key]) byArchetype[key] = { total: 0, correct: 0, accuracy: 0 };
      byArchetype[key].total++;
      if (p.ep_correct) byArchetype[key].correct++;
    }
    for (const key of Object.keys(byArchetype)) {
      byArchetype[key].accuracy = byArchetype[key].total > 0
        ? Math.round((byArchetype[key].correct / byArchetype[key].total) * 1000) / 10
        : 0;
    }

    // Breakdown by symbol
    const bySymbol: MarketAccuracyStats['by_symbol'] = {};
    for (const p of predictions) {
      const key = p.symbol;
      if (!bySymbol[key]) bySymbol[key] = { total: 0, correct: 0, accuracy: 0 };
      bySymbol[key].total++;
      if (p.ep_correct) bySymbol[key].correct++;
    }
    for (const key of Object.keys(bySymbol)) {
      bySymbol[key].accuracy = bySymbol[key].total > 0
        ? Math.round((bySymbol[key].correct / bySymbol[key].total) * 1000) / 10
        : 0;
    }

    // Breakdown by time horizon
    const byTimeHorizon: MarketAccuracyStats['by_time_horizon'] = {};
    for (const p of predictions) {
      const key = p.time_horizon;
      if (!byTimeHorizon[key]) byTimeHorizon[key] = { total: 0, correct: 0, accuracy: 0 };
      byTimeHorizon[key].total++;
      if (p.ep_correct) byTimeHorizon[key].correct++;
    }
    for (const key of Object.keys(byTimeHorizon)) {
      byTimeHorizon[key].accuracy = byTimeHorizon[key].total > 0
        ? Math.round((byTimeHorizon[key].correct / byTimeHorizon[key].total) * 1000) / 10
        : 0;
    }

    return {
      total_predictions: totalCount || 0,
      resolved_predictions: resolved,
      ep_correct: epCorrectCount,
      ep_accuracy: Math.round(epAccuracy * 10) / 10,
      baseline_correct: baselineCorrectCount,
      baseline_accuracy: Math.round(baselineAccuracy * 10) / 10,
      improvement_pp: Math.round((epAccuracy - baselineAccuracy) * 10) / 10,
      by_archetype: byArchetype,
      by_symbol: bySymbol,
      by_time_horizon: byTimeHorizon,
    };
  } catch (err) {
    console.error('[MarketAudit] Stats unexpected error:', err);
    return null;
  }
}
