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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64, image_url } = await req.json();
    
    // Accept either base64 data or a URL
    const imageInput = image_base64 || image_url;
    
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

    // Fetch all visualizations with their images for comparison
    const { data: visualizations, error: fetchError } = await supabase
      .from("saved_visualizations")
      .select("id, title, image_path, public_share_id, game_data")
      .not("public_share_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(100); // Limit for performance

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
    const vizDescriptions = visualizations.map((viz, index) => {
      const gameData = viz.game_data as any;
      const whitePlayer = gameData?.white || gameData?.gameInfo?.white || "Unknown";
      const blackPlayer = gameData?.black || gameData?.gameInfo?.black || "Unknown";
      return `[${index}] ID: ${viz.public_share_id}, Title: "${viz.title}", Players: ${whitePlayer} vs ${blackPlayer}`;
    }).join("\n");

    // Get public URLs for visualization images to send to AI
    const vizWithUrls = await Promise.all(
      visualizations.slice(0, 10).map(async (viz) => { // Limit to 10 for API constraints
        const { data: urlData } = supabase.storage
          .from("visualizations")
          .getPublicUrl(viz.image_path);
        return {
          ...viz,
          public_url: urlData.publicUrl
        };
      })
    );

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
            content: `You are an expert at analyzing En Pensent chess visualization art. These visualizations are unique 8x8 grid patterns where each square's color represents which chess piece last visited that square during a game.

Key characteristics of En Pensent visualizations:
- 8x8 grid layout (like a chessboard)
- Each square has a solid color from a palette
- The pattern is unique to each game's move history
- Colors typically include variations for: King, Queen, Rook, Bishop, Knight, Pawns
- May have a title, player names, and QR code overlay

IMPORTANT IMAGE ANALYSIS INSTRUCTIONS:
- The image may be a photograph of a print, a screenshot, or a photo of a screen
- IGNORE background noise, fingers, desk surfaces, shadows, reflections, or other objects in the photo
- FOCUS ONLY on finding the 8x8 colored grid pattern characteristic of En Pensent visualizations
- The visualization may be at an angle, partially cropped, or have glare - still try to identify it
- Look for ANY visible text like player names, game titles, or dates that could help identify the visualization
- If you see multiple visualizations in the image, focus on the most prominent/largest one
- Even if image quality is poor, attempt a match if you can discern the general color pattern

Your task: Analyze the uploaded image and try to match it to one of the known visualizations.

Known visualizations in database:
${vizDescriptions}

If you can identify which visualization this is (by recognizing the color pattern, title text, or any identifying features), respond with ONLY a JSON object:
{"matched": true, "index": <number>, "confidence": <0-100>, "reason": "<brief explanation>"}

If you cannot match it to any known visualization:
{"matched": false, "confidence": 0, "reason": "<why it couldn't be matched>"}

IMPORTANT: Only respond with the JSON object, no other text.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image and identify if it matches any En Pensent visualization in the database. This could be a photograph of a print, a screenshot, or a photo of a screen - ignore any background noise, fingers, or other objects. Focus on finding the 8x8 colored grid pattern and any visible text (title, player names) or QR codes. Match the color pattern to the known visualizations."
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
        max_tokens: 500,
      }),
    });

    console.log("AI request sent for image analysis");

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("AI analysis error:", analysisResponse.status, errorText);
      
      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          message: "Could not analyze the image. Please try a clearer photo.",
          raw_response: aiResponse
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (matchResult.matched && typeof matchResult.index === "number") {
      const matchedViz = visualizations[matchResult.index];
      
      if (matchedViz) {
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
          image_url: imageUrl
        };

        return new Response(
          JSON.stringify({ 
            matched: true, 
            vision: result,
            reason: matchResult.reason,
            share_url: `/v/${matchedViz.public_share_id}`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // No match found
    return new Response(
      JSON.stringify({ 
        matched: false, 
        message: matchResult.reason || "No matching visualization found. This may not be an En Pensent vision, or it may not be in our database yet.",
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
