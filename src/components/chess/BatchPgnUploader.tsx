import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Layers, Upload, Loader2, ChevronRight, FileText, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cleanPgn } from '@/lib/chess/pgnValidator';

interface BatchPgnUploaderProps {
  onPgnSubmit: (pgn: string, gameTitle?: string) => void;
}

interface BatchGame {
  id: string;
  title: string;
  pgn: string;
  white: string;
  black: string;
  status: 'pending' | 'done';
}

/** Parse PGN headers for display metadata. */
function parseHeaders(pgn: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const regex = /\[(\w+)\s+"([^"]*)"\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(pgn)) !== null) {
    headers[match[1]] = match[2];
  }
  return headers;
}

/** Split a multi-game PGN blob into individual game strings. */
function splitPgnGames(blob: string): string[] {
  return blob
    .split(/\n\n(?=\[Event )/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * #5 — Analyst pro tier: batch PGN upload / bulk analysis.
 * Accepts multiple .pgn files or a multi-game PGN paste, then lets the user
 * visualize each one sequentially. Designed for coaches and pros who want to
 * analyze many games quickly.
 */
export const BatchPgnUploader: React.FC<BatchPgnUploaderProps> = ({ onPgnSubmit }) => {
  const [games, setGames] = useState<BatchGame[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addGames = useCallback((pgnText: string) => {
    const split = splitPgnGames(pgnText);
    if (split.length === 0) {
      // Single game or unparseable — treat the whole thing as one game
      split.push(pgnText.trim());
    }

    const newGames: BatchGame[] = split
      .filter((p) => p.length > 20)
      .map((pgn, i) => {
        const h = parseHeaders(pgn);
        const white = h.White || 'White';
        const black = h.Black || 'Black';
        return {
          id: `batch-${Date.now()}-${i}`,
          title: `${white} vs ${black}`,
          pgn,
          white,
          black,
          status: 'pending' as const,
        };
      });

    if (newGames.length === 0) {
      toast.error('No valid PGN games found.');
      return;
    }

    setGames((prev) => [...prev, ...newGames]);
    toast.success(`Loaded ${newGames.length} game${newGames.length !== 1 ? 's' : ''}`, {
      description: 'Click any game to visualize it.',
    });
  }, []);

  const handleFiles = useCallback((files: FileList) => {
    setIsProcessing(true);
    let pending = files.length;
    const allText: string[] = [];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) allText.push(text);
        pending--;
        if (pending === 0) {
          allText.forEach((t) => addGames(t));
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        pending--;
        if (pending === 0) {
          if (allText.length > 0) allText.forEach((t) => addGames(t));
          setIsProcessing(false);
        }
      };
      reader.readAsText(file);
    });
  }, [addGames]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFiles(files);
  }, [handleFiles]);

  const handleVisualize = useCallback((game: BatchGame) => {
    onPgnSubmit(cleanPgn(game.pgn), game.title);
    setGames((prev) =>
      prev.map((g) => (g.id === game.id ? { ...g, status: 'done' as const } : g))
    );
  }, [onPgnSubmit]);

  const handleRemove = useCallback((id: string) => {
    setGames((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const handleClear = useCallback(() => {
    setGames([]);
  }, []);

  const pendingCount = games.filter((g) => g.status === 'pending').length;
  const doneCount = games.filter((g) => g.status === 'done').length;

  return (
    <div className="rounded-lg border border-primary/20 bg-card/50 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-display text-base sm:text-lg font-semibold">
              <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Batch Analysis
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-serif">
              Upload multiple .pgn files at once — perfect for coaches and pros analyzing entire repertoires.
            </p>
          </div>
          {games.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-5 text-center transition-all ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/30'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Processing files…</p>
            </div>
          ) : (
            <>
              <Upload className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mb-1 font-serif">
                Drag & drop multiple .pgn files here, or
              </p>
              <label className="cursor-pointer">
                <span className="text-primary hover:text-primary/80 text-xs font-medium transition-colors">
                  browse files
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pgn"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            </>
          )}
        </div>

        {/* Games list */}
        {games.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{games.length} game{games.length !== 1 ? 's' : ''} loaded</span>
              <span>{doneCount} done · {pendingCount} pending</span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center gap-2 p-2.5 rounded-md border border-border/40 bg-background/40 group"
                >
                  {game.status === 'done' ? (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{game.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {game.white} vs {game.black}
                    </p>
                  </div>
                  <button
                    onClick={() => handleVisualize(game)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors shrink-0"
                  >
                    Visualize
                    <ChevronRight className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleRemove(game.id)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    aria-label="Remove game"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchPgnUploader;
