/**
 * Multi-Market Scalping Terminal with Real-Time Predictions
 * 
 * Real world market data: Stocks, Bonds, Futures, Commodities, Crypto, Forex
 * Simulated $1000 capital that grows based on prediction accuracy
 * 
 * CEO Testing Dashboard - Alec Arthur Shelton
 * Patent-Pending Technology
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Minus, Activity, Play, Pause, RotateCcw, 
  Zap, CheckCircle, XCircle, Target, Wifi, WifiOff, Globe, DollarSign,
  BarChart3, Clock, Award, Flame, Percent, ChevronDown, ChevronUp, Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { selfEvolvingSystem } from '@/lib/pensent-core/domains/finance/selfEvolvingSystem';

// ============================================
// TYPES
// ============================================

interface MarketSymbol {
  symbol: string;
  name: string;
  category: string;
  is24h: boolean;
}

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

interface Prediction {
  id: string;
  symbol: string;
  category: string;
  direction: 'up' | 'down' | 'flat';
  confidence: number;
  priceAtPrediction: number;
  timestamp: number;
  expiresAt: number;
  betAmount: number;
  resolved?: boolean;
  wasCorrect?: boolean;
  actualPrice?: number;
  actualDirection?: 'up' | 'down' | 'flat';
  pnl?: number;
}

interface PortfolioState {
  balance: number;
  startingBalance: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  bestTrade: number;
  worstTrade: number;
  currentStreak: number;
  bestStreak: number;
  peakBalance: number;
  troughBalance: number;
}

// ============================================
// CONSTANTS
// ============================================

const CATEGORIES = {
  crypto: { name: 'Crypto', icon: '₿', color: 'text-orange-500' },
  stocks: { name: 'Stocks', icon: '📈', color: 'text-blue-500' },
  etfs: { name: 'ETFs', icon: '📊', color: 'text-purple-500' },
  futures: { name: 'Futures', icon: '📉', color: 'text-cyan-500' },
  commodities: { name: 'Commodities', icon: '🛢️', color: 'text-amber-500' },
  bonds: { name: 'Bonds', icon: '🏦', color: 'text-green-500' },
  forex: { name: 'Forex', icon: '💱', color: 'text-pink-500' },
};

const STARTING_BALANCE = 1000;
const PREDICTION_INTERVAL = 8000; // 8 seconds between predictions
const BET_PERCENTAGE = 0.02; // 2% of balance per trade
const WIN_MULTIPLIER = 1.8; // 80% profit on correct predictions
const LOSS_MULTIPLIER = 0; // Lose entire bet on wrong predictions

// ============================================
// PREDICTION ENGINE
// ============================================

interface PriceHistory {
  price: number;
  timestamp: number;
}

const priceHistories: Record<string, PriceHistory[]> = {};

function updatePriceHistory(symbol: string, price: number) {
  if (!priceHistories[symbol]) {
    priceHistories[symbol] = [];
  }
  priceHistories[symbol].push({ price, timestamp: Date.now() });
  // Keep last 100 prices
  if (priceHistories[symbol].length > 100) {
    priceHistories[symbol] = priceHistories[symbol].slice(-100);
  }
}

function predictDirection(symbol: string): { direction: 'up' | 'down' | 'flat'; confidence: number } {
  const history = priceHistories[symbol] || [];
  
  if (history.length < 5) {
    return { direction: Math.random() > 0.5 ? 'up' : 'down', confidence: 52 };
  }
  
  const recent = history.slice(-20);
  const prices = recent.map(h => h.price);
  
  // Calculate momentum
  const shortMA = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const longMA = prices.slice(-15).reduce((a, b) => a + b, 0) / Math.min(15, prices.length);
  
  // Calculate trend strength
  const priceChanges = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
  const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
  
  // Volatility
  const variance = priceChanges.reduce((sum, c) => sum + Math.pow(c - avgChange, 2), 0) / priceChanges.length;
  const volatility = Math.sqrt(variance);
  
  // RSI-like calculation
  const gains = priceChanges.filter(c => c > 0).reduce((a, b) => a + b, 0);
  const losses = Math.abs(priceChanges.filter(c => c < 0).reduce((a, b) => a + b, 0));
  const rs = losses === 0 ? 100 : gains / losses;
  const rsi = 100 - (100 / (1 + rs));
  
  // Combined signal
  let signal = 0;
  signal += (shortMA > longMA ? 1 : -1) * 0.4;
  signal += avgChange * 5000;
  signal += (rsi > 60 ? -0.3 : rsi < 40 ? 0.3 : 0); // Mean reversion component
  
  let direction: 'up' | 'down' | 'flat';
  if (signal > 0.15) direction = 'up';
  else if (signal < -0.15) direction = 'down';
  else direction = Math.random() > 0.5 ? 'up' : 'down';
  
  // Confidence based on signal clarity and volatility
  const signalStrength = Math.min(Math.abs(signal) * 25, 30);
  const volatilityFactor = volatility < 0.01 ? 1.1 : volatility > 0.03 ? 0.85 : 1;
  const confidence = Math.min(88, Math.max(52, 55 + signalStrength) * volatilityFactor);
  
  return { direction, confidence: Math.round(confidence) };
}

function resolveDirection(priceChange: number, symbol: string): 'up' | 'down' | 'flat' {
  // Threshold varies by asset class volatility
  const threshold = symbol.includes('BTC') || symbol.includes('ETH') ? 0.0003 : 0.0001;
  if (priceChange > threshold) return 'up';
  if (priceChange < -threshold) return 'down';
  return 'flat';
}

// ============================================
// DIRECTION ICON
// ============================================

const DirectionIcon: React.FC<{ direction: 'up' | 'down' | 'flat'; size?: number }> = ({ direction, size = 16 }) => {
  if (direction === 'up') return <TrendingUp size={size} className="text-green-500" />;
  if (direction === 'down') return <TrendingDown size={size} className="text-red-500" />;
  return <Minus size={size} className="text-muted-foreground" />;
};

// ============================================
// MAIN COMPONENT
// ============================================

const MultiMarketScalpingTerminal: React.FC = () => {
  // Core state
  const [isRunning, setIsRunning] = useState(true);
  const [activeCategory, setActiveCategory] = useState('crypto');
  const [availableSymbols, setAvailableSymbols] = useState<MarketSymbol[]>([]);
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('crypto');
  const [selectedSymbol, setSelectedSymbol] = useState<MarketSymbol | null>(null);
  const [customBetAmount, setCustomBetAmount] = useState<number>(20); // $20 default bet
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  
  // Portfolio state - will be synced from database
  const [portfolio, setPortfolio] = useState<PortfolioState>({
    balance: STARTING_BALANCE,
    startingBalance: STARTING_BALANCE,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalPnL: 0,
    bestTrade: 0,
    worstTrade: 0,
    currentStreak: 0,
    bestStreak: 0,
    peakBalance: STARTING_BALANCE,
    troughBalance: STARTING_BALANCE,
  });
  
  // Evolution state from selfEvolvingSystem
  const [evolutionSummary, setEvolutionSummary] = useState(selfEvolvingSystem.getEvolutionSummary());
  
  // Refs
  const mountedRef = useRef(true);
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const predictionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load portfolio from database on mount
  useEffect(() => {
    const loadPortfolioFromDB = async () => {
      try {
        // Load portfolio balance
        const { data: portfolioData, error: portfolioError } = await supabase
          .from('portfolio_balance')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (portfolioError && portfolioError.code !== 'PGRST116') {
          console.error('Failed to load portfolio:', portfolioError);
        }
        
        // Load trade history for stats
        const { data: tradesData, error: tradesError } = await supabase
          .from('autonomous_trades')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (tradesError) {
          console.error('Failed to load trades:', tradesError);
        }
        
        // Load evolution state from database
        const { data: evolutionData, error: evolutionError } = await supabase
          .from('evolution_state')
          .select('*')
          .eq('state_type', 'global')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (evolutionError && evolutionError.code !== 'PGRST116') {
          console.error('Failed to load evolution state:', evolutionError);
        }
        
        // Calculate stats from trades
        const closedTrades = tradesData?.filter(t => t.status === 'closed') || [];
        const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
        const losingTrades = closedTrades.filter(t => (t.pnl || 0) <= 0).length;
        const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const bestTrade = closedTrades.reduce((max, t) => Math.max(max, t.pnl || 0), 0);
        const worstTrade = closedTrades.reduce((min, t) => Math.min(min, t.pnl || 0), 0);
        
        // Update portfolio with real data
        if (portfolioData || closedTrades.length > 0) {
          setPortfolio({
            balance: portfolioData?.balance || STARTING_BALANCE,
            startingBalance: STARTING_BALANCE,
            totalTrades: portfolioData?.total_trades || closedTrades.length,
            winningTrades: portfolioData?.winning_trades || winningTrades,
            losingTrades: losingTrades,
            totalPnL: totalPnL,
            bestTrade: bestTrade,
            worstTrade: worstTrade,
            currentStreak: 0, // Would need additional calculation
            bestStreak: 0,
            peakBalance: portfolioData?.peak_balance || STARTING_BALANCE,
            troughBalance: portfolioData?.trough_balance || STARTING_BALANCE,
          });
        }
        
        // Update evolution state if available
        if (evolutionData) {
          const genes = evolutionData.genes as Record<string, number>;
          setEvolutionSummary({
            generation: evolutionData.generation || 0,
            fitness: evolutionData.fitness_score || 0,
            velocity: 0,
            topGenes: Object.entries(genes || {})
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .slice(0, 5)
              .map(([name, value]) => ({ name, value: value as number, impact: (value as number) * 0.1 })),
            patternCount: (evolutionData.learned_patterns as Array<unknown> || []).length,
            bestPatternAccuracy: evolutionData.fitness_score || 0,
            anomalyHarvest: { totalAnomalies: 0, topPatterns: [], recentInsights: [] }
          });
        }
        
      } catch (err) {
        console.error('Error loading portfolio from database:', err);
      } finally {
        setIsLoadingPortfolio(false);
      }
    };
    
    loadPortfolioFromDB();
    
    // Subscribe to real-time updates for evolution and portfolio
    const evolutionChannel = supabase
      .channel('evolution-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'evolution_state' },
        (payload) => {
          const data = payload.new as { 
            generation?: number; 
            fitness_score?: number; 
            genes?: Record<string, number>;
            total_predictions?: number;
            learned_patterns?: unknown[];
          };
          if (data && data.generation) {
            setEvolutionSummary({
              generation: data.generation || 0,
              fitness: data.fitness_score || 0,
              velocity: 0,
              topGenes: Object.entries(data.genes || {})
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .slice(0, 5)
                .map(([name, value]) => ({ name, value: value as number, impact: (value as number) * 0.1 })),
              patternCount: (data.learned_patterns as Array<unknown> || []).length,
              bestPatternAccuracy: data.fitness_score || 0,
              anomalyHarvest: { totalAnomalies: 0, topPatterns: [], recentInsights: [] }
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'portfolio_balance' },
        (payload) => {
          const data = payload.new as {
            balance?: number;
            peak_balance?: number;
            trough_balance?: number;
            total_trades?: number;
            winning_trades?: number;
          };
          if (data && data.balance !== undefined) {
            setPortfolio(prev => ({
              ...prev,
              balance: data.balance || prev.balance,
              peakBalance: data.peak_balance || prev.peakBalance,
              troughBalance: data.trough_balance || prev.troughBalance,
              totalTrades: data.total_trades || prev.totalTrades,
              winningTrades: data.winning_trades || prev.winningTrades,
            }));
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(evolutionChannel);
    };
  }, []);
  
  // Sync portfolio changes to database
  const syncPortfolioToDB = useCallback(async (newPortfolio: PortfolioState) => {
    try {
      await supabase
        .from('portfolio_balance')
        .upsert({
          id: 'a72170ff-70ad-4da2-b54d-dd2c315a2fa6', // Use existing ID
          balance: newPortfolio.balance,
          peak_balance: newPortfolio.peakBalance,
          trough_balance: newPortfolio.troughBalance,
          total_trades: newPortfolio.totalTrades,
          winning_trades: newPortfolio.winningTrades,
          target_balance: 10000,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (err) {
      console.error('Failed to sync portfolio to DB:', err);
    }
  }, []);
  
  // Computed values
  const growthPercent = useMemo(() => 
    ((portfolio.balance - portfolio.startingBalance) / portfolio.startingBalance) * 100,
    [portfolio.balance, portfolio.startingBalance]
  );
  
  const winRate = useMemo(() => 
    portfolio.totalTrades > 0 ? (portfolio.winningTrades / portfolio.totalTrades) * 100 : 0,
    [portfolio.winningTrades, portfolio.totalTrades]
  );
  
  const pendingPredictions = useMemo(() => 
    predictions.filter(p => !p.resolved).slice(-10),
    [predictions]
  );
  
  const recentResolved = useMemo(() => 
    predictions.filter(p => p.resolved).slice(-15).reverse(),
    [predictions]
  );
  
  // Category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; correct: number; pnl: number }> = {};
    
    for (const pred of predictions.filter(p => p.resolved)) {
      if (!stats[pred.category]) {
        stats[pred.category] = { total: 0, correct: 0, pnl: 0 };
      }
      stats[pred.category].total++;
      if (pred.wasCorrect) stats[pred.category].correct++;
      stats[pred.category].pnl += pred.pnl || 0;
    }
    
    return stats;
  }, [predictions]);
  
  // Symbol-specific stats
  const symbolStats = useMemo(() => {
    const stats: Record<string, { total: number; correct: number; pnl: number; history: Prediction[] }> = {};
    
    for (const pred of predictions.filter(p => p.resolved)) {
      if (!stats[pred.symbol]) {
        stats[pred.symbol] = { total: 0, correct: 0, pnl: 0, history: [] };
      }
      stats[pred.symbol].total++;
      if (pred.wasCorrect) stats[pred.symbol].correct++;
      stats[pred.symbol].pnl += pred.pnl || 0;
      stats[pred.symbol].history.push(pred);
    }
    
    return stats;
  }, [predictions]);
  
  // Manual trade on selected symbol
  const executeManualTrade = useCallback((direction: 'up' | 'down') => {
    if (!selectedSymbol || portfolio.balance <= 0 || customBetAmount <= 0) return;
    
    const quote = quotes[selectedSymbol.symbol];
    if (!quote) return;
    
    const betAmount = Math.min(customBetAmount, portfolio.balance);
    const { confidence } = predictDirection(selectedSymbol.symbol);
    
    const prediction: Prediction = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      symbol: selectedSymbol.symbol,
      category: selectedSymbol.category,
      direction,
      confidence,
      priceAtPrediction: quote.price,
      timestamp: Date.now(),
      expiresAt: Date.now() + PREDICTION_INTERVAL,
      betAmount,
    };
    
    setPredictions(prev => [...prev, prediction].slice(-200));
  }, [selectedSymbol, quotes, portfolio.balance, customBetAmount]);

  // Fetch available symbols
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('stock-data', {
          body: { action: 'list' }
        });
        
        if (error) throw error;
        if (data?.symbols) {
          setAvailableSymbols(data.symbols);
        }
      } catch (err) {
        console.error('Failed to fetch symbols:', err);
      }
    };
    
    fetchSymbols();
  }, []);
  
  // Fetch market data
  const fetchMarketData = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      // Get symbols for current category plus all 24/7 markets
      const categorySymbols = availableSymbols.filter(s => s.category === activeCategory);
      const allSymbols = [...new Set([
        ...categorySymbols.map(s => s.symbol),
        ...availableSymbols.filter(s => s.is24h).slice(0, 10).map(s => s.symbol)
      ])];
      
      if (allSymbols.length === 0) return;
      
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { action: 'batch', symbols: allSymbols }
      });
      
      if (error) throw error;
      
      if (data?.quotes) {
        const newQuotes: Record<string, QuoteData> = {};
        for (const quote of data.quotes) {
          newQuotes[quote.symbol] = quote;
          updatePriceHistory(quote.symbol, quote.price);
        }
        setQuotes(prev => ({ ...prev, ...newQuotes }));
        setIsLive(true);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setIsLive(false);
    }
  }, [availableSymbols, activeCategory]);
  
  // Generate prediction
  const generatePrediction = useCallback(() => {
    if (!mountedRef.current || portfolio.balance <= 0) return;
    
    // Select a random symbol from 24/7 markets for continuous predictions
    const tradableSymbols = availableSymbols.filter(s => s.is24h && quotes[s.symbol]);
    if (tradableSymbols.length === 0) return;
    
    const randomSymbol = tradableSymbols[Math.floor(Math.random() * tradableSymbols.length)];
    const quote = quotes[randomSymbol.symbol];
    if (!quote) return;
    
    const { direction, confidence } = predictDirection(randomSymbol.symbol);
    const betAmount = Math.max(1, Math.round(portfolio.balance * BET_PERCENTAGE * 100) / 100);
    
    const prediction: Prediction = {
      id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      symbol: randomSymbol.symbol,
      category: randomSymbol.category,
      direction,
      confidence,
      priceAtPrediction: quote.price,
      timestamp: Date.now(),
      expiresAt: Date.now() + PREDICTION_INTERVAL,
      betAmount,
    };
    
    setPredictions(prev => [...prev, prediction].slice(-200));
  }, [availableSymbols, quotes, portfolio.balance]);
  
  // Resolve predictions
  const resolvePredictions = useCallback(() => {
    if (!mountedRef.current) return;
    
    const now = Date.now();
    let portfolioUpdates = { ...portfolio };
    
    setPredictions(prev => prev.map(pred => {
      if (pred.resolved || pred.expiresAt > now) return pred;
      
      const currentQuote = quotes[pred.symbol];
      if (!currentQuote) return pred;
      
      const priceChange = (currentQuote.price - pred.priceAtPrediction) / pred.priceAtPrediction;
      const actualDirection = resolveDirection(priceChange, pred.symbol);
      
      // Determine if prediction was correct
      const wasCorrect = pred.direction === actualDirection || 
        (pred.direction === 'flat' && Math.abs(priceChange) < 0.0002);
      
      // ========================================
      // FEED OUTCOME TO SELF-EVOLVING SYSTEM
      // ========================================
      // Map 'flat' to 'neutral' for the evolution system
      const mapDirection = (dir: 'up' | 'down' | 'flat'): 'up' | 'down' | 'neutral' => 
        dir === 'flat' ? 'neutral' : dir;
      
      selfEvolvingSystem.processOutcome({
        predicted: mapDirection(pred.direction),
        actual: mapDirection(actualDirection),
        confidence: pred.confidence / 100,
        marketConditions: {
          correlationStrength: Math.abs(priceChange) * 100, // Derive from price movement
          volatility: Math.abs(priceChange),
          momentum: priceChange > 0 ? 1 : priceChange < 0 ? -1 : 0,
          leadingSignals: pred.confidence / 100
        }
      });
      
      // Update evolution summary
      setEvolutionSummary(selfEvolvingSystem.getEvolutionSummary());
      
      // Update correlation memory for cross-market learning
      if (pred.category) {
        selfEvolvingSystem.updateCorrelationMemory(pred.symbol, pred.category, priceChange);
      }
      
      // Calculate P&L
      let pnl = 0;
      if (wasCorrect) {
        pnl = pred.betAmount * (WIN_MULTIPLIER - 1);
        portfolioUpdates.balance += pnl;
        portfolioUpdates.winningTrades++;
        portfolioUpdates.currentStreak++;
        portfolioUpdates.bestStreak = Math.max(portfolioUpdates.bestStreak, portfolioUpdates.currentStreak);
        portfolioUpdates.bestTrade = Math.max(portfolioUpdates.bestTrade, pnl);
      } else {
        pnl = -pred.betAmount;
        portfolioUpdates.balance += pnl;
        portfolioUpdates.losingTrades++;
        portfolioUpdates.currentStreak = 0;
        portfolioUpdates.worstTrade = Math.min(portfolioUpdates.worstTrade, pnl);
      }
      
      portfolioUpdates.totalTrades++;
      portfolioUpdates.totalPnL += pnl;
      portfolioUpdates.peakBalance = Math.max(portfolioUpdates.peakBalance, portfolioUpdates.balance);
      portfolioUpdates.troughBalance = Math.min(portfolioUpdates.troughBalance, portfolioUpdates.balance);
      
      return {
        ...pred,
        resolved: true,
        wasCorrect,
        actualPrice: currentQuote.price,
        actualDirection,
        pnl,
      };
    }));
    
    setPortfolio(portfolioUpdates);
    
    // Sync to database if there were any updates
    if (portfolioUpdates.totalTrades !== portfolio.totalTrades) {
      syncPortfolioToDB(portfolioUpdates);
    }
  }, [quotes, portfolio, syncPortfolioToDB]);
  
  // Main effect - data fetching and prediction loop
  useEffect(() => {
    mountedRef.current = true;
    
    if (isRunning && availableSymbols.length > 0) {
      fetchMarketData();
      
      fetchIntervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          fetchMarketData();
          resolvePredictions();
        }
      }, 2000);
      
      predictionIntervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          generatePrediction();
        }
      }, PREDICTION_INTERVAL);
    }
    
    return () => {
      mountedRef.current = false;
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
      if (predictionIntervalRef.current) clearInterval(predictionIntervalRef.current);
    };
  }, [isRunning, availableSymbols.length, activeCategory]);
  
  // Reset function
  const handleReset = useCallback(() => {
    setPredictions([]);
    setPortfolio({
      balance: STARTING_BALANCE,
      startingBalance: STARTING_BALANCE,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalPnL: 0,
      bestTrade: 0,
      worstTrade: 0,
      currentStreak: 0,
      bestStreak: 0,
      peakBalance: STARTING_BALANCE,
      troughBalance: STARTING_BALANCE,
    });
    // Clear price histories
    for (const key in priceHistories) {
      delete priceHistories[key];
    }
  }, []);
  
  // Format helpers
  const formatPrice = (price: number, symbol: string) => {
    if (symbol.includes('JPY') || symbol.includes('=X')) {
      return price.toFixed(4);
    }
    if (symbol.includes('BTC')) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };
  
  const formatMoney = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Multi-Market Prediction Engine</h1>
            <p className="text-sm text-muted-foreground">
              Real-time predictions across Stocks, Bonds, Futures, Commodities & Crypto
            </p>
          </div>
          <Badge variant={isLive ? "default" : "destructive"} className="ml-2">
            {isLive ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {isLive ? 'LIVE' : 'OFFLINE'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset $1000
          </Button>
        </div>
      </div>
      
      {/* Portfolio Overview */}
      <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Balance */}
            <div className="col-span-2">
              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Simulated Balance
              </div>
              <div className="text-4xl font-mono font-bold">
                ${portfolio.balance.toFixed(2)}
              </div>
              <div className={cn(
                "text-lg font-semibold flex items-center gap-1",
                growthPercent >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {growthPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(2)}%
                <span className="text-sm text-muted-foreground ml-1">
                  ({formatMoney(portfolio.totalPnL)})
                </span>
              </div>
            </div>
            
            {/* Win Rate */}
            <div>
              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Win Rate
              </div>
              <div className={cn(
                "text-2xl font-bold",
                winRate >= 55 ? "text-green-500" : winRate >= 45 ? "text-yellow-500" : "text-red-500"
              )}>
                {winRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {portfolio.winningTrades}W / {portfolio.losingTrades}L
              </div>
            </div>
            
            {/* Total Trades */}
            <div>
              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Trades
              </div>
              <div className="text-2xl font-bold text-primary">
                {portfolio.totalTrades}
              </div>
              <div className="text-xs text-muted-foreground">
                2% per trade
              </div>
            </div>
            
            {/* Streak */}
            <div>
              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Streak
              </div>
              <div className="text-2xl font-bold text-orange-500">
                {portfolio.currentStreak}
              </div>
              <div className="text-xs text-muted-foreground">
                Best: {portfolio.bestStreak}
              </div>
            </div>
            
            {/* Peak/Trough */}
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Peak / Trough
              </div>
              <div className="text-lg font-semibold text-green-500">
                ${portfolio.peakBalance.toFixed(0)}
              </div>
              <div className="text-sm font-medium text-red-500">
                ${portfolio.troughBalance.toFixed(0)}
              </div>
            </div>
          </div>
          
          {/* Growth Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Starting: $1,000</span>
              <span>Target: $2,000 (100% growth)</span>
            </div>
            <Progress 
              value={Math.min(100, Math.max(0, growthPercent))} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Self-Evolving AI Status */}
      <Card className="border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 to-purple-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            En Pensent Self-Evolving AI
            <Badge variant="outline" className="ml-auto text-xs">
              Gen {evolutionSummary.generation}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Fitness</div>
              <div className="text-lg font-bold text-cyan-400">
                {(evolutionSummary.fitness * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Learning Velocity</div>
              <div className={cn(
                "text-lg font-bold",
                evolutionSummary.velocity > 0 ? "text-green-400" : "text-red-400"
              )}>
                {evolutionSummary.velocity > 0 ? '+' : ''}{(evolutionSummary.velocity * 100).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Learned Patterns</div>
              <div className="text-lg font-bold text-purple-400">
                {evolutionSummary.patternCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Best Pattern Accuracy</div>
              <div className="text-lg font-bold text-amber-400">
                {(evolutionSummary.bestPatternAccuracy * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Top Gene</div>
              {evolutionSummary.topGenes[0] && (
                <div className="text-sm font-medium text-muted-foreground">
                  {evolutionSummary.topGenes[0].name}: {evolutionSummary.topGenes[0].value.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid grid-cols-7 w-full">
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <TabsTrigger key={key} value={key} className="text-xs">
              <span className="mr-1">{cat.icon}</span>
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {Object.keys(CATEGORIES).map(category => (
          <TabsContent key={category} value={category} className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {availableSymbols
                .filter(s => s.category === category)
                .map(symbol => {
                  const quote = quotes[symbol.symbol];
                  const stats = symbolStats[symbol.symbol];
                  const isSelected = selectedSymbol?.symbol === symbol.symbol;
                  const accuracy = stats && stats.total > 0 ? (stats.correct / stats.total) * 100 : null;
                  
                  return (
                    <Card 
                      key={symbol.symbol} 
                      className={cn(
                        "bg-card/50 cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/50",
                        isSelected && "ring-2 ring-primary border-primary"
                      )}
                      onClick={() => setSelectedSymbol(isSelected ? null : symbol)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-medium text-sm">{symbol.symbol}</span>
                          {symbol.is24h && (
                            <Badge variant="outline" className="text-xs">
                              <Globe className="w-2 h-2 mr-1" />
                              24/7
                            </Badge>
                          )}
                        </div>
                        <div className="text-lg font-bold">
                          {quote ? formatPrice(quote.price, symbol.symbol) : '—'}
                        </div>
                        {quote && (
                          <div className={cn(
                            "text-xs",
                            quote.changePercent >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {symbol.name}
                        </div>
                        {/* Show accuracy if we have trades */}
                        {accuracy !== null && (
                          <div className={cn(
                            "text-xs font-semibold mt-2 pt-2 border-t border-border/50",
                            accuracy >= 55 ? "text-green-500" : accuracy >= 45 ? "text-yellow-500" : "text-red-500"
                          )}>
                            {accuracy.toFixed(0)}% accuracy • {stats.total} trades
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Selected Symbol Trading Panel */}
      <AnimatePresence>
        {selectedSymbol && quotes[selectedSymbol.symbol] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary" />
                    Trade {selectedSymbol.symbol}
                    <Badge>{selectedSymbol.name}</Badge>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSymbol(null)}>
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Live Price & Prediction */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Live Price</div>
                      <div className="text-3xl font-mono font-bold">
                        {formatPrice(quotes[selectedSymbol.symbol].price, selectedSymbol.symbol)}
                      </div>
                      <div className={cn(
                        "text-sm font-medium",
                        quotes[selectedSymbol.symbol].changePercent >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {quotes[selectedSymbol.symbol].changePercent >= 0 ? '+' : ''}
                        {quotes[selectedSymbol.symbol].changePercent.toFixed(3)}%
                      </div>
                    </div>
                    
                    {/* AI Prediction */}
                    {(() => {
                      const pred = predictDirection(selectedSymbol.symbol);
                      return (
                        <div className="p-3 rounded-lg bg-card border">
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            AI Prediction
                          </div>
                          <div className="flex items-center gap-2">
                            <DirectionIcon direction={pred.direction} size={24} />
                            <span className="text-xl font-bold capitalize">{pred.direction}</span>
                            <Badge variant="outline" className="ml-auto">
                              {pred.confidence}% confidence
                            </Badge>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Trade Controls */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Bet Amount ($)</div>
                      <div className="flex gap-2">
                        {[10, 20, 50, 100].map(amount => (
                          <Button
                            key={amount}
                            variant={customBetAmount === amount ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCustomBetAmount(amount)}
                            disabled={amount > portfolio.balance}
                          >
                            ${amount}
                          </Button>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Available: ${portfolio.balance.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => executeManualTrade('up')}
                        disabled={portfolio.balance < customBetAmount}
                      >
                        <TrendingUp className="w-5 h-5 mr-2" />
                        LONG
                      </Button>
                      <Button
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => executeManualTrade('down')}
                        disabled={portfolio.balance < customBetAmount}
                      >
                        <TrendingDown className="w-5 h-5 mr-2" />
                        SHORT
                      </Button>
                    </div>
                    
                    <div className="text-xs text-center text-muted-foreground">
                      Win: +{((WIN_MULTIPLIER - 1) * 100).toFixed(0)}% • Resolves in {PREDICTION_INTERVAL / 1000}s
                    </div>
                  </div>
                  
                  {/* Symbol Stats */}
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">Your {selectedSymbol.symbol} History</div>
                    {symbolStats[selectedSymbol.symbol] ? (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded bg-card border">
                            <div className="text-lg font-bold">
                              {symbolStats[selectedSymbol.symbol].total}
                            </div>
                            <div className="text-xs text-muted-foreground">Trades</div>
                          </div>
                          <div className="p-2 rounded bg-card border">
                            <div className={cn(
                              "text-lg font-bold",
                              (symbolStats[selectedSymbol.symbol].correct / symbolStats[selectedSymbol.symbol].total) >= 0.55 
                                ? "text-green-500" : "text-red-500"
                            )}>
                              {((symbolStats[selectedSymbol.symbol].correct / symbolStats[selectedSymbol.symbol].total) * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Accuracy</div>
                          </div>
                          <div className="p-2 rounded bg-card border">
                            <div className={cn(
                              "text-lg font-bold",
                              symbolStats[selectedSymbol.symbol].pnl >= 0 ? "text-green-500" : "text-red-500"
                            )}>
                              {formatMoney(symbolStats[selectedSymbol.symbol].pnl)}
                            </div>
                            <div className="text-xs text-muted-foreground">P&L</div>
                          </div>
                        </div>
                        
                        {/* Recent trades for this symbol */}
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {symbolStats[selectedSymbol.symbol].history.slice(-5).reverse().map(trade => (
                            <div key={trade.id} className="flex items-center justify-between text-xs p-1 rounded bg-card/50">
                              <div className="flex items-center gap-1">
                                {trade.wasCorrect ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-500" />
                                )}
                                <DirectionIcon direction={trade.direction} size={12} />
                              </div>
                              <span className={cn(
                                "font-mono",
                                (trade.pnl || 0) >= 0 ? "text-green-500" : "text-red-500"
                              )}>
                                {formatMoney(trade.pnl || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        No trades yet on {selectedSymbol.symbol}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Category Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5" />
            Category Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(CATEGORIES).map(([key, cat]) => {
              const stats = categoryStats[key] || { total: 0, correct: 0, pnl: 0 };
              const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
              return (
                <div key={key} className="text-center p-3 rounded-lg bg-card/50 border">
                  <div className={cn("text-lg mb-1", cat.color)}>{cat.icon}</div>
                  <div className="text-xs font-medium mb-2">{cat.name}</div>
                  <div className={cn(
                    "text-xl font-bold",
                    accuracy >= 55 ? "text-green-500" : accuracy >= 45 ? "text-yellow-500" : stats.total === 0 ? "text-muted-foreground" : "text-red-500"
                  )}>
                    {stats.total > 0 ? `${accuracy.toFixed(0)}%` : '—'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stats.total} trades
                  </div>
                  <div className={cn(
                    "text-xs font-medium",
                    stats.pnl >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {stats.total > 0 ? formatMoney(stats.pnl) : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Predictions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Predictions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Pending Predictions ({pendingPredictions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {pendingPredictions.map(pred => {
                  const timeLeft = Math.max(0, pred.expiresAt - Date.now());
                  const progress = ((PREDICTION_INTERVAL - timeLeft) / PREDICTION_INTERVAL) * 100;
                  const currentQuote = quotes[pred.symbol];
                  const currentChange = currentQuote 
                    ? ((currentQuote.price - pred.priceAtPrediction) / pred.priceAtPrediction) * 100 
                    : 0;
                  
                  return (
                    <motion.div
                      key={pred.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-3 rounded-lg bg-card/50 border border-yellow-500/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{pred.symbol}</span>
                          <DirectionIcon direction={pred.direction} />
                          <Badge variant="outline" className="text-xs">
                            {pred.confidence}%
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${pred.betAmount.toFixed(2)} bet
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Entry: {formatPrice(pred.priceAtPrediction, pred.symbol)}
                        </span>
                        <span className={cn(
                          "font-medium",
                          currentChange >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {currentChange >= 0 ? '+' : ''}{currentChange.toFixed(3)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-1 mt-2" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {pendingPredictions.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Generating predictions...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Resolved Predictions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {recentResolved.map(pred => (
                  <motion.div
                    key={pred.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "p-3 rounded-lg border",
                      pred.wasCorrect 
                        ? "bg-green-500/5 border-green-500/30" 
                        : "bg-red-500/5 border-red-500/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {pred.wasCorrect ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-mono text-sm">{pred.symbol}</span>
                        <DirectionIcon direction={pred.direction} size={14} />
                        <span className="text-xs text-muted-foreground">→</span>
                        <DirectionIcon direction={pred.actualDirection || 'flat'} size={14} />
                      </div>
                      <div className={cn(
                        "font-mono font-medium text-sm",
                        (pred.pnl || 0) >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {formatMoney(pred.pnl || 0)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>
                        {formatPrice(pred.priceAtPrediction, pred.symbol)} → {formatPrice(pred.actualPrice || 0, pred.symbol)}
                      </span>
                      <span>{pred.confidence}% conf</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {recentResolved.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No resolved predictions yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t">
        <p>Multi-Market Prediction Engine • Patent-Pending Technology</p>
        <p className="mt-1">Invented by Alec Arthur Shelton "The Artist" • CEO</p>
        {lastUpdate && (
          <p className="mt-1">Last updated: {lastUpdate.toLocaleTimeString()}</p>
        )}
      </div>
    </div>
  );
};

export default MultiMarketScalpingTerminal;
