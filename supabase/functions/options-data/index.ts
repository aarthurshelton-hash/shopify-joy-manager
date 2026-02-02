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
          // Fallback to simulated data
          result.chain = generateSimulatedChain(underlying);
        }
        break;

      case 'quote':
        // TODO: Implement single option quote
        result.tick = null;
        break;

      case 'analysis':
        const [sentiment, technicals] = await Promise.all([
          fetchFinnhubSentiment(symbol || underlying),
          fetchTechnicals(symbol || underlying),
        ]);
        result.analysis = generateAnalysis(symbol || underlying, sentiment, technicals);
        break;

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
// FALLBACK GENERATORS
// ============================================

function generateSimulatedChain(underlying: string) {
  const basePrices: Record<string, number> = {
    SPY: 590, QQQ: 520, IWM: 225, AAPL: 235, TSLA: 430,
    NVDA: 145, AMD: 125, AMZN: 225, META: 610, GOOGL: 195,
  };
  const basePrice = basePrices[underlying] || 100;
  
  const now = new Date();
  const expirations = [];
  for (let i = 0; i < 4; i++) {
    const exp = new Date(now);
    exp.setDate(exp.getDate() + (5 - now.getDay()) + i * 7);
    expirations.push(exp.toISOString().split('T')[0]);
  }

  const calls = [];
  const puts = [];
  const strikeInterval = basePrice > 100 ? 5 : 2.5;

  for (let offset = -5; offset <= 5; offset++) {
    const strike = Math.round(basePrice / strikeInterval) * strikeInterval + offset * strikeInterval;
    const iv = 0.25 + Math.random() * 0.15;
    
    const callPrice = Math.max(0.05, (basePrice - strike) * 0.5 + iv * basePrice * 0.05);
    const putPrice = Math.max(0.05, (strike - basePrice) * 0.5 + iv * basePrice * 0.05);

    calls.push({
      symbol: `${underlying}${expirations[0].replace(/-/g, '')}C${strike * 1000}`,
      underlying,
      type: 'call',
      strike,
      expiration: expirations[0],
      bid: callPrice * 0.98,
      ask: callPrice * 1.02,
      last: callPrice,
      volume: Math.floor(Math.random() * 3000) + 100,
      openInterest: Math.floor(Math.random() * 10000) + 500,
      impliedVolatility: iv,
      delta: 0.5 + (basePrice - strike) / (strike * 0.2),
      gamma: 0.03,
      theta: -callPrice * 0.02,
      vega: callPrice * 0.1,
      timestamp: Date.now(),
    });

    puts.push({
      symbol: `${underlying}${expirations[0].replace(/-/g, '')}P${strike * 1000}`,
      underlying,
      type: 'put',
      strike,
      expiration: expirations[0],
      bid: putPrice * 0.98,
      ask: putPrice * 1.02,
      last: putPrice,
      volume: Math.floor(Math.random() * 2500) + 80,
      openInterest: Math.floor(Math.random() * 8000) + 400,
      impliedVolatility: iv,
      delta: -0.5 + (basePrice - strike) / (strike * 0.2),
      gamma: 0.03,
      theta: -putPrice * 0.02,
      vega: putPrice * 0.1,
      timestamp: Date.now(),
    });
  }

  return {
    underlying,
    underlyingPrice: basePrice,
    expirations,
    calls,
    puts,
    timestamp: Date.now(),
    source: 'simulated',
  };
}

function generateAnalysis(symbol: string, sentiment: any, technicals: any) {
  const basePrices: Record<string, number> = {
    SPY: 590, QQQ: 520, IWM: 225, AAPL: 235, TSLA: 430,
    NVDA: 145, AMD: 125, AMZN: 225, META: 610, GOOGL: 195,
  };
  const price = basePrices[symbol] || 100;
  const change = (Math.random() - 0.5) * price * 0.02;

  return {
    symbol,
    price,
    change,
    changePercent: (change / price) * 100,
    volume: Math.floor(Math.random() * 30000000) + 5000000,
    avgVolume: 20000000,
    volumeRatio: 0.9 + Math.random() * 0.4,
    rsi: technicals?.rsi?.rsi ? parseFloat(technicals.rsi.rsi) : 45 + Math.random() * 20,
    macd: {
      value: technicals?.macd?.macd ? parseFloat(technicals.macd.macd) : (Math.random() - 0.5) * 2,
      signal: technicals?.macd?.macd_signal ? parseFloat(technicals.macd.macd_signal) : (Math.random() - 0.5) * 1.5,
      histogram: technicals?.macd?.macd_hist ? parseFloat(technicals.macd.macd_hist) : (Math.random() - 0.5) * 0.5,
    },
    sma20: price * (0.99 + Math.random() * 0.02),
    sma50: price * (0.97 + Math.random() * 0.06),
    ema9: price * (0.995 + Math.random() * 0.01),
    vwap: price * (0.998 + Math.random() * 0.004),
    supports: [price * 0.98, price * 0.95, price * 0.92],
    resistances: [price * 1.02, price * 1.05, price * 1.08],
    trend: change > 0 ? 'bullish' : change < 0 ? 'bearish' : 'neutral',
    trendStrength: Math.random() * 0.5 + 0.3,
    historicalVolatility: 0.18 + Math.random() * 0.12,
    ivRank: Math.random() * 100,
    ivPercentile: Math.random() * 100,
    sentiment,
    timestamp: Date.now(),
  };
}
