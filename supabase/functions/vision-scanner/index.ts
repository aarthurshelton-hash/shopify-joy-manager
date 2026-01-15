import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VisionMatch {
  visualization_id: string;
  public_share_id: string;
  title: string;
  confidence: number;
  image_url: string;
  game_hash: string;
  palette_id: string;
}

/**
 * Generate a compact, URL-safe hash of the game moves
 * This creates a canonical identifier for any game regardless of metadata
 */
function generateGameHash(pgn: string | undefined | null): string {
  if (!pgn) return 'empty';
  
  // Extract only the moves from PGN (strip headers, comments, variations)
  const movesOnly = extractMovesFromPgn(pgn);
  if (!movesOnly) return 'empty';
  
  // Create a compact hash of the moves
  return compactHash(movesOnly);
}

/**
 * Extract just the moves from a PGN string
 */
function extractMovesFromPgn(pgn: string): string {
  // Remove headers
  let cleaned = pgn.replace(/\[[^\]]*\]/g, '');
  
  // Remove comments
  cleaned = cleaned.replace(/\{[^}]*\}/g, '');
  
  // Remove variations
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  
  // Remove move numbers
  cleaned = cleaned.replace(/\d+\.\s*/g, '');
  
  // Remove result markers
  cleaned = cleaned.replace(/1-0|0-1|1\/2-1\/2|\*/g, '');
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Create a compact URL-safe hash from a string
 */
function compactHash(str: string): string {
  let hash = 0;
  let hash2 = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
    hash2 = ((hash2 << 7) + hash2 + char) | 0;
  }
  
  // Combine both hashes for better distribution
  const combined = Math.abs(hash) ^ Math.abs(hash2);
  
  // Convert to base36 for compact URL-safe representation
  return combined.toString(36);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64, image_url, image } = await req.json();
    
    // Accept either base64 data, URL, or legacy 'image' field
    const imageInput = image_base64 || image_url || image;
    
    if (!imageInput) {
      return new Response(
        JSON.stringify({ error: "No image provided. Send 'image_base64' or 'image_url'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Determine if this is a URL or base64
    const isUrl = imageInput.startsWith("http://") || imageInput.startsWith("https://");
    const isDataUrl = imageInput.startsWith("data:");
    
    // Format the image URL for the AI
    let formattedImageUrl: string;
    if (isUrl) {
      formattedImageUrl = imageInput;
    } else if (isDataUrl) {
      formattedImageUrl = imageInput;
    } else {
      // Assume raw base64, add data URL prefix
      formattedImageUrl = `data:image/jpeg;base64,${imageInput}`;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all visualizations with their images and PGN for hash generation
    const { data: visualizations, error: fetchError } = await supabase
      .from("saved_visualizations")
      .select("id, title, image_path, public_share_id, game_data, pgn")
      .not("public_share_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);

    if (fetchError) {
      throw fetchError;
    }

    if (!visualizations || visualizations.length === 0) {
      return new Response(
        JSON.stringify({ 
          matched: false, 
          message: "No visualizations in database to match against" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context about existing visualizations for the AI
    // Include game hash for each visualization
    const vizDescriptions = visualizations.map((viz, index) => {
      const gameData = viz.game_data as any;
      const whitePlayer = gameData?.white || gameData?.gameInfo?.white || "Unknown";
      const blackPlayer = gameData?.black || gameData?.gameInfo?.black || "Unknown";
      const paletteId = gameData?.palette?.id || gameData?.paletteId || "modern";
      const paletteName = gameData?.palette?.name || paletteId;
      const gameHash = generateGameHash(viz.pgn);
      
      return `[${index}] Title: "${viz.title}", Players: ${whitePlayer} vs ${blackPlayer}, Palette: ${paletteName}, GameHash: ${gameHash}`;
    }).join("\n");

    // Use Lovable AI with vision capability to analyze the image
    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert visual cryptography decoder for En Pensent chess visualizations. 

UNDERSTANDING THE VISUAL ENCRYPTION:
Each En Pensent visualization is a unique "visual encryption" of a chess game. The 8x8 grid encodes:
- Every square's color represents the LAST piece to visit that square
- The complete color pattern is like a fingerprint unique to that game's move sequence
- Different color palettes applied to the same game create different "visions" but share the same underlying encryption

VISUAL SIGNATURE ELEMENTS:
1. COLOR PATTERN: The 8x8 grid of solid colors - this is the PRIMARY identifier
2. PIECE COLORS: Each piece type has distinct colors (King=gold/orange, Queen=purple/magenta, Rook=blue, Bishop=green, Knight=teal, Pawn=red/brown variations)
3. TEXT OVERLAY: Title, player names, event info often appear
4. PALETTE STYLE: The color scheme (warm vs cool, vintage vs modern, etc.)

CRITICAL IMAGE ANALYSIS:
- The image may be a PHOTOGRAPH of a physical print, screen, or artwork
- IGNORE: backgrounds, fingers, desk surfaces, shadows, reflections, frames
- FOCUS: Find and decode the 8x8 colored grid pattern
- ANALYZE: The unique color distribution pattern (not just individual colors)
- The pattern is INVARIANT - same game = same pattern, just different colors based on palette

DECRYPTION PROCESS:
1. Locate the 8x8 grid in the image (may be angled, cropped, or have glare)
2. Analyze the COLOR DISTRIBUTION pattern - which squares are "hot" (frequently visited)
3. Look for characteristic game signatures (e.g., castled king patterns, central pawn structures)
4. Match against known game patterns in the database
5. Read any visible text for confirmation

Known visualizations in database (your reference encryption library):
${vizDescriptions}

RESPONSE FORMAT - Reply with ONLY a JSON object:

If you can decode and match the visual encryption:
{"matched": true, "index": <number>, "confidence": <0-100>, "decryption_notes": "<what patterns you identified>", "reason": "<brief match explanation>"}

If the pattern doesn't match any known encryption:
{"matched": false, "confidence": 0, "decryption_notes": "<what you observed>", "reason": "<why no match>", "is_valid_vision": <true if it looks like an En Pensent visualization>}

Only respond with the JSON object, nothing else.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Decode this image: Locate the visual encryption (8x8 color grid) and attempt to match it against the known game patterns. This could be a photograph of a print, a screen capture, or a photo of artwork. Ignore any background elements and focus on decrypting the color pattern fingerprint. Look for:
1. The unique 8x8 color grid pattern
2. Any visible text (title, players)
3. Color palette characteristics
4. Match against the known visual encryptions in the database.`
              },
              {
                type: "image_url",
                image_url: {
                  url: formattedImageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 600,
      }),
    });

    console.log("AI request sent for visual encryption decoding");

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("AI analysis error:", analysisResponse.status, errorText);
      
      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (analysisResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI analysis failed: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const aiResponse = analysisData.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    // Parse AI response
    let matchResult;
    try {
      // Clean up the response in case there's extra text
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        matchResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse);
      return new Response(
        JSON.stringify({ 
          matched: false, 
          message: "Could not decode the visual encryption. Please try a clearer image.",
          raw_response: aiResponse
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (matchResult.matched && typeof matchResult.index === "number") {
      const matchedViz = visualizations[matchResult.index];
      
      if (matchedViz) {
        // Generate the canonical game hash
        const gameHash = generateGameHash(matchedViz.pgn);
        const gameData = matchedViz.game_data as any;
        const paletteId = gameData?.palette?.id || gameData?.paletteId || "modern";
        
        // Use image_path directly if it's already a full URL, otherwise construct it
        let imageUrl = matchedViz.image_path;
        if (!imageUrl.startsWith("http")) {
          const { data: urlData } = supabase.storage
            .from("visualizations")
            .getPublicUrl(matchedViz.image_path);
          imageUrl = urlData.publicUrl;
        }

        const result: VisionMatch = {
          visualization_id: matchedViz.id,
          public_share_id: matchedViz.public_share_id,
          title: matchedViz.title,
          confidence: matchResult.confidence || 80,
          image_url: imageUrl,
          game_hash: gameHash,
          palette_id: paletteId
        };

        // Build canonical share URL with palette
        let canonicalUrl = `/g/${gameHash}`;
        if (paletteId && paletteId !== "modern") {
          canonicalUrl += `?p=${paletteId}`;
        }

        return new Response(
          JSON.stringify({ 
            matched: true, 
            vision: result,
            decryption_notes: matchResult.decryption_notes,
            reason: matchResult.reason,
            share_url: canonicalUrl,
            legacy_url: `/v/${matchedViz.public_share_id}`,
            game_hash: gameHash,
            palette_id: paletteId
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // No match found
    return new Response(
      JSON.stringify({ 
        matched: false, 
        message: matchResult.reason || "No matching visual encryption found. This may not be an En Pensent vision, or it may not be in our database yet.",
        is_valid_vision: matchResult.is_valid_vision || false,
        decryption_notes: matchResult.decryption_notes,
        confidence: matchResult.confidence || 0
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Vision scanner error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
