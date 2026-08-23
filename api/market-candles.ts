/**
 * En Pensent API — Market candles proxy (Vercel serverless)
 * GET /api/market-candles?symbol=SPY&range=3mo&interval=1d
 *
 * Proxies Yahoo Finance chart data server-side to avoid CORS restrictions.
 * Returns: { closes, volumes, highs, lows, timestamps, price, change }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  // Parse query params manually from req.url to preserve = in futures symbols
  const url = new URL(req.url || '', 'https://enpensent.com');
  const symbol = url.searchParams.get('symbol') || '';
  const range = url.searchParams.get('range') || '3mo';
  const interval = url.searchParams.get('interval') || '1d';

  if (!symbol) {
    res.status(400).json({ error: 'Missing symbol parameter' });
    return;
  }

  try {
    // Yahoo Finance uses = in futures symbols (GC=F, CL=F).
    // Build URL carefully — don't double-encode the = sign.
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;

    const r = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!r.ok) {
      res.status(r.status).json({ error: `Yahoo Finance returned ${r.status}`, yahooUrl, symbol });
      return;
    }

    const d = await r.json();
    const result = d?.chart?.result?.[0];
    if (!result) {
      res.status(404).json({ error: 'No chart data', symbol });
      return;
    }

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0];
    if (!quotes) {
      res.status(404).json({ error: 'No quote data', symbol });
      return;
    }

    const closes: number[] = [];
    const volumes: number[] = [];
    const highs: number[] = [];
    const lows: number[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const c = quotes.close?.[i];
      if (c != null && c > 0) {
        closes.push(c);
        volumes.push(quotes.volume?.[i] || 0);
        highs.push(quotes.high?.[i] || c);
        lows.push(quotes.low?.[i] || c);
      }
    }

    if (closes.length < 2) {
      res.status(422).json({ error: 'Insufficient data', symbol, count: closes.length });
      return;
    }

    const price = closes[closes.length - 1];
    const prev = closes[closes.length - 2] || price;
    const change = ((price - prev) / prev) * 100;

    res.status(200).json({
      symbol,
      closes,
      volumes,
      highs,
      lows,
      timestamps,
      price,
      change,
      count: closes.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    res.status(500).json({ error: msg, symbol });
  }
}
