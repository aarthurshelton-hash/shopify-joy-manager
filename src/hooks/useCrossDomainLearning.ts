/**
 * useCrossDomainLearning Hook
 * 
 * Provides real-time access to the unified learning system
 * where Chess, Code, and Market patterns flow bidirectionally.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  crossDomainLearningPipeline,
  historicalGameImporter,
  ibkrIntelligenceCollector,
  type LearningState,
  type ImportProgress,
  type IntelligenceState,
  type CrossDomainPattern,
} from '@/lib/pensent-core/domains/learning';
import { UnifiedGameData } from '@/lib/chess/gameImport/multiSourceFetcher';

export interface CrossDomainLearningHookReturn {
  // Learning state
  learningState: LearningState | null;
  importProgress: ImportProgress | null;
  ibkrState: IntelligenceState | null;
  
  // Patterns
  patterns: CrossDomainPattern[];
  chessPatterns: CrossDomainPattern[];
  codePatterns: CrossDomainPattern[];
  marketPatterns: CrossDomainPattern[];
  
  // Actions
  learnFromChessGame: (game: UnifiedGameData, outcome: {
    archetype: string;
    confidence: number;
    predictedWinner?: 'white' | 'black' | 'draw';
    actualWinner?: 'white' | 'black' | 'draw';
  }) => Promise<void>;
  
  learnFromCodeAnalysis: (analysis: {
    archetype: string;
    health: number;
    fingerprint: string;
    quadrantProfile: { complexity: number; velocity: number; quality: number; architecture: number };
  }) => Promise<void>;
  
  importFromDatabase: (limit?: number) => Promise<void>;
  importFreshGames: (count?: number) => Promise<void>;
  
  connectIbkr: () => Promise<boolean>;
  disconnectIbkr: () => void;
  
  // Status
  isImporting: boolean;
  isConnectingIbkr: boolean;
}

export function useCrossDomainLearning(): CrossDomainLearningHookReturn {
  const [learningState, setLearningState] = useState<LearningState | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [ibkrState, setIbkrState] = useState<IntelligenceState | null>(null);
  const [patterns, setPatterns] = useState<CrossDomainPattern[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isConnectingIbkr, setIsConnectingIbkr] = useState(false);

  // Subscribe to updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLearningState(crossDomainLearningPipeline.getState());
      setIbkrState(ibkrIntelligenceCollector.getState());
      setPatterns(crossDomainLearningPipeline.getPatterns());
    }, 2000);

    const unsubscribeImport = historicalGameImporter.subscribe(setImportProgress);

    // Initial load
    setLearningState(crossDomainLearningPipeline.getState());
    setIbkrState(ibkrIntelligenceCollector.getState());
    setPatterns(crossDomainLearningPipeline.getPatterns());

    return () => {
      clearInterval(interval);
      unsubscribeImport();
    };
  }, []);

  // Learn from chess game
  const learnFromChessGame = useCallback(async (
    game: UnifiedGameData,
    outcome: {
      archetype: string;
      confidence: number;
      predictedWinner?: 'white' | 'black' | 'draw';
      actualWinner?: 'white' | 'black' | 'draw';
    }
  ) => {
    await crossDomainLearningPipeline.learnFromChessGame(game, outcome);
    setLearningState(crossDomainLearningPipeline.getState());
    setPatterns(crossDomainLearningPipeline.getPatterns());
  }, []);

  // Learn from code analysis
  const learnFromCodeAnalysis = useCallback(async (analysis: {
    archetype: string;
    health: number;
    fingerprint: string;
    quadrantProfile: { complexity: number; velocity: number; quality: number; architecture: number };
  }) => {
    await crossDomainLearningPipeline.learnFromCodeAnalysis(analysis);
    setLearningState(crossDomainLearningPipeline.getState());
    setPatterns(crossDomainLearningPipeline.getPatterns());
  }, []);

  // Import from database
  const importFromDatabase = useCallback(async (limit = 500) => {
    setIsImporting(true);
    try {
      await historicalGameImporter.importFromDatabase(limit);
    } finally {
      setIsImporting(false);
    }
  }, []);

  // Import fresh games
  const importFreshGames = useCallback(async (count = 100) => {
    setIsImporting(true);
    try {
      await historicalGameImporter.importGames({
        sources: ['lichess', 'chesscom'],
        targetCount: count,
        minElo: 2000,
        learnFromOutcomes: true,
      });
    } finally {
      setIsImporting(false);
    }
  }, []);

  // Connect to IBKR
  const connectIbkr = useCallback(async () => {
    setIsConnectingIbkr(true);
    try {
      const success = await ibkrIntelligenceCollector.connect();
      setIbkrState(ibkrIntelligenceCollector.getState());
      return success;
    } finally {
      setIsConnectingIbkr(false);
    }
  }, []);

  // Disconnect IBKR
  const disconnectIbkr = useCallback(() => {
    ibkrIntelligenceCollector.disconnect();
    setIbkrState(ibkrIntelligenceCollector.getState());
  }, []);

  // Filter patterns by domain
  const chessPatterns = patterns.filter(p => p.archetypeMapping.chess?.length > 0);
  const codePatterns = patterns.filter(p => p.archetypeMapping.code?.length > 0);
  const marketPatterns = patterns.filter(p => p.archetypeMapping.market?.length > 0);

  return {
    learningState,
    importProgress,
    ibkrState,
    patterns,
    chessPatterns,
    codePatterns,
    marketPatterns,
    learnFromChessGame,
    learnFromCodeAnalysis,
    importFromDatabase,
    importFreshGames,
    connectIbkr,
    disconnectIbkr,
    isImporting,
    isConnectingIbkr,
  };
}
