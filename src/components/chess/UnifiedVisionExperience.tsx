import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sparkles,
  BarChart3,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  Eye,
  Grid3X3,
  Flame,
  Wand2,
  Crown,
  Download,
  Share2,
  Printer,
  RotateCcw,
  ChevronDown,
  Maximize2,
  Loader2,
} from 'lucide-react';
import { SquareData, GameData, SimulationResult } from '@/lib/chess/gameSimulator';
import { TimelineProvider, useTimeline } from '@/contexts/TimelineContext';
import { LegendHighlightProvider } from '@/contexts/LegendHighlightContext';
import InteractiveVisualizationBoard from './InteractiveVisualizationBoard';
import { EnhancedLegend } from './EnhancedLegend';
import GameInfoDisplay from './GameInfoDisplay';
import { ShowPiecesToggle } from './ShowPiecesToggle';
import BoardCoordinateGuide from './BoardCoordinateGuide';
import { VisionScore, getVisionScore, calculateVisionValue, calculateMembershipMultiplier, SCORING_WEIGHTS } from '@/lib/visualizations/visionScoring';
import { setActivePalette, PaletteId, getActivePalette, getCurrentPalette } from '@/lib/chess/pieceColors';
import { format } from 'date-fns';

export interface UnifiedVisionExperienceProps {
  // Core data
  board: SquareData[][];
  gameData: GameData;
  totalMoves: number;
  
  // Context-specific settings
  context: 'marketplace' | 'gallery' | 'shared' | 'postgame' | 'scanner';
  defaultTab?: 'experience' | 'analytics';
  
  // Optional data
  visualizationId?: string;
  paletteId?: string;
  createdAt?: string;
  title?: string;
  imageUrl?: string;
  
  // Callbacks
  onTransferToCreative?: () => void;
  onExport?: (type: 'hd' | 'gif' | 'print') => void;
  onShare?: () => void;
  onClose?: () => void;
  
  // Premium gating
  isPremium?: boolean;
  onUpgradePrompt?: () => void;
  
  // Additional features
  showPurchaseButton?: boolean;
  purchasePrice?: number;
  onPurchase?: () => void;
  isPurchasing?: boolean;
}

// Internal timeline-aware board
const TimelineBoard: React.FC<{
  board: SquareData[][];
  totalMoves: number;
  size: number;
}> = ({ board, totalMoves, size }) => {
  const { currentMove } = useTimeline();
  
  const filteredBoard = useMemo(() => {
    if (currentMove >= totalMoves) return board;
    return board.map(rank =>
      rank.map(square => ({
        ...square,
        visits: square.visits.filter(visit => visit.moveNumber <= currentMove)
      }))
    );
  }, [board, currentMove, totalMoves]);

  return <InteractiveVisualizationBoard board={filteredBoard} size={size} />;
};

// Timeline controls with key moments
const TimelineControls: React.FC<{
  totalMoves: number;
  moves?: string[];
}> = ({ totalMoves, moves }) => {
  const { currentMove, setCurrentMove, isPlaying, play, pause, setMaxMoves } = useTimeline();
  const progress = totalMoves > 0 ? (currentMove / totalMoves) * 100 : 0;

  useEffect(() => {
    setMaxMoves(totalMoves);
  }, [totalMoves, setMaxMoves]);

  // Find key moments
  const keyMoments = useMemo(() => {
    if (!moves) return [];
    const moments: { move: number; type: string; notation: string }[] = [];
    
    moves.forEach((move, i) => {
      const moveNum = i + 1;
      if (move.includes('x')) {
        moments.push({ move: moveNum, type: 'capture', notation: move });
      } else if (move.includes('+')) {
        moments.push({ move: moveNum, type: 'check', notation: move });
      } else if (move.includes('#')) {
        moments.push({ move: moveNum, type: 'checkmate', notation: move });
      } else if (move === 'O-O' || move === 'O-O-O') {
        moments.push({ move: moveNum, type: 'castle', notation: move });
      }
    });
    
    return moments.slice(0, 10); // Limit to 10 key moments
  }, [moves]);

  const getMoveLabel = () => {
    if (currentMove === 0) return 'Start';
    if (currentMove >= totalMoves) return 'Final';
    const fullMove = Math.ceil(currentMove / 2);
    const isWhite = currentMove % 2 === 1;
    return `${fullMove}. ${isWhite ? '' : '...'}`;
  };

  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">{getMoveLabel()}</span>
        <span>{currentMove} / {totalMoves}</span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="flex items-center justify-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => setCurrentMove(0)}
          disabled={currentMove === 0}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => setCurrentMove(Math.max(0, currentMove - 1))}
          disabled={currentMove === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 border-primary/50"
          onClick={() => isPlaying ? pause() : play()}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => setCurrentMove(Math.min(totalMoves, currentMove + 1))}
          disabled={currentMove >= totalMoves}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => setCurrentMove(totalMoves)}
          disabled={currentMove >= totalMoves}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Key moments dropdown */}
      {keyMoments.length > 0 && (
        <div className="pt-2 border-t border-border/30">
          <div className="text-xs text-muted-foreground mb-2">Key Moments</div>
          <div className="flex flex-wrap gap-1">
            {keyMoments.slice(0, 6).map((moment, i) => (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setCurrentMove(moment.move)}
              >
                <span className={
                  moment.type === 'capture' ? 'text-red-400' :
                  moment.type === 'check' ? 'text-amber-400' :
                  moment.type === 'checkmate' ? 'text-green-400' :
                  'text-blue-400'
                }>
                  {moment.notation}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Analytics panel
const AnalyticsPanel: React.FC<{
  visionScore: VisionScore | null;
  isLoading: boolean;
  gameData: GameData;
  totalMoves: number;
  createdAt?: string;
}> = ({ visionScore, isLoading, gameData, totalMoves, createdAt }) => {
  const membershipMultiplier = calculateMembershipMultiplier(100);
  const estimatedValue = visionScore ? calculateVisionValue(visionScore, membershipMultiplier) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Summary */}
      <div className="p-4 rounded-lg border border-border/50 bg-card/50 space-y-3">
        <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Game Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">White</div>
            <div className="font-medium">{gameData.white || 'Unknown'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Black</div>
            <div className="font-medium">{gameData.black || 'Unknown'}</div>
          </div>
          {gameData.event && (
            <div className="col-span-2">
              <div className="text-xs text-muted-foreground">Event</div>
              <div className="font-medium">{gameData.event}</div>
            </div>
          )}
          <div>
            <div className="text-xs text-muted-foreground">Moves</div>
            <div className="font-display text-lg text-primary">{totalMoves}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Result</div>
            <div className="font-display text-lg">{gameData.result || '?'}</div>
          </div>
        </div>
      </div>

      {/* Vision Score */}
      {visionScore && (
        <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm uppercase tracking-wider text-primary">Vision Score</h3>
            <Badge variant="outline" className="bg-primary/10 text-primary">
              {visionScore.totalScore.toFixed(2)} pts
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded bg-background/50">
              <div className="text-lg font-display">{visionScore.viewCount}</div>
              <div className="text-xs text-muted-foreground">Views</div>
            </div>
            <div className="p-2 rounded bg-background/50">
              <div className="text-lg font-display">{visionScore.downloadHdCount + visionScore.downloadGifCount}</div>
              <div className="text-xs text-muted-foreground">Downloads</div>
            </div>
            <div className="p-2 rounded bg-background/50">
              <div className="text-lg font-display">{visionScore.printOrderCount}</div>
              <div className="text-xs text-muted-foreground">Prints</div>
            </div>
          </div>

          <div className="pt-3 border-t border-border/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated Value</span>
              <span className="font-display text-xl text-primary">${estimatedValue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      {visionScore && visionScore.totalScore > 0 && (
        <div className="p-4 rounded-lg border border-border/50 bg-card/30 space-y-3">
          <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Score Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Views ({visionScore.viewCount} × {SCORING_WEIGHTS.view})</span>
              <span>{(visionScore.viewCount * SCORING_WEIGHTS.view).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">HD Downloads ({visionScore.downloadHdCount} × {SCORING_WEIGHTS.download_hd})</span>
              <span>{(visionScore.downloadHdCount * SCORING_WEIGHTS.download_hd).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GIF Downloads ({visionScore.downloadGifCount} × {SCORING_WEIGHTS.download_gif})</span>
              <span>{(visionScore.downloadGifCount * SCORING_WEIGHTS.download_gif).toFixed(2)}</span>
            </div>
            {visionScore.tradeCount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trades ({visionScore.tradeCount} × {SCORING_WEIGHTS.trade})</span>
                <span>{(visionScore.tradeCount * SCORING_WEIGHTS.trade).toFixed(2)}</span>
              </div>
            )}
            {visionScore.printOrderCount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Print Orders</span>
                <span>{(visionScore.printOrderCount * SCORING_WEIGHTS.print_order_base + visionScore.printRevenueCents / 100).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Created date */}
      {createdAt && (
        <div className="text-center text-xs text-muted-foreground">
          Created {format(new Date(createdAt), 'MMMM d, yyyy')}
        </div>
      )}
    </div>
  );
};

/**
 * UnifiedVisionExperience - The single source of truth for all vision displays
 * 
 * Features:
 * - Timeline playback with phase filters
 * - Board coordinate guides (a-h, 1-8)
 * - Show pieces toggle with opacity
 * - Heatmap/territory mode
 * - Transfer to Creative Mode
 * - Context-aware default tabs
 */
const UnifiedVisionExperience: React.FC<UnifiedVisionExperienceProps> = ({
  board,
  gameData,
  totalMoves,
  context,
  defaultTab,
  visualizationId,
  paletteId,
  createdAt,
  title,
  imageUrl,
  onTransferToCreative,
  onExport,
  onShare,
  onClose,
  isPremium = false,
  onUpgradePrompt,
  showPurchaseButton = false,
  purchasePrice,
  onPurchase,
  isPurchasing = false,
}) => {
  // Determine default tab based on context
  const computedDefaultTab = defaultTab || (context === 'marketplace' ? 'analytics' : 'experience');
  
  const [activeTab, setActiveTab] = useState<'experience' | 'analytics'>(computedDefaultTab);
  const [visionScore, setVisionScore] = useState<VisionScore | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  
  // Board display options
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showPieces, setShowPieces] = useState(false);
  const [pieceOpacity, setPieceOpacity] = useState(0.7);
  const [boardSize, setBoardSize] = useState(400);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate responsive board size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const maxSize = Math.min(containerWidth - 32, 500);
        setBoardSize(Math.max(280, maxSize));
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Load vision score
  useEffect(() => {
    if (visualizationId) {
      setIsLoadingScore(true);
      getVisionScore(visualizationId)
        .then(score => setVisionScore(score))
        .finally(() => setIsLoadingScore(false));
    }
  }, [visualizationId]);

  // Restore palette if provided
  useEffect(() => {
    if (paletteId && paletteId !== 'custom') {
      setActivePalette(paletteId as PaletteId);
    }
  }, [paletteId]);

  const handleTransferToCreative = useCallback(() => {
    if (!isPremium && onUpgradePrompt) {
      onUpgradePrompt();
      return;
    }
    onTransferToCreative?.();
  }, [isPremium, onUpgradePrompt, onTransferToCreative]);

  return (
    <TimelineProvider>
      <LegendHighlightProvider>
        <div className="flex flex-col h-full" ref={containerRef}>
          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'experience' | 'analytics')}>
            <TabsList className="w-full grid grid-cols-2 bg-muted/50 p-1 mb-4">
              <TabsTrigger 
                value="experience" 
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all duration-300"
              >
                <motion.div
                  animate={{ rotate: activeTab === 'experience' ? 0 : -10 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>
                Experience
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all duration-300"
              >
                <motion.div
                  animate={{ rotate: activeTab === 'analytics' ? 0 : 10 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <BarChart3 className="h-4 w-4" />
                </motion.div>
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Experience Tab */}
            <TabsContent value="experience" className="mt-0">
              <ScrollArea className="h-[calc(100vh-300px)] sm:h-auto">
                <div className="space-y-4">
                  {/* Board Controls */}
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                            <Switch
                              checked={showCoordinates}
                              onCheckedChange={setShowCoordinates}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Toggle board coordinates (a-h, 1-8)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div className="h-4 w-px bg-border" />

                    <ShowPiecesToggle 
                      showPieces={showPieces}
                      pieceOpacity={pieceOpacity}
                      onToggle={setShowPieces}
                      onOpacityChange={setPieceOpacity}
                      compact
                    />

                    <div className="h-4 w-px bg-border" />

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Flame className="h-4 w-4 text-muted-foreground" />
                            <Switch
                              checked={showHeatmap}
                              onCheckedChange={setShowHeatmap}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Toggle territory heatmap</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Board with Coordinates */}
                  <div className="flex justify-center">
                    <div className="relative">
                      {showCoordinates && (
                        <BoardCoordinateGuide size={boardSize} position="inside" />
                      )}
                      <TimelineBoard 
                        board={board} 
                        totalMoves={totalMoves} 
                        size={boardSize}
                      />
                    </div>
                  </div>

                  {/* Timeline Controls */}
                  <TimelineControls 
                    totalMoves={totalMoves} 
                    moves={gameData.moves}
                  />

                  {/* Legend */}
                  <EnhancedLegend 
                    whitePalette={getCurrentPalette().white}
                    blackPalette={getCurrentPalette().black}
                    compact
                  />

                  {/* Game Info */}
                  <GameInfoDisplay gameData={gameData} />

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                    {onTransferToCreative && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={handleTransferToCreative}
                      >
                        <Wand2 className="h-4 w-4" />
                        Edit in Creative Mode
                        {!isPremium && <Crown className="h-3 w-3 text-primary" />}
                      </Button>
                    )}
                    
                    {onExport && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => onExport('hd')}
                        >
                          <Download className="h-4 w-4" />
                          HD
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => onExport('gif')}
                        >
                          <Download className="h-4 w-4" />
                          GIF
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => onExport('print')}
                        >
                          <Printer className="h-4 w-4" />
                          Print
                        </Button>
                      </>
                    )}
                    
                    {onShare && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 ml-auto"
                        onClick={onShare}
                      >
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0">
              <ScrollArea className="h-[calc(100vh-300px)] sm:h-auto">
                <AnalyticsPanel
                  visionScore={visionScore}
                  isLoading={isLoadingScore}
                  gameData={gameData}
                  totalMoves={totalMoves}
                  createdAt={createdAt}
                />

                {/* Purchase Button for Marketplace */}
                {showPurchaseButton && onPurchase && (
                  <div className="mt-6 pt-4 border-t border-border/30">
                    <Button 
                      className="w-full gap-2"
                      size="lg"
                      onClick={onPurchase}
                      disabled={isPurchasing}
                    >
                      {isPurchasing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : purchasePrice === 0 ? (
                        <>Claim for Free</>
                      ) : (
                        <>Purchase for ${((purchasePrice || 0) / 100).toFixed(2)}</>
                      )}
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </LegendHighlightProvider>
    </TimelineProvider>
  );
};

export default UnifiedVisionExperience;
