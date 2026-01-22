/**
 * Realtime Accuracy Provider v7.24 - LIVE STATS
 * Wraps the app to provide platform-wide accuracy auto-updates
 * Ensures all numerical data across En Pensent syncs in realtime
 * v7.24: Now exposes liveEloState for instant ELO updates across all pages
 *        Stats sourced from DB, used by useAutoEvolution for accurate totals
 */

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { 
  useRealtimeAccuracy, 
  RealtimeAccuracyState, 
  subscribeToAccuracyUpdates, 
  AccuracyUpdate,
  ChessCumulativeStats 
} from '@/hooks/useRealtimeAccuracy';
import { useTradingSessionStore } from '@/stores/tradingSessionStore';
import { type LiveEloState } from '@/lib/chess/liveEloTracker';

interface RealtimeAccuracyContextValue extends RealtimeAccuracyState {
  syncAccuracyData: () => Promise<void>;
  subscribeToUpdates: (listener: (update: AccuracyUpdate) => void) => () => void;
  chessStats: ChessCumulativeStats | null;
  liveEloState: LiveEloState; // v7.23: Live ELO calculated from realtime stats
}

const RealtimeAccuracyContext = createContext<RealtimeAccuracyContextValue | null>(null);

export function useRealtimeAccuracyContext() {
  const context = useContext(RealtimeAccuracyContext);
  if (!context) {
    throw new Error('useRealtimeAccuracyContext must be used within RealtimeAccuracyProvider');
  }
  return context;
}

interface RealtimeAccuracyProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function RealtimeAccuracyProvider({ 
  children, 
  enabled = true 
}: RealtimeAccuracyProviderProps) {
  const accuracyState = useRealtimeAccuracy(enabled);
  const { syncEvolutionState } = useTradingSessionStore();

  // Sync evolution state on every update
  useEffect(() => {
    if (accuracyState.updateCount > 0) {
      syncEvolutionState();
    }
  }, [accuracyState.updateCount, syncEvolutionState]);

  const value: RealtimeAccuracyContextValue = {
    ...accuracyState,
    subscribeToUpdates: subscribeToAccuracyUpdates,
  };

  return (
    <RealtimeAccuracyContext.Provider value={value}>
      {children}
    </RealtimeAccuracyContext.Provider>
  );
}

export default RealtimeAccuracyProvider;
