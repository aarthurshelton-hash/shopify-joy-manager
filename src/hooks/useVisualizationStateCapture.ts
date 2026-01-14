import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSessionStore, FullVisualizationState } from '@/stores/sessionStore';
import { useVisualizationStateStore } from '@/stores/visualizationStateStore';
import { GamePhase } from '@/contexts/TimelineContext';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

interface PiecesState {
  showPieces: boolean;
  pieceOpacity: number;
}

interface CaptureConfig {
  visualizationId?: string;
  pgn?: string;
  piecesState?: PiecesState;
}

/**
 * Hook to capture and restore full visualization state on navigation
 * Enables "backtrack restoration" - clicking back restores exact board state
 */
export function useVisualizationStateCapture(config?: CaptureConfig) {
  const location = useLocation();
  const pushVisualizationState = useSessionStore(s => s.pushVisualizationState);
  const getVisualizationStateForRoute = useSessionStore(s => s.getVisualizationStateForRoute);
  const peekVisualizationState = useSessionStore(s => s.peekVisualizationState);
  
  const {
    currentMove,
    selectedPhase,
    lockedPieces,
    compareMode,
    displayMode,
    darkMode,
    showTerritory,
    showHeatmaps,
    setCurrentMove,
    setSelectedPhase,
    setLockedPieces,
    setCompareMode,
    setDisplayMode,
    setDarkMode,
    setShowTerritory,
    setShowHeatmaps,
  } = useVisualizationStateStore();
  
  const hasRestoredRef = useRef(false);
  const currentRouteRef = useRef(location.pathname);
  
  // Capture current state before navigation
  const captureState = useCallback((): FullVisualizationState => {
    return {
      currentMove,
      selectedPhase: selectedPhase as GamePhase,
      isPlaying: false,
      lockedPieces: lockedPieces.map(p => ({
        pieceType: p.pieceType as PieceType,
        pieceColor: p.pieceColor as PieceColor,
      })),
      compareMode,
      highlightedPiece: null,
      displayMode,
      darkMode,
      showTerritory,
      showHeatmaps,
      showPieces: config?.piecesState?.showPieces ?? false,
      pieceOpacity: config?.piecesState?.pieceOpacity ?? 0.7,
      capturedAt: Date.now(),
      sourceRoute: location.pathname,
      visualizationId: config?.visualizationId,
      pgn: config?.pgn,
    };
  }, [
    currentMove,
    selectedPhase,
    lockedPieces,
    compareMode,
    displayMode,
    darkMode,
    showTerritory,
    showHeatmaps,
    config?.piecesState,
    config?.visualizationId,
    config?.pgn,
    location.pathname,
  ]);
  
  // Save state when navigating away
  const saveStateBeforeNavigation = useCallback(() => {
    const state = captureState();
    pushVisualizationState(state);
  }, [captureState, pushVisualizationState]);
  
  // Restore state from session on mount (for back navigation)
  useEffect(() => {
    if (hasRestoredRef.current) return;
    
    // Check if we have a saved state for this route
    const savedState = getVisualizationStateForRoute(location.pathname);
    
    if (savedState) {
      // Restore all state
      setCurrentMove(savedState.currentMove);
      setSelectedPhase(savedState.selectedPhase);
      setLockedPieces(savedState.lockedPieces);
      setCompareMode(savedState.compareMode);
      setDisplayMode(savedState.displayMode);
      setDarkMode(savedState.darkMode);
      setShowTerritory(savedState.showTerritory);
      setShowHeatmaps(savedState.showHeatmaps);
      
      hasRestoredRef.current = true;
    }
  }, [
    location.pathname,
    getVisualizationStateForRoute,
    setCurrentMove,
    setSelectedPhase,
    setLockedPieces,
    setCompareMode,
    setDisplayMode,
    setDarkMode,
    setShowTerritory,
    setShowHeatmaps,
  ]);
  
  // Track route changes and save state when leaving visualization pages
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveStateBeforeNavigation();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Save state when component unmounts (navigation away)
      if (currentRouteRef.current !== location.pathname) {
        saveStateBeforeNavigation();
      }
    };
  }, [saveStateBeforeNavigation, location.pathname]);
  
  // Update route ref
  useEffect(() => {
    currentRouteRef.current = location.pathname;
  }, [location.pathname]);
  
  return {
    captureState,
    saveStateBeforeNavigation,
    getCurrentSavedState: () => peekVisualizationState(),
    getSavedStateForRoute: getVisualizationStateForRoute,
  };
}

/**
 * Hook to get initial state from session or URL for visualization pages
 */
export function useInitialVisualizationState() {
  const location = useLocation();
  const getVisualizationStateForRoute = useSessionStore(s => s.getVisualizationStateForRoute);
  
  // Get saved state for current route
  const savedState = getVisualizationStateForRoute(location.pathname);
  
  return {
    hasSavedState: !!savedState,
    savedState,
    initialMove: savedState?.currentMove ?? Infinity,
    initialPhase: savedState?.selectedPhase ?? 'all',
    initialLockedPieces: savedState?.lockedPieces ?? [],
    initialCompareMode: savedState?.compareMode ?? false,
    initialDisplayMode: savedState?.displayMode ?? 'art',
    initialDarkMode: savedState?.darkMode ?? false,
    initialShowTerritory: savedState?.showTerritory ?? false,
    initialShowHeatmaps: savedState?.showHeatmaps ?? false,
    initialShowPieces: savedState?.showPieces ?? false,
    initialPieceOpacity: savedState?.pieceOpacity ?? 0.7,
  };
}
