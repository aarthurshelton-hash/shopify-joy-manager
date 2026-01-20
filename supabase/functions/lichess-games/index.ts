import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache for rate limit protection (10-minute TTL)
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (longer to reduce repeated hits)

// Track last request time for throttling with exponential backoff
let lastRequestTime = 0;
let baseInterval = 2500; // Start at 2.5 seconds
let consecutiveRequests = 0;
let lastRateLimitTime = 0;

// Dynamic interval: increases after rate limits, decreases after successful requests
function getRequestInterval(): number {
  const timeSinceRateLimit = Date.now() - lastRateLimitTime;
  // If we hit a rate limit recently (last 60s), use longer intervals
  if (timeSinceRateLimit < 60000) {
    return Math.min(baseInterval * 2, 10000); // Max 10s
  }
  // After 5+ consecutive successful requests, reduce interval
  if (consecutiveRequests > 5) {
    return Math.max(baseInterval * 0.8, 2000); // Min 2s
  }
  return baseInterval;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { player, since, until, max = 25 } = await req.json();

    if (!player) {
      return new Response(
        JSON.stringify({ error: 'Player username required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create cache key
    const cacheKey = `${player}-${since}-${until}-${max}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Lichess Games] Cache hit for ${player}`);
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
      );
    }

    // Server-side throttle with adaptive interval
    const now = Date.now();
    const interval = getRequestInterval();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < interval) {
      const waitTime = interval - timeSinceLastRequest;
      console.log(`[Lichess Games] Throttling: waiting ${waitTime}ms (interval: ${interval}ms)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();

    const sinceStr = since ? new Date(since).toISOString() : 'oldest';
    const untilStr = until ? new Date(until).toISOString() : 'now';
    console.log(`[Lichess Games] Fetching games for ${player} (since: ${sinceStr}, until: ${untilStr})`);

    const url = `https://lichess.org/api/games/user/${encodeURIComponent(player)}?` + 
      `max=${max}&` +
      `rated=true&` +
      `perfType=bullet,blitz,rapid,classical&` +
      `moves=true&` +
      `pgnInJson=true&` +
      (since ? `since=${since}&` : '') +
      (until ? `until=${until}&` : '') +
      `sort=dateDesc`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/x-ndjson',
        'User-Agent': 'EnPensent Chess Analysis (https://enpensent.com)'
      }
    });

    if (response.status === 429) {
      console.warn(`[Lichess Games] Rate limited for ${player} - increasing backoff`);
      lastRateLimitTime = Date.now();
      baseInterval = Math.min(baseInterval * 1.5, 10000); // Increase base interval, max 10s
      consecutiveRequests = 0;
      return new Response(
        JSON.stringify({ error: 'Rate limited', retryAfter: 60, backoffMs: baseInterval }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      );
    }

    if (!response.ok) {
      console.error(`[Lichess Games] API error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: `Lichess API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const text = await response.text();
    const lines = text.trim().split('\n').filter(l => l);
    
    const games = [];
    for (const line of lines) {
      try {
        const game = JSON.parse(line);
        
        // v6.57-ID-ONLY: ABSORB EVERYTHING - only need an ID
        // Universal intelligence handles all edge cases client-side
        if (!game.id) continue;
        
        const moveCount = game.moves ? game.moves.split(' ').length : 0;
        
        // Determine result string from winner/status
        let resultTag = '1/2-1/2';
        if (game.winner === 'white') resultTag = '1-0';
        else if (game.winner === 'black') resultTag = '0-1';
        
        // Extract player names
        const whiteName = game.players?.white?.user?.name || game.players?.white?.user?.id || 'Unknown';
        const blackName = game.players?.black?.user?.name || game.players?.black?.user?.id || 'Unknown';
        
        // Extract game date (createdAt is in milliseconds)
        const gameDate = new Date(game.createdAt || Date.now());
        const formattedDate = gameDate.toISOString().split('T')[0].replace(/-/g, '.');
        
        // Build proper PGN with FULL metadata
        const fullPgn = game.pgn || `[Event "Lichess ${game.speed || 'Game'}"]
[Site "lichess.org/${game.id}"]
[Date "${formattedDate}"]
[White "${whiteName}"]
[Black "${blackName}"]
[WhiteElo "${game.players?.white?.rating || '?'}"]
[BlackElo "${game.players?.black?.rating || '?'}"]
[Result "${resultTag}"]
[TimeControl "${game.clock?.initial || 0}+${game.clock?.increment || 0}"]
[ECO "${game.opening?.eco || '?'}"]
[Opening "${game.opening?.name || 'Unknown'}"]

${game.moves || ''} ${resultTag}`;

        // Extract time control from speed field
        let timeControl = 'classical';
        if (game.speed === 'bullet' || game.speed === 'ultraBullet') {
          timeControl = 'bullet';
        } else if (game.speed === 'blitz') {
          timeControl = 'blitz';
        } else if (game.speed === 'rapid') {
          timeControl = 'rapid';
        } else if (game.speed === 'classical' || game.speed === 'correspondence') {
          timeControl = 'classical';
        } else if (game.perf) {
          timeControl = game.perf;
        }
        
        games.push({
          id: game.id,
          pgn: fullPgn,
          moves: game.moves || '',
          status: game.status || 'unknown',
          winner: game.winner,
          result: resultTag,
          moveCount,
          // FULL TEMPORAL CONTEXT
          createdAt: game.createdAt,
          playedAt: gameDate.toISOString(),
          gameYear: gameDate.getFullYear(),
          gameMonth: gameDate.getMonth() + 1,
          gameDayOfWeek: gameDate.getDay(),
          gameHour: gameDate.getHours(),
          // GAME MODE CONTEXT
          gameMode: timeControl,
          speed: game.speed,
          perf: game.perf || game.speed,
          rated: game.rated ?? true,
          variant: game.variant || 'standard',
          source: game.source || 'lobby',
          // TIME CONTROL CONTEXT  
          timeControl,
          clockInitial: game.clock?.initial,
          clockIncrement: game.clock?.increment,
          clockTotalTime: (game.clock?.initial || 0) + (40 * (game.clock?.increment || 0)),
          // PLAYER CONTEXT
          whiteName,
          blackName,
          whiteElo: game.players?.white?.rating,
          blackElo: game.players?.black?.rating,
          whiteTitle: game.players?.white?.user?.title,
          blackTitle: game.players?.black?.user?.title,
          whiteProvisional: game.players?.white?.provisional,
          blackProvisional: game.players?.black?.provisional,
          // OPENING CONTEXT
          openingEco: game.opening?.eco,
          openingName: game.opening?.name,
          openingPly: game.opening?.ply,
          // TERMINATION CONTEXT
          termination: game.status,
          lastMoveAt: game.lastMoveAt,
        });
      } catch {
        // Skip malformed lines
      }
    }

    console.log(`[Lichess Games] Fetched ${games.length} valid games for ${player}`);
    consecutiveRequests++;
    // Gradually reduce interval after successful requests
    if (consecutiveRequests > 3) {
      baseInterval = Math.max(baseInterval * 0.95, 2000);
    }

    // Cache successful response
    const responseData = { games, count: games.length };
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    
    // Clean up old cache entries periodically
    if (cache.size > 100) {
      const cutoff = Date.now() - CACHE_TTL;
      for (const [key, value] of cache.entries()) {
        if (value.timestamp < cutoff) cache.delete(key);
      }
    }

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Lichess Games] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
