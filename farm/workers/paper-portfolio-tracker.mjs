/**
 * Paper Portfolio Tracker — $100 CAD × 5 Strategies Forward Test
 * 
 * SCIENTIFIC VALIDITY RULES:
 * 1. Each strategy applies its own filter to the SAME real prediction stream
 * 2. Entry price = price_at_prediction (REAL), Exit = price_at_resolution (REAL)
 * 3. NO look-ahead bias — only processes resolved predictions
 * 4. Full realistic fee model: IBKR commissions + spread + SEC + FX conversion
 * 5. Options strategy uses delta-adjusted leverage to simulate ATM weeklies
 * 
 * STRATEGIES:
 *   main           — Every directional prediction, 5% sizing (baseline)
 *   conservative   — Only AMD & SI=F with conf>70%, 5% sizing (proven edge)
 *   aggressive     — Every prediction, 10% sizing (max learning speed)
 *   edge_hunter    — Only false_breakout + bearish_momentum archetypes, 15% sizing
 *   options_scalper — Only AMD/NVDA/MSFT/AMZN, delta-leveraged, 8% sizing (simulate ATM options)
 */

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});
pool.on('error', (err) => console.error('[PAPER] Pool error (non-fatal):', err.message));

// Graceful shutdown — drain pool before exit to prevent zombie connections
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, async () => {
    console.log(`[PAPER] ${sig} received — draining pool...`);
    try { await pool.end(); } catch {}
    process.exit(0);
  });
}

// === STRATEGY DEFINITIONS ===
const STRATEGIES = {
  main: {
    name: 'Baseline',
    positionSizePct: 0.05,
    filter: () => true,  // Takes every directional prediction
    leverageMultiplier: 1,
    extraFees: 0,
  },
  conservative: {
    name: 'Conservative Edge',
    positionSizePct: 0.05,
    filter: (pred) => {
      const edgeSymbols = ['AMD', 'SI=F'];
      return edgeSymbols.includes(pred.symbol) && parseFloat(pred.confidence) >= 70;
    },
    leverageMultiplier: 1,
    extraFees: 0,
  },
  aggressive: {
    name: 'Aggressive Scalper',
    positionSizePct: 0.10,
    filter: () => true,  // Takes everything
    leverageMultiplier: 1,
    extraFees: 0,
  },
  edge_hunter: {
    name: 'Edge Hunter',
    positionSizePct: 0.15,
    filter: (pred) => {
      const edgeArchetypes = ['false_breakout', 'bearish_momentum'];
      return edgeArchetypes.includes(pred.archetype);
    },
    leverageMultiplier: 1,
    extraFees: 0,
  },
  options_scalper: {
    name: 'Options Scalper',
    positionSizePct: 0.08,
    filter: (pred) => {
      const optionsStocks = ['AMD', 'NVDA', 'MSFT', 'AMZN'];
      return optionsStocks.includes(pred.symbol);
    },
    // ATM weekly options: delta ~0.50, so underlying move × 2-3x in option premium
    // But also theta decay: ~0.5-1% per day for weeklies
    // Net leverage after theta: ~2x on a same-day scalp, less for longer holds
    leverageMultiplier: 2.5,
    // Options commissions are higher: $0.65/contract IBKR, min 1 contract
    extraFees: 0.65,  // Extra per-side on top of base commission
  },
};

// ─── GLOBAL SAFETY GATES ─────────────────────────────────────────────────────
// These apply BEFORE any strategy-specific filter to prevent catastrophic losses.
const GLOBAL_GATES = {
  MIN_CONFIDENCE: 55,           // Only trade golden zone (55%+) — below this has 52% chess accuracy
  MIN_POSITION_SIZE_USD: 14.00, // Ensures fees < 5% of position ($0.70 / $14 = 5%)
  MAX_TRADES_PER_HOUR: 10,      // Per strategy — prevents rapid-fire drain
  ARCHETYPE_BLACKLIST: new Set([
    'cultural_harmony',           // 28.1% accuracy — worse than random
    'bearish_momentum',           // Reports 85% conf but 0% paper wins — overconfidence trap
    'bullish_momentum',           // 15.8% accuracy
    'regime_shift_down',          // 16.3% accuracy
    'mean_reversion_up',          // 21.5% accuracy
    'mean_reversion_down',        // 28.1% accuracy
    'blunder_free_queen',         // 23.7% accuracy
    'castling_reposition',        // 25.8% accuracy
    'institutional_accumulation', // 29.1% accuracy
    'oversold_bounce',            // 29.2% accuracy
  ]),
};

// Track trade counts per strategy per hour for rate limiting
const tradeCountsThisHour = {};
let currentHour = new Date().getHours();

const CONFIG = {
  CHECK_INTERVAL_MS: 30_000,    // Check every 30 seconds (faster for more trades)
  WORKER_ID: `paper-tracker-${Math.random().toString(36).slice(2, 6)}`,
  STARTING_CAD: 10000,
  FX_CONVERSION_PCT: 0.0025,
  FX_MIN_FEE_USD: 2.00,
  COMMISSION_PER_TRADE_USD: 0.35,
  SPREAD_COST_PCT: 0.0005,
  SEC_FEE_PER_DOLLAR: 0.0000278,
  USDCAD_RATE: 1.38,
};

function log(msg, level = 'info') {
  const ts = new Date().toISOString();
  const icon = level === 'trade' ? '💰' : level === 'error' ? '❌' : 'ℹ️';
  console.log(`[${ts}] [${CONFIG.WORKER_ID}] ${icon} ${msg}`);
}

async function fetchUSDCAD() {
  try {
    const resp = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/CADUSD=X?interval=1d&range=1d');
    const data = await resp.json();
    const cadPerUsd = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (cadPerUsd && cadPerUsd > 0) {
      // Yahoo returns CAD per USD for CADUSD=X, we want USD per CAD
      CONFIG.USDCAD_RATE = 1 / cadPerUsd;
      log(`USDCAD rate: ${CONFIG.USDCAD_RATE.toFixed(4)} (1 CAD = $${cadPerUsd.toFixed(4)} USD)`);
    }
  } catch (e) {
    log(`Using fallback USDCAD: ${CONFIG.USDCAD_RATE}`, 'error');
  }
}

function calculateUSDFromCAD(cadAmount) {
  const usdAmount = cadAmount / CONFIG.USDCAD_RATE;
  const fxFee = Math.max(CONFIG.FX_MIN_FEE_USD, usdAmount * CONFIG.FX_CONVERSION_PCT);
  return { usdAmount, fxFee, netUSD: usdAmount - fxFee };
}

function calculateCADFromUSD(usdAmount) {
  const fxFee = Math.max(CONFIG.FX_MIN_FEE_USD, usdAmount * CONFIG.FX_CONVERSION_PCT);
  const netUSD = usdAmount - fxFee;
  const cadAmount = netUSD * CONFIG.USDCAD_RATE;
  return { cadAmount, fxFee };
}

async function getUnprocessedPredictions(startedAt, strategyId) {
  const { rows } = await pool.query(`
    SELECT m.id, m.symbol, m.predicted_direction, m.archetype, m.confidence,
           m.time_horizon, m.price_at_prediction, m.price_at_resolution,
           m.actual_move, m.actual_direction, m.ep_correct,
           m.created_at, m.resolved_at
    FROM market_prediction_attempts m
    LEFT JOIN paper_trades pt ON pt.prediction_id = m.id AND pt.strategy = $2
    WHERE m.resolved_at IS NOT NULL
      AND m.created_at >= $1
      AND m.predicted_direction IN ('bullish', 'bearish')
      AND m.price_at_prediction IS NOT NULL AND m.price_at_prediction > 0
      AND m.price_at_resolution IS NOT NULL AND m.price_at_resolution > 0
      AND m.actual_move IS NOT NULL
      AND pt.id IS NULL
    ORDER BY m.resolved_at ASC
    LIMIT 100
  `, [startedAt, strategyId]);
  return rows;
}

function calculateTrade(pred, balance, strategy) {
  const positionSize = balance * strategy.positionSizePct;
  const dirSign = pred.predicted_direction === 'bullish' ? 1 : -1;
  const actualMovePct = parseFloat(pred.actual_move) / 100;
  
  // Apply leverage multiplier (1x for stocks, 2.5x for options)
  const leveragedMove = actualMovePct * strategy.leverageMultiplier;
  
  // For options: also apply theta decay penalty
  // ~0.5% per day for ATM weeklies, scaled by hold time
  let thetaDecay = 0;
  if (strategy.leverageMultiplier > 1 && pred.resolved_at && pred.created_at) {
    const holdHours = (new Date(pred.resolved_at) - new Date(pred.created_at)) / 3600000;
    thetaDecay = positionSize * (0.005 / 24) * holdHours; // 0.5%/day prorated
  }
  
  const grossPnl = positionSize * leveragedMove * dirSign;
  
  // Fees
  const commissions = (CONFIG.COMMISSION_PER_TRADE_USD + (strategy.extraFees || 0)) * 2;
  const spreadCost = positionSize * CONFIG.SPREAD_COST_PCT * 2;
  const secFee = positionSize * CONFIG.SEC_FEE_PER_DOLLAR;
  const fees = commissions + spreadCost + secFee + thetaDecay;
  
  const netPnl = grossPnl - fees;
  const newBalance = balance + netPnl;
  
  return {
    prediction_id: pred.id,
    symbol: pred.symbol,
    predicted_direction: pred.predicted_direction,
    archetype: pred.archetype,
    confidence: pred.confidence,
    time_horizon: pred.time_horizon,
    entry_price: parseFloat(pred.price_at_prediction),
    exit_price: parseFloat(pred.price_at_resolution),
    actual_move_pct: parseFloat(pred.actual_move),
    position_size: positionSize,
    gross_pnl: grossPnl,
    fees,
    net_pnl: netPnl,
    balance_before: balance,
    balance_after: newBalance,
    prediction_correct: pred.ep_correct,
    predicted_at: pred.created_at,
    resolved_at: pred.resolved_at,
  };
}

async function saveTrade(trade, strategyId) {
  await pool.query(`
    INSERT INTO paper_trades (
      prediction_id, symbol, predicted_direction, archetype, confidence,
      time_horizon, entry_price, exit_price, actual_move_pct,
      position_size, gross_pnl, fees, net_pnl,
      balance_before, balance_after, prediction_correct,
      predicted_at, resolved_at, strategy
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
  `, [
    trade.prediction_id, trade.symbol, trade.predicted_direction,
    trade.archetype, trade.confidence, trade.time_horizon,
    trade.entry_price, trade.exit_price, trade.actual_move_pct,
    trade.position_size, trade.gross_pnl, trade.fees, trade.net_pnl,
    trade.balance_before, trade.balance_after, trade.prediction_correct,
    trade.predicted_at, trade.resolved_at, strategyId,
  ]);
}

async function updatePortfolio(strategyId, newBalance, trade) {
  const pf = (await pool.query('SELECT high_water_mark FROM paper_portfolio WHERE id=$1', [strategyId])).rows[0];
  const hwm = Math.max(newBalance, parseFloat(pf?.high_water_mark || newBalance));
  const drawdownPct = hwm > 0 ? ((hwm - newBalance) / hwm) * 100 : 0;
  const isWin = trade.net_pnl > 0;
  
  await pool.query(`
    UPDATE paper_portfolio SET
      current_balance = $1, high_water_mark = $2,
      total_trades = total_trades + 1,
      winning_trades = winning_trades + CASE WHEN $3 THEN 1 ELSE 0 END,
      losing_trades = losing_trades + CASE WHEN $3 THEN 0 ELSE 1 END,
      total_pnl = total_pnl + $4, total_fees = total_fees + $5,
      max_drawdown_pct = GREATEST(max_drawdown_pct, $6),
      last_trade_at = $7, updated_at = NOW()
    WHERE id = $8
  `, [newBalance, hwm, isWin, trade.net_pnl, trade.fees, drawdownPct, trade.resolved_at, strategyId]);
}

async function processNewTrades() {
  try {
    let totalProcessed = 0;
    
    for (const [stratId, strategy] of Object.entries(STRATEGIES)) {
      const portfolio = (await pool.query('SELECT * FROM paper_portfolio WHERE id=$1', [stratId])).rows[0];
      if (!portfolio) continue;
      
      const predictions = await getUnprocessedPredictions(portfolio.started_at, stratId);
      if (predictions.length === 0) continue;
      
      let balance = parseFloat(portfolio.current_balance);
      let stratTrades = 0;
      
      for (const pred of predictions) {
        // ─── GLOBAL SAFETY GATES (apply before strategy filter) ───────────
        // 1. Min confidence gate
        const conf = parseFloat(pred.confidence);
        if (conf < GLOBAL_GATES.MIN_CONFIDENCE) continue;
        
        // 2. Archetype blacklist (below-random archetypes)
        if (GLOBAL_GATES.ARCHETYPE_BLACKLIST.has(pred.archetype)) continue;
        
        // 3. Min position size gate (prevents fee-dominated trades)
        const proposedSize = balance * strategy.positionSizePct;
        if (proposedSize < GLOBAL_GATES.MIN_POSITION_SIZE_USD) continue;
        
        // 4. Trade frequency cap
        const nowHour = new Date().getHours();
        if (nowHour !== currentHour) { 
          Object.keys(tradeCountsThisHour).forEach(k => delete tradeCountsThisHour[k]);
          currentHour = nowHour;
        }
        const hourKey = `${stratId}_${nowHour}`;
        if ((tradeCountsThisHour[hourKey] || 0) >= GLOBAL_GATES.MAX_TRADES_PER_HOUR) continue;
        
        // Apply strategy-specific filter
        if (!strategy.filter(pred)) continue;
        
        const trade = calculateTrade(pred, balance, strategy);
        await saveTrade(trade, stratId);
        await updatePortfolio(stratId, trade.balance_after, trade);
        
        balance = trade.balance_after;
        stratTrades++;
        totalProcessed++;
        tradeCountsThisHour[hourKey] = (tradeCountsThisHour[hourKey] || 0) + 1;
        
        const pnlStr = trade.net_pnl >= 0 ? `+$${trade.net_pnl.toFixed(4)}` : `-$${Math.abs(trade.net_pnl).toFixed(4)}`;
        const icon = trade.net_pnl >= 0 ? '📈' : '📉';
        log(`${icon} [${stratId}] ${trade.symbol} ${trade.predicted_direction} → ${pnlStr} | ` +
            `move=${trade.actual_move_pct.toFixed(3)}% ×${strategy.leverageMultiplier} | ` +
            `pos=$${trade.position_size.toFixed(2)} | bal=$${balance.toFixed(4)}`, 'trade');
      }
    }
    
    if (totalProcessed > 0) {
      await printScoreboard();
    }
  } catch (e) {
    log(`Error: ${e.message}`, 'error');
  }
}

async function printScoreboard() {
  const portfolios = (await pool.query(
    'SELECT * FROM paper_portfolio ORDER BY current_balance DESC'
  )).rows;
  
  log('');
  log('╔══════════════════════════════════════════════════════════════════════════╗');
  log('║                    $100 CAD × 5 STRATEGIES — SCOREBOARD                ║');
  log('╠══════════════════════════════════════════════════════════════════════════╣');
  log('║ Strategy          │ Balance  │ Return │ Trades │ Win% │ PnL     │ Fees  ║');
  log('╠═══════════════════╪══════════╪════════╪════════╪══════╪═════════╪═══════╣');
  
  for (const pf of portfolios) {
    const bal = parseFloat(pf.current_balance);
    const start = parseFloat(pf.starting_balance);
    const ret = ((bal - start) / start * 100).toFixed(1);
    const wr = pf.total_trades > 0 ? (pf.winning_trades / pf.total_trades * 100).toFixed(0) : '—';
    const stratDef = STRATEGIES[pf.id];
    const name = (stratDef?.name || pf.id).padEnd(17);
    const retStr = (ret >= 0 ? '+' : '') + ret + '%';
    
    // Calculate CAD value
    const withdrawal = calculateCADFromUSD(bal);
    
    log(`║ ${name} │ $${bal.toFixed(2).padStart(7)} │ ${retStr.padStart(6)} │ ${String(pf.total_trades).padStart(6)} │ ${wr.padStart(3)}% │ $${parseFloat(pf.total_pnl).toFixed(2).padStart(6)} │ $${parseFloat(pf.total_fees).toFixed(2).padStart(4)} ║`);
  }
  
  log('╚══════════════════════════════════════════════════════════════════════════╝');
  
  // Show CAD equivalent for the best performer
  const best = portfolios[0];
  if (best) {
    const bestBal = parseFloat(best.current_balance);
    const w = calculateCADFromUSD(bestBal);
    const cadRet = ((w.cadAmount - CONFIG.STARTING_CAD) / CONFIG.STARTING_CAD * 100).toFixed(1);
    log(`🏆 Leader: ${STRATEGIES[best.id]?.name || best.id} → $${w.cadAmount.toFixed(2)} CAD (${cadRet}% total incl FX) | USDCAD: ${CONFIG.USDCAD_RATE.toFixed(4)}`);
  }
  log('');
}

// Main loop
async function main() {
  log('Starting Multi-Strategy Paper Portfolio Tracker...');
  log(`Strategies: ${Object.keys(STRATEGIES).join(', ')}`);
  
  await fetchUSDCAD();
  
  const deposit = calculateUSDFromCAD(CONFIG.STARTING_CAD);
  log(`Each strategy starts: $${CONFIG.STARTING_CAD} CAD → $${deposit.netUSD.toFixed(2)} USD (after $${deposit.fxFee.toFixed(2)} FX fee)`);
  
  await printScoreboard();
  await processNewTrades();
  
  // Check every 30 seconds for new resolved predictions
  setInterval(async () => {
    await processNewTrades();
  }, CONFIG.CHECK_INTERVAL_MS);
  
  // Print scoreboard every 5 minutes
  setInterval(async () => {
    await printScoreboard();
  }, 300_000);
  
  // Refresh USDCAD rate every hour
  setInterval(async () => {
    await fetchUSDCAD();
  }, 3600_000);
}

main().catch(e => {
  log(`Fatal: ${e.message}`, 'error');
  process.exit(1);
});
