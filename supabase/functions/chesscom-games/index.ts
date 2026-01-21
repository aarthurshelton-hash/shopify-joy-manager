import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Chess.com Games Fetcher v1.0
 * 
 * Fetches games from Chess.com's public API.
 * API: https://www.chess.com/news/view/published-data-api
 * 
 * No authentication required for public game archives.
 * Rate limit: ~1 request/second recommended
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache for rate limit protection
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Rate limiting
let lastRequestTime = 0;
const MIN_INTERVAL = 1500; // 1.5s between requests (Chess.com is more lenient)
let rateLimitedUntil = 0;

function isRateLimited(): { limited: boolean; remainingMs: number } {
  const now = Date.now();
  if (rateLimitedUntil > now) {
    return { limited: true, remainingMs: rateLimitedUntil - now };
  }
  return { limited: false, remainingMs: 0 };
}

function recordRateLimit(seconds: number): void {
  rateLimitedUntil = Date.now() + (seconds * 1000);
  console.log(`[Chess.com] Rate limit recorded, expires at ${new Date(rateLimitedUntil).toISOString()}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { player, year, month, max = 25 } = await req.json();

    const rateLimitStatus = isRateLimited();
    if (rateLimitStatus.limited) {
      const remainingSec = Math.ceil(rateLimitStatus.remainingMs / 1000);
      return new Response(
        JSON.stringify({ 
          games: [], 
          count: 0,
          rateLimited: true, 
          resetInMs: rateLimitStatus.remainingMs,
          message: `API cooldown: ${remainingSec}s remaining`
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!player) {
      return new Response(
        JSON.stringify({ error: 'Player username required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default to current month if not specified
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth() + 1;
    const monthStr = String(targetMonth).padStart(2, '0');

    const cacheKey = `${player}-${targetYear}-${monthStr}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Chess.com] Cache hit for ${player}`);
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
      );
    }

    // Throttle requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    console.log(`[Chess.com] Fetching games for ${player} (${targetYear}/${monthStr})`);

    // Chess.com API: /pub/player/{username}/games/{YYYY}/{MM}
    const url = `https://api.chess.com/pub/player/${encodeURIComponent(player.toLowerCase())}/games/${targetYear}/${monthStr}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnPensent Chess Analysis (https://enpensent.com)'
      }
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      recordRateLimit(retryAfter);
      return new Response(
        JSON.stringify({ games: [], count: 0, rateLimited: true, resetInMs: retryAfter * 1000 }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (response.status === 404) {
      console.warn(`[Chess.com] Player "${player}" not found or no games in ${targetYear}/${monthStr}`);
      return new Response(
        JSON.stringify({ games: [], count: 0, skipped: true, reason: 'Player or archive not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      console.error(`[Chess.com] API error: ${response.status} for player ${player}`);
      return new Response(
        JSON.stringify({ error: `Chess.com API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const rawGames = data.games || [];
    
    const games = [];
    for (const game of rawGames.slice(-max)) { // Get most recent games
      try {
        // Skip games without PGN
        if (!game.pgn) continue;
        
        // Parse result from PGN or game data
        let resultTag = '1/2-1/2';
        if (game.white?.result === 'win') resultTag = '1-0';
        else if (game.black?.result === 'win') resultTag = '0-1';
        
        // Determine winner
        let winner: string | undefined;
        if (game.white?.result === 'win') winner = 'white';
        else if (game.black?.result === 'win') winner = 'black';
        
        // Extract move count from PGN
        const moveMatches = game.pgn.match(/\d+\./g);
        const moveCount = moveMatches ? moveMatches.length : 0;
        
        // Parse end_time for game date
        const gameDate = new Date((game.end_time || 0) * 1000);
        
        // Determine time control category
        let timeControl = 'classical';
        const timeClass = game.time_class || '';
        if (timeClass === 'bullet') timeControl = 'bullet';
        else if (timeClass === 'blitz') timeControl = 'blitz';
        else if (timeClass === 'rapid') timeControl = 'rapid';
        else if (timeClass === 'daily') timeControl = 'classical';

        // Extract ECO from PGN if available
        const ecoMatch = game.pgn.match(/\[ECO "([^"]+)"\]/);
        const openingMatch = game.pgn.match(/\[Opening "([^"]+)"\]/);
        
        games.push({
          id: game.uuid || game.url?.split('/').pop() || `chesscom-${Date.now()}`,
          pgn: game.pgn,
          moves: extractMovesFromPgn(game.pgn),
          status: game.white?.result || game.black?.result || 'unknown',
          winner,
          result: resultTag,
          moveCount,
          // Temporal context
          createdAt: (game.end_time || 0) * 1000,
          playedAt: gameDate.toISOString(),
          gameYear: gameDate.getFullYear(),
          gameMonth: gameDate.getMonth() + 1,
          // Game mode
          gameMode: timeControl,
          speed: game.time_class,
          perf: game.time_class,
          rated: game.rated ?? true,
          variant: game.rules || 'chess',
          source: 'chess.com',
          // Time control
          timeControl,
          clockInitial: parseTimeControl(game.time_control)?.initial,
          clockIncrement: parseTimeControl(game.time_control)?.increment,
          // Player context
          whiteName: game.white?.username || 'Unknown',
          blackName: game.black?.username || 'Unknown',
          whiteElo: game.white?.rating,
          blackElo: game.black?.rating,
          // Opening
          openingEco: ecoMatch?.[1],
          openingName: openingMatch?.[1],
          // Termination
          termination: game.white?.result || game.black?.result,
          url: game.url,
        });
      } catch (e) {
        console.warn(`[Chess.com] Skipping malformed game:`, e);
      }
    }

    console.log(`[Chess.com] Fetched ${games.length} valid games for ${player}`);

    const responseData = { games, count: games.length, source: 'chess.com' };
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    // Clean old cache
    if (cache.size > 100) {
      const cutoff = Date.now() - CACHE_TTL;
      for (const [key, value] of cache.entries()) {
        if (value.timestamp < cutoff) cache.delete(key);
      }
    }

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Chess.com] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper: Extract moves from PGN (remove headers and result)
function extractMovesFromPgn(pgn: string): string {
  const lines = pgn.split('\n');
  const moveLines = lines.filter(line => !line.startsWith('[') && line.trim());
  return moveLines.join(' ').replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '').trim();
}

// Helper: Parse time control string (e.g., "180+2" -> {initial: 180, increment: 2})
function parseTimeControl(tc: string | undefined): { initial: number; increment: number } | null {
  if (!tc) return null;
  const match = tc.match(/^(\d+)\+?(\d+)?$/);
  if (match) {
    return {
      initial: parseInt(match[1]) || 0,
      increment: parseInt(match[2]) || 0
    };
  }
  return null;
}
