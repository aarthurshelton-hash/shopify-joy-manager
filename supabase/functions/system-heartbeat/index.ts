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

// Tracked symbols for market collection
const TRACKED_SYMBOLS = [
  'ES', 'NQ', 'ZN', 'CL', 'GC', 'VX', '6E', 'RTY',
  'YM', 'ZB', 'SI', 'HG', 'NG', 'ZC', 'ZS', 'ZW'
];

interface TickData {
  symbol: string;
  price: number;
  volume?: number;
  bid?: number;
  ask?: number;
  timestamp: string;
}

// Generate simulated tick with realistic price movement
function generateTick(symbol: string, lastPrice?: number): TickData {
  const basePrices: Record<string, number> = {
    'ES': 5200, 'NQ': 18500, 'ZN': 110, 'CL': 75,
    'GC': 2350, 'VX': 15, '6E': 1.08, 'RTY': 2050,
    'YM': 39000, 'ZB': 118, 'SI': 28, 'HG': 4.2,
    'NG': 2.5, 'ZC': 450, 'ZS': 1200, 'ZW': 600
  };
  
  const volatilities: Record<string, number> = {
    'ES': 0.0008, 'NQ': 0.001, 'ZN': 0.0003, 'CL': 0.002,
    'GC': 0.0006, 'VX': 0.02, '6E': 0.0004, 'RTY': 0.001,
    'YM': 0.0007, 'ZB': 0.0004, 'SI': 0.001, 'HG': 0.001,
    'NG': 0.003, 'ZC': 0.001, 'ZS': 0.0008, 'ZW': 0.001
  };
  
  const basePrice = lastPrice || basePrices[symbol] || 100;
  const volatility = volatilities[symbol] || 0.001;
  const change = (Math.random() - 0.5) * 2 * volatility * basePrice;
  const newPrice = Math.max(0.01, basePrice + change);
  
  return {
    symbol,
    price: Number(newPrice.toFixed(4)),
    volume: Math.floor(Math.random() * 1000) + 100,
    bid: Number((newPrice - 0.01).toFixed(4)),
    ask: Number((newPrice + 0.01).toFixed(4)),
    timestamp: new Date().toISOString()
  };
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
      const ticks: TickData[] = [];
      const lastPrices: Record<string, number> = {};
      
      // Get last prices
      const { data: lastTicks } = await supabase
        .from('market_tick_history')
        .select('symbol, price')
        .order('timestamp', { ascending: false })
        .limit(TRACKED_SYMBOLS.length);
      
      if (lastTicks) {
        lastTicks.forEach(t => { lastPrices[t.symbol] = t.price; });
      }
      
      // Generate new ticks
      for (const symbol of TRACKED_SYMBOLS) {
        ticks.push(generateTick(symbol, lastPrices[symbol]));
      }
      
      // Insert ticks
      const { error: tickError } = await supabase
        .from('market_tick_history')
        .insert(ticks.map(t => ({ ...t, source: 'heartbeat' })));
      
      if (!tickError) {
        await supabase.rpc('pulse_vital', { 
          p_vital_name: 'market-collector', 
          p_status: 'healthy',
          p_metadata: { ticksCollected: ticks.length }
        });
        results.collect = { success: true, ticks: ticks.length };
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
      
      // Generate 1-3 predictions per cycle
      const numPredictions = Math.floor(Math.random() * 3) + 1;
      const symbols = [...TRACKED_SYMBOLS].sort(() => Math.random() - 0.5).slice(0, numPredictions);
      
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
          
          const predictedDirection = momentum > 0.0005 ? 'up' : momentum < -0.0005 ? 'down' : 'flat';
          const confidence = Math.min(0.95, Math.max(0.3, 0.5 + Math.abs(momentum) * 100));
          
          if (confidence >= (genes.confidenceThreshold || 0.6)) {
            predictions.push({
              symbol,
              entry_price: lastPrice,
              predicted_direction: predictedDirection,
              predicted_magnitude: Math.abs(momentum) + 0.001,
              predicted_confidence: confidence,
              prediction_horizon_ms: 60000 // 1 minute
            });
          }
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
        .select('composite_score, direction_correct')
        .not('resolved_at', 'is', null)
        .order('resolved_at', { ascending: false })
        .limit(100);
      
      if (recentPredictions && recentPredictions.length >= 10) {
        const avgScore = recentPredictions.reduce((sum, p) => sum + (p.composite_score || 0), 0) / recentPredictions.length;
        const directionAccuracy = recentPredictions.filter(p => p.direction_correct).length / recentPredictions.length;
        
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
            total_predictions: (evolution?.total_predictions || 0) + recentPredictions.length,
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
    
    const expectedTicks = 12 * TRACKED_SYMBOLS.length; // 12 calls per minute * 16 symbols
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
