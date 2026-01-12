import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Shield, 
  Target, 
  Crosshair,
  Clock,
  Zap,
  Trophy,
  MapPin,
  CheckCircle,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PieceType, PieceColor, getActivePalette } from '@/lib/chess/pieceColors';
import { SquareData } from '@/lib/chess/gameSimulator';
import { MoveHistoryEntry } from '@/components/chess/EnPensentOverlay';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

interface VisionInfoCardPreviewProps {
  board?: SquareData[][];
  gameData?: {
    white?: string;
    black?: string;
    event?: string;
    date?: string;
    result?: string;
  };
  moveHistory?: MoveHistoryEntry[];
  totalMoves: number;
  whitePalette: Record<string, string>;
  blackPalette: Record<string, string>;
  darkMode?: boolean;
  showSpecs?: boolean;
}

const PIECE_SYMBOLS: Record<PieceType, { w: string; b: string }> = {
  k: { w: '♚', b: '♔' },
  q: { w: '♛', b: '♕' },
  r: { w: '♜', b: '♖' },
  b: { w: '♝', b: '♗' },
  n: { w: '♞', b: '♘' },
  p: { w: '♟', b: '♙' },
};

const PIECE_NAMES: Record<PieceType, string> = {
  k: 'King', q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn'
};

export const VisionInfoCardPreview: React.FC<VisionInfoCardPreviewProps> = ({
  board,
  gameData: rawGameData,
  moveHistory = [],
  totalMoves,
  whitePalette,
  blackPalette,
  darkMode = false,
  showSpecs = true,
}) => {
  const palette = getActivePalette();
  const theme = palette.legendTheme;
  
  // Default game data for preview
  const gameData = rawGameData || {
    white: 'Player 1',
    black: 'Player 2',
    event: 'Chess Game',
    date: new Date().toLocaleDateString(),
    result: '1-0',
  };

  // Calculate piece activity statistics
  const pieceStats = useMemo(() => {
    const stats = new Map<string, { 
      moves: number; 
      squares: Set<string>; 
      captures: number;
      checks: number;
    }>();
    
    const pieceTypes: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
    const colors: PieceColor[] = ['w', 'b'];
    
    // If no move history, provide sample data for preview
    if (moveHistory.length === 0) {
      const sampleMoves: Record<string, number> = {
        'w-k': 4, 'w-q': 12, 'w-r': 8, 'w-b': 6, 'w-n': 7, 'w-p': 14,
        'b-k': 5, 'b-q': 10, 'b-r': 7, 'b-b': 5, 'b-n': 6, 'b-p': 13,
      };
      
      for (const color of colors) {
        for (const piece of pieceTypes) {
          const key = `${color}-${piece}`;
          stats.set(key, { 
            moves: sampleMoves[key] || 0, 
            squares: new Set(), 
            captures: 0,
            checks: 0,
          });
        }
      }
      return stats;
    }
    
    for (const color of colors) {
      for (const piece of pieceTypes) {
        stats.set(`${color}-${piece}`, { 
          moves: 0, 
          squares: new Set(), 
          captures: 0,
          checks: 0,
        });
      }
    }
    
    for (const move of moveHistory) {
      const key = `${move.color}-${move.piece}`;
      const stat = stats.get(key);
      if (stat) {
        stat.moves++;
        stat.squares.add(move.square);
      }
    }
    
    return stats;
  }, [moveHistory]);

  // Find MVP piece
  const mvpPiece = useMemo(() => {
    let maxActivity = 0;
    let mvp: { piece: PieceType; color: PieceColor; moves: number } | null = null;
    
    pieceStats.forEach((stat, key) => {
      if (stat.moves > maxActivity) {
        maxActivity = stat.moves;
        const [color, piece] = key.split('-') as [PieceColor, PieceType];
        mvp = { piece, color, moves: stat.moves };
      }
    });
    
    // Default to white pawn if no data
    if (!mvp && moveHistory.length === 0) {
      mvp = { piece: 'p', color: 'w', moves: 14 };
    }
    
    return mvp;
  }, [pieceStats, moveHistory]);

  // Calculate territory control
  const territoryStats = useMemo(() => {
    // If no board data, return sample values for preview
    if (!board || board.length === 0) {
      return {
        white: 28,
        black: 24,
        whitePercent: 44,
        blackPercent: 38,
      };
    }

    let whiteSquares = 0;
    let blackSquares = 0;
    
    for (const rank of board) {
      for (const square of rank) {
        const whiteVisits = square.visits.filter((v: any) => v.piece?.color === 'w' || v.color === 'w').length;
        const blackVisits = square.visits.filter((v: any) => v.piece?.color === 'b' || v.color === 'b').length;
        
        if (whiteVisits > blackVisits) whiteSquares++;
        else if (blackVisits > whiteVisits) blackSquares++;
      }
    }
    
    return {
      white: whiteSquares,
      black: blackSquares,
      whitePercent: Math.round((whiteSquares / 64) * 100),
      blackPercent: Math.round((blackSquares / 64) * 100),
    };
  }, [board]);

  // Game phase analysis
  const phaseAnalysis = useMemo(() => {
    const opening = Math.min(10, totalMoves);
    const middlegame = totalMoves > 10 ? Math.min(30, totalMoves) - 10 : 0;
    const endgame = totalMoves > 40 ? totalMoves - 40 : 0;
    
    return { opening, middlegame, endgame, total: totalMoves };
  }, [totalMoves]);

  const renderPieceRow = (color: PieceColor) => {
    const pal = color === 'w' ? whitePalette : blackPalette;
    const pieceTypes: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
    
    return (
      <div className="grid grid-cols-6 gap-1">
        {pieceTypes.map(piece => {
          const key = `${color}-${piece}`;
          const stat = pieceStats.get(key);
          const isMvp = mvpPiece?.piece === piece && mvpPiece?.color === color;
          const hexColor = pal[piece] || '#888';
          
          return (
            <div 
              key={key}
              className={`relative flex flex-col items-center p-1 rounded transition-all ${
                isMvp ? 'ring-1 ring-amber-400 bg-amber-400/10' : ''
              }`}
            >
              <div
                className="w-4 h-4 rounded shadow-sm mb-0.5"
                style={{ backgroundColor: hexColor }}
              />
              <span className="text-[10px]" style={{ color: hexColor }}>
                {PIECE_SYMBOLS[piece][color]}
              </span>
              <span className="text-[7px] font-mono text-muted-foreground">
                {stat?.moves || 0}
              </span>
              
              {isMvp && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Crown className="w-1.5 h-1.5 text-white" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Specifications Banner */}
      {showSpecs && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <Badge variant="secondary" className="gap-1 text-xs">
            <CreditCard className="w-3 h-3" />
            3.5" × 2" Premium Card
          </Badge>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Sparkles className="w-3 h-3" />
            400gsm Matte Finish
          </Badge>
          <Badge variant="secondary" className="gap-1 text-xs">
            <CheckCircle className="w-3 h-3" />
            UV Resistant Ink
          </Badge>
        </motion.div>
      )}

      {/* Card Preview Container - Realistic Card Mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <div className="relative">
          {/* Ambient shadow for realism */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-2xl transform translate-y-4 scale-95 opacity-50" />
          
          {/* The Physical Card Preview */}
          <Card className={`relative overflow-hidden shadow-2xl transform hover:rotate-1 transition-transform duration-500 ${
            darkMode ? 'bg-stone-900 text-stone-100' : 'bg-gradient-to-br from-stone-50 to-stone-100 text-stone-900'
          }`}
          style={{ 
            width: 280,
            aspectRatio: '3.5/2',
            borderRadius: 12,
          }}
          >
            {/* Subtle texture overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />
            
            <CardContent className="p-0 h-full flex flex-col">
              {/* Header Strip */}
              <div className={`px-3 py-1.5 flex items-center justify-between ${
                darkMode ? 'bg-stone-800' : 'bg-gradient-to-r from-stone-100 to-stone-200'
              }`}>
                <div className="flex items-center gap-1.5">
                  <img src={enPensentLogo} alt="En Pensent" className="w-4 h-4 rounded-full" />
                  <span className="text-[8px] font-display uppercase tracking-[0.15em] opacity-70">Vision Data</span>
                </div>
                <span className="text-[7px] font-mono opacity-40">#{totalMoves} moves</span>
              </div>
              
              {/* Main Content Grid */}
              <div className="flex-1 p-2 grid grid-cols-2 gap-2">
                {/* Left Column - Game Info & Pieces */}
                <div className="space-y-1.5">
                  {/* Game Title */}
                  <div className="text-center">
                    <h3 className="font-display font-bold text-[9px] leading-tight truncate">
                      {gameData.white || 'White'} vs {gameData.black || 'Black'}
                    </h3>
                    <p className="text-[6px] opacity-60 truncate">
                      {gameData.event || 'Chess Game'} {gameData.date ? `• ${gameData.date}` : ''}
                    </p>
                    {gameData.result && (
                      <Badge variant="secondary" className="h-3 px-1 mt-0.5 text-[6px]">
                        {gameData.result}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Piece Legend */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Zap className="w-2 h-2 text-primary" />
                      <span className="text-[6px] font-display uppercase tracking-wider opacity-70">Activity</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[6px] text-sky-400">
                        {theme?.whiteEmoji || '❄️'} {theme?.whiteName || 'White'}
                      </span>
                      {renderPieceRow('w')}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[6px] text-rose-400">
                        {theme?.blackEmoji || '🔥'} {theme?.blackName || 'Black'}
                      </span>
                      {renderPieceRow('b')}
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Stats & MVP */}
                <div className="space-y-1.5">
                  {/* Territory Control */}
                  <div className={`rounded p-1.5 ${darkMode ? 'bg-stone-800/50' : 'bg-stone-200/50'}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="w-2 h-2 text-primary" />
                      <span className="text-[6px] font-display uppercase tracking-wider">Territory</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-stone-300/30">
                        <div 
                          className="h-full bg-gradient-to-r from-sky-400 to-sky-500"
                          style={{ width: `${territoryStats.whitePercent}%` }}
                        />
                      </div>
                      <span className="text-[7px] font-mono w-6">{territoryStats.whitePercent}%</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-stone-300/30">
                        <div 
                          className="h-full bg-gradient-to-r from-rose-400 to-rose-500"
                          style={{ width: `${territoryStats.blackPercent}%` }}
                        />
                      </div>
                      <span className="text-[7px] font-mono w-6">{territoryStats.blackPercent}%</span>
                    </div>
                  </div>
                  
                  {/* Game Phases */}
                  <div className={`rounded p-1.5 ${darkMode ? 'bg-stone-800/50' : 'bg-stone-200/50'}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="w-2 h-2 text-primary" />
                      <span className="text-[6px] font-display uppercase tracking-wider">Phases</span>
                    </div>
                    <div className="flex items-center gap-0.5 h-2">
                      <div 
                        className="h-full rounded-l bg-emerald-500/80"
                        style={{ flex: phaseAnalysis.opening || 1 }}
                      />
                      <div 
                        className="h-full bg-amber-500/80"
                        style={{ flex: phaseAnalysis.middlegame || 1 }}
                      />
                      <div 
                        className="h-full rounded-r bg-violet-500/80"
                        style={{ flex: phaseAnalysis.endgame || 1 }}
                      />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[5px] text-emerald-400">Open</span>
                      <span className="text-[5px] text-amber-400">Mid</span>
                      <span className="text-[5px] text-violet-400">End</span>
                    </div>
                  </div>
                  
                  {/* MVP Highlight */}
                  {mvpPiece && (
                    <div className={`rounded p-1.5 ${
                      darkMode 
                        ? 'bg-gradient-to-r from-amber-900/40 to-orange-900/40 border border-amber-500/20' 
                        : 'bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="w-6 h-6 rounded flex items-center justify-center text-sm shadow"
                          style={{ 
                            backgroundColor: (mvpPiece.color === 'w' ? whitePalette : blackPalette)[mvpPiece.piece],
                          }}
                        >
                          {PIECE_SYMBOLS[mvpPiece.piece][mvpPiece.color]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-0.5">
                            <Trophy className="w-2 h-2 text-amber-500" />
                            <span className="text-[6px] font-bold text-amber-500 uppercase">MVP</span>
                          </div>
                          <p className="text-[7px] font-medium truncate">
                            {mvpPiece.color === 'w' ? 'W' : 'B'} {PIECE_NAMES[mvpPiece.piece]}
                          </p>
                          <p className="text-[6px] opacity-60">{mvpPiece.moves} moves</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Footer */}
              <div className={`px-2 py-1 text-center ${darkMode ? 'bg-stone-800' : 'bg-stone-200/50'}`}>
                <span className="text-[6px] tracking-[0.15em] uppercase opacity-40">
                  ♔ en pensent • enpensent.com ♚
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Card Features */}
      {showSpecs && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-2 text-xs text-center"
        >
          <div className="p-2 rounded-lg bg-accent/30">
            <p className="font-medium">Front Side</p>
            <p className="text-[10px] text-muted-foreground">Full game analytics</p>
          </div>
          <div className="p-2 rounded-lg bg-accent/30">
            <p className="font-medium">Back Side</p>
            <p className="text-[10px] text-muted-foreground">QR to digital vision</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VisionInfoCardPreview;
