import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SimulationResult } from '@/lib/chess/gameSimulator';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

/**
 * Session Store - Persists visualization and navigation state across page navigations
 * This enables the "memory holding capabilities" for the app
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

interface SessionState {
  // Current visualization context
  currentSimulation: SimulationResult | null;
  currentPgn: string;
  currentGameTitle: string;
  savedShareId: string | null;
  
  // Captured timeline state for exact visual restoration
  capturedTimelineState: CapturedTimelineState | null;
  
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

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSimulation: null,
      currentPgn: '',
      currentGameTitle: '',
      savedShareId: null,
      capturedTimelineState: null,
      creativeModeTransfer: null,
      previousRoute: null,
      navigationStack: [],
      returningFromOrder: false,
      
      // Set current visualization
      setCurrentSimulation: (simulation, pgn = '', title = '') => set({
        currentSimulation: simulation,
        currentPgn: pgn,
        currentGameTitle: title,
      }),
      
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
        creativeModeTransfer: null,
        previousRoute: null,
        navigationStack: [],
        returningFromOrder: false,
      }),
    }),
    {
      name: 'en-pensent-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        // Persist simulation for navigation back to visualization
        currentSimulation: state.currentSimulation,
        currentPgn: state.currentPgn,
        currentGameTitle: state.currentGameTitle,
        savedShareId: state.savedShareId,
        capturedTimelineState: state.capturedTimelineState,
        creativeModeTransfer: state.creativeModeTransfer,
        previousRoute: state.previousRoute,
        navigationStack: state.navigationStack,
        returningFromOrder: state.returningFromOrder,
      }),
    }
  )
);
