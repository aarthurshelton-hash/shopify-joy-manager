import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Lichess Leaderboard Fetcher v1.0
 * 
 * Fetches live top players from Lichess leaderboards across game modes.
 * This provides a constantly refreshing source of high-caliber players
 * beyond static pools.
 * 
 * Endpoints used:
 * - /api/player/top/{nb}/{perfType} - Top N players for a specific mode
 * - /api/player - All leaderboards at once
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit tracking
let lastRequestTime = 0;
const MIN_INTERVAL = 2000; // 2 seconds between requests

// Cache leaderboards for 30 minutes (they don't change that often)
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { perfTypes = ['bullet', 'blitz', 'rapid', 'classical'], count = 50 } = await req.json().catch(() => ({}));

    // Check cache first
    const cacheKey = `leaderboard-${perfTypes.join(',')}-${count}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Lichess Leaderboard] Cache hit`);
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
      );
    }

    // Throttle requests
    const now = Date.now();
    if (now - lastRequestTime < MIN_INTERVAL) {
      await new Promise(r => setTimeout(r, MIN_INTERVAL - (now - lastRequestTime)));
    }
    lastRequestTime = Date.now();

    console.log(`[Lichess Leaderboard] Fetching top ${count} for: ${perfTypes.join(', ')}`);

    // Fetch all leaderboards at once (more efficient)
    const response = await fetch('https://lichess.org/api/player', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnPensent Chess Analysis (https://enpensent.com)'
      }
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      console.warn(`[Lichess Leaderboard] Rate limited for ${retryAfter}s`);
      return new Response(
        JSON.stringify({ error: 'Rate limited', retryAfter }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      throw new Error(`Lichess API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract players from requested perf types
    const players: Array<{
      username: string;
      rating: number;
      perfType: string;
      title?: string;
      online?: boolean;
      rank: number;
    }> = [];

    const seenUsernames = new Set<string>();

    for (const perfType of perfTypes) {
      const leaderboard = data[perfType];
      if (!leaderboard || !Array.isArray(leaderboard)) {
        console.log(`[Lichess Leaderboard] No data for ${perfType}`);
        continue;
      }

      let rank = 0;
      for (const player of leaderboard.slice(0, count)) {
        rank++;
        const username = player.username || player.id;
        if (!username) continue;
        
        // Avoid duplicates across perf types
        if (seenUsernames.has(username.toLowerCase())) continue;
        seenUsernames.add(username.toLowerCase());

        players.push({
          username,
          rating: player.perfs?.[perfType]?.rating || player.rating || 0,
          perfType,
          title: player.title,
          online: player.online,
          rank
        });
      }

      console.log(`[Lichess Leaderboard] ${perfType}: ${rank} players extracted`);
    }

    // Sort by rating descending
    players.sort((a, b) => b.rating - a.rating);

    const result = {
      players,
      count: players.length,
      perfTypes,
      fetchedAt: new Date().toISOString()
    };

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    console.log(`[Lichess Leaderboard] Total: ${players.length} unique players`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Lichess Leaderboard] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
