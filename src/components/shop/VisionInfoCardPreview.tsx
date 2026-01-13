import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Clock,
  Zap,
  Trophy,
  MapPin,
  CheckCircle,
  Sparkles,
  CreditCard,
  Feather,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PieceType, PieceColor, getActivePalette } from '@/lib/chess/pieceColors';
import { SquareData } from '@/lib/chess/gameSimulator';
import { MoveHistoryEntry } from '@/components/chess/EnPensentOverlay';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';
import { getGamePoetry, GamePoetry } from '@/lib/chess/gamePoetry';

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
  gameId?: string;
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
  gameId,
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

  // Get poetry for this game if available
  const poetry: GamePoetry | null = useMemo(() => {
    if (gameId) {
      return getGamePoetry(gameId);
    }
    // Try to match by player names
    if (gameData.white && gameData.black) {
      const searchKey = `${gameData.white.toLowerCase()}-${gameData.black.toLowerCase()}`;
      return getGamePoetry(searchKey);
    }
    return null;
  }, [gameId, gameData]);

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

  // Render color palette row
  const renderPaletteRow = (color: PieceColor) => {
    const pal = color === 'w' ? whitePalette : blackPalette;
    const pieceTypes: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
    
    return (
      <div className="flex items-center gap-0.5">
        {pieceTypes.map(piece => {
          const key = `${color}-${piece}`;
          const stat = pieceStats.get(key);
          const isMvp = mvpPiece?.piece === piece && mvpPiece?.color === color;
          const hexColor = pal[piece] || '#888';
          
          return (
            <div 
              key={key}
              className={`relative flex flex-col items-center transition-all ${
                isMvp ? 'scale-110' : ''
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-sm shadow-sm ${isMvp ? 'ring-1 ring-amber-400' : ''}`}
                style={{ backgroundColor: hexColor }}
                title={`${PIECE_NAMES[piece]}: ${stat?.moves || 0} moves`}
              />
              {isMvp && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Crown className="w-1.5 h-1.5 text-white" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Truncate poetry for card display
  const truncatedPoetry = useMemo(() => {
    if (!poetry) return null;
    const lines = poetry.poem.split('\n');
    return lines.slice(0, 2).join(' / ');
  }, [poetry]);

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

      {/* Card Preview Container - Premium Collectible Design */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <div className="relative">
          {/* Premium ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 via-primary/20 to-amber-600/30 rounded-2xl blur-3xl transform translate-y-4 scale-95 opacity-60" />
          
          {/* The Collectible Vision Card */}
          <Card 
            className={`relative overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-all duration-500 ${
              darkMode 
                ? 'bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100' 
                : 'bg-gradient-to-br from-stone-50 via-white to-stone-100 text-stone-900'
            }`}
            style={{ 
              width: 320,
              aspectRatio: '3.5/2',
              borderRadius: 16,
              border: '2px solid transparent',
              backgroundClip: 'padding-box',
            }}
          >
            {/* Gold border effect */}
            <div 
              className="absolute inset-0 rounded-[14px] pointer-events-none"
              style={{
                border: '2px solid transparent',
                background: 'linear-gradient(135deg, #d4af37 0%, #f4e4bc 25%, #d4af37 50%, #b8860b 75%, #d4af37 100%) border-box',
                mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
                WebkitMaskComposite: 'xor',
              }}
            />
            
            {/* Subtle luxury texture */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />
            
            <CardContent className="p-0 h-full flex flex-col relative">
              {/* Golden Seal Logo - Top Right Corner */}
              <div className="absolute top-2 right-2 z-10">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 blur-sm opacity-60" />
                  <img 
                    src={enPensentLogo} 
                    alt="En Pensent Seal" 
                    className="relative w-10 h-10 rounded-full ring-2 ring-amber-400/50 shadow-lg"
                  />
                </div>
              </div>

              {/* Header with Fancy Brand Logo */}
              <div className={`px-4 py-2 flex items-center gap-3 ${
                darkMode 
                  ? 'bg-gradient-to-r from-stone-900/80 to-transparent' 
                  : 'bg-gradient-to-r from-stone-100/80 to-transparent'
              }`}>
                <div className="flex flex-col">
                  <span 
                    className="text-[11px] font-bold tracking-[0.25em] uppercase"
                    style={{
                      fontVariant: 'small-caps',
                      background: 'linear-gradient(135deg, #d4af37 0%, #f4e4bc 50%, #d4af37 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    En Pensent
                  </span>
                  <span className="text-[7px] tracking-[0.15em] uppercase opacity-50">
                    Vision Data Card
                  </span>
                </div>
              </div>
              
              {/* Main Content */}
              <div className="flex-1 px-3 py-1.5 grid grid-cols-5 gap-2">
                {/* Left Column - Game Identity & Poetry (3 cols) */}
                <div className="col-span-3 space-y-1.5">
                  {/* Game Title - Elegant Typography */}
                  <div>
                    <h3 
                      className="font-serif font-bold text-sm leading-tight"
                      style={{ fontVariant: 'small-caps' }}
                    >
                      {gameData.white || 'White'}
                    </h3>
                    <div className="flex items-center gap-1 my-0.5">
                      <div className="h-px flex-1 bg-gradient-to-r from-amber-500/50 to-transparent" />
                      <span className="text-[8px] opacity-50 italic">vs</span>
                      <div className="h-px flex-1 bg-gradient-to-l from-amber-500/50 to-transparent" />
                    </div>
                    <h3 
                      className="font-serif font-bold text-sm leading-tight"
                      style={{ fontVariant: 'small-caps' }}
                    >
                      {gameData.black || 'Black'}
                    </h3>
                  </div>
                  
                  {/* Event & Date */}
                  <div className="flex items-center justify-between text-[7px] opacity-60">
                    <span className="truncate max-w-[120px]">{gameData.event || 'Chess Match'}</span>
                    <span>{gameData.date || ''}</span>
                  </div>
                  
                  {/* Poetry Section */}
                  {truncatedPoetry ? (
                    <div className={`p-2 rounded-lg ${
                      darkMode ? 'bg-stone-800/50' : 'bg-amber-50/50'
                    } border border-amber-500/20`}>
                      <div className="flex items-center gap-1 mb-1">
                        <Feather className="w-2.5 h-2.5 text-amber-500" />
                        <span className="text-[6px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {poetry?.style || 'poetry'}
                        </span>
                      </div>
                      <p className="text-[8px] italic leading-relaxed opacity-80 line-clamp-2">
                        "{truncatedPoetry}..."
                      </p>
                    </div>
                  ) : (
                    /* MVP Section if no poetry */
                    mvpPiece && (
                      <div className={`p-2 rounded-lg ${
                        darkMode 
                          ? 'bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/20' 
                          : 'bg-gradient-to-r from-amber-100/80 to-orange-100/80 border border-amber-300'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-7 h-7 rounded flex items-center justify-center text-base shadow-lg ring-1 ring-amber-400/50"
                            style={{ 
                              backgroundColor: (mvpPiece.color === 'w' ? whitePalette : blackPalette)[mvpPiece.piece],
                            }}
                          >
                            {PIECE_SYMBOLS[mvpPiece.piece][mvpPiece.color]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <Trophy className="w-2.5 h-2.5 text-amber-500" />
                              <span className="text-[7px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                Most Valuable Piece
                              </span>
                            </div>
                            <p className="text-[8px] font-medium">
                              {mvpPiece.color === 'w' ? 'White' : 'Black'} {PIECE_NAMES[mvpPiece.piece]} • {mvpPiece.moves} moves
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                  
                  {/* Color Palette Legend */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-2 h-2 text-primary" />
                      <span className="text-[6px] uppercase tracking-wider opacity-60">
                        {palette.name} Palette
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[7px] text-sky-400">
                          {theme?.whiteEmoji || '❄️'}
                        </span>
                        {renderPaletteRow('w')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[7px] text-rose-400">
                          {theme?.blackEmoji || '🔥'}
                        </span>
                        {renderPaletteRow('b')}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Stats (2 cols) */}
                <div className="col-span-2 space-y-1.5">
                  {/* Result Badge */}
                  {gameData.result && (
                    <div className="text-center">
                      <Badge 
                        className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 font-bold px-3"
                      >
                        {gameData.result}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Territory Control */}
                  <div className={`rounded-lg p-1.5 ${darkMode ? 'bg-stone-800/60' : 'bg-stone-200/60'}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="w-2 h-2 text-primary" />
                      <span className="text-[6px] uppercase tracking-wider opacity-70">Territory</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] w-3 text-sky-400">♔</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-stone-300/30">
                          <div 
                            className="h-full bg-gradient-to-r from-sky-400 to-sky-500"
                            style={{ width: `${territoryStats.whitePercent}%` }}
                          />
                        </div>
                        <span className="text-[6px] font-mono w-5 text-right">{territoryStats.whitePercent}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] w-3 text-rose-400">♚</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-stone-300/30">
                          <div 
                            className="h-full bg-gradient-to-r from-rose-400 to-rose-500"
                            style={{ width: `${territoryStats.blackPercent}%` }}
                          />
                        </div>
                        <span className="text-[6px] font-mono w-5 text-right">{territoryStats.blackPercent}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Game Phases */}
                  <div className={`rounded-lg p-1.5 ${darkMode ? 'bg-stone-800/60' : 'bg-stone-200/60'}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="w-2 h-2 text-primary" />
                      <span className="text-[6px] uppercase tracking-wider opacity-70">Phases</span>
                    </div>
                    <div className="flex items-center gap-0.5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                        style={{ flex: phaseAnalysis.opening || 1 }}
                      />
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                        style={{ flex: phaseAnalysis.middlegame || 1 }}
                      />
                      <div 
                        className="h-full bg-gradient-to-r from-violet-400 to-violet-500"
                        style={{ flex: phaseAnalysis.endgame || 1 }}
                      />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[5px] text-emerald-400">Open</span>
                      <span className="text-[5px] text-amber-400">Mid</span>
                      <span className="text-[5px] text-violet-400">End</span>
                    </div>
                  </div>
                  
                  {/* Move Counter */}
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                      darkMode ? 'bg-stone-800' : 'bg-stone-200'
                    }`}>
                      <Zap className="w-2 h-2 text-primary" />
                      <span className="text-[8px] font-mono font-bold">{totalMoves}</span>
                      <span className="text-[6px] opacity-60">moves</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer - Elegant Branding */}
              <div className={`px-3 py-1.5 flex items-center justify-between ${
                darkMode ? 'bg-stone-900/80' : 'bg-stone-100/80'
              }`}>
                <span className="text-[6px] tracking-[0.2em] uppercase opacity-40">
                  enpensent.com
                </span>
                <span 
                  className="text-[7px] tracking-[0.15em]"
                  style={{
                    fontVariant: 'small-caps',
                    background: 'linear-gradient(90deg, #d4af37, #f4e4bc, #d4af37)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  ♔ Certified Vision ♚
                </span>
                <span className="text-[6px] tracking-wider opacity-40">
                  #{String(totalMoves).padStart(3, '0')}
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
