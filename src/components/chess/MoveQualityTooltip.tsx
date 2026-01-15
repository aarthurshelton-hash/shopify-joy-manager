/**
 * Move Quality Tooltip Component
 * 
 * Displays detailed hover information about move quality,
 * including book moves and opening/variant details.
 */

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BookOpen, Info, Target, Zap } from 'lucide-react';
import { ClassifiedMove, MOVE_QUALITY_INFO } from '@/lib/chess/moveQuality';
import { ChessOpening, detectOpening } from '@/lib/chess/chessAnalysis';
import { Chess } from 'chess.js';

interface BookMoveDetails {
  moveNumber: number;
  san: string;
  color: 'w' | 'b';
}

interface OpeningInfo {
  opening: ChessOpening | undefined;
  bookMoves: BookMoveDetails[];
  lastBookMoveNumber: number;
}

/**
 * Extract opening and book move information from classified moves
 */
export function extractOpeningInfo(pgn: string, classifiedMoves: ClassifiedMove[]): OpeningInfo {
  // Get opening from PGN
  const chess = new Chess();
  let moves: string[] = [];
  
  try {
    chess.loadPgn(pgn);
    moves = chess.history();
  } catch {
    // If PGN fails, extract from classified moves
    moves = classifiedMoves.map(m => m.san);
  }
  
  const opening = detectOpening(moves);
  
  // Extract book moves from classified moves
  const bookMoves: BookMoveDetails[] = classifiedMoves
    .filter(m => m.quality === 'book')
    .map(m => ({
      moveNumber: m.moveNumber,
      san: m.san,
      color: m.color,
    }));
  
  const lastBookMoveNumber = bookMoves.length > 0 
    ? Math.max(...bookMoves.map(m => m.moveNumber))
    : 0;
  
  return {
    opening,
    bookMoves,
    lastBookMoveNumber,
  };
}

interface MoveQualityTooltipProps {
  children: React.ReactNode;
  quality: keyof typeof MOVE_QUALITY_INFO;
  count: number;
  openingInfo?: OpeningInfo;
  classifiedMoves?: ClassifiedMove[];
}

/**
 * Individual move quality stat with tooltip
 */
export function MoveQualityTooltip({ 
  children, 
  quality, 
  count,
  openingInfo,
  classifiedMoves,
}: MoveQualityTooltipProps) {
  const info = MOVE_QUALITY_INFO[quality];
  
  // Get specific moves of this quality
  const movesOfQuality = classifiedMoves?.filter(m => m.quality === quality) || [];
  
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="max-w-xs p-3 space-y-2"
        sideOffset={8}
      >
        <div className="flex items-center gap-2 border-b border-border/30 pb-2">
          <span 
            className="text-lg font-bold"
            style={{ color: info.color }}
          >
            {info.symbol}
          </span>
          <div>
            <p className="font-semibold" style={{ color: info.color }}>
              {info.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {count} move{count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          {info.description}
        </p>
        
        {quality === 'book' && openingInfo && (
          <div className="space-y-2 pt-1">
            {openingInfo.opening && (
              <div className="bg-emerald-500/10 rounded p-2 border border-emerald-500/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <BookOpen className="h-3 w-3 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">
                    Opening Detected
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {openingInfo.opening.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  ECO: {openingInfo.opening.eco} • {openingInfo.opening.category}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {openingInfo.opening.description}
                </p>
              </div>
            )}
            
            {openingInfo.bookMoves.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Book Moves Played
                </p>
                <div className="flex flex-wrap gap-1">
                  {openingInfo.bookMoves.slice(0, 10).map((m, i) => (
                    <span 
                      key={i}
                      className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    >
                      {m.moveNumber}.{m.color === 'b' ? '..' : ''}{m.san}
                    </span>
                  ))}
                  {openingInfo.bookMoves.length > 10 && (
                    <span className="text-xs text-muted-foreground">
                      +{openingInfo.bookMoves.length - 10} more
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Theory followed through move {openingInfo.lastBookMoveNumber}
                </p>
              </div>
            )}
          </div>
        )}
        
        {quality !== 'book' && movesOfQuality.length > 0 && movesOfQuality.length <= 8 && (
          <div className="pt-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Moves
            </p>
            <div className="flex flex-wrap gap-1">
              {movesOfQuality.map((m, i) => (
                <span 
                  key={i}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ 
                    backgroundColor: `${info.color}15`,
                    color: info.color,
                    border: `1px solid ${info.color}30`
                  }}
                >
                  {m.moveNumber}.{m.color === 'b' ? '..' : ''}{m.san}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {info.cpLossRange && (
          <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/30">
            <Target className="h-3 w-3 inline mr-1" />
            {info.cpLossRange}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

interface BookMovesCardProps {
  count: number;
  openingInfo: OpeningInfo;
}

/**
 * Dedicated Book Moves display card with hover details
 */
export function BookMovesCard({ count, openingInfo }: BookMovesCardProps) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div className="mb-3 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-center cursor-help transition-all hover:bg-emerald-500/15 hover:border-emerald-500/30">
          <span className="text-xs text-emerald-400">
            📖 {count} Opening Book Moves
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="max-w-sm p-4 space-y-3"
        sideOffset={8}
      >
        <div className="flex items-center gap-2 border-b border-border/30 pb-2">
          <BookOpen className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="font-semibold text-emerald-400">Opening Theory</p>
            <p className="text-xs text-muted-foreground">
              {count} move{count !== 1 ? 's' : ''} from established theory
            </p>
          </div>
        </div>
        
        {openingInfo.opening ? (
          <div className="space-y-2">
            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
              <p className="text-sm font-bold text-foreground">
                {openingInfo.opening.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  ECO: {openingInfo.opening.eco}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                  {openingInfo.opening.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {openingInfo.opening.description}
              </p>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Main Line: </span>
              <span className="font-mono text-[10px]">{openingInfo.opening.moves}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Moves follow general opening principles
          </p>
        )}
        
        {openingInfo.bookMoves.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Book Moves in This Game
            </p>
            <div className="flex flex-wrap gap-1">
              {openingInfo.bookMoves.map((m, i) => (
                <span 
                  key={i}
                  className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono"
                >
                  {m.moveNumber}.{m.color === 'b' ? '..' : ''}{m.san}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-[10px] text-muted-foreground pt-2 border-t border-border/30 flex items-start gap-1.5">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          <span>
            Book moves are recognized moves from chess opening databases, 
            indicating adherence to established theory and best practices.
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default MoveQualityTooltip;
