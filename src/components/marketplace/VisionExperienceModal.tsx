import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Crown,
  DollarSign,
  Gift,
  Eye,
  Download,
  Printer,
  TrendingUp,
  Calendar,
  User,
  Swords,
  Trophy,
  Share2,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Users,
  FileImage,
  Film,
  ArrowRightLeft,
  Sun,
  Moon,
  Bookmark,
  Sparkles,
  BarChart3,
  Palette,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Info,
  BookOpen,
  Zap,
} from 'lucide-react';
import { CertifiedBadge } from '@/components/chess/CertifiedBadge';
import { ShowPiecesToggle } from '@/components/chess/ShowPiecesToggle';
import { MarketplaceListing } from '@/lib/marketplace/marketplaceApi';
import { isPremiumPalette, getPaletteArt, getPaletteDisplayName, extractPaletteId } from '@/lib/marketplace/paletteArtMap';
import { VisionScore, getVisionScore, calculateVisionValue, calculateMembershipMultiplier, SCORING_WEIGHTS, recordVisionInteraction } from '@/lib/visualizations/visionScoring';
import { analyzeGame, GameAnalysis } from '@/lib/chess/chessAnalysis';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { SimulationResult, SquareData, GameData } from '@/lib/chess/gameSimulator';
import InteractiveVisualizationBoard from '@/components/chess/InteractiveVisualizationBoard';
import { EnhancedLegend } from '@/components/chess/EnhancedLegend';
import GameInfoDisplay from '@/components/chess/GameInfoDisplay';
import { TimelineProvider, useTimeline } from '@/contexts/TimelineContext';
import { LegendHighlightProvider } from '@/contexts/LegendHighlightContext';
import { setActivePalette, PaletteId, getActivePalette } from '@/lib/chess/pieceColors';
import { gameImageImports } from '@/lib/chess/gameImages';

interface VisionExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: MarketplaceListing | null;
  onPurchase: (listing: MarketplaceListing) => void;
  isPurchasing: boolean;
  isOwnListing: boolean;
  isPremium: boolean;
}

interface ExtendedGameData {
  white?: string;
  black?: string;
  event?: string;
  date?: string;
  result?: string;
  pgn?: string;
  moves?: string[];
  totalMoves?: number;
  board?: SquareData[][];
  visualizationState?: {
    paletteId?: string;
    darkMode?: boolean;
    currentMove?: number;
  };
}

// Timeline-aware board component
const TimelineBoard: React.FC<{
  board: SquareData[][];
  totalMoves: number;
  size: number;
  darkMode: boolean;
}> = ({ board, totalMoves, size, darkMode }) => {
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

// Timeline controls component
const TimelineControls: React.FC<{
  totalMoves: number;
  isPlaying: boolean;
  onPlayToggle: () => void;
}> = ({ totalMoves, isPlaying, onPlayToggle }) => {
  const { currentMove, setCurrentMove } = useTimeline();
  const progress = totalMoves > 0 ? (currentMove / totalMoves) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Move {currentMove}</span>
        <span>{totalMoves} total</span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="flex items-center justify-center gap-2">
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
          <ChevronDown className="h-4 w-4 rotate-90" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 border-primary/50"
          onClick={onPlayToggle}
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
          <ChevronUp className="h-4 w-4 rotate-90" />
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
    </div>
  );
};

const VisionExperienceModal: React.FC<VisionExperienceModalProps> = ({
  isOpen,
  onClose,
  listing,
  onPurchase,
  isPurchasing,
  isOwnListing,
  isPremium,
}) => {
  const [activeTab, setActiveTab] = useState<'experience' | 'analytics'>('analytics'); // Default to analytics for marketplace
  const [visionScore, setVisionScore] = useState<VisionScore | null>(null);
  const [estimatedValue, setEstimatedValue] = useState<number>(0);
  const [showFullPgn, setShowFullPgn] = useState(false);
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [internalMove, setInternalMove] = useState(0);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const viewRecordedRef = useRef(false);
  const [gameAnalysis, setGameAnalysis] = useState<GameAnalysis | null>(null);

  // Analyze game when listing changes
  useEffect(() => {
    if (listing?.visualization?.game_data && isOpen) {
      const gameData = listing.visualization.game_data as ExtendedGameData;
      if (gameData?.pgn) {
        try {
          const analysis = analyzeGame(gameData.pgn);
          setGameAnalysis(analysis);
        } catch {
          setGameAnalysis(null);
        }
      }
    }
    if (!isOpen) {
      setGameAnalysis(null);
    }
  }, [listing?.visualization?.game_data, isOpen]);

  useEffect(() => {
    if (listing?.visualization?.id && isOpen) {
      loadVisionScore(listing.visualization.id);
      
      // Record view interaction (only once per session)
      if (!viewRecordedRef.current) {
        viewRecordedRef.current = true;
        recordVisionInteraction(listing.visualization.id, 'view');
      }
    }
    
    // Reset when modal closes
    if (!isOpen) {
      viewRecordedRef.current = false;
      setActiveTab('analytics'); // Reset to analytics (default for marketplace)
      setIsPlaying(false);
      setInternalMove(0);
    }
  }, [listing?.visualization?.id, isOpen]);

  // Restore palette from visualization
  useEffect(() => {
    if (isOpen && listing?.visualization) {
      const gameData = listing.visualization.game_data as ExtendedGameData;
      const paletteId = gameData?.visualizationState?.paletteId;
      if (paletteId && paletteId !== 'custom') {
        setActivePalette(paletteId as PaletteId);
      }
      if (gameData?.visualizationState?.darkMode !== undefined) {
        setDarkMode(gameData.visualizationState.darkMode);
      }
    }
  }, [isOpen, listing]);

  // Auto-play logic
  useEffect(() => {
    if (isPlaying) {
      const gameData = listing?.visualization?.game_data as ExtendedGameData;
      const totalMoves = gameData?.totalMoves || gameData?.moves?.length || 0;
      
      playIntervalRef.current = setInterval(() => {
        setInternalMove(prev => {
          if (prev >= totalMoves) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 150);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, listing]);

  const loadVisionScore = async (visualizationId: string) => {
    setIsLoadingScore(true);
    const score = await getVisionScore(visualizationId);
    setVisionScore(score);
    
    if (score) {
      const multiplier = calculateMembershipMultiplier(100);
      setEstimatedValue(calculateVisionValue(score, multiplier));
    }
    setIsLoadingScore(false);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/v/${listing?.visualization?.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.visualization?.title || 'Chess Visualization',
          text: 'Check out this unique chess visualization on En Pensent!',
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Link copied to clipboard');
        }
      }
    } else {
    await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    }
  };

  // Debug logging for modal click
  useEffect(() => {
    console.log('[VisionExperienceModal] Props changed - isOpen:', isOpen, 'listing:', listing?.id);
    if (isOpen) {
      console.log('[VisionExperienceModal] Modal opened with listing:', listing?.id);
      console.log('[VisionExperienceModal] Game data:', listing?.visualization?.game_data);
    }
  }, [isOpen, listing]);

  // Always render the Dialog to allow proper open/close animations
  // Only process game data when we have a listing
  const gameData = listing?.visualization?.game_data as ExtendedGameData | undefined;
  const isGenesis = listing?.visualization?.title?.includes('Exemplar') ?? false;
  const isFree = (listing?.price_cents ?? 0) === 0;
  const totalMoves = gameData?.totalMoves || gameData?.moves?.length || 0;
  const paletteId = listing ? (extractPaletteId(listing.visualization?.game_data as Record<string, unknown>) || 'modern') : 'modern';
  const hasPremiumPalette = isPremiumPalette(paletteId);
  const paletteArt = getPaletteArt(paletteId);
  const paletteDisplayName = getPaletteDisplayName(paletteId);
  const isCertifiedPalette = paletteId && paletteId !== 'custom';
  const isCertifiedGame = listing?.visualization?.title?.includes('Immortal') || 
                          listing?.visualization?.title?.includes('Game of the Century') ||
                          listing?.visualization?.title?.includes('Deep Blue');
  
  // Get a random game image for background if no palette art - memoized index
  const gameImageKeys = useMemo(() => Object.keys(gameImageImports), []);
  const randomImageIndex = useMemo(() => Math.floor(Math.random() * gameImageKeys.length), [gameImageKeys.length]);
  const randomGameImage = gameImageImports[gameImageKeys[randomImageIndex]];
  const backgroundArt = paletteArt || randomGameImage;

  // Reconstruct board data
  const board: SquareData[][] = gameData?.board || 
    Array(8).fill(null).map((_, rank) =>
      Array(8).fill(null).map((_, file) => ({
        file,
        rank,
        visits: [],
        isLight: (file + rank) % 2 === 1,
      }))
    );

  const formatResult = (result?: string) => {
    if (!result) return 'Unknown';
    if (result === '1-0') return 'White wins';
    if (result === '0-1') return 'Black wins';
    if (result === '1/2-1/2') return 'Draw';
    return result;
  };

  console.log('[VisionExperienceModal] Rendering - isOpen:', isOpen, 'listing:', listing?.id);

  const handleOpenChange = useCallback((open: boolean) => {
    console.log('[VisionExperienceModal] onOpenChange called with:', open);
    if (!open) onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className={`max-w-6xl max-h-[95vh] overflow-hidden p-0 gap-0 relative ${
          hasPremiumPalette && listing
            ? 'ring-2 ring-amber-500/50 shadow-2xl shadow-amber-500/20' 
            : ''
        }`}
      >
        {!listing ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
        {/* Premium palette background art with shimmer */}
        {hasPremiumPalette && backgroundArt && (
          <>
            <div 
              className="absolute inset-0 z-0 opacity-[0.12] pointer-events-none"
              style={{
                backgroundImage: `url(${backgroundArt})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(1px)',
              }}
            />
            {/* Gold shimmer overlay */}
            <div 
              className="absolute inset-0 z-[1] pointer-events-none opacity-30"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, rgba(251, 191, 36, 0.08) 25%, rgba(251, 191, 36, 0.15) 50%, rgba(251, 191, 36, 0.08) 75%, transparent 100%)',
                backgroundSize: '200% 200%',
                animation: 'shimmer 3s ease-in-out infinite',
              }}
            />
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 z-[2] bg-background/85 pointer-events-none" />
          </>
        )}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col relative z-10"
          >
            {/* Header with transitional tabs */}
            <div className={`p-4 border-b ${
              hasPremiumPalette 
                ? 'bg-gradient-to-r from-amber-950/30 via-background/80 to-amber-950/30 border-amber-500/20' 
                : 'bg-gradient-to-r from-background via-muted/30 to-background'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Premium Palette Badge */}
                  {hasPremiumPalette && (
                    <Badge 
                      className="bg-gradient-to-r from-amber-500 to-orange-500 text-black gap-1 shadow-lg shadow-amber-500/30"
                    >
                      <Palette className="h-3 w-3" />
                      {paletteDisplayName || 'Premium Palette'}
                    </Badge>
                  )}
                  {isGenesis && <CertifiedBadge type="genesis" />}
                  {isCertifiedGame && !isGenesis && (
                    <CertifiedBadge 
                      type="game" 
                      name={listing.visualization?.title}
                      similarity={95}
                      matchType="exact"
                    />
                  )}
                  {isCertifiedPalette && !isGenesis && !isCertifiedGame && !hasPremiumPalette && (
                    <CertifiedBadge 
                      type="palette" 
                      name={paletteId}
                      similarity={100}
                      matchType="exact"
                    />
                  )}
                  <h2 className="text-xl font-display font-bold truncate max-w-md">
                    {listing.visualization?.title || 'Untitled Vision'}
                  </h2>
                  <Badge variant="outline" className="hidden sm:flex">
                    {totalMoves} moves
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    className={`text-sm px-3 py-1 ${
                      isFree 
                        ? 'bg-green-500/90 hover:bg-green-500' 
                        : 'bg-primary/90 hover:bg-primary'
                    }`}
                  >
                    {isFree ? (
                      <><Gift className="h-3 w-3 mr-1" /> Free</>
                    ) : (
                      <><DollarSign className="h-3 w-3" />{(listing.price_cents / 100).toFixed(2)}</>
                    )}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Addictive Tab Transition */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'experience' | 'analytics')}>
                <TabsList className="w-full grid grid-cols-2 bg-muted/50 p-1">
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
              </Tabs>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'experience' ? (
                  <motion.div
                    key="experience"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <TimelineProvider>
                      <LegendHighlightProvider>
                        <ExperienceTab 
                          listing={listing}
                          board={board}
                          totalMoves={totalMoves}
                          gameData={gameData}
                          darkMode={darkMode}
                          setDarkMode={setDarkMode}
                          showLegend={showLegend}
                          setShowLegend={setShowLegend}
                          isPlaying={isPlaying}
                          setIsPlaying={setIsPlaying}
                          onPurchase={onPurchase}
                          isPurchasing={isPurchasing}
                          isOwnListing={isOwnListing}
                          isPremium={isPremium}
                          isFree={isFree}
                          handleShare={handleShare}
                        />
                      </LegendHighlightProvider>
                    </TimelineProvider>
                  </motion.div>
                ) : (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <AnalyticsTab 
                      listing={listing}
                      gameData={gameData}
                      visionScore={visionScore}
                      estimatedValue={estimatedValue}
                      isLoadingScore={isLoadingScore}
                      showFullPgn={showFullPgn}
                      setShowFullPgn={setShowFullPgn}
                      paletteId={paletteId}
                      onPurchase={onPurchase}
                      isPurchasing={isPurchasing}
                      isOwnListing={isOwnListing}
                      isPremium={isPremium}
                      isFree={isFree}
                      handleShare={handleShare}
                      formatResult={formatResult}
                      gameAnalysis={gameAnalysis}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Experience Tab Component
const ExperienceTab: React.FC<{
  listing: MarketplaceListing;
  board: SquareData[][];
  totalMoves: number;
  gameData: ExtendedGameData | undefined;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  showLegend: boolean;
  setShowLegend: (v: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  onPurchase: (listing: MarketplaceListing) => void;
  isPurchasing: boolean;
  isOwnListing: boolean;
  isPremium: boolean;
  isFree: boolean;
  handleShare: () => void;
}> = ({
  listing,
  board,
  totalMoves,
  gameData,
  darkMode,
  setDarkMode,
  showLegend,
  setShowLegend,
  isPlaying,
  setIsPlaying,
  onPurchase,
  isPurchasing,
  isOwnListing,
  isPremium,
  isFree,
  handleShare,
}) => {
  const [boardSize, setBoardSize] = useState(320);
  const [showPieces, setShowPieces] = useState(false);
  const [pieceOpacity, setPieceOpacity] = useState(0.7);
  
  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 120, 400);
      setBoardSize(Math.max(260, maxWidth));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <ScrollArea className="h-[calc(85vh-150px)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pr-4">
        {/* Main visualization area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mode controls */}
          <div className="flex justify-center gap-2 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={darkMode ? "outline" : "default"}
                    size="sm"
                    onClick={() => setDarkMode(false)}
                    className="gap-2 text-xs"
                  >
                    <Sun className="h-3 w-3" />
                    Light
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Light background for print-ready look</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={darkMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDarkMode(true)}
                    className="gap-2 text-xs"
                  >
                    <Moon className="h-3 w-3" />
                    Dark
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dark mode for elegant display</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showLegend ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowLegend(!showLegend)}
                    className="gap-2 text-xs"
                  >
                    <Palette className="h-3 w-3" />
                    Legend
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show color legend with piece mapping</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <ShowPiecesToggle
              showPieces={showPieces}
              pieceOpacity={pieceOpacity}
              onToggle={setShowPieces}
              onOpacityChange={setPieceOpacity}
              compact
            />
          </div>

        {/* The artwork */}
        <motion.div 
          className={`mx-auto p-4 sm:p-6 rounded-lg shadow-2xl border transition-colors duration-500 ${
            darkMode 
              ? 'bg-[#0A0A0A] border-stone-800' 
              : 'bg-[#FDFCFB] border-stone-200'
          }`}
          style={{ width: 'fit-content' }}
          layout
        >
          <div className="flex flex-col items-center gap-4">
            <TimelineBoard 
              board={board} 
              totalMoves={totalMoves} 
              size={boardSize}
              darkMode={darkMode}
            />
            
            {/* Game info */}
            <div className={`w-full pt-3 border-t ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
              <GameInfoDisplay 
                gameData={{
                  white: gameData?.white || 'White',
                  black: gameData?.black || 'Black',
                  event: gameData?.event || '',
                  date: gameData?.date || '',
                  result: gameData?.result || '',
                  pgn: gameData?.pgn || '',
                  moves: gameData?.moves || [],
                }}
                title={listing.visualization?.title}
                darkMode={darkMode}
              />
            </div>
            
            {/* Branding */}
            <p 
              className={`text-[10px] tracking-[0.3em] uppercase font-medium ${
                darkMode ? 'text-stone-500' : 'text-stone-400'
              }`}
            >
              ♔ En Pensent ♚
            </p>
          </div>
        </motion.div>

        {/* Timeline controls */}
        <div className="max-w-sm mx-auto">
          <TimelineControls 
            totalMoves={totalMoves}
            isPlaying={isPlaying}
            onPlayToggle={() => setIsPlaying(!isPlaying)}
          />
        </div>
      </div>

      {/* Right sidebar */}
      <div className="space-y-4">
        {/* Legend */}
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="overflow-hidden"
          >
            <EnhancedLegend 
              whitePalette={getActivePalette().white}
              blackPalette={getActivePalette().black}
              compact={false}
              title={getActivePalette().name}
            />
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/30 border">
          <Button
            className="w-full gap-2"
            size="lg"
            variant={isFree ? "default" : "outline"}
            onClick={() => onPurchase(listing)}
            disabled={isPurchasing || isOwnListing}
          >
            {isPurchasing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
            ) : isOwnListing ? (
              'Your Listing'
            ) : isFree ? (
              <><Gift className="h-4 w-4" /> Claim Gift</>
            ) : (
              <><DollarSign className="h-4 w-4" /> Purchase ${(listing.price_cents / 100).toFixed(2)}</>
            )}
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => window.open(`/v/${listing.visualization?.id}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              Full View
            </Button>
          </div>

          {!isPremium && !isOwnListing && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              <Crown className="h-3 w-3 inline mr-1 text-amber-500" />
              Premium required to claim ownership. <span className="opacity-70">Anyone can order prints.</span>
            </p>
          )}
        </div>
      </div>
    </div>
    </ScrollArea>
  );
};

// Analytics Tab Component  
const AnalyticsTab: React.FC<{
  listing: MarketplaceListing;
  gameData: ExtendedGameData | undefined;
  visionScore: VisionScore | null;
  estimatedValue: number;
  isLoadingScore: boolean;
  showFullPgn: boolean;
  setShowFullPgn: (v: boolean) => void;
  paletteId: string;
  onPurchase: (listing: MarketplaceListing) => void;
  isPurchasing: boolean;
  isOwnListing: boolean;
  isPremium: boolean;
  isFree: boolean;
  handleShare: () => void;
  formatResult: (r?: string) => string;
  gameAnalysis: GameAnalysis | null;
}> = ({
  listing,
  gameData,
  visionScore,
  estimatedValue,
  isLoadingScore,
  showFullPgn,
  setShowFullPgn,
  paletteId,
  onPurchase,
  isPurchasing,
  isOwnListing,
  isPremium,
  isFree,
  handleShare,
  formatResult,
  gameAnalysis,
}) => {
  const paletteIdFromState = gameData?.visualizationState?.paletteId || 'modern';
  const isCertifiedPalette = paletteIdFromState && paletteIdFromState !== 'custom';
  
  return (
    <ScrollArea className="h-[calc(85vh-150px)]">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pr-4">
      {/* Left Column - Image and Quick Stats */}
      <div className="space-y-4">
        {/* Vision Image */}
        <motion.div 
          className="relative rounded-lg overflow-hidden bg-muted aspect-square"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {listing.visualization?.image_path ? (
            <img
              src={listing.visualization.image_path}
              alt={listing.visualization.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 gap-2"
            size="lg"
            variant={isFree ? "default" : "outline"}
            onClick={() => onPurchase(listing)}
            disabled={isPurchasing || isOwnListing}
          >
            {isPurchasing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
            ) : isOwnListing ? (
              'Your Listing'
            ) : isFree ? (
              <><Gift className="h-4 w-4" /> Claim Gift</>
            ) : (
              <><DollarSign className="h-4 w-4" /> ${(listing.price_cents / 100).toFixed(2)}</>
            )}
          </Button>
          
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right Column - Details */}
      <div className="space-y-5">
        {/* Seller Info */}
        <motion.div 
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Listed by</p>
            <p className="font-medium">{listing.seller?.display_name || 'Anonymous'}</p>
          </div>
          <Badge variant="outline" className="ml-auto">
            <Calendar className="h-3 w-3 mr-1" />
            {format(new Date(listing.created_at), 'MMM d, yyyy')}
          </Badge>
        </motion.div>

        {/* Game Details */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-semibold flex items-center gap-2">
            <Swords className="h-4 w-4" />
            Game Details
          </h3>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            {gameData?.white && (
              <div className="p-2 rounded bg-muted/50">
                <p className="text-muted-foreground text-xs">White</p>
                <p className="font-medium truncate">{gameData.white}</p>
              </div>
            )}
            {gameData?.black && (
              <div className="p-2 rounded bg-muted/50">
                <p className="text-muted-foreground text-xs">Black</p>
                <p className="font-medium truncate">{gameData.black}</p>
              </div>
            )}
            {gameData?.result && (
              <div className="p-2 rounded bg-muted/50 col-span-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <p className="font-medium">{formatResult(gameData.result)}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Deep Chess Analysis Panel */}
        {gameAnalysis && (
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Deep Analysis
            </h3>
            
            <div className="space-y-3">
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
                        {' '}{tactic.type.replace('_', ' ')} (m{tactic.moveNumber})
                      </Badge>
                    ))}
                    {gameAnalysis.tactics.length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{gameAnalysis.tactics.length - 8} more
                      </Badge>
                    )}
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

              {/* Game Phase Summary */}
              {gameAnalysis.phases.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">
                      <Info className="h-3 w-3 mr-1" />
                      Game Summary
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {gameAnalysis.phases.map((phase, i) => (
                      <div key={i}>
                        <p className="font-bold">{phase.endMove - phase.startMove}</p>
                        <p className="text-muted-foreground capitalize">{phase.name}</p>
                      </div>
                    ))}
                  </div>
                  {/* Key Events from phases */}
                  {gameAnalysis.phases.some(p => p.keyEvents.length > 0) && (
                    <div className="mt-2 pt-2 border-t border-border/30 text-xs">
                      <span className="text-muted-foreground">Key moments: </span>
                      {gameAnalysis.phases.flatMap(p => p.keyEvents).slice(0, 4).map((event, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] py-0 px-1 mr-1">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Game Complexity & Stats */}
              {gameAnalysis.summary && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="bg-primary/10 border-primary/30">
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
          </motion.div>
        )}

        {/* Vision Score Analytics */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Vision Analytics
          </h3>
          
          {isLoadingScore ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : visionScore ? (
            <div className="space-y-3">
              {/* Score Breakdown with animations */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { icon: Eye, value: visionScore.viewCount, label: 'Views', color: 'text-blue-500' },
                  { icon: FileImage, value: visionScore.downloadHdCount, label: 'HD', color: 'text-green-500' },
                  { icon: Film, value: visionScore.downloadGifCount, label: 'GIF', color: 'text-purple-500' },
                  { icon: Printer, value: visionScore.printOrderCount, label: 'Prints', color: 'text-amber-500' },
                ].map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    className="p-2 rounded bg-muted/50"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                  >
                    <stat.icon className={`h-4 w-4 mx-auto ${stat.color} mb-1`} />
                    <p className="text-lg font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Trade Count and Unique Viewers */}
              <div className="grid grid-cols-2 gap-2">
                <motion.div 
                  className="p-2 rounded bg-muted/50 flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <ArrowRightLeft className="h-4 w-4 text-cyan-500" />
                  <div>
                    <p className="font-bold">{visionScore.tradeCount}</p>
                    <p className="text-xs text-muted-foreground">Trades</p>
                  </div>
                </motion.div>
                <motion.div 
                  className="p-2 rounded bg-muted/50 flex items-center gap-2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Users className="h-4 w-4 text-pink-500" />
                  <div>
                    <p className="font-bold">{visionScore.uniqueViewers}</p>
                    <p className="text-xs text-muted-foreground">Unique</p>
                  </div>
                </motion.div>
              </div>

              {/* Total Score & Estimated Value */}
              <motion.div 
                className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-green-500/10 border border-primary/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Vision Score</p>
                    <motion.p 
                      className="text-2xl font-bold text-primary"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, delay: 0.8 }}
                    >
                      {visionScore.totalScore.toFixed(2)}
                    </motion.p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Est. Value</p>
                    <motion.p 
                      className="text-2xl font-bold text-green-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, delay: 0.9 }}
                    >
                      ${estimatedValue.toFixed(2)}
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No analytics yet</p>
            </div>
          )}
        </motion.div>

        {/* Score Formula */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
          <p className="font-medium mb-1">Scoring Formula:</p>
          <p>
            Views ({SCORING_WEIGHTS.view}) • HD ({SCORING_WEIGHTS.download_hd}) • 
            GIF ({SCORING_WEIGHTS.download_gif}) • Trade ({SCORING_WEIGHTS.trade})
          </p>
        </div>

        {/* PGN Toggle */}
        {gameData?.pgn && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={() => setShowFullPgn(!showFullPgn)}
            >
              <span>View PGN</span>
              {showFullPgn ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            <AnimatePresence>
              {showFullPgn && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {gameData.pgn}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {/* Certified badges for analytics */}
        {isCertifiedPalette && (
          <div className="pt-4 border-t border-border/50">
            <CertifiedBadge 
              type="palette" 
              name={paletteIdFromState}
              similarity={100}
              matchType="exact"
            />
          </div>
        )}
      </div>
    </div>
    </ScrollArea>
  );
};

export default VisionExperienceModal;
