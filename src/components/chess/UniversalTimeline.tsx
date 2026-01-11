import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge, 
  Flag, Sword, Crown, Zap, Target, Castle, Info, ChevronUp, ChevronDown, Keyboard,
  Navigation, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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

interface KeyMoment {
  moveNumber: number;
  type: 'capture' | 'check' | 'checkmate' | 'castling' | 'promotion';
  move: string;
  player: 'white' | 'black';
}

interface UniversalTimelineProps {
  totalMoves: number;
  moves?: string[];
  moveHistory?: MoveHistoryEntry[];
  currentMove: number;
  onMoveChange: (move: number) => void;
  compact?: boolean;
  vertical?: boolean;
}

// Icon descriptions for tooltips
const ICON_DESCRIPTIONS = {
  capture: {
    icon: Target,
    color: 'bg-orange-500 text-orange-400',
    label: 'Capture',
    description: 'A piece was captured. Captures often shift the material balance and can open new tactical opportunities.',
  },
  check: {
    icon: Zap,
    color: 'bg-yellow-500 text-yellow-400',
    label: 'Check',
    description: 'The king is under attack! The opponent must respond to escape the threat.',
  },
  checkmate: {
    icon: Crown,
    color: 'bg-red-500 text-red-400',
    label: 'Checkmate',
    description: 'Game over! The king cannot escape and the game ends in victory.',
  },
  castling: {
    icon: Castle,
    color: 'bg-blue-500 text-blue-400',
    label: 'Castle',
    description: 'The king moves to safety while activating the rook. A crucial defensive and developmental move.',
  },
  promotion: {
    icon: Crown,
    color: 'bg-purple-500 text-purple-400',
    label: 'Promotion',
    description: 'A pawn reached the end and was promoted to a more powerful piece!',
  },
};

// Analyze moves to find key moments
function findKeyMoments(moves: string[], moveHistory?: MoveHistoryEntry[]): KeyMoment[] {
  const moments: KeyMoment[] = [];
  const movesToAnalyze = moves.length > 0 ? moves : (moveHistory?.map(() => '') || []);
  
  movesToAnalyze.forEach((move, index) => {
    const moveNumber = index + 1;
    const player: 'white' | 'black' = index % 2 === 0 ? 'white' : 'black';
    
    // Check for checkmate
    if (move.includes('#')) {
      moments.push({ moveNumber, type: 'checkmate', move, player });
    }
    // Check for check (but not checkmate)
    else if (move.includes('+')) {
      moments.push({ moveNumber, type: 'check', move, player });
    }
    
    // Check for capture
    if (move.includes('x')) {
      moments.push({ moveNumber, type: 'capture', move, player });
    }
    
    // Check for castling
    if (move.includes('O-O') || move.includes('0-0')) {
      moments.push({ moveNumber, type: 'castling', move, player });
    }
    
    // Check for promotion
    if (move.includes('=')) {
      moments.push({ moveNumber, type: 'promotion', move, player });
    }
  });
  
  return moments;
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

  // Find key moments
  const keyMoments = useMemo(() => findKeyMoments(moves, moveHistory), [moves, moveHistory]);

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
    const grouped: Record<string, KeyMoment[]> = {
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
  const formatMoveDisplay = (moment: KeyMoment) => {
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
            <span className="text-muted-foreground">Key moments:</span>
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
                    <TooltipContent side="bottom" className="max-w-[200px] p-3">
                      <div className="space-y-1">
                        <div className="font-semibold flex items-center gap-1.5">
                          <Icon className={`w-4 h-4 ${config.color.split(' ')[1]}`} />
                          {config.label}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {config.description}
                        </p>
                        <p className="text-[10px] text-primary mt-1">
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

        {/* Current move label */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{getMoveLabel()}</div>
          <div className="text-xs text-muted-foreground">
            {currentMove >= totalMoves ? totalMoves : currentMove} / {totalMoves}
          </div>
        </div>

        {/* Slider with moment markers */}
        <div className="relative">
          {/* Key moment markers */}
          <div className="absolute inset-x-0 top-0 h-5 pointer-events-none z-10">
            {keyMoments.slice(0, 20).map((moment, idx) => {
              const position = (moment.moveNumber / totalMoves) * 100;
              const config = ICON_DESCRIPTIONS[moment.type];
              const Icon = config.icon;
              const moveIndex = moment.moveNumber - 1;
              const moveNum = Math.floor(moveIndex / 2) + 1;
              const isWhiteMove = moveIndex % 2 === 0;
              
              return (
                <Tooltip key={`${moment.moveNumber}-${moment.type}-${idx}`}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onMoveChange(moment.moveNumber)}
                      className={`absolute -translate-x-1/2 -top-1 w-4 h-4 rounded-full ${config.color.split(' ')[0]} 
                        flex items-center justify-center cursor-pointer pointer-events-auto
                        hover:scale-125 transition-transform shadow-lg ring-1 ring-black/20
                        ${moment.player === 'white' ? 'ring-white/30' : 'ring-black/50'}`}
                      style={{ left: `${position}%` }}
                    >
                      <Icon className="w-2.5 h-2.5 text-white" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[180px] p-2">
                    <div className="space-y-1">
                      <div className="font-semibold flex items-center gap-1">
                        <Icon className={`w-3 h-3 ${config.color.split(' ')[1]}`} />
                        {config.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {moveNum}.{isWhiteMove ? '' : '..'} {moment.move}
                      </div>
                      <p className="text-[9px] text-muted-foreground/80 leading-snug">
                        {config.description}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
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
            <TooltipContent>
              <p className="text-xs">Reset to show all moves (End)</p>
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
            <TooltipContent>
              <p className="text-xs">Previous move (←)</p>
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
            <TooltipContent>
              <p className="text-xs">{isPlaying ? 'Pause playback (Space)' : 'Play through moves (Space)'}</p>
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
            <TooltipContent>
              <p className="text-xs">Next move (→)</p>
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
