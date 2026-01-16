import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CandleStick {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockResponse {
  symbol: string;
  name: string;
  candles: CandleStick[];
  latestPrice: number;
  change: number;
  changePercent: number;
}

// Popular symbols for demo
const DEMO_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'SPY', 'QQQ', 'BTC-USD'];

const SYMBOL_NAMES: Record<string, string> = {
  'AAPL': 'Apple Inc.',
  'GOOGL': 'Alphabet Inc.',
  'MSFT': 'Microsoft Corporation',
  'AMZN': 'Amazon.com Inc.',
  'TSLA': 'Tesla Inc.',
  'NVDA': 'NVIDIA Corporation',
  'META': 'Meta Platforms Inc.',
  'SPY': 'S&P 500 ETF',
  'QQQ': 'Nasdaq 100 ETF',
  'BTC-USD': 'Bitcoin USD',
};

/**
 * Generate realistic mock stock data with proper market patterns
 */
function generateMockCandles(symbol: string, days: number = 30): CandleStick[] {
  const candles: CandleStick[] = [];
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  
  // Base prices for different symbols
  const basePrices: Record<string, number> = {
    'AAPL': 175,
    'GOOGL': 140,
    'MSFT': 420,
    'AMZN': 185,
    'TSLA': 240,
    'NVDA': 480,
    'META': 510,
    'SPY': 480,
    'QQQ': 420,
    'BTC-USD': 68000,
  };
  
  let price = basePrices[symbol] || 100;
  
  // Create different market regimes for variety
  const regime = Math.random();
  let trend = 0;
  let volatility = 0.02;
  
  if (regime < 0.25) {
    // Uptrend
    trend = 0.003;
    volatility = 0.015;
  } else if (regime < 0.5) {
    // Downtrend
    trend = -0.003;
    volatility = 0.018;
  } else if (regime < 0.75) {
    // High volatility
    trend = 0;
    volatility = 0.035;
  } else {
    // Consolidation
    trend = 0;
    volatility = 0.008;
  }
  
  for (let i = days; i >= 0; i--) {
    const timestamp = now - (i * msPerDay);
    
    // Add some regime changes mid-way
    if (i === Math.floor(days / 2)) {
      trend = (Math.random() - 0.5) * 0.006;
      volatility = 0.01 + Math.random() * 0.025;
    }
    
    // Calculate OHLC
    const dailyReturn = trend + (Math.random() - 0.5) * volatility * 2;
    const open = price;
    const close = price * (1 + dailyReturn);
    
    const range = Math.abs(close - open) + price * volatility * Math.random();
    const high = Math.max(open, close) + range * Math.random() * 0.5;
    const low = Math.min(open, close) - range * Math.random() * 0.5;
    
    // Volume varies with price movement
    const baseVolume = symbol === 'BTC-USD' ? 50000 : 10000000;
    const volumeMultiplier = 1 + Math.abs(dailyReturn) * 20;
    const volume = Math.round(baseVolume * volumeMultiplier * (0.5 + Math.random()));
    
    candles.push({
      timestamp,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
    
    price = close;
  }
  
  return candles;
}

/**
 * Try to fetch real data from Yahoo Finance (fallback to mock if fails)
 */
async function fetchRealData(symbol: string): Promise<StockResponse | null> {
  try {
    // Yahoo Finance unofficial API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=30d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`Yahoo API returned ${response.status} for ${symbol}`);
      return null;
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      return null;
    }
    
    const quote = result.indicators.quote[0];
    const timestamps = result.timestamp;
    
    const candles: CandleStick[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.open[i] && quote.high[i] && quote.low[i] && quote.close[i]) {
        candles.push({
          timestamp: timestamps[i] * 1000,
          open: Math.round(quote.open[i] * 100) / 100,
          high: Math.round(quote.high[i] * 100) / 100,
          low: Math.round(quote.low[i] * 100) / 100,
          close: Math.round(quote.close[i] * 100) / 100,
          volume: quote.volume[i] || 0,
        });
      }
    }
    
    if (candles.length === 0) return null;
    
    const latestPrice = candles[candles.length - 1].close;
    const prevPrice = candles[candles.length - 2]?.close || latestPrice;
    const change = latestPrice - prevPrice;
    const changePercent = (change / prevPrice) * 100;
    
    return {
      symbol,
      name: result.meta?.shortName || SYMBOL_NAMES[symbol] || symbol,
      candles,
      latestPrice,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
    };
  } catch (error) {
    console.error(`Error fetching real data for ${symbol}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, symbol, symbols } = await req.json();
    
    if (action === 'list') {
      // Return list of available symbols
      return new Response(
        JSON.stringify({
          symbols: DEMO_SYMBOLS.map(s => ({
            symbol: s,
            name: SYMBOL_NAMES[s] || s
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'quote' && symbol) {
      // Get single stock data
      let stockData = await fetchRealData(symbol);
      
      // Fall back to mock data if real data fails
      if (!stockData) {
        console.log(`Using mock data for ${symbol}`);
        const candles = generateMockCandles(symbol, 30);
        const latestPrice = candles[candles.length - 1].close;
        const prevPrice = candles[candles.length - 2]?.close || latestPrice;
        const change = latestPrice - prevPrice;
        
        stockData = {
          symbol,
          name: SYMBOL_NAMES[symbol] || symbol,
          candles,
          latestPrice,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round((change / prevPrice) * 100 * 100) / 100,
        };
      }
      
      return new Response(
        JSON.stringify(stockData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'batch' && symbols && Array.isArray(symbols)) {
      // Get multiple stocks data
      const results: StockResponse[] = [];
      
      for (const sym of symbols.slice(0, 10)) {
        let stockData = await fetchRealData(sym);
        
        if (!stockData) {
          const candles = generateMockCandles(sym, 30);
          const latestPrice = candles[candles.length - 1].close;
          const prevPrice = candles[candles.length - 2]?.close || latestPrice;
          const change = latestPrice - prevPrice;
          
          stockData = {
            symbol: sym,
            name: SYMBOL_NAMES[sym] || sym,
            candles,
            latestPrice,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round((change / prevPrice) * 100 * 100) / 100,
          };
        }
        
        results.push(stockData);
      }
      
      return new Response(
        JSON.stringify({ stocks: results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: list, quote, or batch' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Stock data error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
