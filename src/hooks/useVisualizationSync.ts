/**
 * Visualization Synchronization Hook
 * 
 * Unified synchronization layer for ALL visualization state:
 * - Timeline position (current move)
 * - Display settings (dark mode, show pieces, opacity)
 * - Legend state (locked pieces, compare mode)
 * - Palette state
 * 
 * Ensures state persists correctly across:
 * - Page navigation
 * - Cart operations
 * - Export/download flows
 * - Share URL generation
 * - Session restoration
 */

import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useSessionStore, FullVisualizationState, CapturedTimelineState } from '@/stores/sessionStore';
import { useVisualizationStateStore, CapturedVisualizationState } from '@/stores/visualizationStateStore';
import { useActiveVisionStore } from '@/stores/activeVisionStore';
import { usePaletteSync } from './usePaletteSync';
import { PieceType, PieceColor, PaletteId } from '@/lib/chess/pieceColors';
import { SimulationResult } from '@/lib/chess/gameSimulator';
import { generateGameHash } from '@/lib/visualizations/gameCanonical';
import { GamePhase } from '@/contexts/TimelineContext';

export interface VisualizationContext {
  pgn?: string;
  gameHash?: string;
  title?: string;
  visualizationId?: string;
  simulation?: SimulationResult | null;
}

export interface SyncedVisualizationState {
  // Timeline
  currentMove: number;
  selectedPhase: GamePhase;
  
  // Display
  darkMode: boolean;
  showPieces: boolean;
  pieceOpacity: number;
  
  // Legend
  lockedPieces: Array<{ pieceType: PieceType; pieceColor: PieceColor }>;
  compareMode: boolean;
  
  // Palette
  paletteId: PaletteId;
  whitePalette: Record<string, string>;
  blackPalette: Record<string, string>;
}

export interface VisualizationSyncResult extends SyncedVisualizationState {
  // State setters
  setCurrentMove: (move: number) => void;
  setSelectedPhase: (phase: GamePhase) => void;
  setDarkMode: (dark: boolean) => void;
  setShowPieces: (show: boolean) => void;
  setPieceOpacity: (opacity: number) => void;
  setLockedPieces: (pieces: Array<{ pieceType: PieceType; pieceColor: PieceColor }>) => void;
  setCompareMode: (mode: boolean) => void;
  setPalette: (id: PaletteId) => void;
  
  // Utilities
  captureForExport: () => CapturedVisualizationState;
  captureForCart: () => CapturedTimelineState;
  captureForShare: () => ShareStateParams;
  saveBeforeNavigation: () => void;
  restoreFromUrl: () => boolean;
}

export interface ShareStateParams {
  move?: number;
  dark?: boolean;
  pieces?: boolean;
  opacity?: number;
  paletteId?: string;
}

/**
 * Master synchronization hook for visualization state
 * This is THE source of truth - all components should use this
 */
export function useVisualizationSync(context: VisualizationContext = {}): VisualizationSyncResult {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const hasInitializedRef = useRef(false);
  
  // Palette sync
  const { 
    paletteId, 
    whitePalette, 
    blackPalette, 
    setPalette,
    updateUrlPalette,
  } = usePaletteSync(searchParams.get('p') || undefined);
  
  // Global visualization state store
  const store = useVisualizationStateStore();
  const {
    currentMove,
    selectedPhase,
    lockedPieces,
    compareMode,
    darkMode,
    showPieces,
    pieceOpacity,
    setCurrentMove,
    setSelectedPhase,
    setLockedPieces,
    setCompareMode,
    setDarkMode,
    setShowPieces,
    setPieceOpacity,
    captureState,
    restoreFromState,
  } = store;
  
  // Session store for navigation persistence
  const sessionStore = useSessionStore();
  const {
    setCurrentSimulation,
    setCapturedTimelineState,
    pushVisualizationState,
    getVisualizationStateForRoute,
  } = sessionStore;
  
  // Active vision store for refresh persistence
  const { saveActiveVision } = useActiveVisionStore();
  
  // Initialize from URL parameters on mount
  useEffect(() => {
    if (hasInitializedRef.current) return;
    
    const moveParam = searchParams.get('m');
    const darkParam = searchParams.get('d');
    const piecesParam = searchParams.get('sp');
    const opacityParam = searchParams.get('o');
    
    if (moveParam) {
      const move = parseInt(moveParam, 10);
      if (!isNaN(move) && move > 0) {
        setCurrentMove(move);
      }
    }
    
    if (darkParam === '1') {
      setDarkMode(true);
    }
    
    if (piecesParam === '1') {
      setShowPieces(true);
    }
    
    if (opacityParam) {
      const opacity = parseFloat(opacityParam);
      if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
        setPieceOpacity(opacity);
      }
    }
    
    // Check for saved state for this route
    const savedState = getVisualizationStateForRoute(location.pathname + location.search);
    if (savedState) {
      restoreFromState({
        currentMove: savedState.currentMove,
        selectedPhase: savedState.selectedPhase,
        lockedPieces: savedState.lockedPieces,
        compareMode: savedState.compareMode,
        darkMode: savedState.darkMode,
        showPieces: savedState.showPieces,
        pieceOpacity: savedState.pieceOpacity,
      });
    }
    
    hasInitializedRef.current = true;
  }, [searchParams, location, setCurrentMove, setDarkMode, setShowPieces, setPieceOpacity, getVisualizationStateForRoute, restoreFromState]);
  
  // Capture state for export operations
  const captureForExport = useCallback((): CapturedVisualizationState => {
    return {
      currentMove,
      selectedPhase,
      isPlaying: false,
      lockedPieces: [...lockedPieces],
      lockedSquares: [],
      compareMode,
      highlightedPiece: null,
      displayMode: 'art',
      darkMode,
      showTerritory: false,
      showHeatmaps: false,
      showPieces,
      pieceOpacity,
      capturedAt: new Date(),
    };
  }, [currentMove, selectedPhase, lockedPieces, compareMode, darkMode, showPieces, pieceOpacity]);
  
  // Capture state for cart operations
  const captureForCart = useCallback((): CapturedTimelineState => {
    return {
      currentMove,
      lockedPieces: lockedPieces.map(p => ({
        pieceType: p.pieceType,
        pieceColor: p.pieceColor,
      })),
      compareMode,
      darkMode,
      showPieces,
      pieceOpacity,
    };
  }, [currentMove, lockedPieces, compareMode, darkMode, showPieces, pieceOpacity]);
  
  // Capture state for share URL generation
  const captureForShare = useCallback((): ShareStateParams => {
    const params: ShareStateParams = {};
    
    if (currentMove > 0 && currentMove !== Infinity) {
      params.move = currentMove;
    }
    if (darkMode) {
      params.dark = true;
    }
    if (showPieces) {
      params.pieces = true;
    }
    if (pieceOpacity !== 0.7) {
      params.opacity = pieceOpacity;
    }
    if (paletteId && paletteId !== 'modern') {
      params.paletteId = paletteId;
    }
    
    return params;
  }, [currentMove, darkMode, showPieces, pieceOpacity, paletteId]);
  
  // Save state before navigation
  const saveBeforeNavigation = useCallback(() => {
    const fullState: FullVisualizationState = {
      currentMove,
      selectedPhase,
      isPlaying: false,
      lockedPieces: [...lockedPieces],
      compareMode,
      highlightedPiece: null,
      displayMode: 'art',
      darkMode,
      showTerritory: false,
      showHeatmaps: false,
      showPieces,
      pieceOpacity,
      capturedAt: Date.now(),
      sourceRoute: location.pathname + location.search,
      visualizationId: context.visualizationId,
      pgn: context.pgn,
    };
    
    pushVisualizationState(fullState);
    
    // Also save to session store for simulation data
    if (context.simulation) {
      setCurrentSimulation(context.simulation, context.pgn || '', context.title || '');
    }
    
    // Save captured timeline state for order flow
    setCapturedTimelineState({
      currentMove,
      lockedPieces: [...lockedPieces],
      compareMode,
      darkMode,
      showPieces,
      pieceOpacity,
    });
    
    // Save to active vision store for refresh persistence
    if (context.pgn) {
      saveActiveVision({
        route: location.pathname + location.search,
        gameHash: context.gameHash || generateGameHash(context.pgn),
        paletteId,
        pgn: context.pgn,
        gameTitle: context.title,
        currentMove,
        selectedPhase,
        lockedPieces: [...lockedPieces],
        compareMode,
        darkMode,
        showPieces,
        pieceOpacity,
      });
    }
  }, [
    currentMove,
    selectedPhase,
    lockedPieces,
    compareMode,
    darkMode,
    showPieces,
    pieceOpacity,
    paletteId,
    location,
    context,
    pushVisualizationState,
    setCurrentSimulation,
    setCapturedTimelineState,
    saveActiveVision,
  ]);
  
  // Restore state from URL (returns true if state was restored)
  const restoreFromUrl = useCallback((): boolean => {
    const moveParam = searchParams.get('m');
    const darkParam = searchParams.get('d');
    const piecesParam = searchParams.get('sp');
    const opacityParam = searchParams.get('o');
    
    let restored = false;
    
    if (moveParam) {
      const move = parseInt(moveParam, 10);
      if (!isNaN(move) && move > 0) {
        setCurrentMove(move);
        restored = true;
      }
    }
    
    if (darkParam === '1') {
      setDarkMode(true);
      restored = true;
    }
    
    if (piecesParam === '1') {
      setShowPieces(true);
      restored = true;
    }
    
    if (opacityParam) {
      const opacity = parseFloat(opacityParam);
      if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
        setPieceOpacity(opacity);
        restored = true;
      }
    }
    
    return restored;
  }, [searchParams, setCurrentMove, setDarkMode, setShowPieces, setPieceOpacity]);
  
  return {
    // State
    currentMove,
    selectedPhase,
    darkMode,
    showPieces,
    pieceOpacity,
    lockedPieces,
    compareMode,
    paletteId,
    whitePalette,
    blackPalette,
    
    // Setters
    setCurrentMove,
    setSelectedPhase,
    setDarkMode,
    setShowPieces,
    setPieceOpacity,
    setLockedPieces,
    setCompareMode,
    setPalette,
    
    // Utilities
    captureForExport,
    captureForCart,
    captureForShare,
    saveBeforeNavigation,
    restoreFromUrl,
  };
}
