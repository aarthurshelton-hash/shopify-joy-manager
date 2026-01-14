import React, { useEffect, useMemo } from 'react';
import { useTimeline, GamePhase } from '@/contexts/TimelineContext';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';
import { analyzeTimeline, getMomentCounts, TimelineAnalysisResult } from '@/lib/chess/timelineAnalysis';
import { TimelineMarker, PhaseButton, momentConfig, phaseConfig } from './EnhancedTimelineMarker';

interface TimelineSliderProps {
  totalMoves: number;
  moves?: string[];
  pgn?: string;
}

const TimelineSlider: React.FC<TimelineSliderProps> = ({ totalMoves, moves = [], pgn }) => {
  const {
    currentMove,
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

  // Comprehensive timeline analysis
  const analysis: TimelineAnalysisResult | null = useMemo(() => {
    if (!pgn || moves.length === 0) return null;
    try {
      return analyzeTimeline(pgn, moves);
    } catch {
      return null;
    }
  }, [pgn, moves]);

  // Update max moves when totalMoves changes
  useEffect(() => {
    setMaxMoves(totalMoves);
  }, [totalMoves, setMaxMoves]);

  const range = phaseRanges[selectedPhase];
  const displayMove = currentMove === Infinity ? range.end : Math.min(currentMove, range.end);
  const isAtEnd = displayMove >= range.end;
  const isAtStart = currentMove <= range.start || currentMove === 0;

  // Filter moments to current phase
  const visibleMoments = useMemo(() => 
    analysis?.moments.filter(m => m.moveNumber >= range.start && m.moveNumber <= range.end) || [],
    [analysis, range]
  );

  // Get phase info from analysis
  const getPhaseInfo = (phase: GamePhase) => {
    if (phase === 'all' || !analysis) return undefined;
    return analysis.phases.find(p => p.name === phase);
  };

  // Moment counts for summary
  const momentCounts = useMemo(() => getMomentCounts(visibleMoments), [visibleMoments]);

  // Format move display
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
  const phaseMoveCount = Math.max(range.end - range.start, 1);

  // Calculate position for a moment marker
  const getMomentPosition = (moveNumber: number) => {
    return ((moveNumber - range.start) / phaseMoveCount) * 100;
  };

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
          
          {/* Phase filter buttons with hover tooltips */}
          <div className="flex items-center gap-1">
            {(['all', 'opening', 'middlegame', 'endgame'] as const).map((phase) => {
              const phaseRange = phaseRanges[phase];
              const moveCount = phaseRange.end - phaseRange.start;
              
              return (
                <PhaseButton
                  key={phase}
                  phase={phase}
                  isActive={selectedPhase === phase}
                  moveCount={moveCount}
                  onClick={() => setSelectedPhase(phase)}
                  phaseInfo={getPhaseInfo(phase)}
                  compact
                />
              );
            })}
          </div>
        </div>

        {/* Key moments summary with category icons */}
        {visibleMoments.length > 0 && (
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-muted-foreground">Key moments:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Quality */}
              {momentCounts.brilliant > 0 && (
                <div className={`flex items-center gap-1 ${momentConfig.brilliant.color} hover:scale-110 transition-transform`}>
                  <momentConfig.brilliant.icon className="w-3 h-3" />
                  <span>{momentCounts.brilliant}</span>
                </div>
              )}
              {momentCounts.great > 0 && (
                <div className={`flex items-center gap-1 ${momentConfig.great.color} hover:scale-110 transition-transform`}>
                  <momentConfig.great.icon className="w-3 h-3" />
                  <span>{momentCounts.great}</span>
                </div>
              )}
              {momentCounts.blunder > 0 && (
                <div className={`flex items-center gap-1 ${momentConfig.blunder.color} hover:scale-110 transition-transform`}>
                  <momentConfig.blunder.icon className="w-3 h-3" />
                  <span>{momentCounts.blunder}</span>
                </div>
              )}
              {/* Tactical */}
              {momentCounts.fork > 0 && (
                <div className={`flex items-center gap-1 ${momentConfig.fork.color} hover:scale-110 transition-transform`}>
                  <momentConfig.fork.icon className="w-3 h-3" />
                  <span>{momentCounts.fork}</span>
                </div>
              )}
              {momentCounts.sacrifice > 0 && (
                <div className={`flex items-center gap-1 ${momentConfig.sacrifice.color} hover:scale-110 transition-transform`}>
                  <momentConfig.sacrifice.icon className="w-3 h-3" />
                  <span>{momentCounts.sacrifice}</span>
                </div>
              )}
              {/* Events */}
              {momentCounts.capture > 0 && (
                <div className={`flex items-center gap-1 ${momentConfig.capture.color} hover:scale-110 transition-transform`}>
                  <momentConfig.capture.icon className="w-3 h-3" />
                  <span>{momentCounts.capture}</span>
                </div>
              )}
              {momentCounts.check > 0 && (
                <div className={`flex items-center gap-1 ${momentConfig.check.color} hover:scale-110 transition-transform`}>
                  <momentConfig.check.icon className="w-3 h-3" />
                  <span>{momentCounts.check}</span>
                </div>
              )}
              {momentCounts.checkmate > 0 && (
                <div className={`flex items-center gap-1 ${momentConfig.checkmate.color} hover:scale-110 transition-transform`}>
                  <momentConfig.checkmate.icon className="w-3 h-3" />
                  <span>{momentCounts.checkmate}</span>
                </div>
              )}
              {momentCounts.castling > 0 && (
                <div className={`flex items-center gap-1 ${momentConfig.castling.color} hover:scale-110 transition-transform`}>
                  <momentConfig.castling.icon className="w-3 h-3" />
                  <span>{momentCounts.castling}</span>
                </div>
              )}
              {momentCounts.promotion > 0 && (
                <div className={`flex items-center gap-1 ${momentConfig.promotion.color} hover:scale-110 transition-transform`}>
                  <momentConfig.promotion.icon className="w-3 h-3" />
                  <span>{momentCounts.promotion}</span>
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
          {/* Key moment markers with enhanced tooltips */}
          <div className="absolute inset-x-0 top-0 h-5 pointer-events-none z-10">
            {visibleMoments.slice(0, 30).map((moment, idx) => (
              <div key={`${moment.moveNumber}-${moment.type}-${idx}`} className="pointer-events-auto">
                <TimelineMarker
                  moment={moment}
                  position={getMomentPosition(moment.moveNumber)}
                  orientation="horizontal"
                  onClick={() => handleMomentClick(moment.moveNumber)}
                  size="sm"
                />
              </div>
            ))}
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
