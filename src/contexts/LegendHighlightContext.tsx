import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

export interface HighlightedPiece {
  pieceType: PieceType;
  pieceColor: PieceColor;
}

// Locked square for persistent highlighting (similar to locked pieces)
export interface LockedSquare {
  square: string; // e.g., "e4"
  pieces: HighlightedPiece[]; // Pieces that visited this square
}

// For reverse highlighting: hovering a square highlights relevant pieces
export interface HoveredSquareInfo {
  square: string;
  pieces: HighlightedPiece[]; // All pieces that have visited this square
  moveNumbers: number[]; // Move numbers associated with this square's visits
}

// Annotation types that can be highlighted
export type AnnotationType = 
  | 'white-player'    // The white player name
  | 'black-player'    // The black player name
  | 'move-notation'   // The move notation text
  | 'result';         // The game result

// For annotation highlighting: which annotation element is hovered
export interface HoveredAnnotation {
  type: AnnotationType;
  // For annotations, specify which pieces are associated
  associatedPieces?: HighlightedPiece[];
}

// Move arrow data for visualizing piece movements
export interface PieceMoveArrow {
  from: string; // e.g., "e2"
  to: string;   // e.g., "e4"
  moveNumber: number;
  pieceType: PieceType;
  pieceColor: PieceColor;
  isCapture: boolean;
}

// Follow piece mode data
export interface FollowPieceData {
  piece: HighlightedPiece;
  moveNumbers: number[]; // All move numbers where this piece moved
  currentIndex: number;  // Current position in the moveNumbers array
}

// For move notation hover highlighting
export interface HoveredMoveInfo {
  moveNumber: number;       // 1-indexed move number in the game
  san: string;              // The SAN notation (e.g., "Nf3", "e4")
  piece: HighlightedPiece;  // The piece that moved
  targetSquare: string;     // The destination square (e.g., "f3", "e4")
  isCapture: boolean;       // Whether this move was a capture
}

interface LegendHighlightContextValue {
  highlightedPiece: HighlightedPiece | null;
  lockedPieces: HighlightedPiece[];
  lockedSquares: LockedSquare[]; // NEW: Locked squares for persistent highlighting
  compareMode: boolean;
  hoveredSquare: HoveredSquareInfo | null;
  // Annotation highlighting
  hoveredAnnotation: HoveredAnnotation | null;
  highlightedAnnotations: AnnotationType[]; // Annotations to highlight based on piece selection
  // Follow piece mode
  followPieceData: FollowPieceData | null;
  pieceArrows: PieceMoveArrow[];
  // Move notation hover
  hoveredMove: HoveredMoveInfo | null;
  setHighlightedPiece: (piece: HighlightedPiece | null) => void;
  toggleLockedPiece: (piece: HighlightedPiece) => void;
  toggleLockedSquare: (square: string, pieces: HighlightedPiece[]) => void; // NEW
  toggleCompareMode: () => void;
  clearLock: () => void;
  setHoveredSquare: (info: HoveredSquareInfo | null) => void;
  setHoveredAnnotation: (annotation: HoveredAnnotation | null) => void;
  setHighlightedAnnotations: (annotations: AnnotationType[]) => void;
  // Follow piece mode functions
  setFollowPieceData: (data: FollowPieceData | null) => void;
  setPieceArrows: (arrows: PieceMoveArrow[]) => void;
  nextPieceMove: () => number | null;
  prevPieceMove: () => number | null;
  // Move notation hover
  setHoveredMove: (move: HoveredMoveInfo | null) => void;
}

const LegendHighlightContext = createContext<LegendHighlightContextValue | undefined>(undefined);

interface LegendHighlightProviderProps {
  children: ReactNode;
  initialLockedPieces?: HighlightedPiece[];
  initialLockedSquares?: LockedSquare[];
  initialCompareMode?: boolean;
}

export function LegendHighlightProvider({ 
  children, 
  initialLockedPieces,
  initialLockedSquares, 
  initialCompareMode 
}: LegendHighlightProviderProps) {
  const [highlightedPiece, setHighlightedPieceState] = useState<HighlightedPiece | null>(null);
  const [lockedPieces, setLockedPieces] = useState<HighlightedPiece[]>(initialLockedPieces ?? []);
  const [lockedSquares, setLockedSquares] = useState<LockedSquare[]>(initialLockedSquares ?? []);
  const [compareMode, setCompareMode] = useState(initialCompareMode ?? false);
  const [hoveredSquare, setHoveredSquareState] = useState<HoveredSquareInfo | null>(null);
  const [hoveredAnnotation, setHoveredAnnotationState] = useState<HoveredAnnotation | null>(null);
  const [highlightedAnnotations, setHighlightedAnnotationsState] = useState<AnnotationType[]>([]);
  const [followPieceData, setFollowPieceDataState] = useState<FollowPieceData | null>(null);
  const [pieceArrows, setPieceArrowsState] = useState<PieceMoveArrow[]>([]);
  const [hoveredMove, setHoveredMoveState] = useState<HoveredMoveInfo | null>(null);

  const setHighlightedPiece = useCallback((piece: HighlightedPiece | null) => {
    setHighlightedPieceState(piece);
  }, []);

  const setHoveredSquare = useCallback((info: HoveredSquareInfo | null) => {
    setHoveredSquareState(info);
  }, []);

  const setHoveredAnnotation = useCallback((annotation: HoveredAnnotation | null) => {
    setHoveredAnnotationState(annotation);
  }, []);

  const setHighlightedAnnotations = useCallback((annotations: AnnotationType[]) => {
    setHighlightedAnnotationsState(annotations);
  }, []);

  const setFollowPieceData = useCallback((data: FollowPieceData | null) => {
    setFollowPieceDataState(data);
  }, []);

  const setPieceArrows = useCallback((arrows: PieceMoveArrow[]) => {
    setPieceArrowsState(arrows);
  }, []);

  const setHoveredMove = useCallback((move: HoveredMoveInfo | null) => {
    setHoveredMoveState(move);
  }, []);

  const nextPieceMove = useCallback((): number | null => {
    if (!followPieceData) return null;
    const newIndex = Math.min(followPieceData.currentIndex + 1, followPieceData.moveNumbers.length - 1);
    if (newIndex !== followPieceData.currentIndex) {
      setFollowPieceDataState({ ...followPieceData, currentIndex: newIndex });
      return followPieceData.moveNumbers[newIndex];
    }
    return null;
  }, [followPieceData]);

  const prevPieceMove = useCallback((): number | null => {
    if (!followPieceData) return null;
    const newIndex = Math.max(followPieceData.currentIndex - 1, 0);
    if (newIndex !== followPieceData.currentIndex) {
      setFollowPieceDataState({ ...followPieceData, currentIndex: newIndex });
      return followPieceData.moveNumbers[newIndex];
    }
    return null;
  }, [followPieceData]);

  const toggleLockedPiece = useCallback((piece: HighlightedPiece) => {
    setLockedPieces(prev => {
      const existingIndex = prev.findIndex(
        p => p.pieceType === piece.pieceType && p.pieceColor === piece.pieceColor
      );
      
      if (existingIndex !== -1) {
        // Remove if already selected - also clear follow mode
        setFollowPieceDataState(null);
        setPieceArrowsState([]);
        return prev.filter((_, i) => i !== existingIndex);
      }
      
      if (compareMode) {
        // In compare mode, allow up to 2 pieces
        if (prev.length >= 2) {
          // Replace oldest selection
          return [prev[1], piece];
        }
        return [...prev, piece];
      } else {
        // Single selection mode
        return [piece];
      }
    });
  }, [compareMode]);

  // Toggle locked square - click to lock, click again to unlock
  const toggleLockedSquare = useCallback((square: string, pieces: HighlightedPiece[]) => {
    setLockedSquares(prev => {
      const existingIndex = prev.findIndex(s => s.square === square);
      
      if (existingIndex !== -1) {
        // Remove if already locked
        return prev.filter((_, i) => i !== existingIndex);
      }
      
      // Add new locked square (allow multiple squares)
      return [...prev, { square, pieces }];
    });
  }, []);

  const toggleCompareMode = useCallback(() => {
    setCompareMode(prev => {
      if (prev) {
        // Exiting compare mode - keep only first locked piece
        setLockedPieces(current => current.slice(0, 1));
      }
      return !prev;
    });
  }, []);

  const clearLock = useCallback(() => {
    setLockedPieces([]);
    setLockedSquares([]);
    setHighlightedAnnotationsState([]);
    setFollowPieceDataState(null);
    setPieceArrowsState([]);
  }, []);

  return (
    <LegendHighlightContext.Provider value={{ 
      highlightedPiece: lockedPieces.length > 0 ? null : highlightedPiece, 
      lockedPieces,
      lockedSquares,
      compareMode,
      hoveredSquare,
      hoveredAnnotation,
      highlightedAnnotations,
      followPieceData,
      pieceArrows,
      hoveredMove,
      setHighlightedPiece, 
      toggleLockedPiece,
      toggleLockedSquare,
      toggleCompareMode,
      clearLock,
      setHoveredSquare,
      setHoveredAnnotation,
      setHighlightedAnnotations,
      setFollowPieceData,
      setPieceArrows,
      nextPieceMove,
      prevPieceMove,
      setHoveredMove,
    }}>
      {children}
    </LegendHighlightContext.Provider>
  );
}

export function useLegendHighlight() {
  const context = useContext(LegendHighlightContext);
  if (context === undefined) {
    throw new Error('useLegendHighlight must be used within a LegendHighlightProvider');
  }
  return context;
}

// Helper function to parse SAN notation and extract piece type and target square
export function parseSanMove(san: string, isWhiteMove: boolean): { pieceType: PieceType; targetSquare: string; isCapture: boolean } | null {
  if (!san) return null;
  
  // Remove check/checkmate symbols
  const cleanSan = san.replace(/[+#!?]/g, '');
  
  // Handle castling
  if (cleanSan === 'O-O' || cleanSan === 'O-O-O') {
    return { pieceType: 'k', targetSquare: cleanSan === 'O-O' ? (isWhiteMove ? 'g1' : 'g8') : (isWhiteMove ? 'c1' : 'c8'), isCapture: false };
  }
  
  const isCapture = cleanSan.includes('x');
  
  // Extract piece type (uppercase letter at start, or pawn if lowercase/no letter)
  let pieceType: PieceType = 'p';
  let remaining = cleanSan;
  
  if (/^[KQRBN]/.test(cleanSan)) {
    const pieceChar = cleanSan[0].toLowerCase();
    pieceType = pieceChar as PieceType;
    remaining = cleanSan.slice(1);
  }
  
  // Remove capture symbol and disambiguation
  remaining = remaining.replace('x', '');
  
  // Extract target square (last 2 characters before promotion)
  const promotionMatch = remaining.match(/=([QRBN])$/i);
  if (promotionMatch) {
    remaining = remaining.slice(0, -2);
  }
  
  // Target square is the last 2 characters
  const targetSquare = remaining.slice(-2);
  
  if (!/^[a-h][1-8]$/.test(targetSquare)) {
    return null;
  }
  
  return { pieceType, targetSquare, isCapture };
}
