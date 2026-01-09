import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Crown, Sparkles, CheckCircle, XCircle, Loader2, Lightbulb } from 'lucide-react';
import { famousGames, FamousGame } from '@/lib/chess/famousGames';
import { validatePgn, cleanPgn, PgnValidationResult } from '@/lib/chess/pgnValidator';
import { toast } from 'sonner';

interface PgnUploaderProps {
  onPgnSubmit: (pgn: string) => void;
}

const PgnUploader: React.FC<PgnUploaderProps> = ({ onPgnSubmit }) => {
  const [pgn, setPgn] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedGame, setSelectedGame] = useState<FamousGame | null>(null);
  const [validation, setValidation] = useState<PgnValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendationSeed, setRecommendationSeed] = useState(0);

  // Get 3 random recommended games for when validation fails
  const recommendedGames = useMemo(() => {
    const shuffled = [...famousGames].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [recommendationSeed]);
  
  const handleValidate = useCallback(() => {
    if (!pgn.trim()) {
      toast.error('No PGN to validate', {
        description: 'Please enter or upload a PGN first.',
      });
      return;
    }

    setIsValidating(true);
    setShowRecommendations(false);
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const cleanedPgn = cleanPgn(pgn);
      const result = validatePgn(cleanedPgn);
      setValidation(result);
      setIsValidating(false);

      if (result.isValid) {
        toast.success('PGN is valid!', {
          description: `${result.moveCount} moves detected.`,
        });
        setShowRecommendations(false);
      } else {
        toast.error('Invalid PGN', {
          description: result.error,
          duration: 6000,
        });
        setShowRecommendations(true);
        setRecommendationSeed(prev => prev + 1);
      }
    }, 50);
  }, [pgn]);

  const handleSubmit = useCallback(() => {
    if (pgn.trim()) {
      onPgnSubmit(pgn.trim());
    }
  }, [pgn, onPgnSubmit]);
  
  const handleLoadGame = useCallback((game: FamousGame) => {
    setPgn(game.pgn);
    setSelectedGame(game);
    setValidation(null);
    setShowRecommendations(false);
  }, []);
  
  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setPgn(text);
        setSelectedGame(null);
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
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {famousGames.map((game) => (
              <button
                key={game.id}
                onClick={() => handleLoadGame(game)}
                className={`text-left p-4 rounded-lg border transition-all duration-300 ${
                  selectedGame?.id === game.id 
                    ? 'border-primary bg-primary/10 glow-gold' 
                    : 'border-border/50 bg-card hover:border-primary/30 hover:bg-card/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-semibold text-sm">{game.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 font-serif">
                      {game.white} vs {game.black}
                    </p>
                    <p className="text-xs text-muted-foreground/70 font-sans">
                      {game.event}, {game.year}
                    </p>
                  </div>
                  <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Card */}
      <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
            <FileText className="h-5 w-5" />
            Upload Your Game
          </h3>
          <p className="text-sm text-muted-foreground mt-1 font-serif">
            Paste PGN notation or upload a .pgn file to create your unique visualization
          </p>
        </div>
        <div className="p-5 space-y-5">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
              isDragging 
                ? 'border-primary bg-primary/10 glow-gold' 
                : 'border-border hover:border-primary/30'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2 font-serif">
              Drag & drop a .pgn file here, or
            </p>
            <label className="cursor-pointer">
              <span className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">browse files</span>
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
                setShowRecommendations(false);
              }}
              className="min-h-[150px] font-mono text-sm bg-background/50 border-border/50 focus:border-primary/50"
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
              <div>
                <p className={`text-sm font-medium ${validation.isValid ? 'text-green-500' : 'text-destructive'}`}>
                  {validation.isValid ? `Valid PGN — ${validation.moveCount} moves` : 'Invalid PGN'}
                </p>
                {!validation.isValid && validation.error && (
                  <p className="text-xs text-muted-foreground mt-1">{validation.error}</p>
                )}
              </div>
            </div>
          )}

          {/* Recommended games when validation fails */}
          {showRecommendations && !validation?.isValid && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <p className="text-sm font-medium text-amber-500">
                  Try one of these verified games instead
                </p>
              </div>
              <div className="space-y-2">
                {recommendedGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handleLoadGame(game)}
                    className="w-full text-left p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                  >
                    <p className="text-sm font-display font-semibold">{game.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {game.white} vs {game.black} • {game.year}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Selected game info */}
          {selectedGame && !validation && !showRecommendations && (
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
