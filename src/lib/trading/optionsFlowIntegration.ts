/**
 * Options Flow Integration Module
 * 
 * Integrates with options flow data providers to detect:
 * - Unusual options activity (sweeps, blocks, whale trades)
 * - Sentiment indicators (bullish/bearish flow)
 * - Implied volatility changes
 * - Gamma exposure levels
 */

import { ASSET_CLASSES } from '../trading/multiAssetConfig';

interface OptionsFlowAlert {
  id: string;
  timestamp: string;
  symbol: string;
  underlyingPrice: number;
  expiration: string;
  strike: number;
  type: 'call' | 'put';
  side: 'buy' | 'sell';
  size: number;
  premium: number;
  iv: number;
  delta: number;
  alertType: 'sweep' | 'block' | 'whale' | 'unusual_volume' | 'repeat';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  tags: string[];
}

interface FlowSummary {
  symbol: string;
  timestamp: string;
  callVolume: number;
  putVolume: number;
  callPremium: number;
  putPremium: number;
  callOpenInterest: number;
  putOpenInterest: number;
  ivRank: number;
  ivPercentile: number;
  putCallRatio: number;
  bullishFlow: boolean;
  netPremium: number;
  unusualActivity: boolean;
}

interface GammaExposure {
  symbol: string;
  timestamp: string;
  totalGamma: number;
  callGamma: number;
  putGamma: number;
  gammaNotional: number;
  maxPain: number;
  pinRisk: boolean;
}

export class OptionsFlowIntegration {
  private flowHistory: Map<string, OptionsFlowAlert[]> = new Map();
  private summaries: Map<string, FlowSummary> = new Map();
  private gammaData: Map<string, GammaExposure> = new Map();
  private subscribers: ((alert: OptionsFlowAlert) => void)[] = [];
  
  private readonly API_ENDPOINTS = {
    unusualWolves: 'https://api.unusualwhales.com',
    marketChameleon: 'https://api.marketchameleon.com',
    cheddarFlow: 'https://api.cheddarflow.com',
  };
  
  constructor(private apiKey: string, private supabase: any) {}
  
  async initialize() {
    console.log('[OptionsFlow] Initializing options flow module...');
    
    // Start polling for flow data
    this.startFlowPolling();
    
    // Start gamma exposure tracking
    this.startGammaTracking();
    
    console.log('[OptionsFlow] Initialized');
  }
  
  private startFlowPolling() {
    // Poll every 30 seconds during market hours
    setInterval(async () => {
      if (this.isMarketOpen()) {
        await this.fetchOptionsFlow();
      }
    }, 30000);
  }
  
  private startGammaTracking() {
    // Update gamma exposure every 5 minutes
    setInterval(async () => {
      if (this.isMarketOpen()) {
        await this.updateGammaExposure();
      }
    }, 300000);
  }
  
  private async fetchOptionsFlow() {
    try {
      // Fetch from multiple sources
      const alerts: OptionsFlowAlert[] = [];
      
      // Source 1: Unusual Whales (if API key available)
      const uwAlerts = await this.fetchUnusualWhales();
      alerts.push(...uwAlerts);
      
      // Source 2: Market Chameleon
      const mcAlerts = await this.fetchMarketChameleon();
      alerts.push(...mcAlerts);
      
      // Process and filter alerts
      for (const alert of alerts) {
        if (this.isSignificant(alert)) {
          this.processAlert(alert);
        }
      }
      
      // Update summaries
      this.updateSummaries();
      
    } catch (err) {
      console.error('[OptionsFlow] Fetch error:', err);
    }
  }
  
  private async fetchUnusualWhales(): Promise<OptionsFlowAlert[]> {
    // Placeholder - integrate with actual Unusual Whales API
    // Requires API key and subscription
    return [];
  }
  
  private async fetchMarketChameleon(): Promise<OptionsFlowAlert[]> {
    // Placeholder - integrate with Market Chameleon API
    return [];
  }
  
  private async updateGammaExposure() {
    for (const symbol of ASSET_CLASSES.OPTIONS.underlying) {
      try {
        const gamma = await this.calculateGammaExposure(symbol);
        this.gammaData.set(symbol, gamma);
        
        // Save to database
        await this.supabase.from('gamma_exposure').insert({
          symbol,
          ...gamma,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.warn(`[OptionsFlow] Gamma calc failed for ${symbol}:`, err);
      }
    }
  }
  
  private async calculateGammaExposure(symbol: string): Promise<GammaExposure> {
    // Fetch options chain
    const { data: chain } = await this.supabase
      .from('options_chain')
      .select('*')
      .eq('symbol', symbol)
      .order('strike', { ascending: true });
    
    if (!chain || chain.length === 0) {
      return {
        symbol,
        timestamp: new Date().toISOString(),
        totalGamma: 0,
        callGamma: 0,
        putGamma: 0,
        gammaNotional: 0,
        maxPain: 0,
        pinRisk: false,
      };
    }
    
    let totalGamma = 0;
    let callGamma = 0;
    let putGamma = 0;
    let gammaNotional = 0;
    
    // Calculate gamma exposure
    for (const option of chain) {
      const gamma = option.gamma || 0;
      const oi = option.open_interest || 0;
      const gammaExposure = gamma * oi * option.underlying_price;
      
      totalGamma += gammaExposure;
      
      if (option.type === 'call') {
        callGamma += gammaExposure;
      } else {
        putGamma += gammaExposure;
      }
      
      gammaNotional += Math.abs(gammaExposure);
    }
    
    // Find max pain (strike with minimum total value)
    const strikes = [...new Set(chain.map((o: any) => o.strike))];
    let maxPain = strikes[0];
    let minPain = Infinity;
    
    for (const strike of strikes) {
      const pain = chain
        .filter((o: any) => o.strike === strike)
        .reduce((sum: number, o: any) => {
          const intrinsic = o.type === 'call' 
            ? Math.max(0, o.underlying_price - o.strike)
            : Math.max(0, o.strike - o.underlying_price);
          return sum + intrinsic * o.open_interest;
        }, 0);
      
      if (pain < minPain) {
        minPain = pain;
        maxPain = strike;
      }
    }
    
    // Check for pin risk (price near max pain with high gamma)
    const currentPrice = chain[0]?.underlying_price || 0;
    const pinRisk = Math.abs(currentPrice - maxPain) / currentPrice < 0.01 && 
                   Math.abs(totalGamma) > 1000000;
    
    return {
      symbol,
      timestamp: new Date().toISOString(),
      totalGamma,
      callGamma,
      putGamma,
      gammaNotional,
      maxPain,
      pinRisk,
    };
  }
  
  private processAlert(alert: OptionsFlowAlert) {
    // Add to history
    if (!this.flowHistory.has(alert.symbol)) {
      this.flowHistory.set(alert.symbol, []);
    }
    
    const history = this.flowHistory.get(alert.symbol)!;
    history.push(alert);
    
    // Keep last 1000 alerts per symbol
    if (history.length > 1000) {
      history.shift();
    }
    
    // Save to database
    this.saveAlert(alert);
    
    // Notify subscribers
    this.subscribers.forEach(cb => {
      try {
        cb(alert);
      } catch (err) {
        console.error('[OptionsFlow] Subscriber error:', err);
      }
    });
  }
  
  private updateSummaries() {
    for (const [symbol, alerts] of this.flowHistory) {
      const recent = alerts.filter(a => 
        new Date(a.timestamp).getTime() > Date.now() - 3600000 // Last hour
      );
      
      const calls = recent.filter(a => a.type === 'call');
      const puts = recent.filter(a => a.type === 'put');
      
      const callVolume = calls.reduce((sum, a) => sum + a.size, 0);
      const putVolume = puts.reduce((sum, a) => sum + a.size, 0);
      const callPremium = calls.reduce((sum, a) => sum + a.premium, 0);
      const putPremium = puts.reduce((sum, a) => sum + a.premium, 0);
      
      const summary: FlowSummary = {
        symbol,
        timestamp: new Date().toISOString(),
        callVolume,
        putVolume,
        callPremium,
        putPremium,
        callOpenInterest: 0, // Would need OI data
        putOpenInterest: 0,
        ivRank: 0, // Would need IV history
        ivPercentile: 0,
        putCallRatio: callVolume > 0 ? putVolume / callVolume : 0,
        bullishFlow: callPremium > putPremium * 1.2,
        netPremium: callPremium - putPremium,
        unusualActivity: recent.some(a => a.alertType === 'unusual_volume' || a.alertType === 'whale'),
      };
      
      this.summaries.set(symbol, summary);
    }
  }
  
  private isSignificant(alert: OptionsFlowAlert): boolean {
    // Filter criteria
    const minPremium = 50000; // $50k minimum
    const minSize = 100; // 100 contracts minimum
    
    return alert.premium >= minPremium || alert.size >= minSize;
  }
  
  private isMarketOpen(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Simple check - 9:30 AM to 4:00 PM ET, weekdays only
    // Adjust for your timezone
    return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
  }
  
  private async saveAlert(alert: OptionsFlowAlert) {
    try {
      await this.supabase.from('options_flow_alerts').insert(alert);
    } catch (err) {
      console.warn('[OptionsFlow] Failed to save alert:', err);
    }
  }
  
  // Public API
  subscribe(callback: (alert: OptionsFlowAlert) => void) {
    this.subscribers.push(callback);
  }
  
  unsubscribe(callback: (alert: OptionsFlowAlert) => void) {
    const idx = this.subscribers.indexOf(callback);
    if (idx > -1) this.subscribers.splice(idx, 1);
  }
  
  getRecentAlerts(symbol: string, minutes: number = 30): OptionsFlowAlert[] {
    const history = this.flowHistory.get(symbol) || [];
    const cutoff = Date.now() - minutes * 60000;
    return history.filter(a => new Date(a.timestamp).getTime() > cutoff);
  }
  
  getFlowSummary(symbol: string): FlowSummary | undefined {
    return this.summaries.get(symbol);
  }
  
  getGammaExposure(symbol: string): GammaExposure | undefined {
    return this.gammaData.get(symbol);
  }
  
  getBullishSymbols(): string[] {
    const bullish: string[] = [];
    for (const [symbol, summary] of this.summaries) {
      if (summary.bullishFlow && summary.netPremium > 100000) {
        bullish.push(symbol);
      }
    }
    return bullish;
  }
  
  getBearishSymbols(): string[] {
    const bearish: string[] = [];
    for (const [symbol, summary] of this.summaries) {
      if (!summary.bullishFlow && summary.netPremium < -100000) {
        bearish.push(symbol);
      }
    }
    return bearish;
  }
  
  getUnusualActivity(): { symbol: string; alerts: OptionsFlowAlert[] }[] {
    const result: { symbol: string; alerts: OptionsFlowAlert[] }[] = [];
    
    for (const [symbol, summary] of this.summaries) {
      if (summary.unusualActivity) {
        const alerts = this.getRecentAlerts(symbol, 15);
        if (alerts.length > 0) {
          result.push({ symbol, alerts });
        }
      }
    }
    
    return result.sort((a, b) => b.alerts.length - a.alerts.length);
  }
  
  getHighGammaSymbols(): string[] {
    const highGamma: string[] = [];
    for (const [symbol, gamma] of this.gammaData) {
      if (Math.abs(gamma.totalGamma) > 500000) {
        highGamma.push(symbol);
      }
    }
    return highGamma;
  }
  
  getPinRiskSymbols(): string[] {
    const pinRisk: string[] = [];
    for (const [symbol, gamma] of this.gammaData) {
      if (gamma.pinRisk) {
        pinRisk.push(symbol);
      }
    }
    return pinRisk;
  }
}
