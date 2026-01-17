/**
 * Multi-Broker Data Adapter
 * 
 * Aggregates real-time market data from multiple sources:
 * - Alpaca (Stocks + Crypto, Trading)
 * - Polygon (Premium tick data)
 * - Binance (24/7 Crypto)
 * - Finnhub (Sentiment + News)
 * - Twelve Data (Technical Indicators)
 * - Tradier (Options)
 * 
 * Cross-validates signals for maximum accuracy
 */

import { supabase } from '@/integrations/supabase/client';
import type { DomainAdapter, DomainSignature, UniversalSignal, DomainType } from '../types';

export interface MarketTick {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  volume?: number;
  timestamp: number;
  source: string;
}

export interface AggregatedMarketData {
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

class MultiBrokerAdapter implements DomainAdapter<AggregatedMarketData> {
  domain: DomainType = 'market';
  name = 'Multi-Broker Aggregator';
  isActive = false;
  lastUpdate = 0;
  
  private dataHistory: AggregatedMarketData[] = [];
  private readonly MAX_HISTORY = 1000;
  
  async initialize(): Promise<void> {
    console.log('[MultiBrokerAdapter] Initializing multi-source data feed...');
    this.isActive = true;
    this.lastUpdate = Date.now();
  }

  /**
   * Fetch aggregated data from all broker sources
   */
  async fetchAggregatedData(
    symbol: string,
    assetType: 'stock' | 'crypto' | 'forex' = 'stock'
  ): Promise<AggregatedMarketData | null> {
    try {
      const { data, error } = await supabase.functions.invoke('multi-broker-data', {
        body: { symbol, assetType, action: 'aggregate' },
      });

      if (error) {
        console.error('[MultiBrokerAdapter] Edge function error:', error);
        return null;
      }

      if (data?.success && data.data) {
        const aggregated = data.data as AggregatedMarketData;
        
        // Store in history
        this.dataHistory.push(aggregated);
        if (this.dataHistory.length > this.MAX_HISTORY) {
          this.dataHistory.shift();
        }
        
        this.lastUpdate = Date.now();
        return aggregated;
      }

      return null;
    } catch (err) {
      console.error('[MultiBrokerAdapter] Fetch error:', err);
      return null;
    }
  }

  /**
   * Process raw aggregated data into universal signal
   */
  processRawData(data: AggregatedMarketData): UniversalSignal {
    const prices = data.ticks.map(t => t.price);
    const avgPrice = data.consensus.price;
    const priceRange = prices.length > 0 ? Math.max(...prices) - Math.min(...prices) : 0;
    
    // Calculate momentum from recent history
    const recentHistory = this.dataHistory.slice(-10);
    const momentum = recentHistory.length > 1
      ? (avgPrice - recentHistory[0].consensus.price) / recentHistory[0].consensus.price
      : 0;
    
    // Frequency based on update rate
    const frequency = 1000 / (Date.now() - this.lastUpdate + 1);
    
    // Phase based on sentiment if available
    const phase = data.sentiment 
      ? (data.sentiment.score + 1) / 2 * Math.PI 
      : Math.PI / 2;
    
    // Harmonics from technical indicators
    const harmonics: number[] = [];
    if (data.technicals?.rsi) {
      harmonics.push(data.technicals.rsi / 100);
    }
    
    return {
      domain: 'market',
      timestamp: data.timestamp,
      intensity: data.consensus.confidence,
      frequency,
      phase,
      harmonics,
      rawData: prices,
    };
  }

  /**
   * Extract domain signature from multiple signals
   */
  extractSignature(signals: UniversalSignal[]): DomainSignature {
    if (signals.length === 0) {
      return this.getDefaultSignature();
    }

    const latestSignal = signals[signals.length - 1];
    const recentData = this.dataHistory.slice(-20);
    
    // Calculate momentum trend
    const priceChanges = recentData.slice(1).map((d, i) => 
      (d.consensus.price - recentData[i].consensus.price) / recentData[i].consensus.price
    );
    const avgMomentum = priceChanges.length > 0
      ? priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length
      : 0;
    
    // Calculate volatility
    const volatility = priceChanges.length > 0
      ? Math.sqrt(priceChanges.reduce((sum, c) => sum + c * c, 0) / priceChanges.length)
      : 0;
    
    // Calculate confidence from source diversity
    const avgSources = recentData.length > 0
      ? recentData.reduce((sum, d) => sum + d.sources.length, 0) / recentData.length
      : 1;
    const sourceConfidence = Math.min(1, avgSources / 5);
    
    // Determine quadrant profile from market conditions
    const isUptrend = avgMomentum > 0;
    const isVolatile = volatility > 0.01;
    
    return {
      domain: 'market',
      quadrantProfile: {
        aggressive: isUptrend && isVolatile ? 0.8 : 0.3,
        defensive: !isUptrend && !isVolatile ? 0.7 : 0.2,
        tactical: isVolatile ? 0.7 : 0.4,
        strategic: !isVolatile ? 0.6 : 0.3,
      },
      temporalFlow: {
        early: recentData.length < 5 ? 0.8 : 0.3,
        mid: recentData.length >= 5 && recentData.length < 15 ? 0.7 : 0.4,
        late: recentData.length >= 15 ? 0.7 : 0.3,
      },
      intensity: latestSignal.intensity,
      momentum: avgMomentum * 10, // Scale to -1 to 1 range roughly
      volatility,
      dominantFrequency: latestSignal.frequency,
      harmonicResonance: sourceConfidence,
      phaseAlignment: latestSignal.phase / Math.PI,
      extractedAt: Date.now(),
    };
  }

  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'market',
      quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
      temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0.01,
      dominantFrequency: 1,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now(),
    };
  }

  /**
   * Get data history for analysis
   */
  getHistory(): AggregatedMarketData[] {
    return [...this.dataHistory];
  }

  /**
   * Get the most recent aggregated data
   */
  getLatest(): AggregatedMarketData | null {
    return this.dataHistory[this.dataHistory.length - 1] || null;
  }

  /**
   * Calculate cross-source validation score
   */
  calculateValidationScore(): number {
    const latest = this.getLatest();
    if (!latest) return 0;
    
    // Score based on:
    // 1. Number of sources (more = better)
    // 2. Price agreement (lower variance = better)
    // 3. Recency (fresher = better)
    
    const sourceScore = Math.min(1, latest.sources.length / 5);
    const agreementScore = latest.consensus.confidence;
    const recencyScore = Math.max(0, 1 - (Date.now() - latest.timestamp) / 60000);
    
    return (sourceScore * 0.3 + agreementScore * 0.5 + recencyScore * 0.2);
  }
}

// Singleton instance
export const multiBrokerAdapter = new MultiBrokerAdapter();
