/**
 * En Pensent API — Market candles proxy (Vercel serverless)
 * GET /api/market-candles?symbol=SPY&range=3mo&interval=1d
 *
 * Proxies Yahoo Finance chart data server-side to avoid CORS restrictions.
 * Returns: { closes, volumes, highs, lows, timestamps, price, change }
 */

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const symbol = url.searchParams.get('symbol');
  const range = url.searchParams.get('range') || '3mo';
  const interval = url.searchParams.get('interval') || '1d';

  if (!symbol) {
    return new Response(JSON.stringify({ error: 'Missing symbol parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
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
      return new Response(JSON.stringify({ error: `Yahoo Finance returned ${r.status}` }), {
        status: r.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const d = await r.json();
    const result = d?.chart?.result?.[0];
    if (!result) {
      return new Response(JSON.stringify({ error: 'No chart data' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0];
    if (!quotes) {
      return new Response(JSON.stringify({ error: 'No quote data' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
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
      return new Response(JSON.stringify({ error: 'Insufficient data' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const price = closes[closes.length - 1];
    const prev = closes[closes.length - 2] || price;
    const change = ((price - prev) / prev) * 100;

    return new Response(JSON.stringify({
      symbol,
      closes,
      volumes,
      highs,
      lows,
      timestamps,
      price,
      change,
      count: closes.length,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
