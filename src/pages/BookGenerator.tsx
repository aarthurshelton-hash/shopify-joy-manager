import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  Image as ImageIcon,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { carlsenTop100, CarlsenGame } from '@/lib/book/carlsenGames';
import { BookSpread } from '@/components/book/BookSpread';
import { simulateGame } from '@/lib/chess/gameSimulator';
import { supabase } from '@/integrations/supabase/client';
import { jsPDF } from 'jspdf';
import carlsenCover from '@/assets/book/carlsen-cover.jpg';

interface GeneratedSpread {
  game: CarlsenGame;
  haiku: string;
  visualizationImage: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
}

const BookGenerator: React.FC = () => {
  const [spreads, setSpreads] = useState<GeneratedSpread[]>(
    carlsenTop100.map(game => ({
      game,
      haiku: '',
      visualizationImage: '',
      status: 'pending',
    }))
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const completedCount = spreads.filter(s => s.status === 'complete').length;
  const errorCount = spreads.filter(s => s.status === 'error').length;
  const progress = (completedCount / spreads.length) * 100;

  const generateHaiku = async (game: CarlsenGame): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-haiku', {
        body: {
          title: game.title,
          white: game.white,
          black: game.black,
          event: game.event,
          year: game.year,
          result: game.result,
          significance: game.significance,
        },
      });

      if (error) throw error;
      return data.haiku || 'Silent pieces move\nAcross the checkered cosmos\nVictory awaits';
    } catch (error) {
      console.error('Haiku generation failed:', error);
      return 'Silent pieces move\nAcross the checkered cosmos\nVictory awaits';
    }
  };

  const generateVisualization = async (game: CarlsenGame): Promise<string> => {
    try {
      const simulation = simulateGame(game.pgn);
      
      // Use the print image generator
      const { generateCleanPrintImage } = await import('@/lib/chess/printImageGenerator');
      const imageDataUrl = await generateCleanPrintImage(simulation, {
        darkMode: false,
        includeQR: false,
      });
      
      return imageDataUrl;
    } catch (error) {
      console.error('Visualization generation failed:', error);
      return '';
    }
  };

  const generateSpread = async (index: number): Promise<void> => {
    const game = spreads[index].game;
    
    setSpreads(prev => prev.map((s, i) => 
      i === index ? { ...s, status: 'generating' } : s
    ));

    try {
      // Generate haiku and visualization in parallel
      const [haiku, visualizationImage] = await Promise.all([
        generateHaiku(game),
        generateVisualization(game),
      ]);

      setSpreads(prev => prev.map((s, i) => 
        i === index ? { ...s, haiku, visualizationImage, status: 'complete' } : s
      ));
    } catch (error) {
      console.error(`Error generating spread ${index}:`, error);
      setSpreads(prev => prev.map((s, i) => 
        i === index ? { ...s, status: 'error' } : s
      ));
    }
  };

  const startGeneration = useCallback(async () => {
    setIsGenerating(true);
    setIsPaused(false);

    for (let i = currentIndex; i < spreads.length; i++) {
      if (isPaused) break;
      
      setCurrentIndex(i);
      
      if (spreads[i].status === 'pending' || spreads[i].status === 'error') {
        await generateSpread(i);
        // Small delay between generations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsGenerating(false);
  }, [currentIndex, isPaused, spreads]);

  const pauseGeneration = () => {
    setIsPaused(true);
    setIsGenerating(false);
  };

  const resetGeneration = () => {
    setSpreads(
      carlsenTop100.map(game => ({
        game,
        haiku: '',
        visualizationImage: '',
        status: 'pending',
      }))
    );
    setCurrentIndex(0);
    setIsGenerating(false);
    setIsPaused(false);
  };

  const exportToPDF = async () => {
    if (completedCount === 0) {
      toast.error('No spreads generated yet');
      return;
    }

    setIsExporting(true);
    toast.info('Generating PDF... This may take a few minutes.');

    try {
      // A4 landscape for spreads (each spread = 2 pages side by side)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 297; // A4 landscape width
      const pageHeight = 210; // A4 landscape height

      // Add cover page
      const coverImg = new Image();
      coverImg.src = carlsenCover;
      await new Promise(resolve => {
        coverImg.onload = resolve;
        coverImg.onerror = resolve;
      });

      if (coverImg.complete && coverImg.naturalWidth > 0) {
        pdf.addImage(coverImg, 'JPEG', 0, 0, pageWidth, pageHeight);
      } else {
        // Fallback cover
        pdf.setFillColor(245, 245, 220); // Bone white
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        pdf.setFont('times', 'bold');
        pdf.setFontSize(48);
        pdf.setTextColor(44, 44, 44);
        pdf.text('Carlsen in Color', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
        pdf.setFont('times', 'italic');
        pdf.setFontSize(24);
        pdf.text('100 Masterpieces of Magnus Carlsen', pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
      }

      // Add title page
      pdf.addPage();
      pdf.setFillColor(245, 245, 220);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.setFont('times', 'bold');
      pdf.setFontSize(36);
      pdf.setTextColor(44, 44, 44);
      pdf.text('Carlsen in Color', pageWidth / 2, 60, { align: 'center' });
      pdf.setFont('times', 'italic');
      pdf.setFontSize(18);
      pdf.text('100 Masterpieces of Magnus Carlsen', pageWidth / 2, 80, { align: 'center' });
      pdf.setFont('times', 'normal');
      pdf.setFontSize(12);
      pdf.text('Visualized with the En Pensent System', pageWidth / 2, 100, { align: 'center' });
      pdf.text('Hot & Cold Palette', pageWidth / 2, 115, { align: 'center' });

      // Add legend page
      pdf.addPage();
      pdf.setFillColor(245, 245, 220);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.setFont('times', 'bold');
      pdf.setFontSize(24);
      pdf.text('How to Read the Visualizations', pageWidth / 2, 30, { align: 'center' });
      
      pdf.setFont('times', 'normal');
      pdf.setFontSize(12);
      const legendText = [
        'Each visualization maps the journey of every piece across the 64 squares.',
        '',
        'White pieces are shown in cool tones (blues, teals, purples).',
        'Black pieces are shown in warm tones (reds, oranges, magentas).',
        '',
        'When multiple pieces visit the same square, their colors layer',
        'creating a unique visual fingerprint of the game.',
        '',
        'The resulting abstract artwork captures the essence of each',
        "masterpiece from Magnus Carlsen's legendary career.",
      ];
      
      legendText.forEach((line, i) => {
        pdf.text(line, pageWidth / 2, 60 + (i * 12), { align: 'center' });
      });

      // Add game spreads
      const completedSpreads = spreads.filter(s => s.status === 'complete');
      
      for (let i = 0; i < completedSpreads.length; i++) {
        const spread = completedSpreads[i];
        pdf.addPage();
        
        // Bone white background
        pdf.setFillColor(245, 245, 220);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        
        const halfWidth = pageWidth / 2;
        
        // LEFT PAGE - Haiku
        pdf.setDrawColor(200, 200, 200);
        pdf.line(halfWidth, 20, halfWidth, pageHeight - 20);
        
        // Game title (small caps style)
        pdf.setFont('times', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(107, 107, 107);
        pdf.text(spread.game.title.toUpperCase(), halfWidth / 2, 50, { align: 'center' });
        
        // Haiku
        pdf.setFont('times', 'italic');
        pdf.setFontSize(18);
        pdf.setTextColor(44, 44, 44);
        const haikuLines = spread.haiku.split('\n').filter(l => l.trim());
        haikuLines.forEach((line, lineIndex) => {
          pdf.text(line, halfWidth / 2, 85 + (lineIndex * 18), { align: 'center' });
        });
        
        // Game info
        pdf.setFont('times', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(107, 107, 107);
        pdf.text(`${spread.game.white} vs ${spread.game.black}`, halfWidth / 2, 150, { align: 'center' });
        pdf.text(`${spread.game.event}, ${spread.game.year}`, halfWidth / 2, 162, { align: 'center' });
        
        // Page number (left)
        pdf.setFontSize(9);
        pdf.text(`${(i + 1) * 2}`, 20, pageHeight - 15);
        
        // RIGHT PAGE - Visualization
        if (spread.visualizationImage) {
          try {
            const imgSize = Math.min(halfWidth - 30, pageHeight - 60);
            const imgX = halfWidth + (halfWidth - imgSize) / 2;
            const imgY = (pageHeight - imgSize) / 2;
            pdf.addImage(spread.visualizationImage, 'PNG', imgX, imgY, imgSize, imgSize);
          } catch (imgError) {
            console.error('Error adding visualization image:', imgError);
            pdf.setFont('times', 'italic');
            pdf.setFontSize(12);
            pdf.setTextColor(107, 107, 107);
            pdf.text('Visualization', halfWidth + halfWidth / 2, pageHeight / 2, { align: 'center' });
          }
        }
        
        // Rank badge
        pdf.setFont('times', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(107, 107, 107);
        pdf.text(`#${spread.game.rank}`, pageWidth - 20, 25, { align: 'right' });
        
        // Page number (right)
        pdf.text(`${(i + 1) * 2 + 1}`, pageWidth - 20, pageHeight - 15, { align: 'right' });
      }

      // Add colophon
      pdf.addPage();
      pdf.setFillColor(245, 245, 220);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.setFont('times', 'italic');
      pdf.setFontSize(12);
      pdf.setTextColor(107, 107, 107);
      pdf.text('Colophon', pageWidth / 2, 60, { align: 'center' });
      pdf.setFont('times', 'normal');
      pdf.setFontSize(10);
      const colophonText = [
        'Carlsen in Color: 100 Masterpieces of Magnus Carlsen',
        '',
        'Visualizations created with the En Pensent system',
        'using the Hot & Cold color palette.',
        '',
        'Haiku poetry generated with AI assistance.',
        '',
        `Generated on ${new Date().toLocaleDateString()}`,
        '',
        '© En Pensent',
      ];
      colophonText.forEach((line, i) => {
        pdf.text(line, pageWidth / 2, 90 + (i * 12), { align: 'center' });
      });

      // Save PDF
      pdf.save('Carlsen-in-Color.pdf');
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const currentSpread = spreads[previewIndex];

  return (
    <div className="min-h-screen bg-[#F5F5DC] text-[#2C2C2C]">
      {/* Header */}
      <header className="border-b border-[#D4D4C4] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-serif font-bold">Carlsen in Color</h1>
              <p className="text-sm text-[#6B6B6B]">Book Generator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-[#2C2C2C]">
              {completedCount}/{spreads.length} Complete
            </Badge>
            {errorCount > 0 && (
              <Badge variant="destructive">
                {errorCount} Errors
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <Card className="lg:col-span-1 bg-white/50 border-[#D4D4C4]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Generation Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {!isGenerating ? (
                  <Button 
                    onClick={startGeneration}
                    className="col-span-2 bg-[#2C2C2C] hover:bg-[#1C1C1C]"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {currentIndex > 0 ? 'Resume' : 'Start'} Generation
                  </Button>
                ) : (
                  <Button 
                    onClick={pauseGeneration}
                    variant="outline"
                    className="col-span-2 border-[#2C2C2C]"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                
                <Button 
                  onClick={resetGeneration}
                  variant="outline"
                  className="border-[#D4D4C4]"
                  disabled={isGenerating}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                
                <Button 
                  onClick={exportToPDF}
                  disabled={completedCount === 0 || isExporting}
                  className="bg-amber-700 hover:bg-amber-800"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export PDF
                </Button>
              </div>

              <Separator className="bg-[#D4D4C4]" />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{completedCount}</div>
                  <div className="text-xs text-[#6B6B6B]">Complete</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{spreads.filter(s => s.status === 'generating').length}</div>
                  <div className="text-xs text-[#6B6B6B]">In Progress</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{errorCount}</div>
                  <div className="text-xs text-[#6B6B6B]">Errors</div>
                </div>
              </div>

              <Separator className="bg-[#D4D4C4]" />

              {/* Game List */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Games</h3>
                <ScrollArea className="h-[300px] rounded border border-[#D4D4C4]">
                  <div className="p-2 space-y-1">
                    {spreads.map((spread, index) => (
                      <button
                        key={spread.game.id}
                        onClick={() => setPreviewIndex(index)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          previewIndex === index 
                            ? 'bg-[#2C2C2C] text-white' 
                            : 'hover:bg-[#E8E8D8]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate flex-1">
                            #{spread.game.rank} {spread.game.title}
                          </span>
                          {spread.status === 'complete' && (
                            <CheckCircle2 className="w-4 h-4 text-green-600 ml-2 flex-shrink-0" />
                          )}
                          {spread.status === 'generating' && (
                            <Loader2 className="w-4 h-4 text-amber-600 ml-2 flex-shrink-0 animate-spin" />
                          )}
                          {spread.status === 'error' && (
                            <XCircle className="w-4 h-4 text-red-600 ml-2 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card className="lg:col-span-2 bg-white/50 border-[#D4D4C4]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Spread Preview - #{currentSpread.game.rank}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Book Spread Preview */}
              <div className="rounded-lg overflow-hidden shadow-xl border border-[#D4D4C4]">
                <BookSpread
                  game={currentSpread.game}
                  haiku={currentSpread.haiku || 'Generating haiku...\nPoetry takes time to craft\nPatience, chess master'}
                  visualizationImage={currentSpread.visualizationImage}
                  pageNumber={currentSpread.game.rank}
                />
              </div>

              {/* Spread Info */}
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#E8E8D8]">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">Haiku Status</span>
                  </div>
                  <p className="text-sm text-[#6B6B6B]">
                    {currentSpread.haiku 
                      ? 'Generated successfully' 
                      : currentSpread.status === 'generating' 
                        ? 'Generating...'
                        : 'Pending'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#E8E8D8]">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-4 h-4" />
                    <span className="font-medium">Visualization Status</span>
                  </div>
                  <p className="text-sm text-[#6B6B6B]">
                    {currentSpread.visualizationImage 
                      ? 'Rendered successfully' 
                      : currentSpread.status === 'generating' 
                        ? 'Rendering...'
                        : 'Pending'}
                  </p>
                </div>
              </div>

              {/* Game Details */}
              <div className="mt-4 p-4 rounded-lg bg-[#E8E8D8]">
                <h4 className="font-medium mb-2">{currentSpread.game.title}</h4>
                <p className="text-sm text-[#6B6B6B] mb-2">
                  {currentSpread.game.white} vs {currentSpread.game.black}
                </p>
                <p className="text-sm text-[#6B6B6B] mb-2">
                  {currentSpread.game.event}, {currentSpread.game.year} • {currentSpread.game.result}
                </p>
                <p className="text-sm italic">{currentSpread.game.significance}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookGenerator;
