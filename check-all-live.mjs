import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function countRows(table, filters = {}) {
  let q = sb.from(table).select('*', { count: 'exact', head: true });
  for (const [k, v] of Object.entries(filters)) q = q.not(k, 'is', null);
  const { count } = await q;
  return count;
}

async function paginate(table, select, filters, orderCol, limit = 200000) {
  const PAGE = 1000;
  let rows = [], offset = 0;
  while (rows.length < limit) {
    let q = sb.from(table).select(select).order(orderCol, { ascending: false }).range(offset, offset + PAGE - 1);
    for (const [col, val] of Object.entries(filters)) {
      if (val === 'notnull') q = q.not(col, 'is', null);
      else q = q.eq(col, val);
    }
    const { data, error } = await q;
    if (error || !data || !data.length) break;
    rows = rows.concat(data);
    offset += data.length;
    if (data.length < PAGE) break;
  }
  return rows;
}

// ── CHESS ──────────────────────────────────────────────────────────────────
process.stdout.write('Chess total count...');
const chessTotal = await countRows('chess_prediction_attempts', { hybrid_correct: 'notnull' });
console.log(' ' + chessTotal?.toLocaleString());

process.stdout.write('Chess recent 200K...');
const chess = await paginate('chess_prediction_attempts',
  'hybrid_correct,stockfish_correct,hybrid_confidence,move_number,hybrid_archetype,created_at',
  { hybrid_correct: 'notnull', stockfish_correct: 'notnull' }, 'created_at', 200000);
console.log(' ' + chess.length.toLocaleString());

const c = chess;
const cTotal = c.length;
const epC = c.filter(r => r.hybrid_correct).length;
const sfC = c.filter(r => r.stockfish_correct).length;
const epAcc = (epC/cTotal*100).toFixed(2);
const sfAcc = (sfC/cTotal*100).toFixed(2);
const edge  = (epC/cTotal*100 - sfC/cTotal*100).toFixed(2);

const now = Date.now();
const c24h = c.filter(r => new Date(r.created_at).getTime() > now - 86400000);
const c7d  = c.filter(r => new Date(r.created_at).getTime() > now - 7*86400000);
const ep24 = c24h.length ? (c24h.filter(r=>r.hybrid_correct).length/c24h.length*100).toFixed(2) : 'N/A';
const sf24 = c24h.length ? (c24h.filter(r=>r.stockfish_correct).length/c24h.length*100).toFixed(2) : 'N/A';
const ep7d  = c7d.length  ? (c7d.filter(r=>r.hybrid_correct).length/c7d.length*100).toFixed(2) : 'N/A';
const sf7d  = c7d.length  ? (c7d.filter(r=>r.stockfish_correct).length/c7d.length*100).toFixed(2) : 'N/A';

const golden = c.filter(r => r.move_number >= 15 && r.move_number <= 45 && (r.hybrid_confidence||0) >= 50);
const goldenEP = golden.length ? (golden.filter(r=>r.hybrid_correct).length/golden.length*100).toFixed(2) : 'N/A';
const goldenSF = golden.length ? (golden.filter(r=>r.stockfish_correct).length/golden.length*100).toFixed(2) : 'N/A';

// Phase breakdown
const phases = [
  ['Opening (1-14)',    r => r.move_number <= 14],
  ['Early mid (15-24)',r => r.move_number >= 15 && r.move_number <= 24],
  ['Late mid (25-34)', r => r.move_number >= 25 && r.move_number <= 34],
  ['Endgame (35-50)',  r => r.move_number >= 35 && r.move_number <= 50],
  ['Deep end (51+)',   r => r.move_number > 50],
];

// Top archetypes
const arch = {};
for (const r of c) {
  const a = r.hybrid_archetype || 'unknown';
  if (!arch[a]) arch[a] = {n:0,ep:0,sf:0};
  arch[a].n++; if(r.hybrid_correct)arch[a].ep++; if(r.stockfish_correct)arch[a].sf++;
}
const topArch = Object.entries(arch).sort((a,b)=>b[1].n-a[1].n).slice(0,10);

// ── MARKET ─────────────────────────────────────────────────────────────────
process.stdout.write('Market stats...');
const mktTotal = await countRows('market_prediction_attempts');
const mktResolved = await countRows('market_prediction_attempts', { ep_correct: 'notnull' });
console.log(` total=${mktTotal?.toLocaleString()} resolved=${mktResolved?.toLocaleString()}`);

// Sample of resolved for accuracy
process.stdout.write('Market resolved sample...');
const mkt = await paginate('market_prediction_attempts',
  'symbol,ep_correct,baseline_correct,archetype,time_horizon,created_at',
  { ep_correct: 'notnull' }, 'created_at', 100000);
console.log(' ' + mkt.length.toLocaleString());

const mTotal = mkt.length;
const mEPCorr = mkt.filter(r => r.ep_correct === true).length;
const mBaseCorr = mkt.filter(r => r.baseline_correct === true).length;
const mEPAcc = (mEPCorr/mTotal*100).toFixed(1);
const mBaseAcc = (mBaseCorr/mTotal*100).toFixed(1);

const m7d = mkt.filter(r => new Date(r.created_at).getTime() > now - 7*86400000);
const m7dEP = m7d.length ? (m7d.filter(r=>r.ep_correct===true).length/m7d.length*100).toFixed(1) : 'N/A';

// By symbol
const bySym = {};
for (const r of mkt) {
  const s = r.symbol || 'unknown';
  if (!bySym[s]) bySym[s] = {n:0,ep:0};
  bySym[s].n++; if(r.ep_correct===true)bySym[s].ep++;
}
const topSym = Object.entries(bySym)
  .filter(([,s])=>s.n>=100)
  .sort((a,b)=>(b[1].ep/b[1].n)-(a[1].ep/a[1].n))
  .slice(0,12);

// Best archetype
const byArch = {};
for (const r of mkt) {
  const a = r.archetype || 'unknown';
  if (!byArch[a]) byArch[a] = {n:0,ep:0};
  byArch[a].n++; if(r.ep_correct===true)byArch[a].ep++;
}
const topMktArch = Object.entries(byArch)
  .filter(([,s])=>s.n>=50)
  .sort((a,b)=>(b[1].ep/b[1].n)-(a[1].ep/a[1].n))
  .slice(0,8);

// ── PRINT ──────────────────────────────────────────────────────────────────
console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║        EN PENSENT — FULL SYSTEM LIVE ASSESSMENT      ║');
console.log(`║        ${new Date().toISOString().slice(0,19)} UTC                        ║`);
console.log('╚═══════════════════════════════════════════════════════╝');

console.log('\n══ CHESS (EP vs SF18) ══════════════════════════════════');
console.log(`  Total in DB:           ${chessTotal?.toLocaleString()}`);
console.log(`  Sample (most recent):  ${cTotal.toLocaleString()}`);
console.log(`  EP hybrid (sample):    ${epAcc}%`);
console.log(`  SF18 (sample):         ${sfAcc}%`);
console.log(`  Edge:                  +${edge}pp`);
console.log(`  Last 24h (n=${c24h.length.toLocaleString()}): EP ${ep24}%  SF ${sf24}%  (+${(parseFloat(ep24)-parseFloat(sf24)).toFixed(2)}pp)`);
console.log(`  Last 7d  (n=${c7d.length.toLocaleString()}): EP ${ep7d}%  SF ${sf7d}%  (+${(parseFloat(ep7d)-parseFloat(sf7d)).toFixed(2)}pp)`);
console.log(`  Golden zone (15-45,conf≥50, n=${golden.length.toLocaleString()}): EP ${goldenEP}%  SF ${goldenSF}%  (+${(parseFloat(goldenEP)-parseFloat(goldenSF)).toFixed(2)}pp)`);

console.log('\n  Game Phase Breakdown:');
for (const [label,fn] of phases) {
  const seg = c.filter(fn);
  if (!seg.length) continue;
  const e = (seg.filter(r=>r.hybrid_correct).length/seg.length*100).toFixed(1);
  const s = (seg.filter(r=>r.stockfish_correct).length/seg.length*100).toFixed(1);
  const d = (parseFloat(e)-parseFloat(s)).toFixed(1);
  console.log(`    ${label.padEnd(22)} EP ${e}%  SF ${s}%  ${d>0?'+':''}${d}pp  n=${seg.length.toLocaleString()}`);
}

console.log('\n  Top Archetypes (volume):');
for (const [a,s] of topArch) {
  const e=(s.ep/s.n*100).toFixed(1), sf=(s.sf/s.n*100).toFixed(1), d=(parseFloat(e)-parseFloat(sf)).toFixed(1);
  console.log(`    ${a.padEnd(32)} EP ${e}%  SF ${sf}%  ${d>0?'+':''}${d}pp  n=${s.n.toLocaleString()}`);
}

console.log('\n══ MARKET ══════════════════════════════════════════════');
console.log(`  Total predictions:  ${mktTotal?.toLocaleString()}`);
console.log(`  Resolved:           ${mktResolved?.toLocaleString()}`);
console.log(`  EP accuracy (sample ${mTotal.toLocaleString()}): ${mEPAcc}%`);
console.log(`  Baseline:           ${mBaseAcc}%`);
console.log(`  7-day EP:           ${m7dEP}% (n=${m7d.length.toLocaleString()})`);

console.log('\n  By Symbol (min 100 resolved, sorted by EP acc):');
for (const [sym,s] of topSym) {
  const acc=(s.ep/s.n*100).toFixed(1);
  console.log(`    ${sym.padEnd(14)} ${acc}%  n=${s.n.toLocaleString()}`);
}

console.log('\n  By Archetype (min 50 resolved, sorted by EP acc):');
for (const [a,s] of topMktArch) {
  const acc=(s.ep/s.n*100).toFixed(1);
  console.log(`    ${a.padEnd(32)} ${acc}%  n=${s.n.toLocaleString()}`);
}

console.log('\n══ STATIC BENCHMARKS ═══════════════════════════════════');
console.log('  Battery (MATR 140 cells):    EP 56.5%  Baseline 33.3%  +23.2pp');
console.log('  Chemical TEP F1:             EP 93.3%  Baseline 72.7%  +20.6pp');
console.log('  Energy grid (EIA):           EP 66.6%  Persistence 66.9%  -0.3pp');
console.log('  Music (MAESTRO 33K phrases): EP 34.4%  Random 33.3%  +1.1pp');
console.log('  Nuclear NPPAD binary F1:     EP 100.0%  Bi-LSTM 89%  +11pp');
console.log('  Nuclear NPPAD 18-class:      EP 69.8%  NCC 40.7%  +29.1pp');
console.log('  Nuclear NRC outage:          EP 62.8%  Threshold 56.4%  +6.4pp');
console.log('');
