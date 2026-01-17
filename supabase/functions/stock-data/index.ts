import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuoteData {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change: number;
  changePercent: number;
  is24h: boolean;
  lastUpdated: number;
}

// Comprehensive market symbols across all asset classes
const ALL_MARKETS = {
  // Stocks
  stocks: [
    { symbol: 'AAPL', name: 'Apple Inc.', is24h: false },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', is24h: false },
    { symbol: 'MSFT', name: 'Microsoft', is24h: false },
    { symbol: 'AMZN', name: 'Amazon', is24h: false },
    { symbol: 'TSLA', name: 'Tesla', is24h: false },
    { symbol: 'NVDA', name: 'NVIDIA', is24h: false },
    { symbol: 'META', name: 'Meta Platforms', is24h: false },
    { symbol: 'JPM', name: 'JP Morgan', is24h: false },
    { symbol: 'V', name: 'Visa Inc.', is24h: false },
    { symbol: 'JNJ', name: 'Johnson & Johnson', is24h: false },
  ],
  // ETFs / Index Funds
  etfs: [
    { symbol: 'SPY', name: 'S&P 500 ETF', is24h: false },
    { symbol: 'QQQ', name: 'Nasdaq 100 ETF', is24h: false },
    { symbol: 'DIA', name: 'Dow Jones ETF', is24h: false },
    { symbol: 'IWM', name: 'Russell 2000 ETF', is24h: false },
    { symbol: 'VTI', name: 'Total Market ETF', is24h: false },
  ],
  // Crypto (24/7)
  crypto: [
    { symbol: 'BTC-USD', name: 'Bitcoin', is24h: true },
    { symbol: 'ETH-USD', name: 'Ethereum', is24h: true },
    { symbol: 'SOL-USD', name: 'Solana', is24h: true },
    { symbol: 'BNB-USD', name: 'Binance Coin', is24h: true },
    { symbol: 'XRP-USD', name: 'Ripple', is24h: true },
    { symbol: 'ADA-USD', name: 'Cardano', is24h: true },
    { symbol: 'DOGE-USD', name: 'Dogecoin', is24h: true },
  ],
  // Commodities
  commodities: [
    { symbol: 'GC=F', name: 'Gold Futures', is24h: true },
    { symbol: 'SI=F', name: 'Silver Futures', is24h: true },
    { symbol: 'CL=F', name: 'Crude Oil WTI', is24h: true },
    { symbol: 'NG=F', name: 'Natural Gas', is24h: true },
    { symbol: 'HG=F', name: 'Copper Futures', is24h: true },
    { symbol: 'PL=F', name: 'Platinum Futures', is24h: true },
  ],
  // Bonds / Treasury
  bonds: [
    { symbol: '^TNX', name: '10-Year Treasury Yield', is24h: false },
    { symbol: '^TYX', name: '30-Year Treasury Yield', is24h: false },
    { symbol: 'TLT', name: '20+ Year Treasury ETF', is24h: false },
    { symbol: 'IEF', name: '7-10 Year Treasury ETF', is24h: false },
    { symbol: 'SHY', name: '1-3 Year Treasury ETF', is24h: false },
    { symbol: 'BND', name: 'Total Bond Market ETF', is24h: false },
  ],
  // Index Futures (24/5)
  futures: [
    { symbol: 'ES=F', name: 'E-mini S&P 500', is24h: true },
    { symbol: 'NQ=F', name: 'E-mini Nasdaq 100', is24h: true },
    { symbol: 'YM=F', name: 'E-mini Dow', is24h: true },
    { symbol: 'RTY=F', name: 'E-mini Russell 2000', is24h: true },
    { symbol: 'ZB=F', name: '30-Year T-Bond Futures', is24h: true },
    { symbol: 'ZN=F', name: '10-Year T-Note Futures', is24h: true },
  ],
  // Forex (24/5)
  forex: [
    { symbol: 'EURUSD=X', name: 'EUR/USD', is24h: true },
    { symbol: 'GBPUSD=X', name: 'GBP/USD', is24h: true },
    { symbol: 'USDJPY=X', name: 'USD/JPY', is24h: true },
    { symbol: 'AUDUSD=X', name: 'AUD/USD', is24h: true },
    { symbol: 'USDCAD=X', name: 'USD/CAD', is24h: true },
    { symbol: 'USDCHF=X', name: 'USD/CHF', is24h: true },
  ],
};

// Base prices for fallback simulation
const BASE_PRICES: Record<string, number> = {
  // Stocks
  'AAPL': 178, 'GOOGL': 142, 'MSFT': 425, 'AMZN': 188, 'TSLA': 245,
  'NVDA': 485, 'META': 515, 'JPM': 195, 'V': 275, 'JNJ': 155,
  // ETFs
  'SPY': 485, 'QQQ': 425, 'DIA': 395, 'IWM': 205, 'VTI': 245,
  // Crypto
  'BTC-USD': 68500, 'ETH-USD': 3850, 'SOL-USD': 145, 'BNB-USD': 585,
  'XRP-USD': 0.52, 'ADA-USD': 0.45, 'DOGE-USD': 0.12,
  // Commodities
  'GC=F': 2365, 'SI=F': 28.5, 'CL=F': 78.5, 'NG=F': 2.85,
  'HG=F': 4.25, 'PL=F': 985,
  // Bonds
  '^TNX': 4.35, '^TYX': 4.55, 'TLT': 92, 'IEF': 95, 'SHY': 82, 'BND': 74,
  // Futures
  'ES=F': 5250, 'NQ=F': 18500, 'YM=F': 39500, 'RTY=F': 2150,
  'ZB=F': 118, 'ZN=F': 110,
  // Forex
  'EURUSD=X': 1.085, 'GBPUSD=X': 1.265, 'USDJPY=X': 154.5,
  'AUDUSD=X': 0.655, 'USDCAD=X': 1.365, 'USDCHF=X': 0.885,
};

// Volatility profiles for realistic simulation
const VOLATILITY: Record<string, number> = {
  // Stocks - moderate volatility
  'AAPL': 0.015, 'GOOGL': 0.018, 'MSFT': 0.014, 'AMZN': 0.02, 'TSLA': 0.035,
  'NVDA': 0.03, 'META': 0.025, 'JPM': 0.018, 'V': 0.012, 'JNJ': 0.01,
  // ETFs - lower volatility
  'SPY': 0.008, 'QQQ': 0.012, 'DIA': 0.007, 'IWM': 0.015, 'VTI': 0.008,
  // Crypto - high volatility
  'BTC-USD': 0.025, 'ETH-USD': 0.035, 'SOL-USD': 0.05, 'BNB-USD': 0.03,
  'XRP-USD': 0.04, 'ADA-USD': 0.045, 'DOGE-USD': 0.06,
  // Commodities - varies
  'GC=F': 0.012, 'SI=F': 0.025, 'CL=F': 0.03, 'NG=F': 0.045,
  'HG=F': 0.02, 'PL=F': 0.018,
  // Bonds - low volatility
  '^TNX': 0.02, '^TYX': 0.018, 'TLT': 0.015, 'IEF': 0.008, 'SHY': 0.003, 'BND': 0.005,
  // Futures
  'ES=F': 0.01, 'NQ=F': 0.015, 'YM=F': 0.009, 'RTY=F': 0.018,
  'ZB=F': 0.012, 'ZN=F': 0.008,
  // Forex - low volatility
  'EURUSD=X': 0.005, 'GBPUSD=X': 0.006, 'USDJPY=X': 0.008,
  'AUDUSD=X': 0.007, 'USDCAD=X': 0.005, 'USDCHF=X': 0.006,
};

// Cache for simulated prices to maintain continuity
const priceCache: Record<string, { price: number; lastUpdate: number }> = {};

/**
 * Get category for a symbol
 */
function getCategory(symbol: string): string {
  for (const [category, symbols] of Object.entries(ALL_MARKETS)) {
    if (symbols.find(s => s.symbol === symbol)) {
      return category;
    }
  }
  return 'unknown';
}

/**
 * Get symbol info
 */
function getSymbolInfo(symbol: string): { name: string; is24h: boolean; category: string } | null {
  for (const [category, symbols] of Object.entries(ALL_MARKETS)) {
    const found = symbols.find(s => s.symbol === symbol);
    if (found) {
      return { ...found, category };
    }
  }
  return null;
}

/**
 * Generate realistic simulated price with momentum
 */
function getSimulatedPrice(symbol: string): number {
  const basePrice = BASE_PRICES[symbol] || 100;
  const volatility = VOLATILITY[symbol] || 0.02;
  const now = Date.now();
  
  // Check cache
  const cached = priceCache[symbol];
  if (cached && now - cached.lastUpdate < 60000) {
    // Update with small movement
    const change = (Math.random() - 0.5) * cached.price * volatility * 0.1;
    const newPrice = cached.price + change;
    priceCache[symbol] = { price: newPrice, lastUpdate: now };
    return newPrice;
  }
  
  // Initialize or refresh with some randomization from base
  const randomOffset = (Math.random() - 0.5) * basePrice * 0.02;
  const price = basePrice + randomOffset;
  priceCache[symbol] = { price, lastUpdate: now };
  return price;
}

/**
 * Try to fetch real data from Yahoo Finance
 */
async function fetchRealQuote(symbol: string): Promise<QuoteData | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
    
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
    
    if (!result || !result.meta) {
      return null;
    }
    
    const meta = result.meta;
    const price = meta.regularMarketPrice || meta.previousClose;
    const prevClose = meta.previousClose || price;
    const change = price - prevClose;
    const changePercent = (change / prevClose) * 100;
    
    const info = getSymbolInfo(symbol);
    
    return {
      symbol,
      name: meta.shortName || meta.longName || info?.name || symbol,
      category: info?.category || 'unknown',
      price: Math.round(price * 10000) / 10000,
      change: Math.round(change * 10000) / 10000,
      changePercent: Math.round(changePercent * 100) / 100,
      is24h: info?.is24h || false,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

/**
 * Get quote with fallback to simulation
 */
async function getQuote(symbol: string): Promise<QuoteData> {
  // Try real data first
  const realData = await fetchRealQuote(symbol);
  if (realData) {
    // Update cache with real price
    priceCache[symbol] = { price: realData.price, lastUpdate: Date.now() };
    return realData;
  }
  
  // Fall back to simulated data
  const info = getSymbolInfo(symbol);
  const price = getSimulatedPrice(symbol);
  const basePrice = BASE_PRICES[symbol] || 100;
  const change = price - basePrice;
  const changePercent = (change / basePrice) * 100;
  
  return {
    symbol,
    name: info?.name || symbol,
    category: info?.category || 'unknown',
    price: Math.round(price * 10000) / 10000,
    change: Math.round(change * 10000) / 10000,
    changePercent: Math.round(changePercent * 100) / 100,
    is24h: info?.is24h || false,
    lastUpdated: Date.now(),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, symbol, symbols, category } = body;
    
    // List all available symbols
    if (action === 'list') {
      const allSymbols = [];
      for (const [cat, syms] of Object.entries(ALL_MARKETS)) {
        for (const s of syms) {
          allSymbols.push({ ...s, category: cat });
        }
      }
      return new Response(
        JSON.stringify({ symbols: allSymbols, categories: Object.keys(ALL_MARKETS) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // List symbols by category
    if (action === 'listCategory' && category) {
      const categorySymbols = ALL_MARKETS[category as keyof typeof ALL_MARKETS] || [];
      return new Response(
        JSON.stringify({ 
          category, 
          symbols: categorySymbols.map(s => ({ ...s, category })) 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get single quote
    if (action === 'quote' && symbol) {
      const quote = await getQuote(symbol);
      return new Response(
        JSON.stringify(quote),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get batch quotes
    if (action === 'batch' && symbols && Array.isArray(symbols)) {
      const quotes: QuoteData[] = [];
      
      // Process in parallel batches of 5
      const batches = [];
      for (let i = 0; i < symbols.length; i += 5) {
        batches.push(symbols.slice(i, i + 5));
      }
      
      for (const batch of batches) {
        const batchResults = await Promise.all(batch.map(s => getQuote(s)));
        quotes.push(...batchResults);
      }
      
      return new Response(
        JSON.stringify({ quotes, lastUpdated: Date.now() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get quotes for all 24/7 markets (crypto, futures, commodities)
    if (action === 'get24hMarkets') {
      const allSymbols = [];
      for (const [cat, syms] of Object.entries(ALL_MARKETS)) {
        for (const s of syms) {
          if (s.is24h) {
            allSymbols.push(s.symbol);
          }
        }
      }
      
      const quotes = await Promise.all(allSymbols.slice(0, 20).map(s => getQuote(s)));
      
      return new Response(
        JSON.stringify({ quotes, lastUpdated: Date.now() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Invalid action. Use: list, listCategory, quote, batch, or get24hMarkets',
        availableCategories: Object.keys(ALL_MARKETS)
      }),
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
