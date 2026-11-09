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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { analyzeTimeline, TimelineAnalysisResult } from '@/lib/chess/timelineAnalysis';
import { buildGameEvents, describeEvent, type GameEvent, type GameEventType } from '@/lib/chess/eventLayer';
import { getPieceColor, type PieceColor, type PieceType } from '@/lib/chess/pieceColors';
import { EventSwatch } from './EventTextureMarks';
import { TimelineMarker, PhaseButton, momentConfig, phaseConfig, type MomentType, type TimelineMoment } from './EnhancedTimelineMarker';
import TrajectoryTimelineOverlay from './TrajectoryTimelineOverlay';
import { HybridPrediction } from '@/lib/chess/hybridPrediction';
import { PatternPrediction } from '@/lib/chess/patternLearning';

interface VerticalTimelineSliderProps {
  totalMoves: number;
  moves?: string[];
  pgn?: string;
  hybridPrediction?: HybridPrediction | null;
  patternPrediction?: PatternPrediction | null;
  onPreviewEvent?: (event: GameEvent | null) => void;
  onSelectEvent?: (event: GameEvent | null) => void;
}

const VerticalTimelineSlider: React.FC<VerticalTimelineSliderProps> = ({ 
  totalMoves, 
  moves = [], 
  pgn,
  hybridPrediction,
  patternPrediction,
  onPreviewEvent,
  onSelectEvent,
}) => {
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

  const visibleGameEvents = useMemo(
    () => buildGameEvents(pgn).filter(event => event.moveNumber >= range.start && event.moveNumber <= range.end),
    [pgn, range.start, range.end]
  );

  const keyMomentGroups = useMemo(() => {
    const types: MomentType[] = [
      'brilliant', 'great', 'blunder', 'fork', 'sacrifice', 'checkmate',
      'check', 'castling', 'promotion', 'capture', 'en_passant',
    ];
    const eventTypes: Partial<Record<MomentType, GameEventType>> = {
      capture: 'capture', check: 'check', checkmate: 'checkmate', castling: 'castle',
      en_passant: 'enPassant', promotion: 'promotion', sacrifice: 'sacrifice',
      brilliant: 'brilliant', blunder: 'blunder',
    };

    return types.map(type => {
      const entries = new Map<number, { moveNumber: number; moment?: TimelineMoment; event?: GameEvent }>();
      for (const moment of visibleMoments) {
        if (moment.type === type) entries.set(moment.moveNumber, { moveNumber: moment.moveNumber, moment });
      }
      const eventType = eventTypes[type];
      if (eventType) {
        for (const event of visibleGameEvents) {
          if (event.type !== eventType) continue;
          const entry = entries.get(event.moveNumber) || { moveNumber: event.moveNumber };
          entries.set(event.moveNumber, { ...entry, event });
        }
      }
      return { type, entries: [...entries.values()].sort((a, b) => a.moveNumber - b.moveNumber) };
    }).filter(group => group.entries.length > 0);
  }, [visibleMoments, visibleGameEvents]);

  // Format move display
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

  const clearSelectedMoment = () => {
    onSelectEvent?.(null);
    onPreviewEvent?.(null);
  };

  const handleSliderChange = (value: number[]) => {
    clearSelectedMoment();
    const newValue = value[0];
    if (newValue >= range.end) {
      setCurrentMove(Infinity);
    } else {
      setCurrentMove(Math.max(newValue, range.start));
    }
  };

  const handleMomentClick = (moveNumber: number, event?: GameEvent | null) => {
    onSelectEvent?.(event || null);
    onPreviewEvent?.(null);
    setCurrentMove(moveNumber);
  };

  const speedOptions = [
    { label: '0.5x', value: 1000 },
    { label: '1x', value: 500 },
    { label: '2x', value: 250 },
  ];

  const currentSpeedLabel = speedOptions.find(s => s.value === playbackSpeed)?.label || '1x';
  const player = getCurrentPlayer();
  const phaseMoveCount = Math.max(range.end - range.start, 1);

  // Calculate position for a moment marker (vertical - from top)
  const getMomentPosition = (moveNumber: number) => {
    return ((moveNumber - range.start) / phaseMoveCount) * 100;
  };

  return (
    <TooltipProvider>
      <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-3 h-full flex flex-col w-[120px] min-w-[120px]">
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

          {/* Accuracy display */}
          {analysis && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border border-border/30">
              <span className="text-[9px] text-muted-foreground">Accuracy</span>
              <span className={`text-xs font-bold ${
                analysis.summary.accuracy >= 90 ? 'text-green-400' :
                analysis.summary.accuracy >= 70 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {analysis.summary.accuracy}%
              </span>
            </div>
          )}
        </div>

        {/* Phase filter buttons - vertical stack with hover tooltips */}
        <div className="flex flex-col gap-1 py-3 border-b border-border/30">
          {(['all', 'opening', 'middlegame', 'endgame'] as const).map((phase) => {
            const phaseRange = phaseRanges[phase];
            const moveCount = phaseRange.end - phaseRange.start;
            
            // Handle phase click: select the phase AND jump to its start
            const handlePhaseClick = () => {
              clearSelectedMoment();
              setSelectedPhase(phase);
              // Jump to the appropriate position
              if (phase === 'all') {
                // "All" shows the complete visualization
                setCurrentMove(Infinity);
              } else {
                // Other phases jump to their start move
                setCurrentMove(phaseRange.start);
              }
            };
            
            return (
              <PhaseButton
                key={phase}
                phase={phase}
                isActive={selectedPhase === phase}
                moveCount={moveCount}
                onClick={handlePhaseClick}
                phaseInfo={getPhaseInfo(phase)}
                compact
              />
            );
          })}
        </div>

        {keyMomentGroups.length > 0 && (
          <div className="py-2 border-b border-border/30">
            <div className="text-[9px] text-muted-foreground mb-1.5 text-center">Key Moments</div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {keyMomentGroups.map(group => {
                const config = momentConfig[group.type];
                const Icon = config.icon;
                const first = group.entries[0];
                return (
                  <HoverCard key={group.type} openDelay={120} closeDelay={120}>
                    <HoverCardTrigger asChild>
                      <button
                        type="button"
                        onClick={() => handleMomentClick(first.moveNumber, first.event)}
                        onMouseEnter={() => onPreviewEvent?.(first.event || null)}
                        onMouseLeave={() => onPreviewEvent?.(null)}
                        onFocus={() => onPreviewEvent?.(first.event || null)}
                        onBlur={() => onPreviewEvent?.(null)}
                        className={`flex items-center gap-0.5 ${config.color} hover:scale-110 transition-transform cursor-pointer`}
                        aria-label={`${config.label}: ${group.entries.length} key ${group.entries.length === 1 ? 'moment' : 'moments'}`}
                      >
                        <Icon className="w-2.5 h-2.5" />
                        <span className="text-[9px]">{group.entries.length}</span>
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" align="start" className="w-80 p-3" onMouseLeave={() => onPreviewEvent?.(null)}>
                      <div className="mb-2">
                        <p className="text-xs font-semibold">{config.label} · {group.entries.length}</p>
                        <p className="text-[10px] text-muted-foreground">Hover to locate it on the board. Click to review the move.</p>
                      </div>
                      <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                        {group.entries.slice(0, 12).map(entry => {
                          const eventDescription = entry.event ? describeEvent(entry.event) : null;
                          const moveName = entry.moment?.move || entry.event?.san || '';
                          const player = entry.moment?.player || (entry.event?.color === 'w' ? 'white' : 'black');
                          const title = eventDescription?.title || `${config.label} · ${moveName}`;
                          const when = eventDescription?.when || `Move ${Math.ceil(entry.moveNumber / 2)} · ${player === 'white' ? 'White' : 'Black'}`;
                          const detail = eventDescription?.detail || entry.moment?.description || config.description;
                          return (
                            <button
                              key={`${group.type}-${entry.moveNumber}`}
                              type="button"
                              className="flex w-full items-start gap-2 rounded-md p-2 text-left transition-colors hover:bg-muted/70 focus:bg-muted/70 focus:outline-none"
                              onMouseEnter={() => onPreviewEvent?.(entry.event || null)}
                              onFocus={() => onPreviewEvent?.(entry.event || null)}
                              onBlur={() => onPreviewEvent?.(null)}
                              onClick={() => handleMomentClick(entry.moveNumber, entry.event)}
                            >
                              {entry.event ? (
                                <EventSwatch
                                  type={entry.event.type}
                                  pieceColor={getPieceColor(entry.event.piece as PieceType, entry.event.color as PieceColor)}
                                  size={24}
                                />
                              ) : (
                                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`} />
                              )}
                              <span className="min-w-0">
                                <span className="block text-xs font-medium">{title}</span>
                                <span className="block text-[10px] text-muted-foreground">{when}</span>
                                <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{detail}</span>
                              </span>
                            </button>
                          );
                        })}
                        {group.entries.length > 12 && (
                          <p className="px-2 py-1 text-[10px] text-muted-foreground">+ {group.entries.length - 12} more on the timeline</p>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                );
              })}
            </div>
          </div>
        )}

        {/* Vertical slider with moment markers and trajectory overlay */}
        <div className="flex-1 flex items-center justify-center py-4 min-h-[200px]">
          <div className="relative h-full flex items-center gap-2">
            {/* Key moment markers on the left side with enhanced tooltips */}
            <div className="relative h-full w-6">
              {visibleMoments.slice(0, 25).map((moment, idx) => (
                <TimelineMarker
                  key={`${moment.moveNumber}-${moment.type}-${idx}`}
                  moment={moment}
                  position={getMomentPosition(moment.moveNumber)}
                  orientation="vertical"
                  onClick={() => handleMomentClick(moment.moveNumber)}
                  size="sm"
                />
              ))}
            </div>

            {/* Vertical slider with trajectory overlay */}
            <div className="relative h-full flex flex-col items-center">
              <span className="text-[8px] text-muted-foreground mb-1">Start</span>
              <div className="relative h-full w-4">
                <Slider
                  value={[displayMove]}
                  min={range.start}
                  max={range.end}
                  step={1}
                  onValueChange={handleSliderChange}
                  orientation="vertical"
                  className="h-full"
                />
                {/* Trajectory prediction overlay */}
                {(hybridPrediction || patternPrediction) && (
                  <TrajectoryTimelineOverlay
                    hybridPrediction={hybridPrediction}
                    patternPrediction={patternPrediction}
                    totalMoves={totalMoves}
                    currentMove={displayMove}
                    orientation="vertical"
                    className="left-6"
                  />
                )}
              </div>
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
              onClick={() => { clearSelectedMoment(); stepBackward(); }}
              disabled={isAtStart}
              className="h-7 w-7 p-0"
              title="Previous move"
            >
              <SkipBack className="h-3 w-3" />
            </Button>

            <Button
              variant={isPlaying ? "secondary" : "default"}
              size="sm"
              onClick={() => { clearSelectedMoment(); togglePlayback(); }}
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
              onClick={() => { clearSelectedMoment(); stepForward(); }}
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
              onClick={() => { clearSelectedMoment(); reset(); }}
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
