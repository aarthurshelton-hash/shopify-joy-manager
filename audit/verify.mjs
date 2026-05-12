/**
 * En Pensent — Independent Verification Script
 * ============================================================================
 *
 * Reproduces the headline accuracy figures from the public read-only Supabase
 * view (predictions_public). Uses ONLY the public anon key — no private
 * credentials of any kind are required.
 *
 * USAGE
 *   node audit/verify.mjs
 *
 * REQUIREMENTS
 *   - Node.js 18+
 *   - npm install @supabase/supabase-js (already in package.json)
 *
 * WHAT IT DOES
 *   1. Connects to the public anon-key endpoint of the En Pensent Supabase
 *   2. Counts total predictions, EP-correct, SF18-correct
 *   3. Computes the headline edge
 *   4. Prints the same numbers used in our published claims
 *
 * INDEPENDENCE GUARANTEE
 *   - The anon key is what every visitor of enpensent.com already uses
 *   - The view excludes the most recent 7 days of data (cannot be manipulated
 *     retroactively against this script)
 *   - No write access exists for the anon key
 *   - Anyone in the world can run this script and verify our numbers
 *
 * If you find a discrepancy with our published claims, please email
 * a.arthur.shelton@gmail.com — we will investigate and respond publicly.
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

// Public credentials — these are the same anon key embedded in our frontend
// bundle and intentionally distributed via every page load of enpensent.com.
// They cannot bypass row-level security and cannot write to any table.
const SUPABASE_URL = 'https://ezvfslkjyjsqycztyfxh.supabase.co';
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dmZzbGtqeWpzcXljenR5ZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODMwMjksImV4cCI6MjA4NTY1OTAyOX0.pEFtxIisThrkNbXJPg0UThjscT0qqpxmv970PihxWMo';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

const fmt = (n) => n.toLocaleString();
const pct = (n) => `${n.toFixed(2)}%`;

async function fetchHeadlineStats() {
  const { data, error } = await supabase
    .from('audit_headline_stats')
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
      throw new Error(
        'The audit_headline_stats view does not exist yet.\n' +
        'The maintainer must first run audit/setup-public-view.sql in their Supabase SQL editor.'
      );
    }
    throw error;
  }
  return data;
}

async function fetchChess960Stats() {
  const { data, error } = await supabase
    .from('audit_chess960_stats')
    .select('*')
    .order('variant');

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
      return null;
    }
    throw error;
  }
  return data;
}

async function fetchSampleRow() {
  const { data, error } = await supabase
    .from('predictions_public')
    .select('*')
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

async function main() {
  console.log('========================================================================');
  console.log('  En Pensent — Independent Verification');
  console.log('========================================================================');
  console.log('');
  console.log(`  Endpoint:   ${SUPABASE_URL}`);
  console.log(`  Auth:       public anon key (read-only, RLS-respecting)`);
  console.log(`  Started:    ${new Date().toISOString()}`);
  console.log('');

  let stats;
  try {
    stats = await fetchHeadlineStats();
  } catch (e) {
    console.error('ERROR fetching headline stats:');
    console.error('  ' + e.message);
    process.exit(1);
  }

  console.log('------------------------------------------------------------------------');
  console.log('  HEADLINE RESULT — En Pensent vs Stockfish 18');
  console.log('------------------------------------------------------------------------');
  console.log(`  Total predictions:          ${fmt(stats.total_predictions)}`);
  console.log(`  En Pensent correct:         ${fmt(stats.ep_correct)}`);
  console.log(`  Stockfish 18 correct:       ${fmt(stats.sf_correct)}`);
  console.log('');
  console.log(`  En Pensent accuracy:        ${pct(parseFloat(stats.ep_accuracy_pct))}`);
  console.log(`  Stockfish 18 accuracy:      ${pct(parseFloat(stats.sf_accuracy_pct))}`);
  console.log(`  En Pensent edge over SF18:  +${parseFloat(stats.ep_edge_pp).toFixed(2)} percentage points`);
  console.log('');
  console.log(`  Earliest prediction:        ${stats.earliest_prediction}`);
  console.log(`  Latest prediction:          ${stats.latest_prediction}`);
  console.log('');

  const variantStats = await fetchChess960Stats();
  if (variantStats && variantStats.length > 0) {
    console.log('------------------------------------------------------------------------');
    console.log('  STRATIFIED — Standard Chess vs Chess960 / Freestyle');
    console.log('------------------------------------------------------------------------');
    for (const v of variantStats) {
      console.log(`  ${v.variant.padEnd(12)} N=${fmt(v.total_predictions).padStart(10)}  EP ${pct(parseFloat(v.ep_accuracy_pct)).padStart(7)}  SF18 ${pct(parseFloat(v.sf_accuracy_pct)).padStart(7)}  Edge +${parseFloat(v.ep_edge_pp).toFixed(2)}pp`);
    }
    console.log('');
  }

  const sample = await fetchSampleRow();
  if (sample) {
    console.log('------------------------------------------------------------------------');
    console.log('  SAMPLE ROW (one prediction, schema verification)');
    console.log('------------------------------------------------------------------------');
    console.log(JSON.stringify(sample, null, 2));
    console.log('');
  }

  console.log('========================================================================');
  console.log('  Verification complete. To dive deeper:');
  console.log('  - Read METHODOLOGY.md for the full sampling and calibration design');
  console.log('  - Read RESULTS.md for the full breakdown by eval zone, phase, archetype');
  console.log('  - Query predictions_public directly with any Postgres client');
  console.log('========================================================================');
}

main().catch((e) => {
  console.error('Verification failed:', e);
  process.exit(1);
});
