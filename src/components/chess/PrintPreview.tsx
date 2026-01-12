import React, { useRef, useEffect, useState, useMemo } from 'react';
import html2canvas from 'html2canvas';
import GIF from 'gif.js';
import ChessBoardVisualization from './ChessBoardVisualization';
import InteractiveVisualizationBoard from './InteractiveVisualizationBoard';
import { EnhancedLegend } from './EnhancedLegend';
import GameInfoDisplay from './GameInfoDisplay';
import VerticalTimelineSlider from './VerticalTimelineSlider';
import TimelineSlider from './TimelineSlider';
import { SimulationResult, SquareData } from '@/lib/chess/gameSimulator';
import { getActivePalette, PaletteId } from '@/lib/chess/pieceColors';
import { Button } from '@/components/ui/button';
import { OrderPrintButton } from '@/components/shop/OrderPrintButton';
import { Download, Loader2, Sun, Moon, Crown, Bookmark, Check, Film, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';
import { useAuth } from '@/hooks/useAuth';
import { PremiumUpgradeModal } from '@/components/premium';
import AuthModal from '@/components/auth/AuthModal';
import { saveVisualization, checkDuplicateVisualization, VisualizationState, DuplicateCheckResult } from '@/lib/visualizations/visualizationStorage';
import { PaletteColors } from '@/lib/visualizations/similarityDetection';
import { useTimeline } from '@/contexts/TimelineContext';
import { Progress } from '@/components/ui/progress';
import { useLegendHighlight } from '@/contexts/LegendHighlightContext';
import ColorComparisonPreview from './ColorComparisonPreview';
import IntrinsicPaletteCard from './IntrinsicPaletteCard';
import { recordVisionInteraction } from '@/lib/visualizations/visionScoring';

interface PrintPreviewProps {
  simulation: SimulationResult;
  pgn?: string;
  title?: string;
  onShareIdCreated?: (shareId: string) => void;
  visualizationId?: string; // For tracking downloads on existing visualizations
}

// Filter board to show only moves up to a certain point
function filterBoardToMove(board: SquareData[][], moveNumber: number): SquareData[][] {
  return board.map(rank =>
    rank.map(square => ({
      ...square,
      visits: square.visits.filter(visit => visit.moveNumber <= moveNumber)
    }))
  );
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ simulation, pgn, title, onShareIdCreated, visualizationId }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const gifBoardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [existsInGallery, setExistsInGallery] = useState(false);
  const [isTooSimilar, setIsTooSimilar] = useState(false);
  const [colorSimilarity, setColorSimilarity] = useState<number | undefined>();
  const [isOwnedByCurrentUser, setIsOwnedByCurrentUser] = useState(false);
  const [ownerDisplayName, setOwnerDisplayName] = useState<string | undefined>();
  const [similarityReason, setSimilarityReason] = useState<string | undefined>();
  const [existingColors, setExistingColors] = useState<PaletteColors | undefined>();
  const [currentColors, setCurrentColors] = useState<PaletteColors | undefined>();
  const [isIntrinsicPalette, setIsIntrinsicPalette] = useState(false);
  const [isIntrinsicGame, setIsIntrinsicGame] = useState(false);
  const [matchedPaletteId, setMatchedPaletteId] = useState<PaletteId | undefined>();
  const [matchedPaletteSimilarity, setMatchedPaletteSimilarity] = useState<number | undefined>();
  const [matchedGameCard, setMatchedGameCard] = useState<{ id: string; title: string; similarity?: number; matchType?: 'exact' | 'partial' | 'none' } | undefined>();
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [boardSize, setBoardSize] = useState(320);
  const [darkMode, setDarkMode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumModalTrigger, setPremiumModalTrigger] = useState<'download' | 'save' | 'gif'>('download');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const [gifPreviewMove, setGifPreviewMove] = useState<number | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  
  const { isPremium, user } = useAuth();

  // Get locked pieces from legend context if available
  let lockedPieces: Array<{ pieceType: string; pieceColor: string }> = [];
  let compareMode = false;
  try {
    const legendContext = useLegendHighlight();
    lockedPieces = legendContext.lockedPieces;
    compareMode = legendContext.compareMode;
  } catch {
    // Legend context not available
  }

  // Timeline context for filtering board by move
  let timelineBoard: SquareData[][] = simulation.board;
  let currentMove = Infinity;
  try {
    const timeline = useTimeline();
    currentMove = timeline.currentMove;
    
    // Filter board based on current timeline position
    if (currentMove !== Infinity && currentMove < simulation.totalMoves) {
      timelineBoard = simulation.board.map(rank => 
        rank.map(square => ({
          ...square,
          visits: square.visits.filter(visit => visit.moveNumber <= currentMove)
        }))
      );
    }
  } catch {
    // Timeline context not available
  }

  // Capture current state for Order Print button
  const capturedState = useMemo(() => ({
    currentMove,
    selectedPhase: 'all',
    lockedPieces,
    compareMode,
    displayMode: 'standard',
    darkMode,
    showTerritory: false,
    showHeatmaps: false,
    capturedAt: new Date(),
  }), [currentMove, lockedPieces, compareMode, darkMode]);

  // Board for GIF generation (separate from main display)
  const gifBoard = gifPreviewMove !== null 
    ? filterBoardToMove(simulation.board, gifPreviewMove) 
    : timelineBoard;
  
  // Generate QR code on mount
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL('https://enpensent.com', {
          width: 100,
          margin: 1,
          color: {
            dark: '#1A1A1A',
            light: 'transparent',
          },
          errorCorrectionLevel: 'M',
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error('QR generation failed:', err);
      }
    };
    generateQR();
  }, []);
  
  // Calculate appropriate board size based on container
  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 80, 450);
      setBoardSize(Math.max(280, maxWidth));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Reset saved state when simulation changes
  useEffect(() => {
    setIsSaved(false);
    setExistsInGallery(false);
    setIsTooSimilar(false);
    setColorSimilarity(undefined);
    setIsOwnedByCurrentUser(false);
    setOwnerDisplayName(undefined);
    setSimilarityReason(undefined);
    setExistingColors(undefined);
    setCurrentColors(undefined);
    setIsIntrinsicPalette(false);
    setIsIntrinsicGame(false);
    setMatchedPaletteId(undefined);
    setMatchedPaletteSimilarity(undefined);
    setMatchedGameCard(undefined);
  }, [simulation]);

  // Check if current visualization already exists or is too similar in gallery (globally)
  useEffect(() => {
    const checkIfExists = async () => {
      // Check for intrinsic game for all users (even free users)
      const { findMatchingFamousGame } = await import('@/lib/visualizations/similarityDetection');
      const gameMatch = findMatchingFamousGame(pgn, simulation.gameData);
      
      if (gameMatch) {
        setIsIntrinsicGame(true);
        setMatchedGameCard({
          id: gameMatch.id,
          title: gameMatch.title,
          similarity: gameMatch.similarity,
          matchType: gameMatch.matchType,
        });
      } else {
        setIsIntrinsicGame(false);
        setMatchedGameCard(undefined);
      }
      
      if (!user || !isPremium) {
        setExistsInGallery(false);
        setIsTooSimilar(false);
        setColorSimilarity(undefined);
        setIsOwnedByCurrentUser(false);
        setOwnerDisplayName(undefined);
        setSimilarityReason(undefined);
        setExistingColors(undefined);
        setCurrentColors(undefined);
        // Still check for intrinsic palette even for non-premium users
        const activePalette = getActivePalette();
        if (activePalette.id !== 'custom') {
          setIsIntrinsicPalette(true);
          setMatchedPaletteId(activePalette.id);
          setMatchedPaletteSimilarity(100);
        } else {
          setIsIntrinsicPalette(false);
          setMatchedPaletteId(undefined);
          setMatchedPaletteSimilarity(undefined);
        }
        return;
      }

      setIsCheckingDuplicate(true);
      try {
        const activePalette = getActivePalette();
        
        // Build custom colors if using custom palette
        let customColors: PaletteColors | undefined;
        if (activePalette.id === 'custom') {
          customColors = {
            white: activePalette.white,
            black: activePalette.black,
          };
        }
        
        const visualizationState: VisualizationState = {
          paletteId: activePalette.id,
          darkMode,
          currentMove: currentMove === Infinity ? undefined : currentMove,
          lockedPieces: lockedPieces.length > 0 ? lockedPieces : undefined,
          showLegend,
          customColors,
        };

        const result: DuplicateCheckResult = await checkDuplicateVisualization(
          user.id,
          pgn,
          simulation.gameData,
          visualizationState
        );

        setExistsInGallery(result.isDuplicate);
        setIsTooSimilar(result.isTooSimilar && !result.isDuplicate);
        setColorSimilarity(result.colorSimilarity);
        setIsOwnedByCurrentUser(result.ownedByCurrentUser || false);
        setOwnerDisplayName(result.ownerDisplayName);
        setSimilarityReason(result.reason);
        setExistingColors(result.existingColors);
        
        // Set intrinsic palette and game info
        setIsIntrinsicPalette(result.isIntrinsicPalette || false);
        setIsIntrinsicGame(result.isIntrinsicGame || false);
        setMatchedPaletteId(result.matchedPaletteId);
        setMatchedPaletteSimilarity(result.matchedPaletteSimilarity);
        setMatchedGameCard(result.matchedGameCard);
        
        // Store current colors for comparison
        const currentPaletteColors: PaletteColors = customColors || {
          white: activePalette.white,
          black: activePalette.black,
        };
        setCurrentColors(currentPaletteColors);
      } catch (error) {
        console.error('Error checking duplicate:', error);
        setExistsInGallery(false);
        setIsTooSimilar(false);
        setColorSimilarity(undefined);
        setIsOwnedByCurrentUser(false);
        setOwnerDisplayName(undefined);
        setSimilarityReason(undefined);
        setExistingColors(undefined);
        setCurrentColors(undefined);
        setIsIntrinsicPalette(false);
        setIsIntrinsicGame(false);
        setMatchedPaletteId(undefined);
        setMatchedPaletteSimilarity(undefined);
        setMatchedGameCard(undefined);
      } finally {
        setIsCheckingDuplicate(false);
      }
    };

    // Debounce the check to avoid too many API calls
    const timeoutId = setTimeout(checkIfExists, 300);
    return () => clearTimeout(timeoutId);
  }, [user, isPremium, simulation, pgn, darkMode, currentMove, lockedPieces, showLegend]);
  
  // Capture the preview element directly using html2canvas
  const capturePreview = async (withWatermark: boolean): Promise<HTMLCanvasElement | null> => {
    if (!printRef.current) {
      console.error('Print ref not available');
      return null;
    }
    
    try {
      // Show watermark for free downloads
      if (withWatermark) {
        setShowWatermark(true);
        // Wait for React to render the watermark
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Ensure fonts are loaded
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      // Extra time for rendering to settle
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Capture at 5x resolution for max quality
      const canvas = await html2canvas(printRef.current, {
        scale: 5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: darkMode ? '#0A0A0A' : '#FDFCFB',
        logging: false,
        imageTimeout: 30000,
        onclone: (clonedDoc, clonedElement) => {
          // Ensure SVG elements have proper namespace for html2canvas
          const svgs = clonedElement.querySelectorAll('svg');
          svgs.forEach(svg => {
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            const computedStyle = window.getComputedStyle(svg);
            if (!svg.getAttribute('width')) {
              svg.setAttribute('width', computedStyle.width);
            }
            if (!svg.getAttribute('height')) {
              svg.setAttribute('height', computedStyle.height);
            }
          });
          
          // Force font rendering in cloned document
          const allText = clonedElement.querySelectorAll('*');
          allText.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const computedStyle = window.getComputedStyle(htmlEl);
            if (computedStyle.fontFamily) {
              htmlEl.style.fontFamily = computedStyle.fontFamily;
            }
          });
        },
      });
      
      // Hide watermark after capture
      if (withWatermark) {
        setShowWatermark(false);
      }
      
      return canvas;
    } catch (error) {
      console.error('html2canvas capture failed:', error);
      setShowWatermark(false);
      throw error;
    }
  };
  
  // Watermark component for free downloads
  const WatermarkOverlay = () => (
    <div
      ref={watermarkRef}
      className="absolute bottom-2 right-2 flex items-center gap-2 px-2 py-1.5 rounded-md"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(180, 180, 180, 0.8)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Logo */}
      <img
        src={enPensentLogo}
        alt="En Pensent"
        className="w-8 h-8 rounded-full object-cover"
      />
      
      {/* Text */}
      <div className="flex flex-col">
        <span
          className="text-xs font-semibold text-gray-800 leading-tight tracking-wide"
          style={{ fontFamily: "'Cinzel', 'Times New Roman', serif" }}
        >
          EN PENSENT
        </span>
        <span
          className="text-[10px] text-gray-500 leading-tight italic"
          style={{ fontFamily: "'Cormorant', Georgia, serif" }}
        >
          enpensent.com
        </span>
      </div>
      
      {/* QR Code */}
      {qrCodeDataUrl && (
        <img
          src={qrCodeDataUrl}
          alt="QR Code"
          className="w-8 h-8"
        />
      )}
    </div>
  );
  
  // Download handler
  const handleDownload = async (withWatermark: boolean) => {
    setIsDownloading(true);
    console.log('Starting download, withWatermark:', withWatermark);
    
    try {
      const canvas = await capturePreview(withWatermark);
      if (!canvas) {
        throw new Error('Failed to capture preview - canvas is null');
      }
      
      console.log('Canvas ready, creating download...');
      
      // Create data URL
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      console.log('Data URL created, length:', dataUrl.length);
      
      // Create filename
      const whiteName = simulation.gameData.white?.replace(/\s+/g, '-') || 'chess';
      const blackName = simulation.gameData.black?.replace(/\s+/g, '-') || 'game';
      const modeLabel = darkMode ? 'dark' : 'light';
      const qualityLabel = withWatermark ? 'preview' : 'HD';
      const filename = `EnPensent-${whiteName}-vs-${blackName}-${modeLabel}-${qualityLabel}.png`;
      
      // Use more reliable download method
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Download triggered:', filename);
      toast.success(withWatermark ? 'Preview downloaded!' : 'HD image downloaded!');
      
      // Track HD download for vision scoring (only for HD, not preview)
      if (!withWatermark && visualizationId) {
        recordVisionInteraction(visualizationId, 'download_hd');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleHDDownload = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (!isPremium) {
      setPremiumModalTrigger('download');
      setShowPremiumModal(true);
      return;
    }
    
    handleDownload(false);
  };

  // GIF generation handler
  const handleGifDownload = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (!isPremium) {
      setPremiumModalTrigger('gif');
      setShowPremiumModal(true);
      return;
    }

    if (!printRef.current) return;

    setIsGeneratingGif(true);
    setGifProgress(0);

    try {
      // Capture initial frame to get dimensions
      const firstCanvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: darkMode ? '#0A0A0A' : '#FDFCFB',
        logging: false,
      });

      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: firstCanvas.width,
        height: firstCanvas.height,
        workerScript: '/gif.worker.js',
      });

      // Sample moves for reasonable file size
      const maxFrames = 40;
      const step = simulation.totalMoves > maxFrames ? Math.ceil(simulation.totalMoves / maxFrames) : 1;
      const movesToCapture: number[] = [0];
      
      for (let i = 1; i <= simulation.totalMoves; i += step) {
        movesToCapture.push(i);
      }
      if (movesToCapture[movesToCapture.length - 1] !== simulation.totalMoves) {
        movesToCapture.push(simulation.totalMoves);
      }

      const totalFrames = movesToCapture.length;

      // Show watermark for GIF
      setShowWatermark(true);
      await new Promise(r => setTimeout(r, 100));

      for (let i = 0; i < movesToCapture.length; i++) {
        const moveNum = movesToCapture[i];
        setGifPreviewMove(moveNum);
        await new Promise(r => setTimeout(r, 80));

        const canvas = await html2canvas(printRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: darkMode ? '#0A0A0A' : '#FDFCFB',
          logging: false,
        });

        const isFirstOrLast = i === 0 || i === movesToCapture.length - 1;
        gif.addFrame(canvas, { delay: isFirstOrLast ? 600 : 150, copy: true });
        setGifProgress(((i + 1) / totalFrames) * 70);
      }

      setShowWatermark(false);
      setGifPreviewMove(null);

      gif.on('progress', (p: number) => setGifProgress(70 + p * 30));

      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const whiteName = simulation.gameData.white?.replace(/\s+/g, '-') || 'chess';
        const blackName = simulation.gameData.black?.replace(/\s+/g, '-') || 'game';
        link.download = `EnPensent-${whiteName}-vs-${blackName}-animated.gif`;
        link.click();
        URL.revokeObjectURL(url);
        setIsGeneratingGif(false);
        setGifProgress(0);
        toast.success('GIF downloaded!');
        
        // Track GIF download for vision scoring
        if (visualizationId) {
          recordVisionInteraction(visualizationId, 'download_gif');
        }
      });

      gif.render();
    } catch (error) {
      console.error('GIF generation failed:', error);
      toast.error('GIF generation failed');
      setIsGeneratingGif(false);
      setGifProgress(0);
      setShowWatermark(false);
      setGifPreviewMove(null);
    }
  };

  const handleSaveToGallery = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (!isPremium) {
      setPremiumModalTrigger('save');
      setShowPremiumModal(true);
      return;
    }
    
    setIsSaving(true);
    try {
      // Capture clean image (no watermark) for gallery
      const canvas = await capturePreview(false);
      if (!canvas) throw new Error('Failed to capture preview');
      
      const imageBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
      
      if (!imageBlob) {
        throw new Error('Failed to create image blob');
      }
      
      const visualizationTitle = title || 
        `${simulation.gameData.white} vs ${simulation.gameData.black}`;
      
      // Build visualization state for duplicate/similarity detection
      const activePalette = getActivePalette();
      
      // Build custom colors if using custom palette
      let customColors: PaletteColors | undefined;
      if (activePalette.id === 'custom') {
        customColors = {
          white: activePalette.white,
          black: activePalette.black,
        };
      }
      
      const visualizationState: VisualizationState = {
        paletteId: activePalette.id,
        darkMode,
        currentMove: currentMove === Infinity ? undefined : currentMove,
        lockedPieces: lockedPieces.length > 0 ? lockedPieces : undefined,
        showLegend,
        customColors,
      };
      
      const result = await saveVisualization(
        user.id,
        visualizationTitle,
        simulation,
        imageBlob,
        pgn,
        visualizationState
      );
      
      if (result.error) {
        if (result.isDuplicate) {
          if (result.ownedByCurrentUser) {
            toast.error('Already in your gallery!', {
              description: 'This exact visualization is already saved. Try changing the palette, timeline, or highlighted pieces to create a unique version.',
              duration: 5000,
            });
          } else {
            toast.error('Already claimed!', {
              description: `This visualization was claimed by ${result.ownerDisplayName || 'another collector'}. Try a different palette or timeline to create your own unique version.`,
              duration: 5000,
            });
          }
          setExistsInGallery(true);
          setIsOwnedByCurrentUser(result.ownedByCurrentUser || false);
          setOwnerDisplayName(result.ownerDisplayName);
          return;
        }
        
        // Handle "too similar" case (30%+ color match with same moves)
        if (result.isTooSimilar) {
          toast.error('Too similar to an existing vision!', {
            description: result.reason || `This visualization is ${Math.round(result.colorSimilarity || 30)}% similar to an existing one. Change at least 8 colors to make it unique.`,
            duration: 6000,
          });
          setIsTooSimilar(true);
          setColorSimilarity(result.colorSimilarity);
          setIsOwnedByCurrentUser(result.ownedByCurrentUser || false);
          setOwnerDisplayName(result.ownerDisplayName);
          setSimilarityReason(result.reason);
          return;
        }
        
        throw result.error;
      }
      
      setIsSaved(true);
      setIsTooSimilar(false);
      
      // Notify parent of the share ID for QR code integration
      if (result.data?.public_share_id && onShareIdCreated) {
        onShareIdCreated(result.data.public_share_id);
      }
      
      toast.success('Saved to your gallery!', {
        description: 'View it anytime in My Vision',
      });
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex justify-center gap-2 flex-wrap">
        <Button
          variant={darkMode ? "outline" : "default"}
          size="sm"
          onClick={() => setDarkMode(false)}
          className="gap-2 text-xs"
        >
          <Sun className="h-3 w-3" />
          Light
        </Button>
        <Button
          variant={darkMode ? "default" : "outline"}
          size="sm"
          onClick={() => setDarkMode(true)}
          className="gap-2 text-xs"
        >
          <Moon className="h-3 w-3" />
          Dark
        </Button>
        <Button
          variant={showLegend ? "default" : "outline"}
          size="sm"
          onClick={() => setShowLegend(!showLegend)}
          className="gap-2 text-xs"
        >
          {showLegend ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          Legend
        </Button>
      </div>

      {/* Main content area with timeline on left */}
      <div className="flex gap-4 justify-center items-start flex-wrap">
        {/* Vertical Timeline on the left */}
        <div className="hidden md:flex">
          <VerticalTimelineSlider 
            totalMoves={simulation.totalMoves} 
            moves={simulation.gameData.moves}
          />
        </div>

        {/* Print Preview - The actual artwork */}
        <div 
          ref={printRef}
          className={`p-6 md:p-10 shadow-2xl max-w-lg rounded-sm border transition-colors duration-300 ${
            darkMode 
              ? 'bg-[#0A0A0A] border-stone-800' 
              : 'bg-[#FDFCFB] border-stone-200'
          }`}
          style={{ 
            minHeight: 'auto',
            width: 'fit-content',
          }}
        >
          <div className="flex flex-col items-center gap-6">
            {/* Chess board visualization with watermark overlay - Interactive for bidirectional legend highlighting */}
            <div className="relative">
              <InteractiveVisualizationBoard 
                board={gifPreviewMove !== null ? filterBoardToMove(simulation.board, gifPreviewMove) : timelineBoard} 
                size={boardSize}
              />
              
              {/* Watermark - visible during free download and GIF capture */}
              {showWatermark && <WatermarkOverlay />}
            </div>
            
            {/* Game information - proper spacing */}
            <div className={`w-full pt-4 border-t ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
              <GameInfoDisplay gameData={simulation.gameData} title={title} darkMode={darkMode} />
            </div>
            
            {/* Subtle branding - visible in preview */}
            <p 
              className={`text-[10px] tracking-[0.3em] uppercase font-medium ${
                darkMode ? 'text-stone-500' : 'text-stone-400'
              }`}
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              ♔ En Pensent ♚
            </p>
          </div>
        </div>

        {/* Color Legend on the right - Interactive */}
        {showLegend && (
          <div className="hidden lg:block w-72">
            <EnhancedLegend 
              whitePalette={getActivePalette().white}
              blackPalette={getActivePalette().black}
              moveHistory={simulation.gameData.moves?.map((move, i) => ({
                piece: (move.match(/^[KQRBN]/)?.[0]?.toLowerCase() || 'p') as any,
                color: (i % 2 === 0 ? 'w' : 'b') as any,
                square: move.slice(-2),
                moveNumber: Math.floor(i / 2) + 1,
              })) || []}
            />
          </div>
        )}
      </div>

      {/* Mobile Timeline - shown below on small screens */}
      <div className="md:hidden">
        <TimelineSlider 
          totalMoves={simulation.totalMoves} 
          moves={simulation.gameData.moves}
        />
      </div>

      {/* Mobile Legend - shown below timeline on small screens */}
      {showLegend && (
        <div className="lg:hidden">
          <EnhancedLegend 
            whitePalette={getActivePalette().white}
            blackPalette={getActivePalette().black}
            compact={true}
            moveHistory={simulation.gameData.moves?.map((move, i) => ({
              piece: (move.match(/^[KQRBN]/)?.[0]?.toLowerCase() || 'p') as any,
              color: (i % 2 === 0 ? 'w' : 'b') as any,
              square: move.slice(-2),
              moveNumber: Math.floor(i / 2) + 1,
            })) || []}
          />
        </div>
      )}
      
      {/* Intrinsic Palette/Game Badge - shown when using a featured En Pensent palette or game */}
      {(isIntrinsicPalette || isIntrinsicGame) && (
        <div className="flex justify-center">
          <IntrinsicPaletteCard 
            paletteId={matchedPaletteId} 
            similarity={matchedPaletteSimilarity}
            gameCardId={matchedGameCard?.id}
            gameCardTitle={matchedGameCard?.title}
            gameCardMatchType={matchedGameCard?.matchType}
            gameCardSimilarity={matchedGameCard?.similarity}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        {/* Download buttons row */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button 
            onClick={() => handleDownload(true)}
            disabled={isDownloading || isSaving}
            variant="outline"
            className="gap-2 px-6"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Free Preview
          </Button>
          
          <Button 
            onClick={handleHDDownload}
            disabled={isDownloading || isSaving}
            className="gap-2 btn-luxury px-6"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPremium ? (
              <Download className="h-4 w-4" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            {isPremium ? 'Download HD (No Watermark)' : 'HD Download'}
            {!isPremium && (
              <span className="text-xs opacity-75 ml-1">Premium</span>
            )}
          </Button>
        </div>

        {/* GIF Download button */}
        <div className="flex flex-col items-center gap-2">
          <Button 
            onClick={handleGifDownload}
            disabled={isDownloading || isSaving || isGeneratingGif}
            variant="outline"
            className={`gap-2 px-6 border-violet-500/30 hover:bg-violet-500/10 ${isPremium ? 'text-violet-400' : ''}`}
          >
            {isGeneratingGif ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPremium ? (
              <Film className="h-4 w-4" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            {isGeneratingGif ? 'Generating GIF...' : 'Download Animated GIF'}
            {!isPremium && (
              <span className="text-xs opacity-75 ml-1">Premium</span>
            )}
          </Button>
          {isGeneratingGif && (
            <Progress value={gifProgress} className="w-48 h-2" />
          )}
        </div>
        
        {/* Save to Gallery + Order Print row */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button 
            onClick={handleSaveToGallery}
            disabled={isDownloading || isSaving || isSaved || isGeneratingGif || existsInGallery || isTooSimilar}
            variant={isSaved || existsInGallery || isTooSimilar ? "secondary" : "outline"}
            className={`gap-2 px-6 relative ${
              isSaved ? 'bg-green-500/10 text-green-600 border-green-500/30' : 
              existsInGallery && isOwnedByCurrentUser ? 'bg-green-500/10 text-green-600 border-green-500/30 cursor-not-allowed' :
              existsInGallery ? 'bg-rose-500/10 text-rose-600 border-rose-500/30 cursor-not-allowed' :
              isTooSimilar ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 cursor-not-allowed' : ''
            }`}
            title={
              existsInGallery && isOwnedByCurrentUser 
                ? 'You already own this visualization in your gallery' 
                : existsInGallery 
                  ? `This visualization is owned by ${ownerDisplayName || 'another collector'}` 
                  : isTooSimilar
                    ? similarityReason || `${Math.round(colorSimilarity || 30)}% similar to an existing vision - change more colors for uniqueness`
                    : undefined
            }
          >
            {isSaving || isCheckingDuplicate ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSaved ? (
              <Check className="h-4 w-4" />
            ) : existsInGallery && isOwnedByCurrentUser ? (
              <Check className="h-4 w-4" />
            ) : existsInGallery ? (
              <Crown className="h-4 w-4" />
            ) : isTooSimilar ? (
              <Crown className="h-4 w-4" />
            ) : isPremium ? (
              <Bookmark className="h-4 w-4" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            {isSaved 
              ? 'Saved to Gallery' 
              : existsInGallery && isOwnedByCurrentUser 
                ? 'In Your Gallery' 
                : existsInGallery 
                  ? `Claimed by ${ownerDisplayName || 'Collector'}` 
                  : isTooSimilar
                    ? `${Math.round(colorSimilarity || 30)}% Similar`
                    : 'Save to My Vision'
            }
            {!isPremium && !isSaved && !existsInGallery && !isTooSimilar && (
              <span className="text-xs opacity-75 ml-1">Premium</span>
            )}
          </Button>
          
          {/* Color comparison preview when similarity detected */}
          {isTooSimilar && currentColors && existingColors && (
            <ColorComparisonPreview
              yourColors={currentColors}
              existingColors={existingColors}
              ownerName={ownerDisplayName}
            />
          )}

          {/* Order Print Button - Stylish but not obnoxious */}
          <OrderPrintButton 
            variant="default" 
            size="md" 
            orderData={{
              title: title || `${simulation.gameData.white} vs ${simulation.gameData.black}`,
              pgn: pgn,
              gameData: {
                white: simulation.gameData.white,
                black: simulation.gameData.black,
                event: simulation.gameData.event,
                date: simulation.gameData.date,
                result: simulation.gameData.result,
              },
              simulation,
              capturedState,
            }}
          />
        </div>
      </div>
      
      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onAuthRequired={() => {
          setShowPremiumModal(false);
          setShowAuthModal(true);
        }}
        trigger={premiumModalTrigger}
      />
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default PrintPreview;
