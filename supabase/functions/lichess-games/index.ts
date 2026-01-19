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
    const { player, since, until, max = 25 } = await req.json();

    if (!player) {
      return new Response(
        JSON.stringify({ error: 'Player username required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Lichess Games] Fetching games for ${player} (since: ${new Date(since).toISOString()}, until: ${new Date(until).toISOString()})`);

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
      console.warn(`[Lichess Games] Rate limited for ${player}`);
      return new Response(
        JSON.stringify({ error: 'Rate limited', retryAfter: 60 }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        if (game.moves && (game.status === 'mate' || game.status === 'resign' || game.status === 'stalemate')) {
          const moveCount = game.moves.split(' ').length;
          if (moveCount >= 40) {
            games.push({
              id: game.id,
              pgn: game.pgn,
              moves: game.moves,
              status: game.status,
              moveCount,
              createdAt: game.createdAt
            });
          }
        }
      } catch {
        // Skip malformed lines
      }
    }

    console.log(`[Lichess Games] Fetched ${games.length} valid games for ${player}`);

    return new Response(
      JSON.stringify({ games, count: games.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
