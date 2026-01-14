import React, { useMemo } from 'react';
import { Chess } from 'chess.js';
import ChessBoardVisualization from './ChessBoardVisualization';
import GameInfoDisplay from './GameInfoDisplay';
import { EnPensentOverlay, MoveHistoryEntry } from './EnPensentOverlay';
import { SquareData } from '@/lib/chess/gameSimulator';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { HighlightedPiece } from '@/contexts/LegendHighlightContext';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

// Unicode chess piece characters
const PIECE_SYMBOLS: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

interface GameData {
  white: string;
  black: string;
  event?: string;
  date?: string;
  result?: string;
  moves?: string[];
  pgn?: string;
}

interface EnPensentData {
  moveHistory: MoveHistoryEntry[];
  whitePalette: Record<PieceType, string>;
  blackPalette: Record<PieceType, string>;
}

// Highlight state for export rendering
interface HighlightState {
  lockedPieces: Array<{ pieceType: PieceType; pieceColor: PieceColor }>;
  compareMode: boolean;
}

// Pieces overlay state for export rendering
interface PiecesState {
  showPieces: boolean;
  pieceOpacity: number;
  currentMoveNumber?: number; // The move to show pieces at
}

interface PrintReadyVisualizationProps {
  // Standard simulation-based rendering
  board?: SquareData[][];
  gameData: GameData;
  size?: number;
  darkMode?: boolean;
  showQR?: boolean;
  qrDataUrl?: string;
  compact?: boolean; // For wall mockup - smaller text
  title?: string;
  
  // EnPensent live game rendering (alternative to board)
  enPensentData?: EnPensentData;
  
  // Optional highlight state for export (captures locked pieces, compare mode)
  highlightState?: HighlightState;
  
  // Optional pieces overlay state for export
  piecesState?: PiecesState;
  
  // PGN for piece position calculation
  pgn?: string;
  
  // Watermark for free downloads
  withWatermark?: boolean;
}

/**
 * The unified "trademark look" visualization that matches our premium downloads.
 * This component is used for:
 * - Wall mockup preview
 * - Print image generation (Printify)
 * - Premium downloads
 * - Order print page preview
 * 
 * Supports both:
 * - Simulation-based board data (SquareData[][])
 * - EnPensent live game data (MoveHistoryEntry[])
 */
export const PrintReadyVisualization: React.FC<PrintReadyVisualizationProps> = ({
  board,
  gameData,
  size = 300,
  darkMode = false,
  showQR = false,
  qrDataUrl,
  compact = false,
  title,
  enPensentData,
  highlightState,
  piecesState,
  pgn,
  withWatermark = false,
}) => {
  const bgColor = darkMode ? '#0A0A0A' : '#FDFCFB';
  const borderColor = darkMode ? '#292524' : '#e7e5e4';
  const mutedColor = darkMode ? '#78716c' : '#a8a29e';
  const primaryText = darkMode ? '#e7e5e4' : '#292524';
  const secondaryText = darkMode ? '#a8a29e' : '#78716c';
  
  // Scale factor for compact mode (wall mockup)
  const padding = compact ? 4 : 24;
  const boardSize = size - (padding * 2);
  const squareSize = boardSize / 8;

  // Calculate piece positions for overlay at the specific move number
  const piecePositions = useMemo(() => {
    if (!piecesState?.showPieces) return [];
    
    const pgnToUse = pgn || gameData.pgn;
    if (!pgnToUse) return [];
    
    try {
      // First load PGN to get all moves
      const fullGame = new Chess();
      fullGame.loadPgn(pgnToUse);
      const allMoves = fullGame.history({ verbose: true });
      
      // Replay to the target move number
      const chess = new Chess();
      const targetMove = piecesState.currentMoveNumber ?? allMoves.length;
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
      console.error('Error parsing PGN for piece positions:', e);
      return [];
    }
  }, [piecesState?.showPieces, piecesState?.currentMoveNumber, pgn, gameData.pgn]);

  // Render the chess board - either EnPensent overlay or standard visualization
  const renderBoard = () => {
    if (enPensentData) {
      return (
        <div style={{ position: 'relative', width: boardSize, height: boardSize }}>
          {/* Base chess grid */}
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'grid', 
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(8, 1fr)',
          }}>
            {Array.from({ length: 64 }).map((_, i) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const isLight = (row + col) % 2 === 0;
              return (
                <div
                  key={i}
                  style={{ backgroundColor: isLight ? '#e7e5e4' : '#78716c' }}
                />
              );
            })}
          </div>
          {/* EnPensent Overlay */}
          <EnPensentOverlay
            moveHistory={enPensentData.moveHistory}
            whitePalette={enPensentData.whitePalette}
            blackPalette={enPensentData.blackPalette}
            opacity={0.85}
            isEnabled={true}
            flipped={false}
          />
        </div>
      );
    }
    
    if (board) {
      // Convert highlight state to HighlightedPiece array for the visualization
      const overrideHighlightedPieces: HighlightedPiece[] | undefined = highlightState?.lockedPieces.map(p => ({
        pieceType: p.pieceType,
        pieceColor: p.pieceColor,
      }));
      
      return (
        <div style={{ position: 'relative', width: boardSize, height: boardSize }}>
          <ChessBoardVisualization 
            board={board} 
            size={boardSize}
            overrideHighlightedPieces={overrideHighlightedPieces}
            overrideCompareMode={highlightState?.compareMode}
          />
          {/* Pieces overlay */}
          {piecesState?.showPieces && piecePositions.length > 0 && (
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
                      opacity: piecesState.pieceOpacity,
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
          )}
        </div>
      );
    }
    
    // Fallback: empty chess grid
    return (
      <div style={{ 
        width: boardSize, 
        height: boardSize,
        display: 'grid', 
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(8, 1fr)',
      }}>
        {Array.from({ length: 64 }).map((_, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          const isLight = (row + col) % 2 === 0;
          return (
            <div
              key={i}
              style={{ backgroundColor: isLight ? '#e7e5e4' : '#78716c' }}
            />
          );
        })}
      </div>
    );
  };

  // For compact mode (wall mockup), use simplified display
  if (compact) {
    return (
      <div
        style={{
          backgroundColor: bgColor,
          padding: `${padding}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          width: 'fit-content',
          borderRadius: 1,
        }}
      >
        {/* Chess Board */}
        <div style={{ position: 'relative' }}>
          {renderBoard()}
        </div>

        {/* Compact Game Info - Trademark style */}
        <div
          style={{
            width: '100%',
            paddingTop: 2,
            borderTop: `1px solid ${borderColor}`,
            textAlign: 'center',
          }}
        >
          {/* Player Names */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}>
            <span style={{ 
              fontSize: 4.5, 
              fontWeight: 600, 
              color: primaryText,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              fontFamily: "'Cinzel', 'Times New Roman', serif",
            }}>
              {gameData.white}
            </span>
            <span style={{ 
              fontSize: 3, 
              color: secondaryText,
              fontStyle: 'italic',
            }}>
              vs
            </span>
            <span style={{ 
              fontSize: 4.5, 
              fontWeight: 600, 
              color: primaryText,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              fontFamily: "'Cinzel', 'Times New Roman', serif",
            }}>
              {gameData.black}
            </span>
          </div>
          
          {/* Event */}
          <p style={{ 
            fontSize: 3, 
            color: mutedColor,
            margin: '1px 0 0 0',
            fontStyle: 'italic',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}>
            {gameData.event || 'Chess Game'}
          </p>
        </div>
        
        {/* Branding footer */}
        <p style={{ 
          fontSize: 2.5, 
          color: mutedColor,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          ♔ En Pensent ♚
        </p>
      </div>
    );
  }

  // Full "trademark look" display
  return (
    <div
      style={{
        backgroundColor: bgColor,
        padding: `${padding}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        width: 'fit-content',
        borderRadius: 4,
        border: `1px solid ${borderColor}`,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Chess Board */}
      <div style={{ position: 'relative' }}>
        {renderBoard()}
        
        {/* Watermark for free downloads - matches reference exactly */}
        {withWatermark && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #e7e5e4',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Logo */}
            <img
              src={enPensentLogo}
              alt="En Pensent"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
            
            {/* Text - using Inter for bold title, italic for URL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#292524',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  letterSpacing: '0.02em',
                }}
              >
                EN PENSENT
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: '#78716c',
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: 'italic',
                }}
              >
                enpensent.com
              </span>
            </div>
          </div>
        )}
        
        {/* QR Code overlay for premium prints */}
        {showQR && qrDataUrl && !withWatermark && (
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              padding: 3,
              borderRadius: 4,
              border: '1px solid rgba(212, 175, 55, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <div style={{ position: 'relative', width: 36, height: 36 }}>
              <img 
                src={qrDataUrl} 
                alt="QR" 
                style={{ width: 36, height: 36, display: 'block' }} 
              />
              <img
                src={enPensentLogo}
                alt=""
                style={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                }}
              />
            </div>
            <p
              style={{
                fontSize: 4,
                color: 'rgba(212, 175, 55, 0.5)',
                letterSpacing: '0.15em',
                margin: 0,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              SCAN
            </p>
          </div>
        )}
      </div>

      {/* Game Info Section - Using the same GameInfoDisplay component */}
      <div
        style={{
          width: '100%',
          paddingTop: 16,
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <GameInfoDisplay 
          gameData={{
            white: gameData.white,
            black: gameData.black,
            event: gameData.event || '',
            date: gameData.date || '',
            result: gameData.result || '',
            moves: gameData.moves || [],
            pgn: '',
          }} 
          title={title}
          darkMode={darkMode} 
        />
      </div>

      {/* Branding */}
      <p
        style={{
          fontSize: 10,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          fontWeight: 500,
          color: mutedColor,
          margin: 0,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        ♔ En Pensent ♚
      </p>
    </div>
  );
};

export default PrintReadyVisualization;
