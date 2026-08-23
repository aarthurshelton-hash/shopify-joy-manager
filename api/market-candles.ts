/**
 * En Pensent API — Market candles proxy (Vercel serverless)
 * GET /api/market-candles?symbol=SPY&range=3mo&interval=1d
 *
 * Proxies Yahoo Finance chart data server-side to avoid CORS restrictions.
 * Returns: { closes, volumes, highs, lows, timestamps, price, change }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const symbol = req.query.symbol as string;
  const range = (req.query.range as string) || '3mo';
  const interval = (req.query.interval as string) || '1d';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  if (!symbol) {
    res.status(400).json({ error: 'Missing symbol parameter' });
    return;
  }

  try {
    const yahooSymbol = symbol.replace('=', '=F');
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`;

    const r = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!r.ok) {
      res.status(r.status).json({ error: `Yahoo Finance returned ${r.status}` });
      return;
    }

    const d = await r.json();
    const result = d?.chart?.result?.[0];
    if (!result) {
      res.status(404).json({ error: 'No chart data' });
      return;
    }

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0];
    if (!quotes) {
      res.status(404).json({ error: 'No quote data' });
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
      res.status(422).json({ error: 'Insufficient data' });
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
    res.status(500).json({ error: msg });
  }
}
