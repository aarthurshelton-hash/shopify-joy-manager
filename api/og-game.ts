/**
 * Per-vision OG page for social crawlers.
 *
 * vercel.json rewrites /g/:hash → /api/og-game?hash=… for crawler
 * user-agents only (humans get the SPA). We resolve the hash by
 * recomputing generateGameHash over saved_visualizations — same
 * algorithm as the client — and serve the vision's stored image as
 * og:image. A meta refresh bounces any real browser to the app.
 *
 * Env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (service role needed
 * if saved_visualizations RLS restricts reads to owners).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const BASE = 'https://enpensent.com';
const FALLBACK_IMG = `${BASE}/og-home.png`;
const FALLBACK_TITLE = 'Every Game Is A Work Of Art — En Pensent';
const FALLBACK_DESC =
  'Watch this chess game paint itself into a living visualization. Powered by the engine that reads the middlegame more accurately than Stockfish.';

// --- Same hashing as src/lib/visualizations/gameCanonical.ts ---
function extractMovesFromPgn(pgn: string): string {
  let cleaned = pgn.replace(/\[[^\]]*\]/g, '');
  cleaned = cleaned.replace(/\{[^}]*\}/g, '');
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  cleaned = cleaned.replace(/\d+\.\s*/g, '');
  cleaned = cleaned.replace(/1-0|0-1|1\/2-1\/2|\*/g, '');
  return cleaned.replace(/\s+/g, ' ').trim();
}

function compactHash(str: string): string {
  let hash = 0;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
    hash2 = ((hash2 << 7) + hash2 + char) | 0;
  }
  return (Math.abs(hash) ^ Math.abs(hash2)).toString(36);
}

function generateGameHash(pgn: string | null | undefined): string {
  if (!pgn) return 'empty';
  const moves = extractMovesFromPgn(pgn);
  return moves ? compactHash(moves) : 'empty';
}
// ---------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface VizRow {
  pgn?: string | null;
  game_data?: { pgn?: string; paletteId?: string } | null;
  image_path?: string | null;
  title?: string | null;
}

async function findVisionImage(hash: string, palette: string): Promise<{ image: string; title: string }> {
  const supaUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supaUrl || !key) return { image: FALLBACK_IMG, title: FALLBACK_TITLE };

  const resp = await fetch(
    `${supaUrl}/rest/v1/saved_visualizations?select=pgn,game_data,image_path,title&limit=5000`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!resp.ok) return { image: FALLBACK_IMG, title: FALLBACK_TITLE };

  const rows = (await resp.json()) as VizRow[];
  let first: VizRow | null = null;
  for (const row of rows) {
    const pgn = row.pgn || row.game_data?.pgn || '';
    if (generateGameHash(pgn) !== hash || !row.image_path) continue;
    if (palette && row.game_data?.paletteId === palette) {
      return { image: row.image_path, title: row.title || FALLBACK_TITLE };
    }
    if (!first) first = row;
  }
  return { image: first?.image_path || FALLBACK_IMG, title: first?.title || FALLBACK_TITLE };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const hash = String(req.query.hash || '');
  const palette = String(req.query.p || '');
  const pageUrl = `${BASE}/g/${hash}${palette ? `?p=${encodeURIComponent(palette)}` : ''}`;

  const { image, title } = await findVisionImage(hash, palette);
  const safeTitle = esc(title);
  const safeUrl = esc(pageUrl);
  const safeImg = esc(image);
  const safeDesc = esc(FALLBACK_DESC);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<meta name="description" content="${safeDesc}" />
<link rel="canonical" href="${safeUrl}" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDesc}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${safeUrl}" />
<meta property="og:image" content="${safeImg}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="En Pensent" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@EnPensent" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
<meta name="twitter:image" content="${safeImg}" />
<meta http-equiv="refresh" content="0; url=${safeUrl}" />
</head>
<body><a href="${safeUrl}">View this vision on En Pensent</a></body>
</html>`);
}
