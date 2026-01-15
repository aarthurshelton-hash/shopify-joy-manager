/**
 * KeyMomentMarker Component
 * 
 * Enhanced timeline marker with deep analysis integration.
 * On hover, highlights relevant squares and pieces on the board,
 * shows tactical annotations, and integrates with move quality metrics.
 */

import React, { useCallback, useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  Zap,
  Target,
  Castle,
  Star,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Crosshair,
  ArrowUpRight,
  Swords,
  Shield,
  Trophy,
  MapPin,
} from 'lucide-react';
import { useLegendHighlight, HighlightedPiece, HoveredMoveInfo } from '@/contexts/LegendHighlightContext';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { MoveQuality, MOVE_QUALITY_INFO, ClassifiedMove } from '@/lib/chess/moveQuality';
import { TacticalMotif, SpecialMove } from '@/lib/chess/chessAnalysis';

// ===================== TYPES =====================

export type KeyMomentType = 
  | 'capture' | 'check' | 'checkmate' | 'castling' 
  | 'brilliant' | 'great' | 'blunder' | 'mistake' | 'inaccuracy'
  | 'fork' | 'pin' | 'skewer' | 'discovery' | 'sacrifice'
  | 'en_passant' | 'promotion' | 'underpromotion';

export interface KeyMoment {
  moveNumber: number;
  type: KeyMomentType;
  move: string;
  player: 'white' | 'black';
  quality?: MoveQuality;
  tactic?: TacticalMotif;
  specialMove?: SpecialMove;
  description?: string;
  // Deep analysis data
  classifiedMove?: ClassifiedMove;
  targetSquare?: string;
  fromSquare?: string;
  capturedPiece?: string;
  pieceType?: PieceType;
  pieceColor?: PieceColor;
}

// ===================== CONFIGURATION =====================

const MOMENT_CONFIG: Record<KeyMomentType, { 
  icon: React.ComponentType<{ className?: string }>; 
  color: string; 
  bgColor: string;
  borderColor: string;
  label: string;
  description: string;
  tacticalInsight: string;
  emoji: string;
}> = {
  // Events
  capture: { 
    icon: Target, 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500',
    borderColor: 'border-orange-500/50',
    label: 'Capture',
    description: 'A piece was captured, shifting the material balance.',
    tacticalInsight: 'Material changes can dramatically alter the strategic landscape. Evaluate if this trade favors one side.',
    emoji: '⚔️',
  },
  check: { 
    icon: Zap, 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500',
    borderColor: 'border-yellow-500/50',
    label: 'Check',
    description: 'The king is under attack and must escape.',
    tacticalInsight: 'Checks force immediate response, often disrupting the opponent\'s plans.',
    emoji: '⚡',
  },
  checkmate: { 
    icon: Crown, 
    color: 'text-red-400', 
    bgColor: 'bg-red-500',
    borderColor: 'border-red-500/50',
    label: 'Checkmate',
    description: 'Game over! The king cannot escape.',
    tacticalInsight: 'The ultimate goal achieved. Study the mating pattern for future games.',
    emoji: '👑',
  },
  castling: { 
    icon: Castle, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-500/50',
    label: 'Castle',
    description: 'King moves to safety while activating the rook.',
    tacticalInsight: 'A crucial developmental move that addresses king safety and rook activation.',
    emoji: '🏰',
  },
  
  // Move quality
  brilliant: { 
    icon: Sparkles, 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500',
    borderColor: 'border-cyan-500/50',
    label: 'Brilliant',
    description: 'An exceptional move that dramatically improves the position.',
    tacticalInsight: 'Often involves a sacrifice or counterintuitive play that creates winning chances.',
    emoji: '💎',
  },
  great: { 
    icon: TrendingUp, 
    color: 'text-green-400', 
    bgColor: 'bg-green-500',
    borderColor: 'border-green-500/50',
    label: 'Great Move',
    description: 'A strong move that significantly improves the position.',
    tacticalInsight: 'Demonstrates deep understanding of the position\'s requirements.',
    emoji: '✨',
  },
  blunder: { 
    icon: AlertTriangle, 
    color: 'text-red-400', 
    bgColor: 'bg-red-600',
    borderColor: 'border-red-600/50',
    label: 'Blunder',
    description: 'A severe error that often loses the game.',
    tacticalInsight: 'Critical mistake to avoid. Study what the better alternative was.',
    emoji: '⚠️',
  },
  mistake: { 
    icon: AlertTriangle, 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-600',
    borderColor: 'border-orange-600/50',
    label: 'Mistake',
    description: 'A clear error that loses material or advantage.',
    tacticalInsight: 'An oversight that changes the evaluation. Consider what was missed.',
    emoji: '❌',
  },
  inaccuracy: { 
    icon: Target, 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-600',
    borderColor: 'border-yellow-600/50',
    label: 'Inaccuracy',
    description: 'Slightly imprecise, giving up some advantage.',
    tacticalInsight: 'A minor slip. The difference between good and best moves.',
    emoji: '⚪',
  },
  
  // Tactical motifs
  fork: { 
    icon: Crosshair, 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500',
    borderColor: 'border-purple-500/50',
    label: 'Fork',
    description: 'One piece attacks two or more enemy pieces simultaneously.',
    tacticalInsight: 'A classic double attack. One of the most common tactical patterns.',
    emoji: '🔱',
  },
  pin: { 
    icon: Shield, 
    color: 'text-indigo-400', 
    bgColor: 'bg-indigo-500',
    borderColor: 'border-indigo-500/50',
    label: 'Pin',
    description: 'A piece cannot move without exposing a more valuable piece behind it.',
    tacticalInsight: 'Pins restrict movement and can lead to material wins or positional advantages.',
    emoji: '📌',
  },
  skewer: { 
    icon: ArrowUpRight, 
    color: 'text-pink-400', 
    bgColor: 'bg-pink-500',
    borderColor: 'border-pink-500/50',
    label: 'Skewer',
    description: 'Attacking a piece through another, forcing it to move.',
    tacticalInsight: 'The reverse of a pin. The more valuable piece must move, exposing the lesser one.',
    emoji: '📍',
  },
  discovery: { 
    icon: Zap, 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-500/50',
    label: 'Discovery',
    description: 'Moving one piece to reveal an attack from another.',
    tacticalInsight: 'Discovered attacks can be devastating as they create multiple threats.',
    emoji: '🎯',
  },
  sacrifice: { 
    icon: Star, 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-600',
    borderColor: 'border-cyan-600/50',
    label: 'Sacrifice',
    description: 'Intentionally giving up material for advantage.',
    tacticalInsight: 'Sacrifices require deep calculation but can lead to brilliant victories.',
    emoji: '💫',
  },
  
  // Special moves
  en_passant: { 
    icon: Swords, 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500',
    borderColor: 'border-emerald-500/50',
    label: 'En Passant',
    description: 'Special pawn capture immediately after opponent\'s two-square move.',
    tacticalInsight: 'A unique rule that prevents pawns from escaping capture by advancing two squares.',
    emoji: '⚡',
  },
  promotion: { 
    icon: Crown, 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-500/50',
    label: 'Promotion',
    description: 'Pawn reaches the eighth rank and transforms.',
    tacticalInsight: 'Promotion often decides the game. Queen promotion is most common.',
    emoji: '👸',
  },
  underpromotion: { 
    icon: Trophy, 
    color: 'text-violet-400', 
    bgColor: 'bg-violet-500',
    borderColor: 'border-violet-500/50',
    label: 'Underpromotion',
    description: 'Strategic promotion to knight, bishop, or rook instead of queen.',
    tacticalInsight: 'Rare but sometimes necessary to avoid stalemate or deliver mate.',
    emoji: '🏆',
  },
};

// ===================== HELPER FUNCTIONS =====================

/**
 * Parse SAN notation to extract piece type and squares
 */
function parseMoveNotation(san: string, isWhiteMove: boolean): { 
  pieceType: PieceType; 
  pieceColor: PieceColor;
  targetSquare: string;
  fromHint?: string;
  isCapture: boolean;
} | null {
  if (!san) return null;
  
  const cleanSan = san.replace(/[+#!?]/g, '');
  const pieceColor: PieceColor = isWhiteMove ? 'w' : 'b';
  
  // Handle castling
  if (cleanSan === 'O-O' || cleanSan === 'O-O-O') {
    const targetSquare = cleanSan === 'O-O' 
      ? (isWhiteMove ? 'g1' : 'g8') 
      : (isWhiteMove ? 'c1' : 'c8');
    return { pieceType: 'k', pieceColor, targetSquare, isCapture: false };
  }
  
  const isCapture = cleanSan.includes('x');
  let pieceType: PieceType = 'p';
  let remaining = cleanSan;
  
  // Extract piece type
  if (/^[KQRBN]/.test(cleanSan)) {
    pieceType = cleanSan[0].toLowerCase() as PieceType;
    remaining = cleanSan.slice(1);
  }
  
  // Handle disambiguation and capture
  remaining = remaining.replace('x', '');
  
  // Handle promotion
  const promotionMatch = remaining.match(/=([QRBN])$/i);
  if (promotionMatch) {
    remaining = remaining.slice(0, -2);
  }
  
  // Extract from hint (disambiguation)
  let fromHint: string | undefined;
  if (remaining.length > 2) {
    fromHint = remaining.slice(0, -2);
    remaining = remaining.slice(-2);
  }
  
  const targetSquare = remaining;
  
  if (!/^[a-h][1-8]$/.test(targetSquare)) {
    return null;
  }
  
  return { pieceType, pieceColor, targetSquare, fromHint, isCapture };
}

// ===================== COMPONENT =====================

interface KeyMomentMarkerProps {
  moment: KeyMoment;
  position: number; // Percentage position on timeline
  totalMoves: number;
  onClick: (moveNumber: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const KeyMomentMarker: React.FC<KeyMomentMarkerProps> = ({
  moment,
  position,
  totalMoves,
  onClick,
  size = 'md'
}) => {
  const config = MOMENT_CONFIG[moment.type];
  const Icon = config.icon;
  
  // Try to use legend highlight context for hover interactions
  let highlightContext: ReturnType<typeof useLegendHighlight> | null = null;
  try {
    highlightContext = useLegendHighlight();
  } catch {
    // Context not available
  }
  
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  
  const iconSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const moveIndex = moment.moveNumber - 1;
  const moveNum = Math.floor(moveIndex / 2) + 1;
  const isWhiteMove = moveIndex % 2 === 0;
  
  // Parse move for highlighting
  const parsedMove = useMemo(() => {
    return parseMoveNotation(moment.move, isWhiteMove);
  }, [moment.move, isWhiteMove]);

  // Create highlighted piece data
  const highlightedPiece: HighlightedPiece | null = useMemo(() => {
    if (!parsedMove) return null;
    return {
      pieceType: parsedMove.pieceType,
      pieceColor: parsedMove.pieceColor,
    };
  }, [parsedMove]);

  // Create hovered move info for board highlighting
  const hoveredMoveInfo: HoveredMoveInfo | null = useMemo(() => {
    if (!parsedMove || !highlightedPiece) return null;
    return {
      moveNumber: moment.moveNumber,
      san: moment.move,
      piece: highlightedPiece,
      targetSquare: parsedMove.targetSquare,
      isCapture: parsedMove.isCapture,
    };
  }, [parsedMove, highlightedPiece, moment.moveNumber, moment.move]);

  // Handle hover enter - highlight piece and square on board
  const handleMouseEnter = useCallback(() => {
    if (!highlightContext) return;
    
    // Set hovered move to highlight the target square
    if (hoveredMoveInfo) {
      highlightContext.setHoveredMove(hoveredMoveInfo);
    }
    
    // Also set the highlighted piece for legend sync
    if (highlightedPiece) {
      highlightContext.setHighlightedPiece(highlightedPiece);
    }
  }, [highlightContext, hoveredMoveInfo, highlightedPiece]);

  // Handle hover leave - clear highlights
  const handleMouseLeave = useCallback(() => {
    if (!highlightContext) return;
    highlightContext.setHoveredMove(null);
    highlightContext.setHighlightedPiece(null);
  }, [highlightContext]);

  // Handle click - jump to move
  const handleClick = useCallback(() => {
    // Clear hover state before jumping
    if (highlightContext) {
      highlightContext.setHoveredMove(null);
      highlightContext.setHighlightedPiece(null);
    }
    onClick(moment.moveNumber);
  }, [onClick, moment.moveNumber, highlightContext]);

  // Get quality info if available
  const qualityInfo = moment.quality ? MOVE_QUALITY_INFO[moment.quality] : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className={`absolute -translate-x-1/2 -top-1 ${sizeClasses[size]} rounded-full ${config.bgColor} 
            flex items-center justify-center cursor-pointer
            hover:scale-125 transition-all duration-200 shadow-lg ring-1 ring-black/20
            ${moment.player === 'white' ? 'ring-white/30' : 'ring-black/50'}
            hover:ring-2 hover:ring-primary/50`}
          style={{ left: `${position}%` }}
        >
          <Icon className={`${iconSizes[size]} text-white`} />
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="max-w-[300px] p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Header with gradient */}
        <div className={`${config.bgColor} px-3 py-2`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.emoji}</span>
            <Icon className="w-4 h-4 text-white" />
            <span className="font-semibold text-white">{config.label}</span>
            <Badge 
              variant="outline" 
              className={`ml-auto text-[9px] bg-white/20 border-white/30 text-white`}
            >
              {moment.player === 'white' ? 'White' : 'Black'}
            </Badge>
          </div>
        </div>
        
        <div className="p-3 space-y-3 bg-popover">
          {/* Move notation with square highlight hint */}
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${moment.player === 'white' ? 'bg-sky-400' : 'bg-rose-400'}`} />
            <span className="font-mono text-sm font-medium">
              {moveNum}.{isWhiteMove ? '' : '..'} {moment.move}
            </span>
            {parsedMove && (
              <Badge variant="secondary" className="text-[9px] gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {parsedMove.targetSquare}
              </Badge>
            )}
          </div>
          
          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {moment.description || config.description}
          </p>
          
          {/* Tactical insight */}
          <div className={`text-xs p-2 rounded-md border ${config.borderColor} bg-muted/30`}>
            <div className="font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Tactical Insight
            </div>
            <p className="leading-relaxed">{config.tacticalInsight}</p>
          </div>
          
          {/* Move quality badge if available */}
          {qualityInfo && (
            <div className="flex items-center gap-2 pt-1 border-t border-border/50">
              <span className="text-xs text-muted-foreground">Engine Analysis:</span>
              <Badge 
                style={{ backgroundColor: qualityInfo.color }}
                className="text-white text-[10px]"
              >
                {qualityInfo.symbol} {qualityInfo.label}
              </Badge>
            </div>
          )}
          
          {/* Tactic details if available */}
          {moment.tactic && (
            <div className="pt-2 border-t border-border/50">
              <div className="text-[10px] font-medium text-muted-foreground mb-1.5">Tactical Details</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <span className="text-muted-foreground">Attacker:</span>
                <span className="font-mono">
                  {moment.tactic.attacker.piece.toUpperCase()} @ {moment.tactic.attacker.square}
                </span>
                <span className="text-muted-foreground">Targets:</span>
                <span className="font-mono text-[10px]">
                  {moment.tactic.targets.map(t => `${t.piece.toUpperCase()}@${t.square}`).join(', ')}
                </span>
                {moment.tactic.value && (
                  <>
                    <span className="text-muted-foreground">Value:</span>
                    <span className="text-primary font-medium">{moment.tactic.value} cp</span>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Hover hint */}
          <div className="flex items-center gap-2 pt-1 text-[9px] text-muted-foreground/70">
            <div className="flex-1 flex items-center gap-1">
              <Target className="w-2.5 h-2.5" />
              <span>Hover highlights board</span>
            </div>
            <span className="text-primary/70">Click to jump</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default KeyMomentMarker;
