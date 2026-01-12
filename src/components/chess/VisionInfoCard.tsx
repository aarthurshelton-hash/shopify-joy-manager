import React, { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { 
  Download, 
  Crown, 
  Shield, 
  Target, 
  Crosshair,
  Clock,
  Zap,
  Trophy,
  MapPin,
  Swords,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { PieceType, PieceColor, getActivePalette } from '@/lib/chess/pieceColors';
import { SquareData } from '@/lib/chess/gameSimulator';
import { MoveHistoryEntry } from './EnPensentOverlay';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

interface VisionInfoCardProps {
  board: SquareData[][];
  gameData: {
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
  isPremium: boolean;
  onDownload?: () => void;
  onPurchaseAddOn?: () => void;
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

const PIECE_ICONS: Record<PieceType, typeof Crown> = {
  k: Crown, q: Trophy, r: Shield, b: Crosshair, n: Target, p: MapPin
};

export const VisionInfoCard: React.FC<VisionInfoCardProps> = ({
  board,
  gameData,
  moveHistory = [],
  totalMoves,
  whitePalette,
  blackPalette,
  darkMode = false,
  isPremium,
  onDownload,
  onPurchaseAddOn,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const palette = getActivePalette();
  const theme = palette.legendTheme;

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
    
    return mvp;
  }, [pieceStats]);

  // Calculate territory control
  const territoryStats = useMemo(() => {
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

  const handleDownload = async () => {
    if (!isPremium) {
      onPurchaseAddOn?.();
      return;
    }
    
    if (!cardRef.current) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: darkMode ? '#0A0A0A' : '#FDFCFB',
        useCORS: true,
      });
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `EnPensent-InfoCard-${gameData.white || 'White'}-vs-${gameData.black || 'Black'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Info Card downloaded!');
      onDownload?.();
    } catch (error) {
      console.error('Failed to download info card:', error);
      toast.error('Download failed. Please try again.');
    }
  };

  const renderPieceRow = (color: PieceColor) => {
    const pal = color === 'w' ? whitePalette : blackPalette;
    const pieceTypes: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
    
    return (
      <div className="grid grid-cols-6 gap-1">
        {pieceTypes.map(piece => {
          const key = `${color}-${piece}`;
          const stat = pieceStats.get(key);
          const isMvp = mvpPiece?.piece === piece && mvpPiece?.color === color;
          const Icon = PIECE_ICONS[piece];
          const hexColor = pal[piece] || '#888';
          
          return (
            <TooltipProvider key={key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={`relative flex flex-col items-center p-1.5 rounded-md transition-all ${
                      isMvp ? 'ring-2 ring-amber-400 bg-amber-400/10' : 'hover:bg-accent/30'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded shadow-sm mb-0.5"
                      style={{ backgroundColor: hexColor }}
                    />
                    <span className="text-xs" style={{ color: hexColor }}>
                      {PIECE_SYMBOLS[piece][color]}
                    </span>
                    <span className="text-[8px] font-mono text-muted-foreground">
                      {stat?.moves || 0}
                    </span>
                    
                    {isMvp && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Crown className="w-2 h-2 text-white" />
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs space-y-1">
                    <p className="font-semibold">{PIECE_NAMES[piece]}</p>
                    <p>{stat?.moves || 0} moves • {stat?.squares.size || 0} unique squares</p>
                    {(stat?.captures || 0) > 0 && <p>⚔️ {stat?.captures} captures</p>}
                    {(stat?.checks || 0) > 0 && <p>✓ {stat?.checks} checks</p>}
                    {isMvp && <p className="text-amber-400 font-bold">★ MVP</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* The actual card for download */}
      <div 
        ref={cardRef}
        className={`rounded-xl overflow-hidden shadow-xl ${
          darkMode ? 'bg-stone-900 text-stone-100' : 'bg-stone-50 text-stone-900'
        }`}
        style={{ width: 320 }}
      >
        {/* Header */}
        <div className={`p-4 ${darkMode ? 'bg-stone-800' : 'bg-stone-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src={enPensentLogo} alt="En Pensent" className="w-6 h-6 rounded-full" />
              <span className="text-xs font-display uppercase tracking-wider opacity-70">Vision Data Card</span>
            </div>
            <span className="text-[10px] font-mono opacity-50">#{totalMoves} moves</span>
          </div>
          
          <div className="text-center">
            <h3 className="font-display font-bold text-sm">
              {gameData.white || 'White'} vs {gameData.black || 'Black'}
            </h3>
            <div className="flex items-center justify-center gap-2 text-[10px] opacity-70">
              {gameData.event && <span>{gameData.event}</span>}
              {gameData.date && <span>• {gameData.date}</span>}
            </div>
            {gameData.result && (
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                darkMode ? 'bg-primary/30 text-primary-foreground' : 'bg-primary/20 text-primary'
              }`}>
                {gameData.result}
              </span>
            )}
          </div>
        </div>
        
        {/* Color Legend Section */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-display uppercase tracking-wider">Piece Activity</span>
          </div>
          
          {/* White pieces */}
          <div className="space-y-1">
            <span className="text-[10px] text-sky-400 font-medium">
              {theme?.whiteEmoji || '❄️'} {theme?.whiteName || 'White'}
            </span>
            {renderPieceRow('w')}
          </div>
          
          {/* Black pieces */}
          <div className="space-y-1">
            <span className="text-[10px] text-rose-400 font-medium">
              {theme?.blackEmoji || '🔥'} {theme?.blackName || 'Black'}
            </span>
            {renderPieceRow('b')}
          </div>
        </div>
        
        {/* Territory Analysis */}
        <div className={`p-4 ${darkMode ? 'bg-stone-800/50' : 'bg-stone-100/50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-display uppercase tracking-wider">Territory Control</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-sky-400 to-sky-600" 
              style={{ width: `${territoryStats.whitePercent}%` }} 
            />
            <span className="text-[10px] font-mono w-8 text-center">{territoryStats.whitePercent}%</span>
            <span className="text-[10px] opacity-50">vs</span>
            <span className="text-[10px] font-mono w-8 text-center">{territoryStats.blackPercent}%</span>
            <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-rose-400 to-rose-600" 
              style={{ width: `${territoryStats.blackPercent}%` }} 
            />
          </div>
        </div>
        
        {/* Game Phases Timeline */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-display uppercase tracking-wider">Game Phases</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="h-4 rounded-l bg-emerald-500/80 flex items-center justify-center"
                  style={{ flex: phaseAnalysis.opening }}
                >
                  {phaseAnalysis.opening > 3 && (
                    <span className="text-[8px] text-white font-bold">Opening</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Opening: {phaseAnalysis.opening} moves</p>
                <p className="text-[10px] text-muted-foreground">Development & center control</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="h-4 bg-amber-500/80 flex items-center justify-center"
                  style={{ flex: phaseAnalysis.middlegame || 1 }}
                >
                  {phaseAnalysis.middlegame > 5 && (
                    <span className="text-[8px] text-white font-bold">Middlegame</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Middlegame: {phaseAnalysis.middlegame} moves</p>
                <p className="text-[10px] text-muted-foreground">Tactical battles & strategic plans</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="h-4 rounded-r bg-violet-500/80 flex items-center justify-center"
                  style={{ flex: phaseAnalysis.endgame || 1 }}
                >
                  {phaseAnalysis.endgame > 5 && (
                    <span className="text-[8px] text-white font-bold">Endgame</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Endgame: {phaseAnalysis.endgame} moves</p>
                <p className="text-[10px] text-muted-foreground">King activation & pawn promotion</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {/* MVP Highlight */}
        {mvpPiece && (
          <div className={`mx-4 mb-4 p-3 rounded-lg border ${
            darkMode 
              ? 'bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-500/30' 
              : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-lg"
                style={{ 
                  backgroundColor: (mvpPiece.color === 'w' ? whitePalette : blackPalette)[mvpPiece.piece],
                }}
              >
                {PIECE_SYMBOLS[mvpPiece.piece][mvpPiece.color]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">MVP</span>
                </div>
                <p className="text-xs font-medium">
                  {mvpPiece.color === 'w' ? 'White' : 'Black'} {PIECE_NAMES[mvpPiece.piece]}
                </p>
                <p className="text-[10px] opacity-70">{mvpPiece.moves} moves this game</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className={`px-4 py-2 text-center ${darkMode ? 'bg-stone-800' : 'bg-stone-100'}`}>
          <span className="text-[8px] tracking-[0.2em] uppercase opacity-50">
            ♔ en pensent • enpensent.com ♚
          </span>
        </div>
      </div>
      
      {/* Download Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={handleDownload}
          className={`w-full gap-2 ${
            isPremium 
              ? 'btn-luxury' 
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }`}
          size="sm"
        >
          {isPremium ? (
            <>
              <Download className="w-4 h-4" />
              Download Info Card
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Visionary Exclusive
              <ChevronRight className="w-3 h-3" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default VisionInfoCard;
