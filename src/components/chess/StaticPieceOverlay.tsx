import React, { useMemo } from 'react';
import { Chess } from 'chess.js';

// Unicode chess piece characters
const PIECE_SYMBOLS: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

interface StaticPieceOverlayProps {
  pgn: string;
  currentMoveNumber?: number;
  size: number;
  pieceOpacity?: number;
}

/**
 * A simple static piece overlay that renders chess pieces without requiring
 * any React context. Used for exports, GIF generation, and print rendering.
 */
export const StaticPieceOverlay: React.FC<StaticPieceOverlayProps> = ({
  pgn,
  currentMoveNumber,
  size,
  pieceOpacity = 0.7,
}) => {
  const squareSize = size / 8;

  const piecePositions = useMemo(() => {
    if (!pgn || typeof pgn !== 'string' || pgn.trim().length < 2) {
      return [];
    }

    try {
      // First load PGN to get all moves
      const fullGame = new Chess();
      fullGame.loadPgn(pgn);
      const allMoves = fullGame.history({ verbose: true });

      // Replay to the target move number
      const chess = new Chess();
      const targetMove = currentMoveNumber ?? allMoves.length;
      const movesToPlay = Math.min(targetMove, allMoves.length);

      for (let i = 0; i < movesToPlay; i++) {
        chess.move(allMoves[i].san);
      }

      const boardState = chess.board();
      const pieces: { square: string; piece: string; color: 'w' | 'b'; row: number; col: number }[] = [];

      for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
        for (let file = 0; file < 8; file++) {
          const piece = boardState[rowIndex]?.[file];
          if (piece) {
            const rank = 7 - rowIndex;
            const square = `${String.fromCharCode(97 + file)}${rank + 1}`;
            pieces.push({
              square,
              piece: piece.type,
              color: piece.color,
              row: rowIndex,
              col: file,
            });
          }
        }
      }
      return pieces;
    } catch (e) {
      console.error('Error parsing PGN for static piece overlay:', e);
      return [];
    }
  }, [pgn, currentMoveNumber]);

  if (piecePositions.length === 0) {
    return null;
  }

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {piecePositions.map((p, idx) => {
        const symbol = p.color === 'w' 
          ? PIECE_SYMBOLS[p.piece.toUpperCase()] 
          : PIECE_SYMBOLS[p.piece.toLowerCase()];
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: p.col * squareSize,
              top: p.row * squareSize,
              width: squareSize,
              height: squareSize,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: squareSize * 0.75,
              opacity: pieceOpacity,
              color: p.color === 'w' ? '#ffffff' : '#1a1a1a',
              textShadow: p.color === 'w' 
                ? '0 1px 3px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.8)' 
                : '0 1px 2px rgba(255,255,255,0.3)',
              fontFamily: 'serif',
            }}
          >
            {symbol}
          </div>
        );
      })}
    </div>
  );
};

export default StaticPieceOverlay;
