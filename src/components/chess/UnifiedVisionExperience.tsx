import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Chess } from 'chess.js';
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
import { TimelineProvider, useTimeline, GamePhase } from '@/contexts/TimelineContext';
import { LegendHighlightProvider, useLegendHighlight, HighlightedPiece } from '@/contexts/LegendHighlightContext';
import InteractiveVisualizationBoard from './InteractiveVisualizationBoard';
import { EnhancedLegend } from './EnhancedLegend';
import GameInfoDisplay from './GameInfoDisplay';
import InteractiveGameInfoDisplay from './InteractiveGameInfoDisplay';
import VerticalTimelineSlider from './VerticalTimelineSlider';
import ColorLegend from './ColorLegend';
import { classifyMoves, getMoveQualitySummary, MOVE_QUALITY_INFO, ClassifiedMove } from '@/lib/chess/moveQuality';
import { MoveQualityTooltip, BookMovesCard, extractOpeningInfo } from './MoveQualityTooltip';
import { ShowPiecesToggle } from './ShowPiecesToggle';
import BoardCoordinateGuide from './BoardCoordinateGuide';
import IntrinsicPaletteCard from './IntrinsicPaletteCard';
import ChessBoardVisualization from './ChessBoardVisualization';
import { VisionScore, getVisionScore, calculateVisionValue, calculateMembershipMultiplier, SCORING_WEIGHTS } from '@/lib/visualizations/visionScoring';
import { analyzeGame, GameAnalysis } from '@/lib/chess/chessAnalysis';
import { setActivePalette, PaletteId, getActivePalette, getCurrentPalette, colorPalettes, getPieceColor, PieceType, PieceColor } from '@/lib/chess/pieceColors';
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
import PaletteOwnershipCard from './PaletteOwnershipCard';
import { useAuth } from '@/hooks/useAuth';
import MiniPrintOrderSection from './MiniPrintOrderSection';
import { generateGameHash } from '@/lib/visualizations/gameCanonical';
import ClaimVisionButton from '@/components/vision/ClaimVisionButton';
import { OpeningBadge, OpeningMarketingCard } from './OpeningBadge';
import { detectOpeningFromPgn, DetectedOpening } from '@/lib/chess/openingDetector';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaletteAvailabilityInfo } from '@/lib/visualizations/paletteAvailability';
import { useVisualizationStateStore } from '@/stores/visualizationStateStore';

// Export state for capturing visualization in any configuration
export interface ExportState {
  currentMove: number;
  lockedPieces: Array<{ pieceType: string; pieceColor: string }>;
  lockedSquares: Array<{ square: string; pieces: Array<{ pieceType: string; pieceColor: string }> }>;
  compareMode: boolean;
  darkMode: boolean;
  showPieces: boolean;
  pieceOpacity: number;
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
  onShare?: (exportState?: ExportState) => void;
  onClose?: () => void;
  onBack?: () => void;
  onSaveToGallery?: () => Promise<string | null>;
  onPaletteChange?: () => void;
  
  // Initial state from shared URL or session restoration
  initialState?: {
    move?: number;
    dark?: boolean;
    pieces?: boolean;
    opacity?: number;
    locked?: Array<{ type: string; color: string }>;
    compare?: boolean;
    territory?: boolean;
    heatmaps?: boolean;
    phase?: 'all' | 'opening' | 'middlegame' | 'endgame';
  };
  
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
    scanCount?: number;
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
  showPieces?: boolean;
  pieceOpacity?: number;
  pgn?: string;
}> = ({ board, totalMoves, size, gameData, darkMode = false, title, showCoordinates = false, showPieces = false, pieceOpacity = 0.7, pgn }) => {
  const { currentMove, setCurrentMove } = useTimeline();
  
  // Ensure PGN is available - prefer prop, fallback to gameData.pgn
  const effectivePgnForBoard = useMemo(() => {
    if (pgn && typeof pgn === 'string' && pgn.trim().length > 0) {
      return pgn.trim();
    }
    if (gameData?.pgn && typeof gameData.pgn === 'string' && gameData.pgn.trim().length > 0) {
      return gameData.pgn.trim();
    }
    return '';
  }, [pgn, gameData?.pgn]);
  
  const filteredBoard = useMemo(() => {
    if (currentMove >= totalMoves) return board;
    return board.map(rank =>
      rank.map(square => ({
        ...square,
        visits: square.visits.filter(visit => visit.moveNumber <= currentMove)
      }))
    );
  }, [board, currentMove, totalMoves]);

  // Handle follow piece activation - jump to the move
  const handleFollowPieceActivated = useCallback((moveNumber: number) => {
    setCurrentMove(moveNumber);
  }, [setCurrentMove]);

  const bgColor = darkMode ? '#0A0A0A' : '#FDFCFB';
  const borderColor = darkMode ? '#292524' : '#e7e5e4';
  const mutedColor = darkMode ? '#78716c' : '#a8a29e';

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
      {/* Chess Board - Now Interactive for square hover highlighting */}
      <div style={{ position: 'relative' }}>
        {showCoordinates && (
          <BoardCoordinateGuide size={size} position="inside" />
        )}
        <InteractiveVisualizationBoard 
          board={filteredBoard} 
          size={size}
          showPieces={showPieces}
          pieceOpacity={pieceOpacity}
          pgn={effectivePgnForBoard}
          currentMoveNumber={currentMove}
          onFollowPieceActivated={handleFollowPieceActivated}
        />
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
  
  // Extract clean PGN from multiple possible sources
  const effectivePgn = React.useMemo(() => {
    // Priority: prop pgn > gameData.pgn
    const sources = [pgn, gameData.pgn];
    for (const source of sources) {
      if (source && typeof source === 'string' && source.trim().length > 0) {
        return source.trim();
      }
    }
    return '';
  }, [pgn, gameData.pgn]);
  
  // Calculate move quality summary and classified moves - ensure we have valid PGN
  const { qualitySummary, classifiedMoves } = React.useMemo(() => {
    if (!effectivePgn) {
      return { qualitySummary: null, classifiedMoves: [] as ClassifiedMove[] };
    }
    try {
      const classified = classifyMoves(effectivePgn);
      if (classified.length === 0) {
        return { qualitySummary: null, classifiedMoves: [] as ClassifiedMove[] };
      }
      return { 
        qualitySummary: getMoveQualitySummary(classified),
        classifiedMoves: classified,
      };
    } catch (e) {
      console.warn('Move quality analysis failed:', e);
      return { qualitySummary: null, classifiedMoves: [] as ClassifiedMove[] };
    }
  }, [effectivePgn]);
  
  // Extract opening information for book move tooltips
  const openingInfo = React.useMemo(() => {
    if (!effectivePgn || classifiedMoves.length === 0) {
      return null;
    }
    return extractOpeningInfo(effectivePgn, classifiedMoves);
  }, [effectivePgn, classifiedMoves]);
  
  // Detect opening with full marketing info
  const detectedOpening = React.useMemo((): DetectedOpening | null => {
    if (!effectivePgn) return null;
    try {
      return detectOpeningFromPgn(effectivePgn) || null;
    } catch {
      return null;
    }
  }, [effectivePgn]);
  
  // Calculate estimated value - show even for new (unsaved) visions based on game complexity
  const baseEstimatedValue = visionScore ? calculateVisionValue(visionScore, membershipMultiplier) : 0;
  
  // For new visions without a score, show a complexity-based potential value
  const potentialValue = React.useMemo(() => {
    if (visionScore) return null; // Already have real score
    
    // Base value on game complexity signals
    let potential = 5.00; // Base minimum
    
    if (gameAnalysis) {
      // Add value for notable game features
      if (gameAnalysis.opening) potential += 2.00;
      if (gameAnalysis.gambit) potential += 3.00;
      if (gameAnalysis.tactics.length > 0) potential += gameAnalysis.tactics.length * 0.50;
      if (gameAnalysis.specialMoves.length > 0) potential += gameAnalysis.specialMoves.length * 0.25;
      if (gameAnalysis.summary?.complexity === 'masterpiece') potential += 5.00;
      else if (gameAnalysis.summary?.complexity === 'complex') potential += 3.00;
    }
    
    // Add value based on move quality
    if (qualitySummary) {
      potential += qualitySummary.brilliantCount * 2.00;
      potential += qualitySummary.greatCount * 0.50;
    }
    
    return Math.min(potential, 50.00); // Cap at $50 potential
  }, [visionScore, gameAnalysis, qualitySummary]);
  
  const estimatedValue = baseEstimatedValue;

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
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Deep Analysis
            </h3>
            {/* Game Complexity Badge - moved here for visibility */}
            {gameAnalysis.summary && (
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
            )}
          </div>
          
          {/* Opening Detection with Marketing Info */}
          {detectedOpening ? (
            <OpeningMarketingCard opening={detectedOpening} showValue={true} />
          ) : gameAnalysis.opening && (
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

          {/* Move Quality Metrics - encompasses all statistics */}
          {qualitySummary && (
            <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Move Quality
                </Badge>
              </div>
              
              {/* Per-player accuracy display - chess.com style */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-2 rounded bg-background/50 border border-border/30 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">♔ {gameData.white || 'White'}</p>
                  <p className={`text-lg font-bold ${
                    qualitySummary.whiteAccuracy >= 90 ? 'text-green-400' :
                    qualitySummary.whiteAccuracy >= 70 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {qualitySummary.whiteAccuracy}%
                  </p>
                </div>
                <div className="p-2 rounded bg-background/50 border border-border/30 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">♚ {gameData.black || 'Black'}</p>
                  <p className={`text-lg font-bold ${
                    qualitySummary.blackAccuracy >= 90 ? 'text-green-400' :
                    qualitySummary.blackAccuracy >= 70 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {qualitySummary.blackAccuracy}%
                  </p>
                </div>
              </div>
              
              {/* Quality breakdown - show all categories with hover tooltips */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                {/* Brilliant moves - always show if > 0 */}
                {qualitySummary.brilliantCount > 0 && (
                  <MoveQualityTooltip 
                    quality="brilliant" 
                    count={qualitySummary.brilliantCount}
                    classifiedMoves={classifiedMoves}
                  >
                    <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 cursor-help transition-all hover:bg-cyan-500/15 hover:border-cyan-500/30">
                      <p className="font-bold text-cyan-400">{qualitySummary.brilliantCount}</p>
                      <p className="text-muted-foreground text-[10px]">Brilliant !!</p>
                    </div>
                  </MoveQualityTooltip>
                )}
                {/* Great moves */}
                {qualitySummary.greatCount > 0 && (
                  <MoveQualityTooltip 
                    quality="great" 
                    count={qualitySummary.greatCount}
                    classifiedMoves={classifiedMoves}
                  >
                    <div className="p-2 rounded bg-green-500/10 border border-green-500/20 cursor-help transition-all hover:bg-green-500/15 hover:border-green-500/30">
                      <p className="font-bold text-green-400">{qualitySummary.greatCount}</p>
                      <p className="text-muted-foreground text-[10px]">Great !</p>
                    </div>
                  </MoveQualityTooltip>
                )}
                {/* Best moves */}
                {qualitySummary.bestCount > 0 && (
                  <MoveQualityTooltip 
                    quality="best" 
                    count={qualitySummary.bestCount}
                    classifiedMoves={classifiedMoves}
                  >
                    <div className="p-2 rounded bg-lime-500/10 border border-lime-500/20 cursor-help transition-all hover:bg-lime-500/15 hover:border-lime-500/30">
                      <p className="font-bold text-lime-400">{qualitySummary.bestCount}</p>
                      <p className="text-muted-foreground text-[10px]">Best ✓</p>
                    </div>
                  </MoveQualityTooltip>
                )}
                {/* Good moves */}
                {qualitySummary.goodCount > 0 && (
                  <MoveQualityTooltip 
                    quality="good" 
                    count={qualitySummary.goodCount}
                    classifiedMoves={classifiedMoves}
                  >
                    <div className="p-2 rounded bg-gray-500/10 border border-gray-500/20 cursor-help transition-all hover:bg-gray-500/15 hover:border-gray-500/30">
                      <p className="font-bold text-gray-400">{qualitySummary.goodCount}</p>
                      <p className="text-muted-foreground text-[10px]">Good ○</p>
                    </div>
                  </MoveQualityTooltip>
                )}
              </div>
              
              {/* Errors breakdown - only show if there are any */}
              {(qualitySummary.inaccuracyCount > 0 || qualitySummary.mistakeCount > 0 || qualitySummary.blunderCount > 0) && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  {qualitySummary.inaccuracyCount > 0 && (
                    <MoveQualityTooltip 
                      quality="inaccuracy" 
                      count={qualitySummary.inaccuracyCount}
                      classifiedMoves={classifiedMoves}
                    >
                      <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20 cursor-help transition-all hover:bg-yellow-500/15 hover:border-yellow-500/30">
                        <p className="font-bold text-yellow-400">{qualitySummary.inaccuracyCount}</p>
                        <p className="text-muted-foreground text-[10px]">Inaccuracy ?!</p>
                      </div>
                    </MoveQualityTooltip>
                  )}
                  {qualitySummary.mistakeCount > 0 && (
                    <MoveQualityTooltip 
                      quality="mistake" 
                      count={qualitySummary.mistakeCount}
                      classifiedMoves={classifiedMoves}
                    >
                      <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20 cursor-help transition-all hover:bg-orange-500/15 hover:border-orange-500/30">
                        <p className="font-bold text-orange-400">{qualitySummary.mistakeCount}</p>
                        <p className="text-muted-foreground text-[10px]">Mistake ?</p>
                      </div>
                    </MoveQualityTooltip>
                  )}
                  {qualitySummary.blunderCount > 0 && (
                    <MoveQualityTooltip 
                      quality="blunder" 
                      count={qualitySummary.blunderCount}
                      classifiedMoves={classifiedMoves}
                    >
                      <div className="p-2 rounded bg-red-500/10 border border-red-500/20 cursor-help transition-all hover:bg-red-500/15 hover:border-red-500/30">
                        <p className="font-bold text-red-400">{qualitySummary.blunderCount}</p>
                        <p className="text-muted-foreground text-[10px]">Blunder ??</p>
                      </div>
                    </MoveQualityTooltip>
                  )}
                </div>
              )}
              
              {/* Book moves - show if game has opening theory */}
              {qualitySummary.bookCount > 0 && openingInfo && (
                <BookMovesCard count={qualitySummary.bookCount} openingInfo={openingInfo} />
              )}
              
              {/* Tactical event counts */}
              <div className="pt-2 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground mb-2">Tactical Events</p>
                <div className="grid grid-cols-6 gap-1 text-center text-xs">
                  <div className="p-1 rounded bg-yellow-500/10">
                    <p className="font-bold text-yellow-400">{qualitySummary.checkCount}</p>
                    <p className="text-muted-foreground text-[9px]">Checks</p>
                  </div>
                  <div className="p-1 rounded bg-red-500/10">
                    <p className="font-bold text-red-400">{qualitySummary.checkmateCount}</p>
                    <p className="text-muted-foreground text-[9px]">Mate</p>
                  </div>
                  <div className="p-1 rounded bg-orange-500/10">
                    <p className="font-bold text-orange-400">{qualitySummary.captureCount}</p>
                    <p className="text-muted-foreground text-[9px]">Captures</p>
                  </div>
                  <div className="p-1 rounded bg-blue-500/10">
                    <p className="font-bold text-blue-400">{qualitySummary.castleCount}</p>
                    <p className="text-muted-foreground text-[9px]">Castles</p>
                  </div>
                  <div className="p-1 rounded bg-purple-500/10">
                    <p className="font-bold text-purple-400">{qualitySummary.sacrificeCount}</p>
                    <p className="text-muted-foreground text-[9px]">Sacrifices</p>
                  </div>
                  <div className="p-1 rounded bg-pink-500/10">
                    <p className="font-bold text-pink-400">{qualitySummary.promotionCount}</p>
                    <p className="text-muted-foreground text-[9px]">Promos</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vision Score - show for saved visions OR potential value for new ones */}
      {(visionScore || potentialValue) && (
        <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm uppercase tracking-wider text-primary">
              {visionScore ? 'Vision Score' : 'Potential Value'}
            </h3>
            {visionScore ? (
              <Badge variant="outline" className="bg-primary/10 text-primary">
                {visionScore.totalScore.toFixed(2)} pts
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                New Vision
              </Badge>
            )}
          </div>
          
          {visionScore ? (
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
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                Save this vision to start tracking its value
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-border/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {visionScore ? 'Estimated Value' : 'Potential Starting Value'}
              </span>
              <span className="font-display text-xl text-primary">
                ${(visionScore ? estimatedValue : potentialValue || 0).toFixed(2)}
              </span>
            </div>
            {!visionScore && potentialValue && (
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Based on game complexity and tactical richness
              </p>
            )}
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
  isPremium?: boolean;
  darkMode: boolean;
  totalMoves: number;
  showPieces: boolean;
  pieceOpacity: number;
}> = ({ onExport, isPremium = false, darkMode, totalMoves, showPieces, pieceOpacity }) => {
  const { currentMove } = useTimeline();
  const { lockedPieces, lockedSquares, compareMode } = useLegendHighlight();
  
  const handleExport = useCallback((type: 'hd' | 'gif' | 'print' | 'preview') => {
    const exportState: ExportState = {
      currentMove: currentMove >= totalMoves ? totalMoves : currentMove,
      lockedPieces: lockedPieces.map(p => ({
        pieceType: p.pieceType,
        pieceColor: p.pieceColor,
      })),
      lockedSquares: lockedSquares.map(sq => ({
        square: sq.square,
        pieces: sq.pieces.map(p => ({
          pieceType: p.pieceType,
          pieceColor: p.pieceColor,
        })),
      })),
      compareMode,
      darkMode,
      showPieces,
      pieceOpacity,
    };
    onExport?.(type, exportState);
  }, [onExport, currentMove, totalMoves, lockedPieces, lockedSquares, compareMode, darkMode, showPieces, pieceOpacity]);

  if (!onExport) return null;

  return (
    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
      {/* Free Preview Download - available to everyone */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => handleExport('preview')}
            >
              <Download className="h-4 w-4" />
              Preview
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download preview image (free)</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>
            {isPremium ? 'Download high-resolution image' : 'Premium: Download HD image'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>
            {isPremium ? 'Download animated GIF' : 'Premium: Download animated GIF'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
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

// Share button that captures current visual state
const ShareButtonWithState: React.FC<{
  onShare: (exportState?: ExportState) => void;
  darkMode: boolean;
  showPieces: boolean;
  pieceOpacity: number;
  totalMoves: number;
}> = ({ onShare, darkMode, showPieces, pieceOpacity, totalMoves }) => {
  const { currentMove } = useTimeline();
  const { lockedPieces, lockedSquares, compareMode } = useLegendHighlight();
  
  const handleClick = useCallback(() => {
    const exportState: ExportState = {
      currentMove: currentMove >= totalMoves ? totalMoves : currentMove,
      lockedPieces: lockedPieces.map(p => ({
        pieceType: p.pieceType,
        pieceColor: p.pieceColor,
      })),
      lockedSquares: lockedSquares.map(sq => ({
        square: sq.square,
        pieces: sq.pieces.map(p => ({
          pieceType: p.pieceType,
          pieceColor: p.pieceColor,
        })),
      })),
      compareMode,
      darkMode,
      showPieces,
      pieceOpacity,
    };
    onShare(exportState);
  }, [onShare, currentMove, totalMoves, lockedPieces, lockedSquares, compareMode, darkMode, showPieces, pieceOpacity]);
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="gap-2 ml-auto"
      onClick={handleClick}
    >
      <Share2 className="h-4 w-4" />
      Share
    </Button>
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
  initialState,
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
      scanCount: visionScoreData.scanCount || 0,
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
  
  // Board display options - initialize from initialState if provided
  // Also sync with the global visualization state store for exports
  const {
    showPieces: storeShowPieces,
    pieceOpacity: storePieceOpacity,
    darkMode: storeDarkMode,
    setShowPieces: setStoreShowPieces,
    setPieceOpacity: setStorePieceOpacity,
    setDarkMode: setStoreDarkMode,
  } = useVisualizationStateStore();
  
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(initialState?.heatmaps ?? false);
  const [showPieces, setShowPiecesLocal] = useState(initialState?.pieces ?? storeShowPieces ?? false);
  const [pieceOpacity, setPieceOpacityLocal] = useState(initialState?.opacity ?? storePieceOpacity ?? 0.7);
  const [boardSize, setBoardSize] = useState(400);
  const [darkMode, setDarkModeLocal] = useState(initialState?.dark ?? storeDarkMode ?? false);
  
  // Sync local state to global store for export modal to read
  const setShowPieces = useCallback((value: boolean) => {
    setShowPiecesLocal(value);
    setStoreShowPieces(value);
  }, [setStoreShowPieces]);
  
  const setPieceOpacity = useCallback((value: number) => {
    setPieceOpacityLocal(value);
    setStorePieceOpacity(value);
  }, [setStorePieceOpacity]);
  
  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeLocal(value);
    setStoreDarkMode(value);
  }, [setStoreDarkMode]);
  const [showLegend, setShowLegend] = useState(true);
  const [mobileLegendExpanded, setMobileLegendExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Sync initial state to store on mount so exports see correct values
  useEffect(() => {
    if (initialState?.pieces !== undefined) {
      setStoreShowPieces(initialState.pieces);
    }
    if (initialState?.opacity !== undefined) {
      setStorePieceOpacity(initialState.opacity);
    }
    if (initialState?.dark !== undefined) {
      setStoreDarkMode(initialState.dark);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount - intentionally ignoring dependencies
  
  // Initial move position for TimelineProvider
  const initialMove = useMemo(() => {
    if (initialState?.move !== undefined && initialState.move > 0) {
      return Math.min(initialState.move, totalMoves);
    }
    return totalMoves; // Default to showing all moves
  }, [initialState?.move, totalMoves]);
  
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

  // Memoize the actual PGN to use consistently throughout the component
  // Check multiple sources in priority order to ensure we find valid PGN
  const effectivePgn = useMemo(() => {
    // Priority: prop pgn > localGameData.pgn > gameData.pgn
    const sources = [
      pgn,
      localGameData?.pgn,
      gameData?.pgn,
    ];
    
    for (const source of sources) {
      if (source && typeof source === 'string' && source.trim().length > 0) {
        const trimmed = source.trim();
        // Additional validation: ensure it's not just whitespace or invalid
        if (trimmed.length >= 2) {
          return trimmed;
        }
      }
    }
    
    // Debug: Log when no PGN is found
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[UnifiedVisionExperience] No valid PGN found from sources:', {
        propPgn: typeof pgn === 'string' ? `${pgn?.slice(0, 50)}...` : typeof pgn,
        localPgn: typeof localGameData?.pgn === 'string' ? `${localGameData?.pgn?.slice(0, 50)}...` : typeof localGameData?.pgn,
        gameDataPgn: typeof gameData?.pgn === 'string' ? `${gameData?.pgn?.slice(0, 50)}...` : typeof gameData?.pgn,
      });
    }
    
    return '';
  }, [pgn, localGameData?.pgn, gameData?.pgn]);
  
  // Extract moves from PGN when gameData.moves is empty - ensures timeline analysis works
  const effectiveMoves = useMemo((): string[] => {
    // First try existing moves array
    const existingMoves = localGameData?.moves || gameData?.moves;
    if (existingMoves && existingMoves.length > 0) {
      return existingMoves;
    }
    
    // If no moves array, extract from PGN
    if (!effectivePgn) return [];
    
    try {
      const chess = new Chess();
      chess.loadPgn(effectivePgn);
      return chess.history();
    } catch {
      // Try manual extraction
      try {
        const chess = new Chess();
        const movesSection = effectivePgn.replace(/\[[^\]]*\]/g, '').trim();
        const moveTokens = movesSection
          .replace(/\{[^}]*\}/g, '')
          .replace(/\([^)]*\)/g, '')
          .replace(/\$\d+/g, '')
          .replace(/1-0|0-1|1\/2-1\/2|\*/g, '')
          .split(/\s+/)
          .filter(token => token && !token.match(/^\d+\.+$/) && token !== '...');
        
        const parsedMoves: string[] = [];
        for (const token of moveTokens) {
          try {
            const fixedMove = token
              .replace(/0-0-0/gi, 'O-O-O')
              .replace(/0-0/gi, 'O-O')
              .replace(/[+#!?]+$/, '');
            const result = chess.move(fixedMove);
            if (result) parsedMoves.push(result.san);
          } catch {}
        }
        return parsedMoves;
      } catch {
        return [];
      }
    }
  }, [localGameData?.moves, gameData?.moves, effectivePgn]);
  
  // Seamless palette switch handler - updates board in-place AND updates URL
  const handleSeamlessPaletteSwitch = useCallback(async (info: PaletteAvailabilityInfo) => {
    if (!effectivePgn) return;
    
    setIsSwitchingPalette(true);
    
    try {
      // Set new palette globally
      setActivePalette(info.paletteId);
      setLocalPaletteId(info.paletteId);
      
      // Update URL to reflect current palette (without navigation/reload)
      const gameHash = generateGameHash(effectivePgn);
      const newUrl = new URL(window.location.href);
      newUrl.pathname = `/g/${gameHash}`;
      
      // Set palette in URL if not default
      if (info.paletteId && info.paletteId !== 'modern') {
        newUrl.searchParams.set('p', info.paletteId);
      } else {
        newUrl.searchParams.delete('p');
      }
      
      // Preserve source context params
      const currentParams = new URLSearchParams(window.location.search);
      if (currentParams.has('src')) {
        newUrl.searchParams.set('src', currentParams.get('src')!);
      }
      if (currentParams.has('listing')) {
        newUrl.searchParams.set('listing', currentParams.get('listing')!);
      }
      
      // Update browser URL without reload
      window.history.replaceState({}, '', newUrl.toString());
      
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
        const simResult = simulateGame(effectivePgn);
        
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
  }, [effectivePgn, user?.id, onPaletteChange]);
  
  // Calculate responsive board size - maximize screen utilization
  // Ensures timeline + board + legend all fit within viewport without cutoffs
  useEffect(() => {
    const updateSize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Fixed sidebar widths - must match the layout
      const timelineWidth = 160; // Timeline container width
      const legendWidth = 240; // Legend container width
      const gaps = 24; // Gap between elements
      const pagePadding = 32; // Page padding
      
      const isXlScreen = windowWidth >= 1280;
      const isLgScreen = windowWidth >= 1024;
      
      // Calculate available width for the board
      let availableWidth: number;
      if (isXlScreen && showLegend) {
        // Full layout: timeline + board + legend
        availableWidth = windowWidth - timelineWidth - legendWidth - gaps - pagePadding;
      } else if (isXlScreen) {
        // No legend, just timeline
        availableWidth = windowWidth - timelineWidth - gaps - pagePadding;
      } else if (isLgScreen) {
        availableWidth = windowWidth - pagePadding;
      } else {
        availableWidth = windowWidth - 32;
      }
      
      // Height constraints
      const headerSpace = 180; // Header + tabs + controls
      const infoSpace = 120; // Bottom content
      const availableHeight = windowHeight - headerSpace - infoSpace;
      
      // Board size should fit both width and height
      const maxBoardFromWidth = Math.max(300, availableWidth);
      const maxBoardFromHeight = Math.max(300, availableHeight);
      
      const optimalSize = Math.min(maxBoardFromWidth, maxBoardFromHeight);
      
      // Board size limits - cap at 580px to leave room for sidebars
      const minSize = 300;
      const maxSize = isXlScreen ? 580 : 520;
      setBoardSize(Math.max(minSize, Math.min(optimalSize, maxSize)));
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [showLegend]);

  // Load vision score (skip if already provided via props)
  useEffect(() => {
    if (visualizationId && !visionScoreData) {
      setIsLoadingScore(true);
      getVisionScore(visualizationId)
        .then(score => setVisionScore(score))
        .finally(() => setIsLoadingScore(false));
    }
  }, [visualizationId, visionScoreData]);


  // Analyze game - use effectivePgn for consistency
  // This runs for ALL contexts when valid PGN is available
  useEffect(() => {
    if (!effectivePgn) {
      console.log('[UnifiedVisionExperience] No PGN available for analysis');
      setGameAnalysis(null);
      return;
    }
    
    const trimmedPgn = effectivePgn.trim();
    if (!trimmedPgn) {
      setGameAnalysis(null);
      return;
    }
    
    console.log('[UnifiedVisionExperience] Analyzing game, PGN length:', trimmedPgn.length, 'moves:', effectiveMoves.length);
    
    try {
      const analysis = analyzeGame(trimmedPgn);
      console.log('[UnifiedVisionExperience] Analysis result:', {
        opening: analysis?.opening?.name,
        tacticsCount: analysis?.tactics?.length,
        specialMoves: analysis?.specialMoves?.length,
        summary: analysis?.summary?.complexity
      });
      setGameAnalysis(analysis);
    } catch (e) {
      console.error('[UnifiedVisionExperience] Failed to analyze game:', e);
      setGameAnalysis(null);
    }
  }, [effectivePgn, effectiveMoves.length]);

  // Detect game card match from PGN
  useEffect(() => {
    if (effectivePgn) {
      const match = detectGameCard(effectivePgn);
      setGameCardMatch(match);
    }
  }, [effectivePgn]);

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

  // All contexts now share unified action buttons
  // No more context-specific flags needed

  // Transform locked pieces from initialState format to provider format
  const initialLockedPieces = useMemo((): HighlightedPiece[] | undefined => {
    if (!initialState?.locked?.length) return undefined;
    return initialState.locked.map(l => ({
      pieceType: l.type as PieceType,
      pieceColor: l.color as PieceColor,
    }));
  }, [initialState?.locked]);

  return (
    <TimelineProvider 
      initialMove={initialMove} 
      initialPhase={initialState?.phase as GamePhase | undefined}
    >
      <LegendHighlightProvider
        initialLockedPieces={initialLockedPieces}
        initialCompareMode={initialState?.compare}
      >
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
                  showPieces={showPieces}
                  pieceOpacity={pieceOpacity}
                  pgn={effectivePgn}
                />
              </div>

              {/* Fullscreen keyboard hint */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                Press <kbd className="px-1.5 py-0.5 bg-background rounded border text-foreground">Esc</kbd> or <kbd className="px-1.5 py-0.5 bg-background rounded border text-foreground">F</kbd> to exit
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col w-full max-w-full" ref={containerRef}>
          {/* Header with back button, header actions, and dark mode toggle - Available for ALL contexts */}
          {(onBack || headerActions) && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 pb-3 border-b border-border/50">
              <div className="flex items-center justify-between flex-1">
                {onBack ? (
                  <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    {backButtonText || 'Return'}
                  </Button>
                ) : <div />}
                
                {/* Dark mode toggle - Always available for print paper selection */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Print Paper:</span>
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
              </div>
              
              {/* Custom header actions (e.g., price badges, purchase buttons) */}
              {headerActions && (
                <div className="flex-shrink-0">
                  {headerActions}
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

            <TabsContent value="experience" className="mt-0 w-full">
              <div className="w-full">
                <div className="space-y-4 w-full pb-4">
                  {/* Board Controls + Quick Actions Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    {/* Left: View controls */}
                    <div className="flex flex-wrap items-center gap-3">
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
                    
                    {/* Right: Quick export actions - prominently visible */}
                    {onExport && (
                      <>
                        <div className="hidden sm:block h-4 w-px bg-border mx-1" />
                        <div className="flex items-center gap-2 sm:ml-auto">
                          <ExportActionButtons
                            onExport={onExport}
                            isPremium={isPremium}
                            darkMode={darkMode}
                            totalMoves={localTotalMoves}
                            showPieces={showPieces}
                            pieceOpacity={pieceOpacity}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Deep Analysis Teaser - Link to Analytics Tab */}
                  {gameAnalysis && (
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="w-full p-3 rounded-lg bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-cyan-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                          <BookOpen className="h-4 w-4 text-purple-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm text-foreground">Deep Analysis Available</p>
                          <p className="text-xs text-muted-foreground">
                            {gameAnalysis.opening ? `${gameAnalysis.opening.name}` : 'Opening detection'} 
                            {gameAnalysis.tactics.length > 0 && ` • ${gameAnalysis.tactics.length} tactics`}
                            {gameAnalysis.gambit && ` • Gambit detected`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-purple-400 group-hover:text-purple-300">
                        <span>View in Analytics</span>
                        <BarChart3 className="h-4 w-4" />
                      </div>
                    </button>
                  )}

                  {/* Main Layout: Timeline Left | Board Center | Legend Right */}
                  <div className="flex gap-2 xl:gap-3 items-start justify-center w-full">
                    {/* Left: Vertical Timeline - full width */}
                    <div className="hidden xl:flex flex-shrink-0" style={{ minWidth: '160px', width: '160px' }}>
                      <VerticalTimelineSlider 
                        totalMoves={localTotalMoves} 
                        moves={effectiveMoves}
                        pgn={effectivePgn}
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
                        showPieces={showPieces}
                        pieceOpacity={pieceOpacity}
                        pgn={effectivePgn}
                      />
                    </div>

                    {/* Right: Color Legend - full width */}
                    {showLegend && (
                      <div className="hidden xl:flex flex-col flex-shrink-0" style={{ minWidth: '240px', width: '240px', maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
                        <ColorLegend 
                          interactive={true}
                          board={localBoard}
                          gameContext={{
                            whiteName: localGameData.white,
                            blackName: localGameData.black,
                            event: localGameData.event,
                            result: localGameData.result,
                            opening: gameAnalysis?.opening?.name,
                            totalMoves: totalMoves,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Mobile/Tablet Timeline Controls (shown on smaller screens) */}
                  <div className="xl:hidden">
                    <TimelineControls 
                      totalMoves={localTotalMoves} 
                      moves={effectiveMoves}
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

                  {/* Palette Availability - Seamless switching - Available for ALL contexts */}
                  {effectivePgn && (
                    <PaletteAvailabilityIndicator
                      pgn={effectivePgn}
                      currentUserId={user?.id}
                      currentPaletteId={currentPaletteInfo?.id}
                      context={context}
                      compact={false}
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

                  {/* Action Buttons - Unified for all contexts */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border/30">
                    {/* Export Buttons - Single unified rendering for all contexts */}
                    {onExport && (
                      <ExportActionButtons
                        onExport={onExport}
                        isPremium={isPremium}
                        darkMode={darkMode}
                        totalMoves={localTotalMoves}
                        showPieces={showPieces}
                        pieceOpacity={pieceOpacity}
                      />
                    )}

                    {/* Save to Gallery - Show for generator/postgame contexts */}
                    {onSaveToGallery && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              onClick={async () => {
                                const id = await onSaveToGallery();
                                if (id) {
                                  setLocalVisualizationId(id);
                                  setLocalIsOwner(true);
                                }
                              }}
                            >
                              <Crown className="h-4 w-4 text-primary" />
                              Save to Gallery
                              {!isPremium && <Crown className="h-3 w-3 text-primary" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isPremium ? 'Save to your vision gallery' : 'Premium: Save to your vision gallery'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {/* List for Sale - Show for owners who haven't listed */}
                    {localIsOwner && !localIsListed && onListForSale && (
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
                    
                    {/* Listed Badge */}
                    {localIsListed && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        Listed on Marketplace
                      </Badge>
                    )}

                    {/* Claim Vision Button - Show for non-owners in marketplace/shared contexts */}
                    {!localIsOwner && (context === 'marketplace' || context === 'shared' || context === 'gallery') && (
                      <ClaimVisionButton
                        pgn={effectivePgn}
                        gameData={localGameData}
                        paletteId={localPaletteId as PaletteId}
                        visualizationId={localVisualizationId}
                        isOwner={localIsOwner}
                        isPremium={isPremium}
                        onClaim={onSaveToGallery}
                        onUpgradePrompt={onUpgradePrompt}
                        compact
                      />
                    )}

                    {/* Transfer to Creative Mode - Available in multiple contexts */}
                    {onTransferToCreative && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              onClick={handleTransferToCreative}
                            >
                              <Wand2 className="h-4 w-4" />
                              Edit in Creative
                              {!isPremium && <Crown className="h-3 w-3 text-primary" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isPremium ? 'Open in Creative Mode studio' : 'Premium: Edit in Creative Mode'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    {/* Share button - Captures current visual state */}
                    {onShare && (
                      <ShareButtonWithState 
                        onShare={onShare}
                        darkMode={darkMode}
                        showPieces={showPieces}
                        pieceOpacity={pieceOpacity}
                        totalMoves={localTotalMoves}
                      />
                    )}
                  </div>

                  {/* Mini Print Order Section - Use local state for consistency */}
                  {onExport && (
                    <MiniPrintOrderSection
                      board={localBoard}
                      gameData={localGameData}
                      totalMoves={localTotalMoves}
                      darkMode={darkMode}
                      showPieces={showPieces}
                      pieceOpacity={pieceOpacity}
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
              <div className="pb-4">
                {/* Palette Ownership Card - Shows who owns which colorways */}
                {effectivePgn && (
                  <div className="mb-6">
                    <PaletteOwnershipCard
                      pgn={effectivePgn}
                      currentPaletteId={localPaletteId}
                      onPaletteSelect={handleSeamlessPaletteSwitch}
                      compact={false}
                    />
                  </div>
                )}
                {/* Royalty Earnings/Potential Card - Show for all contexts when vision score exists */}
                {visionScore && (
                  <div className="mb-6">
                    {localIsOwner ? (
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

                {/* Transfer History - Show for all contexts when visualization exists */}
                {localVisualizationId && (
                  <div className="mb-6">
                    <TransferHistoryCard visualizationId={localVisualizationId} />
                  </div>
                )}

                {/* Transfer Limit Badge - Show for all contexts when visualization exists */}
                {localVisualizationId && (
                  <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-sm text-muted-foreground">Transfer availability:</span>
                    <TransferLimitBadge visualizationId={localVisualizationId} />
                  </div>
                )}

                <AnalyticsPanel
                  visionScore={visionScore}
                  isLoading={isLoadingScore}
                  gameData={localGameData}
                  totalMoves={localTotalMoves}
                  createdAt={createdAt}
                  gameAnalysis={gameAnalysis}
                  pgn={effectivePgn}
                />

                {/* Marketplace Info - Show for all contexts when listed */}
                {localIsListed && (
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

                {/* Purchase Button - Show for all contexts when purchase is available */}
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
                      ) : localPurchasePrice === 0 ? (
                        <>Claim for Free</>
                      ) : (
                        <>Purchase for ${((localPurchasePrice || 0) / 100).toFixed(2)}</>
                      )}
                    </Button>
                  </div>
                )}

                {/* List for Sale button - Show for all contexts when owner and not listed */}
                {localIsOwner && !localIsListed && onListForSale && (
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
              </div>
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
