/**
 * En Pensent Trading Signals Integration
 * Connects 55-adapter universal engine to IBKR trading decisions
 * 
 * For Alec Arthur Shelton - The Artist
 */

import { useState, useEffect, useCallback } from 'react';
import { unifiedLiveCoordinator } from '../lib/pensent-core/unifiedLiveCoordinator';
import { meteorologicalDataFeed } from '../lib/pensent-core/domains/universal/adapters/meteorologicalFeed';
import { sportsDataFeed } from '../lib/pensent-core/domains/universal/adapters/sportsFeed';
import { astronomicalDataFeed } from '../lib/pensent-core/domains/universal/adapters/astronomicalFeed';

export interface TradingSignal {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  source: string;
  reasoning: string;
  timestamp: number;
  domains: string[];
}

interface CrossDomainInsight {
  type: string;
  domains: string[];
  strength: number;
  description: string;
  timestamp: number;
}

export interface EnPensentTradingState {
  signals: TradingSignal[];
  activeDomains: string[];
  insights: string[];
  isRunning: boolean;
  lastUpdate: number;
}

export function useEnPensentTrading() {
  const [state, setState] = useState<EnPensentTradingState>({
    signals: [],
    activeDomains: [],
    insights: [],
    isRunning: false,
    lastUpdate: 0
  });

  // Generate trading signals from cross-domain insights
  const generateSignals = useCallback((insights: string[]): TradingSignal[] => {
    const signals: TradingSignal[] = [];
    
    // Generate signals based on active domains
    insights.forEach((insight, index) => {
      if (insight.includes('meteorological')) {
        signals.push({
          id: `weather-${index}`,
          symbol: 'XLE',
          direction: 'HOLD',
          confidence: 0.5,
          source: 'Weather-Energy Correlation',
          reasoning: insight,
          timestamp: Date.now(),
          domains: ['meteorological', 'economicCircuitry']
        });
      }
      
      if (insight.includes('sports')) {
        signals.push({
          id: `sports-${index}`,
          symbol: 'DIS',
          direction: 'HOLD',
          confidence: 0.5,
          source: 'Sports Sentiment Analysis',
          reasoning: insight,
          timestamp: Date.now(),
          domains: ['sports', 'market']
        });
      }
    });
    
    return signals; // No fake fallback signals
  }, []);

  // Start En Pensent engine integration
  const start = useCallback(async () => {
    try {
      // Get coordinator status
      const status = unifiedLiveCoordinator.getStatus();
      
      setState(prev => ({
        ...prev,
        isRunning: status.isRunning,
        activeDomains: status.activeFeeds,
        insights: status.insights,
        signals: generateSignals(status.insights),
        lastUpdate: Date.now()
      }));
      
      // Subscribe to real-time updates
      const interval = setInterval(() => {
        const currentStatus = unifiedLiveCoordinator.getStatus();
        setState({
          signals: generateSignals(currentStatus.insights),
          activeDomains: currentStatus.activeFeeds,
          insights: currentStatus.insights,
          isRunning: currentStatus.isRunning,
          lastUpdate: Date.now()
        });
      }, 30000); // Update every 30 seconds
      
      return () => clearInterval(interval);
    } catch (error) {
      console.error('[EnPensentTrading] Failed to start:', error);
    }
  }, [generateSignals]);

  // Get signal for specific symbol
  const getSignalForSymbol = useCallback((symbol: string): TradingSignal | undefined => {
    return state.signals.find(s => s.symbol === symbol);
  }, [state.signals]);

  // Get domain influence score (0-1)
  const getDomainInfluence = useCallback((domain: string): number => {
    // Check if any insight mentions this domain
    const relevantInsights = state.insights.filter(i => i.includes(domain));
    if (relevantInsights.length === 0) return 0;
    return relevantInsights.length / state.insights.length;
  }, [state.insights]);

  return {
    ...state,
    start,
    getSignalForSymbol,
    getDomainInfluence
  };
}

// No mock signals — when live feeds are unavailable, return empty array
export function generateMockSignals(): TradingSignal[] {
  return [];
}
