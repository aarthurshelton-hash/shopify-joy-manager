import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get recent prediction counts
    const { count: totalPredictions } = await supabase
      .from("chess_prediction_attempts")
      .select("*", { count: "exact", head: true });

    // Get predictions from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentPredictions } = await supabase
      .from("chess_prediction_attempts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneDayAgo);

    // Get latest evolution state
    const { data: evolutionState } = await supabase
      .from("evolution_state")
      .select("state_type, genes, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5);

    // Check for active locks
    const locks = evolutionState?.filter((s) => 
      s.state_type.includes("lock") && s.genes?.locked === true
    ) || [];

    // Get last benchmark result
    const { data: lastBenchmark } = await supabase
      .from("chess_benchmark_results")
      .select("created_at, hybrid_accuracy, stockfish_accuracy, completed_games")
      .order("created_at", { ascending: false })
      .limit(1);

    const data = {
      timestamp: new Date().toISOString(),
      status: "healthy",
      version: "2.0-HARDENED",
      functions: {
        benchmarkRunner: "active",
        continuousLearning: "active",
        autoEvolve: "active",
      },
      stats: {
        totalPredictions: totalPredictions || 0,
        predictionsLast24h: recentPredictions || 0,
        predictionsPerHour: Math.round((recentPredictions || 0) / 24),
      },
      locks: {
        active: locks.length,
        details: locks.map((l) => ({
          type: l.state_type,
          since: l.updated_at,
        })),
      },
      lastBenchmark: lastBenchmark?.[0] ? {
        completedAt: lastBenchmark[0].created_at,
        hybridAccuracy: lastBenchmark[0].hybrid_accuracy,
        stockfishAccuracy: lastBenchmark[0].stockfish_accuracy,
        gamesAnalyzed: lastBenchmark[0].completed_games,
      } : null,
      dataQuality: {
        ratedGamesOnly: true,
        minDepth: 22,
        minMoves: 40,
        excludeCorrespondence: true,
      },
    };

    return new Response(JSON.stringify(data, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[BenchmarkHealth] Error:", error);
    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
