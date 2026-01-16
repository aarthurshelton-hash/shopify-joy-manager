/**
 * Enhanced Timeline Marker Component
 * 
 * Provides rich hover tooltips for tactics, special moves, move quality, and phases.
 * Integrates with the timeline context to update board state on click.
 * Enhanced with En Pensent pattern visualization.
 */

import React, { useMemo } from 'react';
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
  Flag,
  Sword,
  BookOpen,
} from 'lucide-react';
import { MoveQuality, MOVE_QUALITY_INFO } from '@/lib/chess/moveQuality';
import { TacticalMotif, SpecialMove, GamePhase } from '@/lib/chess/chessAnalysis';
import { useEnPensentPatterns } from '@/hooks/useEnPensentPatterns';
import type { TemporalSignature } from '@/lib/pensent-core/types/core';

// ===================== MOMENT TYPES =====================

export type MomentType = 
  | 'capture' | 'check' | 'checkmate' | 'castling' 
  | 'brilliant' | 'great' | 'blunder' | 'mistake' | 'inaccuracy'
  | 'fork' | 'pin' | 'skewer' | 'discovery' | 'sacrifice'
  | 'en_passant' | 'promotion' | 'underpromotion';

export interface TimelineMoment {
  moveNumber: number;
  type: MomentType;
  move: string;
  player: 'white' | 'black';
  quality?: MoveQuality;
  tactic?: TacticalMotif;
  specialMove?: SpecialMove;
  description?: string;
}

// ===================== CONFIGURATION =====================

export const momentConfig: Record<MomentType, { 
  icon: React.ComponentType<{ className?: string }>; 
  color: string; 
  bgColor: string;
  label: string;
  description: string;
  category: 'tactical' | 'quality' | 'special' | 'event';
}> = {
  // Tactical events
  capture: { 
    icon: Target, 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500',
    label: 'Capture',
    description: 'A piece was captured, shifting the material balance.',
    category: 'event'
  },
  check: { 
    icon: Zap, 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500',
    label: 'Check',
    description: 'The king is under attack and must escape.',
    category: 'event'
  },
  checkmate: { 
    icon: Crown, 
    color: 'text-red-400', 
    bgColor: 'bg-red-500',
    label: 'Checkmate',
    description: 'Game over! The king cannot escape.',
    category: 'event'
  },
  castling: { 
    icon: Castle, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500',
    label: 'Castle',
    description: 'King moves to safety while activating the rook.',
    category: 'special'
  },
  
  // Move quality
  brilliant: { 
    icon: Sparkles, 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500',
    label: 'Brilliant',
    description: 'An exceptional move, often a sacrifice that dramatically improves position.',
    category: 'quality'
  },
  great: { 
    icon: TrendingUp, 
    color: 'text-green-400', 
    bgColor: 'bg-green-500',
    label: 'Great Move',
    description: 'A strong move that significantly improves the position.',
    category: 'quality'
  },
  blunder: { 
    icon: AlertTriangle, 
    color: 'text-red-400', 
    bgColor: 'bg-red-600',
    label: 'Blunder',
    description: 'A severe error that often loses the game.',
    category: 'quality'
  },
  mistake: { 
    icon: AlertTriangle, 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-600',
    label: 'Mistake',
    description: 'A clear error that loses material or advantage.',
    category: 'quality'
  },
  inaccuracy: { 
    icon: Target, 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-600',
    label: 'Inaccuracy',
    description: 'Slightly imprecise, giving up some advantage.',
    category: 'quality'
  },
  
  // Tactical motifs
  fork: { 
    icon: Crosshair, 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500',
    label: 'Fork',
    description: 'One piece attacks two or more enemy pieces simultaneously.',
    category: 'tactical'
  },
  pin: { 
    icon: Shield, 
    color: 'text-indigo-400', 
    bgColor: 'bg-indigo-500',
    label: 'Pin',
    description: 'A piece cannot move without exposing a more valuable piece behind it.',
    category: 'tactical'
  },
  skewer: { 
    icon: ArrowUpRight, 
    color: 'text-pink-400', 
    bgColor: 'bg-pink-500',
    label: 'Skewer',
    description: 'Attacking a piece through another, forcing it to move and expose the one behind.',
    category: 'tactical'
  },
  discovery: { 
    icon: Zap, 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500',
    label: 'Discovery',
    description: 'Moving one piece to reveal an attack from another.',
    category: 'tactical'
  },
  sacrifice: { 
    icon: Star, 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-600',
    label: 'Sacrifice',
    description: 'Intentionally giving up material for positional or tactical advantage.',
    category: 'tactical'
  },
  
  // Special moves
  en_passant: { 
    icon: Swords, 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500',
    label: 'En Passant',
    description: 'Special pawn capture immediately after opponent\'s two-square pawn move.',
    category: 'special'
  },
  promotion: { 
    icon: Crown, 
    color: 'text-gold-400', 
    bgColor: 'bg-amber-500',
    label: 'Promotion',
    description: 'Pawn reaches the eighth rank and transforms into a more powerful piece.',
    category: 'special'
  },
  underpromotion: { 
    icon: Trophy, 
    color: 'text-violet-400', 
    bgColor: 'bg-violet-500',
    label: 'Underpromotion',
    description: 'Strategic promotion to knight, bishop, or rook instead of queen.',
    category: 'special'
  },
};

export const phaseConfig: Record<string, { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string;
  bgColor: string;
  description: string;
}> = {
  all: { 
    label: 'All Moves', 
    icon: BookOpen, 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted hover:bg-muted/80',
    description: 'View the entire game from start to finish.'
  },
  opening: { 
    label: 'Opening', 
    icon: Flag, 
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30',
    description: 'The first phase where pieces are developed and kings castled. Focus on controlling the center and piece activity.'
  },
  middlegame: { 
    label: 'Middlegame', 
    icon: Sword, 
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30',
    description: 'The heart of the battle. Tactics, attacks, and strategic maneuvering dominate this phase.'
  },
  endgame: { 
    label: 'Endgame', 
    icon: Crown, 
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/30',
    description: 'With fewer pieces, king activity and pawn promotion become decisive factors.'
  },
};

// ===================== MARKER COMPONENT =====================

interface TimelineMarkerProps {
  moment: TimelineMoment;
  position: number; // Percentage position
  orientation: 'horizontal' | 'vertical';
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  signature?: TemporalSignature | null;
}

export const TimelineMarker: React.FC<TimelineMarkerProps> = ({
  moment,
  position,
  orientation,
  onClick,
  size = 'md',
  signature = null,
}) => {
  // En Pensent pattern integration
  const pattern = useEnPensentPatterns(signature);
  
  const config = momentConfig[moment.type];
  const Icon = config.icon;
  
  // Enhanced styling based on pattern intensity
  const intensityGlow = useMemo(() => {
    if (!signature || pattern.intensity < 0.3) return '';
    return `shadow-[0_0_${Math.round(pattern.intensity * 8)}px_${pattern.dominantColor}40]`;
  }, [signature, pattern.intensity, pattern.dominantColor]);
  
  const sizeClasses = {
    sm: 'w-3 h-3',
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
  
  const positionStyle = orientation === 'horizontal'
    ? { left: `${position}%` }
    : { top: `${position}%` };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`absolute ${orientation === 'horizontal' ? '-translate-x-1/2 -top-1' : '-translate-y-1/2 left-0'} 
            ${sizeClasses[size]} rounded-full ${config.bgColor} 
            flex items-center justify-center cursor-pointer
            hover:scale-125 transition-all duration-200 shadow-lg ring-1 ring-black/20
            ${moment.player === 'white' ? 'ring-white/30' : 'ring-black/50'}
            hover:ring-2 hover:ring-primary/50 ${intensityGlow}`}
          style={positionStyle}
        >
          <Icon className={`${iconSizes[size]} text-white`} />
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side={orientation === 'horizontal' ? 'top' : 'right'} 
        className="max-w-[280px] p-3 space-y-2"
      >
        {/* Header with icon and label */}
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${config.bgColor}`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm">{config.label}</div>
            <div className="text-xs text-muted-foreground">
              {moveNum}.{isWhiteMove ? '' : '..'} {moment.move}
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`ml-auto text-[9px] ${moment.player === 'white' ? 'border-sky-500/50 text-sky-400' : 'border-rose-500/50 text-rose-400'}`}
          >
            {moment.player === 'white' ? 'White' : 'Black'}
          </Badge>
        </div>
        
        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {moment.description || config.description}
        </p>
        
        {/* Tactical details */}
        {moment.tactic && (
          <div className="pt-2 border-t border-border/50">
            <div className="text-[10px] font-medium text-muted-foreground mb-1">Tactical Details</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <div className="text-muted-foreground">Piece:</div>
              <div className="font-mono">{moment.tactic.attacker.piece.toUpperCase()} @ {moment.tactic.attacker.square}</div>
              <div className="text-muted-foreground">Targets:</div>
              <div className="font-mono">
                {moment.tactic.targets.map(t => `${t.piece.toUpperCase()}@${t.square}`).join(', ')}
              </div>
              <div className="text-muted-foreground">Value:</div>
              <div className="text-primary font-medium">{moment.tactic.value} centipawns</div>
            </div>
          </div>
        )}
        
        {/* Move quality badge */}
        {moment.quality && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Badge 
                style={{ backgroundColor: MOVE_QUALITY_INFO[moment.quality].color }}
                className="text-white text-[10px]"
              >
                {MOVE_QUALITY_INFO[moment.quality].symbol} {MOVE_QUALITY_INFO[moment.quality].label}
              </Badge>
            </div>
          </div>
        )}
        
        {/* Click hint */}
        <div className="text-[9px] text-muted-foreground/60 pt-1">
          Click to jump to this move
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

// ===================== PHASE BUTTON COMPONENT =====================

interface PhaseButtonProps {
  phase: string;
  isActive: boolean;
  moveCount: number;
  onClick: () => void;
  phaseInfo?: GamePhase;
  compact?: boolean;
}

export const PhaseButton: React.FC<PhaseButtonProps> = ({
  phase,
  isActive,
  moveCount,
  onClick,
  phaseInfo,
  compact = false
}) => {
  const config = phaseConfig[phase];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`flex items-center gap-1.5 ${compact ? 'h-6 px-2' : 'h-7 px-3'} rounded-md text-xs font-medium
            border transition-all duration-200
            ${isActive 
              ? `${config.bgColor} ${config.color} border-current shadow-sm` 
              : 'border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
        >
          <Icon className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span className={compact ? 'text-[10px]' : ''}>{config.label}</span>
          <span className={`${compact ? 'text-[8px]' : 'text-[10px]'} opacity-70`}>({moveCount})</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[260px] p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${isActive ? config.bgColor : 'bg-muted'}`}>
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
          </div>
          <div className="font-semibold">{config.label}</div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {config.description}
        </p>
        {phaseInfo && phaseInfo.keyEvents.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <div className="text-[10px] font-medium text-muted-foreground mb-1">Key Events</div>
            <ul className="text-xs space-y-0.5">
              {phaseInfo.keyEvents.slice(0, 3).map((event, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary/60" />
                  {event}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="text-[9px] text-muted-foreground/60 pt-1">
          Click to view only {config.label.toLowerCase()} moves and update the board
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default TimelineMarker;
