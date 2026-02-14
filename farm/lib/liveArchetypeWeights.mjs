/**
 * Live Archetype Weight Loader
 * 
 * Queries chess_prediction_attempts to compute REAL per-archetype accuracy
 * from the database, replacing hardcoded ARCHETYPE_HISTORICAL_ACCURACY.
 * 
 * Runs periodically (every N cycles) and writes updated weights to disk.
 * The prediction engine reads these to calibrate confidence dynamically.
 * 
 * This is the chess equivalent of battery's learnedArchetypeWeights —
 * accuracy improves as volume grows because the weights reflect reality.
 */

import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WEIGHTS_PATH = join(__dirname, '..', 'data', 'live-archetype-weights.json');
const CALIBRATION_PATH = join(__dirname, '..', 'data', 'archetype-calibration.json');
const MIN_SAMPLE_SIZE = 30; // Need at least 30 predictions to trust an archetype's stats

/**
 * Query DB for real per-archetype accuracy stats.
 * Returns { archetype: { hybridAccuracy, sfAccuracy, agreementRate, sampleSize, confidence } }
 * 
 * @param {Function} queryFn - resilientQuery function from worker
 * @returns {object|null} Live archetype weights or null on failure
 */
export async function computeLiveArchetypeWeights(queryFn) {
  try {
    const result = await queryFn(`
      SELECT 
        hybrid_archetype,
        COUNT(*) as total,
        SUM(CASE WHEN hybrid_correct = true THEN 1 ELSE 0 END) as ep_correct,
        SUM(CASE WHEN stockfish_correct = true THEN 1 ELSE 0 END) as sf_correct,
        SUM(CASE WHEN hybrid_prediction = stockfish_prediction THEN 1 ELSE 0 END) as agreement_count,
        AVG(hybrid_confidence) as avg_confidence
      FROM chess_prediction_attempts
      WHERE hybrid_archetype IS NOT NULL
        AND actual_result IS NOT NULL
        AND hybrid_archetype != 'unknown'
      GROUP BY hybrid_archetype
      HAVING COUNT(*) >= $1
      ORDER BY COUNT(*) DESC
    `, [MIN_SAMPLE_SIZE]);

    if (!result.rows || result.rows.length === 0) {
      console.log('[LIVE-WEIGHTS] No archetype data meets minimum sample size');
      return null;
    }

    const weights = {};
    let totalPredictions = 0;

    for (const row of result.rows) {
      const arch = row.hybrid_archetype;
      const total = parseInt(row.total);
      const epCorrect = parseInt(row.ep_correct);
      const sfCorrect = parseInt(row.sf_correct);
      const agreementCount = parseInt(row.agreement_count);

      weights[arch] = {
        hybridAccuracy: total > 0 ? epCorrect / total : 0.5,
        sfAccuracy: total > 0 ? sfCorrect / total : 0.5,
        agreementRate: total > 0 ? agreementCount / total : 0.5,
        sampleSize: total,
        avgConfidence: parseFloat(row.avg_confidence) || 50,
      };
      totalPredictions += total;
    }

    // Always include 'unknown' fallback from overall stats
    if (!weights.unknown) {
      const overallResult = await queryFn(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN hybrid_correct = true THEN 1 ELSE 0 END) as ep_correct,
          SUM(CASE WHEN stockfish_correct = true THEN 1 ELSE 0 END) as sf_correct
        FROM chess_prediction_attempts
        WHERE actual_result IS NOT NULL
      `);
      if (overallResult.rows.length > 0) {
        const r = overallResult.rows[0];
        const t = parseInt(r.total) || 1;
        weights.unknown = {
          hybridAccuracy: parseInt(r.ep_correct) / t,
          sfAccuracy: parseInt(r.sf_correct) / t,
          agreementRate: 0.5,
          sampleSize: t,
          avgConfidence: 50,
        };
      }
    }

    const meta = {
      computedAt: new Date().toISOString(),
      totalPredictions,
      archetypeCount: Object.keys(weights).length,
      weights,
    };

    return meta;
  } catch (err) {
    console.error(`[LIVE-WEIGHTS] Query failed: ${err.message}`);
    return null;
  }
}

/**
 * Save live weights to disk for persistence across restarts.
 */
export function saveLiveWeights(meta) {
  try {
    // Ensure data directory exists
    const dataDir = dirname(WEIGHTS_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(WEIGHTS_PATH, JSON.stringify(meta, null, 2));
    console.log(`[LIVE-WEIGHTS] Saved ${meta.archetypeCount} archetypes (${meta.totalPredictions} total predictions) → ${WEIGHTS_PATH}`);
    return true;
  } catch (err) {
    console.error(`[LIVE-WEIGHTS] Save failed: ${err.message}`);
    return false;
  }
}

/**
 * Load previously saved live weights from disk.
 * Returns null if no file exists or it's stale (> 24 hours old).
 */
export function loadLiveWeights() {
  try {
    if (!fs.existsSync(WEIGHTS_PATH)) return null;
    const raw = fs.readFileSync(WEIGHTS_PATH, 'utf-8');
    const meta = JSON.parse(raw);
    
    // Check staleness — 24 hours max
    const age = Date.now() - new Date(meta.computedAt).getTime();
    if (age > 24 * 60 * 60 * 1000) {
      console.log('[LIVE-WEIGHTS] Cached weights are stale (>24h), will recompute');
      return null;
    }
    
    console.log(`[LIVE-WEIGHTS] Loaded cached weights: ${meta.archetypeCount} archetypes, ${meta.totalPredictions} predictions (age: ${(age / 3600000).toFixed(1)}h)`);
    return meta;
  } catch (err) {
    return null;
  }
}

/**
 * Get the best available archetype weights — live from DB, cached from disk, or hardcoded fallback.
 * This is the main entry point for the prediction engine.
 */
export function getArchetypeWeight(arch, liveWeights) {
  if (liveWeights?.weights?.[arch]) {
    return liveWeights.weights[arch];
  }
  // Fallback for archetypes not yet in DB
  return {
    hybridAccuracy: 0.50,
    sfAccuracy: 0.45,
    agreementRate: 0.50,
    sampleSize: 0,
    avgConfidence: 50,
  };
}

/**
 * Load puzzle archetype calibration data.
 * This tells us how accurately we DETECT each archetype (from labeled puzzles).
 * Combined with game accuracy (how accurately each archetype PREDICTS outcomes),
 * this gives a complete picture of per-archetype reliability.
 */
export function loadPuzzleCalibration() {
  try {
    if (!fs.existsSync(CALIBRATION_PATH)) return null;
    const raw = fs.readFileSync(CALIBRATION_PATH, 'utf-8');
    const cal = JSON.parse(raw);
    return cal;
  } catch (err) {
    return null;
  }
}

/**
 * Merge puzzle calibration into live weights.
 * Adds detectionAccuracy and detectionSampleSize to each archetype's stats.
 * 
 * detectionAccuracy = how often we correctly identify this archetype from labeled puzzles
 * hybridAccuracy = how often this archetype correctly predicts game outcomes
 * 
 * Combined confidence = detectionAccuracy * hybridAccuracy
 * (if we can't reliably detect it AND it doesn't predict well, don't trust it)
 */
export function mergePuzzleCalibration(liveWeights, puzzleCal) {
  if (!liveWeights?.weights || !puzzleCal?.archetypeAccuracy) return liveWeights;
  
  for (const [arch, stats] of Object.entries(puzzleCal.archetypeAccuracy)) {
    if (liveWeights.weights[arch]) {
      liveWeights.weights[arch].detectionAccuracy = stats.accuracy || 0;
      liveWeights.weights[arch].detectionSampleSize = stats.total || 0;
      // Combined reliability: only apply detection accuracy when we have
      // meaningful signal (n>30 AND accuracy>15%). Otherwise, don't penalize —
      // low detection accuracy with bad mapping was halving EP confidence.
      const hasSignal = (stats.total || 0) >= 30 && (stats.accuracy || 0) > 0.15;
      liveWeights.weights[arch].combinedReliability = hasSignal
        ? liveWeights.weights[arch].hybridAccuracy * (0.7 + 0.3 * stats.accuracy)
        : liveWeights.weights[arch].hybridAccuracy; // Don't penalize without signal
    }
  }
  
  // Also add archetype signature profiles (avg intensity, avg rating)
  if (puzzleCal.archetypeSignatures) {
    for (const [arch, sig] of Object.entries(puzzleCal.archetypeSignatures)) {
      if (liveWeights.weights[arch]) {
        liveWeights.weights[arch].puzzleAvgIntensity = sig.avgIntensity || 0;
        liveWeights.weights[arch].puzzleAvgRating = sig.avgRating || 0;
        liveWeights.weights[arch].puzzleSampleCount = sig.sampleCount || 0;
      }
    }
  }
  
  liveWeights.puzzleCalibrationMerged = true;
  liveWeights.puzzleCalibrationTotal = puzzleCal.totalPuzzles || 0;
  
  return liveWeights;
}

/**
 * Log a summary comparing live weights vs the old hardcoded values.
 */
export function logWeightComparison(liveWeights) {
  if (!liveWeights?.weights) return;
  
  const HARDCODED = {
    piece_harmony: 0.53, kingside_attack: 0.51, queenside_expansion: 0.48,
    central_domination: 0.50, endgame_technique: 0.49, open_tactical: 0.47,
    positional_squeeze: 0.52, pawn_storm: 0.46, sacrificial_attack: 0.44,
    opposite_castling: 0.45, closed_maneuvering: 0.354, prophylactic_defense: 0.42,
    unknown: 0.415,
  };

  console.log('\n[LIVE-WEIGHTS] ═══════════════════════════════════════════');
  console.log('[LIVE-WEIGHTS] Archetype Accuracy: LIVE vs HARDCODED');
  console.log('[LIVE-WEIGHTS] ───────────────────────────────────────────');
  
  for (const [arch, live] of Object.entries(liveWeights.weights)) {
    const hardcoded = HARDCODED[arch] || 0.415;
    const diff = ((live.hybridAccuracy - hardcoded) * 100).toFixed(1);
    const arrow = live.hybridAccuracy > hardcoded ? '↑' : live.hybridAccuracy < hardcoded ? '↓' : '=';
    console.log(`[LIVE-WEIGHTS]   ${arch.padEnd(24)} LIVE: ${(live.hybridAccuracy * 100).toFixed(1)}% | OLD: ${(hardcoded * 100).toFixed(1)}% | ${arrow}${diff}pp (n=${live.sampleSize})`);
  }
  console.log('[LIVE-WEIGHTS] ═══════════════════════════════════════════\n');
}
