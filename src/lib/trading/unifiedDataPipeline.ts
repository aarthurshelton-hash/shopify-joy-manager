/**
 * Unified Multi-Asset Data Pipeline
 * 
 * Aggregates real-time data from IBKR, options flow, macro indicators,
 * and sentiment feeds into a unified stream for strategy engines.
 */

import { ASSET_CLASSES, DATA_SOURCES } from './multiAssetConfig';

interface MarketDataPoint {
  timestamp: string;
  symbol: string;
  assetClass: string;
  price: number;
  change: number;
  volume: number;
  iv?: number;              // Implied volatility (options)
  delta?: number;           // Greeks for options
  gamma?: number;
  theta?: number;
  vega?: number;
  openInterest?: number;
  unusualFlow?: boolean;    // Options flow alert
  sentiment?: number;       // -1 to 1 sentiment score
  macroScore?: number;      // Macro regime indicator
  correlationBeta?: number; // Cross-asset correlation
}

interface MacroRegime {
  timestamp: string;
  vix: number;
  vixTermStructure: number; // Contango/backwardation
  yieldCurve: { '2Y': number; '10Y': number; slope: number };
  creditSpread: number;     // HYG/LQD spread
  dxy: number;              // Dollar strength
  fedPolicy: 'hawkish' | 'dovish' | 'neutral';
  marketRegime: 'risk_on' | 'risk_off' | 'neutral' | 'crisis';
}

interface OptionsFlowAlert {
  timestamp: string;
  symbol: string;
  type: 'sweep' | 'block' | 'unusual_volume' | 'whale';
  strike: number;
  expiration: string;
  side: 'call' | 'put';
  size: number;
  premium: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
}

export class UnifiedDataPipeline {
  private subscribers: Map<string, ((data: MarketDataPoint) => void)[]> = new Map();
  private macroCache: MacroRegime | null = null;
  private optionsFlowQueue: OptionsFlowAlert[] = [];
  private correlationMatrix: Map<string, Map<string, number>> = new Map();
  private lastUpdate: Map<string, number> = new Map();
  
  private readonly UPDATE_INTERVAL_MS = 1000;
  private readonly MACRO_UPDATE_INTERVAL_MS = 60000;
  
  constructor(private ibkrClient: any, private supabase: any) {}
  
  async start() {
    console.log('[DataPipeline] Starting unified data pipeline...');
    
    // Start data streams
    this.startPriceStream();
    this.startOptionsFlowStream();
    this.startMacroStream();
    this.startSentimentStream();
    this.startCorrelationEngine();
    
    console.log('[DataPipeline] All streams active');
  }
  
  private async startPriceStream() {
    const allSymbols = this.getAllSymbols();
    
    setInterval(async () => {
      try {
        // Batch quote request to IBKR
        const quotes = await this.ibkrClient.getBatchQuotes(allSymbols.slice(0, 50));
        
        for (const quote of quotes) {
          const dataPoint: MarketDataPoint = {
            timestamp: new Date().toISOString(),
            symbol: quote.symbol,
            assetClass: this.classifyAsset(quote.symbol),
            price: quote.lastPrice,
            change: quote.change,
            volume: quote.volume,
          };
          
          // Enrich with options data if available
          if (this.hasOptions(quote.symbol)) {
            const optionsData = await this.getOptionsData(quote.symbol);
            Object.assign(dataPoint, optionsData);
          }
          
          this.broadcast(quote.symbol, dataPoint);
        }
      } catch (err) {
        console.error('[DataPipeline] Price stream error:', err);
      }
    }, this.UPDATE_INTERVAL_MS);
  }
  
  private async startOptionsFlowStream() {
    // Poll options flow APIs
    setInterval(async () => {
      try {
        const flowAlerts = await this.fetchOptionsFlow();
        
        for (const alert of flowAlerts) {
          this.optionsFlowQueue.push(alert);
          
          // Trim queue to last 1000 alerts
          if (this.optionsFlowQueue.length > 1000) {
            this.optionsFlowQueue.shift();
          }
          
          // Broadcast to subscribers
          const dataPoint: MarketDataPoint = {
            timestamp: alert.timestamp,
            symbol: alert.symbol,
            assetClass: 'OPTIONS_FLOW',
            price: 0,
            change: 0,
            volume: alert.size,
            unusualFlow: true,
            sentiment: alert.sentiment === 'bullish' ? 1 : alert.sentiment === 'bearish' ? -1 : 0,
          };
          
          this.broadcast(alert.symbol, dataPoint);
        }
      } catch (err) {
        console.error('[DataPipeline] Options flow error:', err);
      }
    }, 5000);
  }
  
  private async startMacroStream() {
    setInterval(async () => {
      try {
        // Fetch VIX
        const vixQuote = await this.ibkrClient.getQuote(27618703); // VIX futures conid
        
        // Fetch Treasury yields via FRED or IBKR
        const yields = await this.fetchTreasuryYields();
        
        // Fetch DXY
        const dxyQuote = await this.ibkrClient.getQuote(27823923); // UUP conid
        
        // Calculate credit spread (HYG - LQD proxy)
        const hyg = await this.ibkrClient.getQuote(9775249);
        const lqd = await this.ibkrClient.getQuote(9775248);
        
        this.macroCache = {
          timestamp: new Date().toISOString(),
          vix: vixQuote?.lastPrice || 20,
          vixTermStructure: this.calculateVIXTermStructure(),
          yieldCurve: yields,
          creditSpread: (hyg?.lastPrice || 0) - (lqd?.lastPrice || 0),
          dxy: dxyQuote?.lastPrice || 100,
          fedPolicy: this.inferFedPolicy(yields),
          marketRegime: this.classifyMarketRegime(vixQuote?.lastPrice || 20, yields),
        };
        
        // Store in Supabase
        await this.supabase.from('macro_regime').insert(this.macroCache);
        
      } catch (err) {
        console.error('[DataPipeline] Macro stream error:', err);
      }
    }, this.MACRO_UPDATE_INTERVAL_MS);
  }
  
  private async startSentimentStream() {
    // Social media sentiment aggregation
    setInterval(async () => {
      try {
        const symbols = ASSET_CLASSES.EQUITIES.symbols.US.slice(0, 10);
        
        for (const symbol of symbols) {
          const sentiment = await this.fetchSocialSentiment(symbol);
          
          if (Math.abs(sentiment) > 0.3) { // Significant sentiment
            const dataPoint: MarketDataPoint = {
              timestamp: new Date().toISOString(),
              symbol,
              assetClass: 'EQUITIES',
              price: 0,
              change: 0,
              volume: 0,
              sentiment,
            };
            
            this.broadcast(symbol, dataPoint);
          }
        }
      } catch (err) {
        console.error('[DataPipeline] Sentiment stream error:', err);
      }
    }, 30000);
  }
  
  private async startCorrelationEngine() {
    // Calculate rolling correlations every 5 minutes
    setInterval(async () => {
      try {
        await this.updateCorrelationMatrix();
      } catch (err) {
        console.error('[DataPipeline] Correlation engine error:', err);
      }
    }, 300000);
  }
  
  private async updateCorrelationMatrix() {
    const symbols = this.getAllSymbols().slice(0, 20);
    const returns: Map<string, number[]> = new Map();
    
    // Fetch 30-day price history for each symbol
    for (const symbol of symbols) {
      const history = await this.ibkrClient.getHistoricalData(symbol, '30d');
      const dailyReturns = this.calculateReturns(history);
      returns.set(symbol, dailyReturns);
    }
    
    // Calculate correlation matrix
    for (const sym1 of symbols) {
      const row = new Map<string, number>();
      for (const sym2 of symbols) {
        if (sym1 === sym2) {
          row.set(sym2, 1.0);
        } else {
          const corr = this.calculateCorrelation(
            returns.get(sym1) || [],
            returns.get(sym2) || []
          );
          row.set(sym2, corr);
        }
      }
      this.correlationMatrix.set(sym1, row);
    }
  }
  
  subscribe(symbol: string, callback: (data: MarketDataPoint) => void) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, []);
    }
    this.subscribers.get(symbol)!.push(callback);
  }
  
  unsubscribe(symbol: string, callback: (data: MarketDataPoint) => void) {
    const callbacks = this.subscribers.get(symbol);
    if (callbacks) {
      const idx = callbacks.indexOf(callback);
      if (idx > -1) callbacks.splice(idx, 1);
    }
  }
  
  private broadcast(symbol: string, data: MarketDataPoint) {
    const callbacks = this.subscribers.get(symbol);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error('[DataPipeline] Subscriber error:', err);
        }
      });
    }
  }
  
  getMacroRegime(): MacroRegime | null {
    return this.macroCache;
  }
  
  getRecentOptionsFlow(symbol: string, minutes: number = 30): OptionsFlowAlert[] {
    const cutoff = Date.now() - minutes * 60000;
    return this.optionsFlowQueue.filter(
      alert => alert.symbol === symbol && new Date(alert.timestamp).getTime() > cutoff
    );
  }
  
  getCorrelation(sym1: string, sym2: string): number {
    return this.correlationMatrix.get(sym1)?.get(sym2) || 0;
  }
  
  private getAllSymbols(): string[] {
    return [
      ...ASSET_CLASSES.EQUITIES.symbols.US,
      ...ASSET_CLASSES.EQUITIES.symbols.INTL,
      ...ASSET_CLASSES.EQUITIES.symbols.SECTORS,
      ...ASSET_CLASSES.BONDS.symbols,
      ...ASSET_CLASSES.FOREX.pairs,
      ...ASSET_CLASSES.COMMODITIES.symbols,
    ];
  }
  
  private classifyAsset(symbol: string): string {
    if (ASSET_CLASSES.EQUITIES.symbols.US.includes(symbol)) return 'EQUITIES_US';
    if (ASSET_CLASSES.BONDS.symbols.includes(symbol)) return 'BONDS';
    if (ASSET_CLASSES.FOREX.pairs.includes(symbol)) return 'FOREX';
    if (ASSET_CLASSES.COMMODITIES.symbols.includes(symbol)) return 'COMMODITIES';
    return 'UNKNOWN';
  }
  
  private hasOptions(symbol: string): boolean {
    return ASSET_CLASSES.OPTIONS.underlying.includes(symbol);
  }
  
  private async getOptionsData(symbol: string): Promise<Partial<MarketDataPoint>> {
    // Fetch ATM options chain and calculate IV
    try {
      const chain = await this.ibkrClient.getOptionsChain(symbol);
      const atmOption = chain.find((o: any) => Math.abs(o.delta) > 0.45 && Math.abs(o.delta) < 0.55);
      
      if (atmOption) {
        return {
          iv: atmOption.impliedVol,
          delta: atmOption.delta,
          gamma: atmOption.gamma,
          theta: atmOption.theta,
          vega: atmOption.vega,
          openInterest: atmOption.openInterest,
        };
      }
    } catch (err) {
      console.warn('[DataPipeline] Options data fetch failed for', symbol);
    }
    return {};
  }
  
  private async fetchOptionsFlow(): Promise<OptionsFlowAlert[]> {
    // Placeholder - integrate with Unusual Whales or similar
    // For now, return empty array
    return [];
  }
  
  private async fetchTreasuryYields(): Promise<{ '2Y': number; '10Y': number; slope: number }> {
    // Use IBKR bond data or FRED API
    try {
      // SHY (2Y) and TLT (20Y) as proxies
      const shy = await this.ibkrClient.getQuote(9775242);
      const tlt = await this.ibkrClient.getQuote(9775241);
      
      const yield2Y = (100 - (shy?.lastPrice || 99)) * 2; // Rough estimate
      const yield10Y = (100 - (tlt?.lastPrice || 90)) * 1.5;
      
      return {
        '2Y': Math.max(0, yield2Y),
        '10Y': Math.max(0, yield10Y),
        slope: yield10Y - yield2Y,
      };
    } catch (err) {
      return { '2Y': 4.5, '10Y': 4.0, slope: -0.5 };
    }
  }
  
  private calculateVIXTermStructure(): number {
    // Simplified - would use VIX futures curve
    return 0; // 0 = flat, positive = contango, negative = backwardation
  }
  
  private inferFedPolicy(yields: { slope: number }): 'hawkish' | 'dovish' | 'neutral' {
    if (yields.slope < -0.5) return 'hawkish';
    if (yields.slope > 1.0) return 'dovish';
    return 'neutral';
  }
  
  private classifyMarketRegime(vix: number, yields: { slope: number }): 'risk_on' | 'risk_off' | 'neutral' | 'crisis' {
    if (vix > 35) return 'crisis';
    if (vix > 25 || yields.slope < -1) return 'risk_off';
    if (vix < 15 && yields.slope > 0) return 'risk_on';
    return 'neutral';
  }
  
  private async fetchSocialSentiment(symbol: string): Promise<number> {
    // Placeholder - would integrate with Twitter/Reddit APIs
    return 0;
  }
  
  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    return returns;
  }
  
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;
    
    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
}
