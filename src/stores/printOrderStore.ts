import { create } from 'zustand';
import { SimulationResult } from '@/lib/chess/gameSimulator';
import { MoveHistoryEntry } from '@/components/chess/EnPensentOverlay';
import { PieceType } from '@/lib/chess/pieceColors';

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
}

interface PrintOrderStore {
  orderData: PrintOrderData | null;
  setOrderData: (data: PrintOrderData) => void;
  clearOrderData: () => void;
}

export const usePrintOrderStore = create<PrintOrderStore>((set) => ({
  orderData: null,
  setOrderData: (data) => set({ orderData: data }),
  clearOrderData: () => set({ orderData: null }),
}));
