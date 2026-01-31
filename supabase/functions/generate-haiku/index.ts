import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pre-generated haiku templates for common chess themes
const HAIKU_TEMPLATES = {
  white_wins: [
    "Light conquers shadow\nPieces dance across the board\nCheckmate seals the fate",
    "White army advances\nStrategic brilliance unfolds\nVictory is won",
    "Pawns become queens now\nThe king trembles in his cage\nWhite claims the triumph",
  ],
  black_wins: [
    "Darkness rises strong\nSilent knights claim their revenge\nBlack king stands alone",
    "Shadow overcomes\nWhite's fortress crumbles to dust\nBlack writes history",
    "Night defeats the dawn\nPatient strategy prevails\nBlack's flag flies supreme",
  ],
  draw: [
    "Neither side yields ground\nEndless dance of equals matched\nPeace on sixty-four",
    "Two titans collide\nNeither breaks the other's will\nHonor in the draw",
    "Stalemate's gentle end\nBoth kings live to fight again\nBalance is restored",
  ],
  brilliant: [
    "Genius unfolds here\nMoves that echo through the years\nChess immortalized",
    "A masterpiece played\nEvery move a work of art\nBeauty on the board",
    "Brilliance crystallized\nMoments frozen in pure thought\nLegends never fade",
  ],
};

function generateTemplateHaiku(result: string, significance?: string): string {
  // Determine category based on result and significance
  let category: keyof typeof HAIKU_TEMPLATES = "brilliant";
  
  if (significance?.toLowerCase().includes("brilliant") || 
      significance?.toLowerCase().includes("immortal") ||
      significance?.toLowerCase().includes("masterpiece")) {
    category = "brilliant";
  } else if (result === "1-0" || result?.toLowerCase().includes("white")) {
    category = "white_wins";
  } else if (result === "0-1" || result?.toLowerCase().includes("black")) {
    category = "black_wins";
  } else if (result === "1/2-1/2" || result?.toLowerCase().includes("draw")) {
    category = "draw";
  }
  
  const templates = HAIKU_TEMPLATES[category];
  // Use a hash of the significance to pick consistently
  const hash = (significance || "").split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  return templates[hash % templates.length];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameTitle, white, black, year, event, significance, result, useAI = false } = await req.json();
    
    // OPTION 4: Use rule-based template by default (free)
    // Only use AI if explicitly requested AND API key exists
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!useAI || !LOVABLE_API_KEY) {
      // Generate using templates - completely free
      const haiku = generateTemplateHaiku(result, significance);
      console.log(`[Haiku] Generated template haiku for: ${gameTitle}`);
      return new Response(JSON.stringify({ haiku, source: "template" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI path - only when explicitly requested
    const prompt = `You are a master poet creating haikus for a luxury chess art book called "Carlsen in Color" featuring Magnus Carlsen's greatest games.

Write a haiku (5-7-5 syllable structure) that captures the essence of this chess game:

Game: "${gameTitle}"
Players: ${white} vs ${black}
Event: ${event}, ${year}
Result: ${result}
Significance: ${significance}

The haiku should:
- Evoke the drama, beauty, or significance of the game
- Use chess imagery metaphorically when possible
- Be elegant, timeless, and suitable for a coffee table art book
- Feel profound yet accessible

Return ONLY the haiku, with each line on a new line. No quotes, no explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a refined poet specializing in minimalist verse about chess." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      // Fallback to template on any AI error
      console.warn(`[Haiku] AI failed, falling back to template for: ${gameTitle}`);
      const haiku = generateTemplateHaiku(result, significance);
      return new Response(JSON.stringify({ haiku, source: "template_fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const haiku = data.choices?.[0]?.message?.content?.trim() || generateTemplateHaiku(result, significance);

    return new Response(JSON.stringify({ haiku, source: "ai" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    // Always return a template haiku on error - never fail completely
    const haiku = generateTemplateHaiku("1-0", "classic game");
    return new Response(JSON.stringify({ haiku, source: "error_fallback" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});