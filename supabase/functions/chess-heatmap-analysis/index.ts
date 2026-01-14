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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pieceActivity, gameContext, territoryData }: AnalysisRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context for the AI
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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Parse the JSON response from the AI
    let insights;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      insights = JSON.parse(jsonStr.trim());
    } catch {
      // Fallback if parsing fails
      insights = {
        commentary: content.slice(0, 200),
        strategic: "Analysis based on piece movement patterns.",
        recommendation: "Explore the most active piece's heatmap for deeper insights.",
        comparison: "This game shows unique tactical patterns.",
        mvpInsight: "The most active piece played a crucial role.",
      };
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
