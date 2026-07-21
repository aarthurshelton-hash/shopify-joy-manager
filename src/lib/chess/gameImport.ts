/**
 * Game import utilities — pull a player's recent games from public APIs.
 *
 * Lichess:  https://lichess.org/api/games/user/{username}  (public, no auth for public games)
 * Chess.com: https://api.chess.com/pub/player/{username}/games/{yyyy}/{mm}
 *
 * Both return PGN data we can feed straight into the existing simulator.
 */

export interface ImportedGame {
  id: string;
  white: string;
  black: string;
  result: string;
  date: string;
  event: string;
  pgn: string;
}

/** Parse a small subset of PGN headers for display metadata. */
function parseHeaders(pgn: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const regex = /\[(\w+)\s+"([^"]*)"\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(pgn)) !== null) {
    headers[match[1]] = match[2];
  }
  return headers;
}

/** Split a multi-game PGN blob into individual game strings. */
function splitPgnGames(blob: string): string[] {
  // Games are separated by a blank line followed by a new [Event ...] tag.
  const parts = blob
    .split(/\n\n(?=\[Event )/g)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts;
}

function toImportedGame(pgn: string, index: number, source: string): ImportedGame {
  const h = parseHeaders(pgn);
  return {
    id: `${source}-${index}-${h.Date || ''}-${h.White || ''}-${h.Black || ''}`.replace(/\s+/g, '_'),
    white: h.White || 'White',
    black: h.Black || 'Black',
    result: h.Result || '',
    date: h.UTCDate || h.Date || '',
    event: h.Event || source,
    pgn,
  };
}

/**
 * Fetch recent games for a Lichess user.
 */
export async function importFromLichess(username: string, max = 12): Promise<ImportedGame[]> {
  const clean = username.trim().replace(/^@/, '');
  if (!clean) throw new Error('Please enter a Lichess username.');

  const url = `https://lichess.org/api/games/user/${encodeURIComponent(clean)}?max=${max}&pgnInJson=false&clocks=false&evals=false&opening=true`;
  const res = await fetch(url, {
    headers: { Accept: 'application/x-chess-pgn' },
  });

  if (res.status === 404) throw new Error(`Lichess user "${clean}" not found.`);
  if (!res.ok) throw new Error(`Lichess request failed (${res.status}).`);

  const blob = await res.text();
  if (!blob.trim()) throw new Error(`No public games found for "${clean}".`);

  return splitPgnGames(blob).map((pgn, i) => toImportedGame(pgn, i, 'Lichess'));
}

/**
 * Fetch recent games for a Chess.com user (latest available month).
 */
export async function importFromChessCom(username: string, max = 12): Promise<ImportedGame[]> {
  const clean = username.trim().replace(/^@/, '').toLowerCase();
  if (!clean) throw new Error('Please enter a Chess.com username.');

  // Get the list of monthly archives, then pull the most recent month.
  const archivesRes = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(clean)}/games/archives`);
  if (archivesRes.status === 404) throw new Error(`Chess.com user "${clean}" not found.`);
  if (!archivesRes.ok) throw new Error(`Chess.com request failed (${archivesRes.status}).`);

  const { archives } = (await archivesRes.json()) as { archives: string[] };
  if (!archives || archives.length === 0) throw new Error(`No games found for "${clean}".`);

  const latest = archives[archives.length - 1];
  const monthRes = await fetch(latest);
  if (!monthRes.ok) throw new Error(`Could not load recent games (${monthRes.status}).`);

  const { games } = (await monthRes.json()) as { games: Array<{ pgn?: string; white: { username: string }; black: { username: string } }> };
  if (!games || games.length === 0) throw new Error(`No recent games found for "${clean}".`);

  return games
    .filter((g) => g.pgn)
    .slice(-max)
    .reverse()
    .map((g, i) => toImportedGame(g.pgn as string, i, 'Chess.com'));
}

export type ImportSource = 'lichess' | 'chesscom';

export async function importGames(source: ImportSource, username: string, max = 12): Promise<ImportedGame[]> {
  return source === 'lichess' ? importFromLichess(username, max) : importFromChessCom(username, max);
}
