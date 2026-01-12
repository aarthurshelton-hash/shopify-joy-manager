import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SimulationResult } from '@/lib/chess/gameSimulator';

/**
 * Session Store - Persists visualization and navigation state across page navigations
 * This enables the "memory holding capabilities" for the app
 */

interface SessionState {
  // Current visualization context
  currentSimulation: SimulationResult | null;
  currentPgn: string;
  currentGameTitle: string;
  savedShareId: string | null;
  
  // Navigation history
  previousRoute: string | null;
  navigationStack: string[];
  
  // Actions
  setCurrentSimulation: (simulation: SimulationResult | null, pgn?: string, title?: string) => void;
  setSavedShareId: (shareId: string | null) => void;
  clearSimulation: () => void;
  
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
      previousRoute: null,
      navigationStack: [],
      
      // Set current visualization
      setCurrentSimulation: (simulation, pgn = '', title = '') => set({
        currentSimulation: simulation,
        currentPgn: pgn,
        currentGameTitle: title,
      }),
      
      setSavedShareId: (shareId) => set({ savedShareId: shareId }),
      
      clearSimulation: () => set({
        currentSimulation: null,
        currentPgn: '',
        currentGameTitle: '',
        savedShareId: null,
      }),
      
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
        previousRoute: null,
        navigationStack: [],
      }),
    }),
    {
      name: 'en-pensent-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        // Only persist essential navigation data (simulations are too large for sessionStorage)
        currentPgn: state.currentPgn,
        currentGameTitle: state.currentGameTitle,
        savedShareId: state.savedShareId,
        previousRoute: state.previousRoute,
        navigationStack: state.navigationStack,
      }),
    }
  )
);
