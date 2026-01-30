/**
 * Unified Vision Renderer
 * 
 * The single source of truth for rendering Visions.
 * Used by preview, export, print - ensures consistency.
 */

import React, { forwardRef, useMemo } from 'react';
import { Chess } from 'chess.js';
import ChessBoardVisualization from '../ChessBoardVisualization';
import { EnPensentOverlay, MoveHistoryEntry } from '../EnPensentOverlay';
import StaticPieceOverlay from '../StaticPieceOverlay';
import { SquareData } from '@/lib/chess/gameSimulator';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { HighlightedPiece } from '@/contexts/LegendHighlightContext';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

// Default palettes for when none provided
const DEFAULT_WHITE_PALETTE: Record<PieceType, string> = {
  k: '#3B82F6', q: '#60A5FA', r: '#93C5FD', b: '#BFDBFE', n: '#DBEAFE', p: '#EFF6FF'
};
const DEFAULT_BLACK_PALETTE: Record<PieceType, string> = {
  k: '#EF4444', q: '#F87171', r: '#FCA5A5', b: '#FECACA', n: '#FEE2E2', p: '#FEF2F2'
};

interface UnifiedVisionRendererProps {
  // Board data (one of these is required)
  board?: SquareData[][];
  moveHistory?: MoveHistoryEntry[];
  
  // Size
  size: number;
  
  // Palettes
  whitePalette: Record<PieceType, string>;
  blackPalette: Record<PieceType, string>;
  
  // Display settings
  showPieces: boolean;
  pieceOpacity: number;
  darkMode: boolean;
  
  // Legend state
  highlightedPieces?: Array<{ pieceType: PieceType; pieceColor: PieceColor }>;
  compareMode?: boolean;
  
  // PGN for piece positions
  pgn?: string;
  currentMoveNumber?: number;
  
  // Watermark for free exports
  withWatermark?: boolean;
  
  // QR code for premium prints
  showQR?: boolean;
  qrDataUrl?: string;
}

export const UnifiedVisionRenderer = forwardRef<HTMLDivElement, UnifiedVisionRendererProps>(({
  board,
  moveHistory,
  size,
  whitePalette,
  blackPalette,
  showPieces,
  pieceOpacity,
  darkMode,
  highlightedPieces,
  compareMode,
  pgn,
  currentMoveNumber,
  withWatermark = false,
  showQR = false,
  qrDataUrl,
}, ref) => {
  
  // Calculate piece positions if PGN provided
  const effectiveMoveNumber = useMemo(() => {
    if (currentMoveNumber !== undefined) return currentMoveNumber;
    if (!pgn) return undefined;
    
    try {
      const chess = new Chess();
      chess.loadPgn(pgn);
      return chess.history().length;
    } catch {
      return undefined;
    }
  }, [pgn, currentMoveNumber]);

  // Convert highlighted pieces to HighlightedPiece format
  const overrideHighlightedPieces: HighlightedPiece[] | undefined = highlightedPieces?.map(p => ({
    pieceType: p.pieceType,
    pieceColor: p.pieceColor,
  }));

  // Use provided palettes or defaults
  const effectiveWhitePalette = Object.keys(whitePalette).length > 0 
    ? whitePalette 
    : DEFAULT_WHITE_PALETTE;
  const effectiveBlackPalette = Object.keys(blackPalette).length > 0 
    ? blackPalette 
    : DEFAULT_BLACK_PALETTE;

  // Render the base board
  const renderBoard = () => {
    // If we have move history (live game / EnPensent overlay)
    if (moveHistory && moveHistory.length > 0) {
      return (
        <div style={{ position: 'relative', width: size, height: size }}>
          {/* Base grid */}
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
            moveHistory={moveHistory}
            whitePalette={effectiveWhitePalette}
            blackPalette={effectiveBlackPalette}
            opacity={0.85}
            isEnabled={true}
            flipped={false}
          />
          
          {/* Pieces overlay */}
          {showPieces && pgn && (
            <StaticPieceOverlay
              pgn={pgn}
              currentMoveNumber={effectiveMoveNumber}
              size={size}
              pieceOpacity={pieceOpacity}
            />
          )}
        </div>
      );
    }
    
    // If we have simulation board data
    if (board) {
      return (
        <div style={{ position: 'relative', width: size, height: size }}>
          <ChessBoardVisualization 
            board={board} 
            size={size}
            overrideHighlightedPieces={overrideHighlightedPieces}
            overrideCompareMode={compareMode}
          />
          
          {/* Pieces overlay */}
          {showPieces && pgn && (
            <StaticPieceOverlay
              pgn={pgn}
              currentMoveNumber={effectiveMoveNumber}
              size={size}
              pieceOpacity={pieceOpacity}
            />
          )}
        </div>
      );
    }
    
    // Fallback: empty grid
    return (
      <div style={{ 
        width: size, 
        height: size,
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

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: size,
        height: size,
      }}
    >
      {renderBoard()}
      
      {/* Watermark overlay for free exports */}
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
          <img
            src={enPensentLogo}
            alt="En Pensent"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span
              style={{
                fontSize: 12,
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
                fontSize: 10,
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
      
      {/* QR code for premium prints */}
      {showQR && qrDataUrl && !withWatermark && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            padding: 4,
            borderRadius: 4,
            border: '1px solid rgba(212, 175, 55, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <div style={{ position: 'relative', width: 40, height: 40 }}>
            <img 
              src={qrDataUrl} 
              alt="QR" 
              style={{ width: 40, height: 40, display: 'block' }} 
            />
            <img
              src={enPensentLogo}
              alt=""
              style={{
                position: 'absolute',
                width: 12,
                height: 12,
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
              fontSize: 6,
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
  );
});

UnifiedVisionRenderer.displayName = 'UnifiedVisionRenderer';

export default UnifiedVisionRenderer;
