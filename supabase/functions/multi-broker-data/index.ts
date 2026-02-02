import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketTick {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  volume?: number;
  timestamp: number;
  source: string;
}

interface AggregatedData {
  symbol: string;
  ticks: MarketTick[];
  consensus: {
    price: number;
    spread: number;
    confidence: number;
  };
  sentiment?: {
    score: number;
    buzz: number;
    source: string;
  };
  technicals?: {
    rsi?: number;
    macd?: number;
    sma20?: number;
    ema50?: number;
  };
  sources: string[];
  timestamp: number;
}

// Interactive Brokers (IBKR) Client Portal API
// Note: IBKR requires TWS/Gateway running locally OR Client Portal OAuth
async function fetchIBKR(symbol: string, assetType: 'stock' | 'crypto' | 'forex' | 'futures'): Promise<MarketTick | null> {
  const clientId = Deno.env.get('IBKR_CLIENT_ID');
  const clientSecret = Deno.env.get('IBKR_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    console.log('[IBKR] Missing credentials');
    return null;
  }

  try {
    // IBKR Client Portal Gateway endpoint (local or cloud gateway)
    // For production, this would use IBKR's OAuth flow
    const baseUrl = 'https://localhost:5000/v1/api'; // Local gateway
    
    // Convert symbol to IBKR format
    const ibkrSymbol = symbol.toUpperCase().replace('/', '');
    let secType = 'STK';
    let exchange = 'SMART';
    
    switch (assetType) {
      case 'crypto':
        secType = 'CRYPTO';
        exchange = 'PAXOS';
        break;
      case 'forex':
        secType = 'CASH';
        exchange = 'IDEALPRO';
        break;
      case 'futures':
        secType = 'FUT';
        exchange = 'CME';
        break;
    }

    // IBKR market data snapshot request
    const response = await fetch(`${baseUrl}/iserver/marketdata/snapshot?conids=${ibkrSymbol}&fields=31,84,86`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // OAuth token would go here in production
      },
    });

    if (!response.ok) {
      console.log(`[IBKR] Error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data && data[0]) {
      const quote = data[0];
      return {
        symbol,
        price: parseFloat(quote['31'] || quote.lastPrice || 0),
        bid: parseFloat(quote['84'] || 0),
        ask: parseFloat(quote['86'] || 0),
        timestamp: Date.now(),
        source: 'ibkr',
      };
    }
  } catch (err) {
    // IBKR requires local gateway - fallback silently in edge function context
    console.log('[IBKR] Gateway not available (expected in cloud context)');
  }
  return null;
}

// Alpaca API
async function fetchAlpaca(symbol: string, assetType: 'stock' | 'crypto'): Promise<MarketTick | null> {
  const apiKey = Deno.env.get('ALPACA_API_KEY');
  const apiSecret = Deno.env.get('ALPACA_API_SECRET');
  
  if (!apiKey || !apiSecret) {
    console.log('[Alpaca] Missing credentials');
    return null;
  }

  try {
    const baseUrl = assetType === 'crypto' 
      ? 'https://data.alpaca.markets/v1beta3/crypto/us'
      : 'https://data.alpaca.markets/v2/stocks';
    
    const endpoint = assetType === 'crypto'
      ? `${baseUrl}/latest/trades?symbols=${symbol}`
      : `${baseUrl}/${symbol}/quotes/latest`;

    const response = await fetch(endpoint, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
      },
    });

    if (!response.ok) {
      console.log(`[Alpaca] Error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (assetType === 'crypto') {
      const trade = data.trades?.[symbol];
      if (trade) {
        return {
          symbol,
          price: trade.p,
          volume: trade.s,
          timestamp: new Date(trade.t).getTime(),
          source: 'alpaca',
        };
      }
    } else {
      const quote = data.quote;
      if (quote) {
        return {
          symbol,
          price: (quote.bp + quote.ap) / 2,
          bid: quote.bp,
          ask: quote.ap,
          timestamp: new Date(quote.t).getTime(),
          source: 'alpaca',
        };
      }
    }
  } catch (err) {
    console.error('[Alpaca] Error:', err);
  }
  return null;
}

// Polygon API
async function fetchPolygon(symbol: string): Promise<MarketTick | null> {
  const apiKey = Deno.env.get('POLYGON_API_KEY');
  if (!apiKey) {
    console.log('[Polygon] Missing API key');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.polygon.io/v2/last/trade/${symbol}?apiKey=${apiKey}`
    );

    if (!response.ok) {
      console.log(`[Polygon] Error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data.results) {
      return {
        symbol,
        price: data.results.p,
        volume: data.results.s,
        timestamp: data.results.t,
        source: 'polygon',
      };
    }
  } catch (err) {
    console.error('[Polygon] Error:', err);
  }
  return null;
}

// Binance API (Crypto) - No API key needed for public endpoints!
async function fetchBinance(symbol: string): Promise<MarketTick | null> {
  try {
    // Convert symbol to Binance format:
    // BTC/USD -> BTCUSDT, ETH/USD -> ETHUSDT, SOL/USD -> SOLUSDT
    let binanceSymbol = symbol.toUpperCase();
    
    // Remove separators
    binanceSymbol = binanceSymbol.replace(/[\/\-]/g, '');
    
    // Convert USD to USDT (Binance uses USDT pairs)
    if (binanceSymbol.endsWith('USD') && !binanceSymbol.endsWith('USDT')) {
      binanceSymbol = binanceSymbol.replace('USD', 'USDT');
    }
    
    console.log(`[Binance] Converting ${symbol} -> ${binanceSymbol}`);
    
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/bookTicker?symbol=${binanceSymbol}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[Binance] Error ${response.status}: ${errorText.substring(0, 100)}`);
      return null;
    }

    const data = await response.json();
    const price = (parseFloat(data.bidPrice) + parseFloat(data.askPrice)) / 2;
    console.log(`[Binance] ✓ ${symbol} = $${price.toFixed(2)}`);
    
    return {
      symbol,
      price,
      bid: parseFloat(data.bidPrice),
      ask: parseFloat(data.askPrice),
      timestamp: Date.now(),
      source: 'binance',
    };
  } catch (err) {
    console.error('[Binance] Exception:', err);
  }
  return null;
}

// Finnhub API (Sentiment + Quotes)
async function fetchFinnhub(symbol: string): Promise<{ tick: MarketTick | null; sentiment: any }> {
  const apiKey = Deno.env.get('FINNHUB_API_KEY');
  if (!apiKey) {
    console.log('[Finnhub] Missing API key');
    return { tick: null, sentiment: null };
  }

  try {
    // Get quote
    const quoteResponse = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
    );
    
    let tick: MarketTick | null = null;
    if (quoteResponse.ok) {
      const quoteData = await quoteResponse.json();
      if (quoteData.c) {
        tick = {
          symbol,
          price: quoteData.c,
          timestamp: quoteData.t * 1000,
          source: 'finnhub',
        };
      }
    }

    // Get sentiment
    const sentimentResponse = await fetch(
      `https://finnhub.io/api/v1/news-sentiment?symbol=${symbol}&token=${apiKey}`
    );
    
    let sentiment = null;
    if (sentimentResponse.ok) {
      const sentimentData = await sentimentResponse.json();
      if (sentimentData.sentiment) {
        sentiment = {
          score: sentimentData.sentiment.bullishPercent - sentimentData.sentiment.bearishPercent,
          buzz: sentimentData.buzz?.buzz || 0,
          source: 'finnhub',
        };
      }
    }

    return { tick, sentiment };
  } catch (err) {
    console.error('[Finnhub] Error:', err);
  }
  return { tick: null, sentiment: null };
}

// Twelve Data API (Technical Indicators)
async function fetchTwelveData(symbol: string): Promise<{ tick: MarketTick | null; technicals: any }> {
  const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
  if (!apiKey) {
    console.log('[TwelveData] Missing API key');
    return { tick: null, technicals: null };
  }

  try {
    // Get real-time price
    const priceResponse = await fetch(
      `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`
    );
    
    let tick: MarketTick | null = null;
    if (priceResponse.ok) {
      const priceData = await priceResponse.json();
      if (priceData.price) {
        tick = {
          symbol,
          price: parseFloat(priceData.price),
          timestamp: Date.now(),
          source: 'twelvedata',
        };
      }
    }

    // Get RSI
    const rsiResponse = await fetch(
      `https://api.twelvedata.com/rsi?symbol=${symbol}&interval=1min&time_period=14&apikey=${apiKey}`
    );
    
    let technicals: any = null;
    if (rsiResponse.ok) {
      const rsiData = await rsiResponse.json();
      if (rsiData.values && rsiData.values[0]) {
        technicals = {
          rsi: parseFloat(rsiData.values[0].rsi),
        };
      }
    }

    return { tick, technicals };
  } catch (err) {
    console.error('[TwelveData] Error:', err);
  }
  return { tick: null, technicals: null };
}

// Tradier API (Options data)
async function fetchTradier(symbol: string): Promise<MarketTick | null> {
  const accessToken = Deno.env.get('TRADIER_ACCESS_TOKEN');
  if (!accessToken) {
    console.log('[Tradier] Missing access token');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.tradier.com/v1/markets/quotes?symbols=${symbol}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.log(`[Tradier] Error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const quote = data.quotes?.quote;
    if (quote) {
      return {
        symbol,
        price: quote.last,
        bid: quote.bid,
        ask: quote.ask,
        volume: quote.volume,
        timestamp: Date.now(),
        source: 'tradier',
      };
    }
  } catch (err) {
    console.error('[Tradier] Error:', err);
  }
  return null;
}

// Aggregate data from all sources including IBKR
async function aggregateMarketData(symbol: string, assetType: 'stock' | 'crypto' | 'forex' | 'futures'): Promise<AggregatedData> {
  console.log(`[Aggregator] Fetching ${symbol} (${assetType}) from all sources (including IBKR)...`);
  
  const ticks: MarketTick[] = [];
  const sources: string[] = [];
  let sentiment = null;
  let technicals = null;

  // Fetch from all sources in parallel
  const fetchPromises: Promise<void>[] = [];

  // IBKR (supports all asset types - Canadian friendly!)
  fetchPromises.push(
    fetchIBKR(symbol, assetType).then(tick => {
      if (tick) { ticks.push(tick); sources.push('ibkr'); }
    })
  );

  // Alpaca (stocks and crypto)
  if (assetType === 'stock' || assetType === 'crypto') {
    fetchPromises.push(
      fetchAlpaca(symbol, assetType === 'crypto' ? 'crypto' : 'stock').then(tick => {
        if (tick) { ticks.push(tick); sources.push('alpaca'); }
      })
    );
  }

  // Polygon (stocks only)
  if (assetType === 'stock') {
    fetchPromises.push(
      fetchPolygon(symbol).then(tick => {
        if (tick) { ticks.push(tick); sources.push('polygon'); }
      })
    );
  }

  // Binance (crypto only)
  if (assetType === 'crypto') {
    fetchPromises.push(
      fetchBinance(symbol).then(tick => {
        if (tick) { ticks.push(tick); sources.push('binance'); }
      })
    );
  }

  // Finnhub (stocks - sentiment)
  if (assetType === 'stock') {
    fetchPromises.push(
      fetchFinnhub(symbol).then(result => {
        if (result.tick) { ticks.push(result.tick); sources.push('finnhub'); }
        if (result.sentiment) { sentiment = result.sentiment; }
      })
    );
  }

  // Twelve Data (stocks + forex)
  if (assetType === 'stock' || assetType === 'forex') {
    fetchPromises.push(
      fetchTwelveData(symbol).then(result => {
        if (result.tick) { ticks.push(result.tick); sources.push('twelvedata'); }
        if (result.technicals) { technicals = result.technicals; }
      })
    );
  }

  // Tradier (stocks/options)
  if (assetType === 'stock') {
    fetchPromises.push(
      fetchTradier(symbol).then(tick => {
        if (tick) { ticks.push(tick); sources.push('tradier'); }
      })
    );
  }

  await Promise.all(fetchPromises);

  // Calculate consensus
  const prices = ticks.map(t => t.price);
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const priceVariance = prices.length > 1 
    ? Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length) / avgPrice
    : 0;
  const confidence = prices.length > 0 ? Math.min(1, (1 - priceVariance) * (sources.length / 6)) : 0; // Updated for 6 sources

  return {
    symbol,
    ticks,
    consensus: {
      price: avgPrice,
      spread: priceVariance * avgPrice * 2, // Approximate spread
      confidence,
    },
    sentiment: sentiment || undefined,
    technicals: technicals || undefined,
    sources,
    timestamp: Date.now(),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, assetType = 'stock', action = 'aggregate' } = await req.json();

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[MultiBrokerData] Request: ${action} for ${symbol} (${assetType})`);

    if (action === 'aggregate') {
      const data = await aggregateMarketData(symbol, assetType);
      
      return new Response(
        JSON.stringify({
          success: true,
          data,
          meta: {
            sourcesAvailable: data.sources.length,
            sourcesUsed: data.sources,
            consensusConfidence: data.consensus.confidence,
            ibkrEnabled: data.sources.includes('ibkr'),
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[MultiBrokerData] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
