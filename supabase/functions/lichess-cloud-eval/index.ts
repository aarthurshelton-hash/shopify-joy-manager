import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Server-side cache for evaluated positions (persists across requests within same instance)
const evaluationCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX_SIZE = 1000;

// Rate limit tracking
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 3200; // ~18 requests/min, safely under 20/min limit

function getCacheKey(fen: string, multiPv: number): string {
  return `${fen}:${multiPv}`;
}

function getCachedResult(key: string): unknown | null {
  const cached = evaluationCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  if (cached) {
    evaluationCache.delete(key); // Expired
  }
  return null;
}

function setCachedResult(key: string, data: unknown): void {
  // Evict oldest entries if cache is full
  if (evaluationCache.size >= CACHE_MAX_SIZE) {
    const firstKey = evaluationCache.keys().next().value;
    if (firstKey) evaluationCache.delete(firstKey);
  }
  evaluationCache.set(key, { data, timestamp: Date.now() });
}

async function throttleRequest(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    const waitTime = MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

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
      const cacheKey = getCacheKey(testFen, 1);
      
      // Check cache first
      const cached = getCachedResult(cacheKey);
      if (cached) {
        console.log('[LichessCloudEval] Check: Using cached result');
        return new Response(
          JSON.stringify({ available: true, rateLimited: false, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      await throttleRequest();
      
      const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(testFen)}&multiPv=1`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EnPensent Chess Analysis (https://enpensent.com)'
        }
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        console.warn(`[LichessCloudEval] Rate limited, retry after ${retryAfter}s`);
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

    const cacheKey = getCacheKey(fen, multiPv);
    
    // Check cache first
    const cached = getCachedResult(cacheKey);
    if (cached) {
      console.log(`[LichessCloudEval] Cache hit for: ${fen.substring(0, 30)}...`);
      return new Response(
        JSON.stringify(cached),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Throttle to stay under rate limit
    await throttleRequest();

    console.log(`[LichessCloudEval] Fetching: ${fen.substring(0, 40)}...`);

    const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=${multiPv}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnPensent Chess Analysis (https://enpensent.com)'
      }
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '60';
      console.warn(`[LichessCloudEval] Rate limited, retry after ${retryAfter}s`);
      return new Response(
        JSON.stringify({ error: 'Rate limited', rateLimited: true, resetInMs: parseInt(retryAfter) * 1000 }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (response.status === 404) {
      // Position not in cloud database - cache this too to avoid repeated lookups
      const notFoundResult = { notFound: true, message: 'Position not in cloud database' };
      setCachedResult(cacheKey, notFoundResult);
      return new Response(
        JSON.stringify(notFoundResult),
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

    // Cache successful result
    setCachedResult(cacheKey, data);

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
