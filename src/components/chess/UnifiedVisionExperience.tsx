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
  Minimize2,
  X,
  Loader2,
  BookOpen,
  Zap,
  Swords,
  Info,
  TrendingUp,
} from 'lucide-react';
import { SquareData, GameData, SimulationResult, simulateGame } from '@/lib/chess/gameSimulator';
import { TimelineProvider, useTimeline } from '@/contexts/TimelineContext';
import { LegendHighlightProvider, useLegendHighlight } from '@/contexts/LegendHighlightContext';
import InteractiveVisualizationBoard from './InteractiveVisualizationBoard';
import { EnhancedLegend } from './EnhancedLegend';
import GameInfoDisplay from './GameInfoDisplay';
import InteractiveGameInfoDisplay from './InteractiveGameInfoDisplay';
import VerticalTimelineSlider from './VerticalTimelineSlider';
import ColorLegend from './ColorLegend';
import { classifyMoves, getMoveQualitySummary, MOVE_QUALITY_INFO } from '@/lib/chess/moveQuality';
import { ShowPiecesToggle } from './ShowPiecesToggle';
import BoardCoordinateGuide from './BoardCoordinateGuide';
import IntrinsicPaletteCard from './IntrinsicPaletteCard';
import ChessBoardVisualization from './ChessBoardVisualization';
import { VisionScore, getVisionScore, calculateVisionValue, calculateMembershipMultiplier, SCORING_WEIGHTS } from '@/lib/visualizations/visionScoring';
import { analyzeGame, GameAnalysis } from '@/lib/chess/chessAnalysis';
import { setActivePalette, PaletteId, getActivePalette, getCurrentPalette, colorPalettes, getPieceColor } from '@/lib/chess/pieceColors';
import { detectGameCard, GameCardMatch } from '@/lib/chess/gameCardDetection';
import { format } from 'date-fns';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';
import { RoyaltyPotentialCard } from '@/components/marketplace/RoyaltyPotentialCard';
import { RoyaltyEarningsCard } from '@/components/vision/RoyaltyEarningsCard';
import { TransferHistoryCard } from '@/components/marketplace/TransferHistoryCard';
import { TransferLimitBadge } from '@/components/marketplace/TransferLimitBadge';
import { PoetryModal, PoetryPreviewCard } from './PoetryModal';
import { getGamePoetry } from '@/lib/chess/gamePoetry';
import PaletteAvailabilityIndicator from './PaletteAvailabilityIndicator';
import { useAuth } from '@/hooks/useAuth';
import MiniPrintOrderSection from './MiniPrintOrderSection';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaletteAvailabilityInfo } from '@/lib/visualizations/paletteAvailability';

// Export state for capturing visualization in any configuration
export interface ExportState {
  currentMove: number;
  lockedPieces: Array<{ pieceType: string; pieceColor: string }>;
  compareMode: boolean;
  darkMode: boolean;
}

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
  
  // Callbacks - onExport now receives export state for state-aware exports
  onTransferToCreative?: () => void;
  onExport?: (type: 'hd' | 'gif' | 'print' | 'preview', exportState?: ExportState) => void;
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
  isOwner?: boolean;
  sellerName?: string;
  
  // Royalty/score data (passed in to avoid re-fetching)
  visionScoreData?: {
    viewCount: number;
    uniqueViewers: number;
    royaltyCentsEarned: number;
    royaltyOrdersCount: number;
    printRevenueCents: number;
    printOrderCount: number;
    totalScore: number;
    downloadHdCount: number;
    downloadGifCount: number;
    tradeCount: number;
  } | null;
  
  // Header customization
  headerActions?: React.ReactNode;
  showBackButton?: boolean;
  backButtonText?: string;
}

// Internal timeline-aware board with trademark look
const TimelineBoard: React.FC<{
  board: SquareData[][];
  totalMoves: number;
  size: number;
  gameData: GameData;
  darkMode?: boolean;
  title?: string;
  showCoordinates?: boolean;
}> = ({ board, totalMoves, size, gameData, darkMode = false, title, showCoordinates = false }) => {
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

  const bgColor = darkMode ? '#0A0A0A' : '#FDFCFB';
  const borderColor = darkMode ? '#292524' : '#e7e5e4';
  const mutedColor = darkMode ? '#78716c' : '#a8a29e';
  const primaryText = darkMode ? '#e7e5e4' : '#292524';
  const secondaryText = darkMode ? '#a8a29e' : '#78716c';

  return (
    <div
      style={{
        backgroundColor: bgColor,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        width: 'fit-content',
        borderRadius: 8,
        border: `1px solid ${borderColor}`,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Chess Board */}
      <div style={{ position: 'relative' }}>
        {showCoordinates && (
          <BoardCoordinateGuide size={size} position="inside" />
        )}
        <ChessBoardVisualization board={filteredBoard} size={size} />
      </div>

      {/* Game Info Section - Now Interactive */}
      <div
        style={{
          width: '100%',
          paddingTop: 16,
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <InteractiveGameInfoDisplay 
          gameData={gameData}
          title={title}
          darkMode={darkMode} 
        />
      </div>

      {/* Branding */}
      <p
        style={{
          fontSize: 10,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          fontWeight: 500,
          color: mutedColor,
          margin: 0,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        ♔ En Pensent ♚
      </p>
    </div>
  );
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

// Analytics panel with deep chess analysis and move quality metrics
const AnalyticsPanel: React.FC<{
  visionScore: VisionScore | null;
  isLoading: boolean;
  gameData: GameData;
  totalMoves: number;
  createdAt?: string;
  gameAnalysis: GameAnalysis | null;
  pgn?: string;
}> = ({ visionScore, isLoading, gameData, totalMoves, createdAt, gameAnalysis, pgn }) => {
  const membershipMultiplier = calculateMembershipMultiplier(100);
  
  // Calculate move quality summary
  const qualitySummary = React.useMemo(() => {
    const pgnToUse = pgn || gameData.pgn;
    if (!pgnToUse) return null;
    try {
      const classified = classifyMoves(pgnToUse);
      return getMoveQualitySummary(classified);
    } catch {
      return null;
    }
  }, [pgn, gameData.pgn]);
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

          {/* Move Quality Metrics */}
          {qualitySummary && (
            <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Move Quality
                </Badge>
                <span className={`text-lg font-bold ${
                  qualitySummary.accuracy >= 90 ? 'text-green-400' :
                  qualitySummary.accuracy >= 70 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {qualitySummary.accuracy.toFixed(1)}% Accuracy
                </span>
              </div>
              
              {/* Quality breakdown */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                {qualitySummary.brilliantCount > 0 && (
                  <div className="p-2 rounded bg-cyan-500/10">
                    <p className="font-bold text-cyan-400">{qualitySummary.brilliantCount}</p>
                    <p className="text-muted-foreground text-[10px]">Brilliant</p>
                  </div>
                )}
                {qualitySummary.greatCount > 0 && (
                  <div className="p-2 rounded bg-green-500/10">
                    <p className="font-bold text-green-400">{qualitySummary.greatCount}</p>
                    <p className="text-muted-foreground text-[10px]">Great</p>
                  </div>
                )}
                {qualitySummary.blunderCount > 0 && (
                  <div className="p-2 rounded bg-red-500/10">
                    <p className="font-bold text-red-400">{qualitySummary.blunderCount}</p>
                    <p className="text-muted-foreground text-[10px]">Blunders</p>
                  </div>
                )}
                {qualitySummary.mistakeCount > 0 && (
                  <div className="p-2 rounded bg-orange-500/10">
                    <p className="font-bold text-orange-400">{qualitySummary.mistakeCount}</p>
                    <p className="text-muted-foreground text-[10px]">Mistakes</p>
                  </div>
                )}
              </div>
              
              {/* Tactical event counts */}
              <div className="pt-2 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground mb-2">Tactical Events</p>
                <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                  <div className="p-1.5 rounded bg-yellow-500/10">
                    <p className="font-bold text-yellow-400">{qualitySummary.checkCount}</p>
                    <p className="text-muted-foreground text-[9px]">Checks</p>
                  </div>
                  <div className="p-1.5 rounded bg-red-500/10">
                    <p className="font-bold text-red-400">{qualitySummary.checkmateCount}</p>
                    <p className="text-muted-foreground text-[9px]">Mate</p>
                  </div>
                  <div className="p-1.5 rounded bg-orange-500/10">
                    <p className="font-bold text-orange-400">{qualitySummary.captureCount}</p>
                    <p className="text-muted-foreground text-[9px]">Captures</p>
                  </div>
                  <div className="p-1.5 rounded bg-blue-500/10">
                    <p className="font-bold text-blue-400">{qualitySummary.castleCount}</p>
                    <p className="text-muted-foreground text-[9px]">Castles</p>
                  </div>
                  <div className="p-1.5 rounded bg-purple-500/10">
                    <p className="font-bold text-purple-400">{qualitySummary.sacrificeCount}</p>
                    <p className="text-muted-foreground text-[9px]">Sacrifices</p>
                  </div>
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

// Export action buttons that capture current visualization state
const ExportActionButtons: React.FC<{
  onExport?: (type: 'hd' | 'gif' | 'print' | 'preview', exportState?: ExportState) => void;
  isPremium: boolean;
  darkMode: boolean;
  totalMoves: number;
}> = ({ onExport, isPremium, darkMode, totalMoves }) => {
  const { currentMove } = useTimeline();
  const { lockedPieces, compareMode } = useLegendHighlight();
  
  const handleExport = useCallback((type: 'hd' | 'gif' | 'print' | 'preview') => {
    const exportState: ExportState = {
      currentMove: currentMove >= totalMoves ? totalMoves : currentMove,
      lockedPieces: lockedPieces.map(p => ({
        pieceType: p.pieceType,
        pieceColor: p.pieceColor,
      })),
      compareMode,
      darkMode,
    };
    onExport?.(type, exportState);
  }, [onExport, currentMove, totalMoves, lockedPieces, compareMode, darkMode]);

  if (!onExport) return null;

  return (
    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
      {/* Free Preview Download - available to everyone */}
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        onClick={() => handleExport('preview')}
      >
        <Download className="h-4 w-4" />
        Download
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        onClick={() => handleExport('hd')}
      >
        <Download className="h-4 w-4" />
        HD
        {!isPremium && <Crown className="h-3 w-3 text-primary" />}
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        onClick={() => handleExport('gif')}
      >
        <Download className="h-4 w-4" />
        GIF
        {!isPremium && <Crown className="h-3 w-3 text-primary" />}
      </Button>
      <Button 
        variant="default" 
        size="sm" 
        className="gap-2 bg-gradient-to-r from-amber-500/80 to-amber-600/80 hover:from-amber-500 hover:to-amber-600 text-stone-900"
        onClick={() => handleExport('print')}
      >
        <Printer className="h-4 w-4" />
        Order Print
      </Button>
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
  isOwner = false,
  sellerName,
  visionScoreData,
  headerActions,
  showBackButton = true,
  backButtonText,
}) => {
  const { user } = useAuth();
  
  // Determine default tab based on context
  const computedDefaultTab = defaultTab || (context === 'marketplace' ? 'analytics' : 'experience');
  
  const [activeTab, setActiveTab] = useState<'experience' | 'analytics'>(computedDefaultTab);
  const [visionScore, setVisionScore] = useState<VisionScore | null>(
    visionScoreData ? {
      visualizationId: visualizationId || '',
      viewCount: visionScoreData.viewCount,
      uniqueViewers: visionScoreData.uniqueViewers,
      downloadHdCount: visionScoreData.downloadHdCount,
      downloadGifCount: visionScoreData.downloadGifCount,
      printOrderCount: visionScoreData.printOrderCount,
      printRevenueCents: visionScoreData.printRevenueCents,
      tradeCount: visionScoreData.tradeCount,
      totalScore: visionScoreData.totalScore,
      royaltyCentsEarned: visionScoreData.royaltyCentsEarned,
      royaltyOrdersCount: visionScoreData.royaltyOrdersCount,
      updatedAt: new Date().toISOString(),
    } : null
  );
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [gameAnalysis, setGameAnalysis] = useState<GameAnalysis | null>(null);
  const [gameCardMatch, setGameCardMatch] = useState<GameCardMatch | null>(null);
  const [showPoetryModal, setShowPoetryModal] = useState(false);
  
  // Board display options
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showPieces, setShowPieces] = useState(false);
  const [pieceOpacity, setPieceOpacity] = useState(0.7);
  const [boardSize, setBoardSize] = useState(400);
  const [darkMode, setDarkMode] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [mobileLegendExpanded, setMobileLegendExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  
  // === Seamless Palette Switching State ===
  const [localBoard, setLocalBoard] = useState<SquareData[][]>(board);
  const [localGameData, setLocalGameData] = useState<GameData>(gameData);
  const [localTotalMoves, setLocalTotalMoves] = useState<number>(totalMoves);
  const [localPaletteId, setLocalPaletteId] = useState<PaletteId | undefined>(paletteId as PaletteId | undefined);
  const [localVisualizationId, setLocalVisualizationId] = useState<string | undefined>(visualizationId);
  const [localTitle, setLocalTitle] = useState<string | undefined>(title);
  const [localIsOwner, setLocalIsOwner] = useState<boolean>(isOwner);
  const [localIsListed, setLocalIsListed] = useState<boolean>(isListed);
  const [localSellerName, setLocalSellerName] = useState<string | undefined>(sellerName);
  const [localPurchasePrice, setLocalPurchasePrice] = useState<number | undefined>(purchasePrice);
  const [isSwitchingPalette, setIsSwitchingPalette] = useState(false);

  // Sync props to local state when they change externally
  useEffect(() => {
    setLocalBoard(board);
    setLocalGameData(gameData);
    setLocalTotalMoves(totalMoves);
    setLocalPaletteId(paletteId as PaletteId | undefined);
    setLocalVisualizationId(visualizationId);
    setLocalTitle(title);
    setLocalIsOwner(isOwner);
    setLocalIsListed(isListed);
    setLocalSellerName(sellerName);
    setLocalPurchasePrice(purchasePrice);
  }, [board, gameData, totalMoves, paletteId, visualizationId, title, isOwner, isListed, sellerName, purchasePrice]);
  
  // Detect if current palette is an official En Pensent palette
  const currentPaletteInfo = useMemo(() => {
    const activePalette = localPaletteId || getActivePalette().id;
    if (activePalette === 'custom') return null;
    const palette = colorPalettes.find(p => p.id === activePalette);
    return palette ? { id: activePalette as PaletteId, name: palette.name } : null;
  }, [localPaletteId]);
  
  // Seamless palette switch handler
  const handleSeamlessPaletteSwitch = useCallback(async (info: PaletteAvailabilityInfo) => {
    const pgnToUse = pgn || localGameData.pgn;
    if (!pgnToUse) return;
    
    setIsSwitchingPalette(true);
    
    try {
      // Set new palette globally
      setActivePalette(info.paletteId);
      setLocalPaletteId(info.paletteId);
      
      if (info.isTaken && info.visualizationId) {
        // Fetch existing visualization data
        const { data: vizData, error } = await supabase
          .from('saved_visualizations')
          .select('*')
          .eq('id', info.visualizationId)
          .single();
        
        if (error) throw error;
        
        // Parse the saved game data
        const savedGameData = vizData.game_data as unknown as {
          board?: SquareData[][];
          gameData?: GameData;
          totalMoves?: number;
        };
        
        if (savedGameData.board) {
          setLocalBoard(savedGameData.board);
        }
        if (savedGameData.gameData) {
          setLocalGameData(savedGameData.gameData);
        }
        if (savedGameData.totalMoves) {
          setLocalTotalMoves(savedGameData.totalMoves);
        }
        
        setLocalVisualizationId(info.visualizationId);
        setLocalTitle(vizData.title);
        setLocalIsOwner(vizData.user_id === user?.id);
        
        // Check for listing
        const { data: listingData } = await supabase
          .from('visualization_listings')
          .select('*, profiles:seller_id(display_name)')
          .eq('visualization_id', info.visualizationId)
          .eq('status', 'active')
          .maybeSingle();
        
        setLocalIsListed(!!listingData);
        setLocalPurchasePrice(listingData?.price_cents);
        setLocalSellerName((listingData?.profiles as { display_name?: string })?.display_name || 'Anonymous');
        
        // Fetch new vision score
        const newScore = await getVisionScore(info.visualizationId);
        setVisionScore(newScore);
        
        toast.success(`Switched to ${info.ownerDisplayName}'s ${colorPalettes.find(p => p.id === info.paletteId)?.name || 'palette'} colorway`);
      } else {
        // Regenerate board from PGN with new palette colors
        const simResult = simulateGame(pgnToUse);
        
        // Re-apply colors based on new palette
        const updatedBoard = simResult.board.map(rank =>
          rank.map(square => ({
            ...square,
            visits: square.visits.map(visit => ({
              ...visit,
              hexColor: getPieceColor(visit.piece, visit.color),
            })),
          }))
        );
        
        setLocalBoard(updatedBoard);
        setLocalGameData(simResult.gameData);
        setLocalTotalMoves(simResult.totalMoves);
        setLocalVisualizationId(undefined);
        setLocalTitle(undefined);
        setLocalIsOwner(false);
        setLocalIsListed(false);
        setVisionScore(null);
        
        const paletteName = colorPalettes.find(p => p.id === info.paletteId)?.name;
        toast.success(`Applied ${paletteName || 'new'} palette`);
      }
      
      onPaletteChange?.();
    } catch (err) {
      console.error('Failed to switch palette:', err);
      toast.error('Failed to switch palette');
    } finally {
      setIsSwitchingPalette(false);
    }
  }, [pgn, localGameData.pgn, user?.id, onPaletteChange]);
  
  // Detect game card match from PGN
  useEffect(() => {
    const pgnToCheck = pgn || gameData.pgn;
    if (pgnToCheck) {
      const match = detectGameCard(pgnToCheck);
      setGameCardMatch(match);
    }
  }, [pgn, gameData.pgn]);

  // Calculate responsive board size - accounts for timeline and legend on xl screens
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const windowWidth = window.innerWidth;
        
        // On xl screens, subtract timeline (120px) and legend (200px) widths plus gaps
        const isXlScreen = windowWidth >= 1280;
        const sidebarSpace = isXlScreen ? 120 + 200 + 32 : 0; // timeline + legend + gaps
        const availableWidth = containerWidth - sidebarSpace - 32; // 32px padding
        
        // Calculate max size based on available space
        const maxSize = Math.min(availableWidth, 500);
        setBoardSize(Math.max(280, Math.min(maxSize, 500)));
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Load vision score (skip if already provided via props)
  useEffect(() => {
    if (visualizationId && !visionScoreData) {
      setIsLoadingScore(true);
      getVisionScore(visualizationId)
        .then(score => setVisionScore(score))
        .finally(() => setIsLoadingScore(false));
    }
  }, [visualizationId, visionScoreData]);

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

  // Keyboard shortcuts for visualization controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      switch (key) {
        // F - Toggle fullscreen
        case 'f':
          e.preventDefault();
          setIsFullscreen(prev => !prev);
          break;

        // C - Toggle coordinates
        case 'c':
          e.preventDefault();
          setShowCoordinates(prev => !prev);
          break;

        // L - Toggle legend (expand on mobile, toggle on desktop)
        case 'l':
          e.preventDefault();
          if (window.innerWidth < 1280) {
            setMobileLegendExpanded(prev => !prev);
          } else {
            setShowLegend(prev => !prev);
          }
          break;

        // Escape - Exit fullscreen
        case 'escape':
          if (isFullscreen) {
            e.preventDefault();
            setIsFullscreen(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

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
        {/* Fullscreen Overlay */}
        <AnimatePresence>
          {isFullscreen && (
            <motion.div
              ref={fullscreenRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background flex items-center justify-center"
            >
              {/* Fullscreen close button */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsFullscreen(false)}
                        className="bg-background/80 backdrop-blur-sm"
                      >
                        <Minimize2 className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Exit fullscreen (Esc)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Fullscreen board - larger size */}
              <div className="relative" data-vision-board="true">
                <TimelineBoard 
                  board={localBoard} 
                  totalMoves={localTotalMoves} 
                  size={Math.min(window.innerHeight - 100, window.innerWidth - 100, 700)}
                  gameData={localGameData}
                  darkMode={darkMode}
                  title={localTitle || contextTitle}
                  showCoordinates={showCoordinates}
                />
              </div>

              {/* Fullscreen keyboard hint */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                Press <kbd className="px-1.5 py-0.5 bg-background rounded border text-foreground">Esc</kbd> or <kbd className="px-1.5 py-0.5 bg-background rounded border text-foreground">F</kbd> to exit
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            <TabsContent value="experience" className="mt-0 overflow-visible">
              <div className="overflow-visible">
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
                        <TooltipContent>Toggle board coordinates (C)</TooltipContent>
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
                            <TooltipContent>Toggle color legend (L)</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}

                    {/* Fullscreen Button */}
                    <div className="h-4 w-px bg-border" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsFullscreen(true)}
                            className="h-8 w-8 p-0"
                          >
                            <Maximize2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Fullscreen mode (F)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Main Layout: Timeline Left | Board Center | Legend Right */}
                  <div className="flex gap-2 xl:gap-4 items-start justify-center w-full overflow-visible">
                    {/* Left: Vertical Timeline */}
                    <div className="hidden xl:block flex-shrink-0">
                      <VerticalTimelineSlider 
                        totalMoves={localTotalMoves} 
                        moves={localGameData.moves}
                        pgn={pgn || localGameData.pgn}
                      />
                    </div>

                    {/* Center: Board */}
                    <div className="flex-shrink-0 relative" data-vision-board="true">
                      {isSwitchingPalette && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      )}
                      <TimelineBoard 
                        board={localBoard} 
                        totalMoves={localTotalMoves} 
                        size={boardSize}
                        gameData={localGameData}
                        darkMode={darkMode}
                        title={localTitle || contextTitle}
                        showCoordinates={showCoordinates}
                      />
                    </div>

                    {/* Right: Color Legend - scrollable to show full content */}
                    {showLegend && (
                      <div className="hidden xl:flex flex-shrink-0 w-[200px] max-h-[80vh] overflow-y-auto scrollbar-hide">
                        <ColorLegend 
                          interactive={true}
                          board={localBoard}
                        />
                      </div>
                    )}
                  </div>

                  {/* Mobile/Tablet Timeline Controls (shown on smaller screens) */}
                  <div className="xl:hidden">
                    <TimelineControls 
                      totalMoves={totalMoves} 
                      moves={gameData.moves}
                    />
                  </div>

                  {/* Mobile/Tablet Collapsible Legend */}
                  {showLegend && (
                    <div className="xl:hidden">
                      <motion.div
                        className="rounded-lg border border-border/50 bg-card/50 overflow-hidden"
                        initial={false}
                      >
                        <button
                          onClick={() => setMobileLegendExpanded(!mobileLegendExpanded)}
                          className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                        >
                          <span className="font-display text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Color Legend
                          </span>
                          <motion.div
                            animate={{ rotate: mobileLegendExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </motion.div>
                        </button>
                        <AnimatePresence>
                          {mobileLegendExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 pt-0">
                                <EnhancedLegend 
                                  whitePalette={getCurrentPalette().white}
                                  blackPalette={getCurrentPalette().black}
                                  board={board}
                                  compact
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  )}

                  {/* Game Info is now integrated into TimelineBoard for trademark look */}

                  {/* Intrinsic Palette/Game Card - Show when matched */}
                  {(currentPaletteInfo || (gameCardMatch?.isMatch)) && (
                    <IntrinsicPaletteCard
                      paletteId={currentPaletteInfo?.id}
                      similarity={currentPaletteInfo ? 100 : undefined}
                      gameCardId={gameCardMatch?.matchedGame?.id}
                      gameCardTitle={gameCardMatch?.matchedGame?.title}
                      gameCardMatchType={gameCardMatch?.matchType}
                      gameCardSimilarity={gameCardMatch?.similarity}
                    />
                  )}

                  {/* Palette Availability - Seamless switching */}
                  {(pgn || localGameData.pgn) && (
                    <PaletteAvailabilityIndicator
                      pgn={pgn || localGameData.pgn}
                      currentUserId={user?.id}
                      currentPaletteId={currentPaletteInfo?.id}
                      context={context}
                      compact={context !== 'generator'}
                      onSeamlessSwitch={handleSeamlessPaletteSwitch}
                    />
                  )}

                  {/* Poetry Preview - Show when famous game has poetry */}
                  {gameCardMatch?.isMatch && gameCardMatch?.matchedGame?.id && getGamePoetry(gameCardMatch.matchedGame.id) && (
                    <PoetryPreviewCard
                      gameId={gameCardMatch.matchedGame.id}
                      gameTitle={gameCardMatch.matchedGame.title}
                      onOpenModal={() => setShowPoetryModal(true)}
                    />
                  )}

                  {/* Action Buttons - Context Specific */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border/30">
                    {/* Generator/Postgame Actions */}
                    {showGeneratorActions && (
                      <>
                        <ExportActionButtons
                          onExport={onExport}
                          isPremium={isPremium}
                          darkMode={darkMode}
                          totalMoves={totalMoves}
                        />
                        
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

                    {/* Gallery Actions - Use same ExportActionButtons for state capture */}
                    {showGalleryActions && (
                      <>
                        <ExportActionButtons
                          onExport={onExport}
                          isPremium={isPremium}
                          darkMode={darkMode}
                          totalMoves={totalMoves}
                        />
                        
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
                    
                    {/* Marketplace Actions - Use same ExportActionButtons for state capture */}
                    {showMarketplaceInfo && (
                      <ExportActionButtons
                        onExport={onExport}
                        isPremium={isPremium}
                        darkMode={darkMode}
                        totalMoves={totalMoves}
                      />
                    )}
                    
                    {/* Shared/Scanner/Other contexts - Show export buttons if onExport provided */}
                    {!showGeneratorActions && !showGalleryActions && !showMarketplaceInfo && onExport && (
                      <ExportActionButtons
                        onExport={onExport}
                        isPremium={isPremium}
                        darkMode={darkMode}
                        totalMoves={totalMoves}
                      />
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

                  {/* Mini Print Order Section */}
                  {onExport && (
                    <MiniPrintOrderSection
                      board={board}
                      gameData={gameData}
                      totalMoves={totalMoves}
                      darkMode={darkMode}
                      onOrderPrint={(exportState) => onExport('print', exportState)}
                      className="mt-6"
                    />
                  )}

                  {/* Print Value Proposition */}
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-primary/10 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium text-foreground">Museum-Quality Chess Art</h4>
                        <ul className="text-sm text-muted-foreground space-y-1.5">
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary" />
                            Archival canvas prints that last 100+ years
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary" />
                            Free US shipping on every order
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary" />
                            Handcrafted frames in 5 premium finishes
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary" />
                            30-day satisfaction guarantee
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0">
              <ScrollArea className="h-[calc(100vh-300px)] sm:h-auto">
                {/* Royalty Earnings/Potential Card - Show for marketplace and gallery */}
                {(context === 'marketplace' || context === 'gallery') && visionScore && (
                  <div className="mb-6">
                    {isOwner ? (
                      <RoyaltyEarningsCard
                        royaltyCentsEarned={visionScore.royaltyCentsEarned}
                        royaltyOrdersCount={visionScore.royaltyOrdersCount}
                        totalPrintRevenue={visionScore.printRevenueCents}
                        printOrderCount={visionScore.printOrderCount}
                      />
                    ) : (
                      <RoyaltyPotentialCard
                        isOwner={false}
                        royaltyCentsEarned={visionScore.royaltyCentsEarned}
                        royaltyOrdersCount={visionScore.royaltyOrdersCount}
                        totalPrintRevenue={visionScore.printRevenueCents}
                        printOrderCount={visionScore.printOrderCount}
                        viewCount={visionScore.viewCount}
                        uniqueViewers={visionScore.uniqueViewers}
                      />
                    )}
                  </div>
                )}

                {/* Transfer History - Show for marketplace and gallery contexts */}
                {(context === 'marketplace' || context === 'gallery') && visualizationId && (
                  <div className="mb-6">
                    <TransferHistoryCard visualizationId={visualizationId} />
                  </div>
                )}

                {/* Transfer Limit Badge - Show in marketplace context */}
                {context === 'marketplace' && visualizationId && (
                  <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-sm text-muted-foreground">Transfer availability:</span>
                    <TransferLimitBadge visualizationId={visualizationId} />
                  </div>
                )}

                <AnalyticsPanel
                  visionScore={visionScore}
                  isLoading={isLoadingScore}
                  gameData={gameData}
                  totalMoves={totalMoves}
                  createdAt={createdAt}
                  gameAnalysis={gameAnalysis}
                  pgn={pgn || gameData.pgn}
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

          {/* Poetry Modal */}
          <PoetryModal
            gameId={gameCardMatch?.matchedGame?.id || null}
            gameTitle={gameCardMatch?.matchedGame?.title}
            isOpen={showPoetryModal}
            onClose={() => setShowPoetryModal(false)}
          />
        </div>
      </LegendHighlightProvider>
    </TimelineProvider>
  );
};

export default UnifiedVisionExperience;
