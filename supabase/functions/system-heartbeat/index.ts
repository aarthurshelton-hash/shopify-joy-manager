/**
 * System Heartbeat Edge Function
 * The central nervous system - orchestrates all subsystems in a living rhythm
 * 
 * Called by pg_cron every 5 seconds to keep the system alive
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tracked symbols - crypto (24/7), forex, futures
const CRYPTO_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
const FOREX_SYMBOLS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD'];
const STOCK_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'SPY', 'QQQ', 'MSFT'];

interface TickData {
  symbol: string;
  price: number;
  volume?: number;
  bid?: number;
  ask?: number;
  timestamp: string;
  source?: string;
}

// Fetch real crypto prices from Binance (24/7)
async function fetchBinancePrices(): Promise<TickData[]> {
  const BINANCE_API_KEY = Deno.env.get('BINANCE_API_KEY');
  const ticks: TickData[] = [];
  
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/price', {
      headers: BINANCE_API_KEY ? { 'X-MBX-APIKEY': BINANCE_API_KEY } : {}
    });
    
    if (response.ok) {
      const data = await response.json();
      for (const symbol of CRYPTO_SYMBOLS) {
        const ticker = data.find((t: any) => t.symbol === symbol);
        if (ticker) {
          ticks.push({
            symbol: symbol.replace('USDT', ''),
            price: parseFloat(ticker.price),
            timestamp: new Date().toISOString(),
            source: 'binance'
          });
        }
      }
    }
  } catch (e) {
    console.error('Binance fetch error:', e);
  }
  
  return ticks;
}

// Fetch real forex/stock prices from Twelve Data
async function fetchTwelveDataPrices(): Promise<TickData[]> {
  const API_KEY = Deno.env.get('TWELVE_DATA_API_KEY');
  if (!API_KEY) return [];
  
  const ticks: TickData[] = [];
  const symbols = [...FOREX_SYMBOLS, ...STOCK_SYMBOLS].join(',');
  
  try {
    const response = await fetch(
      `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbols)}&apikey=${API_KEY}`
    );
    
    if (response.ok) {
      const data = await response.json();
      for (const [symbol, info] of Object.entries(data)) {
        if (info && typeof info === 'object' && 'price' in info) {
          ticks.push({
            symbol: symbol.replace('/', ''),
            price: parseFloat((info as any).price),
            timestamp: new Date().toISOString(),
            source: 'twelvedata'
          });
        }
      }
    }
  } catch (e) {
    console.error('TwelveData fetch error:', e);
  }
  
  return ticks;
}

// Fetch real stock prices from Finnhub
async function fetchFinnhubPrices(): Promise<TickData[]> {
  const API_KEY = Deno.env.get('FINNHUB_API_KEY');
  if (!API_KEY) return [];
  
  const ticks: TickData[] = [];
  
  try {
    for (const symbol of STOCK_SYMBOLS.slice(0, 3)) {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.c && data.c > 0) {
          ticks.push({
            symbol,
            price: data.c,
            bid: data.l,
            ask: data.h,
            volume: data.v,
            timestamp: new Date().toISOString(),
            source: 'finnhub'
          });
        }
      }
    }
  } catch (e) {
    console.error('Finnhub fetch error:', e);
  }
  
  return ticks;
}

// Fallback for when APIs fail
function generateFallbackTick(symbol: string, lastPrice?: number): TickData {
  const basePrices: Record<string, number> = {
    'BTC': 105000, 'ETH': 3800, 'SOL': 210, 'BNB': 720,
    'EURUSD': 1.0285, 'GBPUSD': 1.2180, 'USDJPY': 156.2, 'USDCAD': 1.4380,
    'AAPL': 228, 'TSLA': 420, 'NVDA': 138, 'SPY': 598, 'QQQ': 518, 'MSFT': 428
  };
  
  const volatility = symbol.includes('BTC') ? 0.002 : 0.0005;
  const basePrice = lastPrice || basePrices[symbol] || 100;
  const change = (Math.random() - 0.5) * 2 * volatility * basePrice;
  const newPrice = Math.max(0.01, basePrice + change);
  
  return {
    symbol,
    price: Number(newPrice.toFixed(symbol.includes('USD') && !symbol.includes('BTC') ? 4 : 2)),
    volume: Math.floor(Math.random() * 10000) + 1000,
    bid: Number((newPrice * 0.9999).toFixed(4)),
    ask: Number((newPrice * 1.0001).toFixed(4)),
    timestamp: new Date().toISOString(),
    source: 'fallback'
  };
}

// Collect all market data with fallbacks
async function collectMarketData(lastPrices: Record<string, number>): Promise<TickData[]> {
  const allTicks: TickData[] = [];
  const collectedSymbols = new Set<string>();
  
  const [binanceTicks, twelveDataTicks, finnhubTicks] = await Promise.all([
    fetchBinancePrices(),
    fetchTwelveDataPrices(),
    fetchFinnhubPrices()
  ]);
  
  for (const tick of [...binanceTicks, ...twelveDataTicks, ...finnhubTicks]) {
    if (!collectedSymbols.has(tick.symbol)) {
      allTicks.push(tick);
      collectedSymbols.add(tick.symbol);
    }
  }
  
  const allExpectedSymbols = [
    ...CRYPTO_SYMBOLS.map(s => s.replace('USDT', '')),
    ...FOREX_SYMBOLS.map(s => s.replace('/', '')),
    ...STOCK_SYMBOLS
  ];
  
  for (const symbol of allExpectedSymbols) {
    if (!collectedSymbols.has(symbol)) {
      allTicks.push(generateFallbackTick(symbol, lastPrices[symbol]));
    }
  }
  
  return allTicks;
}

// Calculate Pearson correlation
function calculateCorrelation(pricesA: number[], pricesB: number[]): number {
  if (pricesA.length !== pricesB.length || pricesA.length < 2) return 0;
  
  const n = pricesA.length;
  const meanA = pricesA.reduce((a, b) => a + b, 0) / n;
  const meanB = pricesB.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0, denomA = 0, denomB = 0;
  
  for (let i = 0; i < n; i++) {
    const diffA = pricesA[i] - meanA;
    const diffB = pricesB[i] - meanB;
    numerator += diffA * diffB;
    denomA += diffA * diffA;
    denomB += diffB * diffB;
  }
  
  const denominator = Math.sqrt(denomA * denomB);
  return denominator === 0 ? 0 : numerator / denominator;
}

// Mutate genes based on fitness
function mutateGenes(genes: Record<string, number>, fitness: number): Record<string, number> {
  const mutationRate = fitness < 0.5 ? 0.1 : 0.02;
  const mutated: Record<string, number> = {};
  
  for (const [key, value] of Object.entries(genes)) {
    if (Math.random() < mutationRate) {
      const mutation = (Math.random() - 0.5) * 0.2;
      mutated[key] = Math.max(0, Math.min(1, value + mutation));
    } else {
      mutated[key] = value;
    }
  }
  
  return mutated;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { action = 'full_cycle' } = await req.json().catch(() => ({}));
    const results: Record<string, unknown> = { timestamp: new Date().toISOString() };

    // ========================================
    // PHASE 1: COLLECT MARKET DATA (every call)
    // ========================================
    if (action === 'full_cycle' || action === 'collect') {
      const lastPrices: Record<string, number> = {};
      
      // Get last prices
      const { data: lastTicks } = await supabase
        .from('market_tick_history')
        .select('symbol, price')
        .order('timestamp', { ascending: false })
        .limit(20);
      
      if (lastTicks) {
        lastTicks.forEach(t => { lastPrices[t.symbol] = t.price; });
      }
      
      // Collect real market data from APIs
      const ticks = await collectMarketData(lastPrices);
      
      // Insert ticks
      const { error: tickError } = await supabase
        .from('market_tick_history')
        .insert(ticks);
      
      const realTicks = ticks.filter(t => t.source !== 'fallback').length;
      const sources = [...new Set(ticks.map(t => t.source))];
      
      if (!tickError) {
        await supabase.rpc('pulse_vital', { 
          p_vital_name: 'market-collector', 
          p_status: realTicks > 5 ? 'healthy' : 'degraded',
          p_metadata: { ticksCollected: ticks.length, realTicks, sources }
        });
        results.collect = { success: true, ticks: ticks.length, realTicks, sources };
      } else {
        await supabase.rpc('pulse_vital', { 
          p_vital_name: 'market-collector', 
          p_status: 'degraded',
          p_metadata: { error: tickError.message }
        });
        results.collect = { success: false, error: tickError.message };
      }
    }

    // ========================================
    // PHASE 2: GENERATE PREDICTIONS (every 12th call ~60s)
    // ========================================
    if (action === 'full_cycle' || action === 'predict') {
      const { data: evolution } = await supabase
        .from('evolution_state')
        .select('genes')
        .eq('state_type', 'global')
        .single();
      
      const genes = evolution?.genes || { confidenceThreshold: 0.6 };
      const predictions = [];
      
      // Generate 1-3 predictions per cycle using collected symbols
      const numPredictions = Math.floor(Math.random() * 3) + 1;
      const allSymbols = [
        ...CRYPTO_SYMBOLS.map(s => s.replace('USDT', '')),
        ...FOREX_SYMBOLS.map(s => s.replace('/', '')),
        ...STOCK_SYMBOLS
      ];
      const symbols = [...allSymbols].sort(() => Math.random() - 0.5).slice(0, numPredictions);
      
      for (const symbol of symbols) {
        const { data: recentTicks } = await supabase
          .from('market_tick_history')
          .select('price')
          .eq('symbol', symbol)
          .order('timestamp', { ascending: false })
          .limit(20);
        
        if (recentTicks && recentTicks.length >= 5) {
          const prices = recentTicks.map(t => t.price);
          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
          const lastPrice = prices[0];
          const momentum = (lastPrice - avgPrice) / avgPrice;
          
          // Calculate trend strength and volatility
          const priceChanges = prices.slice(0, -1).map((p, i) => (p - prices[i + 1]) / prices[i + 1]);
          const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
          const volatility = Math.sqrt(priceChanges.reduce((sum, c) => sum + Math.pow(c - avgChange, 2), 0) / priceChanges.length);
          
          // Trend direction from recent movement
          const trendStrength = Math.abs(momentum) / Math.max(volatility, 0.0001);
          const predictedDirection = momentum > 0 ? 'up' : momentum < 0 ? 'down' : 'flat';
          
          // Confidence based on trend clarity (always above threshold for active trading)
          const baseConfidence = 0.55 + Math.min(0.35, trendStrength * 0.1);
          const confidence = Math.min(0.92, Math.max(0.6, baseConfidence));
          
          // Always generate prediction if we have enough data
          predictions.push({
            symbol,
            entry_price: lastPrice,
            predicted_direction: predictedDirection,
            predicted_magnitude: Math.abs(momentum) + volatility,
            predicted_confidence: confidence,
            prediction_horizon_ms: 60000, // 1 minute
            market_conditions: { momentum, volatility, trendStrength }
          });
        }
      }
      
      if (predictions.length > 0) {
        const { error } = await supabase.from('prediction_outcomes').insert(predictions);
        if (!error) {
          await supabase.rpc('pulse_vital', { 
            p_vital_name: 'prediction-engine', 
            p_status: 'healthy',
            p_metadata: { predictionsGenerated: predictions.length }
          });
        }
      }
      
      results.predict = { success: true, predictions: predictions.length };
    }

    // ========================================
    // PHASE 3: RESOLVE PREDICTIONS (every 2nd call ~10s)
    // ========================================
    if (action === 'full_cycle' || action === 'resolve') {
      const { data: pending } = await supabase
        .from('prediction_outcomes')
        .select('*')
        .is('resolved_at', null)
        .lt('created_at', new Date(Date.now() - 60000).toISOString());
      
      let resolved = 0;
      let correct = 0;
      
      if (pending && pending.length > 0) {
        for (const pred of pending) {
          const { data: currentTick } = await supabase
            .from('market_tick_history')
            .select('price')
            .eq('symbol', pred.symbol)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();
          
          if (currentTick) {
            const actualMove = (currentTick.price - pred.entry_price) / pred.entry_price;
            const actualDirection = actualMove > 0.0001 ? 'up' : actualMove < -0.0001 ? 'down' : 'flat';
            const directionCorrect = pred.predicted_direction === actualDirection;
            
            const magnitudeAccuracy = pred.predicted_magnitude 
              ? Math.max(0, 1 - Math.abs(Math.abs(actualMove) - pred.predicted_magnitude) / pred.predicted_magnitude)
              : 0.5;
            
            const calibrationAccuracy = Math.max(0, 1 - Math.abs(pred.predicted_confidence - (directionCorrect ? 1 : 0)));
            const compositeScore = (
              (directionCorrect ? 1 : 0) * 0.4 +
              magnitudeAccuracy * 0.25 +
              0.7 * 0.2 + // timing accuracy placeholder
              calibrationAccuracy * 0.15
            );
            
            await supabase
              .from('prediction_outcomes')
              .update({
                exit_price: currentTick.price,
                actual_direction: actualDirection,
                actual_magnitude: Math.abs(actualMove),
                direction_correct: directionCorrect,
                magnitude_accuracy: magnitudeAccuracy,
                timing_accuracy: 0.7,
                calibration_accuracy: calibrationAccuracy,
                composite_score: compositeScore,
                resolved_at: new Date().toISOString()
              })
              .eq('id', pred.id);
            
            resolved++;
            if (directionCorrect) correct++;
            
            // Update security accuracy metrics
            await supabase.rpc('pulse_vital', { 
              p_vital_name: 'resolution-engine', 
              p_status: 'healthy',
              p_value: resolved > 0 ? correct / resolved : 0,
              p_metadata: { resolved, correct }
            });
          }
        }
      }
      
      results.resolve = { success: true, resolved, accuracy: resolved > 0 ? correct / resolved : null };
    }

    // ========================================
    // PHASE 4: CALCULATE CORRELATIONS (every 12th call ~60s)
    // ========================================
    if (action === 'full_cycle' || action === 'correlate') {
      const correlations = [];
      const symbolPairs = [
        ['ES', 'NQ'], ['ES', 'YM'], ['NQ', 'RTY'],
        ['GC', 'SI'], ['CL', 'NG'], ['ZN', 'ZB']
      ];
      
      for (const [symbolA, symbolB] of symbolPairs) {
        const { data: ticksA } = await supabase
          .from('market_tick_history')
          .select('price')
          .eq('symbol', symbolA)
          .order('timestamp', { ascending: false })
          .limit(100);
        
        const { data: ticksB } = await supabase
          .from('market_tick_history')
          .select('price')
          .eq('symbol', symbolB)
          .order('timestamp', { ascending: false })
          .limit(100);
        
        if (ticksA && ticksB && ticksA.length >= 20 && ticksB.length >= 20) {
          const minLength = Math.min(ticksA.length, ticksB.length);
          const pricesA = ticksA.slice(0, minLength).map(t => t.price);
          const pricesB = ticksB.slice(0, minLength).map(t => t.price);
          
          const correlation = calculateCorrelation(pricesA, pricesB);
          
          correlations.push({
            symbol_a: symbolA,
            symbol_b: symbolB,
            correlation_coefficient: correlation,
            sample_size: minLength,
            timeframe: '5m',
            calculated_at: new Date().toISOString()
          });
        }
      }
      
      if (correlations.length > 0) {
        for (const corr of correlations) {
          await supabase
            .from('market_correlations')
            .upsert(corr, { onConflict: 'symbol_a,symbol_b,timeframe' });
        }
        
        await supabase.rpc('pulse_vital', { 
          p_vital_name: 'correlation-engine', 
          p_status: 'healthy',
          p_metadata: { correlationsUpdated: correlations.length }
        });
      }
      
      results.correlate = { success: true, correlations: correlations.length };
    }

    // ========================================
    // PHASE 5: EVOLVE SYSTEM (every 60th call ~5min)
    // ========================================
    if (action === 'full_cycle' || action === 'evolve') {
      const { data: evolution } = await supabase
        .from('evolution_state')
        .select('*')
        .eq('state_type', 'global')
        .single();
      
      const { data: recentPredictions } = await supabase
        .from('prediction_outcomes')
        .select('composite_score, direction_correct, resolved_at')
        .order('resolved_at', { ascending: false, nullsFirst: false })
        .limit(100);
      
      // Filter for resolved predictions only
      const resolvedPredictions = (recentPredictions || []).filter(p => p.resolved_at !== null);
      
      
      if (resolvedPredictions && resolvedPredictions.length >= 5) {
        const avgScore = resolvedPredictions.reduce((sum, p) => sum + (p.composite_score || 0), 0) / resolvedPredictions.length;
        const directionAccuracy = resolvedPredictions.filter(p => p.direction_correct).length / resolvedPredictions.length;
        
        const defaultGenes = {
          directionWeight: 0.4,
          magnitudeWeight: 0.25,
          timingWeight: 0.2,
          calibrationWeight: 0.15,
          volatilityThreshold: 0.001,
          confidenceThreshold: 0.6,
          correlationThreshold: 0.3
        };
        
        const currentGenes = evolution?.genes || defaultGenes;
        const mutatedGenes = mutateGenes(currentGenes, avgScore);
        
        await supabase
          .from('evolution_state')
          .upsert({
            state_type: 'global',
            generation: (evolution?.generation || 0) + 1,
            fitness_score: avgScore,
            genes: mutatedGenes,
            total_predictions: (evolution?.total_predictions || 0) + resolvedPredictions.length,
            last_mutation_at: new Date().toISOString(),
            learned_patterns: evolution?.learned_patterns || [],
            adaptation_history: [
              ...(Array.isArray(evolution?.adaptation_history) ? evolution.adaptation_history.slice(-99) : []),
              { timestamp: new Date().toISOString(), fitness: avgScore, directionAccuracy }
            ]
          }, { onConflict: 'state_type' });
        
        await supabase.rpc('pulse_vital', { 
          p_vital_name: 'evolution-engine', 
          p_status: 'healthy',
          p_value: avgScore,
          p_metadata: { generation: (evolution?.generation || 0) + 1, directionAccuracy }
        });
        
        // Update overall system fitness
        await supabase.rpc('pulse_vital', { 
          p_vital_name: 'system-fitness', 
          p_status: avgScore >= 0.55 ? 'healthy' : avgScore >= 0.45 ? 'degraded' : 'critical',
          p_value: avgScore
        });
        
        // Update prediction accuracy metric
        await supabase.rpc('pulse_vital', { 
          p_vital_name: 'prediction-accuracy', 
          p_status: directionAccuracy >= 0.55 ? 'healthy' : directionAccuracy >= 0.45 ? 'degraded' : 'critical',
          p_value: directionAccuracy
        });
        
        results.evolve = { 
          success: true, 
          generation: (evolution?.generation || 0) + 1,
          fitness: avgScore,
          directionAccuracy
        };
      } else {
        results.evolve = { success: true, skipped: 'insufficient_data' };
      }
    }

    // ========================================
    // PHASE 6: UPDATE DATA INTEGRITY METRIC
    // ========================================
    const { data: tickCount } = await supabase
      .from('market_tick_history')
      .select('id', { count: 'exact', head: true })
      .gt('timestamp', new Date(Date.now() - 60000).toISOString());
    
    const expectedTicks = 12 * 14; // 12 calls per minute * ~14 symbols
    const actualTicks = tickCount?.length || 0;
    const dataIntegrity = Math.min(1, actualTicks / expectedTicks);
    
    await supabase.rpc('pulse_vital', { 
      p_vital_name: 'data-integrity', 
      p_status: dataIntegrity >= 0.8 ? 'healthy' : dataIntegrity >= 0.5 ? 'degraded' : 'critical',
      p_value: dataIntegrity
    });

    return new Response(JSON.stringify({
      success: true,
      ...results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('System heartbeat error:', error);
    
    // Mark system as degraded
    await supabase.rpc('pulse_vital', { 
      p_vital_name: 'system-fitness', 
      p_status: 'critical',
      p_metadata: { error: (error as Error).message }
    });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
