import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Lichess Opening Explorer API
 * 
 * Fetches opening data from Lichess Opening Explorer:
 * - Opening names and variations
 * - Similar positions from master games
 * - Win/draw/loss statistics
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache for rate limit protection
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes for opening data (fairly static)

// Rate limiting
let lastRequestTime = 0;
const MIN_INTERVAL = 1500; // 1.5 seconds between requests

interface OpeningExplorerResult {
  opening?: {
    eco: string;
    name: string;
  };
  white: number;
  draws: number;
  black: number;
  moves: Array<{
    uci: string;
    san: string;
    white: number;
    draws: number;
    black: number;
  }>;
  topGames?: Array<{
    id: string;
    white: { name: string; rating: number };
    black: { name: string; rating: number };
    winner?: string;
    year: number;
  }>;
  recentGames?: Array<{
    id: string;
    white: { name: string; rating: number };
    black: { name: string; rating: number };
    winner?: string;
    year: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fen, moves, variant = 'standard', ratings, speeds } = await req.json();

    // Need at least FEN or moves
    if (!fen && !moves) {
      return new Response(
        JSON.stringify({ error: 'FEN or moves required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create cache key
    const cacheKey = `${fen || ''}-${moves || ''}-${variant}-${ratings || ''}-${speeds || ''}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Lichess Opening Explorer] Cache hit`);
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
      );
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    if (timeSinceLast < MIN_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL - timeSinceLast));
    }
    lastRequestTime = Date.now();

    // Build Lichess Opening Explorer URL
    // We'll use both masters and lichess databases for comprehensive data
    const params = new URLSearchParams();
    if (fen) params.set('fen', fen);
    if (moves) params.set('play', moves);
    if (ratings) params.set('ratings', ratings);
    if (speeds) params.set('speeds', speeds);
    params.set('topGames', '5');
    params.set('recentGames', '5');

    // Fetch from masters database (classical games from titled players)
    const mastersUrl = `https://explorer.lichess.ovh/masters?${params.toString()}`;
    console.log(`[Lichess Opening Explorer] Fetching masters: ${mastersUrl}`);
    
    const mastersResponse = await fetch(mastersUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnPensent Chess Analysis (https://enpensent.com)'
      }
    });

    // Also fetch from Lichess database for broader statistics
    const lichessUrl = `https://explorer.lichess.ovh/lichess?${params.toString()}`;
    const lichessResponse = await fetch(lichessUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnPensent Chess Analysis (https://enpensent.com)'
      }
    });

    let mastersData: OpeningExplorerResult | null = null;
    let lichessData: OpeningExplorerResult | null = null;

    if (mastersResponse.ok) {
      mastersData = await mastersResponse.json();
    } else {
      console.warn(`[Lichess Opening Explorer] Masters API error: ${mastersResponse.status}`);
    }

    if (lichessResponse.ok) {
      lichessData = await lichessResponse.json();
    } else {
      console.warn(`[Lichess Opening Explorer] Lichess API error: ${lichessResponse.status}`);
    }

    // Combine results
    const combinedData = {
      opening: mastersData?.opening || lichessData?.opening,
      stats: {
        masters: mastersData ? {
          white: mastersData.white,
          draws: mastersData.draws,
          black: mastersData.black,
          total: mastersData.white + mastersData.draws + mastersData.black,
        } : null,
        lichess: lichessData ? {
          white: lichessData.white,
          draws: lichessData.draws,
          black: lichessData.black,
          total: lichessData.white + lichessData.draws + lichessData.black,
        } : null,
      },
      topMoves: (mastersData?.moves || lichessData?.moves || []).slice(0, 5).map(m => ({
        san: m.san,
        white: m.white,
        draws: m.draws,
        black: m.black,
        total: m.white + m.draws + m.black,
        whiteWinRate: m.white + m.draws + m.black > 0 
          ? Math.round((m.white / (m.white + m.draws + m.black)) * 100) 
          : 0,
      })),
      masterGames: (mastersData?.topGames || []).map(g => ({
        id: g.id,
        white: g.white.name,
        black: g.black.name,
        whiteRating: g.white.rating,
        blackRating: g.black.rating,
        winner: g.winner,
        year: g.year,
        url: `https://lichess.org/${g.id}`,
      })),
      recentGames: (lichessData?.recentGames || []).map(g => ({
        id: g.id,
        white: g.white.name,
        black: g.black.name,
        whiteRating: g.white.rating,
        blackRating: g.black.rating,
        winner: g.winner,
        year: g.year,
        url: `https://lichess.org/${g.id}`,
      })),
    };

    // Cache the response
    cache.set(cacheKey, { data: combinedData, timestamp: Date.now() });

    // Clean up old cache entries
    if (cache.size > 500) {
      const cutoff = Date.now() - CACHE_TTL;
      for (const [key, value] of cache.entries()) {
        if (value.timestamp < cutoff) cache.delete(key);
      }
    }

    console.log(`[Lichess Opening Explorer] Success: ${combinedData.opening?.name || 'Unknown position'}`);

    return new Response(
      JSON.stringify(combinedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error(`[Lichess Opening Explorer] Error:`, errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
