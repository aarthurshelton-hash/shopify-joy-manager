import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictionRecord {
  id: string;
  symbol: string;
  predicted_direction: string;
  predicted_confidence: number;
  predicted_target_move: number;
  price_at_prediction: number;
  expires_at: string;
  archetype: string;
  baseline_direction: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();

    if (action === 'resolve_expired') {
      // Find predictions that have expired but not resolved
      const { data: expiredPredictions, error: fetchError } = await supabase
        .from('stock_predictions')
        .select('*')
        .is('resolved_at', null)
        .lt('expires_at', new Date().toISOString())
        .limit(50);

      if (fetchError) throw fetchError;

      const resolved: string[] = [];
      const errors: string[] = [];

      for (const prediction of expiredPredictions || []) {
        try {
          // Fetch current price for the symbol
          const priceResponse = await fetch(`${supabaseUrl}/functions/v1/stock-data`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ action: 'quote', symbol: prediction.symbol }),
          });

          if (!priceResponse.ok) {
            errors.push(`Failed to fetch price for ${prediction.symbol}`);
            continue;
          }

          const stockData = await priceResponse.json();
          const outcomePrice = stockData.latestPrice;

          // Calculate actual results
          const priceChange = (outcomePrice - prediction.price_at_prediction) / prediction.price_at_prediction;
          const actualMove = Math.abs(priceChange * 100);

          let actualDirection: string;
          if (priceChange > 0.005) {
            actualDirection = 'bullish';
          } else if (priceChange < -0.005) {
            actualDirection = 'bearish';
          } else {
            actualDirection = 'neutral';
          }

          const wasCorrect = prediction.predicted_direction === actualDirection ||
            (prediction.predicted_direction === 'neutral' && actualDirection === 'neutral');

          // Calculate accuracy score
          const directionScore = wasCorrect ? 50 : 0;
          const moveAccuracy = Math.max(0, 50 - Math.abs(actualMove - prediction.predicted_target_move) * 5);
          const accuracyScore = Math.round(directionScore + moveAccuracy);

          // Check baseline accuracy
          const baselineWasCorrect = prediction.baseline_direction ? 
            prediction.baseline_direction === actualDirection : null;

          // Update the prediction
          const { error: updateError } = await supabase
            .from('stock_predictions')
            .update({
              resolved_at: new Date().toISOString(),
              outcome_price: outcomePrice,
              actual_direction: actualDirection,
              actual_move: Math.round(actualMove * 10) / 10,
              was_correct: wasCorrect,
              accuracy_score: accuracyScore,
              baseline_was_correct: baselineWasCorrect,
            })
            .eq('id', prediction.id);

          if (updateError) {
            errors.push(`Failed to update ${prediction.id}: ${updateError.message}`);
          } else {
            resolved.push(prediction.id);
          }
        } catch (err) {
          errors.push(`Error processing ${prediction.id}: ${err}`);
        }
      }

      return new Response(
        JSON.stringify({
          resolved: resolved.length,
          errors: errors.length,
          details: { resolved, errors },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_accuracy_stats') {
      // Get overall accuracy statistics
      const { data: stats, error: statsError } = await supabase
        .from('prediction_accuracy_stats')
        .select('*');

      if (statsError) throw statsError;

      // Get archetype performance
      const { data: archetypeStats, error: archetypeError } = await supabase
        .from('stock_predictions')
        .select('archetype, was_correct, accuracy_score, baseline_was_correct')
        .not('resolved_at', 'is', null);

      if (archetypeError) throw archetypeError;

      // Calculate archetype breakdown
      const archetypePerformance: Record<string, { 
        total: number; 
        correct: number; 
        avgAccuracy: number;
        baselineCorrect: number;
        baselineTotal: number;
      }> = {};

      for (const pred of archetypeStats || []) {
        if (!archetypePerformance[pred.archetype]) {
          archetypePerformance[pred.archetype] = {
            total: 0,
            correct: 0,
            avgAccuracy: 0,
            baselineCorrect: 0,
            baselineTotal: 0,
          };
        }
        const ap = archetypePerformance[pred.archetype];
        ap.total++;
        if (pred.was_correct) ap.correct++;
        ap.avgAccuracy += pred.accuracy_score || 0;
        if (pred.baseline_was_correct !== null) {
          ap.baselineTotal++;
          if (pred.baseline_was_correct) ap.baselineCorrect++;
        }
      }

      // Calculate averages
      for (const arch in archetypePerformance) {
        const ap = archetypePerformance[arch];
        ap.avgAccuracy = Math.round(ap.avgAccuracy / ap.total);
      }

      return new Response(
        JSON.stringify({
          overview: stats,
          archetypePerformance,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'save_prediction') {
      const { prediction, baseline } = await req.json();
      
      // Calculate expiration based on time horizon
      const horizonMs: Record<string, number> = {
        '1h': 60 * 60 * 1000,
        '4h': 4 * 60 * 60 * 1000,
        '1d': 24 * 60 * 60 * 1000,
        '1w': 7 * 24 * 60 * 60 * 1000,
      };
      
      const expiresAt = new Date(Date.now() + (horizonMs[prediction.prediction.timeHorizon] || horizonMs['1d']));

      const { data, error } = await supabase
        .from('stock_predictions')
        .insert({
          symbol: prediction.symbol,
          archetype: prediction.archetype,
          signature_fingerprint: prediction.signature,
          price_at_prediction: prediction.priceAtPrediction,
          predicted_direction: prediction.prediction.direction,
          predicted_confidence: prediction.prediction.confidence,
          predicted_target_move: prediction.prediction.targetMove,
          time_horizon: prediction.prediction.timeHorizon,
          expires_at: expiresAt.toISOString(),
          baseline_direction: baseline?.direction || null,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, prediction: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_recent_predictions') {
      const { data, error } = await supabase
        .from('stock_predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return new Response(
        JSON.stringify({ predictions: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Prediction resolution error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
