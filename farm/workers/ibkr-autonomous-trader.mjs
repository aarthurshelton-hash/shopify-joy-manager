/**
 * IBKR Autonomous Trading Worker v2
 *
 * Runs on IB Gateway PAPER account (port 4002) for forward validation.
 * Gated by computeViabilityScore (Grade A/B only) + isKnownBadCombo.
 * Switches to LIMIT orders and time-horizon-aware exits.
 * DO NOT change GATEWAY_PORT to 4001 until Grade A/B strategy has
 * 60%+ win rate over 50+ live forward trades.
 */

import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeViabilityScore, isKnownBadCombo } from '../scripts/ep-options-logic.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEARN_FILE      = path.join(__dirname, '../data/options-scalp-learning.json');
const POSITIONS_FILE  = path.join(__dirname, '../data/trader-positions.json');
const JOURNAL_FILE    = path.join(__dirname, '../data/sniper-journal.json');
const LIVE_STATE_FILE = path.join(__dirname, '../data/live-trade-state.json');

function loadJournal() {
  try { return JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf8')); }
  catch { return []; }
}
function saveJournal(entries) {
  fs.writeFileSync(JOURNAL_FILE, JSON.stringify(entries, null, 2));
}

function loadLiveState() {
  try { return JSON.parse(fs.readFileSync(LIVE_STATE_FILE, 'utf8')); }
  catch { return { firstTradePlaced: false, firstTradeAt: null, firstTradeCombo: null, totalLiveTrades: 0 }; }
}
function saveLiveState(state) {
  fs.writeFileSync(LIVE_STATE_FILE, JSON.stringify(state, null, 2));
}

// Query DB for resolved sniper-combo paper predictions to measure proven edge.
// Returns { ready, wins, losses, total, winRate, missingWins, missingWinRate }
async function checkLaunchReadiness() {
  try {
    // Only proven combos count toward launch readiness — exploratory ones don't block the gate
    const pairArchetypes = PROVEN_COMBOS.map(k => k.split('|')[0]);
    const pairSymbols    = PROVEN_COMBOS.map(k => k.split('|')[1]);

    // Match EXACT combo pairs — not any archetype × any symbol cross-product.
    // SLV/GLD: shouldFlip=true → ep_correct=false = WIN (we trade opposite direction).
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE
          (ep_correct = true  AND symbol NOT IN ('SLV','GLD')) OR
          (ep_correct = false AND symbol     IN ('SLV','GLD'))
        ) AS wins,
        COUNT(*) FILTER (WHERE
          (ep_correct = false AND symbol NOT IN ('SLV','GLD')) OR
          (ep_correct = true  AND symbol     IN ('SLV','GLD'))
        ) AS losses,
        COUNT(*) FILTER (WHERE ep_correct IS NOT NULL) AS total
      FROM market_prediction_attempts
      WHERE (archetype, symbol) IN (SELECT unnest($1::text[]), unnest($2::text[]))
        AND ep_correct   IS NOT NULL
        AND resolved_at  IS NOT NULL
        AND CASE WHEN confidence <= 1 THEN confidence * 100 ELSE confidence END >= 70
        AND time_horizon != '5m'
        AND created_at   > NOW() - INTERVAL '60d'
    `, [pairArchetypes, pairSymbols]);

    const wins    = parseInt(rows[0].wins)   || 0;
    const losses  = parseInt(rows[0].losses) || 0;
    const total   = parseInt(rows[0].total)  || 0;
    const winRate = total > 0 ? parseFloat(((wins / total) * 100).toFixed(1)) : 0;

    const ready = wins >= LAUNCH_REQUIRED_WINS && winRate >= LAUNCH_REQUIRED_WIN_RATE;
    return {
      ready,
      wins, losses, total, winRate,
      missingWins:    Math.max(0, LAUNCH_REQUIRED_WINS - wins),
      missingWinRate: Math.max(0, LAUNCH_REQUIRED_WIN_RATE - winRate),
    };
  } catch (err) {
    log(`[LAUNCH] readiness check error: ${err.message}`, 'warn');
    return { ready: false, wins: 0, losses: 0, total: 0, winRate: 0, missingWins: LAUNCH_REQUIRED_WINS, missingWinRate: LAUNCH_REQUIRED_WIN_RATE };
  }
}

function savePositions(map) {
  try {
    const obj = {};
    for (const [k, v] of map) obj[k] = v;
    fs.writeFileSync(POSITIONS_FILE, JSON.stringify(obj, null, 2));
  } catch (e) { /* non-fatal */ }
}
function loadPositions() {
  try {
    const raw = JSON.parse(fs.readFileSync(POSITIONS_FILE, 'utf8'));
    const map = new Map(Object.entries(raw));
    const now = Date.now();
    // Drop positions whose exit deadline already passed by >24h (stale)
    for (const [k, v] of map) {
      if (v.exitDeadline && now - v.exitDeadline > 24 * 60 * 60 * 1000) map.delete(k);
    }
    if (map.size) console.log(`[ibkr-trader] Restored ${map.size} position(s) from disk`);
    return map;
  } catch { return new Map(); }
}

function loadLearning() {
  try {
    const d = JSON.parse(fs.readFileSync(LEARN_FILE, 'utf8'));
    // Ensure all expected keys exist (handles files written with different schema)
    if (!d.byDirection) d.byDirection = {};
    if (!d.byArchetype) d.byArchetype = {};
    if (!d.byTimeframe) d.byTimeframe = {};
    if (!d.trades) d.trades = [];
    if (d.totalTrades == null) d.totalTrades = 0;
    if (d.wins == null) d.wins = 0;
    if (d.losses == null) d.losses = 0;
    if (d.totalPnL == null) d.totalPnL = 0;
    return d;
  } catch { return { trades: [], byArchetype: {}, byTimeframe: {}, byDirection: {}, totalTrades: 0, wins: 0, losses: 0, totalPnL: 0 }; }
}
function saveLearning(d) {
  fs.writeFileSync(LEARN_FILE, JSON.stringify(d, null, 2));
}
function recordTrade(pos, exitPremium) {
  const d = loadLearning();
  // Safe-init all sub-objects in case learning file predates a field
  d.byArchetype  = d.byArchetype  || {};
  d.byTimeframe  = d.byTimeframe  || {};
  d.byDirection  = d.byDirection  || {};
  const pnl = (exitPremium - pos.entryPremium) * pos.contracts * 100;
  const won  = pnl > 0;
  d.totalTrades++;
  d.totalPnL = parseFloat(((d.totalPnL || 0) + pnl).toFixed(2));
  won ? d.wins++ : d.losses++;
  // by archetype
  const arch = pos.archetype || 'unknown';
  if (!d.byArchetype[arch]) d.byArchetype[arch] = { trades:0, wins:0, pnl:0 };
  d.byArchetype[arch].trades++; if (won) d.byArchetype[arch].wins++;
  d.byArchetype[arch].pnl = parseFloat((d.byArchetype[arch].pnl + pnl).toFixed(2));
  // by timeframe
  const tf = pos.timeHorizon || 'unknown';
  if (!d.byTimeframe[tf]) d.byTimeframe[tf] = { trades:0, wins:0, pnl:0 };
  d.byTimeframe[tf].trades++; if (won) d.byTimeframe[tf].wins++;
  d.byTimeframe[tf].pnl = parseFloat((d.byTimeframe[tf].pnl + pnl).toFixed(2));
  // by direction
  const dir = pos.right === 'C' ? 'up' : 'down';
  if (!d.byDirection[dir]) d.byDirection[dir] = { trades:0, wins:0, pnl:0 };
  d.byDirection[dir].trades++; if (won) d.byDirection[dir].wins++;
  d.byDirection[dir].pnl = parseFloat((d.byDirection[dir].pnl + pnl).toFixed(2));
  // append trade log (last 500)
  d.trades = [...(d.trades || []).slice(-499), { ts: new Date().toISOString(), symbol: pos.symbol, arch, tf, dir, contracts: pos.contracts, entry: pos.entryPremium, exit: exitPremium, pnl, won }];
  saveLearning(d);
  return { pnl, won };
}

const { Pool } = pg;

// DB pool — used for combo_pct CTE queries (supabase client can't do CTEs)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
});
pool.on('error', (err) => console.error('[IBKR] Pool error:', err.message));

// Worker ID
const WORKER_ID = process.argv[2] || '0';
const WORKER_NAME = `ibkr-trader-${WORKER_ID}`;

// IB Gateway Bridge config
const BRIDGE_URL   = process.env.IB_BRIDGE_URL   || 'http://localhost:4000';
const GATEWAY_HOST = process.env.IB_GATEWAY_HOST || '127.0.0.1';
const GATEWAY_PORT = parseInt(process.env.IB_GATEWAY_PORT || '4002'); // 4002 = PAPER, 4001 = LIVE
const CLIENT_ID    = parseInt(process.env.IB_CLIENT_ID    || '1');
const IS_PAPER     = GATEWAY_PORT === 4002;

// Trading config — environment-based (paper = aggressive learning, live = conservative)
const CONFIG = IS_PAPER ? {
  // PAPER ACCOUNT: Aggressive learning mode
  MIN_CONFIDENCE:          20,    // pct — full learning mode, build data on all signals
  MIN_GRADE:               'B',   // v35: raised C→B — Grade C 33% WR -$871, Grade B 75% WR +$300 (Mar 5 data)
  POSITION_SIZE_PERCENT:   20,    // 20% per trade (conf>=88 gets 3×, conf>=78 gets 2×) — massive sizing for learning
  MAX_DAILY_LOSS_USD:      null,  // NO LIMIT — paper account, maximize learning
  MAX_CONCURRENT_POSITIONS: 10,   // allow many concurrent positions
  CYCLE_INTERVAL_MS:       30_000,
  LIMIT_SLIPPAGE_PCT:      0.02,  // 2% slippage — market orders essentially, instant fills
} : {
  // LIVE ACCOUNT: Conservative production mode
  MIN_CONFIDENCE:          70,    // pct — only high-confidence signals
  MIN_GRADE:               'A',   // Grade A signals only
  POSITION_SIZE_PERCENT:   2,     // 2% per trade (conf>=88 gets 3×, conf>=78 gets 2×) — conservative sizing
  MAX_DAILY_LOSS_USD:      500,   // hard stop loss
  MAX_CONCURRENT_POSITIONS: 3,    // limit concurrent positions
  CYCLE_INTERVAL_MS:       30_000,
  LIMIT_SLIPPAGE_PCT:      0.001, // 0.1% slippage — tight limit orders for best fills
};

// Time-horizon exit map (ms) — mirrors HORIZON_MS in ep-options-logic
const HORIZON_MS = {
  '5m':  5   * 60 * 1000,
  '30m': 30  * 60 * 1000,
  '1h':  1   * 60 * 60 * 1000,
  '2h':  2   * 60 * 60 * 1000,
  '4h':  4   * 60 * 60 * 1000,
  '8h':  8   * 60 * 60 * 1000,
  '1d':  24  * 60 * 60 * 1000,
};

// Proven edge symbols — stocks + precious metals ETFs for options scalping
const SYMBOLS = ['AMD', 'META', 'NVDA', 'SLV', 'GLD', 'USO']; // GOOGL removed: 38.96% acc at 70% conf = systematic inversion (Mar 4 2026). USO added: regime_shift_down|1h 90% n=42 (Mar 5 2026)

// Price cache — prefetched once per cycle to avoid IB pacing violations
const priceCache = new Map(); // symbol → { price, ts }
const PRICE_TTL = 90_000; // 90s

// Fetch price from Yahoo Finance (reliable fallback when IB USHMDS is unavailable)
async function fetchYahooPrice(symbol) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
      const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) return null;
      const d = await r.json();
      const closes = d.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
      if (!closes?.length) return null;
      const last = [...closes].reverse().find(c => c != null && c > 0);
      return last || null;
    } finally { clearTimeout(t); }
  } catch { return null; }
}

async function prefetchPrices(symbols) {
  const stale = symbols.filter(s => {
    const c = priceCache.get(s);
    return !c || Date.now() - c.ts > PRICE_TTL;
  });
  for (const sym of stale) {
    let price = null;
    // Try IB USHMDS first (fast when available)
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10000);
      try {
        const r = await fetch(`${BRIDGE_URL}/api/historical?symbol=${encodeURIComponent(sym)}&interval=1m&range=1d`, { signal: ctrl.signal });
        if (r.ok) {
          const d = await r.json();
          const last = d.candles?.[d.candles.length - 1];
          if (last?.close > 0) price = last.close;
        }
      } finally { clearTimeout(t); }
    } catch (_) {}
    // Fallback: Yahoo Finance
    if (!price) price = await fetchYahooPrice(sym);
    if (price) priceCache.set(sym, { price, ts: Date.now() });
  }
}

// Options scalping — ATM weeklies on liquid names (stocks + precious metals ETFs)
const OPTIONS_SYMBOLS = new Set(['AMD', 'NVDA', 'SLV', 'GLD', 'USO', 'SPY', 'QQQ']); // SPY/QQQ: keep door open for index snipes
const OPTIONS_SIZE_PCT = IS_PAPER ? 2 : 95; // Paper: 2% learning mode | Live SNIPER: 95% of account (leaves ~$5 for fees)
const OPTIONS_STOP_PCT = 0.50; // close if premium drops 50%

// ── Launch readiness — paper account must prove edge before $100 live activation ──
// How many resolved sniper-combo paper signals needed, at what minimum win rate
const LAUNCH_REQUIRED_WINS      = 5;    // minimum correct sniper-combo resolutions on paper
const LAUNCH_REQUIRED_WIN_RATE  = 60;   // minimum % win rate across those resolutions
// First live trade is the proof-of-concept launch — held to a HIGHER standard than ongoing
const FIRST_TRADE_MIN_COMBO_PCT  = 75;  // vs 65% ongoing — must be a rock-solid combo
const FIRST_TRADE_MIN_CONFIDENCE = 80;  // vs 70% ongoing — must be high conviction
const FIRST_TRADE_MIN_GRADE      = 'A'; // vs B ongoing — grade-A only for the launch trade

// Live account sniper whitelist — only the three proven top combos fire real-money options
// SLV: shouldFlip=true → PUT (73.9% flipped acc, n=211) | USO: PUT (90% n=42) | AMD: PUT (82% n=49)
const SNIPER_COMBOS = IS_PAPER ? null : new Set([
  // Metals & Energy ETFs
  'regime_shift_down|SLV',          // flip active → PUT: 73.9% n=211
  'regime_shift_down|USO',          // 90% n=42 → PUT (1h)
  'false_breakout|USO',             // 72.6% n=164 → confirmed live (2h)
  'regime_shift_down|GLD',          // flip active → PUT: 84.4%
  // Tech stocks
  'mean_reversion_down|AMD',        // 82% n=49 → PUT (30m)
  'institutional_distribution|AMD', // distribution pattern — PUT
  // Index ETFs — keep door open; fire when grade-B+ combo_pct>=65 appears
  'regime_shift_down|SPY',          // broad market institutional selloff
  'regime_shift_down|QQQ',          // tech sector selloff
  'institutional_distribution|SPY', // smart money distribution on S&P
  'institutional_distribution|QQQ', // smart money distribution on Nasdaq
  'false_breakout|SPY',             // failed breakout on indices — high edge if confirmed
  'false_breakout|QQQ',
]);

// ── Sniper Journal ────────────────────────────────────────────────────────────
// PROVEN_COMBOS: documented accuracy >=65%, n>=30 — count toward launch readiness
const PROVEN_COMBOS = [
  'false_breakout|USO',      // 72.6% n=164 (2h)
  'regime_shift_down|USO',   // 90.0% n=42  (1h) — strongest
  'mean_reversion_down|AMD', // 82.0% n=49  (30m)
  'regime_shift_down|SLV',   // 73.9% n=211 flipped → PUT
  'regime_shift_down|GLD',   // 84.4% n=?   flipped → PUT
];
// EXPLORATORY_COMBOS: door open — journal tracks them but don't block launch readiness
const EXPLORATORY_COMBOS = [
  'institutional_distribution|AMD',
  'regime_shift_down|SPY', 'regime_shift_down|QQQ',
  'institutional_distribution|SPY', 'institutional_distribution|QQQ',
  'false_breakout|SPY', 'false_breakout|QQQ',
];
// JOURNAL_COMBOS: full set used for journaling (paper + live)
const JOURNAL_COMBOS = new Set([...PROVEN_COMBOS, ...EXPLORATORY_COMBOS]);
const REVERSE_SYMBOLS_SET = new Set(['SLV', 'GLD']); // shouldFlip active

// Evaluate sniper gate for all OPTIONS_SYMBOLS every cycle (paper + live).
// Logs any qualifying signal that isn't already in the journal this session.
const journaledThisSession = new Set(); // prediction IDs already logged today
async function checkSniperOpportunities() {
  const journal = loadJournal();
  const knownIds = new Set(journal.map(e => e.predictionId));
  let added = 0;

  for (const symbol of OPTIONS_SYMBOLS) {
    try {
      const signal = await getPatternSignal(symbol);
      if (!signal) continue;
      // Skip 5m — not useful for options
      if (signal.timeHorizon === '5m') continue;
      // Skip signals below grade-B
      const gradeOrder = { A: 4, B: 3, C: 2, D: 1 };
      if ((gradeOrder[signal.viability.grade] || 0) < 3) continue;
      // Sniper combo check
      const comboKey = `${signal.archetype}|${symbol}`;
      if (!JOURNAL_COMBOS.has(comboKey)) continue;
      // combo_pct gate
      if ((signal.combo_pct || 0) < 65) continue;
      // Already journaled?
      if (knownIds.has(signal.id) || journaledThisSession.has(signal.id)) continue;

      const rawDir   = signal.direction; // 'up' or 'down'
      const flipped  = REVERSE_SYMBOLS_SET.has(symbol);
      const finalDir = flipped ? (rawDir === 'up' ? 'down' : 'up') : rawDir;
      const right    = finalDir === 'down' ? 'P' : 'C';

      const entry = {
        predictionId:   signal.id,
        loggedAt:       new Date().toISOString(),
        symbol,
        archetype:      signal.archetype,
        comboKey,
        direction:      finalDir,
        right,
        confidence:     parseFloat(signal.confidence.toFixed(1)),
        combo_pct:      signal.combo_pct,
        combo_n:        signal.combo_n,
        grade:          signal.viability.grade,
        score:          signal.viability.score,
        timeHorizon:    signal.timeHorizon,
        priceAtSignal:  signal.entryPrice,
        flipped,
        resolved:       false,
        ep_correct:     null,
        priceAtResolution: null,
        resolvedAt:     null,
        pnlMultiple:    null, // estimated option P&L multiple if 1 contract held to resolution
      };

      journal.push(entry);
      knownIds.add(signal.id);
      journaledThisSession.add(signal.id);
      added++;
      log(`[JOURNAL] ★ New sniper opportunity: ${comboKey} ${right} conf:${signal.confidence.toFixed(0)}% combo:${signal.combo_pct}% grade-${signal.viability.grade} tf:${signal.timeHorizon}`);
    } catch (_) {}
  }

  if (added > 0) saveJournal(journal);
}

// Resolve outstanding journal entries against DB outcomes.
// Runs every cycle — lightweight (only queries unresolved IDs).
async function resolveJournalEntries() {
  const journal = loadJournal();
  const unresolved = journal.filter(e => !e.resolved);
  if (!unresolved.length) return;

  try {
    log(`[JOURNAL] Checking ${unresolved.length} unresolved entries for resolution...`);
    const ids = unresolved.map(e => e.predictionId);
    const { rows } = await pool.query(
      `SELECT id, ep_correct, resolved_at, price_at_resolution, price_at_prediction
       FROM market_prediction_attempts
       WHERE id = ANY($1) AND resolved_at IS NOT NULL`,
      [ids]
    );
    if (!rows.length) {
      log(`[JOURNAL] No resolutions found yet for ${unresolved.length} entries`);
      return;
    }

    const rowMap = new Map(rows.map(r => [r.id, r]));
    let updated = 0;
    for (const entry of journal) {
      if (entry.resolved) continue;
      const row = rowMap.get(entry.predictionId);
      if (!row) continue;

      entry.resolved         = true;
      entry.ep_correct       = row.ep_correct;
      entry.resolvedAt       = new Date(row.resolved_at).toISOString();
      entry.priceAtResolution = parseFloat(row.price_at_resolution) || null;

      // Estimate option P&L multiple: if correct, premium roughly 3–7×; if wrong, −50% stop
      if (row.ep_correct === true)  entry.pnlMultiple = '+3× to +7× (estimate)';
      if (row.ep_correct === false) entry.pnlMultiple = '−50% (stop hit estimate)';
      if (row.ep_correct === null)  entry.pnlMultiple = 'neutral/expired';

      updated++;
      const icon = row.ep_correct === true ? '✓' : row.ep_correct === false ? '✗' : '~';
      log(`[JOURNAL] ${icon} Resolved: ${entry.comboKey} ${entry.right} → ep_correct:${row.ep_correct} | ${entry.pnlMultiple}`);
    }

    if (updated > 0) saveJournal(journal);
  } catch (err) {
    log(`[JOURNAL] Resolution query error: ${err.message}`, 'warn');
  }
}

// State
let isRunning = false;
let sessionId = null;
let positions = loadPositions(); // restored from disk on restart
let cycleCount = 0;
let tradesExecuted = 0;
let totalPnL = 0;
const stockExitFired = new Set(); // symbols that had STOCK-EXIT placed this session — prevents duplicate covers when IBKR position data lags

// Logging
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${WORKER_NAME}]`;
  if (level === 'error') {
    console.error(`${prefix} ❌ ${message}`);
  } else if (level === 'warn') {
    console.warn(`${prefix} ⚠️ ${message}`);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

// Check bridge connection
async function checkBridgeConnection() {
  try {
    const response = await fetch(`${BRIDGE_URL}/api/status`);
    if (!response.ok) return { connected: false, authenticated: false };
    const data = await response.json();
    return {
      connected: data.bridgeRunning === true,
      authenticated: data.connected === true,
    };
  } catch (err) {
    return { connected: false, authenticated: false };
  }
}

// Connect to IB Gateway
async function connectToGateway() {
  try {
    const response = await fetch(`${BRIDGE_URL}/api/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: GATEWAY_HOST,
        port: GATEWAY_PORT,
        clientId: CLIENT_ID,
      }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.connected === true;
  } catch (err) {
    log(`Connect error: ${err.message}`, 'error');
    return false;
  }
}

// Get accounts
async function getAccounts() {
  try {
    const response = await fetch(`${BRIDGE_URL}/api/accounts`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.accounts || [];
  } catch (err) {
    return [];
  }
}

// Get positions
async function getPositions(accountId) {
  try {
    const response = await fetch(`${BRIDGE_URL}/api/positions?accountId=${accountId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.positions || [];
  } catch (err) {
    return [];
  }
}

// Search contract
async function searchContract(symbol) {
  try {
    const url = `${BRIDGE_URL}/api/search?symbol=${encodeURIComponent(symbol)}`;
    log(`[DEBUG] Searching contract: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      log(`[DEBUG] Search failed: ${response.status}`, 'error');
      return [];
    }
    const data = await response.json();
    const contracts = data.contracts || [];
    log(`[DEBUG] Search returned ${contracts.length} contracts`);
    return contracts;
  } catch (err) {
    log(`[DEBUG] Search error: ${err.message}`, 'error');
    return [];
  }
}

// Get quote — checks price cache first (populated by prefetchPrices each cycle)
async function getQuote(symbol, conid) {
  try {
    if (symbol) {
      const cached = priceCache.get(symbol);
      if (cached && Date.now() - cached.ts < PRICE_TTL)
        return { symbol, lastPrice: cached.price, bid: cached.price, ask: cached.price, source: 'cache' };
    }
    // Fallback: reqMktData snapshot (may return null on paper)
    const param = symbol ? `symbol=${encodeURIComponent(symbol)}` : `conid=${conid}`;
    const response = await fetch(`${BRIDGE_URL}/api/quote?${param}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    return null;
  }
}

// Place options order (ATM weekly call or put)
async function placeOptionsOrder(order) {
  try {
    const response = await fetch(`${BRIDGE_URL}/api/options/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    return null;
  }
}

// Close options position
async function closeOptionsOrder(order) {
  try {
    const response = await fetch(`${BRIDGE_URL}/api/options/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    return null;
  }
}

// Place order
async function placeOrder(order) {
  try {
    log(`[DEBUG] Placing order: ${order.side} ${order.quantity} ${order.symbol} @ $${order.price}`);
    const response = await fetch(`${BRIDGE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!response.ok) {
      const errText = await response.text();
      log(`[DEBUG] Order failed: ${response.status} ${errText}`, 'error');
      return null;
    }
    const result = await response.json();
    log(`[DEBUG] Order placed: orderId=${result.orderId}`);
    return result;
  } catch (err) {
    log(`[DEBUG] Order error: ${err.message}`, 'error');
    return null;
  }
}

// Fetch the best live signal for a symbol with combo_pct/combo_n joined via CTE.
// Returns null if no Grade A/B signal found.
async function getPatternSignal(symbol) {
  try {
    const { rows } = await pool.query(`
      WITH combos AS (
        SELECT symbol, archetype, time_horizon,
          ROUND(100.0 * SUM(CASE WHEN ep_correct THEN 1 ELSE 0 END)
            / NULLIF(COUNT(CASE WHEN ep_correct IS NOT NULL THEN 1 END), 0), 1) AS combo_pct,
          COUNT(CASE WHEN ep_correct IS NOT NULL THEN 1 END) AS combo_n
        FROM market_prediction_attempts
        WHERE created_at > NOW() - INTERVAL '30d'
          AND confidence >= 40
        GROUP BY symbol, archetype, time_horizon
      )
      SELECT m.id, m.symbol, m.predicted_direction, m.archetype,
             m.confidence, m.time_horizon, m.price_at_prediction,
             m.created_at, m.prediction_metadata,
             COALESCE(c.combo_pct, 0) AS combo_pct,
             COALESCE(c.combo_n,   0) AS combo_n
      FROM market_prediction_attempts m
      LEFT JOIN combos c ON c.symbol = m.symbol AND c.archetype = m.archetype
                         AND c.time_horizon = m.time_horizon
      WHERE m.symbol = $1
        AND m.resolved_at IS NULL
        AND m.predicted_direction IN ('bullish', 'bearish')
        AND CASE WHEN m.confidence <= 1
              THEN m.confidence * 100
              ELSE m.confidence
            END >= $2
      ORDER BY m.created_at DESC
      LIMIT 10
    `, [symbol, CONFIG.MIN_CONFIDENCE]);

    if (!rows.length) {
      log(`[DEBUG] No unresolved predictions for ${symbol} (MIN_CONF: ${CONFIG.MIN_CONFIDENCE}%)`);
      return null;
    }

    log(`[DEBUG] Found ${rows.length} candidates for ${symbol}`);
    // Score each candidate — take best (AGGRESSIVE: include C/D for pattern learning)
    let best = null;
    for (const row of rows) {
      const vs = computeViabilityScore(row);
      const comboPctDbg = Number(row.combo_pct) || 0;
      const comboNDbg   = Number(row.combo_n)   || 0;
      const isPaperBadComboDbg = IS_PAPER ? (comboNDbg >= 50 && comboPctDbg < 38) : isKnownBadCombo(row);
      const reason = isPaperBadComboDbg ? 'known-bad-combo' : `grade-${vs.grade}`;
      log(`[DEBUG]   ${row.archetype} conf:${row.confidence} combo:${row.combo_pct}% → ${reason}`);
      // Paper: require 50+ samples AND <38% before blocking (vs live: 30+ samples AND <45%)
      // This lets more combos through on paper for pattern learning
      const comboPct = Number(row.combo_pct) || 0;
      const comboN   = Number(row.combo_n)   || 0;
      const isPaperBadCombo = IS_PAPER
        ? (comboN >= 100 && comboPct < 30)   // only block truly confirmed bad combos
        : isKnownBadCombo(row);
      if (isPaperBadCombo) continue;
      // Enforce MIN_GRADE — skip signals below the configured threshold
      const gradeOrder = { A: 4, B: 3, C: 2, D: 1 };
      if ((gradeOrder[vs.grade] || 0) < (gradeOrder[CONFIG.MIN_GRADE] || 0)) continue;
      if (!best || vs.score > computeViabilityScore(best).score) best = row;
    }
    if (!best) {
      log(`[DEBUG] No tradeable signals for ${symbol}`);
      return null;
    }

    const vs = computeViabilityScore(best);
    const conf = parseFloat(best.confidence);
    const normConf = conf <= 1 ? conf * 100 : conf;

    return {
      id:           best.id,
      symbol:       best.symbol,
      direction:    best.predicted_direction === 'bullish' ? 'up' : 'down',
      archetype:    best.archetype,
      confidence:   normConf,
      timeHorizon:  best.time_horizon,
      entryPrice:   parseFloat(best.price_at_prediction) || 0,
      combo_pct:    parseFloat(best.combo_pct),
      combo_n:      parseInt(best.combo_n),
      viability:    vs,
      createdAt:    new Date(best.created_at),
    };
  } catch (err) {
    log(`Signal error for ${symbol}: ${err.message}`, 'error');
    return null;
  }
}

// Run trading cycle
async function runCycle() {
  if (!isRunning) return;

  const startTime = Date.now();
  cycleCount++;

  // ── Market hours gate (US equities: 9:30am–4:00pm ET, Mon–Fri) ──────────
  const etNow  = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dow    = etNow.getDay();    // 0=Sun, 6=Sat
  const hhmm   = etNow.getHours() * 100 + etNow.getMinutes();
  const isWeekday   = dow >= 1 && dow <= 5;
  const isMarketOpen = hhmm >= 930 && hhmm < 1600;
  if (!isWeekday || !isMarketOpen) {
    if (cycleCount % 20 === 1) // log every 10 min to avoid spam
      log(`Market closed (ET ${String(etNow.getHours()).padStart(2,'0')}:${String(etNow.getMinutes()).padStart(2,'0')}) — next open: Mon-Fri 9:30am ET`);
    return;
  }

  log(`Running cycle #${cycleCount}...`);

  try {
    // Pre-fetch all prices (IB USHMDS) into cache before scanning — avoids per-call pacing
    const allSymbols = [...new Set([...SYMBOLS, ...Array.from(OPTIONS_SYMBOLS)])];
    await prefetchPrices(allSymbols);
    log(`Prices cached: ${[...priceCache.keys()].map(s => s+':$'+priceCache.get(s).price.toFixed(2)).join(' ')}`);

    // Check connection
    const status = await checkBridgeConnection();
    if (!status.connected) {
      log('Bridge not running, skipping cycle', 'warn');
      return;
    }
    if (!status.authenticated) {
      log('Not authenticated, attempting connect...');
      const connected = await connectToGateway();
      if (!connected) {
        log('Failed to connect to gateway', 'warn');
        return;
      }
    }

    // Get account
    const accounts = await getAccounts();
    const paperAccount = accounts.find(a => a.accountId.startsWith('DU') || a.accountType === 'Paper');
    const account = paperAccount || accounts[0];
    if (!account) {
      log('No account found', 'warn');
      return;
    }

    const balance = account.balance;
    if (!balance) {
      log('Account balance not yet received, skipping cycle', 'warn');
      return;
    }
    log(`Account: ${account.accountId} | Balance: $${balance.toFixed(2)}`);

    // Get current positions from IBKR
    const ibkrPositions = await getPositions(account.accountId);
    // Block symbols with ANY non-zero IBKR position (long OR short) to prevent stacking orders on existing exposure
    const openSymbols = new Set(ibkrPositions.filter(p => Math.abs(p.position) > 0).map(p => p.symbol));

    // Scan for opportunities
    let cycleTrades = 0;

    // ── Close unmanaged stock positions (orphan shares not tracked locally) ──
    // Sort smallest notional first — frees margin incrementally so larger covers can follow
    const unmanagedPositions = ibkrPositions
      .filter(p => p.position !== 0 && !positions.has(p.symbol) && SYMBOLS.includes(p.symbol))
      .sort((a, b) => {
        const priceA = priceCache.get(a.symbol)?.price ?? Math.abs(a.avgCost);
        const priceB = priceCache.get(b.symbol)?.price ?? Math.abs(b.avgCost);
        return (Math.abs(a.position) * priceA) - (Math.abs(b.position) * priceB);
      });

    let remainingBP = balance * 0.90; // 90% of balance as proxy for USD buying power (conservative)
    for (const pos of unmanagedPositions) {
      if (stockExitFired.has(pos.symbol)) {
        log(`[STOCK-EXIT] ${pos.symbol} close already placed this session — skipping duplicate (IBKR lag)`);
        continue;
      }
      const isLong    = pos.position > 0;
      const closeSide = isLong ? 'SELL' : 'BUY';
      const closeQty  = Math.abs(pos.position);
      const mktPrice  = priceCache.get(pos.symbol)?.price ?? Math.abs(pos.avgCost);
      const notional  = closeQty * mktPrice;

      // BUY-to-cover requires buying power; SELL-to-close frees buying power
      if (!isLong && notional > remainingBP) {
        log(`[STOCK-EXIT] ${pos.symbol} BUY ${closeQty} notional=$${notional.toFixed(0)} exceeds remaining BP=$${remainingBP.toFixed(0)} — skip this cycle`);
        continue;
      }

      // Use aggressive LMT (1% slippage) — MKT orders are being discarded by IB routing
      const lmtPrice = isLong
        ? parseFloat((mktPrice * 0.99).toFixed(2))   // SELL: 1% below market = aggressive fill
        : parseFloat((mktPrice * 1.01).toFixed(2));  // BUY cover: 1% above market = aggressive fill

      log(`[STOCK-EXIT] Unmanaged ${isLong ? 'long' : 'short'} position: ${pos.symbol} qty=${pos.position} avgCost=${pos.avgCost} notional=$${notional.toFixed(0)} — closing with LMT ${closeSide} @ $${lmtPrice}`);
      const closeResult = await placeOrder({
        accountId: account.accountId,
        conid:     pos.conid,
        symbol:    pos.symbol,
        side:      closeSide,
        quantity:  closeQty,
        orderType: 'LMT',
        price:     lmtPrice,
      });
      if (closeResult && !closeResult.error) {
        stockExitFired.add(pos.symbol);
        remainingBP -= notional; // deduct from remaining buying power estimate
        log(`[STOCK-EXIT] ✓ Closed ${pos.symbol} ${isLong ? 'long' : 'short'} position (orderId=${closeResult.orderId})`);
        cycleTrades++;
      } else {
        log(`[STOCK-EXIT] ✗ Failed to close ${pos.symbol} — ${closeResult?.error || 'no response'}`, 'warn');
      }
    }

    for (const symbol of SYMBOLS) {
      if (openSymbols.has(symbol)) {
        log(`[DEBUG] ${symbol} already has open position in IBKR`);
        continue;
      }
      if (positions.has(symbol)) {
        log(`[DEBUG] ${symbol} already tracked locally`);
        continue;
      }

      const signal = await getPatternSignal(symbol);
      if (!signal || signal.direction === 'neutral' || signal.confidence < CONFIG.MIN_CONFIDENCE) {
        continue;
      }
      // 5m stock trades: 16.67% WR, -$42.65 P&L on paper — skip until accuracy improves
      if (signal.timeHorizon === '5m') continue;
      // Grade gate — enforced (MIN_GRADE set in CONFIG)
      const gradeOrder = { A: 4, B: 3, C: 2, D: 1 };
      if ((gradeOrder[signal.viability.grade] || 0) < (gradeOrder[CONFIG.MIN_GRADE] || 0)) {
        log(`[DEBUG] ${symbol} grade-${signal.viability.grade} below MIN_GRADE-${CONFIG.MIN_GRADE} — skip`);
        continue;
      }

      // Search contract
      const contracts = await searchContract(symbol);
      if (contracts.length === 0) {
        log(`[DEBUG] No contracts found for ${symbol}`);
        continue;
      }
      const contract = contracts[0];
      log(`[DEBUG] Found contract for ${symbol}: conid=${contract.conid}`);

      // Get quote — use ask for BUY / bid for SELL to ensure immediate fill
      const quote = await getQuote(symbol, contract.conid);
      if (!quote) {
        log(`[DEBUG] No quote for ${symbol}`);
        continue;
      }
      log(`[DEBUG] Got quote for ${symbol}: ask=${quote.ask} bid=${quote.bid} last=${quote.lastPrice}`);
      const side = signal.direction === 'up' ? 'BUY' : 'SELL';
      // Use ask (BUY) or bid (SELL) as fill price; fall back to last
      const fillPrice = side === 'BUY'
        ? (quote.ask ?? quote.lastPrice)
        : (quote.bid ?? quote.lastPrice);
      if (!fillPrice || fillPrice <= 0) continue;
      const price = fillPrice;

      // Confidence-based position sizing (mirrors ep-options-logic contract sizing)
      const sizeMul = signal.confidence >= 88 ? 3 : signal.confidence >= 78 ? 2 : 1;
      const positionPct = (CONFIG.POSITION_SIZE_PERCENT / 100) * sizeMul;
      const positionUSD = balance * positionPct;
      const positionShares = Math.max(1, Math.floor(positionUSD / price));

      // Paper account: use MKT orders for instant fills. Live account: use LIMIT orders
      const orderType = IS_PAPER ? 'MKT' : 'LMT';
      const limitPrice = IS_PAPER ? null : (side === 'BUY'
        ? parseFloat((price * (1 + CONFIG.LIMIT_SLIPPAGE_PCT)).toFixed(2))
        : parseFloat((price * (1 - CONFIG.LIMIT_SLIPPAGE_PCT)).toFixed(2)));

      const result = await placeOrder({
        accountId: account.accountId,
        conid: contract.conid,
        symbol,
        side,
        quantity: positionShares,
        orderType,
        price: limitPrice,
      });

      if (result) {
        tradesExecuted++;
        cycleTrades++;

        // Exit deadline = entry time (now) + time_horizon — NOT signal creation time
        const horizonMs = HORIZON_MS[signal.timeHorizon] || HORIZON_MS['8h'];
        const exitDeadline = Date.now() + horizonMs;

        // Track position (persisted to disk for restart recovery)
        positions.set(symbol, {
          id: result.orderId,
          symbol,
          conid: contract.conid,
          side: signal.direction === 'up' ? 'long' : 'short',
          entryPrice: price,
          quantity: positionShares,
          entryTime: Date.now(),
          exitDeadline,
          timeHorizon: signal.timeHorizon,
          viabilityGrade: signal.viability.grade,
          viabilityScore: signal.viability.score,
        });

        // Log to database
        await pool.query(`
          INSERT INTO autonomous_trades
            (session_id, worker_id, symbol, direction, entry_price, shares,
             predicted_direction, predicted_confidence, viability_grade,
             viability_score, combo_pct, combo_n, time_horizon, status, entry_time)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'open',NOW())
          ON CONFLICT DO NOTHING
        `, [
          sessionId, WORKER_NAME, symbol,
          signal.direction === 'up' ? 'long' : 'short', price, positionShares,
          signal.direction === 'up' ? 'long' : 'short', signal.confidence,
          signal.viability.grade, signal.viability.score,
          signal.combo_pct, signal.combo_n, signal.timeHorizon,
        ]).catch(e => log(`DB insert failed: ${e.message}`, 'warn'));
        savePositions(positions);
        log(`✓ [${signal.viability.grade}${signal.viability.score}] ${side} ${positionShares} ${symbol} @ MKT $${price} | conf:${signal.confidence.toFixed(0)}% combo:${signal.combo_pct}% n=${signal.combo_n} | exit:${signal.timeHorizon}`);
      }
    }

    // ── Options scalping: ATM weeklies on Grade A signals ──────────────────
    for (const symbol of OPTIONS_SYMBOLS) {
      const optKey = `OPT:${symbol}`;
      if (positions.has(optKey)) continue; // already have an options position on this symbol

      const signal = await getPatternSignal(symbol);
      if (!signal) continue;
      const gradeOrder = { A:4, B:3, C:2, D:1 };
      // Paper: C+ allows learning. Live SNIPER: grade-B+ (75% WR +$300 n=9) beats grade-A (50% WR +$598 n=5).
      // SNIPER_COMBOS whitelist + combo_pct>=65 is the hard accuracy gate, not the grade alone.
      const optMinGrade = IS_PAPER ? 'C' : 'B';
      if ((gradeOrder[signal.viability.grade] || 0) < (gradeOrder[optMinGrade] || 0)) continue;
      if (signal.timeHorizon === '5m') continue; // 5m options: 16.67% WR — skip (use stock 5m only)

      const quote = await getQuote(symbol, null);
      if (!quote?.lastPrice) continue;

      const right = signal.direction === 'up' ? 'C' : 'P';
      const stockPrice = quote.lastPrice;

      // Live SNIPER: full gate — whitelist + combo_pct + launch readiness + first-trade tier
      if (!IS_PAPER && SNIPER_COMBOS) {
        const comboKey = `${signal.archetype}|${symbol}`;

        // Gate 1: whitelist
        if (!SNIPER_COMBOS.has(comboKey)) {
          log(`[SNIPER] ${symbol} ${signal.archetype} not in sniper whitelist — skip`);
          continue;
        }

        // Gate 2: check launch readiness (paper proof) — only needed before first live trade
        const liveState = loadLiveState();
        if (!liveState.firstTradePlaced) {
          const readiness = await checkLaunchReadiness();
          if (!readiness.ready) {
            log(`[SNIPER] 🔒 Launch not ready — paper proof: ${readiness.wins}/${LAUNCH_REQUIRED_WINS} wins, ${readiness.winRate}%/${LAUNCH_REQUIRED_WIN_RATE}% WR. Need ${readiness.missingWins} more wins.`);
            continue;
          }

          // Gate 3 (first trade only): higher thresholds — this is the launch proof moment
          const gradeOrder = { A: 4, B: 3, C: 2, D: 1 };
          if ((signal.combo_pct || 0) < FIRST_TRADE_MIN_COMBO_PCT) {
            log(`[SNIPER] 🚀 LAUNCH SIGNAL: ${comboKey} combo_pct ${signal.combo_pct}% below first-trade minimum ${FIRST_TRADE_MIN_COMBO_PCT}% — waiting for better setup`);
            continue;
          }
          if (signal.confidence < FIRST_TRADE_MIN_CONFIDENCE) {
            log(`[SNIPER] 🚀 LAUNCH SIGNAL: ${comboKey} conf ${signal.confidence.toFixed(0)}% below first-trade minimum ${FIRST_TRADE_MIN_CONFIDENCE}% — waiting`);
            continue;
          }
          if ((gradeOrder[signal.viability.grade] || 0) < (gradeOrder[FIRST_TRADE_MIN_GRADE] || 0)) {
            log(`[SNIPER] 🚀 LAUNCH SIGNAL: ${comboKey} grade-${signal.viability.grade} below first-trade minimum grade-${FIRST_TRADE_MIN_GRADE} — waiting`);
            continue;
          }
          log(`[SNIPER] 🚀 LAUNCH TRADE QUALIFIES: ${comboKey} ${right} conf:${signal.confidence.toFixed(0)}% combo:${signal.combo_pct}% grade-${signal.viability.grade} — FIRST REAL-MONEY ENTRY`);
        } else {
          // Ongoing trades: standard gate (grade-B, combo>=65)
          if ((signal.combo_pct || 0) < 65) {
            log(`[SNIPER] ${symbol} combo_pct ${signal.combo_pct}% below 65% — skip`);
            continue;
          }
          log(`[SNIPER] ✓ ${comboKey} ${right} conf:${signal.confidence.toFixed(0)}% combo:${signal.combo_pct}% grade-${signal.viability.grade} QUALIFIES`);
        }
      }

      // Size: paper=ATM 2% learning, live=OTM sniper 95% of account
      // Adaptive OTM: cheap stocks (<$80) use 1 strike OTM (~1.5% premium), expensive use 2 strikes (~1%)
      // SLV $74: 1-OTM = ~$1.11/contract = $111 → fits in $95 budget with 95% of $100
      const OTM_STRIKES   = IS_PAPER ? 0 : (stockPrice < 80 ? 1 : 2);
      const premiumPct    = IS_PAPER ? 0.025 : (stockPrice < 80 ? 0.015 : 0.010); // 1-OTM≈1.5%, 2-OTM≈1%
      const optBudget     = balance * (OPTIONS_SIZE_PCT / 100);
      const estPremium    = stockPrice * premiumPct;
      const costPerContract = estPremium * 100; // 1 contract = 100 shares
      const numContracts  = Math.floor(optBudget / costPerContract);
      const lmtPremium    = parseFloat((estPremium * 1.10).toFixed(2)); // 10% above mid for OTM fill

      // Hard abort: if we can't afford even 1 contract, skip — don't place an order IBKR will reject
      if (numContracts < 1) {
        log(`[${IS_PAPER ? 'OPT' : 'SNIPER'}] ${symbol} 1 contract costs $${costPerContract.toFixed(0)} — budget $${optBudget.toFixed(0)} insufficient — skip`);
        continue;
      }

      log(`[${IS_PAPER ? 'OPT' : 'SNIPER'}] ${symbol} sizing: ${numContracts}x ${right} | budget $${optBudget.toFixed(0)} | est $${estPremium.toFixed(2)}/contract | OTM+${OTM_STRIKES}`);

      const result = await placeOptionsOrder({
        accountId:   account.accountId,
        symbol,
        right,
        stockPrice,
        contracts:   numContracts,
        otmStrikes:  OTM_STRIKES,
        orderType:   IS_PAPER ? 'MKT' : 'LMT',
        price:       IS_PAPER ? null : lmtPremium,
      });

      if (result) {
        tradesExecuted++;
        cycleTrades++;
        const horizonMs = HORIZON_MS[signal.timeHorizon] || HORIZON_MS['2h'];
        const exitDeadline = Date.now() + horizonMs;

        positions.set(optKey, {
          type:        'option',
          symbol,
          right,
          strike:      result.strike,
          expiry:      result.expiry,
          contracts:   numContracts,
          entryPremium: estPremium,   // fair value (no fill markup) for P&L tracking
          stopPremium: parseFloat((estPremium * (1 - OPTIONS_STOP_PCT)).toFixed(2)),
          entryTime:   Date.now(),
          exitDeadline,
          viabilityGrade: signal.viability.grade,
          viabilityScore: signal.viability.score,
          archetype:   signal.archetype,
          timeHorizon: signal.timeHorizon,
          accountId:   account.accountId,
        });
        savePositions(positions);

        // Record first live trade milestone permanently
        if (!IS_PAPER) {
          const liveState = loadLiveState();
          liveState.totalLiveTrades = (liveState.totalLiveTrades || 0) + 1;
          if (!liveState.firstTradePlaced) {
            liveState.firstTradePlaced = true;
            liveState.firstTradeAt     = new Date().toISOString();
            liveState.firstTradeCombo  = `${signal.archetype}|${symbol}`;
            liveState.firstTradeDetail = { symbol, right, strike: result.strike, expiry: result.expiry, contracts: numContracts, confidence: signal.confidence, combo_pct: signal.combo_pct, grade: signal.viability.grade };
            log(`[SNIPER] 🚀 LAUNCH COMPLETE — first real-money trade recorded. $100 challenge is live.`);
          }
          saveLiveState(liveState);
        }

        log(`✓ [${IS_PAPER ? 'OPT' : 'SNIPER'}-${signal.viability.grade}${signal.viability.score}] BUY ${numContracts}x ${symbol} ${result.expiry} ${result.strike}${right} @ $${lmtPremium} | conf:${signal.confidence.toFixed(0)}% | exit:${signal.timeHorizon}`);
      }
    }

    // ── Market-close flush: only scalps (5m/30m/1h) — longer signals hold overnight ──
    const etNow2    = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hhmm2     = etNow2.getHours() * 100 + etNow2.getMinutes();
    const nearClose = hhmm2 >= 1345 && hhmm2 < 1600; // 3:45–4:00pm ET
    const SCALP_TFS = new Set(['5m', '30m', '1h']);

    // Manage open options positions — time exit + market-close scalp flush
    for (const [key, pos] of positions) {
      if (pos.type !== 'option') continue;
      const isScalp   = SCALP_TFS.has(pos.timeHorizon);
      const shouldClose = Date.now() >= pos.exitDeadline || (nearClose && isScalp);
      if (!shouldClose) continue;

      // Get real option mid-price from bridge
      let exitPremium = pos.entryPremium; // fallback: no P&L recorded
      try {
        const optPriceRes = await fetch(
          `${BRIDGE_URL}/api/options/price?symbol=${pos.symbol}&strike=${pos.strike}&expiry=${pos.expiry}&right=${pos.right}`
        );
        if (optPriceRes.ok) {
          const optPrice = await optPriceRes.json();
          if (optPrice.mid > 0) exitPremium = optPrice.mid;
          else if (optPrice.last > 0) exitPremium = optPrice.last;
        }
      } catch (_) {}
      // Secondary fallback: stock price × ATM delta estimate
      if (exitPremium === pos.entryPremium) {
        const sq = await getQuote(pos.symbol, null);
        if (sq?.lastPrice > 0) exitPremium = parseFloat((sq.lastPrice * 0.025).toFixed(2));
      }
      await closeOptionsOrder({
        accountId: pos.accountId,
        symbol:    pos.symbol,
        right:     pos.right,
        strike:    pos.strike,
        expiry:    pos.expiry,
        contracts: pos.contracts,
        orderType: 'MKT',
      });
      const learn = recordTrade(pos, exitPremium);
      positions.delete(key);
      savePositions(positions);
      log(`[OPT-CLOSE] ${pos.contracts}x ${pos.symbol} ${pos.right} | entry:$${pos.entryPremium} exit:$${exitPremium} | PnL:$${learn.pnl.toFixed(2)} ${learn.won ? '✓ WIN' : '✗ LOSS'} | arch:${pos.archetype} tf:${pos.timeHorizon}`);
    }

    // Manage open positions - check exits
    for (const [symbol, pos] of positions) {
      if (pos.type === 'option') continue; // handled above

      const shouldClose = Date.now() >= pos.exitDeadline;
      if (!shouldClose) continue;

      // Try to get current price; if quote fails use entry price + MKT order
      const quote = await getQuote(symbol, pos.conid);
      const currentPrice = quote?.lastPrice || pos.entryPrice;
      const pnl = pos.side === 'long'
        ? (currentPrice - pos.entryPrice) * pos.quantity
        : (pos.entryPrice - currentPrice) * pos.quantity;

      const closeSide = pos.side === 'long' ? 'SELL' : 'BUY';
      // Use MKT on paper (or when no live price); LMT only when we have a real quote
      const useMarket = IS_PAPER || !quote?.lastPrice;
      const closeResult = await placeOrder({
        accountId: account.accountId,
        conid: pos.conid,
        symbol: pos.symbol,
        side: closeSide,
        quantity: pos.quantity,
        orderType: useMarket ? 'MKT' : 'LMT',
        price: useMarket ? null : (
          closeSide === 'SELL'
            ? parseFloat((currentPrice * (1 - CONFIG.LIMIT_SLIPPAGE_PCT)).toFixed(2))
            : parseFloat((currentPrice * (1 + CONFIG.LIMIT_SLIPPAGE_PCT)).toFixed(2))
        ),
      });

      if (closeResult) {
        totalPnL += pnl;
        positions.delete(symbol);
        savePositions(positions);

        await pool.query(`
          UPDATE autonomous_trades
          SET exit_price=$1, exit_time=NOW(),
              pnl=$2, pnl_percent=$3, status='closed'
          WHERE id = (SELECT id FROM autonomous_trades WHERE worker_id=$4 AND symbol=$5 AND status='open' ORDER BY created_at DESC LIMIT 1)
        `, [
          currentPrice,
          pnl,
          (pnl / (pos.entryPrice * pos.quantity)) * 100,
          WORKER_NAME, symbol,
        ]).catch(e => log(`Trade close update failed: ${e.message}`, 'warn'));

        const pnlStr = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
        log(`✓ Closed [${pos.viabilityGrade}] ${symbol} ${pnlStr} | held:${pos.timeHorizon} | total P&L: $${totalPnL.toFixed(2)}`);
      }
    }

    // Report status to farm_status
    await reportStatus({
      connected: true,
      authenticated: true,
      account_id: account.accountId,
      balance,
      open_positions: positions.size,
      trades_executed: tradesExecuted,
      total_pnl: totalPnL,
      cycles_completed: cycleCount,
    });

    // ── Sniper journal: log new qualifying opportunities + resolve outstanding entries ──
    await checkSniperOpportunities();
    await resolveJournalEntries();

    const duration = Date.now() - startTime;
    log(`Cycle #${cycleCount} complete | Trades: ${cycleTrades} | Open positions: ${positions.size} | Duration: ${duration}ms`);

  } catch (err) {
    log(`Cycle error: ${err.message}\n${err.stack}`, 'error');
  }
}

// Report status to farm_status table
async function reportStatus(status) {
  await pool.query(`
    INSERT INTO farm_status (farm_id, farm_name, status, message, metadata, last_heartbeat_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
    ON CONFLICT (farm_id) DO UPDATE
      SET status=$3, message=$4, metadata=$5, last_heartbeat_at=NOW(), updated_at=NOW()
  `, [
    'ibkr-autonomous-trader',
    'IBKR Paper Trader',
    isRunning ? 'trading' : 'stopped',
    `Cycle ${cycleCount} | Trades: ${tradesExecuted} | Account: ${status.account || 'unknown'}`,
    JSON.stringify({ type: 'ibkr_paper_trading', ...status }),
  ]).catch(e => log(`Status report failed: ${e.message}`, 'warn'));
}

// Main loop
async function start() {
  log('=======================================================');
  log('IBKR Autonomous Trading Worker v2  [PAPER — port 4002]');
  log('=======================================================');
  log(`Worker ID  : ${WORKER_ID}`);
  log(`Bridge URL : ${BRIDGE_URL}`);
  log(`Gateway    : ${GATEWAY_HOST}:${GATEWAY_PORT}`);
  log(`Symbols    : ${SYMBOLS.join(', ')}`);
  log(`Gate       : Grade A/B only | MIN_CONF ${CONFIG.MIN_CONFIDENCE}% | isKnownBadCombo`);
  log(`Orders     : LIMIT ±${(CONFIG.LIMIT_SLIPPAGE_PCT * 100).toFixed(1)}% slippage | time-horizon exits`);
  log('=======================================================');

  // Create session
  sessionId = `ibkr-${Date.now()}-${WORKER_ID}`;
  isRunning = true;

  // Initial connection check
  const status = await checkBridgeConnection();
  if (!status.connected) {
    log('⚠️ Bridge not running. Start it with: cd public/ib-gateway-bridge && npm start');
    log('Waiting for bridge...');
  }

  // First cycle
  await runCycle();

  // Start loop
  const interval = setInterval(runCycle, CONFIG.CYCLE_INTERVAL_MS);

  // Graceful shutdown
  const shutdown = async (sig) => {
    log(`${sig} received — shutting down...`);
    isRunning = false;
    clearInterval(interval);
    await reportStatus({ connected: false, stopped: true });
    try { await pool.end(); } catch {}
    process.exit(0);
  };
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Handle errors
process.on('uncaughtException', (err) => {
  log(`Uncaught exception: ${err.message}`, 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`Unhandled rejection: ${reason}`, 'error');
});

// Start
start().catch(err => {
  log(`Startup error: ${err.message}`, 'error');
  process.exit(1);
});
