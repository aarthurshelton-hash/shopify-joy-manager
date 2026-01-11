import React, { useEffect, useMemo } from 'react';
import { useTimeline, GamePhase } from '@/contexts/TimelineContext';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge, Flag, Sword, Crown, Zap, Target, Castle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VerticalTimelineSliderProps {
  totalMoves: number;
  moves?: string[];
}

interface KeyMoment {
  moveNumber: number;
  type: 'capture' | 'check' | 'checkmate' | 'castling';
  move: string;
  player: 'white' | 'black';
}

const momentConfig = {
  capture: { icon: Target, color: 'bg-orange-500', label: 'Capture' },
  check: { icon: Zap, color: 'bg-yellow-500', label: 'Check' },
  checkmate: { icon: Crown, color: 'bg-red-500', label: 'Checkmate' },
  castling: { icon: Castle, color: 'bg-blue-500', label: 'Castle' },
};

const phaseConfig: Record<GamePhase, { label: string; icon: React.ReactNode; color: string }> = {
  all: { label: 'All', icon: null, color: 'bg-muted hover:bg-muted/80' },
  opening: { label: 'Opening', icon: <Flag className="w-3 h-3" />, color: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30' },
  middlegame: { label: 'Middle', icon: <Sword className="w-3 h-3" />, color: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30' },
  endgame: { label: 'Endgame', icon: <Crown className="w-3 h-3" />, color: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border-rose-500/30' },
};

// Analyze moves to find key moments
function findKeyMoments(moves: string[]): KeyMoment[] {
  const moments: KeyMoment[] = [];
  
  moves.forEach((move, index) => {
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
  });
  
  return moments;
}

const VerticalTimelineSlider: React.FC<VerticalTimelineSliderProps> = ({ totalMoves, moves = [] }) => {
  const {
    currentMove,
    maxMoves,
    isPlaying,
    playbackSpeed,
    selectedPhase,
    phaseRanges,
    setCurrentMove,
    setMaxMoves,
    togglePlayback,
    reset,
    stepForward,
    stepBackward,
    setPlaybackSpeed,
    setSelectedPhase,
  } = useTimeline();

  // Find key moments in the game
  const keyMoments = useMemo(() => findKeyMoments(moves), [moves]);

  // Update max moves when totalMoves changes
  useEffect(() => {
    setMaxMoves(totalMoves);
  }, [totalMoves, setMaxMoves]);

  const range = phaseRanges[selectedPhase];
  const displayMove = currentMove === Infinity ? range.end : Math.min(currentMove, range.end);
  const isAtEnd = displayMove >= range.end;
  const isAtStart = currentMove <= range.start || currentMove === 0;

  // Filter key moments to current phase
  const visibleMoments = useMemo(() => 
    keyMoments.filter(m => m.moveNumber >= range.start && m.moveNumber <= range.end),
    [keyMoments, range]
  );

  // Format move display (e.g., "Move 15" or "1. e4")
  const getMoveLabel = () => {
    if (currentMove === Infinity || currentMove >= range.end) {
      if (selectedPhase === 'all') return 'All';
      return phaseConfig[selectedPhase].label;
    }
    if (currentMove === 0 || currentMove === range.start) {
      return 'Start';
    }
    const moveIndex = currentMove - 1;
    if (moves[moveIndex]) {
      const moveNum = Math.floor(moveIndex / 2) + 1;
      const isWhite = moveIndex % 2 === 0;
      return `${moveNum}.${isWhite ? '' : '..'} ${moves[moveIndex]}`;
    }
    return `${currentMove}`;
  };

  // Get current player
  const getCurrentPlayer = () => {
    if (currentMove === 0 || currentMove === Infinity) return null;
    return (currentMove % 2 === 1) ? 'white' : 'black';
  };

  const handleSliderChange = (value: number[]) => {
    const newValue = value[0];
    if (newValue >= range.end) {
      setCurrentMove(Infinity);
    } else {
      setCurrentMove(Math.max(newValue, range.start));
    }
  };

  const handleMomentClick = (moveNumber: number) => {
    setCurrentMove(moveNumber);
  };

  const speedOptions = [
    { label: '0.25x', value: 2000 },
    { label: '0.5x', value: 1000 },
    { label: '1x', value: 500 },
    { label: '2x', value: 250 },
    { label: '4x', value: 125 },
  ];

  const currentSpeedLabel = speedOptions.find(s => s.value === playbackSpeed)?.label || '1x';
  const player = getCurrentPlayer();
  const phaseMoveCount = range.end - range.start;

  // Calculate position for a moment marker (vertical - from top)
  const getMomentPosition = (moveNumber: number) => {
    return ((moveNumber - range.start) / phaseMoveCount) * 100;
  };

  // Count moments by type for summary
  const momentCounts = useMemo(() => {
    const counts = { capture: 0, check: 0, checkmate: 0, castling: 0 };
    visibleMoments.forEach(m => counts[m.type]++);
    return counts;
  }, [visibleMoments]);

  return (
    <TooltipProvider>
      <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-3 h-full flex flex-col w-[140px] min-w-[140px]">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 pb-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Timeline
            </span>
            {player && (
              <div className={`w-2 h-2 rounded-full ${player === 'white' ? 'bg-sky-400' : 'bg-rose-400'}`} />
            )}
          </div>
          
          {/* Current move label */}
          <div className="text-xs font-medium text-center truncate w-full">
            {getMoveLabel()}
          </div>
        </div>

        {/* Phase filter buttons - vertical stack */}
        <div className="flex flex-col gap-1 py-3 border-b border-border/30">
          {(Object.keys(phaseConfig) as GamePhase[]).map((phase) => {
            const config = phaseConfig[phase];
            const isActive = selectedPhase === phase;
            const phaseRange = phaseRanges[phase];
            const moveCount = phaseRange.end - phaseRange.start;
            
            return (
              <Button
                key={phase}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPhase(phase)}
                className={`h-6 px-2 text-[9px] gap-1 border transition-all justify-start ${
                  isActive 
                    ? config.color + ' border-current' 
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                title={`${config.label} (${moveCount} moves)`}
              >
                {config.icon}
                <span>{config.label}</span>
                <span className="text-[8px] opacity-70 ml-auto">({moveCount})</span>
              </Button>
            );
          })}
        </div>

        {/* Key moments summary - compact */}
        {visibleMoments.length > 0 && (
          <div className="py-2 border-b border-border/30">
            <div className="text-[9px] text-muted-foreground mb-1 text-center">Key moments</div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {momentCounts.capture > 0 && (
                <div className="flex items-center gap-0.5 text-orange-400">
                  <Target className="w-2.5 h-2.5" />
                  <span className="text-[9px]">{momentCounts.capture}</span>
                </div>
              )}
              {momentCounts.check > 0 && (
                <div className="flex items-center gap-0.5 text-yellow-400">
                  <Zap className="w-2.5 h-2.5" />
                  <span className="text-[9px]">{momentCounts.check}</span>
                </div>
              )}
              {momentCounts.checkmate > 0 && (
                <div className="flex items-center gap-0.5 text-red-400">
                  <Crown className="w-2.5 h-2.5" />
                  <span className="text-[9px]">{momentCounts.checkmate}</span>
                </div>
              )}
              {momentCounts.castling > 0 && (
                <div className="flex items-center gap-0.5 text-blue-400">
                  <Castle className="w-2.5 h-2.5" />
                  <span className="text-[9px]">{momentCounts.castling}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vertical slider with moment markers */}
        <div className="flex-1 flex items-center justify-center py-4 min-h-[200px]">
          <div className="relative h-full flex items-center gap-2">
            {/* Key moment markers on the left side */}
            <div className="relative h-full w-6">
              {visibleMoments.map((moment, idx) => {
                const position = getMomentPosition(moment.moveNumber);
                const config = momentConfig[moment.type];
                const Icon = config.icon;
                const moveIndex = moment.moveNumber - 1;
                const moveNum = Math.floor(moveIndex / 2) + 1;
                const isWhiteMove = moveIndex % 2 === 0;
                
                return (
                  <Tooltip key={`${moment.moveNumber}-${moment.type}-${idx}`}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleMomentClick(moment.moveNumber)}
                        className={`absolute left-0 -translate-y-1/2 w-4 h-4 rounded-full ${config.color} 
                          flex items-center justify-center cursor-pointer
                          hover:scale-125 transition-transform shadow-lg ring-1 ring-black/20
                          ${moment.player === 'white' ? 'ring-white/30' : 'ring-black/50'}`}
                        style={{ top: `${position}%` }}
                      >
                        <Icon className="w-2 h-2 text-white" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      <div className="font-medium">{config.label}</div>
                      <div className="text-muted-foreground">
                        {moveNum}.{isWhiteMove ? '' : '..'} {moment.move}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Vertical slider */}
            <div className="h-full flex flex-col items-center">
              <span className="text-[8px] text-muted-foreground mb-1">Start</span>
              <Slider
                value={[displayMove]}
                min={range.start}
                max={range.end}
                step={1}
                onValueChange={handleSliderChange}
                orientation="vertical"
                className="h-full"
              />
              <span className="text-[8px] text-muted-foreground mt-1">{range.end}</span>
            </div>
          </div>
        </div>

        {/* Controls - compact vertical layout */}
        <div className="pt-3 border-t border-border/30 space-y-2">
          {/* Play/Pause row */}
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={stepBackward}
              disabled={isAtStart}
              className="h-7 w-7 p-0"
              title="Previous move"
            >
              <SkipBack className="h-3 w-3" />
            </Button>

            <Button
              variant={isPlaying ? "secondary" : "default"}
              size="sm"
              onClick={togglePlayback}
              className="h-8 w-8 p-0 rounded-full"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={stepForward}
              disabled={isAtEnd}
              className="h-7 w-7 p-0"
              title="Next move"
            >
              <SkipForward className="h-3 w-3" />
            </Button>
          </div>

          {/* Reset and Speed row */}
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="h-6 w-6 p-0"
              title="Reset"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 gap-0.5 text-[10px]"
                  title="Playback speed"
                >
                  <Gauge className="h-2.5 w-2.5" />
                  {currentSpeedLabel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top">
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
          </div>
        </div>

        {/* Progress indicator */}
        {isPlaying && (
          <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-gradient-to-r from-sky-500 via-purple-500 to-rose-500 transition-all duration-100"
              style={{ width: `${((displayMove - range.start) / phaseMoveCount) * 100}%` }}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default VerticalTimelineSlider;
