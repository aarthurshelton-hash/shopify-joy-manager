import { create } from 'zustand';
import { SimulationResult } from '@/lib/chess/gameSimulator';
import { MoveHistoryEntry } from '@/components/chess/EnPensentOverlay';
import { PieceType } from '@/lib/chess/pieceColors';

// Captured state interface - matches what user currently sees
export interface CapturedVisualizationState {
  currentMove: number;
  selectedPhase: string;
  lockedPieces: Array<{ pieceType: string; pieceColor: string }>;
  compareMode: boolean;
  displayMode: string;
  darkMode: boolean;
  showTerritory: boolean;
  showHeatmaps: boolean;
  capturedAt: Date;
}

export interface PrintOrderData {
  // From saved visualization
  visualizationId?: string;
  imagePath?: string;
  title: string;
  pgn?: string;
  gameData: {
    white: string;
    black: string;
    event?: string;
    date?: string;
    result?: string;
  };
  
  // From En Pensent live game (Play page)
  moveHistory?: MoveHistoryEntry[];
  whitePalette?: Record<PieceType, string>;
  blackPalette?: Record<PieceType, string>;
  
  // Full simulation result (from homepage or export)
  simulation?: SimulationResult;
  
  // Share ID for QR code
  shareId?: string | null;
  
  // Captured visualization state (timeline position, locked pieces, etc.)
  // This is the source of truth for what the user sees
  capturedState?: CapturedVisualizationState;
  
  // Pre-generated base64 image of exact current state (for cart/mockup)
  previewImageBase64?: string;
  
  // Path to return to after closing order page
  returnPath?: string;
}

interface PrintOrderStore {
  orderData: PrintOrderData | null;
  setOrderData: (data: PrintOrderData) => void;
  clearOrderData: () => void;
  // Update just the preview image (after async generation)
  setPreviewImage: (imageBase64: string) => void;
}

export const usePrintOrderStore = create<PrintOrderStore>((set) => ({
  orderData: null,
  setOrderData: (data) => set({ orderData: data }),
  clearOrderData: () => set({ orderData: null }),
  setPreviewImage: (imageBase64) => set((state) => ({
    orderData: state.orderData ? { ...state.orderData, previewImageBase64: imageBase64 } : null,
  })),
}));
