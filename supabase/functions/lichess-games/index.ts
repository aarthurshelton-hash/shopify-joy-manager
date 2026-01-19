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
            // Determine result string from winner/status
            let resultTag = '1/2-1/2';
            if (game.winner === 'white') resultTag = '1-0';
            else if (game.winner === 'black') resultTag = '0-1';
            
            // Build proper PGN if not provided (pgn field may be missing)
            const fullPgn = game.pgn || `[Event "Lichess Game"]
[Site "lichess.org"]
[Date "${new Date(game.createdAt).toISOString().split('T')[0].replace(/-/g, '.')}"]
[White "${game.players?.white?.user?.name || 'Unknown'}"]
[Black "${game.players?.black?.user?.name || 'Unknown'}"]
[Result "${resultTag}"]

${game.moves} ${resultTag}`;

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
              moves: game.moves,
              status: game.status,
              winner: game.winner,
              result: resultTag,
              moveCount,
              createdAt: game.createdAt,
              timeControl, // NEW: Include time control category
              whiteElo: game.players?.white?.rating,
              blackElo: game.players?.black?.rating,
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
