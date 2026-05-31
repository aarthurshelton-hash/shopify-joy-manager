/**
 * Options Data Edge Function
 * 
 * Aggregates options data from multiple brokers:
 * - Tradier (options chains, quotes)
 * - Polygon.io (options trades, flow)
 * - IBKR (comprehensive data)
 * - Finnhub (sentiment, news)
 * 
 * En Pensent™ Patent-Pending Technology
 * @version 7.50-OPTIONS
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// TRADIER API - Primary Options Data Source
// ============================================

async function fetchTradierChain(underlying: string, expiration?: string) {
  const token = Deno.env.get('TRADIER_ACCESS_TOKEN');
  if (!token) {
    console.log('[Tradier] Missing access token');
    return null;
  }

  try {
    // Get expirations first
    const expUrl = `https://api.tradier.com/v1/markets/options/expirations?symbol=${underlying}`;
    const expRes = await fetch(expUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!expRes.ok) {
      console.log(`[Tradier] Expirations error: ${expRes.status}`);
      return null;
    }

    const expData = await expRes.json();
    const expirations = expData.expirations?.date || [];

    if (expirations.length === 0) {
      console.log('[Tradier] No expirations found');
      return null;
    }

    // Get chain for first expiration (or specified)
    const targetExp = expiration || expirations[0];
    const chainUrl = `https://api.tradier.com/v1/markets/options/chains?symbol=${underlying}&expiration=${targetExp}&greeks=true`;
    
    const chainRes = await fetch(chainUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!chainRes.ok) {
      console.log(`[Tradier] Chain error: ${chainRes.status}`);
      return null;
    }

    const chainData = await chainRes.json();
    const options = chainData.options?.option || [];

    // Get underlying quote
    const quoteUrl = `https://api.tradier.com/v1/markets/quotes?symbols=${underlying}`;
    const quoteRes = await fetch(quoteUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    let underlyingPrice = 0;
    if (quoteRes.ok) {
      const quoteData = await quoteRes.json();
      underlyingPrice = quoteData.quotes?.quote?.last || 0;
    }

    // Parse options into calls/puts
    const calls = [];
    const puts = [];

    for (const opt of options) {
      const contract = {
        symbol: opt.symbol,
        underlying: opt.underlying,
        type: opt.option_type,
        strike: opt.strike,
        expiration: opt.expiration_date,
        bid: opt.bid || 0,
        ask: opt.ask || 0,
        last: opt.last || 0,
        volume: opt.volume || 0,
        openInterest: opt.open_interest || 0,
        impliedVolatility: opt.greeks?.mid_iv || 0,
        delta: opt.greeks?.delta || 0,
        gamma: opt.greeks?.gamma || 0,
        theta: opt.greeks?.theta || 0,
        vega: opt.greeks?.vega || 0,
        timestamp: Date.now(),
      };

      if (opt.option_type === 'call') {
        calls.push(contract);
      } else {
        puts.push(contract);
      }
    }

    return {
      underlying,
      underlyingPrice,
      expirations,
      calls,
      puts,
      timestamp: Date.now(),
      source: 'tradier',
    };
  } catch (err) {
    console.error('[Tradier] Error:', err);
    return null;
  }
}

// ============================================
// POLYGON.IO - Options Flow & Trades
// ============================================

async function fetchPolygonFlow(underlying: string) {
  const apiKey = Deno.env.get('POLYGON_API_KEY');
  if (!apiKey) {
    console.log('[Polygon] Missing API key');
    return [];
  }

  try {
    // Get recent options trades for unusual activity
    const url = `https://api.polygon.io/v3/trades/O:${underlying}*?limit=100&apiKey=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.log(`[Polygon] Flow error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const trades = data.results || [];

    return trades.map((t: any) => ({
      symbol: t.T,
      underlying,
      premium: t.p * t.s * 100,
      size: t.s,
      timestamp: t.t,
      source: 'polygon',
    }));
  } catch (err) {
    console.error('[Polygon] Error:', err);
    return [];
  }
}

// ============================================
// FINNHUB - Sentiment & News
// ============================================

async function fetchFinnhubSentiment(symbol: string) {
  const apiKey = Deno.env.get('FINNHUB_API_KEY');
  if (!apiKey) {
    console.log('[Finnhub] Missing API key');
    return null;
  }

  try {
    const url = `https://finnhub.io/api/v1/news-sentiment?symbol=${symbol}&token=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.log(`[Finnhub] Sentiment error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return {
      bullish: data.sentiment?.bullishPercent || 50,
      bearish: data.sentiment?.bearishPercent || 50,
      buzz: data.buzz?.buzz || 0,
      source: 'finnhub',
    };
  } catch (err) {
    console.error('[Finnhub] Error:', err);
    return null;
  }
}

// ============================================
// TECHNICAL ANALYSIS
// ============================================

async function fetchTechnicals(symbol: string) {
  const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
  if (!apiKey) {
    console.log('[TwelveData] Missing API key');
    return null;
  }

  try {
    // Fetch multiple indicators
    const indicators = ['rsi', 'macd', 'sma'];
    const results: any = {};

    for (const ind of indicators) {
      const url = `https://api.twelvedata.com/${ind}?symbol=${symbol}&interval=5min&apikey=${apiKey}`;
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        if (data.values && data.values[0]) {
          results[ind] = data.values[0];
        }
      }
    }

    return results;
  } catch (err) {
    console.error('[TwelveData] Error:', err);
    return null;
  }
}

// ============================================
// MARKET CONTEXT
// ============================================

async function fetchMarketContext() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  // Determine session
  let session = 'closed';
  if (day >= 1 && day <= 5) {
    const time = hour * 60 + now.getMinutes();
    if (time >= 570 && time < 960) session = 'regular'; // 9:30 - 16:00
    else if (time >= 540 && time < 570) session = 'premarket';
    else if (time >= 960 && time < 1080) session = 'afterhours';
  }

  // Try to get VIX data
  let vixLevel = 18;
  try {
    const apiKey = Deno.env.get('FINNHUB_API_KEY');
    if (apiKey) {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=VIX&token=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        vixLevel = data.c || 18;
      }
    }
  } catch {
    // Use default
  }

  return {
    session,
    spyTrend: 'neutral',
    vixLevel,
    vixChange: 0,
    marketBreadth: 0,
    sectorRotation: {},
    economicEvents: [],
    timestamp: Date.now(),
  };
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, underlying, symbol, expiration } = await req.json();

    console.log(`[options-data] Action: ${action} | Symbol: ${underlying || symbol}`);

    const result: any = { success: true };

    switch (action) {
      case 'chain':
        result.chain = await fetchTradierChain(underlying, expiration);
        if (!result.chain) {
          // No real chain available — do NOT fabricate. Return null.
          result.chain = null;
          result.success = false;
          result.reason = 'No real options chain available (set TRADIER_ACCESS_TOKEN)';
        }
        break;

      case 'quote':
        // TODO: Implement single option quote
        result.tick = null;
        break;

      case 'analysis': {
        const sym = symbol || underlying;
        const [sentiment, technicals, quote] = await Promise.all([
          fetchFinnhubSentiment(sym),
          fetchTechnicals(sym),
          fetchRealQuote(sym),
        ]);
        result.analysis = buildAnalysis(sym, sentiment, technicals, quote);
        if (!result.analysis) {
          result.success = false;
          result.reason = 'No real market data available for analysis';
        }
        break;
      }

      case 'flow':
        result.flow = await fetchPolygonFlow(underlying);
        break;

      case 'context':
        result.context = await fetchMarketContext();
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[options-data] Error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// REAL QUOTE (Yahoo Finance) + ANALYSIS BUILDER
// No synthetic data: unavailable fields are returned as null.
// ============================================

async function fetchRealQuote(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!res.ok) {
      console.log(`[options-data] Yahoo ${res.status} for ${symbol}`);
      return null;
    }
    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    if (price == null) return null;
    const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
    return {
      price,
      change: price - prevClose,
      changePercent: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
      volume: meta.regularMarketVolume ?? null,
      dayHigh: meta.regularMarketDayHigh ?? null,
      dayLow: meta.regularMarketDayLow ?? null,
    };
  } catch (err) {
    console.error('[options-data] fetchRealQuote error:', err);
    return null;
  }
}

function buildAnalysis(symbol: string, sentiment: any, technicals: any, quote: any) {
  if (!quote) return null;
  const price = quote.price;
  const num = (v: any) => (v != null && !isNaN(parseFloat(v)) ? parseFloat(v) : null);
  const rsi = num(technicals?.rsi?.rsi);
  const sma20 = num(technicals?.sma?.sma);
  const trend = quote.change > 0 ? 'bullish' : quote.change < 0 ? 'bearish' : 'neutral';

  return {
    symbol,
    price,
    change: quote.change,
    changePercent: quote.changePercent,
    volume: quote.volume,
    avgVolume: null,
    volumeRatio: null,
    rsi,
    macd: {
      value: num(technicals?.macd?.macd),
      signal: num(technicals?.macd?.macd_signal),
      histogram: num(technicals?.macd?.macd_hist),
    },
    sma20,
    sma50: null,
    ema9: null,
    vwap: null,
    supports: quote.dayLow != null ? [quote.dayLow] : [],
    resistances: quote.dayHigh != null ? [quote.dayHigh] : [],
    trend,
    trendStrength: null,
    historicalVolatility: null,
    ivRank: null,
    ivPercentile: null,
    sentiment,
    timestamp: Date.now(),
  };
}
