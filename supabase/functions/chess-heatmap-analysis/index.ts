import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PieceActivity {
  pieceType: string;
  color: string;
  count: number;
  percentage: number;
}

interface GameContext {
  whiteName?: string;
  blackName?: string;
  event?: string;
  result?: string;
  opening?: string;
  totalMoves: number;
}

interface AnalysisRequest {
  pieceActivity: PieceActivity[];
  gameContext: GameContext;
  territoryData?: {
    whiteControl: number;
    blackControl: number;
  };
  useAI?: boolean;
}

// OPTION 4: Rule-based analysis templates
function generateRuleBasedInsights(
  pieceActivity: PieceActivity[],
  gameContext: GameContext,
  territoryData?: { whiteControl: number; blackControl: number }
) {
  const sorted = [...pieceActivity].filter(p => p.count > 0).sort((a, b) => b.percentage - a.percentage);
  const mvp = sorted[0];
  const secondMvp = sorted[1];
  
  // Determine game characteristics
  const isKnightDominant = sorted.slice(0, 2).some(p => p.pieceType.toLowerCase() === "knight");
  const isBishopDominant = sorted.slice(0, 2).some(p => p.pieceType.toLowerCase() === "bishop");
  const isQueenActive = sorted.slice(0, 3).some(p => p.pieceType.toLowerCase() === "queen");
  const isRookEndgame = sorted.slice(0, 2).some(p => p.pieceType.toLowerCase() === "rook");
  
  // Build commentary based on patterns
  let commentary = "";
  if (mvp) {
    commentary = `The ${mvp.color} ${mvp.pieceType} dominated with ${mvp.percentage.toFixed(1)}% of all piece activity`;
    if (secondMvp) {
      commentary += `, followed by the ${secondMvp.color} ${secondMvp.pieceType}.`;
    } else {
      commentary += ".";
    }
  }
  
  // Strategic insight based on piece types
  let strategic = "";
  if (isKnightDominant) {
    strategic = "Knight activity suggests a closed position with complex maneuvering. Knights thrive in blocked pawn structures.";
  } else if (isBishopDominant) {
    strategic = "Bishop dominance indicates open diagonals and long-range pressure. This typically favors piece coordination.";
  } else if (isQueenActive) {
    strategic = "High queen activity often signals tactical complications and direct attacking play.";
  } else if (isRookEndgame) {
    strategic = "Rook activity suggests the game reached an endgame phase with open files becoming critical.";
  } else {
    strategic = "The piece activity shows balanced development with multiple pieces contributing to the game's dynamics.";
  }
  
  // Recommendation
  const leastActive = sorted[sorted.length - 1];
  let recommendation = "";
  if (leastActive && leastActive.percentage < 5) {
    recommendation = `Explore the ${leastActive.color} ${leastActive.pieceType}'s heatmap - its low activity might reveal missed opportunities.`;
  } else if (mvp) {
    recommendation = `The ${mvp.color} ${mvp.pieceType}'s heatmap shows the key squares that decided this game.`;
  } else {
    recommendation = "Examine individual piece heatmaps to understand the positional battle.";
  }
  
  // Comparison
  let comparison = "";
  if (gameContext.totalMoves > 60) {
    comparison = "This was a long strategic battle with above-average piece maneuvering.";
  } else if (gameContext.totalMoves < 30) {
    comparison = "A short, decisive game with concentrated piece activity.";
  } else {
    comparison = "Typical game length with standard piece activity distribution.";
  }
  
  // MVP insight
  let mvpInsight = "";
  if (mvp) {
    if (mvp.percentage > 30) {
      mvpInsight = `The ${mvp.color} ${mvp.pieceType} was clearly the star, responsible for nearly a third of all movement.`;
    } else if (mvp.percentage > 20) {
      mvpInsight = `The ${mvp.color} ${mvp.pieceType} played a crucial role in the game's outcome.`;
    } else {
      mvpInsight = `Activity was well-distributed, with the ${mvp.color} ${mvp.pieceType} slightly leading.`;
    }
  } else {
    mvpInsight = "Balanced piece usage across the board.";
  }
  
  return {
    commentary,
    strategic,
    recommendation,
    comparison,
    mvpInsight,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pieceActivity, gameContext, territoryData, useAI = false }: AnalysisRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    // OPTION 4: Use rule-based analysis by default (free)
    if (!useAI || !LOVABLE_API_KEY) {
      const insights = generateRuleBasedInsights(pieceActivity, gameContext, territoryData);
      console.log(`[HeatmapAnalysis] Generated rule-based insights for: ${gameContext.whiteName} vs ${gameContext.blackName}`);
      return new Response(JSON.stringify({ insights, source: "rules" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI path - only when explicitly requested
    const activitySummary = pieceActivity
      .filter(p => p.count > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .map(p => `${p.color} ${p.pieceType}: ${p.count} moves (${p.percentage.toFixed(1)}%)`)
      .join("\n");

    const territoryInfo = territoryData 
      ? `Territory Control: White ${territoryData.whiteControl.toFixed(1)}%, Black ${territoryData.blackControl.toFixed(1)}%`
      : "";

    const gameInfo = [
      gameContext.whiteName && gameContext.blackName ? `${gameContext.whiteName} vs ${gameContext.blackName}` : null,
      gameContext.event,
      gameContext.opening ? `Opening: ${gameContext.opening}` : null,
      gameContext.result ? `Result: ${gameContext.result}` : null,
      `Total moves: ${gameContext.totalMoves}`,
    ].filter(Boolean).join(" | ");

    const systemPrompt = `You are a chess grandmaster analyst providing insights about piece movement patterns visualized as heatmaps. 
Your responses should be:
- Insightful and educational
- Connect patterns to chess strategy concepts
- Mention specific pieces and their roles
- Be concise (2-4 sentences per insight)

Respond with a JSON object containing these fields:
- "commentary": A natural language observation about the most notable piece activity (1-2 sentences)
- "strategic": Why the dominant pieces were so active, connected to chess strategy (1-2 sentences)  
- "recommendation": Which piece's heatmap would be most interesting to explore and why (1 sentence)
- "comparison": How this game's piece activity compares to typical patterns for this type of game (1 sentence)
- "mvpInsight": A special insight about the Most Valuable Piece in this game (1 sentence)`;

    const userPrompt = `Analyze this chess game's piece activity:

Game: ${gameInfo}

Piece Activity (sorted by activity):
${activitySummary}

${territoryInfo}

Provide insights about the movement patterns.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      // Fallback to rule-based on any error
      console.warn(`[HeatmapAnalysis] AI failed, falling back to rules`);
      const insights = generateRuleBasedInsights(pieceActivity, gameContext, territoryData);
      return new Response(JSON.stringify({ insights, source: "rules_fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let insights;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      insights = JSON.parse(jsonStr.trim());
    } catch {
      // Fallback to rule-based
      insights = generateRuleBasedInsights(pieceActivity, gameContext, territoryData);
    }

    return new Response(JSON.stringify({ insights, source: "ai" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    // Always return rule-based insights on error
    const insights = generateRuleBasedInsights([], { totalMoves: 40 }, undefined);
    return new Response(JSON.stringify({ insights, source: "error_fallback" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});