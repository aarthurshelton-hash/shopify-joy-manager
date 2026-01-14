import { useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSessionStore, FullVisualizationState } from '@/stores/sessionStore';
import { useVisualizationStateStore } from '@/stores/visualizationStateStore';
import { GamePhase } from '@/contexts/TimelineContext';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { SimulationResult } from '@/lib/chess/gameSimulator';

interface PiecesState {
  showPieces: boolean;
  pieceOpacity: number;
}

interface VisualizationContext {
  visualizationId?: string;
  shareId?: string;
  pgn?: string;
  title?: string;
  simulation?: SimulationResult | null;
  piecesState?: PiecesState;
}

/**
 * Master hook for unified visualization state management
 * Handles state capture on navigation away and restoration on return
 * Works across all entry points: Index, VisualizationView, MarketplaceVisionDetail
 */
export function useUnifiedVisualizationState(context: VisualizationContext = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Session store for cross-page state
  const {
    pushVisualizationState,
    popVisualizationState,
    getVisualizationStateForRoute,
    setCurrentSimulation,
    setSavedShareId,
    setCapturedTimelineState,
    setReturningFromOrder,
    currentSimulation: storedSimulation,
    currentPgn: storedPgn,
    currentGameTitle: storedTitle,
    savedShareId: storedShareId,
    capturedTimelineState: storedTimelineState,
    returningFromOrder,
    clearSimulation,
    navigationStack,
    pushRoute,
  } = useSessionStore();
  
  // Visualization state store for granular state
  const visualizationState = useVisualizationStateStore();
  const {
    currentMove,
    selectedPhase,
    lockedPieces,
    compareMode,
    displayMode,
    darkMode,
    showTerritory,
    showHeatmaps,
    showPieces,
    pieceOpacity,
    setCurrentMove,
    setSelectedPhase,
    setLockedPieces,
    setCompareMode,
    setDisplayMode,
    setDarkMode,
    setShowTerritory,
    setShowHeatmaps,
    setShowPieces,
    setPieceOpacity,
    restoreFromState,
  } = visualizationState;
  
  const hasRestoredRef = useRef(false);
  const currentRouteRef = useRef(location.pathname + location.search);
  
  // Build full state snapshot
  const captureFullState = useCallback((): FullVisualizationState => {
    const effectivePiecesState = context.piecesState || { showPieces, pieceOpacity };
    
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
      showPieces: effectivePiecesState.showPieces,
      pieceOpacity: effectivePiecesState.pieceOpacity,
      capturedAt: Date.now(),
      sourceRoute: location.pathname + location.search,
      visualizationId: context.visualizationId,
      pgn: context.pgn,
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
    showPieces,
    pieceOpacity,
    context.piecesState,
    context.visualizationId,
    context.pgn,
    location.pathname,
    location.search,
  ]);
  
  // Save state before navigating away
  const saveStateBeforeNavigation = useCallback(() => {
    const state = captureFullState();
    pushVisualizationState(state);
    
    // Also save simulation context for full restoration
    if (context.simulation) {
      setCurrentSimulation(context.simulation, context.pgn || '', context.title || '');
      if (context.shareId) {
        setSavedShareId(context.shareId);
      }
    }
  }, [
    captureFullState,
    pushVisualizationState,
    setCurrentSimulation,
    setSavedShareId,
    context.simulation,
    context.pgn,
    context.title,
    context.shareId,
  ]);
  
  // Restore state from session (for back navigation)
  const restoreState = useCallback((state: FullVisualizationState) => {
    restoreFromState({
      currentMove: state.currentMove,
      selectedPhase: state.selectedPhase,
      lockedPieces: state.lockedPieces,
      compareMode: state.compareMode,
      displayMode: state.displayMode,
      darkMode: state.darkMode,
      showTerritory: state.showTerritory,
      showHeatmaps: state.showHeatmaps,
      showPieces: state.showPieces,
      pieceOpacity: state.pieceOpacity,
    });
  }, [restoreFromState]);
  
  // Check for saved state on mount
  useEffect(() => {
    if (hasRestoredRef.current) return;
    
    const currentFullRoute = location.pathname + location.search;
    const savedState = getVisualizationStateForRoute(currentFullRoute);
    
    if (savedState) {
      restoreState(savedState);
      hasRestoredRef.current = true;
    } else if (storedTimelineState && returningFromOrder) {
      // Legacy restoration from order flow
      setCurrentMove(storedTimelineState.currentMove);
      setLockedPieces(storedTimelineState.lockedPieces);
      setCompareMode(storedTimelineState.compareMode);
      setDarkMode(storedTimelineState.darkMode);
      setReturningFromOrder(false);
      setCapturedTimelineState(null);
      hasRestoredRef.current = true;
    }
  }, [
    location.pathname,
    location.search,
    getVisualizationStateForRoute,
    restoreState,
    storedTimelineState,
    returningFromOrder,
    setCurrentMove,
    setLockedPieces,
    setCompareMode,
    setDarkMode,
    setReturningFromOrder,
    setCapturedTimelineState,
  ]);
  
  // Save state on unmount or route change
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveStateBeforeNavigation();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Save state when navigating away (component unmount)
      const newRoute = window.location.pathname + window.location.search;
      if (currentRouteRef.current !== newRoute) {
        saveStateBeforeNavigation();
      }
    };
  }, [saveStateBeforeNavigation]);
  
  // Update route ref
  useEffect(() => {
    currentRouteRef.current = location.pathname + location.search;
  }, [location.pathname, location.search]);
  
  // Navigate with state preservation
  const navigateWithState = useCallback((to: string) => {
    saveStateBeforeNavigation();
    pushRoute(location.pathname);
    navigate(to);
  }, [saveStateBeforeNavigation, pushRoute, navigate, location.pathname]);
  
  // Navigate back with state restoration
  const navigateBack = useCallback(() => {
    const savedState = popVisualizationState();
    if (savedState) {
      navigate(savedState.sourceRoute);
    } else {
      navigate(-1);
    }
  }, [popVisualizationState, navigate]);
  
  return {
    // State
    currentMove,
    selectedPhase,
    lockedPieces,
    compareMode,
    displayMode,
    darkMode,
    showTerritory,
    showHeatmaps,
    showPieces,
    pieceOpacity,
    
    // State setters
    setCurrentMove,
    setSelectedPhase,
    setLockedPieces,
    setCompareMode,
    setDisplayMode,
    setDarkMode,
    setShowTerritory,
    setShowHeatmaps,
    setShowPieces,
    setPieceOpacity,
    
    // Navigation helpers
    navigateWithState,
    navigateBack,
    saveStateBeforeNavigation,
    
    // Capture current state
    captureFullState,
    
    // Session data for restoration
    storedSimulation,
    storedPgn,
    storedTitle,
    storedShareId,
    returningFromOrder,
    clearSimulation,
  };
}
