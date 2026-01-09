import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Crown, Sparkles } from 'lucide-react';
import { famousGames, FamousGame } from '@/lib/chess/famousGames';

interface PgnUploaderProps {
  onPgnSubmit: (pgn: string) => void;
}

const PgnUploader: React.FC<PgnUploaderProps> = ({ onPgnSubmit }) => {
  const [pgn, setPgn] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedGame, setSelectedGame] = useState<FamousGame | null>(null);
  
  const handleSubmit = useCallback(() => {
    if (pgn.trim()) {
      onPgnSubmit(pgn.trim());
    }
  }, [pgn, onPgnSubmit]);
  
  const handleLoadGame = useCallback((game: FamousGame) => {
    setPgn(game.pgn);
    setSelectedGame(game);
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
              }}
              className="min-h-[150px] font-mono text-sm bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>
          
          {/* Selected game info */}
          {selectedGame && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-display font-semibold">{selectedGame.title}</p>
              <p className="text-xs text-muted-foreground mt-1 font-serif">{selectedGame.description}</p>
            </div>
          )}
          
          {/* Action button */}
          <Button 
            onClick={handleSubmit} 
            disabled={!pgn.trim()}
            className="w-full gap-2 btn-luxury py-6 text-base font-medium"
            size="lg"
          >
            <Sparkles className="h-5 w-5" />
            Generate Visualization
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PgnUploader;
