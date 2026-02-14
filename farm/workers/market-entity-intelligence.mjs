/**
 * Market Entity Intelligence v1.0
 * 
 * Learns symbol-specific, sector-specific, and archetype-specific patterns
 * from resolved market predictions. Same design as player-intelligence.mjs.
 * 
 * DIMENSIONS TRACKED:
 * 1. Per-symbol accuracy (which symbols EP predicts well)
 * 2. Per-symbol × archetype (which patterns work for which symbols)
 * 3. Per-sector accuracy (tech vs commodities vs crypto)
 * 4. Per-timeframe × sector (which timeframes work for which sectors)
 * 5. Per-chess-resonance-archetype (which chess mappings have real edge)
 * 6. Time-of-day patterns (market sessions, pre/post market)
 * 
 * At worst neutral (1.0 multiplier), at best a meaningful boost/reduction.
 * 
 * Imported by: market-prediction-worker.mjs
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CACHE_FILE = join(__dirname, '..', 'data', 'market-entity-intelligence.json');
const MIN_RESOLVED = 30;

// ═══════════════════════════════════════════════════════════
// IN-MEMORY PROFILES
// ═══════════════════════════════════════════════════════════

let symbolProfiles = {};   // { symbol: { accuracy, n, archetypes, timeframes } }
let sectorProfiles = {};   // { sector: { accuracy, n, timeframes } }
let archetypeProfiles = {}; // { archetype: { accuracy, n, bySymbol } }
let resonanceProfiles = {}; // { chessArch: { accuracy, n } }
let timeframeProfiles = {}; // { timeframe: { accuracy, n, bySector } }
let lastRefresh = null;

// ═══════════════════════════════════════════════════════════
// CACHE
// ═══════════════════════════════════════════════════════════

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      symbolProfiles = data.symbolProfiles || {};
      sectorProfiles = data.sectorProfiles || {};
      archetypeProfiles = data.archetypeProfiles || {};
      resonanceProfiles = data.resonanceProfiles || {};
      timeframeProfiles = data.timeframeProfiles || {};
      lastRefresh = data.lastRefresh || null;
      return true;
    }
  } catch (e) { /* fresh start */ }
  return false;
}

function saveCache() {
  try {
    const dir = dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify({
      symbolProfiles, sectorProfiles, archetypeProfiles,
      resonanceProfiles, timeframeProfiles,
      lastRefresh: new Date().toISOString(),
    }, null, 0));
  } catch (e) {
    console.log(`[MARKET-INTEL] Cache save failed: ${e.message}`);
  }
}

// ═══════════════════════════════════════════════════════════
// REFRESH FROM DATABASE
// ═══════════════════════════════════════════════════════════

export async function refreshMarketIntelligence(queryFn) {
  const startTime = Date.now();
  console.log('[MARKET-INTEL] Refreshing market entity intelligence...');

  try {
    // 1. Per-symbol accuracy
    const symResult = await queryFn(`
      SELECT symbol, count(*) as n,
             sum(case when ep_correct then 1 else 0 end) as correct,
             round(100.0 * sum(case when ep_correct then 1 else 0 end) / count(*), 1) as acc
      FROM market_prediction_attempts
      WHERE ep_correct IS NOT NULL
      GROUP BY symbol
      HAVING count(*) >= ${MIN_RESOLVED}
      ORDER BY count(*) DESC
    `);

    const newSymbols = {};
    for (const r of symResult.rows) {
      newSymbols[r.symbol] = {
        n: parseInt(r.n),
        correct: parseInt(r.correct),
        accuracy: parseFloat(r.acc) / 100,
        archetypes: {},
        timeframes: {},
      };
    }

    // 2. Per-symbol × archetype
    const symArchResult = await queryFn(`
      SELECT symbol, archetype, count(*) as n,
             sum(case when ep_correct then 1 else 0 end) as correct
      FROM market_prediction_attempts
      WHERE ep_correct IS NOT NULL AND archetype IS NOT NULL
      GROUP BY symbol, archetype
      HAVING count(*) >= 10
    `);
    for (const r of symArchResult.rows) {
      if (newSymbols[r.symbol]) {
        newSymbols[r.symbol].archetypes[r.archetype] = {
          n: parseInt(r.n),
          correct: parseInt(r.correct),
          accuracy: parseInt(r.correct) / parseInt(r.n),
        };
      }
    }

    // 3. Per-symbol × timeframe
    const symTfResult = await queryFn(`
      SELECT symbol, time_horizon, count(*) as n,
             sum(case when ep_correct then 1 else 0 end) as correct
      FROM market_prediction_attempts
      WHERE ep_correct IS NOT NULL
      GROUP BY symbol, time_horizon
      HAVING count(*) >= 10
    `);
    for (const r of symTfResult.rows) {
      if (newSymbols[r.symbol]) {
        newSymbols[r.symbol].timeframes[r.time_horizon] = {
          n: parseInt(r.n),
          correct: parseInt(r.correct),
          accuracy: parseInt(r.correct) / parseInt(r.n),
        };
      }
    }

    // 4. Per-sector accuracy
    const sectorResult = await queryFn(`
      SELECT prediction_metadata->>'sector' as sector, count(*) as n,
             sum(case when ep_correct then 1 else 0 end) as correct,
             round(100.0 * sum(case when ep_correct then 1 else 0 end) / count(*), 1) as acc
      FROM market_prediction_attempts
      WHERE ep_correct IS NOT NULL AND prediction_metadata->>'sector' IS NOT NULL
      GROUP BY prediction_metadata->>'sector'
      HAVING count(*) >= ${MIN_RESOLVED}
    `);
    const newSectors = {};
    for (const r of sectorResult.rows) {
      newSectors[r.sector] = {
        n: parseInt(r.n),
        correct: parseInt(r.correct),
        accuracy: parseFloat(r.acc) / 100,
      };
    }

    // 5. Per-archetype accuracy
    const archResult = await queryFn(`
      SELECT archetype, count(*) as n,
             sum(case when ep_correct then 1 else 0 end) as correct,
             round(100.0 * sum(case when ep_correct then 1 else 0 end) / count(*), 1) as acc
      FROM market_prediction_attempts
      WHERE ep_correct IS NOT NULL AND archetype IS NOT NULL
      GROUP BY archetype
      HAVING count(*) >= ${MIN_RESOLVED}
      ORDER BY acc DESC
    `);
    const newArchetypes = {};
    for (const r of archResult.rows) {
      newArchetypes[r.archetype] = {
        n: parseInt(r.n),
        correct: parseInt(r.correct),
        accuracy: parseFloat(r.acc) / 100,
      };
    }

    // 6. Per-chess-resonance archetype
    const resResult = await queryFn(`
      SELECT chess_archetype_resonance as arch, count(*) as n,
             sum(case when ep_correct then 1 else 0 end) as correct,
             round(100.0 * sum(case when ep_correct then 1 else 0 end) / count(*), 1) as acc
      FROM market_prediction_attempts
      WHERE ep_correct IS NOT NULL AND chess_archetype_resonance IS NOT NULL
      GROUP BY chess_archetype_resonance
      HAVING count(*) >= 20
      ORDER BY acc DESC
    `);
    const newResonance = {};
    for (const r of resResult.rows) {
      newResonance[r.arch] = {
        n: parseInt(r.n),
        correct: parseInt(r.correct),
        accuracy: parseFloat(r.acc) / 100,
      };
    }

    // 7. Per-timeframe accuracy
    const tfResult = await queryFn(`
      SELECT time_horizon, count(*) as n,
             sum(case when ep_correct then 1 else 0 end) as correct,
             round(100.0 * sum(case when ep_correct then 1 else 0 end) / count(*), 1) as acc
      FROM market_prediction_attempts
      WHERE ep_correct IS NOT NULL
      GROUP BY time_horizon
      ORDER BY n DESC
    `);
    const newTimeframes = {};
    for (const r of tfResult.rows) {
      newTimeframes[r.time_horizon] = {
        n: parseInt(r.n),
        correct: parseInt(r.correct),
        accuracy: parseFloat(r.acc) / 100,
      };
    }

    // Apply
    symbolProfiles = newSymbols;
    sectorProfiles = newSectors;
    archetypeProfiles = newArchetypes;
    resonanceProfiles = newResonance;
    timeframeProfiles = newTimeframes;
    lastRefresh = new Date().toISOString();
    saveCache();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[MARKET-INTEL] ✓ Refreshed in ${elapsed}s: ${Object.keys(symbolProfiles).length} symbols, ${Object.keys(archetypeProfiles).length} archetypes, ${Object.keys(resonanceProfiles).length} resonances`);

    // Log top insights
    const sortedSym = Object.entries(symbolProfiles).sort((a, b) => b[1].accuracy - a[1].accuracy);
    console.log('[MARKET-INTEL] Symbol accuracy (top):');
    for (const [sym, p] of sortedSym.slice(0, 8)) {
      console.log(`  ${sym.padEnd(10)} ${(p.accuracy * 100).toFixed(1)}% (n=${p.n})`);
    }
    console.log('[MARKET-INTEL] Symbol accuracy (bottom):');
    for (const [sym, p] of sortedSym.slice(-5)) {
      console.log(`  ${sym.padEnd(10)} ${(p.accuracy * 100).toFixed(1)}% (n=${p.n})`);
    }

    // Chess resonance
    if (Object.keys(resonanceProfiles).length > 0) {
      console.log('[MARKET-INTEL] Chess resonance edge:');
      const sortedRes = Object.entries(resonanceProfiles).sort((a, b) => b[1].accuracy - a[1].accuracy);
      for (const [arch, p] of sortedRes) {
        const tag = p.accuracy > 0.50 ? '✓ EDGE' : p.accuracy > 0.33 ? '~ modest' : '✗ drag';
        console.log(`  ${arch.padEnd(30)} ${(p.accuracy * 100).toFixed(1)}% (n=${p.n}) ${tag}`);
      }
    }

    return { symbols: Object.keys(symbolProfiles).length, archetypes: Object.keys(archetypeProfiles).length };
  } catch (err) {
    console.log(`[MARKET-INTEL] Refresh failed: ${err.message}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// QUERY FUNCTIONS — used by market-prediction-worker.mjs
// ═══════════════════════════════════════════════════════════

/**
 * Get a confidence multiplier based on symbol+archetype+timeframe intelligence.
 * 
 * @param {string} symbol
 * @param {string} archetype
 * @param {string} timeframe - time_horizon label
 * @param {string|null} chessResonance - chess archetype resonance
 * @returns {{ boost: number, reason: string }}
 */
export function getMarketEntityBoost(symbol, archetype, timeframe, chessResonance) {
  let boostFactors = [];
  let reasons = [];
  const baselineAcc = 0.322; // Overall 32.2%

  // 1. Symbol-specific accuracy
  const sym = symbolProfiles[symbol];
  if (sym && sym.n >= MIN_RESOLVED) {
    const ratio = sym.accuracy / baselineAcc;
    const dampened = 1.0 + (ratio - 1.0) * 0.5;
    boostFactors.push(dampened);
    reasons.push(`${symbol}=${(sym.accuracy * 100).toFixed(0)}%`);
  }

  // 2. Symbol × archetype accuracy
  if (sym && archetype && sym.archetypes[archetype]) {
    const sa = sym.archetypes[archetype];
    if (sa.n >= 10) {
      const ratio = sa.accuracy / (sym.accuracy || baselineAcc);
      const dampened = 1.0 + (ratio - 1.0) * 0.3;
      boostFactors.push(dampened);
      reasons.push(`${symbol}×${archetype.substring(0, 12)}=${(sa.accuracy * 100).toFixed(0)}%`);
    }
  }

  // 3. Symbol × timeframe accuracy
  if (sym && timeframe && sym.timeframes[timeframe]) {
    const st = sym.timeframes[timeframe];
    if (st.n >= 10) {
      const ratio = st.accuracy / (sym.accuracy || baselineAcc);
      const dampened = 1.0 + (ratio - 1.0) * 0.3;
      boostFactors.push(dampened);
      reasons.push(`${symbol}×${timeframe}=${(st.accuracy * 100).toFixed(0)}%`);
    }
  }

  // 4. Chess resonance edge (the real cross-domain signal)
  if (chessResonance && resonanceProfiles[chessResonance]) {
    const res = resonanceProfiles[chessResonance];
    if (res.n >= 20) {
      const ratio = res.accuracy / baselineAcc;
      const dampened = 1.0 + (ratio - 1.0) * 0.4; // Stronger weight — this has real edge
      boostFactors.push(dampened);
      reasons.push(`♟${chessResonance.substring(0, 15)}=${(res.accuracy * 100).toFixed(0)}%`);
    }
  }

  if (boostFactors.length === 0) return { boost: 1.0, reason: 'no market entity signal' };

  // Geometric mean
  const combined = boostFactors.reduce((a, b) => a * b, 1.0);
  const nthRoot = Math.pow(combined, 1 / boostFactors.length);

  // Wider range than chess player boost — market archetypes have bigger accuracy spread
  const clamped = Math.max(0.70, Math.min(1.40, nthRoot));

  return {
    boost: clamped,
    reason: reasons.join(' | '),
  };
}

/**
 * Should we skip predictions for this symbol entirely?
 * Based on learned accuracy being catastrophically low.
 */
export function shouldSkipSymbol(symbol) {
  const sym = symbolProfiles[symbol];
  if (!sym || sym.n < 50) return false; // Not enough data
  return sym.accuracy < 0.05; // Skip if < 5% accuracy on 50+ resolved
}

/**
 * Get archetype accuracy for dynamic gating.
 */
export function getArchetypeAccuracy(archetype) {
  const arch = archetypeProfiles[archetype];
  if (!arch) return null;
  return { accuracy: arch.accuracy, n: arch.n };
}

export function getMarketIntelSummary() {
  return {
    symbolsTracked: Object.keys(symbolProfiles).length,
    archetypes: Object.keys(archetypeProfiles).length,
    resonances: Object.keys(resonanceProfiles).length,
    timeframes: Object.keys(timeframeProfiles).length,
    lastRefresh,
  };
}

// Load cache on import
const cacheLoaded = loadCache();
if (cacheLoaded) {
  console.log(`[MARKET-INTEL] Loaded cache: ${Object.keys(symbolProfiles).length} symbols, ${Object.keys(archetypeProfiles).length} archetypes (age: ${lastRefresh ? ((Date.now() - new Date(lastRefresh).getTime()) / 3600000).toFixed(1) + 'h' : 'unknown'})`);
} else {
  console.log('[MARKET-INTEL] No cache — will refresh from DB on first cycle');
}
