import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Crown, Sparkles, CheckCircle, XCircle, Loader2, Wrench, ArrowRight } from 'lucide-react';
import { famousGames, FamousGame } from '@/lib/chess/famousGames';
import { gameImageImports } from '@/lib/chess/gameImages';
import { validatePgn, cleanPgn, PgnValidationResult } from '@/lib/chess/pgnValidator';
import { fixPgn, PgnFixResult } from '@/lib/chess/pgnFixer';
import { toast } from 'sonner';

const GAMES_PER_PAGE = 10;

interface PgnUploaderProps {
  onPgnSubmit: (pgn: string, gameTitle?: string) => void;
}

const PgnUploader: React.FC<PgnUploaderProps> = ({ onPgnSubmit }) => {
  const [pgn, setPgn] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedGame, setSelectedGame] = useState<FamousGame | null>(null);
  const [validation, setValidation] = useState<PgnValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [fixResult, setFixResult] = useState<PgnFixResult | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  const totalPages = useMemo(() => Math.ceil(famousGames.length / GAMES_PER_PAGE), []);
  
  // Sort games by year (oldest to newest), then alphabetically by title within same year
  const sortedGames = useMemo(() => {
    return [...famousGames].sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.title.localeCompare(b.title);
    });
  }, []);
  
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
  
  return (
    <div className="space-y-8">
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

      {/* Famous Games Showcase */}
      <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Crown className="h-5 w-5 text-primary" />
            Legendary Games
          </h3>
          <p className="text-sm text-muted-foreground mt-1 font-serif">
            Start with an iconic game from chess history
          </p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sortedGames.map((game) => {
              const gameImage = gameImageImports[game.id];
              return (
                <button
                  key={game.id}
                  onClick={() => handleLoadGame(game)}
                  className={`group text-left rounded-lg border transition-all duration-200 overflow-hidden hover:scale-[1.02] flex gap-3 p-2 ${
                    selectedGame?.id === game.id 
                      ? 'border-primary ring-1 ring-primary/30 bg-primary/5' 
                      : 'border-border/40 bg-card/50 hover:border-primary/50 hover:bg-card'
                  }`}
                >
                  {/* Square thumbnail */}
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                    {gameImage ? (
                      <img 
                        src={gameImage} 
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <Crown className="h-5 w-5 text-primary/40" />
                      </div>
                    )}
                  </div>
                  {/* Text info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">{game.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{game.year}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PgnUploader;
