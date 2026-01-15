import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge, 
  Flag, Sword, Crown, Zap, Target, Castle, Info, ChevronUp, ChevronDown, Keyboard,
  Navigation, ChevronRight, BookOpen, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MoveHistoryEntry } from './EnPensentOverlay';
import { KeyMomentMarker, KeyMoment as EnhancedKeyMoment, KeyMomentType } from './KeyMomentMarker';
import { analyzeTimeline, TimelineAnalysisResult } from '@/lib/chess/timelineAnalysis';

// Local KeyMoment type for basic parsing (converted to EnhancedKeyMoment for display)
interface LocalKeyMoment {
  moveNumber: number;
  type: 'capture' | 'check' | 'checkmate' | 'castling' | 'promotion';
  move: string;
  player: 'white' | 'black';
}

interface GamePhase {
  name: 'opening' | 'middlegame' | 'endgame';
  startMove: number;
  endMove: number;
  color: string;
  bgColor: string;
  icon: typeof Flag;
  description: string;
}

interface UniversalTimelineProps {
  totalMoves: number;
  moves?: string[];
  moveHistory?: MoveHistoryEntry[];
  currentMove: number;
  onMoveChange: (move: number) => void;
  compact?: boolean;
  vertical?: boolean;
  pgn?: string; // Added for deep analysis
}

// Icon descriptions for tooltips with richer content
const ICON_DESCRIPTIONS = {
  capture: {
    icon: Target,
    color: 'bg-orange-500 text-orange-400',
    label: 'Capture',
    description: 'A piece was captured, shifting material balance.',
    tactical: 'Captures often open new tactical opportunities and change the positional landscape of the game.',
    emoji: '⚔️',
  },
  check: {
    icon: Zap,
    color: 'bg-yellow-500 text-yellow-400',
    label: 'Check',
    description: 'The king is under direct attack!',
    tactical: 'The opponent must immediately respond to escape the threat. Checks can disrupt plans and force defensive moves.',
    emoji: '⚡',
  },
  checkmate: {
    icon: Crown,
    color: 'bg-red-500 text-red-400',
    label: 'Checkmate',
    description: 'Game over! The king cannot escape.',
    tactical: 'The ultimate goal of chess. The king is in check with no legal moves to escape.',
    emoji: '👑',
  },
  castling: {
    icon: Castle,
    color: 'bg-blue-500 text-blue-400',
    label: 'Castle',
    description: 'King moves to safety, rook activates.',
    tactical: 'A crucial defensive and developmental move. Protects the king while connecting the rooks.',
    emoji: '🏰',
  },
  promotion: {
    icon: Crown,
    color: 'bg-purple-500 text-purple-400',
    label: 'Promotion',
    description: 'Pawn promoted to a powerful piece!',
    tactical: 'A pawn reaching the 8th rank transforms into a queen, rook, bishop, or knight. Usually decisive.',
    emoji: '✨',
  },
};

// Phase descriptions for the timeline
const PHASE_CONFIG = {
  opening: {
    name: 'Opening',
    description: 'The first 10-15 moves where players develop pieces and fight for center control.',
    tips: 'Control the center, develop pieces, castle early, connect rooks.',
    icon: Flag,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
  },
  middlegame: {
    name: 'Middlegame',
    description: 'The strategic battle where tactics, attacks, and positional play dominate.',
    tips: 'Create threats, improve piece activity, target weaknesses.',
    icon: Sword,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
  },
  endgame: {
    name: 'Endgame',
    description: 'Few pieces remain. King becomes active, passed pawns are crucial.',
    tips: 'Activate the king, create passed pawns, simplify if ahead.',
    icon: Crown,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
  },
};

// Analyze moves to find key moments
function findKeyMoments(moves: string[], moveHistory?: MoveHistoryEntry[]): LocalKeyMoment[] {
  const moments: LocalKeyMoment[] = [];
  const movesToAnalyze = moves.length > 0 ? moves : (moveHistory?.map(() => '') || []);
  
  movesToAnalyze.forEach((move, index) => {
    const moveNumber = index + 1;
    const player: 'white' | 'black' = index % 2 === 0 ? 'white' : 'black';
    
    if (move.includes('#')) {
      moments.push({ moveNumber, type: 'checkmate', move, player });
    } else if (move.includes('+')) {
      moments.push({ moveNumber, type: 'check', move, player });
    }
    
    if (move.includes('x')) {
      moments.push({ moveNumber, type: 'capture', move, player });
    }
    
    if (move.includes('O-O') || move.includes('0-0')) {
      moments.push({ moveNumber, type: 'castling', move, player });
    }
    
    if (move.includes('=')) {
      moments.push({ moveNumber, type: 'promotion', move, player });
    }
  });
  
  return moments;
}

// Calculate game phases based on total moves
function calculateGamePhases(totalMoves: number): GamePhase[] {
  if (totalMoves === 0) return [];
  
  const phases: GamePhase[] = [];
  
  // Opening: first ~20% of moves, max 30 half-moves
  const openingEnd = Math.min(Math.floor(totalMoves * 0.25), 30);
  
  // Endgame: last ~30% of moves, starts after move 60 minimum
  const endgameStart = Math.max(Math.floor(totalMoves * 0.7), Math.min(60, totalMoves));
  
  phases.push({
    name: 'opening',
    startMove: 1,
    endMove: openingEnd,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    icon: Flag,
    description: 'Development & center control',
  });
  
  if (openingEnd < endgameStart - 1) {
    phases.push({
      name: 'middlegame',
      startMove: openingEnd + 1,
      endMove: endgameStart - 1,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      icon: Sword,
      description: 'Tactics & attacks',
    });
  }
  
  if (endgameStart <= totalMoves) {
    phases.push({
      name: 'endgame',
      startMove: endgameStart,
      endMove: totalMoves,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      icon: Crown,
      description: 'King activation & pawns',
    });
  }
  
  return phases;
}

export const UniversalTimeline: React.FC<UniversalTimelineProps> = ({
  totalMoves,
  moves = [],
  moveHistory = [],
  currentMove,
  onMoveChange,
  compact = false,
  vertical = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(500);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showShortcutHint, setShowShortcutHint] = useState(true);

  // Find key moments and game phases
  const keyMoments = useMemo(() => findKeyMoments(moves, moveHistory), [moves, moveHistory]);
  const gamePhases = useMemo(() => calculateGamePhases(totalMoves), [totalMoves]);
  
  // Get current phase
  const currentPhase = useMemo(() => {
    return gamePhases.find(p => currentMove >= p.startMove && currentMove <= p.endMove);
  }, [gamePhases, currentMove]);

  // Keyboard shortcuts for timeline control
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target as HTMLElement).isContentEditable
    ) {
      return;
    }

    switch (e.key) {
      case ' ': // Space - play/pause
        e.preventDefault();
        if (currentMove >= totalMoves) {
          onMoveChange(0);
        }
        setIsPlaying(prev => !prev);
        setShowShortcutHint(false);
        break;
      case 'ArrowRight': // Step forward
        e.preventDefault();
        if (currentMove < totalMoves) {
          onMoveChange(currentMove + 1);
        }
        setShowShortcutHint(false);
        break;
      case 'ArrowLeft': // Step backward
        e.preventDefault();
        if (currentMove > 0) {
          onMoveChange(currentMove - 1);
        }
        setShowShortcutHint(false);
        break;
      case 'Home': // Go to start
        e.preventDefault();
        setIsPlaying(false);
        onMoveChange(0);
        break;
      case 'End': // Go to end (show all)
        e.preventDefault();
        setIsPlaying(false);
        onMoveChange(totalMoves);
        break;
    }
  }, [currentMove, totalMoves, onMoveChange]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // Playback animation
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      onMoveChange(currentMove >= totalMoves ? totalMoves : currentMove + 1);
      if (currentMove >= totalMoves) {
        setIsPlaying(false);
      }
    }, playbackSpeed);
    
    return () => clearInterval(interval);
  }, [isPlaying, currentMove, totalMoves, playbackSpeed, onMoveChange]);

  const handleSliderChange = (value: number[]) => {
    onMoveChange(value[0]);
  };

  const togglePlayback = () => {
    if (currentMove >= totalMoves) {
      onMoveChange(0);
    }
    setIsPlaying(!isPlaying);
  };

  const stepForward = () => {
    if (currentMove < totalMoves) {
      onMoveChange(currentMove + 1);
    }
  };

  const stepBackward = () => {
    if (currentMove > 0) {
      onMoveChange(currentMove - 1);
    }
  };

  const reset = () => {
    setIsPlaying(false);
    onMoveChange(totalMoves);
  };

  const speedOptions = [
    { label: '0.25x', value: 2000 },
    { label: '0.5x', value: 1000 },
    { label: '1x', value: 500 },
    { label: '2x', value: 250 },
    { label: '4x', value: 125 },
  ];

  const currentSpeedLabel = speedOptions.find(s => s.value === playbackSpeed)?.label || '1x';
  
  const getMoveLabel = () => {
    if (currentMove >= totalMoves || currentMove === Infinity) return `All ${totalMoves} moves`;
    if (currentMove === 0) return 'Start';
    const moveIndex = currentMove - 1;
    if (moves[moveIndex]) {
      const moveNum = Math.floor(moveIndex / 2) + 1;
      const isWhite = moveIndex % 2 === 0;
      return `${moveNum}.${isWhite ? '' : '..'} ${moves[moveIndex]}`;
    }
    return `Move ${currentMove}`;
  };

  const getCurrentPlayer = () => {
    if (currentMove === 0 || currentMove >= totalMoves) return null;
    return (currentMove % 2 === 1) ? 'white' : 'black';
  };

  const player = getCurrentPlayer();

  // Count moments by type
  const momentCounts = useMemo(() => {
    const counts = { capture: 0, check: 0, checkmate: 0, castling: 0, promotion: 0 };
    keyMoments.forEach(m => counts[m.type]++);
    return counts;
  }, [keyMoments]);

  // Group moments by type for jump menu
  const momentsByType = useMemo(() => {
    const grouped: Record<string, LocalKeyMoment[]> = {
      capture: [],
      check: [],
      checkmate: [],
      castling: [],
      promotion: [],
    };
    keyMoments.forEach(m => grouped[m.type].push(m));
    return grouped;
  }, [keyMoments]);

  // Format move for display
  const formatMoveDisplay = (moment: LocalKeyMoment) => {
    const moveIndex = moment.moveNumber - 1;
    const moveNum = Math.floor(moveIndex / 2) + 1;
    const isWhite = moveIndex % 2 === 0;
    return `${moveNum}.${isWhite ? '' : '..'} ${moment.move}`;
  };

  if (totalMoves === 0) return null;

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="flex items-center gap-2 p-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-accent/30 transition-colors"
      >
        <Play className="w-3 h-3 text-primary" />
        <span className="text-xs font-display uppercase tracking-wider">Timeline</span>
        <ChevronDown className="w-3 h-3" />
      </button>
    );
  }

  return (
    <TooltipProvider>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-3 space-y-3 ${
          compact ? 'max-w-xs' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-display font-semibold uppercase tracking-widest text-muted-foreground">
              Timeline
            </span>
            {player && (
              <div className={`w-2 h-2 rounded-full ${player === 'white' ? 'bg-sky-400' : 'bg-rose-400'}`} />
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded hover:bg-accent/50 transition-colors"
          >
            <ChevronUp className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>

        {/* Key moments summary with tooltips */}
        {keyMoments.length > 0 && (
          <div className="flex items-center gap-3 text-[10px] flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground flex items-center gap-1 cursor-help">
                  <Info className="w-3 h-3" />
                  Key moments:
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] p-3">
                <div className="space-y-2">
                  <div className="font-semibold">Key Moments</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Critical events that shaped the game. Click any marker on the timeline to jump directly to that moment.
                  </p>
                  <p className="text-[10px] text-primary italic">
                    💡 Hover over icons for details
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(momentCounts).map(([type, count]) => {
                if (count === 0) return null;
                const config = ICON_DESCRIPTIONS[type as keyof typeof ICON_DESCRIPTIONS];
                const Icon = config.icon;
                
                return (
                  <Tooltip key={type}>
                    <TooltipTrigger asChild>
                      <button className={`flex items-center gap-1 ${config.color.split(' ')[1]} hover:scale-110 transition-transform cursor-help`}>
                        <Icon className="w-3 h-3" />
                        <span>{count}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[240px] p-3">
                      <div className="space-y-2">
                        <div className="font-semibold flex items-center gap-2">
                          <span className="text-lg">{config.emoji}</span>
                          <Icon className={`w-4 h-4 ${config.color.split(' ')[1]}`} />
                          {config.label}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {config.description}
                        </p>
                        <p className="text-xs leading-relaxed border-t border-border/50 pt-2">
                          {config.tactical}
                        </p>
                        <p className="text-[10px] text-primary mt-1 font-medium">
                          {count} occurrence{count !== 1 ? 's' : ''} in this game
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
            })}
          </div>
        </div>
        )}

        {/* Game Phase Navigation */}
        {gamePhases.length > 0 && (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground flex items-center gap-1 cursor-help">
                  <Layers className="w-3 h-3" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] p-3">
                <div className="space-y-2">
                  <div className="font-semibold">Game Phases</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click any phase to jump to its starting position. View how the game evolved through each stage.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
            
            {/* All Moves Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentMove >= totalMoves ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-[10px] font-medium"
                  onClick={() => onMoveChange(totalMoves)}
                >
                  All Moves
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] p-3">
                <div className="space-y-1">
                  <div className="font-semibold">All Moves</div>
                  <p className="text-xs text-muted-foreground">Show the complete visualization with all {totalMoves} moves.</p>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Phase Buttons */}
            {gamePhases.map((phase) => {
              const phaseConfig = PHASE_CONFIG[phase.name];
              const PhaseIcon = phaseConfig.icon;
              const isActive = currentMove >= phase.startMove && currentMove <= phase.endMove && currentMove < totalMoves;
              
              return (
                <Tooltip key={phase.name}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={`h-6 px-2 text-[10px] font-medium gap-1 ${isActive ? phaseConfig.bgColor : ''}`}
                      onClick={() => onMoveChange(phase.startMove)}
                    >
                      <PhaseIcon className={`w-3 h-3 ${phaseConfig.color}`} />
                      <span className="hidden sm:inline capitalize">{phase.name}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[240px] p-3">
                    <div className="space-y-2">
                      <div className="font-semibold flex items-center gap-2">
                        <PhaseIcon className={`w-4 h-4 ${phaseConfig.color}`} />
                        {phaseConfig.name}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {phaseConfig.description}
                      </p>
                      <p className="text-xs leading-relaxed border-t border-border/50 pt-2">
                        {phaseConfig.tips}
                      </p>
                      <p className="text-[10px] text-primary mt-1 font-medium">
                        Moves {phase.startMove} - {phase.endMove}
                      </p>
                      <p className="text-[10px] text-primary italic">
                        Click to jump to start of {phase.name}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}

        {/* Current move label */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{getMoveLabel()}</div>
          <div className="text-xs text-muted-foreground">
            {currentMove >= totalMoves ? totalMoves : currentMove} / {totalMoves}
          </div>
        </div>

        {/* Slider with moment markers */}
        <div className="relative">
          {/* Key moment markers - now using enhanced KeyMomentMarker with hover highlighting */}
          <div className="absolute inset-x-0 top-0 h-5 pointer-events-none z-10">
            {keyMoments.slice(0, 20).map((moment, idx) => {
              const position = (moment.moveNumber / totalMoves) * 100;
              
              // Convert LocalKeyMoment to EnhancedKeyMoment for the marker
              const enhancedMoment: EnhancedKeyMoment = {
                moveNumber: moment.moveNumber,
                type: moment.type as KeyMomentType,
                move: moment.move,
                player: moment.player,
              };
              
              return (
                <div key={`${moment.moveNumber}-${moment.type}-${idx}`} className="pointer-events-auto">
                  <KeyMomentMarker
                    moment={enhancedMoment}
                    position={position}
                    totalMoves={totalMoves}
                    onClick={onMoveChange}
                    size="md"
                  />
                </div>
              );
            })}
          </div>

          <Slider
            value={[Math.min(currentMove, totalMoves)]}
            min={0}
            max={totalMoves}
            step={1}
            onValueChange={handleSliderChange}
            className="w-full mt-2"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={reset} className="h-8 w-8 p-0">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] p-3">
              <div className="space-y-1">
                <div className="font-semibold">Show Complete Vision</div>
                <p className="text-xs text-muted-foreground">Reset to display all moves, revealing the full artistic pattern. Press End.</p>
                <p className="text-[10px] text-primary italic">💡 Complete visions have higher collector value</p>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={stepBackward}
                disabled={currentMove <= 0}
                className="h-8 w-8 p-0"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] p-3">
              <div className="space-y-1">
                <div className="font-semibold">Previous Move</div>
                <p className="text-xs text-muted-foreground">Step back through the game's evolution. Use ← arrow key.</p>
                <p className="text-[10px] text-primary italic">💡 Watch patterns emerge in reverse</p>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isPlaying ? "secondary" : "default"}
                size="sm"
                onClick={() => {
                  togglePlayback();
                  setShowShortcutHint(false);
                }}
                className="h-10 w-10 p-0 rounded-full"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px] p-3">
              <div className="space-y-1">
                <div className="font-semibold">{isPlaying ? 'Pause Animation' : 'Animate Vision'}</div>
                <p className="text-xs text-muted-foreground">
                  {isPlaying 
                    ? 'Freeze the current state for analysis or capture.' 
                    : 'Watch the visualization build move-by-move, revealing the game\'s story.'}
                </p>
                <p className="text-[10px] text-primary italic">⌨️ Press Space to toggle</p>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={stepForward}
                disabled={currentMove >= totalMoves}
                className="h-8 w-8 p-0"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] p-3">
              <div className="space-y-1">
                <div className="font-semibold">Next Move</div>
                <p className="text-xs text-muted-foreground">Advance through the game. Use → arrow key.</p>
                <p className="text-[10px] text-primary italic">💡 Each move adds new layers to the art</p>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Speed selector */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs">
                    <Gauge className="h-3 w-3" />
                    {currentSpeedLabel}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Playback speed</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="bg-popover">
              {speedOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setPlaybackSpeed(option.value)}
                  className={playbackSpeed === option.value ? 'bg-accent' : ''}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Jump to Key Moment */}
          {keyMoments.length > 0 && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs">
                      <Navigation className="h-3 w-3" />
                      <span className="hidden sm:inline">Jump</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Jump to key moment</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-56 bg-popover max-h-80 overflow-y-auto">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Jump to Key Moment
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Captures */}
                {momentsByType.capture.length > 0 && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-2">
                      <Target className="h-3.5 w-3.5 text-orange-400" />
                      <span>Captures</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {momentsByType.capture.length}
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-popover max-h-60 overflow-y-auto">
                      {momentsByType.capture.map((moment, idx) => (
                        <DropdownMenuItem
                          key={`capture-${idx}`}
                          onClick={() => onMoveChange(moment.moveNumber)}
                          className="flex items-center gap-2"
                        >
                          <div className={`w-2 h-2 rounded-full ${moment.player === 'white' ? 'bg-sky-400' : 'bg-rose-400'}`} />
                          <span className="font-mono text-xs">{formatMoveDisplay(moment)}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}

                {/* Checks */}
                {momentsByType.check.length > 0 && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-yellow-400" />
                      <span>Checks</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {momentsByType.check.length}
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-popover max-h-60 overflow-y-auto">
                      {momentsByType.check.map((moment, idx) => (
                        <DropdownMenuItem
                          key={`check-${idx}`}
                          onClick={() => onMoveChange(moment.moveNumber)}
                          className="flex items-center gap-2"
                        >
                          <div className={`w-2 h-2 rounded-full ${moment.player === 'white' ? 'bg-sky-400' : 'bg-rose-400'}`} />
                          <span className="font-mono text-xs">{formatMoveDisplay(moment)}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}

                {/* Castling */}
                {momentsByType.castling.length > 0 && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-2">
                      <Castle className="h-3.5 w-3.5 text-blue-400" />
                      <span>Castling</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {momentsByType.castling.length}
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-popover max-h-60 overflow-y-auto">
                      {momentsByType.castling.map((moment, idx) => (
                        <DropdownMenuItem
                          key={`castling-${idx}`}
                          onClick={() => onMoveChange(moment.moveNumber)}
                          className="flex items-center gap-2"
                        >
                          <div className={`w-2 h-2 rounded-full ${moment.player === 'white' ? 'bg-sky-400' : 'bg-rose-400'}`} />
                          <span className="font-mono text-xs">{formatMoveDisplay(moment)}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}

                {/* Promotions */}
                {momentsByType.promotion.length > 0 && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-2">
                      <Crown className="h-3.5 w-3.5 text-purple-400" />
                      <span>Promotions</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {momentsByType.promotion.length}
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-popover max-h-60 overflow-y-auto">
                      {momentsByType.promotion.map((moment, idx) => (
                        <DropdownMenuItem
                          key={`promotion-${idx}`}
                          onClick={() => onMoveChange(moment.moveNumber)}
                          className="flex items-center gap-2"
                        >
                          <div className={`w-2 h-2 rounded-full ${moment.player === 'white' ? 'bg-sky-400' : 'bg-rose-400'}`} />
                          <span className="font-mono text-xs">{formatMoveDisplay(moment)}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}

                {/* Checkmates */}
                {momentsByType.checkmate.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {momentsByType.checkmate.map((moment, idx) => (
                      <DropdownMenuItem
                        key={`checkmate-${idx}`}
                        onClick={() => onMoveChange(moment.moveNumber)}
                        className="flex items-center gap-2 text-red-400"
                      >
                        <Crown className="h-3.5 w-3.5" />
                        <span className="font-semibold">Checkmate!</span>
                        <span className="font-mono text-xs ml-auto">{formatMoveDisplay(moment)}</span>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Keyboard shortcut hint */}
        <AnimatePresence>
          {showShortcutHint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground"
            >
              <Keyboard className="w-3 h-3" />
              <span>Space: Play/Pause • ←/→: Step • Home/End: Jump</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar during playback */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 4 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-muted rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-sky-500 via-purple-500 to-rose-500"
                style={{ width: `${(currentMove / totalMoves) * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  );
};

export default UniversalTimeline;
