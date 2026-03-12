import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

console.log('=== LIVE SUPABASE ACCURACY CHECK ===\n');

// Step 1: get total count efficiently (no filter = fast)
const { count: total, error: countErr } = await sb
  .from('chess_prediction_attempts')
  .select('id', { count: 'exact' })
  .limit(1);

if (countErr) { console.log('Count error:', countErr.message); process.exit(1); }
console.log('Total rows in DB:', Number(total).toLocaleString());

// Step 2: fetch large recent sample for accuracy ratios (indexed on created_at)
const SAMPLE = 200000;
console.log(`Fetching ${SAMPLE.toLocaleString()} most recent records for accuracy...\n`);

const { data: sample, error: sampleErr } = await sb
  .from('chess_prediction_attempts')
  .select('hybrid_correct, stockfish_correct')
  .order('created_at', { ascending: false })
  .limit(SAMPLE);

if (sampleErr) { console.log('Sample error:', sampleErr.message); process.exit(1); }

const n          = sample.length;
const epCorrect  = sample.filter(r => r.hybrid_correct === true).length;
const sfCorrect  = sample.filter(r => r.stockfish_correct === true).length;
const epOnly     = sample.filter(r => r.hybrid_correct === true && r.stockfish_correct === false).length;
const sfOnly     = sample.filter(r => r.stockfish_correct === true && r.hybrid_correct === false).length;
const bothCorr   = sample.filter(r => r.hybrid_correct === true && r.stockfish_correct === true).length;
const nullRows   = sample.filter(r => r.hybrid_correct === null || r.stockfish_correct === null).length;

console.log(`Sample size: ${n.toLocaleString()} (${nullRows} null/unresolved excluded from ratios)`);
const resolved = n - nullRows;

const epAcc    = (epCorrect / resolved * 100).toFixed(2);
const sfAcc    = (sfCorrect / resolved * 100).toFixed(2);
const edge     = (epCorrect / resolved * 100 - sfCorrect / resolved * 100).toFixed(2);
const sfWrong  = resolved - sfCorrect;
const recovery = sfWrong > 0 ? (epOnly / sfWrong * 100).toFixed(2) : 'N/A';

console.log('Total predictions (DB): ', Number(total).toLocaleString());
console.log('Sample size (resolved): ', resolved.toLocaleString());
console.log('EP (hybrid) accuracy:   ', epAcc + '%');
console.log('SF accuracy:            ', sfAcc + '%');
console.log('EP edge over SF:       +' + edge + 'pp');
console.log('EP-only correct:        ', Number(epOnly).toLocaleString(), '(EP right, SF wrong)');
console.log('SF-only correct:        ', Number(sfOnly).toLocaleString(), '(SF right, EP wrong)');
console.log('Both correct:           ', Number(bothCorr).toLocaleString());
console.log('EP recovery rate:       ', recovery + '%  (of SF errors EP catches)');

console.log('\n=== PAPER CLAIMS (current) ===');
console.log('Paper says total:       10,031,260');
console.log('Paper says EP acc:      68.92%');
console.log('Paper says SF acc:      63.59%');
console.log('Paper says edge:       +5.34pp');
console.log('Paper says recovery:    24.27%');

console.log('\n=== DELTA (live - paper) ===');
console.log('Total delta:           ', Number(total) - 10031260 > 0 ? '+' : '', (Number(total) - 10031260).toLocaleString());
console.log('EP acc delta:          ', (parseFloat(epAcc) - 68.92).toFixed(2) + 'pp');
console.log('SF acc delta:          ', (parseFloat(sfAcc) - 63.59).toFixed(2) + 'pp');
console.log('Edge delta:            ', (parseFloat(edge) - 5.34).toFixed(2) + 'pp');
