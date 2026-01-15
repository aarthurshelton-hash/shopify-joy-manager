import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Grid3X3, CheckCircle, XCircle, Sparkles, Loader2, 
  Copy, Puzzle, Crown, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  validateFen, 
  EXAMPLE_FENS, 
  STARTING_FEN,
  FenValidationResult,
  getPositionDescription,
} from '@/lib/chess/fenUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FenInputProps {
  onFenSubmit: (fen: string, title?: string) => void;
}

const FenInput: React.FC<FenInputProps> = ({ onFenSubmit }) => {
  const [fen, setFen] = useState('');
  const [validation, setValidation] = useState<FenValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);

  const handleValidate = useCallback(() => {
    if (!fen.trim()) {
      toast.error('No FEN to validate', {
        description: 'Please enter a FEN string first.',
      });
      return;
    }

    setIsValidating(true);
    
    setTimeout(() => {
      const result = validateFen(fen.trim());
      setValidation(result);
      setIsValidating(false);

      if (result.isValid) {
        toast.success('Valid FEN!', {
          description: `${result.pieceCount} pieces, ${result.sideToMove === 'w' ? 'White' : 'Black'} to move`,
        });
      } else {
        toast.error('Invalid FEN', {
          description: result.error,
        });
      }
    }, 100);
  }, [fen]);

  const handleSubmit = useCallback(() => {
    const fenToSubmit = fen.trim() || STARTING_FEN;
    const result = validateFen(fenToSubmit);
    
    if (!result.isValid) {
      toast.error('Invalid FEN', {
        description: result.error || 'Please enter a valid FEN string.',
      });
      return;
    }

    // Find if this matches an example
    const matchedExample = EXAMPLE_FENS.find(ex => ex.fen === fenToSubmit);
    const title = matchedExample?.name || getPositionDescription(fenToSubmit);
    
    onFenSubmit(fenToSubmit, title);
  }, [fen, onFenSubmit]);

  const handleLoadExample = useCallback((example: typeof EXAMPLE_FENS[0]) => {
    setFen(example.fen);
    setSelectedExample(example.name);
    setValidation(null);
    toast.success(`Loaded: ${example.name}`);
  }, []);

  const handleCopyFen = useCallback(() => {
    if (fen) {
      navigator.clipboard.writeText(fen);
      toast.success('FEN copied to clipboard');
    }
  }, [fen]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Grid3X3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">Position (FEN)</h3>
            <p className="text-xs text-muted-foreground">
              Load a specific board position
            </p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[280px]">
              <p className="text-sm font-medium mb-1">What is FEN?</p>
              <p className="text-xs text-muted-foreground">
                Forsyth-Edwards Notation describes a single chess position. 
                Use it to visualize specific positions, puzzles, or endgame studies.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Example Positions */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <Puzzle className="h-3.5 w-3.5" />
          Example Positions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EXAMPLE_FENS.slice(0, 8).map((example) => (
            <button
              key={example.name}
              onClick={() => handleLoadExample(example)}
              className={`group p-2.5 text-left rounded-lg border transition-all hover:scale-[1.02] ${
                selectedExample === example.name
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border/50 bg-card/50 hover:border-primary/30'
              }`}
            >
              <p className="text-xs font-medium line-clamp-1 group-hover:text-primary transition-colors">
                {example.name}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                {example.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* FEN Input */}
      <div className="space-y-3">
        <div className="relative">
          <Input
            placeholder="Enter FEN string... e.g., rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
            value={fen}
            onChange={(e) => {
              setFen(e.target.value);
              setValidation(null);
              setSelectedExample(null);
            }}
            className="font-mono text-xs pr-10 bg-background/50 border-border/50 focus:border-primary/50"
          />
          {fen && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleCopyFen}
            >
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>

        {/* Validation Status */}
        <AnimatePresence>
          {validation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-3 rounded-lg flex items-start gap-2 ${
                validation.isValid
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-destructive/10 border border-destructive/30'
              }`}
            >
              {validation.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${validation.isValid ? 'text-green-500' : 'text-destructive'}`}>
                  {validation.isValid ? 'Valid FEN' : 'Invalid FEN'}
                </p>
                {validation.isValid ? (
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {validation.pieceCount} pieces
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {validation.sideToMove === 'w' ? 'White' : 'Black'} to move
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Move {validation.fullMoveNumber}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">{validation.error}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Example Info */}
        {selectedExample && !validation && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm font-display font-semibold">{selectedExample}</p>
            <p className="text-xs text-muted-foreground mt-1 font-serif">
              {EXAMPLE_FENS.find(e => e.name === selectedExample)?.description}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleValidate}
          disabled={!fen.trim() || isValidating}
          variant="outline"
          className="gap-2 flex-1"
          size="lg"
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Validate
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!fen.trim()}
          className="gap-2 flex-[2] btn-luxury py-6 text-base font-medium"
          size="lg"
        >
          <Sparkles className="h-5 w-5" />
          Visualize Position
        </Button>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-muted-foreground text-center">
        Tip: Paste a FEN from Chess.com, Lichess, or any chess software
      </p>
    </div>
  );
};

export default FenInput;
