/**
 * En Pensent — Recompute security_accuracy_metrics with sector-aware thresholds
 * ============================================================================
 *
 * WHY THIS EXISTS
 *   `security_accuracy_metrics.direction_accuracy` is the input to the
 *   selective-prediction gate in market-prediction-worker.mjs:
 *
 *       if (stats.accuracy < 0.35 && stats.total >= 100) return false;
 *
 *   Those metrics were originally scored with a single UNIVERSAL move threshold
 *   (~0.5%). Intraday tech/index moves are an order of magnitude smaller than
 *   that, so a correct call was frequently scored as wrong. The result is a
 *   contaminated table that silently blocks healthy symbols.
 *
 *   Measured example (Aug 28 2026): AMZN read 13.0% on n=123 and was about to
 *   be blocked from all Monday predictions. Re-scored against the correct
 *   per-sector threshold on live data, AMZN is 48.1% (n=52) — unremarkable,
 *   but nowhere near catastrophic and absolutely should not be blocked.
 *
 * WHAT IT DOES
 *   Re-scores every symbol from `market_prediction_attempts` using the SAME
 *   per-sector thresholds the live resolver uses, then writes corrected
 *   total_predictions / correct_predictions / direction_accuracy back.
 *
 *   Only LIVE rows (data_source = 'yahoo_finance') are used. Historical replay
 *   uses daily-fallback candles whose move magnitudes are far larger than
 *   intraday, which is the same reason threshold learning and reverse-signal
 *   detection are live-only.
 *
 * USAGE
 *   node audit/recompute-symbol-accuracy.mjs          # dry run, prints diff
 *   node audit/recompute-symbol-accuracy.mjs --apply  # writes to the DB
 * ============================================================================
 */

import 'dotenv/config';
import pg from 'pg';

const APPLY = process.argv.includes('--apply');

// Per-sector move thresholds — must stay in sync with the live resolver in
// market-prediction-worker.mjs (refreshSectorThresholds / refreshReverseSignals).
const SECTOR_THRESHOLDS = {
  forex: 0.00007,      // 0.007% — forex moves are tiny
  crypto: 0.0075,      // 0.75%  — crypto is volatile
  commodities: 0.0016, // 0.16%
  energy: 0.0016,      // 0.16%
  tech: 0.001,         // 0.10%  — corrected from the old universal 0.5%
  indices: 0.001,      // 0.10%
};

const SECTOR_BY_SYMBOL = {
  AMD: 'tech', AMZN: 'tech', MSFT: 'tech', NVDA: 'tech', META: 'tech', GOOGL: 'tech', AAPL: 'tech',
  QQQ: 'indices', SPY: 'indices',
  GLD: 'commodities', SLV: 'commodities',
  USO: 'energy',
  'SI=F': 'commodities', 'GC=F': 'commodities', 'HG=F': 'commodities',
  'PL=F': 'commodities', 'PA=F': 'commodities',
  'CL=F': 'energy', 'NG=F': 'energy',
};

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  statement_timeout: 120000,
});

const { rows } = await pool.query(`
  SELECT symbol,
         predicted_direction,
         price_at_prediction,
         price_at_resolution,
         prediction_metadata->>'sector' AS sector
  FROM market_prediction_attempts
  WHERE resolved_at IS NOT NULL
    AND price_at_prediction IS NOT NULL
    AND price_at_resolution IS NOT NULL
    AND predicted_direction IN ('bullish', 'bearish')
    AND data_source = 'yahoo_finance'
`);

const bySymbol = {};
for (const r of rows) {
  const sector = r.sector || SECTOR_BY_SYMBOL[r.symbol] || 'tech';
  if (!bySymbol[r.symbol]) bySymbol[r.symbol] = { correct: 0, total: 0, sector };

  const change = (r.price_at_resolution - r.price_at_prediction) / r.price_at_prediction;
  const threshold = SECTOR_THRESHOLDS[sector] || 0.005;
  const actual = change > threshold ? 'bullish' : change < -threshold ? 'bearish' : null;
  if (!actual) continue; // genuinely flat — not a directional test

  bySymbol[r.symbol].total++;
  if (r.predicted_direction === actual) bySymbol[r.symbol].correct++;
}

// Existing (contaminated) values for comparison
const { rows: current } = await pool.query(
  'SELECT symbol, total_predictions, correct_predictions, direction_accuracy FROM security_accuracy_metrics'
);
const currentBySymbol = Object.fromEntries(current.map((r) => [r.symbol, r]));

console.log(APPLY ? '=== RECOMPUTING (APPLY) ===' : '=== DRY RUN (pass --apply to write) ===');
console.log('');
console.log('  Symbol      OLD acc  OLD n |  NEW acc  NEW n | gate effect');

const updates = [];
for (const [symbol, s] of Object.entries(bySymbol).sort((a, b) => b[1].total - a[1].total)) {
  if (s.total < 20) continue; // too few directional tests to publish a metric

  const newAcc = s.correct / s.total;
  const old = currentBySymbol[symbol];
  const oldAcc = old?.direction_accuracy != null ? Number(old.direction_accuracy) : null;
  const oldN = old?.total_predictions != null ? Number(old.total_predictions) : 0;

  const wasBlocked = oldAcc != null && oldAcc < 0.35 && oldN >= 100;
  const nowBlocked = newAcc < 0.35 && s.total >= 100;
  const effect = wasBlocked && !nowBlocked ? 'UNBLOCKED'
    : !wasBlocked && nowBlocked ? 'now blocked'
    : nowBlocked ? 'still blocked'
    : 'ok';

  console.log(
    '  ' + symbol.padEnd(10) +
    (oldAcc == null ? '    -  ' : (oldAcc * 100).toFixed(1) + '%').padStart(8) +
    String(oldN).padStart(7) + ' | ' +
    ((newAcc * 100).toFixed(1) + '%').padStart(8) +
    String(s.total).padStart(6) + ' | ' + effect
  );

  updates.push({ symbol, total: s.total, correct: s.correct, accuracy: +newAcc.toFixed(4) });
}

if (APPLY) {
  for (const u of updates) {
    await pool.query(
      `UPDATE security_accuracy_metrics
          SET total_predictions = $2,
              correct_predictions = $3,
              direction_accuracy = $4,
              updated_at = NOW()
        WHERE symbol = $1`,
      [u.symbol, u.total, u.correct, u.accuracy]
    );
  }
  console.log('');
  console.log(`Applied ${updates.length} symbol metric corrections.`);
} else {
  console.log('');
  console.log(`${updates.length} symbols would be updated. Re-run with --apply to write.`);
}

await pool.end();
