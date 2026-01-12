import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameTitle, white, black, year, event, significance, result } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
      const error = await response.text();
      console.error("AI error:", error);
      throw new Error("Failed to generate haiku");
    }

    const data = await response.json();
    const haiku = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ haiku }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
