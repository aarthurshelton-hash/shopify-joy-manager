import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EN_PENSENT_PITCH = `
# En Pensent: Universal Temporal Pattern Recognition Engine

## Core Concept
En Pensent is a paradigm-shifting framework that transforms ANY sequential domain into visual signatures for pattern matching and trajectory prediction.

## The Universal Formula
Sequential Events → Visual Signatures → Pattern Matching → Trajectory Prediction

## How It Works
1. **Temporal Signature Extraction**: Any sequence of events (chess moves, code commits, music notes, financial transactions) gets converted into a unique "fingerprint" - a visual/numerical signature capturing:
   - Quadrant Profile (spatial distribution across 4 zones)
   - Temporal Flow (how intensity evolves: opening → midgame → endgame)
   - Critical Moments (inflection points where trajectory changed)
   - Dominant Force & Flow Direction

2. **Archetype Classification**: Signatures are classified into behavioral archetypes:
   - Chess: Aggressive Attacker, Positional Strategist, Tactical Opportunist, etc.
   - Code: Steady Builder, Sprint Developer, Refactor Heavy, Feature Focused, etc.
   - Music: Could be Melodic, Rhythmic, Harmonic dominant
   - Finance: Could be Bull Runner, Bear Fighter, Swing Trader

3. **Pattern Matching**: New signatures are compared against a library of historical patterns with known outcomes using similarity algorithms (quadrant similarity, temporal flow similarity, fingerprint matching).

4. **Trajectory Prediction**: Based on matched patterns and their outcomes, the system predicts:
   - Most likely outcome with confidence %
   - Trajectory sustainability
   - Recommended actions based on archetype

## Current Implementation
- **Chess Domain**: Analyzes PGN games, extracts color flow signatures, predicts game outcomes
- **Code Domain**: Analyzes GitHub repositories, extracts commit patterns, predicts project health
- **Core SDK**: Domain-agnostic pattern recognition engine that any domain can plug into

## Key Innovation
Unlike traditional analysis that requires domain expertise, En Pensent treats ALL domains as "visual data" - reducing complex temporal sequences to comparable signatures. A chess grandmaster's game pattern can be compared to a successful startup's commit pattern because both are just temporal signatures.

## Business Model
- Pattern library becomes a data moat (millions of validated patterns with outcomes)
- Subscription for real-time analysis
- API for third-party integration
- Creator economics for pattern contributors

## Technical Stack
- TypeScript/React frontend
- Supabase backend with pattern storage
- Stockfish integration for chess validation
- GitHub API for code analysis
- Extensible adapter system for new domains
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { validationType = "full" } = await req.json();

    const systemPrompt = `You are a senior technology investor and AI/ML expert evaluating startup concepts. 
Be honest, critical, and constructive. Evaluate based on:
1. Technical feasibility and innovation
2. Market potential and differentiation  
3. Defensibility and moat potential
4. Clarity of vision and execution path

Provide a structured assessment with:
- Overall verdict (Strong/Promising/Needs Work/Weak)
- Innovation score (1-10)
- Market potential score (1-10)
- Technical feasibility score (1-10)
- Key strengths (bullet points)
- Key concerns (bullet points)
- Questions you'd ask in a pitch meeting
- Final recommendation

Be direct and honest - if something doesn't make sense, say so.`;

    const userPrompt = `Please evaluate this startup concept and technology:

${EN_PENSENT_PITCH}

Provide your honest assessment as if you were deciding whether to invest or recommend this to your partners.`;

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
          { role: "user", content: userPrompt }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in validate-concept:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
