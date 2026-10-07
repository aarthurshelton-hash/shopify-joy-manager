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
 * Fetch recent games for a Chess.com user (walks back up to 3 monthly archives).
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

  const collected: string[] = [];
  for (const url of archives.slice(-3).reverse()) {
    if (collected.length >= max) break;
    const monthRes = await fetch(url);
    if (!monthRes.ok) continue;
    const { games } = (await monthRes.json()) as ChessComMonth;
    for (const g of [...(games || [])].reverse()) {
      if (g.pgn) collected.push(g.pgn);
      if (collected.length >= max) break;
    }
  }
  if (collected.length === 0) throw new Error(`No recent games found for "${clean}".`);

  return collected.map((pgn, i) => toImportedGame(pgn, i, 'Chess.com'));
}

interface ChessComMonth {
  games: Array<{ url?: string; pgn?: string }>;
}

/**
 * Fetch one Lichess game from a game link or bare game id (8 or 12 chars).
 */
export async function importFromLichessGameUrl(input: string): Promise<ImportedGame[]> {
  const raw = input.trim();
  if (!raw) throw new Error('Paste a Lichess game link.');
  let segment = raw;
  try {
    segment = new URL(raw).pathname.split('/').filter(Boolean)[0] ?? '';
  } catch {
    segment = raw.split('/').filter(Boolean)[0] ?? '';
  }
  const id = segment.slice(0, 8);
  if (!/^[A-Za-z0-9]{8}$/.test(id)) throw new Error('That does not look like a Lichess game link.');

  const res = await fetch(`https://lichess.org/game/export/${id}?clocks=false&evals=false&opening=true`, {
    headers: { Accept: 'application/x-chess-pgn' },
  });
  if (res.status === 404) throw new Error('Lichess game not found.');
  if (!res.ok) throw new Error(`Lichess request failed (${res.status}).`);
  const pgn = (await res.text()).trim();
  if (!pgn) throw new Error('Lichess returned an empty game.');
  return [toImportedGame(pgn, 0, 'Lichess')];
}

/**
 * Fetch a player's games from a Lichess tournament (arena or swiss) link or id.
 */
export async function importFromLichessTournament(input: string, username: string, max = 12): Promise<ImportedGame[]> {
  const raw = input.trim();
  const player = username.trim().replace(/^@/, '');
  if (!raw) throw new Error('Paste a Lichess tournament link.');
  if (!player) throw new Error('Enter your Lichess username.');

  let id = raw;
  const match = raw.match(/lichess\.org\/(?:tournament|swiss)\/([A-Za-z0-9]+)/);
  if (match) id = match[1];
  if (!/^[A-Za-z0-9]{8}$/.test(id)) throw new Error('That does not look like a Lichess tournament link.');
  const kind = /\/swiss\//.test(raw) ? 'swiss' : 'tournament';

  const url = `https://lichess.org/api/${kind}/${id}/games?player=${encodeURIComponent(player)}&clocks=false&evals=false&opening=true`;
  const res = await fetch(url, { headers: { Accept: 'application/x-chess-pgn' } });
  if (res.status === 404) throw new Error('Lichess tournament not found.');
  if (!res.ok) throw new Error(`Lichess request failed (${res.status}).`);
  const blob = await res.text();
  if (!blob.trim()) throw new Error(`No games by "${player}" in that tournament.`);
  return splitPgnGames(blob).slice(0, max).map((pgn, i) => toImportedGame(pgn, i, 'Lichess'));
}

/**
 * Fetch one Chess.com game from a game link. Chess.com has no public lookup by id,
 * so we search the player's last 12 monthly archives for the matching game.
 */
export async function importFromChessComGameUrl(input: string, username: string): Promise<ImportedGame[]> {
  const clean = username.trim().replace(/^@/, '').toLowerCase();
  if (!clean) throw new Error('Enter a Chess.com username (a player in the game).');
  const idMatch = input.match(/\/game\/(?:live|daily)\/(\d+)/) || input.match(/\/(\d{6,})(?:\/|\?|$)/);
  if (!idMatch) throw new Error('That does not look like a Chess.com game link.');
  const id = idMatch[1];

  const archivesRes = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(clean)}/games/archives`);
  if (archivesRes.status === 404) throw new Error(`Chess.com user "${clean}" not found.`);
  if (!archivesRes.ok) throw new Error(`Chess.com request failed (${archivesRes.status}).`);
  const { archives } = (await archivesRes.json()) as { archives: string[] };

  for (const url of (archives || []).slice(-12).reverse()) {
    const monthRes = await fetch(url);
    if (!monthRes.ok) continue;
    const { games } = (await monthRes.json()) as ChessComMonth;
    const hit = (games || []).find((g) => g.pgn && g.url && g.url.endsWith(`/${id}`));
    if (hit?.pgn) return [toImportedGame(hit.pgn, 0, 'Chess.com')];
  }
  throw new Error(`Game not found in ${clean}'s last 12 months of games.`);
}

export type ImportSource = 'lichess' | 'chesscom';
export type ImportMode = 'username' | 'link' | 'tournament';

export async function importGames(source: ImportSource, username: string, max = 12): Promise<ImportedGame[]> {
  return source === 'lichess' ? importFromLichess(username, max) : importFromChessCom(username, max);
}
