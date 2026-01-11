import { useState, useCallback, useMemo } from 'react';
import { Square } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { PieceType } from '@/lib/chess/pieceColors';

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
}: PlayableChessBoardProps) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [availableMoves, setAvailableMoves] = useState<Square[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const board = useMemo(() => parseFen(fen), [fen]);
  const flipped = myColor === 'b';

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

  const handleSquareClick = useCallback(async (row: number, col: number) => {
    if (disabled || !isMyTurn) return;

    const square = indexToSquare(flipped ? 7 - row : row, flipped ? 7 - col : col);
    const piece = board[flipped ? 7 - row : row]?.[flipped ? 7 - col : col];

    // If we have a selected piece and click on an available move
    if (selectedSquare && availableMoves.includes(square)) {
      const success = await onMove(selectedSquare, square);
      if (success) {
        setSelectedSquare(null);
        setAvailableMoves([]);
      }
      return;
    }

    // If clicking on own piece, select it
    if (piece) {
      const isOwnPiece = myColor === 'w' 
        ? piece === piece.toUpperCase() 
        : piece === piece.toLowerCase();
      
      if (isOwnPiece) {
        setSelectedSquare(square);
        setAvailableMoves(getAvailableMoves(square));
        return;
      }
    }

    // Deselect
    setSelectedSquare(null);
    setAvailableMoves([]);
  }, [board, selectedSquare, availableMoves, isMyTurn, myColor, flipped, disabled, onMove, getAvailableMoves]);

  const renderSquare = (row: number, col: number) => {
    const actualRow = flipped ? 7 - row : row;
    const actualCol = flipped ? 7 - col : col;
    const square = indexToSquare(actualRow, actualCol);
    const piece = board[actualRow]?.[actualCol];
    const isLight = (row + col) % 2 === 0;
    const isSelected = selectedSquare === square;
    const isAvailableMove = availableMoves.includes(square);
    const hasBeenMoved = movedSquares.has(square);

    return (
      <motion.div
        key={square}
        onClick={() => handleSquareClick(row, col)}
        className={`
          relative aspect-square cursor-pointer transition-all
          ${isLight ? 'bg-amber-100' : 'bg-amber-700'}
          ${isSelected ? 'ring-4 ring-primary ring-inset' : ''}
          ${!isMyTurn || disabled ? 'cursor-default' : 'hover:brightness-110'}
        `}
        whileHover={isMyTurn && !disabled ? { scale: 1.02 } : {}}
        whileTap={isMyTurn && !disabled ? { scale: 0.98 } : {}}
      >
        {/* Available move indicator */}
        {isAvailableMove && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`
              absolute inset-0 flex items-center justify-center z-10
              ${piece ? '' : ''}
            `}
          >
            {piece ? (
              <div className="absolute inset-1 rounded-full border-4 border-primary/50" />
            ) : (
              <div className="w-1/3 h-1/3 rounded-full bg-primary/40" />
            )}
          </motion.div>
        )}

        {/* Piece */}
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
            <span className="text-4xl md:text-5xl lg:text-6xl select-none drop-shadow-md">
              {PIECE_SYMBOLS[piece]}
            </span>
          </motion.div>
        )}

        {/* Coordinate labels */}
        {col === 0 && (
          <span className="absolute top-0.5 left-1 text-xs font-display opacity-50">
            {8 - actualRow}
          </span>
        )}
        {row === 7 && (
          <span className="absolute bottom-0.5 right-1 text-xs font-display opacity-50">
            {String.fromCharCode(97 + actualCol)}
          </span>
        )}
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="grid grid-cols-8 border-4 border-amber-900 rounded-lg overflow-hidden shadow-2xl">
        {Array.from({ length: 64 }).map((_, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          return renderSquare(row, col);
        })}
      </div>
    </div>
  );
};
