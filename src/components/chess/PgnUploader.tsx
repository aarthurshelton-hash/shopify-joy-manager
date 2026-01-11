import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Crown, Sparkles, CheckCircle, XCircle, Loader2, Wrench, ArrowRight, ChevronLeft, ChevronRight, Search, X, Shuffle } from 'lucide-react';
import { famousGames, FamousGame, getRandomFamousGame } from '@/lib/chess/famousGames';
import { gameImageImports } from '@/lib/chess/gameImages';
import { validatePgn, cleanPgn, PgnValidationResult } from '@/lib/chess/pgnValidator';
import { fixPgn, PgnFixResult } from '@/lib/chess/pgnFixer';
import { toast } from 'sonner';

const GAMES_PER_MOBILE_PAGE = 4;
const GAMES_PER_DESKTOP_PAGE = 16;

interface PgnUploaderProps {
  onPgnSubmit: (pgn: string, gameTitle?: string) => void;
}

// Custom hook for touch swipe detection
const useSwipe = (onSwipeLeft: () => void, onSwipeRight: () => void) => {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      onSwipeLeft();
    } else if (isRightSwipe) {
      onSwipeRight();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};

const PgnUploader: React.FC<PgnUploaderProps> = ({ onPgnSubmit }) => {
  const [pgn, setPgn] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedGame, setSelectedGame] = useState<FamousGame | null>(null);
  const [validation, setValidation] = useState<PgnValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [fixResult, setFixResult] = useState<PgnFixResult | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gamesContainerRef = useRef<HTMLDivElement>(null);
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Sort games by year (oldest to newest), then alphabetically by title within same year
  const sortedGames = useMemo(() => {
    return [...famousGames].sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.title.localeCompare(b.title);
    });
  }, []);
  
  // Filter games by search query
  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) return sortedGames;
    const query = searchQuery.toLowerCase();
    return sortedGames.filter(game => 
      game.title.toLowerCase().includes(query) || 
      game.year.toString().includes(query)
    );
  }, [sortedGames, searchQuery]);
  
  const gamesPerPage = isMobile ? GAMES_PER_MOBILE_PAGE : GAMES_PER_DESKTOP_PAGE;
  const totalPages = useMemo(() => Math.ceil(filteredGames.length / gamesPerPage), [filteredGames.length, gamesPerPage]);
  
  const handleValidate = useCallback(() => {
    if (!pgn.trim()) {
      toast.error('No PGN to validate', {
        description: 'Please enter or upload a PGN first.',
      });
      return;
    }

    setIsValidating(true);
    setFixResult(null);
    
    setTimeout(() => {
      const cleanedPgn = cleanPgn(pgn);
      const result = validatePgn(cleanedPgn);
      setValidation(result);
      setIsValidating(false);

      if (result.isValid) {
        toast.success('PGN is valid!', {
          description: `${result.moveCount} moves detected.`,
        });
      } else {
        // Automatically try to fix the PGN
        setIsFixing(true);
        setTimeout(() => {
          const fix = fixPgn(cleanedPgn);
          setFixResult(fix);
          setIsFixing(false);
          
          if (fix.canFix && fix.suggestions.length > 0) {
            toast.info('Fix suggestions available', {
              description: `Found ${fix.suggestions.length} issue(s) that can be corrected.`,
              duration: 5000,
            });
          } else if (!fix.canFix) {
            toast.error('Cannot auto-fix this PGN', {
              description: fix.originalError,
              duration: 6000,
            });
          }
        }, 50);
      }
    }, 50);
  }, [pgn]);

  const handleApplyFix = useCallback(() => {
    if (fixResult?.fixedPgn) {
      setPgn(fixResult.fixedPgn);
      setValidation(null);
      setFixResult(null);
      setSelectedGame(null);
      toast.success('Fixes applied!', {
        description: 'The corrected PGN has been loaded. Click Validate to verify.',
      });
    }
  }, [fixResult]);

  const handleSubmit = useCallback(() => {
    if (pgn.trim()) {
      onPgnSubmit(pgn.trim(), selectedGame?.title);
    }
  }, [pgn, onPgnSubmit, selectedGame]);
  
  const handleLoadGame = useCallback((game: FamousGame) => {
    setPgn(game.pgn);
    setSelectedGame(game);
    setValidation(null);
    setFixResult(null);
  }, []);
  
  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setPgn(text);
        setSelectedGame(null);
        setValidation(null);
        setFixResult(null);
      }
    };
    reader.readAsText(file);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.pgn')) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);
  
  // Reset page when switching between mobile/desktop or when search changes
  useEffect(() => {
    setPageIndex(0);
  }, [isMobile, searchQuery]);
  
  const goToNextPage = useCallback(() => {
    setPageIndex(prev => Math.min(prev + 1, totalPages - 1));
  }, [totalPages]);
  
  const goToPrevPage = useCallback(() => {
    setPageIndex(prev => Math.max(prev - 1, 0));
  }, []);
  
  // Keyboard navigation for desktop
  useEffect(() => {
    if (isMobile) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond if games container is in view or focused
      const container = gamesContainerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const isInView = rect.top < window.innerHeight && rect.bottom > 0;
      
      // Don't interfere with input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (isInView) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goToPrevPage();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goToNextPage();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, goToNextPage, goToPrevPage]);
  
  const swipeHandlers = useSwipe(goToNextPage, goToPrevPage);
  
  const visibleGames = useMemo(() => {
    const start = pageIndex * gamesPerPage;
    return filteredGames.slice(start, start + gamesPerPage);
  }, [filteredGames, pageIndex, gamesPerPage]);

  return (
    <div className="space-y-8">
      {/* Famous Games Showcase */}
      <div ref={gamesContainerRef} className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-1">
              <h3 className="flex items-center gap-2 font-display text-base sm:text-lg font-semibold">
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Legendary Games
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-serif">
                {searchQuery 
                  ? `Found ${filteredGames.length} game${filteredGames.length !== 1 ? 's' : ''}`
                  : isMobile 
                    ? 'Swipe to explore' 
                    : `Showing ${filteredGames.length > 0 ? pageIndex * gamesPerPage + 1 : 0}–${Math.min((pageIndex + 1) * gamesPerPage, filteredGames.length)} of ${filteredGames.length} legendary games`
                }
                {!isMobile && !searchQuery && <span className="ml-2 text-muted-foreground/60">• Use ← → arrow keys</span>}
              </p>
            </div>
            
            {/* Random game button */}
            <button
              onClick={() => {
                const randomGame = getRandomFamousGame();
                handleLoadGame(randomGame);
                toast.success('Random game loaded!', {
                  description: `${randomGame.title} (${randomGame.year})`,
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-md transition-colors flex-shrink-0"
              aria-label="Load random game"
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Random</span>
            </button>
            
            {/* Search input */}
            <div className="relative flex-shrink-0 w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-background/50 border border-border/50 rounded-md focus:outline-none focus:border-primary/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
            
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={goToPrevPage}
                  disabled={pageIndex === 0}
                  className="p-1.5 sm:p-2 rounded-full bg-card border border-border/50 disabled:opacity-30 hover:border-primary/50 transition-all"
                  aria-label="Previous games"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <span className="text-xs sm:text-sm text-muted-foreground tabular-nums min-w-[3rem] text-center">
                  {pageIndex + 1}/{totalPages}
                </span>
                <button 
                  onClick={goToNextPage}
                  disabled={pageIndex === totalPages - 1}
                  className="p-1.5 sm:p-2 rounded-full bg-card border border-border/50 disabled:opacity-30 hover:border-primary/50 transition-all"
                  aria-label="Next games"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-3 sm:p-4">
          {filteredGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No games found for "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div 
              ref={scrollContainerRef}
              className={isMobile ? "touch-pan-x" : ""}
              {...(isMobile ? swipeHandlers : {})}
            >
              <div 
                className={`grid gap-2 sm:gap-3 transition-opacity duration-200 ${
                  isMobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                }`}
                style={{ minHeight: isMobile ? '180px' : '200px' }}
              >
                {visibleGames.map((game) => {
                  const gameImage = gameImageImports[game.id];
                  return (
                    <button
                      key={game.id}
                      onClick={() => handleLoadGame(game)}
                      className={`group text-left rounded-lg border transition-all duration-200 overflow-hidden ${
                        isMobile ? 'flex flex-col' : 'flex gap-3 p-2 hover:scale-[1.02]'
                      } ${
                        selectedGame?.id === game.id 
                          ? 'border-primary ring-1 ring-primary/30 bg-primary/5' 
                          : 'border-border/40 bg-card/50 hover:border-primary/50 hover:bg-card active:scale-[0.98]'
                      }`}
                    >
                    {/* Thumbnail */}
                    <div className={`relative overflow-hidden bg-muted ${
                      isMobile ? 'w-full aspect-[4/3]' : 'w-14 h-14 flex-shrink-0 rounded-md'
                    }`}>
                      {gameImage ? (
                        <img 
                          src={gameImage} 
                          alt={game.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <Crown className={isMobile ? "h-6 w-6 text-primary/40" : "h-5 w-5 text-primary/40"} />
                        </div>
                      )}
                    </div>
                    {/* Text info */}
                    <div className={`flex flex-col justify-center ${isMobile ? 'p-2 flex-1' : 'flex-1 min-w-0'}`}>
                      <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">{game.title}</p>
                      <p className={`text-muted-foreground ${isMobile ? 'text-[10px] mt-0.5' : 'text-[10px] mt-1'}`}>{game.year}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Pagination dots */}
            <div className="flex justify-center gap-1.5 mt-3 sm:mt-4">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPageIndex(idx)}
                  className={`h-1.5 sm:h-2 rounded-full transition-all ${
                    idx === pageIndex 
                      ? 'bg-primary w-4 sm:w-6' 
                      : 'bg-muted-foreground/30 w-1.5 sm:w-2 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to page ${idx + 1}`}
                />
              ))}
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Upload Card */}
      <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold">
            <FileText className="h-4 w-4" />
            Upload Your Game
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-serif">
            Paste PGN notation or upload a .pgn file
          </p>
        </div>
        <div className="p-4 space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-5 text-center transition-all duration-300 ${
              isDragging 
                ? 'border-primary bg-primary/10 glow-gold' 
                : 'border-border hover:border-primary/30'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-1 font-serif">
              Drag & drop a .pgn file here, or
            </p>
            <label className="cursor-pointer">
              <span className="text-primary hover:text-primary/80 text-xs font-medium transition-colors">browse files</span>
              <input
                type="file"
                accept=".pgn"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </label>
          </div>
          
          {/* Text area for manual input */}
          <div className="relative">
            <Textarea
              placeholder="Or paste PGN notation here..."
              value={pgn}
              onChange={(e) => {
                setPgn(e.target.value);
                setSelectedGame(null);
                setValidation(null);
                setFixResult(null);
              }}
              className="min-h-[100px] font-mono text-xs bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>
          
          {/* Validation status */}
          {validation && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              validation.isValid 
                ? 'bg-green-500/10 border border-green-500/30' 
                : 'bg-destructive/10 border border-destructive/30'
            }`}>
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${validation.isValid ? 'text-green-500' : 'text-destructive'}`}>
                  {validation.isValid ? `Valid PGN — ${validation.moveCount} moves` : 'Invalid PGN'}
                </p>
                {!validation.isValid && validation.error && (
                  <p className="text-xs text-muted-foreground mt-1">{validation.error}</p>
                )}
              </div>
            </div>
          )}

          {/* PGN Fix Suggestions */}
          {fixResult && !validation?.isValid && (
            <div className={`p-4 rounded-lg border ${
              fixResult.canFix 
                ? 'bg-amber-500/10 border-amber-500/30' 
                : 'bg-destructive/10 border-destructive/30'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Wrench className={`h-5 w-5 ${fixResult.canFix ? 'text-amber-500' : 'text-destructive'}`} />
                <p className={`text-sm font-medium ${fixResult.canFix ? 'text-amber-500' : 'text-destructive'}`}>
                  {fixResult.canFix 
                    ? `Found ${fixResult.suggestions.length} issue(s) - suggested corrections:` 
                    : 'Unable to automatically fix this PGN'}
                </p>
              </div>
              
              {fixResult.canFix && fixResult.suggestions.length > 0 && (
                <div className="space-y-2 mb-4">
                  {fixResult.suggestions.map((suggestion, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-lg bg-background/50 border border-border/50"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Move {suggestion.moveNumber}:</span>
                        <code className="px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-mono text-xs">
                          {suggestion.originalMove}
                        </code>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <code className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-600 font-mono text-xs">
                          {suggestion.suggestedMove}
                        </code>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                          suggestion.confidence === 'high' 
                            ? 'bg-green-500/20 text-green-600' 
                            : suggestion.confidence === 'medium'
                            ? 'bg-amber-500/20 text-amber-600'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {suggestion.confidence} confidence
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">{suggestion.reason}</p>
                    </div>
                  ))}
                </div>
              )}

              {!fixResult.canFix && (
                <p className="text-xs text-muted-foreground mb-3">{fixResult.originalError}</p>
              )}
              
              {fixResult.canFix && fixResult.suggestions.length > 0 && (
                <Button
                  onClick={handleApplyFix}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <CheckCircle className="h-4 w-4" />
                  Apply {fixResult.suggestions.length} Correction{fixResult.suggestions.length > 1 ? 's' : ''}
                </Button>
              )}
            </div>
          )}

          {/* Loading state for fixing */}
          {isFixing && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing PGN for possible fixes...</p>
            </div>
          )}
          
          {/* Selected game info */}
          {selectedGame && !validation && !fixResult && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-display font-semibold">{selectedGame.title}</p>
              <p className="text-xs text-muted-foreground mt-1 font-serif">{selectedGame.description}</p>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleValidate} 
              disabled={!pgn.trim() || isValidating}
              variant="outline"
              className="gap-2 flex-1"
              size="lg"
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Validate PGN
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!pgn.trim()}
              className="gap-2 flex-[2] btn-luxury py-6 text-base font-medium"
              size="lg"
            >
              <Sparkles className="h-5 w-5" />
              Generate Visualization
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PgnUploader;
