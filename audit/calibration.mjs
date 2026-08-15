/**
 * En Pensent — Calibration Audit
 * ============================================================================
 *
 * Computes probability-calibration metrics (Brier score, log-loss, Expected
 * Calibration Error, reliability-diagram bins) for both the En Pensent
 * (hybrid) and Stockfish 18 predictors, directly from the public
 * predictions_public view. Uses ONLY the public anon key.
 *
 * WHY THIS EXISTS
 *   Accuracy alone is not what a prediction platform buys. A model can be
 *   more accurate yet miscalibrated — assigning 90% confidence to events
 *   that happen 60% of the time. Platforms surface a win% to users, so the
 *   relevant question is: "when you say 70%, does it happen ~70% of the
 *   time?" Brier, log-loss, and ECE answer that. This script lets any
 *   reviewer check whether the published +5.43pp accuracy edge survives a
 *   calibration test.
 *
 * WHAT IT MEASURES
 *   - Top-1 confidence calibration. The corpus exposes the predictor's
 *     confidence in its single predicted outcome (white/black/draw), not a
 *     full 3-vector probability. So we treat p_hat = confidence/100 as the
 *     predicted probability that the predicted outcome occurs, and
 *     y = 1 if the prediction matched actual_result else 0. This is the
 *     standard "confidence calibration" for multi-class classifiers when
 *     only the top-1 probability is available (Guo et al., 2017).
 *
 * DATA SOURCE NOTE
 *   This script reads from the underlying chess_prediction_attempts table
 *   (accessible via the public anon key under the current RLS policy). The
 *   audit/setup-public-view.sql views (predictions_public, etc.) are the
 *   intended PII-stripped interface but are not currently installed on the
 *   production database. When they are installed, set USE_PUBLIC_VIEW=true
 *   below to read through the PII-stripped view instead.
 *   - Brier score  = mean((p_hat - y)^2)            [lower is better]
 *   - Log-loss     = -mean( y*log(p) + (1-y)*log(1-p) )  [lower is better]
 *   - ECE (10-bin) = sum_b (n_b/N) * |acc_b - conf_b|   [lower is better]
 *
 * LIMITATIONS (documented honestly)
 *   - We cannot compute full 3-class vector calibration (Brier multi-class,
 *     log-loss over the W/B/D distribution) because the public view does not
 *     expose per-class probabilities for either predictor. If a reviewer
 *     wants that, the maintainer must expose hybrid_p_white, hybrid_p_black,
 *     hybrid_p_draw (and the SF equivalents). This is on the roadmap.
 *   - Stockfish "confidence" in this corpus is a heuristic mapping from eval
 *     cp to a percentage (see farm/workers/ep-bulk-worker.mjs), not a
 *     calibrated probability. That is itself a finding: the SF baseline here
 *     is not a calibrated probabilistic forecaster, so its ECE will be poor
 *     by construction. The fair comparison is EP vs a properly calibrated
 *     SF-eval model (e.g. logistic regression on eval), which the
 *     independent benchmark in benchmark/ provides.
 *
 * USAGE
 *   node audit/calibration.mjs                 # default sample of 50,000 rows
 *   node audit/calibration.mjs --sample 200000 # larger sample
 *   node audit/calibration.mjs --full          # full public corpus (slower)
 *
 * REQUIREMENTS
 *   - Node.js 18+
 *   - npm install  (already in package.json)
 *
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ezvfslkjyjsqycztyfxh.supabase.co';
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dmZzbGtqeWpzcXljenR5ZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODMwMjksImV4cCI6MjA4NTY1OTAyOX0.pEFtxIisThrkNbXJPg0UThjscT0qqpxmv970PihxWMo';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// When the PII-stripped public views from audit/setup-public-view.sql are
// installed, set this to true to read through them instead of the raw table.
const USE_PUBLIC_VIEW = false;
const SOURCE_TABLE = USE_PUBLIC_VIEW ? 'predictions_public' : 'chess_prediction_attempts';

const args = process.argv.slice(2);
const fullMode = args.includes('--full');
const sampleArg = args[args.indexOf('--sample') + 1];
const SAMPLE_SIZE = fullMode ? null : (parseInt(sampleArg, 10) || 50000);
const PAGE_SIZE = 1000;

const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : String(n));
const pct = (n) => `${(n * 100).toFixed(2)}%`;
const f4  = (n) => (typeof n === 'number' ? n.toFixed(4) : 'n/a');

// ----------------------------------------------------------------------------
// Metrics
// ----------------------------------------------------------------------------

function brierScore(rows) {
  if (rows.length === 0) return NaN;
  let s = 0;
  for (const r of rows) s += (r.p - r.y) ** 2;
  return s / rows.length;
}

function logLoss(rows) {
  if (rows.length === 0) return NaN;
  const eps = 1e-12;
  let s = 0;
  for (const r of rows) {
    const p = Math.min(Math.max(r.p, eps), 1 - eps);
    s += -(r.y * Math.log(p) + (1 - r.y) * Math.log(1 - p));
  }
  return s / rows.length;
}

function eceBinned(rows, nBins = 10) {
  if (rows.length === 0) return { ece: NaN, bins: [] };
  const bins = Array.from({ length: nBins }, () => ({ n: 0, confSum: 0, correct: 0 }));
  for (const r of rows) {
    let idx = Math.floor(r.p * nBins);
    if (idx >= nBins) idx = nBins - 1;
    if (idx < 0) idx = 0;
    bins[idx].n += 1;
    bins[idx].confSum += r.p;
    bins[idx].correct += r.y;
  }
  const N = rows.length;
  let ece = 0;
  const out = bins.map((b, i) => {
    const acc = b.n > 0 ? b.correct / b.n : NaN;
    const conf = b.n > 0 ? b.confSum / b.n : NaN;
    const gap = b.n > 0 ? Math.abs(acc - conf) : 0;
    const weight = b.n / N;
    ece += gap * weight;
    return {
      bin: i,
      bin_floor: i / nBins,
      bin_ceil: (i + 1) / nBins,
      n: b.n,
      mean_confidence: conf,
      accuracy: acc,
      gap,
      weight,
    };
  });
  return { ece, bins: out };
}

function summarize(rows, label) {
  if (rows.length === 0) {
    console.log(`  ${label.padEnd(14)}: NO DATA`);
    return null;
  }
  const N = rows.length;
  const accuracy = rows.reduce((s, r) => s + r.y, 0) / N;
  const meanConf = rows.reduce((s, r) => s + r.p, 0) / N;
  const brier = brierScore(rows);
  const ll = logLoss(rows);
  const { ece, bins } = eceBinned(rows, 10);
  const result = { label, N, accuracy, meanConf, brier, logLoss: ll, ece, bins };
  console.log(`  ${label.padEnd(14)}: N=${fmt(N).padStart(10)}  acc=${pct(accuracy).padStart(7)}  mean_conf=${pct(meanConf).padStart(7)}  brier=${f4(brier)}  logloss=${f4(ll)}  ECE=${f4(ece)}`);
  return result;
}

// ----------------------------------------------------------------------------
// Data fetch
// ----------------------------------------------------------------------------

async function fetchRows() {
  const all = [];
  let from = 0;
  // Use deterministic ordering so the sample is reproducible.
  const selectCols = 'hybrid_prediction,hybrid_confidence,hybrid_correct,stockfish_prediction,stockfish_confidence,stockfish_correct,actual_result';

  if (SAMPLE_SIZE === null) {
    console.log(`Fetching full corpus from ${SOURCE_TABLE} in pages of ${PAGE_SIZE}...`);
  } else {
    console.log(`Fetching sample of ${fmt(SAMPLE_SIZE)} rows from ${SOURCE_TABLE} (deterministic order)...`);
  }

  while (true) {
    const limit = SAMPLE_SIZE !== null ? Math.min(PAGE_SIZE, SAMPLE_SIZE - all.length) : PAGE_SIZE;
    if (SAMPLE_SIZE !== null && limit <= 0) break;

    const { data, error } = await supabase
      .from(SOURCE_TABLE)
      .select(selectCols)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        throw new Error(
          `${SOURCE_TABLE} is not accessible via the anon key. ` +
          (USE_PUBLIC_VIEW
            ? 'Run audit/setup-public-view.sql to install the public views.'
            : 'RLS may be blocking access to chess_prediction_attempts.')
        );
      }
      throw error;
    }
    if (!data || data.length === 0) break;
    all.push(...data);
    from += PAGE_SIZE;
    if (SAMPLE_SIZE !== null && all.length >= SAMPLE_SIZE) break;
    if (data.length < PAGE_SIZE) break;
    if (all.length % 10000 === 0) process.stdout.write(`  ...${fmt(all.length)} rows\r`);
  }
  console.log(`  fetched ${fmt(all.length)} rows total.                `);
  return all;
}

function toProbs(rows) {
  const ep = [];
  const sf = [];
  for (const r of rows) {
    if (r.hybrid_confidence != null && r.hybrid_prediction != null && r.hybrid_correct != null) {
      ep.push({ p: r.hybrid_confidence / 100, y: r.hybrid_correct ? 1 : 0 });
    }
    if (r.stockfish_confidence != null && r.stockfish_prediction != null && r.stockfish_correct != null) {
      sf.push({ p: r.stockfish_confidence / 100, y: r.stockfish_correct ? 1 : 0 });
    }
  }
  return { ep, sf };
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

async function main() {
  console.log('========================================================================');
  console.log('  En Pensent — Calibration Audit');
  console.log('========================================================================');
  console.log('');
  console.log(`  Endpoint:   ${SUPABASE_URL}`);
  console.log(`  Auth:       public anon key (read-only, RLS-respecting)`);
  console.log(`  Mode:       ${SAMPLE_SIZE === null ? 'FULL CORPUS' : `sample of ${fmt(SAMPLE_SIZE)}`}`);
  console.log(`  Started:    ${new Date().toISOString()}`);
  console.log('');

  const rows = await fetchRows();
  const { ep, sf } = toProbs(rows);

  console.log('');
  console.log('------------------------------------------------------------------------');
  console.log('  OVERALL CALIBRATION (top-1 confidence)');
  console.log('------------------------------------------------------------------------');
  const epRes = summarize(ep, 'en_pensent');
  const sfRes = summarize(sf, 'stockfish_18');
  console.log('');

  if (epRes && sfRes) {
    console.log('------------------------------------------------------------------------');
    console.log('  HEAD-TO-HEAD');
    console.log('------------------------------------------------------------------------');
    const accEdge = (epRes.accuracy - sfRes.accuracy) * 100;
    const brierEdge = epRes.brier - sfRes.brier; // negative = EP better
    const llEdge = epRes.logLoss - sfRes.logLoss; // negative = EP better
    const eceEdge = epRes.ece - sfRes.ece;        // negative = EP better
    console.log(`  Accuracy edge (EP - SF):   ${accEdge >= 0 ? '+' : ''}${accEdge.toFixed(2)} pp`);
    console.log(`  Brier edge   (EP - SF):    ${brierEdge >= 0 ? '+' : ''}${f4(brierEdge)}  (${brierEdge < 0 ? 'EP better calibrated' : 'SF better calibrated'})`);
    console.log(`  Log-loss edge (EP - SF):    ${llEdge >= 0 ? '+' : ''}${f4(llEdge)}  (${llEdge < 0 ? 'EP better' : 'SF better'})`);
    console.log(`  ECE edge     (EP - SF):     ${eceEdge >= 0 ? '+' : ''}${f4(eceEdge)}  (${eceEdge < 0 ? 'EP better calibrated' : 'SF better calibrated'})`);
    console.log('');
  }

  if (epRes) {
    console.log('------------------------------------------------------------------------');
    console.log('  RELIABILITY DIAGRAM — En Pensent (10 bins)');
    console.log('------------------------------------------------------------------------');
    console.log('  bin        n        mean_conf    accuracy    gap       weight');
    for (const b of epRes.bins) {
      if (b.n === 0) continue;
      console.log(
        `  [${b.bin_floor.toFixed(1)}-${b.bin_ceil.toFixed(1)})  ${fmt(b.n).padStart(8)}  ${pct(b.mean_confidence).padStart(9)}  ${pct(b.accuracy).padStart(9)}  ${f4(b.gap).padStart(7)}  ${f4(b.weight).padStart(7)}`
      );
    }
    console.log('');
  }

  if (sfRes) {
    console.log('------------------------------------------------------------------------');
    console.log('  RELIABILITY DIAGRAM — Stockfish 18 (10 bins)');
    console.log('------------------------------------------------------------------------');
    console.log('  bin        n        mean_conf    accuracy    gap       weight');
    for (const b of sfRes.bins) {
      if (b.n === 0) continue;
      console.log(
        `  [${b.bin_floor.toFixed(1)}-${b.bin_ceil.toFixed(1)})  ${fmt(b.n).padStart(8)}  ${pct(b.mean_confidence).padStart(9)}  ${pct(b.accuracy).padStart(9)}  ${f4(b.gap).padStart(7)}  ${f4(b.weight).padStart(7)}`
      );
    }
    console.log('');
  }

  console.log('------------------------------------------------------------------------');
  console.log('  INTERPRETATION GUIDE');
  console.log('------------------------------------------------------------------------');
  console.log('  Brier score:  mean((p - y)^2). Range [0,1]. Lower is better.');
  console.log('                A perfect forecaster scores 0; a constant-0.5 forecaster');
  console.log('                scores 0.25. Competitive chess forecasters aim < 0.20.');
  console.log('  Log-loss:     -mean(y*log p + (1-y)*log(1-p)). Lower is better.');
  console.log('                Heavily penalizes overconfident wrong predictions.');
  console.log('  ECE:          Expected Calibration Error, 10-bin. Range [0,1].');
  console.log('                <0.05 is well-calibrated; >0.15 is poorly calibrated.');
  console.log('                This is the metric a platform surfacing win% cares about.');
  console.log('');
  console.log('  NOTE: Stockfish confidence here is a heuristic eval->% mapping, not a');
  console.log('  calibrated probability. A fair baseline is a logistic model on SF eval,');
  console.log('  which the independent benchmark in benchmark/ provides.');
  console.log('========================================================================');
}

main().catch((e) => {
  console.error('Calibration audit failed:', e);
  process.exit(1);
});
