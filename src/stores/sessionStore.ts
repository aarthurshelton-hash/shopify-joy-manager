import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SimulationResult } from '@/lib/chess/gameSimulator';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { GamePhase } from '@/contexts/TimelineContext';

/**
 * Session Store - Persists visualization and navigation state across page navigations
 * This enables full "backtrack restoration" - clicking back restores exact board state
 */

export interface CreativeModeTransfer {
  board: (string | null)[][];
  whitePalette: Record<PieceType, string>;
  blackPalette: Record<PieceType, string>;
  title: string;
  sourceVisualizationId?: string;
}

export interface CapturedTimelineState {
  currentMove: number;
  totalMoves?: number;
  title?: string;
  lockedPieces: Array<{ pieceType: PieceType; pieceColor: PieceColor }>;
  compareMode: boolean;
  darkMode: boolean;
}

/**
 * Full visualization state for backtrack restoration
 * Captures every aspect of the board's visual configuration
 */
export interface FullVisualizationState {
  // Timeline state
  currentMove: number;
  selectedPhase: GamePhase;
  isPlaying: boolean;
  
  // Legend state
  lockedPieces: Array<{ pieceType: PieceType; pieceColor: PieceColor }>;
  compareMode: boolean;
  highlightedPiece: { pieceType: PieceType; pieceColor: PieceColor } | null;
  
  // Display modes
  displayMode: 'art' | 'analysis' | 'minimal';
  darkMode: boolean;
  
  // Territory/heatmap modes
  showTerritory: boolean;
  showHeatmaps: boolean;
  
  // Show pieces overlay
  showPieces: boolean;
  pieceOpacity: number;
  
  // Captured timestamp
  capturedAt: number;
  
  // Source identifier (for matching on restore)
  sourceRoute: string;
  visualizationId?: string;
  pgn?: string;
}

interface SessionState {
  // Current visualization context
  currentSimulation: SimulationResult | null;
  currentPgn: string;
  currentGameTitle: string;
  savedShareId: string | null;
  
  // Captured timeline state for exact visual restoration
  capturedTimelineState: CapturedTimelineState | null;
  
  // Full visualization state stack for backtrack restoration
  visualizationStateStack: FullVisualizationState[];
  
  // Creative mode transfer data
  creativeModeTransfer: CreativeModeTransfer | null;
  
  // Navigation history
  previousRoute: string | null;
  navigationStack: string[];
  
  // Flag to indicate we're returning from order page
  returningFromOrder: boolean;
  
  // Actions
  setCurrentSimulation: (simulation: SimulationResult | null, pgn?: string, title?: string) => void;
  setSavedShareId: (shareId: string | null) => void;
  setCapturedTimelineState: (state: CapturedTimelineState | null) => void;
  setReturningFromOrder: (returning: boolean) => void;
  clearSimulation: () => void;
  
  // Full visualization state for backtrack
  pushVisualizationState: (state: FullVisualizationState) => void;
  popVisualizationState: () => FullVisualizationState | null;
  peekVisualizationState: () => FullVisualizationState | null;
  getVisualizationStateForRoute: (route: string) => FullVisualizationState | null;
  clearVisualizationStateStack: () => void;
  
  // Creative mode transfer
  setCreativeModeTransfer: (data: CreativeModeTransfer | null) => void;
  clearCreativeModeTransfer: () => void;
  
  // Navigation tracking
  pushRoute: (route: string) => void;
  popRoute: () => string | null;
  setPreviousRoute: (route: string | null) => void;
  
  // Full reset
  clearSession: () => void;
}

// Synchronous storage wrapper that writes immediately
const syncSessionStorage = {
  getItem: (name: string): string | null => {
    return sessionStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    sessionStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    sessionStorage.removeItem(name);
  },
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSimulation: null,
      currentPgn: '',
      currentGameTitle: '',
      savedShareId: null,
      capturedTimelineState: null,
      visualizationStateStack: [],
      creativeModeTransfer: null,
      previousRoute: null,
      navigationStack: [],
      returningFromOrder: false,
      
      // Set current visualization
      setCurrentSimulation: (simulation, pgn = '', title = '') => {
        set({
          currentSimulation: simulation,
          currentPgn: pgn,
          currentGameTitle: title,
        });
        // Force immediate sync write to sessionStorage
        const state = get();
        const dataToStore = {
          state: {
            currentSimulation: simulation,
            currentPgn: pgn,
            currentGameTitle: title,
            savedShareId: state.savedShareId,
            capturedTimelineState: state.capturedTimelineState,
            visualizationStateStack: state.visualizationStateStack,
            creativeModeTransfer: state.creativeModeTransfer,
            previousRoute: state.previousRoute,
            navigationStack: state.navigationStack,
            returningFromOrder: state.returningFromOrder,
          },
          version: 0,
        };
        sessionStorage.setItem('en-pensent-session', JSON.stringify(dataToStore));
      },
      
      setSavedShareId: (shareId) => set({ savedShareId: shareId }),
      
      setCapturedTimelineState: (state) => set({ capturedTimelineState: state }),
      
      setReturningFromOrder: (returning) => set({ returningFromOrder: returning }),
      
      clearSimulation: () => set({
        currentSimulation: null,
        currentPgn: '',
        currentGameTitle: '',
        savedShareId: null,
        capturedTimelineState: null,
        returningFromOrder: false,
      }),
      
      // Full visualization state stack management
      pushVisualizationState: (state) => set((prev) => {
        // Limit stack size to prevent memory bloat (keep last 10)
        const newStack = [...prev.visualizationStateStack, state].slice(-10);
        return { visualizationStateStack: newStack };
      }),
      
      popVisualizationState: () => {
        const state = get();
        if (state.visualizationStateStack.length === 0) return null;
        
        const newStack = [...state.visualizationStateStack];
        const popped = newStack.pop() || null;
        set({ visualizationStateStack: newStack });
        return popped;
      },
      
      peekVisualizationState: () => {
        const state = get();
        if (state.visualizationStateStack.length === 0) return null;
        return state.visualizationStateStack[state.visualizationStateStack.length - 1];
      },
      
      getVisualizationStateForRoute: (route: string) => {
        const state = get();
        // Find the most recent state for this route
        for (let i = state.visualizationStateStack.length - 1; i >= 0; i--) {
          if (state.visualizationStateStack[i].sourceRoute === route) {
            return state.visualizationStateStack[i];
          }
        }
        return null;
      },
      
      clearVisualizationStateStack: () => set({ visualizationStateStack: [] }),
      
      // Creative mode transfer
      setCreativeModeTransfer: (data) => set({ creativeModeTransfer: data }),
      clearCreativeModeTransfer: () => set({ creativeModeTransfer: null }),
      
      // Navigation tracking
      pushRoute: (route) => set((state) => ({
        navigationStack: [...state.navigationStack, route],
        previousRoute: state.navigationStack.length > 0 
          ? state.navigationStack[state.navigationStack.length - 1] 
          : null,
      })),
      
      popRoute: () => {
        const state = get();
        if (state.navigationStack.length === 0) return null;
        
        const newStack = [...state.navigationStack];
        const poppedRoute = newStack.pop() || null;
        
        set({
          navigationStack: newStack,
          previousRoute: newStack.length > 0 ? newStack[newStack.length - 1] : null,
        });
        
        return poppedRoute;
      },
      
      setPreviousRoute: (route) => set({ previousRoute: route }),
      
      clearSession: () => set({
        currentSimulation: null,
        currentPgn: '',
        currentGameTitle: '',
        savedShareId: null,
        capturedTimelineState: null,
        visualizationStateStack: [],
        creativeModeTransfer: null,
        previousRoute: null,
        navigationStack: [],
        returningFromOrder: false,
      }),
    }),
    {
      name: 'en-pensent-session',
      storage: createJSONStorage(() => syncSessionStorage),
      partialize: (state) => ({
        // Persist simulation for navigation back to visualization
        currentSimulation: state.currentSimulation,
        currentPgn: state.currentPgn,
        currentGameTitle: state.currentGameTitle,
        savedShareId: state.savedShareId,
        capturedTimelineState: state.capturedTimelineState,
        visualizationStateStack: state.visualizationStateStack,
        creativeModeTransfer: state.creativeModeTransfer,
        previousRoute: state.previousRoute,
        navigationStack: state.navigationStack,
        returningFromOrder: state.returningFromOrder,
      }),
    }
  )
);