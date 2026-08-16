/**
 * Phase-Stratified Headline Reweighting
 * ============================================================================
 *
 * Queries the chess_prediction_attempts table directly to compute:
 *   1. The headline EP vs SF accuracy (matching audit/verify.mjs)
 *   2. Accuracy stratified by move_number zone (the actual sampling zones)
 *   3. A phase-even reweighted headline (what the edge would be if all zones
 *      were sampled equally, removing the peak-zone oversampling bias)
 *
 * This reveals how much the 5/15/65/15 peak-zone sampling distribution
 * inflates the published +5.43pp headline relative to a phase-even sample.
 *
 * Usage: node audit/phase-reweight.mjs
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 30000,
});

const ZONES = [
  { name: '12-19 (early middlegame)', min: 12, max: 19, sampleWeight: 0.05 },
  { name: '20-27 (early golden)',     min: 20, max: 27, sampleWeight: 0.15 },
  { name: '28-45 (peak golden)',      min: 28, max: 45, sampleWeight: 0.65 },
  { name: '46+  (late/endgame)',      min: 46, max: 999, sampleWeight: 0.15 },
];

async function main() {
  const client = await pool.connect();
  try {
    // 1. Headline (recent window — full-table aggregates time out on Supabase)
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Phase-Stratified Headline Reweighting');
    console.log('  (recent 30-day window — full-table aggregates time out)');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log();

    const headline = await client.query(`
      SELECT
        COUNT(*) AS total,
        SUM((hybrid_correct)::int) AS ep_correct,
        SUM((stockfish_correct)::int) AS sf_correct
      FROM chess_prediction_attempts
      WHERE created_at >= (NOW() - INTERVAL '30 days')
        AND created_at < (NOW() - INTERVAL '7 days')
        AND hybrid_correct IS NOT NULL
        AND stockfish_correct IS NOT NULL
    `);

    const total = parseInt(headline.rows[0].total);
    const epCorrect = parseInt(headline.rows[0].ep_correct);
    const sfCorrect = parseInt(headline.rows[0].sf_correct);
    const epAcc = (100 * epCorrect / total).toFixed(2);
    const sfAcc = (100 * sfCorrect / total).toFixed(2);
    const edge = (epAcc - sfAcc).toFixed(2);

    console.log('  HEADLINE (current corpus, 7-day lag)');
    console.log(`  Total predictions:     ${total.toLocaleString()}`);
    console.log(`  EP correct:            ${epCorrect.toLocaleString()} (${epAcc}%)`);
    console.log(`  SF18 correct:          ${sfCorrect.toLocaleString()} (${sfAcc}%)`);
    console.log(`  Published edge:        +${edge}pp`);
    console.log();

    // 2. Phase-stratified breakdown
    console.log('  PHASE-STRATIFIED BREAKDOWN');
    console.log('  ─────────────────────────────────────────────────────────────');
    console.log('  Zone                        N          EP%      SF%      Edge    Sample%');
    console.log('  ─────────────────────────────────────────────────────────────');

    const zoneResults = [];
    for (const zone of ZONES) {
      const r = await client.query(`
        SELECT
          COUNT(*) AS total,
          SUM((hybrid_correct)::int) AS ep_correct,
          SUM((stockfish_correct)::int) AS sf_correct
        FROM chess_prediction_attempts
        WHERE created_at >= (NOW() - INTERVAL '30 days')
          AND created_at < (NOW() - INTERVAL '7 days')
          AND hybrid_correct IS NOT NULL
          AND stockfish_correct IS NOT NULL
          AND move_number >= $1 AND move_number <= $2
      `, [zone.min, zone.max]);

      const zTotal = parseInt(r.rows[0].total);
      const zEp = parseInt(r.rows[0].ep_correct);
      const zSf = parseInt(r.rows[0].sf_correct);
      const zEpAcc = zTotal > 0 ? (100 * zEp / zTotal) : 0;
      const zSfAcc = zTotal > 0 ? (100 * zSf / zTotal) : 0;
      const zEdge = zEpAcc - zSfAcc;
      const actualPct = total > 0 ? (100 * zTotal / total) : 0;

      zoneResults.push({ ...zone, zTotal, zEpAcc, zSfAcc, zEdge, actualPct });

      console.log(
        `  ${zone.name.padEnd(28)} ${zTotal.toLocaleString().padStart(10)}  ` +
        `${zEpAcc.toFixed(2).padStart(7)}%  ${zSfAcc.toFixed(2).padStart(7)}%  ` +
        `${zEdge >= 0 ? '+' : ''}${zEdge.toFixed(2).padStart(6)}pp  ${actualPct.toFixed(1).padStart(6)}%`
      );
    }
    console.log();

    // 3. Phase-even reweighted headline
    // If all zones were sampled equally (25% each), what would the edge be?
    const evenWeight = 1 / ZONES.length;
    let reweightedEp = 0, reweightedSf = 0;
    for (const z of zoneResults) {
      reweightedEp += z.zEpAcc * evenWeight;
      reweightedSf += z.zSfAcc * evenWeight;
    }
    const reweightedEdge = reweightedEp - reweightedSf;

    console.log('  PHASE-EVEN REWEIGHTED HEADLINE (25% per zone)');
    console.log(`  Reweighted EP accuracy:  ${reweightedEp.toFixed(2)}%`);
    console.log(`  Reweighted SF accuracy:  ${reweightedSf.toFixed(2)}%`);
    console.log(`  Reweighted edge:         +${reweightedEdge.toFixed(2)}pp`);
    console.log(`  Published edge:          +${edge}pp`);
    console.log(`  Inflation from sampling: ${(edge - reweightedEdge).toFixed(2)}pp`);
    console.log();

    // 4. Also compute with the DOCUMENTED methodology weights (15/25/30/20/10)
    // mapped onto our zones proportionally
    const docWeights = [0.15, 0.25, 0.30, 0.20 + 0.10]; // merge last two
    let docReweightedEp = 0, docReweightedSf = 0;
    for (let i = 0; i < zoneResults.length; i++) {
      docReweightedEp += zoneResults[i].zEpAcc * docWeights[i];
      docReweightedSf += zoneResults[i].zSfAcc * docWeights[i];
    }
    const docEdge = docReweightedEp - docReweightedSf;

    console.log('  DOCUMENTED-WEIGHT REWEIGHTED HEADLINE (15/25/30/20+10)');
    console.log(`  Reweighted EP accuracy:  ${docReweightedEp.toFixed(2)}%`);
    console.log(`  Reweighted SF accuracy:  ${docReweightedSf.toFixed(2)}%`);
    console.log(`  Reweighted edge:         +${docEdge.toFixed(2)}pp`);
    console.log();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  INTERPRETATION');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  The published +${edge}pp edge is computed on a corpus where`);
    console.log(`  ${zoneResults[2].actualPct.toFixed(1)}% of predictions come from the peak golden zone (moves 28-45),`);
    console.log(`  which has the highest EP accuracy. A phase-even reweighting`);
    console.log(`  gives +${reweightedEdge.toFixed(2)}pp — the honest lower bound.`);
    console.log(`  The true edge is likely between these values, closer to the`);
    console.log(`  PROOF.md hold-out result (+2.1pp on 7,053 game-ID-split positions).`);
    console.log();

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => {
  console.error('Failed:', e);
  process.exit(1);
});
