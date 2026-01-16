/**
 * 24/7 Market Data Collector Edge Function
 * Runs continuously during market hours to collect tick data,
 * resolve predictions, update accuracy metrics, and evolve the system
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Futures contracts we track
const TRACKED_SYMBOLS = [
  'ES', 'NQ', 'ZN', 'CL', 'GC', 'VX', '6E', 'RTY',
  'YM', 'ZB', 'SI', 'HG', 'NG', 'ZC', 'ZS', 'ZW'
];

// Market hours (simplified - 24h futures)
const MARKET_SESSIONS = {
  'US_FUTURES': { open: 18, close: 17, timezone: 'America/New_York', days: [0, 1, 2, 3, 4, 5] },
  'FOREX': { open: 17, close: 17, timezone: 'America/New_York', days: [0, 1, 2, 3, 4, 5] },
  'CRYPTO': { open: 0, close: 24, timezone: 'UTC', days: [0, 1, 2, 3, 4, 5, 6] }
};

interface TickData {
  symbol: string;
  price: number;
  volume?: number;
  bid?: number;
  ask?: number;
  timestamp: string;
}

// Simulate market data (replace with real API integration)
function generateSimulatedTick(symbol: string, lastPrice?: number): TickData {
  const basePrice = lastPrice || getBasePrice(symbol);
  const volatility = getVolatility(symbol);
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

function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    'ES': 5200, 'NQ': 18500, 'ZN': 110, 'CL': 75,
    'GC': 2350, 'VX': 15, '6E': 1.08, 'RTY': 2050,
    'YM': 39000, 'ZB': 118, 'SI': 28, 'HG': 4.2,
    'NG': 2.5, 'ZC': 450, 'ZS': 1200, 'ZW': 600
  };
  return prices[symbol] || 100;
}

function getVolatility(symbol: string): number {
  const volatilities: Record<string, number> = {
    'ES': 0.0008, 'NQ': 0.001, 'ZN': 0.0003, 'CL': 0.002,
    'GC': 0.0006, 'VX': 0.02, '6E': 0.0004, 'RTY': 0.001,
    'YM': 0.0007, 'ZB': 0.0004, 'SI': 0.001, 'HG': 0.001,
    'NG': 0.003, 'ZC': 0.001, 'ZS': 0.0008, 'ZW': 0.001
  };
  return volatilities[symbol] || 0.001;
}

// Calculate correlation between two price series
function calculateCorrelation(pricesA: number[], pricesB: number[]): number {
  if (pricesA.length !== pricesB.length || pricesA.length < 2) return 0;
  
  const n = pricesA.length;
  const meanA = pricesA.reduce((a, b) => a + b, 0) / n;
  const meanB = pricesB.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denomA = 0;
  let denomB = 0;
  
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

// Update evolution state based on prediction outcomes
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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action = 'collect' } = await req.json().catch(() => ({}));

    if (action === 'collect') {
      // Collect tick data for all symbols
      const ticks: TickData[] = [];
      const lastPrices: Record<string, number> = {};
      
      // Get last prices from recent ticks
      for (const symbol of TRACKED_SYMBOLS) {
        const { data: lastTick } = await supabase
          .from('market_tick_history')
          .select('price')
          .eq('symbol', symbol)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();
        
        if (lastTick) {
          lastPrices[symbol] = lastTick.price;
        }
      }
      
      // Generate new ticks
      for (const symbol of TRACKED_SYMBOLS) {
        const tick = generateSimulatedTick(symbol, lastPrices[symbol]);
        ticks.push(tick);
      }
      
      // Insert ticks
      const { error: tickError } = await supabase
        .from('market_tick_history')
        .insert(ticks.map(t => ({
          symbol: t.symbol,
          price: t.price,
          volume: t.volume,
          bid: t.bid,
          ask: t.ask,
          timestamp: t.timestamp,
          source: 'collector'
        })));
      
      if (tickError) throw tickError;
      
      // Update collection status
      for (const symbol of TRACKED_SYMBOLS) {
        await supabase
          .from('market_collection_status')
          .upsert({
            market_name: symbol,
            is_collecting: true,
            last_tick_at: new Date().toISOString(),
            status: 'active'
          }, { onConflict: 'market_name' });
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        ticksCollected: ticks.length,
        symbols: TRACKED_SYMBOLS
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'resolve') {
      // Resolve pending predictions
      const { data: pending } = await supabase
        .from('prediction_outcomes')
        .select('*')
        .is('resolved_at', null)
        .lt('created_at', new Date(Date.now() - 5000).toISOString());
      
      if (pending && pending.length > 0) {
        for (const prediction of pending) {
          // Get current price for resolution
          const { data: currentTick } = await supabase
            .from('market_tick_history')
            .select('price')
            .eq('symbol', prediction.symbol)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();
          
          if (currentTick) {
            const actualMove = (currentTick.price - prediction.entry_price) / prediction.entry_price;
            const actualDirection = actualMove > 0.0001 ? 'up' : actualMove < -0.0001 ? 'down' : 'flat';
            const directionCorrect = prediction.predicted_direction === actualDirection ||
              (prediction.predicted_direction === 'up' && actualMove > 0) ||
              (prediction.predicted_direction === 'down' && actualMove < 0);
            
            const magnitudeAccuracy = prediction.predicted_magnitude 
              ? Math.max(0, 1 - Math.abs(Math.abs(actualMove) - prediction.predicted_magnitude) / prediction.predicted_magnitude)
              : 0.5;
            
            const timingAccuracy = 0.7 + Math.random() * 0.3; // Simplified
            const calibrationAccuracy = Math.max(0, 1 - Math.abs(prediction.predicted_confidence - (directionCorrect ? 1 : 0)));
            const compositeScore = (
              (directionCorrect ? 1 : 0) * 0.4 +
              magnitudeAccuracy * 0.25 +
              timingAccuracy * 0.2 +
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
                timing_accuracy: timingAccuracy,
                calibration_accuracy: calibrationAccuracy,
                composite_score: compositeScore,
                resolved_at: new Date().toISOString()
              })
              .eq('id', prediction.id);
            
            // Update security accuracy metrics
            const { data: existing } = await supabase
              .from('security_accuracy_metrics')
              .select('*')
              .eq('symbol', prediction.symbol)
              .single();
            
            if (existing) {
              const totalPred = existing.total_predictions + 1;
              const correctPred = existing.correct_predictions + (directionCorrect ? 1 : 0);
              
              await supabase
                .from('security_accuracy_metrics')
                .update({
                  total_predictions: totalPred,
                  correct_predictions: correctPred,
                  direction_accuracy: correctPred / totalPred,
                  magnitude_accuracy: (existing.magnitude_accuracy * existing.total_predictions + magnitudeAccuracy) / totalPred,
                  timing_accuracy: (existing.timing_accuracy * existing.total_predictions + timingAccuracy) / totalPred,
                  calibration_accuracy: (existing.calibration_accuracy * existing.total_predictions + calibrationAccuracy) / totalPred,
                  composite_accuracy: (existing.composite_accuracy * existing.total_predictions + compositeScore) / totalPred,
                  last_prediction_at: new Date().toISOString()
                })
                .eq('symbol', prediction.symbol);
            } else {
              await supabase
                .from('security_accuracy_metrics')
                .insert({
                  symbol: prediction.symbol,
                  total_predictions: 1,
                  correct_predictions: directionCorrect ? 1 : 0,
                  direction_accuracy: directionCorrect ? 1 : 0,
                  magnitude_accuracy: magnitudeAccuracy,
                  timing_accuracy: timingAccuracy,
                  calibration_accuracy: calibrationAccuracy,
                  composite_accuracy: compositeScore,
                  last_prediction_at: new Date().toISOString()
                });
            }
          }
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        resolved: pending?.length || 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'correlate') {
      // Calculate cross-correlations
      const correlations = [];
      
      for (let i = 0; i < TRACKED_SYMBOLS.length; i++) {
        for (let j = i + 1; j < TRACKED_SYMBOLS.length; j++) {
          const symbolA = TRACKED_SYMBOLS[i];
          const symbolB = TRACKED_SYMBOLS[j];
          
          // Get last 100 ticks for each
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
              timeframe: '1h',
              calculated_at: new Date().toISOString()
            });
          }
        }
      }
      
      // Upsert correlations
      for (const corr of correlations) {
        await supabase
          .from('market_correlations')
          .upsert(corr, { onConflict: 'symbol_a,symbol_b,timeframe' });
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        correlationsUpdated: correlations.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'evolve') {
      // Evolve the learning system based on recent performance
      const { data: evolution } = await supabase
        .from('evolution_state')
        .select('*')
        .eq('state_type', 'global')
        .single();
      
      // Get recent prediction performance
      const { data: recentPredictions } = await supabase
        .from('prediction_outcomes')
        .select('composite_score')
        .not('resolved_at', 'is', null)
        .order('resolved_at', { ascending: false })
        .limit(100);
      
      const avgScore = recentPredictions && recentPredictions.length > 0
        ? recentPredictions.reduce((sum, p) => sum + (p.composite_score || 0), 0) / recentPredictions.length
        : 0.5;
      
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
      
      const evolutionUpdate = {
        state_type: 'global',
        generation: (evolution?.generation || 0) + 1,
        fitness_score: avgScore,
        genes: mutatedGenes,
        total_predictions: (evolution?.total_predictions || 0) + (recentPredictions?.length || 0),
        last_mutation_at: new Date().toISOString()
      };
      
      await supabase
        .from('evolution_state')
        .upsert(evolutionUpdate, { onConflict: 'state_type' });
      
      return new Response(JSON.stringify({ 
        success: true, 
        generation: evolutionUpdate.generation,
        fitness: avgScore
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'report') {
      // Generate comprehensive report
      const { data: metrics } = await supabase
        .from('security_accuracy_metrics')
        .select('*')
        .order('composite_accuracy', { ascending: false });
      
      const { data: correlations } = await supabase
        .from('market_correlations')
        .select('*')
        .gt('correlation_coefficient', 0.5)
        .order('correlation_coefficient', { ascending: false })
        .limit(20);
      
      const { data: evolution } = await supabase
        .from('evolution_state')
        .select('*')
        .eq('state_type', 'global')
        .single();
      
      const { data: recentPredictions } = await supabase
        .from('prediction_outcomes')
        .select('*')
        .not('resolved_at', 'is', null)
        .order('resolved_at', { ascending: false })
        .limit(50);
      
      const overallAccuracy = metrics && metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.composite_accuracy, 0) / metrics.length
        : 0;
      
      return new Response(JSON.stringify({
        success: true,
        report: {
          generatedAt: new Date().toISOString(),
          overallAccuracy,
          securityMetrics: metrics,
          topCorrelations: correlations,
          evolutionState: evolution,
          recentPredictions: recentPredictions?.slice(0, 10),
          summary: {
            totalSecurities: metrics?.length || 0,
            totalPredictions: metrics?.reduce((sum, m) => sum + m.total_predictions, 0) || 0,
            avgDirectionAccuracy: metrics && metrics.length > 0
              ? metrics.reduce((sum, m) => sum + m.direction_accuracy, 0) / metrics.length
              : 0,
            generation: evolution?.generation || 0,
            systemFitness: evolution?.fitness_score || 0
          }
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Market collector error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
