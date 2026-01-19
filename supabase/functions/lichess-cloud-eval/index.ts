import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fen, multiPv = 1, action } = await req.json();

    // Health check action
    if (action === 'check') {
      console.log('[LichessCloudEval] Checking availability...');
      const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(testFen)}&multiPv=1`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EnPensent Chess Analysis (https://enpensent.com)'
        }
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        return new Response(
          JSON.stringify({ available: false, rateLimited: true, resetInMs: parseInt(retryAfter) * 1000 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ available: response.ok, rateLimited: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normal evaluation
    if (!fen) {
      return new Response(
        JSON.stringify({ error: 'FEN position required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[LichessCloudEval] Evaluating: ${fen.substring(0, 50)}...`);

    const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=${multiPv}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnPensent Chess Analysis (https://enpensent.com)'
      }
    });

    if (response.status === 429) {
      console.warn('[LichessCloudEval] Rate limited');
      const retryAfter = response.headers.get('Retry-After') || '60';
      return new Response(
        JSON.stringify({ error: 'Rate limited', rateLimited: true, resetInMs: parseInt(retryAfter) * 1000 }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (response.status === 404) {
      // Position not in cloud database
      return new Response(
        JSON.stringify({ notFound: true, message: 'Position not in cloud database' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      console.error(`[LichessCloudEval] API error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: `Lichess API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`[LichessCloudEval] Success: depth ${data.depth}, ${data.pvs?.length || 0} PVs`);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('[LichessCloudEval] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
