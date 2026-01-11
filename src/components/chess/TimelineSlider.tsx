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

interface TimelineSliderProps {
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

const TimelineSlider: React.FC<TimelineSliderProps> = ({ totalMoves, moves = [] }) => {
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
      if (selectedPhase === 'all') return 'All Moves';
      return `All ${phaseConfig[selectedPhase].label}`;
    }
    if (currentMove === 0 || currentMove === range.start) {
      if (selectedPhase !== 'all') return `${phaseConfig[selectedPhase].label} Start`;
      return 'Start';
    }
    const moveIndex = currentMove - 1;
    if (moves[moveIndex]) {
      const moveNum = Math.floor(moveIndex / 2) + 1;
      const isWhite = moveIndex % 2 === 0;
      return `${moveNum}.${isWhite ? '' : '..'} ${moves[moveIndex]}`;
    }
    return `Move ${currentMove}`;
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

  // Calculate position for a moment marker
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
      <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-4 space-y-4">
        {/* Header with phase selector */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Timeline
            </span>
            {player && (
              <div className={`w-2 h-2 rounded-full ${player === 'white' ? 'bg-sky-400' : 'bg-rose-400'}`} />
            )}
          </div>
          
          {/* Phase filter buttons */}
          <div className="flex items-center gap-1">
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
                  className={`h-6 px-2 text-[10px] gap-1 border transition-all ${
                    isActive 
                      ? config.color + ' border-current' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  title={`${config.label} (${moveCount} moves)`}
                >
                  {config.icon}
                  <span className="hidden sm:inline">{config.label}</span>
                  <span className="text-[9px] opacity-70">({moveCount})</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Key moments summary */}
        {visibleMoments.length > 0 && (
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-muted-foreground">Key moments:</span>
            <div className="flex items-center gap-2">
              {momentCounts.capture > 0 && (
                <div className="flex items-center gap-1 text-orange-400">
                  <Target className="w-3 h-3" />
                  <span>{momentCounts.capture}</span>
                </div>
              )}
              {momentCounts.check > 0 && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Zap className="w-3 h-3" />
                  <span>{momentCounts.check}</span>
                </div>
              )}
              {momentCounts.checkmate > 0 && (
                <div className="flex items-center gap-1 text-red-400">
                  <Crown className="w-3 h-3" />
                  <span>{momentCounts.checkmate}</span>
                </div>
              )}
              {momentCounts.castling > 0 && (
                <div className="flex items-center gap-1 text-blue-400">
                  <Castle className="w-3 h-3" />
                  <span>{momentCounts.castling}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Move label */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            {getMoveLabel()}
          </div>
          {selectedPhase !== 'all' && (
            <div className="text-xs text-muted-foreground">
              Moves {range.start + 1}-{range.end}
            </div>
          )}
        </div>

        {/* Slider with moment markers */}
        <div className="relative">
          {/* Key moment markers */}
          <div className="absolute inset-x-0 top-0 h-5 pointer-events-none z-10">
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
                      className={`absolute -translate-x-1/2 -top-1 w-4 h-4 rounded-full ${config.color} 
                        flex items-center justify-center cursor-pointer pointer-events-auto
                        hover:scale-125 transition-transform shadow-lg ring-1 ring-black/20
                        ${moment.player === 'white' ? 'ring-white/30' : 'ring-black/50'}`}
                      style={{ left: `${position}%` }}
                    >
                      <Icon className="w-2.5 h-2.5 text-white" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="font-medium">{config.label}</div>
                    <div className="text-muted-foreground">
                      {moveNum}.{isWhiteMove ? '' : '..'} {moment.move}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          <Slider
            value={[displayMove]}
            min={range.start}
            max={range.end}
            step={1}
            onValueChange={handleSliderChange}
            className="w-full mt-2"
          />
          {/* Move markers for key positions */}
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1 px-0.5">
            <span>{selectedPhase === 'all' ? 'Start' : `Move ${range.start + 1}`}</span>
            <span className="text-center">
              {phaseMoveCount} moves
            </span>
            <span>{selectedPhase === 'all' ? `End (${range.end})` : `Move ${range.end}`}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {/* Reset button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="h-8 w-8 p-0"
            title={`Show all ${selectedPhase === 'all' ? 'moves' : phaseConfig[selectedPhase].label.toLowerCase() + ' moves'}`}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Step backward */}
          <Button
            variant="ghost"
            size="sm"
            onClick={stepBackward}
            disabled={isAtStart}
            className="h-8 w-8 p-0"
            title="Previous move"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          {/* Play/Pause */}
          <Button
            variant={isPlaying ? "secondary" : "default"}
            size="sm"
            onClick={togglePlayback}
            className="h-10 w-10 p-0 rounded-full"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          {/* Step forward */}
          <Button
            variant="ghost"
            size="sm"
            onClick={stepForward}
            disabled={isAtEnd}
            className="h-8 w-8 p-0"
            title="Next move"
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          {/* Speed selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 gap-1 text-xs"
                title="Playback speed"
              >
                <Gauge className="h-3 w-3" />
                {currentSpeedLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

        {/* Progress indicator */}
        {isPlaying && (
          <div className="h-1 bg-muted rounded-full overflow-hidden">
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

export default TimelineSlider;
