/**
 * Global Trading Session Store
 * Persistent session management with live P&L tracking and global accuracy
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { selfEvolvingSystem, EvolutionState } from '@/lib/pensent-core/domains/finance/selfEvolvingSystem';

export interface TradingSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  startingBalance: number;
  currentBalance: number;
  peakBalance: number;
  troughBalance: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnl: number;
  bestTrade: number;
  worstTrade: number;
  predictions: number;
  correctPredictions: number;
  status: 'active' | 'paused' | 'completed';
}

export interface GlobalAccuracy {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  directionAccuracy: number;
  magnitudeAccuracy: number;
  timingAccuracy: number;
  confidenceCalibration: number;
  streak: number;
  bestStreak: number;
  worstStreak: number;
  currentStreak: number;
  lastUpdated: number;
}

export interface TradeRecord {
  id: string;
  sessionId: string;
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice?: number;
  entryTime: number;
  exitTime?: number;
  shares: number;
  pnl?: number;
  pnlPercent?: number;
  status: 'open' | 'closed';
  predictionId?: string;
  correlatedMoves: { symbol: string; pnl: number }[];
}

interface TradingSessionState {
  // Current session
  currentSession: TradingSession | null;
  sessionHistory: TradingSession[];
  
  // Active trades
  activeTrades: TradeRecord[];
  tradeHistory: TradeRecord[];
  
  // Global accuracy (persists across sessions)
  globalAccuracy: GlobalAccuracy;
  
  // Evolution state
  evolutionState: EvolutionState;
  
  // Live metrics
  liveMetrics: {
    ticksProcessed: number;
    predictionsMade: number;
    lastPredictionTime: number;
    currentSymbol: string;
    isStreaming: boolean;
  };
  
  // Actions
  startSession: (startingBalance?: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  
  // Trading actions
  openTrade: (trade: Omit<TradeRecord, 'id' | 'sessionId' | 'status' | 'correlatedMoves'>) => TradeRecord;
  closeTrade: (tradeId: string, exitPrice: number) => TradeRecord | null;
  updateTradePrice: (tradeId: string, currentPrice: number, correlatedPrices: Map<string, number>) => void;
  
  // Prediction tracking
  recordPrediction: (prediction: {
    predicted: 'up' | 'down' | 'neutral';
    actual: 'up' | 'down' | 'neutral';
    confidence: number;
    directionCorrect: boolean;
    magnitudeAccuracy: number;
    timingAccuracy: number;
    marketConditions: {
      correlationStrength: number;
      volatility: number;
      momentum: number;
      leadingSignals: number;
    };
  }) => void;
  
  // Metrics
  updateLiveMetrics: (metrics: Partial<TradingSessionState['liveMetrics']>) => void;
  
  // Evolution sync
  syncEvolutionState: () => void;
  
  // Stats
  getSessionStats: () => {
    totalGrowth: number;
    growthPercent: number;
    winRate: number;
    avgTradePnl: number;
    sessionDuration: number;
  };
  
  getAllTimeStats: () => {
    totalSessions: number;
    totalTrades: number;
    totalPnl: number;
    overallWinRate: number;
    bestSession: number;
    avgSessionGrowth: number;
  };
  
  // Reset
  resetSession: () => void;
  resetAllData: () => void;
}

const DEFAULT_STARTING_BALANCE = 1000;

const createDefaultGlobalAccuracy = (): GlobalAccuracy => ({
  totalPredictions: 0,
  correctPredictions: 0,
  accuracy: 0,
  directionAccuracy: 0,
  magnitudeAccuracy: 0,
  timingAccuracy: 0,
  confidenceCalibration: 0,
  streak: 0,
  bestStreak: 0,
  worstStreak: 0,
  currentStreak: 0,
  lastUpdated: Date.now()
});

export const useTradingSessionStore = create<TradingSessionState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      sessionHistory: [],
      activeTrades: [],
      tradeHistory: [],
      globalAccuracy: createDefaultGlobalAccuracy(),
      evolutionState: selfEvolvingSystem.getState(),
      liveMetrics: {
        ticksProcessed: 0,
        predictionsMade: 0,
        lastPredictionTime: 0,
        currentSymbol: 'SPY',
        isStreaming: false
      },
      
      startSession: (startingBalance = DEFAULT_STARTING_BALANCE) => {
        const existingSession = get().currentSession;
        
        // v7.51-UNIFIED: If session exists and is active/paused, just resume it - NEVER reset
        if (existingSession && existingSession.status !== 'completed') {
          set(state => ({
            currentSession: {
              ...existingSession,
              status: 'active'
            },
            liveMetrics: {
              ...state.liveMetrics,
              isStreaming: true
            }
          }));
          return;
        }
        
        // Create new session with provided balance (preserves progress when continuing)
        const session: TradingSession = {
          id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          startedAt: Date.now(),
          startingBalance,
          currentBalance: startingBalance,
          peakBalance: startingBalance,
          troughBalance: startingBalance,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          totalPnl: 0,
          bestTrade: 0,
          worstTrade: 0,
          predictions: 0,
          correctPredictions: 0,
          status: 'active'
        };
        
        set({ 
          currentSession: session, 
          activeTrades: [],
          liveMetrics: {
            ...get().liveMetrics,
            isStreaming: true
          }
        });
      },
      
      pauseSession: () => {
        set(state => ({
          currentSession: state.currentSession ? {
            ...state.currentSession,
            status: 'paused'
          } : null,
          liveMetrics: {
            ...state.liveMetrics,
            isStreaming: false
          }
        }));
      },
      
      resumeSession: () => {
        set(state => ({
          currentSession: state.currentSession ? {
            ...state.currentSession,
            status: 'active'
          } : null,
          liveMetrics: {
            ...state.liveMetrics,
            isStreaming: true
          }
        }));
      },
      
      endSession: () => {
        const { currentSession, activeTrades } = get();
        if (!currentSession) return;
        
        // Close all open trades at current prices
        const closedTrades = activeTrades.map(t => ({
          ...t,
          status: 'closed' as const,
          exitTime: Date.now()
        }));
        
        const completedSession: TradingSession = {
          ...currentSession,
          endedAt: Date.now(),
          status: 'completed'
        };
        
        set(state => ({
          currentSession: null,
          sessionHistory: [completedSession, ...state.sessionHistory].slice(0, 100),
          activeTrades: [],
          tradeHistory: [...closedTrades, ...state.tradeHistory].slice(0, 1000),
          liveMetrics: {
            ...state.liveMetrics,
            isStreaming: false
          }
        }));
      },
      
      openTrade: (trade) => {
        const { currentSession } = get();
        if (!currentSession) {
          get().startSession();
        }
        
        const newTrade: TradeRecord = {
          ...trade,
          id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sessionId: get().currentSession?.id || 'unknown',
          status: 'open',
          correlatedMoves: []
        };
        
        set(state => ({
          activeTrades: [...state.activeTrades, newTrade],
          currentSession: state.currentSession ? {
            ...state.currentSession,
            totalTrades: state.currentSession.totalTrades + 1
          } : null
        }));
        
        return newTrade;
      },
      
      closeTrade: (tradeId, exitPrice) => {
        const { activeTrades, currentSession } = get();
        const trade = activeTrades.find(t => t.id === tradeId);
        if (!trade || !currentSession) return null;
        
        const pnl = trade.direction === 'long'
          ? (exitPrice - trade.entryPrice) * trade.shares
          : (trade.entryPrice - exitPrice) * trade.shares;
        const pnlPercent = (pnl / (trade.entryPrice * trade.shares)) * 100;
        
        const closedTrade: TradeRecord = {
          ...trade,
          exitPrice,
          exitTime: Date.now(),
          pnl,
          pnlPercent,
          status: 'closed'
        };
        
        const isWin = pnl > 0;
        const newBalance = currentSession.currentBalance + pnl;
        
        set(state => ({
          activeTrades: state.activeTrades.filter(t => t.id !== tradeId),
          tradeHistory: [closedTrade, ...state.tradeHistory].slice(0, 1000),
          currentSession: state.currentSession ? {
            ...state.currentSession,
            currentBalance: newBalance,
            peakBalance: Math.max(state.currentSession.peakBalance, newBalance),
            troughBalance: Math.min(state.currentSession.troughBalance, newBalance),
            totalPnl: state.currentSession.totalPnl + pnl,
            winningTrades: state.currentSession.winningTrades + (isWin ? 1 : 0),
            losingTrades: state.currentSession.losingTrades + (isWin ? 0 : 1),
            bestTrade: Math.max(state.currentSession.bestTrade, pnl),
            worstTrade: Math.min(state.currentSession.worstTrade, pnl)
          } : null
        }));
        
        return closedTrade;
      },
      
      updateTradePrice: (tradeId, currentPrice, correlatedPrices) => {
        set(state => ({
          activeTrades: state.activeTrades.map(trade => {
            if (trade.id !== tradeId) return trade;
            
            const pnl = trade.direction === 'long'
              ? (currentPrice - trade.entryPrice) * trade.shares
              : (trade.entryPrice - currentPrice) * trade.shares;
            
            const correlatedMoves = Array.from(correlatedPrices.entries()).map(([symbol, price]) => ({
              symbol,
              pnl: ((price - trade.entryPrice) / trade.entryPrice) * (trade.entryPrice * trade.shares)
            }));
            
            return {
              ...trade,
              pnl,
              pnlPercent: (pnl / (trade.entryPrice * trade.shares)) * 100,
              correlatedMoves
            };
          }),
          currentSession: state.currentSession ? {
            ...state.currentSession,
            currentBalance: state.currentSession.startingBalance + 
              state.activeTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) +
              state.currentSession.totalPnl
          } : null
        }));
      },
      
      recordPrediction: (prediction) => {
        // Update self-evolving system
        selfEvolvingSystem.processOutcome({
          predicted: prediction.predicted,
          actual: prediction.actual,
          confidence: prediction.confidence,
          marketConditions: prediction.marketConditions
        });
        
        // Update global accuracy
        set(state => {
          const isCorrect = prediction.directionCorrect;
          const newStreak = isCorrect 
            ? (state.globalAccuracy.currentStreak >= 0 ? state.globalAccuracy.currentStreak + 1 : 1)
            : (state.globalAccuracy.currentStreak <= 0 ? state.globalAccuracy.currentStreak - 1 : -1);
          
          const totalPredictions = state.globalAccuracy.totalPredictions + 1;
          const correctPredictions = state.globalAccuracy.correctPredictions + (isCorrect ? 1 : 0);
          
          // Exponential moving averages for multi-level accuracy
          const alpha = 0.1;
          const directionAccuracy = state.globalAccuracy.directionAccuracy * (1 - alpha) + 
            (isCorrect ? 1 : 0) * alpha;
          const magnitudeAccuracy = state.globalAccuracy.magnitudeAccuracy * (1 - alpha) + 
            prediction.magnitudeAccuracy * alpha;
          const timingAccuracy = state.globalAccuracy.timingAccuracy * (1 - alpha) + 
            prediction.timingAccuracy * alpha;
          const confidenceCalibration = state.globalAccuracy.confidenceCalibration * (1 - alpha) + 
            (1 - Math.abs(prediction.confidence - (isCorrect ? 1 : 0))) * alpha;
          
          return {
            globalAccuracy: {
              totalPredictions,
              correctPredictions,
              accuracy: (correctPredictions / totalPredictions) * 100,
              directionAccuracy: directionAccuracy * 100,
              magnitudeAccuracy: magnitudeAccuracy * 100,
              timingAccuracy: timingAccuracy * 100,
              confidenceCalibration: confidenceCalibration * 100,
              streak: state.globalAccuracy.streak + (isCorrect ? 1 : -1),
              bestStreak: Math.max(state.globalAccuracy.bestStreak, newStreak),
              worstStreak: Math.min(state.globalAccuracy.worstStreak, newStreak),
              currentStreak: newStreak,
              lastUpdated: Date.now()
            },
            evolutionState: selfEvolvingSystem.getState(),
            currentSession: state.currentSession ? {
              ...state.currentSession,
              predictions: state.currentSession.predictions + 1,
              correctPredictions: state.currentSession.correctPredictions + (isCorrect ? 1 : 0)
            } : null,
            liveMetrics: {
              ...state.liveMetrics,
              predictionsMade: state.liveMetrics.predictionsMade + 1,
              lastPredictionTime: Date.now()
            }
          };
        });
      },
      
      updateLiveMetrics: (metrics) => {
        set(state => ({
          liveMetrics: {
            ...state.liveMetrics,
            ...metrics
          }
        }));
      },
      
      syncEvolutionState: () => {
        set({ evolutionState: selfEvolvingSystem.getState() });
      },
      
      getSessionStats: () => {
        const { currentSession } = get();
        if (!currentSession) {
          return {
            totalGrowth: 0,
            growthPercent: 0,
            winRate: 0,
            avgTradePnl: 0,
            sessionDuration: 0
          };
        }
        
        const growth = currentSession.currentBalance - currentSession.startingBalance;
        const completedTrades = currentSession.winningTrades + currentSession.losingTrades;
        
        return {
          totalGrowth: growth,
          growthPercent: (growth / currentSession.startingBalance) * 100,
          winRate: completedTrades > 0 ? (currentSession.winningTrades / completedTrades) * 100 : 0,
          avgTradePnl: completedTrades > 0 ? currentSession.totalPnl / completedTrades : 0,
          sessionDuration: Date.now() - currentSession.startedAt
        };
      },
      
      getAllTimeStats: () => {
        const { sessionHistory, currentSession } = get();
        const allSessions = currentSession 
          ? [currentSession, ...sessionHistory] 
          : sessionHistory;
        
        if (allSessions.length === 0) {
          return {
            totalSessions: 0,
            totalTrades: 0,
            totalPnl: 0,
            overallWinRate: 0,
            bestSession: 0,
            avgSessionGrowth: 0
          };
        }
        
        const totalTrades = allSessions.reduce((sum, s) => sum + s.totalTrades, 0);
        const totalWins = allSessions.reduce((sum, s) => sum + s.winningTrades, 0);
        const totalPnl = allSessions.reduce((sum, s) => sum + s.totalPnl, 0);
        const growths = allSessions.map(s => s.currentBalance - s.startingBalance);
        
        return {
          totalSessions: allSessions.length,
          totalTrades,
          totalPnl,
          overallWinRate: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
          bestSession: Math.max(...growths),
          avgSessionGrowth: growths.reduce((a, b) => a + b, 0) / growths.length
        };
      },
      
      resetSession: () => {
        set({
          currentSession: null,
          activeTrades: [],
          liveMetrics: {
            ticksProcessed: 0,
            predictionsMade: 0,
            lastPredictionTime: 0,
            currentSymbol: 'SPY',
            isStreaming: false
          }
        });
      },
      
      resetAllData: () => {
        set({
          currentSession: null,
          sessionHistory: [],
          activeTrades: [],
          tradeHistory: [],
          globalAccuracy: createDefaultGlobalAccuracy(),
          evolutionState: selfEvolvingSystem.getState(),
          liveMetrics: {
            ticksProcessed: 0,
            predictionsMade: 0,
            lastPredictionTime: 0,
            currentSymbol: 'SPY',
            isStreaming: false
          }
        });
      }
    }),
    {
      name: 'trading-session-storage',
      partialize: (state) => ({
        sessionHistory: state.sessionHistory,
        tradeHistory: state.tradeHistory,
        globalAccuracy: state.globalAccuracy
      })
    }
  )
);
