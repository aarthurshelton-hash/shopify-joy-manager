#!/usr/bin/env node
/**
 * EP Market Performance Dashboard
 * Run anytime: node check-market-performance.mjs
 * 
 * Shows sustained daily accuracy, P&L simulation, and quant-fund readiness metrics.
 * All data is 100% real — resolved predictions on real market prices.
 */

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
});

// v31 trader filters
const ARCHETYPES = ['blunder_free_queen','trap_queen_sac','false_breakout','regime_shift_down','mean_reversion_down','bearish_momentum','mean_reversion_up'];
const SYMBOLS = ['AMD','AMZN','MSFT','SI=F'];
const TIMEFRAMES = ['1h','2h','4h','8h'];
const BLOCKED = new Set(['blunder_free_queen|MSFT|8h','trap_queen_sac|AMZN|8h','trap_queen_sac|SI=F|4h','mean_reversion_down|SI=F|4h','mean_reversion_up|MSFT|8h']);
const ELITE = new Set(['trap_queen_sac|AMD|1h','trap_queen_sac|AMZN|1h','mean_reversion_down|AMZN|2h','regime_shift_down|AMD|1h','mean_reversion_down|MSFT|1h','regime_shift_down|MSFT|2h','mean_reversion_up|MSFT|1h','mean_reversion_up|AMZN|1h','trap_queen_sac|NVDA|4h']);

async function run() {
  // Daily breakdown for last 14 days
  const daily = await pool.query(`
    SELECT 
      DATE(created_at AT TIME ZONE 'America/New_York') as day,
      COUNT(*) as total,
      COUNT(CASE WHEN ep_correct = true THEN 1 END) as correct,
      COUNT(CASE WHEN resolved_at IS NOT NULL THEN 1 END) as resolved
    FROM market_prediction_attempts
    WHERE created_at > NOW() - INTERVAL '14 days'
    GROUP BY 1
    ORDER BY 1
  `);

  // Tradeable signals (matching our filters)
  const tradeable = await pool.query(`
    SELECT 
      DATE(created_at AT TIME ZONE 'America/New_York') as day,
      archetype, symbol, time_horizon,
      predicted_direction, ep_correct,
      price_at_prediction, price_at_resolution
    FROM market_prediction_attempts
    WHERE created_at > NOW() - INTERVAL '14 days'
      AND resolved_at IS NOT NULL
      AND archetype = ANY($1)
      AND symbol = ANY($2)
      AND time_horizon = ANY($3)
      AND predicted_direction IN ('up','down','bullish','bearish')
      AND price_at_prediction > 0
      AND price_at_resolution > 0
    ORDER BY created_at ASC
  `, [ARCHETYPES, SYMBOLS, TIMEFRAMES]);

  // Build daily stats
  const dayStats = {};
  for (const row of daily.rows) {
    const d = row.day.toISOString().substring(0, 10);
    dayStats[d] = { total: parseInt(row.total), resolved: parseInt(row.resolved), correct: parseInt(row.correct), tradeable: 0, tradeCorrect: 0, elite: 0, eliteCorrect: 0, stockPnl: 0, optionPnl: 0 };
  }

  // Process tradeable signals with cooldown simulation
  const cooldowns = {};
  const COOLDOWN_MS = 15 * 60 * 1000;
  let simTrades = 0, simWins = 0;

  for (const row of tradeable.rows) {
    const d = row.day.toISOString().substring(0, 10);
    if (!dayStats[d]) continue;
    
    const combo = `${row.archetype}|${row.symbol}|${row.time_horizon}`;
    if (BLOCKED.has(combo)) continue;

    dayStats[d].tradeable++;
    if (row.ep_correct) dayStats[d].tradeCorrect++;

    if (ELITE.has(combo)) {
      dayStats[d].elite++;
      if (row.ep_correct) dayStats[d].eliteCorrect++;
    }

    // Simulate P&L with cooldown
    const key = row.symbol;
    const ts = new Date(row.day).getTime();
    if (cooldowns[key] && ts - cooldowns[key] < COOLDOWN_MS) continue;
    cooldowns[key] = ts;

    const entry = parseFloat(row.price_at_prediction);
    const exit = parseFloat(row.price_at_resolution);
    const rawMove = (exit - entry) / entry;
    const isLong = row.predicted_direction === 'up' || row.predicted_direction === 'bullish';
    const pnlPct = isLong ? rawMove : -rawMove;
    const clampedPnl = Math.max(-0.015, Math.min(0.025, pnlPct));
    const posSize = 500;
    
    dayStats[d].stockPnl += posSize * clampedPnl;
    dayStats[d].optionPnl += posSize * 0.25 * clampedPnl * 8;
    simTrades++;
    if (row.ep_correct) simWins++;
  }

  // Print dashboard
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              EP MARKET PERFORMANCE DASHBOARD — ALL REAL DATA                    ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════════════╣');
  
  console.log('\n  Date        Total   Resolved  All-Acc   Tradeable  Trade-Acc  Elite  Elite-Acc  Stock$   Option$');
  console.log('  ─────────   ─────   ────────  ───────   ─────────  ─────────  ─────  ─────────  ──────   ───────');
  
  let cumStock = 0, cumOption = 0, totalTradeable = 0, totalTradeCorrect = 0, totalElite = 0, totalEliteCorrect = 0;
  const days = Object.entries(dayStats).sort();
  
  for (const [day, s] of days) {
    const allAcc = s.resolved > 0 ? (s.correct / s.resolved * 100).toFixed(1) : 'N/A';
    const tradeAcc = s.tradeable > 0 ? (s.tradeCorrect / s.tradeable * 100).toFixed(1) : 'N/A';
    const eliteAcc = s.elite > 0 ? (s.eliteCorrect / s.elite * 100).toFixed(1) : 'N/A';
    cumStock += s.stockPnl;
    cumOption += s.optionPnl;
    totalTradeable += s.tradeable;
    totalTradeCorrect += s.tradeCorrect;
    totalElite += s.elite;
    totalEliteCorrect += s.eliteCorrect;
    
    const stockStr = (s.stockPnl >= 0 ? '+' : '') + s.stockPnl.toFixed(0);
    const optStr = (s.optionPnl >= 0 ? '+' : '') + s.optionPnl.toFixed(0);
    
    console.log(`  ${day}   ${String(s.total).padStart(5)}   ${String(s.resolved).padStart(8)}  ${String(allAcc + '%').padStart(7)}   ${String(s.tradeable).padStart(9)}  ${String(tradeAcc + '%').padStart(9)}  ${String(s.elite).padStart(5)}  ${String(eliteAcc + '%').padStart(9)}  ${stockStr.padStart(6)}   ${optStr.padStart(7)}`);
  }
  
  const overallTradeAcc = totalTradeable > 0 ? (totalTradeCorrect / totalTradeable * 100).toFixed(1) : 'N/A';
  const overallEliteAcc = totalElite > 0 ? (totalEliteCorrect / totalElite * 100).toFixed(1) : 'N/A';
  
  console.log('  ─────────   ─────   ────────  ───────   ─────────  ─────────  ─────  ─────────  ──────   ───────');
  console.log(`  TOTAL                                   ${String(totalTradeable).padStart(9)}  ${String(overallTradeAcc + '%').padStart(9)}  ${String(totalElite).padStart(5)}  ${String(overallEliteAcc + '%').padStart(9)}  ${(cumStock >= 0 ? '+' : '') + cumStock.toFixed(0).padStart(5)}   ${(cumOption >= 0 ? '+' : '') + cumOption.toFixed(0).padStart(6)}`);

  // Quant fund readiness metrics
  console.log('\n╠══════════════════════════════════════════════════════════════════════════════════╣');
  console.log('║                         QUANT FUND READINESS METRICS                           ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════════════╣');
  
  const profitableDays = days.filter(([, s]) => s.stockPnl > 0).length;
  const totalDays = days.length;
  const sharpe = cumStock > 0 && totalDays > 1 ? (cumStock / totalDays) / (Math.sqrt(days.map(([,s]) => s.stockPnl).reduce((a, b) => a + (b - cumStock/totalDays)**2, 0) / totalDays) || 1) : 0;
  
  console.log(`\n  Tradeable Win Rate:     ${overallTradeAcc}% (${totalTradeCorrect}/${totalTradeable}) — need >52% sustained`);
  console.log(`  Elite Combo Win Rate:   ${overallEliteAcc}% (${totalEliteCorrect}/${totalElite}) — need >60% sustained`);
  console.log(`  Profitable Days:        ${profitableDays}/${totalDays} (${(profitableDays/totalDays*100).toFixed(0)}%) — need >60%`);
  console.log(`  Cumulative Stock P&L:   $${cumStock.toFixed(2)} (${(cumStock/10000*100).toFixed(1)}% on $10K)`);
  console.log(`  Cumulative Option P&L:  $${cumOption.toFixed(2)} (${(cumOption/10000*100).toFixed(1)}% on $10K)`);
  console.log(`  Approx Sharpe Ratio:    ${sharpe.toFixed(2)} — need >1.5 for institutional`);
  console.log(`  Volume:                 ${totalTradeable} tradeable signals in ${totalDays} days (${(totalTradeable/totalDays).toFixed(0)}/day)`);
  
  // Current top combos (last 48h)
  const recent = await pool.query(`
    SELECT archetype, symbol, time_horizon,
      COUNT(*) as n,
      COUNT(CASE WHEN ep_correct = true THEN 1 END) as correct
    FROM market_prediction_attempts
    WHERE resolved_at IS NOT NULL AND created_at > NOW() - INTERVAL '48 hours'
      AND archetype = ANY($1) AND symbol = ANY($2) AND time_horizon = ANY($3)
      AND predicted_direction IN ('up','down','bullish','bearish')
    GROUP BY archetype, symbol, time_horizon
    HAVING COUNT(*) >= 5
    ORDER BY COUNT(CASE WHEN ep_correct = true THEN 1 END)::float / COUNT(*) DESC
    LIMIT 10
  `, [ARCHETYPES, SYMBOLS, TIMEFRAMES]);
  
  console.log('\n  🔥 HOT COMBOS (last 48h, n>=5):');
  for (const r of recent.rows) {
    const acc = (parseInt(r.correct) / parseInt(r.n) * 100).toFixed(0);
    const combo = `${r.archetype}|${r.symbol}|${r.time_horizon}`;
    const elite = ELITE.has(combo) ? ' ⭐' : '';
    console.log(`     ${combo.padEnd(40)} ${acc}% (${r.correct}/${r.n})${elite}`);
  }

  console.log('\n╚══════════════════════════════════════════════════════════════════════════════════╝');
  console.log('  Run: node check-market-performance.mjs    (updates every time you run it)');
  console.log('  All data is 100% real — resolved predictions on real market prices.\n');

  // Save to daily performance table
  for (const [day, s] of days) {
    const allAcc = s.resolved > 0 ? s.correct / s.resolved : 0;
    const tradeAcc = s.tradeable > 0 ? s.tradeCorrect / s.tradeable : 0;
    const eliteAcc = s.elite > 0 ? s.eliteCorrect / s.elite : 0;
    
    await pool.query(`
      INSERT INTO market_daily_performance (date, total_predictions, resolved_predictions, correct_predictions, accuracy, tradeable_signals, tradeable_correct, tradeable_accuracy, elite_signals, elite_correct, elite_accuracy, simulated_stock_pnl, simulated_option_pnl, cumulative_stock_pnl, cumulative_option_pnl, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      ON CONFLICT (date) DO UPDATE SET
        total_predictions = EXCLUDED.total_predictions,
        resolved_predictions = EXCLUDED.resolved_predictions,
        correct_predictions = EXCLUDED.correct_predictions,
        accuracy = EXCLUDED.accuracy,
        tradeable_signals = EXCLUDED.tradeable_signals,
        tradeable_correct = EXCLUDED.tradeable_correct,
        tradeable_accuracy = EXCLUDED.tradeable_accuracy,
        elite_signals = EXCLUDED.elite_signals,
        elite_correct = EXCLUDED.elite_correct,
        elite_accuracy = EXCLUDED.elite_accuracy,
        simulated_stock_pnl = EXCLUDED.simulated_stock_pnl,
        simulated_option_pnl = EXCLUDED.simulated_option_pnl,
        cumulative_stock_pnl = EXCLUDED.cumulative_stock_pnl,
        cumulative_option_pnl = EXCLUDED.cumulative_option_pnl,
        updated_at = NOW()
    `, [day, s.total, s.resolved, s.correct, allAcc, s.tradeable, s.tradeCorrect, tradeAcc, s.elite, s.eliteCorrect, eliteAcc, s.stockPnl, s.optionPnl, cumStock, cumOption]);
  }

  await pool.end();
}

run().catch(err => { console.error(err); process.exit(1); });
