import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Paginate to bypass 1000-row REST limit
const PAGE = 1000;
const MAX_ROWS = 150000;
let data = [];
let offset = 0;
process.stdout.write('Fetching');
while (data.length < MAX_ROWS) {
  const { data: page, error } = await sb.from('chess_prediction_attempts')
    .select('hybrid_correct, stockfish_correct, enhanced_correct, hybrid_prediction, hybrid_confidence, move_number, hybrid_archetype, created_at')
    .not('hybrid_correct', 'is', null)
    .not('stockfish_correct', 'is', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE - 1);
  if (error) { console.error(error); process.exit(1); }
  if (!page || page.length === 0) break;
  data = data.concat(page);
  offset += page.length;
  process.stdout.write('.');
  if (page.length < PAGE) break;
}
process.stdout.write(' ' + data.length.toLocaleString() + ' rows\n');

const total = data.length;
const epCorrect = data.filter(r => r.hybrid_correct).length;
const sfCorrect = data.filter(r => r.stockfish_correct).length;
const enhCorrect = data.filter(r => r.enhanced_correct).length;
const enhAcc = (enhCorrect / total * 100).toFixed(2);
const epAcc = (epCorrect / total * 100).toFixed(2);
const sfAcc = (sfCorrect / total * 100).toFixed(2);
const edge = (epCorrect / total * 100 - sfCorrect / total * 100).toFixed(2);

const cutoff24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const last24 = data.filter(r => r.created_at > cutoff24);
const ep24 = last24.length ? (last24.filter(r => r.hybrid_correct).length / last24.length * 100).toFixed(2) : 'N/A';
const sf24 = last24.length ? (last24.filter(r => r.stockfish_correct).length / last24.length * 100).toFixed(2) : 'N/A';
const edge24 = last24.length ? (parseFloat(ep24) - parseFloat(sf24)).toFixed(2) : 'N/A';

const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const last7d = data.filter(r => r.created_at > cutoff7d);
const ep7d = last7d.length ? (last7d.filter(r => r.hybrid_correct).length / last7d.length * 100).toFixed(2) : 'N/A';
const sf7d = last7d.length ? (last7d.filter(r => r.stockfish_correct).length / last7d.length * 100).toFixed(2) : 'N/A';
const edge7d = last7d.length ? (parseFloat(ep7d) - parseFloat(sf7d)).toFixed(2) : 'N/A';

// Golden zone
const golden = data.filter(r => r.move_number >= 15 && r.move_number <= 45 && (r.hybrid_confidence || 0) >= 50);
const goldenEP = golden.length ? (golden.filter(r => r.hybrid_correct).length / golden.length * 100).toFixed(2) : 'N/A';
const goldenSF = golden.length ? (golden.filter(r => r.stockfish_correct).length / golden.length * 100).toFixed(2) : 'N/A';
const goldenENH = golden.length ? (golden.filter(r => r.enhanced_correct).length / golden.length * 100).toFixed(2) : 'N/A';

// By phase
const phases = [
  { label: 'Opening (1-14)',    f: r => r.move_number <= 14 },
  { label: 'Early mid (15-24)', f: r => r.move_number >= 15 && r.move_number <= 24 },
  { label: 'Late mid (25-34)',  f: r => r.move_number >= 25 && r.move_number <= 34 },
  { label: 'Endgame (35-50)',   f: r => r.move_number >= 35 && r.move_number <= 50 },
  { label: 'Deep end (51+)',    f: r => r.move_number > 50 },
];

// By archetype (top 8 by volume)
const archCounts = {};
for (const r of data) {
  const a = r.hybrid_archetype || 'unknown';
  if (!archCounts[a]) archCounts[a] = { n: 0, ep: 0, sf: 0, enh: 0 };
  archCounts[a].n++;
  if (r.hybrid_correct) archCounts[a].ep++;
  if (r.stockfish_correct) archCounts[a].sf++;
  if (r.enhanced_correct) archCounts[a].enh++;
}
const topArchs = Object.entries(archCounts)
  .sort((a, b) => b[1].n - a[1].n)
  .slice(0, 8);

console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║      EP vs SF18 — LIVE CHESS REASSESSMENT       ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log(`\nSample size: ${total.toLocaleString()} predictions`);
console.log(`\n── ALL-TIME ─────────────────────────────────────`);
console.log(`  EP hybrid:   ${epAcc}%`);
console.log(`  EP enhanced: ${enhAcc}%`);
console.log(`  SF18: ${sfAcc}%`);
console.log(`  Edge: ${edge > 0 ? '+' : ''}${edge}pp`);
console.log(`\n── LAST 24H (${last24.length.toLocaleString()} predictions) ──────────────────`);
console.log(`  EP:   ${ep24}%`);
console.log(`  SF18: ${sf24}%`);
console.log(`  Edge: ${edge24 > 0 ? '+' : ''}${edge24}pp`);
console.log(`\n── LAST 7D (${last7d.length.toLocaleString()} predictions) ───────────────────`);
console.log(`  EP:   ${ep7d}%`);
console.log(`  SF18: ${sf7d}%`);
console.log(`  Edge: ${edge7d > 0 ? '+' : ''}${edge7d}pp`);
console.log(`\n── GOLDEN ZONE (moves 15-45, conf≥50, n=${golden.length.toLocaleString()}) ──`);
console.log(`  EP:   ${goldenEP}%`);
console.log(`  SF18: ${goldenSF}%`);
console.log(`  Edge: ${(parseFloat(goldenEP) - parseFloat(goldenSF)).toFixed(2)}pp`);

console.log(`\n── BY GAME PHASE ────────────────────────────────`);
for (const ph of phases) {
  const seg = data.filter(ph.f);
  if (!seg.length) continue;
  const e = (seg.filter(r => r.hybrid_correct).length / seg.length * 100).toFixed(1);
  const s = (seg.filter(r => r.stockfish_correct).length / seg.length * 100).toFixed(1);
  const d = (parseFloat(e) - parseFloat(s)).toFixed(1);
  console.log(`  ${ph.label.padEnd(20)} EP ${e}%  SF ${s}%  (${d > 0 ? '+' : ''}${d}pp)  n=${seg.length.toLocaleString()}`);
}

console.log(`\n── TOP ARCHETYPES (by volume) ──────────────────`);
for (const [arch, s] of topArchs) {
  const e = (s.ep / s.n * 100).toFixed(1);
  const sfp = (s.sf / s.n * 100).toFixed(1);
  const enhp = (s.enh / s.n * 100).toFixed(1);
  const d2 = (parseFloat(e) - parseFloat(sfp)).toFixed(1);
  console.log(`  ${arch.padEnd(30)} EP ${e}%  SF ${sfp}%  ENH ${enhp}%  (${d2 > 0 ? '+' : ''}${d2}pp)  n=${s.n.toLocaleString()}`);
}
console.log('');
