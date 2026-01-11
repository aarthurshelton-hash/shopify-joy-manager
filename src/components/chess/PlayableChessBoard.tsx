import { useState, useCallback, useMemo, useRef } from 'react';
import { Square } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { EnPensentOverlay, MoveHistoryEntry } from './EnPensentOverlay';
import { useLegendHighlight, HighlightedPiece } from '@/contexts/LegendHighlightContext';

interface PlayableChessBoardProps {
  fen: string;
  onMove: (from: Square, to: Square, promotion?: string) => Promise<boolean>;
  getAvailableMoves: (square: Square) => Square[];
  isMyTurn: boolean;
  myColor: 'w' | 'b' | null;
  whitePalette: Record<string, string>;
  blackPalette: Record<string, string>;
  movedSquares: Set<string>;
  disabled?: boolean;
  onMoveResult?: (result: { isCapture: boolean; isCheck: boolean; isCheckmate: boolean; isCastle: boolean }) => void;
  // En Pensent mode props
  enPensentEnabled?: boolean;
  enPensentOpacity?: number;
  moveHistory?: MoveHistoryEntry[];
}

const PIECE_SYMBOLS: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

const parseFen = (fen: string): (string | null)[][] => {
  const rows = fen.split(' ')[0].split('/');
  return rows.map(row => {
    const squares: (string | null)[] = [];
    for (const char of row) {
      if (/\d/.test(char)) {
        for (let i = 0; i < parseInt(char); i++) squares.push(null);
      } else {
        squares.push(char);
      }
    }
    return squares;
  });
};

const squareToIndex = (square: Square): [number, number] => {
  const col = square.charCodeAt(0) - 97;
  const row = 8 - parseInt(square[1]);
  return [row, col];
};

const indexToSquare = (row: number, col: number): Square => {
  return `${String.fromCharCode(97 + col)}${8 - row}` as Square;
};

export const PlayableChessBoard = ({
  fen,
  onMove,
  getAvailableMoves,
  isMyTurn,
  myColor,
  whitePalette,
  blackPalette,
  movedSquares,
  disabled = false,
  onMoveResult,
  enPensentEnabled = false,
  enPensentOpacity = 0.7,
  moveHistory = [],
}: PlayableChessBoardProps) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [availableMoves, setAvailableMoves] = useState<Square[]>([]);
  const [touchFeedback, setTouchFeedback] = useState<Square | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const { haptics } = useHapticFeedback();

  // Try to use legend highlight context for reverse highlighting
  let legendContext: ReturnType<typeof useLegendHighlight> | null = null;
  try {
    legendContext = useLegendHighlight();
  } catch {
    // Context not available
  }

  const board = useMemo(() => parseFen(fen), [fen]);
  const flipped = myColor === 'b';

  // Build a map of square -> pieces that visited it (for hover highlighting)
  const squarePieceMap = useMemo(() => {
    const map = new Map<string, HighlightedPiece[]>();
    
    for (const move of moveHistory) {
      const existing = map.get(move.square) || [];
      // Check if this piece is already in the list
      const alreadyExists = existing.some(
        p => p.pieceType === move.piece && p.pieceColor === move.color
      );
      if (!alreadyExists) {
        existing.push({ pieceType: move.piece, pieceColor: move.color });
        map.set(move.square, existing);
      }
    }
    
    return map;
  }, [moveHistory]);

  const getPieceColor = (piece: string, row: number, col: number): string => {
    const square = indexToSquare(row, col);
    const hasBeenMoved = movedSquares.has(square);
    
    // If square hasn't been moved to yet, return transparent/faded
    if (!hasBeenMoved && movedSquares.size > 0) {
      return 'rgba(128, 128, 128, 0.15)';
    }
    
    const isWhite = piece === piece.toUpperCase();
    const pieceType = piece.toLowerCase() as PieceType;
    const palette = isWhite ? whitePalette : blackPalette;
    
    return palette[pieceType] || '#888888';
  };

  const handleSquareInteraction = useCallback(async (row: number, col: number) => {
    if (disabled || !isMyTurn) return;

    const square = indexToSquare(flipped ? 7 - row : row, flipped ? 7 - col : col);
    const piece = board[flipped ? 7 - row : row]?.[flipped ? 7 - col : col];

    // Touch feedback
    setTouchFeedback(square);
    setTimeout(() => setTouchFeedback(null), 150);

    // If we have a selected piece and click on an available move
    if (selectedSquare && availableMoves.includes(square)) {
      // Check if this is a capture (target square has opponent piece)
      const targetPiece = board[flipped ? 7 - row : row]?.[flipped ? 7 - col : col];
      const isCapture = !!targetPiece;
      
      // Haptic feedback for the move attempt
      if (isCapture) {
        haptics.capture();
      } else {
        haptics.move();
      }
      
      const success = await onMove(selectedSquare, square);
      if (success) {
        setSelectedSquare(null);
        setAvailableMoves([]);
      } else {
        // Illegal move
        haptics.error();
      }
      return;
    }

    // If clicking on own piece, select it
    if (piece) {
      const isOwnPiece = myColor === 'w' 
        ? piece === piece.toUpperCase() 
        : piece === piece.toLowerCase();
      
      if (isOwnPiece) {
        haptics.select();
        setSelectedSquare(square);
        setAvailableMoves(getAvailableMoves(square));
        return;
      }
    }

    // Deselect
    setSelectedSquare(null);
    setAvailableMoves([]);
  }, [board, selectedSquare, availableMoves, isMyTurn, myColor, flipped, disabled, onMove, getAvailableMoves, haptics]);


  // Handle square hover for legend highlighting
  const handleSquareHover = useCallback((square: string) => {
    if (!legendContext?.setHoveredSquare) return;
    
    const pieces = squarePieceMap.get(square);
    if (pieces && pieces.length > 0) {
      legendContext.setHoveredSquare({ square, pieces });
    } else {
      // Clear hover when moving to a square with no history
      legendContext.setHoveredSquare(null);
    }
  }, [legendContext, squarePieceMap]);

  const handleSquareLeave = useCallback(() => {
    if (legendContext?.setHoveredSquare) {
      legendContext.setHoveredSquare(null);
    }
  }, [legendContext]);

  // Check if this square should be highlighted based on legend selection
  const isSquareHighlighted = useCallback((square: string) => {
    if (!legendContext) return false;
    
    const { highlightedPiece, lockedPieces } = legendContext;
    const piecesToCheck = lockedPieces.length > 0 ? lockedPieces : (highlightedPiece ? [highlightedPiece] : []);
    
    if (piecesToCheck.length === 0) return false;
    
    // Check if any of the highlighted pieces visited this square
    for (const move of moveHistory) {
      for (const piece of piecesToCheck) {
        if (move.square === square && move.piece === piece.pieceType && move.color === piece.pieceColor) {
          return true;
        }
      }
    }
    return false;
  }, [legendContext, moveHistory]);

  // Check if filtering is active (any piece highlighted in legend)
  const hasActiveFilter = legendContext && (
    legendContext.highlightedPiece !== null || 
    legendContext.lockedPieces.length > 0
  );

  const renderSquare = (row: number, col: number) => {
    const actualRow = flipped ? 7 - row : row;
    const actualCol = flipped ? 7 - col : col;
    const square = indexToSquare(actualRow, actualCol);
    const piece = board[actualRow]?.[actualCol];
    const isLight = (row + col) % 2 === 0;
    const isSelected = selectedSquare === square;
    const isAvailableMove = availableMoves.includes(square);
    const hasBeenMoved = movedSquares.has(square);
    const isTouched = touchFeedback === square;
    const hasPieceHistory = squarePieceMap.has(square);
    const isHighlightedByLegend = isSquareHighlighted(square);
    
    // Dim squares that don't match when legend filter is active
    const shouldDimSquare = hasActiveFilter && hasPieceHistory && !isHighlightedByLegend;
    const shouldHighlightSquare = hasActiveFilter && isHighlightedByLegend;

    return (
      <motion.div
        key={square}
        onClick={() => handleSquareInteraction(row, col)}
        onMouseEnter={() => handleSquareHover(square)}
        onMouseLeave={handleSquareLeave}
        onTouchEnd={(e) => {
          // Mobile: long-press or double-tap to show legend info
          if (enPensentEnabled && hasPieceHistory) {
            e.stopPropagation();
            handleSquareHover(square);
            // Clear after a short delay so user can see the legend highlight
            setTimeout(() => handleSquareLeave(), 2000);
          }
        }}
        onTouchStart={(e) => {
          // Prevent default to avoid double-tap zoom on mobile
          e.stopPropagation();
        }}
        className={`
          relative aspect-square cursor-pointer transition-all
          ${isLight ? 'bg-amber-100' : 'bg-amber-700'}
          ${isSelected ? 'ring-4 ring-primary ring-inset z-10' : ''}
          ${isTouched ? 'brightness-125' : ''}
          ${!isMyTurn || disabled ? 'cursor-default' : ''}
          ${hasPieceHistory && enPensentEnabled ? 'hover:ring-2 hover:ring-amber-400/50' : ''}
          ${shouldDimSquare ? 'opacity-30' : ''}
          ${shouldHighlightSquare ? 'ring-2 ring-sky-400/70 z-5' : ''}
          touch-manipulation select-none
        `}
        style={{
          // Larger touch target with invisible padding
          WebkitTapHighlightColor: 'transparent',
          transition: 'opacity 0.2s ease-out',
        }}
        whileTap={isMyTurn && !disabled ? { scale: 0.95 } : {}}
      >
        {/* Available move indicator - larger on mobile */}
        {isAvailableMove && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            {piece ? (
              <div className="absolute inset-1 sm:inset-1.5 rounded-full border-4 sm:border-[5px] border-primary/60" />
            ) : (
              <div className="w-1/3 h-1/3 sm:w-[30%] sm:h-[30%] rounded-full bg-primary/50" />
            )}
          </motion.div>
        )}

        {/* Piece - larger text for mobile touch targets */}
        {piece && (
          <motion.div
            layout
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: hasBeenMoved || movedSquares.size === 0 ? 1 : 0.15 
            }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              color: getPieceColor(piece, actualRow, actualCol),
              filter: hasBeenMoved || movedSquares.size === 0 ? 'none' : 'grayscale(100%)',
            }}
          >
            <span className="text-[2.5rem] sm:text-4xl md:text-5xl lg:text-6xl select-none drop-shadow-md leading-none">
              {PIECE_SYMBOLS[piece]}
            </span>
          </motion.div>
        )}

        {/* Coordinate labels - hidden on very small screens */}
        {col === 0 && (
          <span className="absolute top-0.5 left-0.5 sm:left-1 text-[10px] sm:text-xs font-display opacity-50 select-none">
            {8 - actualRow}
          </span>
        )}
        {row === 7 && (
          <span className="absolute bottom-0.5 right-0.5 sm:right-1 text-[10px] sm:text-xs font-display opacity-50 select-none">
            {String.fromCharCode(97 + actualCol)}
          </span>
        )}
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto px-1 sm:px-0">
      {/* Turn indicator for mobile - shows clearly whose turn */}
      <div className="sm:hidden mb-2 text-center">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-display uppercase tracking-wider ${
          isMyTurn && !disabled
            ? 'bg-primary/20 text-primary animate-pulse'
            : 'bg-muted text-muted-foreground'
        }`}>
          {disabled ? 'Game Over' : isMyTurn ? 'Your Turn - Tap to Move' : "Opponent's Turn"}
        </span>
      </div>
      
      <div 
        ref={boardRef}
        className="relative grid grid-cols-8 border-2 sm:border-4 border-amber-900 rounded-lg overflow-hidden shadow-2xl touch-manipulation"
        style={{
          // Prevent any scrolling while interacting with the board
          touchAction: 'none',
        }}
      >
        {Array.from({ length: 64 }).map((_, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          return renderSquare(row, col);
        })}
        
        {/* En Pensent Visualization Overlay */}
        <EnPensentOverlay
          moveHistory={moveHistory}
          whitePalette={whitePalette}
          blackPalette={blackPalette}
          opacity={enPensentOpacity}
          isEnabled={enPensentEnabled}
          flipped={flipped}
        />
      </div>

      {/* Selected piece indicator for mobile */}
      {selectedSquare && (
        <div className="sm:hidden mt-2 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-display uppercase tracking-wider">
            {availableMoves.length} move{availableMoves.length !== 1 ? 's' : ''} available
          </span>
        </div>
      )}
    </div>
  );
};