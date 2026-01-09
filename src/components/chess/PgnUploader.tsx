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
    <div className="space-y-6">
      {/* Famous Games Showcase */}
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="h-5 w-5 text-amber-500" />
            Legendary Games
          </CardTitle>
          <CardDescription>
            Start with an iconic game from chess history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {famousGames.map((game) => (
              <button
                key={game.id}
                onClick={() => handleLoadGame(game)}
                className={`text-left p-3 rounded-lg border transition-all hover:shadow-md hover:border-primary/50 ${
                  selectedGame?.id === game.id 
                    ? 'border-primary bg-primary/10 shadow-md' 
                    : 'border-border bg-card hover:bg-accent/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{game.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {game.white} vs {game.black}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {game.event}, {game.year}
                    </p>
                  </div>
                  <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Your Game
          </CardTitle>
          <CardDescription>
            Paste PGN notation or upload a .pgn file to create your unique visualization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag & drop a .pgn file here, or
            </p>
            <label className="cursor-pointer">
              <span className="text-primary hover:underline text-sm font-medium">browse files</span>
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
              className="min-h-[150px] font-mono text-sm"
            />
          </div>
          
          {/* Selected game info */}
          {selectedGame && (
            <div className="p-3 rounded-lg bg-accent/50 border">
              <p className="text-sm font-medium">{selectedGame.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{selectedGame.description}</p>
            </div>
          )}
          
          {/* Action button */}
          <Button 
            onClick={handleSubmit} 
            disabled={!pgn.trim()}
            className="w-full gap-2"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            Generate Visualization
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PgnUploader;
