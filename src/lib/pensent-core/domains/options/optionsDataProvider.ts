/**
 * Options Data Provider - Multi-Broker Real-Time Data
 * 
 * Aggregates options data from Tradier, IBKR, Polygon, and other sources.
 * Provides unified interface for options chain, flow, and quote data.
 * 
 * En Pensent™ Patent-Pending Technology
 * @version 7.50-OPTIONS
 */

import { supabase } from '@/integrations/supabase/client';
import {
  OptionsChain,
  OptionContract,
  OptionsTick,
  OptionsFlowData,
  UnderlyingAnalysis,
  MarketContext,
  MarketSession,
  SCALPING_UNDERLYINGS,
} from './types';

const PROVIDER_VERSION = '7.50-OPTIONS';

interface DataSource {
  name: string;
  priority: number;
  enabled: boolean;
  lastSuccess: number;
  failCount: number;
}

class OptionsDataProvider {
  private sources: Map<string, DataSource> = new Map();
  private chainCache: Map<string, { data: OptionsChain; timestamp: number }> = new Map();
  private tickCache: Map<string, OptionsTick[]> = new Map();
  private underlyingCache: Map<string, { data: UnderlyingAnalysis; timestamp: number }> = new Map();
  private contextCache: MarketContext | null = null;
  private cacheTTL = 15000; // 15 seconds

  constructor() {
    this.initializeSources();
  }

  private initializeSources(): void {
    const sources: DataSource[] = [
      { name: 'tradier', priority: 1, enabled: true, lastSuccess: 0, failCount: 0 },
      { name: 'polygon', priority: 2, enabled: true, lastSuccess: 0, failCount: 0 },
      { name: 'ibkr', priority: 3, enabled: true, lastSuccess: 0, failCount: 0 },
      { name: 'binance', priority: 4, enabled: true, lastSuccess: 0, failCount: 0 },
      { name: 'finnhub', priority: 5, enabled: true, lastSuccess: 0, failCount: 0 },
    ];

    sources.forEach(s => this.sources.set(s.name, s));
    console.log(`[OptionsDataProvider] ${PROVIDER_VERSION} initialized with ${sources.length} sources`);
  }

  /**
   * Get options chain for underlying
   */
  async getOptionsChain(underlying: string, expiration?: string): Promise<OptionsChain | null> {
    const cacheKey = `${underlying}:${expiration || 'all'}`;
    const cached = this.chainCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase.functions.invoke('options-data', {
        body: {
          action: 'chain',
          underlying,
          expiration,
        },
      });

      if (error) throw error;

      if (data?.chain) {
        this.chainCache.set(cacheKey, { data: data.chain, timestamp: Date.now() });
        return data.chain;
      }

      // No fallback — return null when real data unavailable
      return null;
    } catch (err) {
      console.error('[OptionsDataProvider] Chain fetch error:', err);
      return null;
    }
  }

  /**
   * Get real-time quote for specific option
   */
  async getOptionQuote(optionSymbol: string): Promise<OptionsTick | null> {
    try {
      const { data, error } = await supabase.functions.invoke('options-data', {
        body: {
          action: 'quote',
          symbol: optionSymbol,
        },
      });

      if (error) throw error;
      return data?.tick || null;
    } catch (err) {
      console.error('[OptionsDataProvider] Quote fetch error:', err);
      return null;
    }
  }

  /**
   * Get underlying analysis with technicals
   */
  async getUnderlyingAnalysis(symbol: string): Promise<UnderlyingAnalysis | null> {
    const cached = this.underlyingCache.get(symbol);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase.functions.invoke('options-data', {
        body: {
          action: 'analysis',
          symbol,
        },
      });

      if (error) throw error;

      if (data?.analysis) {
        this.underlyingCache.set(symbol, { data: data.analysis, timestamp: Date.now() });
        return data.analysis;
      }

      // No fallback — return null when real data unavailable
      return null;
    } catch (err) {
      console.error('[OptionsDataProvider] Analysis fetch error:', err);
      return null;
    }
  }

  /**
   * Get unusual options activity / flow
   */
  async getOptionsFlow(underlying?: string): Promise<OptionsFlowData[]> {
    try {
      const { data, error } = await supabase.functions.invoke('options-data', {
        body: {
          action: 'flow',
          underlying,
        },
      });

      if (error) throw error;
      return data?.flow || [];
    } catch (err) {
      console.error('[OptionsDataProvider] Flow fetch error:', err);
      return [];
    }
  }

  /**
   * Get current market context
   */
  async getMarketContext(): Promise<MarketContext> {
    if (this.contextCache && Date.now() - this.contextCache.timestamp < this.cacheTTL) {
      return this.contextCache;
    }

    try {
      const { data, error } = await supabase.functions.invoke('options-data', {
        body: { action: 'context' },
      });

      if (error) throw error;

      if (data?.context) {
        this.contextCache = data.context;
        return data.context;
      }
    } catch (err) {
      console.error('[OptionsDataProvider] Context fetch error:', err);
    }

    // No fallback — return null when real data unavailable
    return this.generateDefaultContext();
  }

  /**
   * Subscribe to real-time option quotes
   */
  subscribeToQuotes(
    symbols: string[],
    callback: (tick: OptionsTick) => void
  ): () => void {
    // In production, this would use WebSocket connection
    // For now, poll at high frequency
    const pollInterval = setInterval(async () => {
      for (const symbol of symbols) {
        const tick = await this.getOptionQuote(symbol);
        if (tick) callback(tick);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }

  /**
   * Get current market session
   */
  getMarketSession(): MarketSession {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDay();

    // Weekend
    if (day === 0 || day === 6) return 'closed';

    const time = hour * 60 + minute;
    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = 16 * 60; // 4:00 PM

    if (time < marketOpen - 30) return 'premarket'; // 9:00 AM
    if (time < marketOpen) return 'premarket';
    if (time < marketClose) return 'regular';
    if (time < marketClose + 120) return 'afterhours'; // Until 6 PM
    return 'closed';
  }

  /**
   * Check if market is tradeable
   */
  isMarketOpen(includeExtended: boolean = false): boolean {
    const session = this.getMarketSession();
    if (session === 'regular') return true;
    if (includeExtended && (session === 'premarket' || session === 'afterhours')) return true;
    return false;
  }

  // Default context with only real session info — no fake market metrics
  private generateDefaultContext(): MarketContext {
    return {
      session: this.getMarketSession(),
      spyTrend: 'unknown' as any,
      vixLevel: 0,
      vixChange: 0,
      marketBreadth: 0,
      sectorRotation: {},
      economicEvents: [],
      timestamp: Date.now(),
    };
  }
}

export const optionsDataProvider = new OptionsDataProvider();
