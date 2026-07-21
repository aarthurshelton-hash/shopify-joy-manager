import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * #1 — Viral loop: dynamic OG social previews for /g/:hash
 *
 * Serverless function that returns HTML with proper OG meta tags.
 * Bots read the meta tags directly; browsers get an instant client-side
 * redirect to the SPA (via ?from_og=1 which bypasses this function).
 */
const BOT_PATTERN = /facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|telegrambot|whatsapp|discordbot|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|skypeuripreview|ia_archiver|preview|crawler|spider|fetcher/i;

function generateOgHtml(hash: string, host: string): string {
  const origin = `https://${host}`;
  const canonicalUrl = `${origin}/g/${hash}`;
  const ogImage = `${origin}/og-home.png`;
  const title = 'Every Game Is A Work Of Art — En Pensent';
  const description = 'Watch this chess game paint itself into a living visualization. Powered by the engine that reads the middlegame more accurately than Stockfish.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="En Pensent" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${canonicalUrl}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${ogImage}" />

  <link rel="canonical" href="${canonicalUrl}" />
</head>
<body>
  <div id="root"></div>
  <script>window.location.replace("${canonicalUrl}?from_og=1");</script>
  <noscript><meta http-equiv="refresh" content="0;url=${canonicalUrl}?from_og=1"></noscript>
</body>
</html>`;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const hash = (req.query.hash as string) || '';
  const host = req.headers.host || 'enpensent.com';
  const userAgent = req.headers['user-agent'] || '';

  const html = generateOgHtml(hash, host);

  if (BOT_PATTERN.test(userAgent)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(html);
  } else {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).send(html);
  }
}
