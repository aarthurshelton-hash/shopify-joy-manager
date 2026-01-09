import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText } from 'lucide-react';

interface PgnUploaderProps {
  onPgnSubmit: (pgn: string) => void;
}

// Famous example game: Kasparov vs Topalov, Wijk aan Zee 1999
const EXAMPLE_PGN = `[Event "Hoogovens A Tournament"]
[Site "Wijk aan Zee NED"]
[Date "1999.01.20"]
[Round "4"]
[White "Garry Kasparov"]
[Black "Veselin Topalov"]
[Result "1-0"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`;

const PgnUploader: React.FC<PgnUploaderProps> = ({ onPgnSubmit }) => {
  const [pgn, setPgn] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const handleSubmit = useCallback(() => {
    if (pgn.trim()) {
      onPgnSubmit(pgn.trim());
    }
  }, [pgn, onPgnSubmit]);
  
  const handleLoadExample = useCallback(() => {
    setPgn(EXAMPLE_PGN);
  }, []);
  
  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setPgn(text);
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Chess Game
        </CardTitle>
        <CardDescription>
          Paste PGN notation or upload a .pgn file to visualize the game
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
            <span className="text-primary hover:underline text-sm">browse files</span>
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
            onChange={(e) => setPgn(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleLoadExample}>
            Load Example Game
          </Button>
          <Button onClick={handleSubmit} disabled={!pgn.trim()}>
            Generate Visualization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PgnUploader;
