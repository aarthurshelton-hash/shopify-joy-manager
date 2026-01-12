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
  BookOpen,
  Zap,
  Swords,
  Info,
  TrendingUp,
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
import { analyzeGame, GameAnalysis } from '@/lib/chess/chessAnalysis';
import { setActivePalette, PaletteId, getActivePalette, getCurrentPalette } from '@/lib/chess/pieceColors';
import { format } from 'date-fns';

export interface UnifiedVisionExperienceProps {
  // Core data
  board: SquareData[][];
  gameData: GameData;
  totalMoves: number;
  pgn?: string;
  
  // Context-specific settings
  context: 'marketplace' | 'gallery' | 'shared' | 'postgame' | 'scanner' | 'generator';
  defaultTab?: 'experience' | 'analytics';
  
  // Optional data
  visualizationId?: string;
  paletteId?: string;
  createdAt?: string;
  title?: string;
  imageUrl?: string;
  shareId?: string;
  
  // Callbacks
  onTransferToCreative?: () => void;
  onExport?: (type: 'hd' | 'gif' | 'print') => void;
  onShare?: () => void;
  onClose?: () => void;
  onBack?: () => void;
  onSaveToGallery?: () => Promise<string | null>;
  onPaletteChange?: () => void;
  
  // Premium gating
  isPremium?: boolean;
  onUpgradePrompt?: () => void;
  
  // Marketplace features
  showPurchaseButton?: boolean;
  purchasePrice?: number;
  onPurchase?: () => void;
  isPurchasing?: boolean;
  isListed?: boolean;
  onListForSale?: () => void;
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

// Analytics panel with deep chess analysis
const AnalyticsPanel: React.FC<{
  visionScore: VisionScore | null;
  isLoading: boolean;
  gameData: GameData;
  totalMoves: number;
  createdAt?: string;
  gameAnalysis: GameAnalysis | null;
}> = ({ visionScore, isLoading, gameData, totalMoves, createdAt, gameAnalysis }) => {
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

      {/* Deep Chess Analysis */}
      {gameAnalysis && (
        <div className="space-y-3">
          <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Deep Analysis
          </h3>
          
          {/* Opening Detection */}
          {gameAnalysis.opening && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                  Opening
                </Badge>
                <span className="text-xs text-muted-foreground">{gameAnalysis.opening.eco}</span>
              </div>
              <p className="font-medium text-sm">{gameAnalysis.opening.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{gameAnalysis.opening.description}</p>
            </div>
          )}

          {/* Gambit Detection */}
          {gameAnalysis.gambit && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="bg-orange-500/20 text-orange-600 border-orange-500/30">
                  <Zap className="h-3 w-3 mr-1" />
                  Gambit
                </Badge>
                <Badge variant="secondary" className="text-[10px]">{gameAnalysis.gambit.frequency}</Badge>
              </div>
              <p className="font-medium text-sm">{gameAnalysis.gambit.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Sacrifices {gameAnalysis.gambit.sacrificedMaterial} for {gameAnalysis.gambit.compensation}
              </p>
            </div>
          )}

          {/* Tactical Motifs */}
          {gameAnalysis.tactics.length > 0 && (
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-purple-500/20 text-purple-600 border-purple-500/30">
                  <Swords className="h-3 w-3 mr-1" />
                  Tactics ({gameAnalysis.tactics.length})
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {gameAnalysis.tactics.slice(0, 8).map((tactic, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tactic.type === 'fork' && '⑂'}
                    {tactic.type === 'pin' && '📌'}
                    {tactic.type === 'discovery' && '💡'}
                    {tactic.type === 'skewer' && '🗡️'}
                    {tactic.type === 'back_rank' && '♛'}
                    {tactic.type === 'smothered_mate' && '🏆'}
                    {tactic.type === 'sacrifice' && '💎'}
                    {tactic.type === 'double_attack' && '⚔️'}
                    {tactic.type === 'check' && '✓'}
                    {tactic.type === 'checkmate' && '♚#'}
                    {' '}{tactic.type.replace('_', ' ')} (m{tactic.moveNumber})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Special Moves */}
          {gameAnalysis.specialMoves.length > 0 && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Special Moves
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {gameAnalysis.specialMoves.map((move, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {move.type === 'castle_kingside' && '0-0'}
                    {move.type === 'castle_queenside' && '0-0-0'}
                    {move.type === 'en_passant' && 'e.p.'}
                    {move.type === 'promotion' && `=${move.promotedTo?.toUpperCase()}`}
                    {move.type === 'underpromotion' && `=${move.promotedTo?.toUpperCase()}!`}
                    {' '}(m{move.moveNumber})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Game Stats from Analysis */}
          {gameAnalysis.summary && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Statistics
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={`text-[10px] ${
                    gameAnalysis.summary.complexity === 'masterpiece' ? 'bg-amber-500/20 text-amber-600' :
                    gameAnalysis.summary.complexity === 'complex' ? 'bg-purple-500/20 text-purple-600' :
                    gameAnalysis.summary.complexity === 'moderate' ? 'bg-blue-500/20 text-blue-600' :
                    'bg-green-500/20 text-green-600'
                  }`}
                >
                  {gameAnalysis.summary.complexity}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <p className="font-bold">{gameAnalysis.summary.totalMoves}</p>
                  <p className="text-muted-foreground">Moves</p>
                </div>
                <div>
                  <p className="font-bold">{gameAnalysis.summary.captureCount}</p>
                  <p className="text-muted-foreground">Captures</p>
                </div>
                <div>
                  <p className="font-bold">{gameAnalysis.summary.checkCount}</p>
                  <p className="text-muted-foreground">Checks</p>
                </div>
                <div>
                  <p className="font-bold">{gameAnalysis.summary.materialBalance > 0 ? '+' : ''}{gameAnalysis.summary.materialBalance}</p>
                  <p className="text-muted-foreground">Material</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
  pgn,
  context,
  defaultTab,
  visualizationId,
  paletteId,
  createdAt,
  title,
  imageUrl,
  shareId,
  onTransferToCreative,
  onExport,
  onShare,
  onClose,
  onBack,
  onSaveToGallery,
  onPaletteChange,
  isPremium = false,
  onUpgradePrompt,
  showPurchaseButton = false,
  purchasePrice,
  onPurchase,
  isPurchasing = false,
  isListed = false,
  onListForSale,
}) => {
  // Determine default tab based on context
  const computedDefaultTab = defaultTab || (context === 'marketplace' ? 'analytics' : 'experience');
  
  const [activeTab, setActiveTab] = useState<'experience' | 'analytics'>(computedDefaultTab);
  const [visionScore, setVisionScore] = useState<VisionScore | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [gameAnalysis, setGameAnalysis] = useState<GameAnalysis | null>(null);
  
  // Board display options
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showPieces, setShowPieces] = useState(false);
  const [pieceOpacity, setPieceOpacity] = useState(0.7);
  const [boardSize, setBoardSize] = useState(400);
  const [darkMode, setDarkMode] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  
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

  // Analyze game
  useEffect(() => {
    if (gameData.pgn || pgn) {
      try {
        const analysis = analyzeGame(gameData.pgn || pgn || '');
        setGameAnalysis(analysis);
      } catch {
        setGameAnalysis(null);
      }
    }
  }, [gameData.pgn, pgn]);

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

  // Context-specific title
  const contextTitle = useMemo(() => {
    if (title) return title;
    if (gameData.white && gameData.black) {
      return `${gameData.white} vs ${gameData.black}`;
    }
    return 'Chess Visualization';
  }, [title, gameData.white, gameData.black]);

  // Determine which action buttons to show based on context
  const showGeneratorActions = context === 'generator' || context === 'postgame';
  const showGalleryActions = context === 'gallery';
  const showMarketplaceInfo = context === 'marketplace';

  return (
    <TimelineProvider>
      <LegendHighlightProvider>
        <div className="flex flex-col h-full" ref={containerRef}>
          {/* Header with back button for certain contexts */}
          {(context === 'generator' || context === 'gallery') && onBack && (
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Return
              </Button>
              {context === 'generator' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant={darkMode ? "outline" : "secondary"}
                    size="sm"
                    onClick={() => setDarkMode(false)}
                    className="gap-1 text-xs h-8"
                  >
                    Light
                  </Button>
                  <Button
                    variant={darkMode ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setDarkMode(true)}
                    className="gap-1 text-xs h-8"
                  >
                    Dark
                  </Button>
                </div>
              )}
            </div>
          )}

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
                    
                    {showLegend !== undefined && (
                      <>
                        <div className="h-4 w-px bg-border" />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <Switch
                                  checked={showLegend}
                                  onCheckedChange={setShowLegend}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Toggle color legend</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}
                  </div>

                  {/* Board with Coordinates */}
                  <div className="flex justify-center">
                    <div 
                      className={`relative p-4 rounded-lg ${darkMode ? 'bg-stone-950' : 'bg-stone-50'}`}
                      data-vision-board="true"
                    >
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
                  {showLegend && (
                    <EnhancedLegend 
                      whitePalette={getCurrentPalette().white}
                      blackPalette={getCurrentPalette().black}
                      board={board}
                      compact
                    />
                  )}

                  {/* Game Info */}
                  <GameInfoDisplay gameData={gameData} title={contextTitle} darkMode={darkMode} />

                  {/* Action Buttons - Context Specific */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border/30">
                    {/* Generator/Postgame Actions */}
                    {showGeneratorActions && (
                      <>
                        {onExport && (
                          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              onClick={() => onExport('hd')}
                            >
                              <Download className="h-4 w-4" />
                              HD
                              {!isPremium && <Crown className="h-3 w-3 text-primary" />}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              onClick={() => onExport('gif')}
                            >
                              <Download className="h-4 w-4" />
                              GIF
                              {!isPremium && <Crown className="h-3 w-3 text-primary" />}
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="gap-2 bg-gradient-to-r from-amber-500/80 to-amber-600/80 hover:from-amber-500 hover:to-amber-600 text-stone-900"
                              onClick={() => onExport('print')}
                            >
                              <Printer className="h-4 w-4" />
                              Order Print
                            </Button>
                          </div>
                        )}
                        
                        {onSaveToGallery && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={async () => {
                              const id = await onSaveToGallery();
                              if (id) {
                                // Could trigger success state
                              }
                            }}
                          >
                            <Crown className="h-4 w-4 text-primary" />
                            Save to Gallery
                          </Button>
                        )}
                      </>
                    )}

                    {/* Gallery Actions */}
                    {showGalleryActions && (
                      <>
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
                              onClick={() => onExport('print')}
                            >
                              <Printer className="h-4 w-4" />
                              Print
                            </Button>
                          </>
                        )}
                        
                        {!isListed && onListForSale && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={onListForSale}
                          >
                            <TrendingUp className="h-4 w-4" />
                            List for Sale
                          </Button>
                        )}
                        
                        {isListed && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                            Listed on Marketplace
                          </Badge>
                        )}
                      </>
                    )}

                    {/* Transfer to Creative Mode - Available in multiple contexts */}
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
                    
                    {/* Share button */}
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
                  gameAnalysis={gameAnalysis}
                />

                {/* Marketplace Info */}
                {showMarketplaceInfo && isListed && (
                  <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 mb-2">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Listed on Marketplace
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      This vision is available for collectors to purchase.
                    </p>
                  </div>
                )}

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

                {/* List for Sale button in gallery context */}
                {showGalleryActions && !isListed && onListForSale && (
                  <div className="mt-6 pt-4 border-t border-border/30">
                    <Button 
                      variant="outline"
                      className="w-full gap-2"
                      size="lg"
                      onClick={onListForSale}
                    >
                      <TrendingUp className="h-5 w-5" />
                      List for Sale on Marketplace
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
