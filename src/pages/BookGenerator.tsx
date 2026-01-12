import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Download, 
  Pause, 
  RotateCcw, 
  Image as ImageIcon,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  Zap,
  PlayCircle,
  Save,
  RefreshCw,
  ImageDown,
  FolderDown,
  Archive
} from 'lucide-react';
import { carlsenTop100, CarlsenGame } from '@/lib/book/carlsenGames';
import { BookSpread } from '@/components/book/BookSpread';
import { simulateGame } from '@/lib/chess/gameSimulator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { jsPDF } from 'jspdf';
import carlsenCover from '@/assets/book/carlsen-cover.jpg';

// CEO access control
const CEO_EMAIL = 'a.arthur.shelton@gmail.com';

interface GeneratedSpread {
  game: CarlsenGame;
  haiku: string;
  visualizationImage: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
}

interface SavedProgress {
  game_index: number;
  haiku: string | null;
  visualization_data: string | null;
  status: string;
}

const BookGenerator: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
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
  const [batchSize, setBatchSize] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [generatingSingleIndex, setGeneratingSingleIndex] = useState<number | null>(null);
  const [isExportingImages, setIsExportingImages] = useState(false);
  const [exportingIndex, setExportingIndex] = useState<number | null>(null);
  const [imageExportProgress, setImageExportProgress] = useState(0);
  const pauseRef = React.useRef(false);

  // Check CEO authorization
  useEffect(() => {
    const checkAuthorization = async () => {
      if (authLoading) return;
      
      if (!user) {
        setIsAuthorized(false);
        setCheckingAuth(false);
        return;
      }

      // Check if user email matches CEO
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email?.toLowerCase();
      
      setIsAuthorized(email === CEO_EMAIL);
      setCheckingAuth(false);
    };

    checkAuthorization();
  }, [user, authLoading]);

  // Load saved progress on mount
  useEffect(() => {
    if (isAuthorized && user) {
      loadSavedProgress();
    }
  }, [isAuthorized, user]);

  const loadSavedProgress = async () => {
    if (!user) return;
    
    setIsLoadingProgress(true);
    try {
      const { data, error } = await supabase
        .from('book_generation_progress')
        .select('game_index, haiku, visualization_data, status')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        setSpreads(prev => {
          const updated = [...prev];
          (data as SavedProgress[]).forEach(saved => {
            if (saved.game_index >= 0 && saved.game_index < updated.length) {
              updated[saved.game_index] = {
                ...updated[saved.game_index],
                haiku: saved.haiku || '',
                visualizationImage: saved.visualization_data || '',
                status: saved.status as 'pending' | 'generating' | 'complete' | 'error',
              };
            }
          });
          return updated;
        });
        toast.success(`Loaded ${data.length} saved spreads`);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
      toast.error('Failed to load saved progress');
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const saveProgressToDatabase = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const completedSpreads = spreads
        .map((spread, index) => ({ spread, index }))
        .filter(({ spread }) => spread.status === 'complete');

      if (completedSpreads.length === 0) {
        toast.info('No completed spreads to save');
        setIsSaving(false);
        return;
      }

      // Upsert all completed spreads
      const upsertData = completedSpreads.map(({ spread, index }) => ({
        user_id: user.id,
        game_index: index,
        game_title: spread.game.title,
        haiku: spread.haiku,
        visualization_data: spread.visualizationImage,
        status: spread.status,
      }));

      const { error } = await supabase
        .from('book_generation_progress')
        .upsert(upsertData, { 
          onConflict: 'user_id,game_index',
          ignoreDuplicates: false 
        });

      if (error) throw error;
      toast.success(`Saved ${completedSpreads.length} spreads to database`);
    } catch (error) {
      console.error('Failed to save progress:', error);
      toast.error('Failed to save progress');
    } finally {
      setIsSaving(false);
    }
  };

  const saveSingleSpread = async (index: number) => {
    if (!user) return;
    
    const spread = spreads[index];
    if (spread.status !== 'complete') return;

    try {
      const { error } = await supabase
        .from('book_generation_progress')
        .upsert({
          user_id: user.id,
          game_index: index,
          game_title: spread.game.title,
          haiku: spread.haiku,
          visualization_data: spread.visualizationImage,
          status: spread.status,
        }, { 
          onConflict: 'user_id,game_index',
          ignoreDuplicates: false 
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save spread:', error);
    }
  };

  const completedCount = spreads.filter(s => s.status === 'complete').length;
  const errorCount = spreads.filter(s => s.status === 'error').length;
  const generatingCount = spreads.filter(s => s.status === 'generating').length;
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

  const generateSpread = async (index: number, autoSave = false): Promise<boolean> => {
    const currentSpread = spreads[index];
    if (!currentSpread || currentSpread.status === 'complete') return true;
    
    const game = currentSpread.game;
    
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
      
      // Auto-save after batch generation
      if (autoSave) {
        setTimeout(() => saveSingleSpread(index), 100);
      }
      
      return true;
    } catch (error) {
      console.error(`Error generating spread ${index}:`, error);
      setSpreads(prev => prev.map((s, i) => 
        i === index ? { ...s, status: 'error' } : s
      ));
      return false;
    }
  };

  // Generate single spread for testing
  const generateSingleSpread = async (index: number) => {
    setGeneratingSingleIndex(index);
    setPreviewIndex(index);
    toast.info(`Generating spread #${index + 1}: ${spreads[index].game.title}`);
    
    const success = await generateSpread(index, true);
    
    if (success) {
      toast.success(`Spread #${index + 1} generated successfully!`);
    } else {
      toast.error(`Failed to generate spread #${index + 1}`);
    }
    
    setGeneratingSingleIndex(null);
  };

  // Batch parallel generation with auto-save
  const startBatchGeneration = useCallback(async () => {
    setIsGenerating(true);
    pauseRef.current = false;
    
    // Get indices of pending/error spreads
    const pendingIndices = spreads
      .map((s, i) => ({ status: s.status, index: i }))
      .filter(s => s.status === 'pending' || s.status === 'error')
      .map(s => s.index);

    toast.info(`Starting batch generation of ${pendingIndices.length} spreads (${batchSize} parallel)`);

    // Process in batches
    for (let i = 0; i < pendingIndices.length; i += batchSize) {
      if (pauseRef.current) {
        toast.info('Generation paused - saving progress...');
        await saveProgressToDatabase();
        break;
      }

      const batch = pendingIndices.slice(i, i + batchSize);
      setCurrentIndex(batch[0]);
      
      // Run batch in parallel with auto-save
      await Promise.all(batch.map(index => generateSpread(index, true)));
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < pendingIndices.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setIsGenerating(false);
    
    if (!pauseRef.current) {
      // Final save and count
      await saveProgressToDatabase();
      const newCompleted = spreads.filter(s => s.status === 'complete').length;
      toast.success(`Generation complete! ${newCompleted} spreads ready and saved.`);
    }
  }, [spreads, batchSize, user]);

  const pauseGeneration = () => {
    pauseRef.current = true;
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

  // Generate high-resolution 300 DPI spread image (3600x2520 for 12"x8.4" at 300 DPI)
  const generateHighResSpreadImage = async (spread: GeneratedSpread): Promise<string> => {
    const html2canvas = (await import('html2canvas')).default;
    
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '1200px'; // Base width, will be scaled up
    document.body.appendChild(container);
    
    try {
      const React = await import('react');
      const ReactDOM = await import('react-dom/client');
      const { BookSpread } = await import('@/components/book/BookSpread');
      
      const spreadElement = document.createElement('div');
      container.appendChild(spreadElement);
      
      const root = ReactDOM.createRoot(spreadElement);
      await new Promise<void>((resolve) => {
        root.render(
          React.createElement(BookSpread, {
            game: spread.game,
            haiku: spread.haiku,
            visualizationImage: spread.visualizationImage,
            pageNumber: spread.game.rank,
          })
        );
        setTimeout(resolve, 200);
      });
      
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Capture at 3x scale for 300 DPI (standard screen is ~100 DPI)
      const canvas = await html2canvas(spreadElement, {
        scale: 3, // 3x scale = ~300 DPI output
        backgroundColor: '#F5F5DC',
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 1200,
        height: 840, // 1.4:1 aspect ratio
      });
      
      const base64 = canvas.toDataURL('image/png', 1.0);
      root.unmount();
      
      return base64;
    } finally {
      document.body.removeChild(container);
    }
  };

  // Export single spread as high-res image
  const exportSingleSpreadImage = async (index: number) => {
    const spread = spreads[index];
    if (spread.status !== 'complete') {
      toast.error('This spread is not yet generated');
      return;
    }
    
    setExportingIndex(index);
    toast.info(`Generating high-res image for spread #${index + 1}...`);
    
    try {
      const imageData = await generateHighResSpreadImage(spread);
      
      // Create download link
      const link = document.createElement('a');
      link.href = imageData;
      link.download = `carlsen-spread-${String(spread.game.rank).padStart(3, '0')}-${spread.game.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloaded spread #${spread.game.rank} (300 DPI)`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export image');
    } finally {
      setExportingIndex(null);
    }
  };

  // Export all completed spreads as individual high-res images
  const exportAllSpreadImages = async () => {
    const completedSpreads = spreads.filter(s => s.status === 'complete');
    
    if (completedSpreads.length === 0) {
      toast.error('No completed spreads to export');
      return;
    }
    
    setIsExportingImages(true);
    setImageExportProgress(0);
    toast.info(`Starting export of ${completedSpreads.length} high-res images...`);
    
    try {
      for (let i = 0; i < completedSpreads.length; i++) {
        const spread = completedSpreads[i];
        
        try {
          const imageData = await generateHighResSpreadImage(spread);
          
          // Create download link
          const link = document.createElement('a');
          link.href = imageData;
          link.download = `carlsen-spread-${String(spread.game.rank).padStart(3, '0')}-${spread.game.id}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Small delay between downloads to prevent browser issues
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to export spread ${spread.game.rank}:`, error);
        }
        
        setImageExportProgress(((i + 1) / completedSpreads.length) * 100);
      }
      
      toast.success(`Exported ${completedSpreads.length} high-res images (300 DPI)`);
    } catch (error) {
      console.error('Batch export failed:', error);
      toast.error('Failed to export images');
    } finally {
      setIsExportingImages(false);
      setImageExportProgress(0);
    }
  };

  // Export all completed spreads as a single ZIP archive with cover and TOC
  const exportAsZip = async () => {
    const completedSpreads = spreads.filter(s => s.status === 'complete');
    
    if (completedSpreads.length === 0) {
      toast.error('No completed spreads to export');
      return;
    }
    
    setIsExportingImages(true);
    setImageExportProgress(0);
    toast.info(`Creating ZIP archive with cover, TOC, and ${completedSpreads.length} high-res images...`);
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Create main folder
      const mainFolder = zip.folder('carlsen-in-color');
      const spreadsFolder = mainFolder?.folder('spreads');
      
      // Add cover image
      try {
        const coverResponse = await fetch(carlsenCover);
        const coverBlob = await coverResponse.blob();
        const coverBuffer = await coverBlob.arrayBuffer();
        mainFolder?.file('00-cover.jpg', coverBuffer);
      } catch (coverError) {
        console.warn('Could not add cover to ZIP:', coverError);
      }
      
      // Generate Table of Contents (README.md)
      const tocContent = generateTableOfContents(completedSpreads);
      mainFolder?.file('README.md', tocContent);
      
      // Generate metadata JSON
      const metadata = generateMetadataJson(completedSpreads);
      mainFolder?.file('metadata.json', JSON.stringify(metadata, null, 2));
      
      // Add each spread
      for (let i = 0; i < completedSpreads.length; i++) {
        const spread = completedSpreads[i];
        
        try {
          const imageData = await generateHighResSpreadImage(spread);
          const base64Data = imageData.split(',')[1];
          const filename = `spread-${String(spread.game.rank).padStart(3, '0')}-${spread.game.id}.png`;
          spreadsFolder?.file(filename, base64Data, { base64: true });
        } catch (error) {
          console.error(`Failed to add spread ${spread.game.rank} to ZIP:`, error);
        }
        
        setImageExportProgress(((i + 1) / completedSpreads.length) * 100);
      }
      
      // Generate ZIP file
      toast.info('Compressing archive...');
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `carlsen-in-color-complete-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded complete archive: cover, TOC, metadata, and ${completedSpreads.length} spreads`);
    } catch (error) {
      console.error('ZIP export failed:', error);
      toast.error('Failed to create ZIP archive');
    } finally {
      setIsExportingImages(false);
      setImageExportProgress(0);
    }
  };

  // Generate Table of Contents markdown
  const generateTableOfContents = (completedSpreads: GeneratedSpread[]): string => {
    const now = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    let toc = `# Carlsen in Color
## 100 Masterpieces of Magnus Carlsen

**Generated:** ${now}
**Format:** 300 DPI Print-Ready PNG (3600×2520px)
**Spreads Included:** ${completedSpreads.length}

---

## About This Collection

This archive contains high-resolution book spreads from "Carlsen in Color," 
a visual celebration of Magnus Carlsen's greatest chess games, rendered 
through the En Pensent visualization system with AI-generated haiku poetry.

Each spread features:
- Left page: Original haiku inspired by the game
- Right page: En Pensent visualization using the Hot & Cold palette

---

## Table of Contents

| # | Title | Players | Event | Year | Result |
|---|-------|---------|-------|------|--------|
`;

    completedSpreads.forEach(spread => {
      toc += `| ${spread.game.rank} | ${spread.game.title} | ${spread.game.white} vs ${spread.game.black} | ${spread.game.event} | ${spread.game.year} | ${spread.game.result} |\n`;
    });

    toc += `
---

## Print Specifications

- **Recommended Paper:** 100lb gloss text or matte art paper
- **Binding:** Smyth-sewn hardcover
- **Trim Size:** 12" × 8.4" (spread, folded to 6" × 8.4" per page)
- **Color Profile:** sRGB

---

## Order Physical Copies

Visit [enpensent.com/shop](https://enpensent.com/shop) to order professionally 
printed copies of "Carlsen in Color."

- **Standard Edition (8.5"×11"):** $79.99
- **Large Format (11"×14"):** $99.99

---

© En Pensent • All Rights Reserved
`;

    return toc;
  };

  // Generate metadata JSON for each spread
  const generateMetadataJson = (completedSpreads: GeneratedSpread[]) => {
    return {
      title: "Carlsen in Color: 100 Masterpieces of Magnus Carlsen",
      version: "1.0",
      generated: new Date().toISOString(),
      palette: "Hot & Cold",
      format: {
        resolution: "300 DPI",
        dimensions: "3600×2520px",
        fileType: "PNG"
      },
      spreads: completedSpreads.map(spread => ({
        rank: spread.game.rank,
        id: spread.game.id,
        title: spread.game.title,
        white: spread.game.white,
        black: spread.game.black,
        event: spread.game.event,
        year: spread.game.year,
        result: spread.game.result,
        significance: spread.game.significance,
        haiku: spread.haiku.split('\n').filter(l => l.trim()),
        filename: `spreads/spread-${String(spread.game.rank).padStart(3, '0')}-${spread.game.id}.png`
      })),
      ordering: {
        standardEdition: {
          price: "$79.99",
          size: "8.5×11 inches",
          weight: "2.5 lbs"
        },
        largeFormat: {
          price: "$99.99", 
          size: "11×14 inches",
          weight: "4 lbs"
        },
        url: "https://enpensent.com/shop"
      }
    };
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

  // Authorization check
  if (checkingAuth || authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#2C2C2C]" />
          <p className="text-[#6B6B6B]">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center">
        <Card className="max-w-md bg-white/80 border-[#D4D4C4]">
          <CardHeader className="text-center">
            <Lock className="w-16 h-16 mx-auto mb-4 text-[#6B6B6B]" />
            <CardTitle className="font-serif">Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-[#6B6B6B]">
              The Book Generator is exclusively available to authorized personnel.
            </p>
            <p className="text-sm text-[#9B9B9B]">
              Please sign in with an authorized account to access this feature.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="border-[#2C2C2C]"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5DC] text-[#2C2C2C]">
      {/* Header */}
      <header className="border-b border-[#D4D4C4] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-serif font-bold">Carlsen in Color</h1>
              <p className="text-sm text-[#6B6B6B]">Book Generator • CEO Access</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-amber-600 text-amber-700">
              <Zap className="w-3 h-3 mr-1" />
              Batch: {batchSize} parallel
            </Badge>
            <Badge variant="outline" className="border-[#2C2C2C]">
              {completedCount}/{spreads.length} Complete
            </Badge>
            {generatingCount > 0 && (
              <Badge className="bg-amber-600">
                {generatingCount} In Progress
              </Badge>
            )}
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

              {/* Batch Size Control */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Parallel Batch Size
                  </span>
                  <span className="font-mono">{batchSize}</span>
                </div>
                <Slider
                  value={[batchSize]}
                  onValueChange={(value) => setBatchSize(value[0])}
                  min={1}
                  max={10}
                  step={1}
                  disabled={isGenerating}
                  className="w-full"
                />
                <p className="text-xs text-[#6B6B6B]">
                  Higher values = faster but may hit rate limits
                </p>
              </div>

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {!isGenerating ? (
                  <Button 
                    onClick={startBatchGeneration}
                    className="col-span-2 bg-[#2C2C2C] hover:bg-[#1C1C1C]"
                    disabled={isLoadingProgress}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {completedCount > 0 ? 'Resume' : 'Start'} Batch Generation
                  </Button>
                ) : (
                  <Button 
                    onClick={pauseGeneration}
                    variant="outline"
                    className="col-span-2 border-[#2C2C2C]"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause & Save
                  </Button>
                )}
                
                {/* Generate Single Spread Button */}
                <Button 
                  onClick={() => generateSingleSpread(previewIndex)}
                  variant="outline"
                  className="col-span-2 border-amber-600 text-amber-700 hover:bg-amber-50"
                  disabled={isGenerating || generatingSingleIndex !== null || spreads[previewIndex]?.status === 'complete'}
                >
                  {generatingSingleIndex === previewIndex ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <PlayCircle className="w-4 h-4 mr-2" />
                  )}
                  Generate Single Spread #{previewIndex + 1}
                </Button>
                
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
                  onClick={saveProgressToDatabase}
                  variant="outline"
                  className="border-green-600 text-green-700 hover:bg-green-50"
                  disabled={isGenerating || isSaving || completedCount === 0}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Progress
                </Button>
                
                <Button 
                  onClick={loadSavedProgress}
                  variant="outline"
                  className="border-blue-600 text-blue-700 hover:bg-blue-50"
                  disabled={isGenerating || isLoadingProgress}
                >
                  {isLoadingProgress ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Load Saved
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

              {/* High-Res Image Export Section */}
              <div className="space-y-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <h4 className="text-sm font-medium text-purple-900 flex items-center gap-2">
                  <ImageDown className="w-4 h-4" />
                  300 DPI High-Res Export
                </h4>
                <p className="text-xs text-purple-700">
                  Export individual spreads as print-ready PNG files (3600×2520px)
                </p>
                
                {isExportingImages && (
                  <div className="space-y-1">
                    <Progress value={imageExportProgress} className="h-2" />
                    <p className="text-xs text-purple-600 text-center">
                      {Math.round(imageExportProgress)}% complete
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => exportSingleSpreadImage(previewIndex)}
                    variant="outline"
                    size="sm"
                    className="border-purple-400 text-purple-700 hover:bg-purple-100"
                    disabled={isExportingImages || exportingIndex !== null || spreads[previewIndex]?.status !== 'complete'}
                  >
                    {exportingIndex === previewIndex ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <ImageDown className="w-3 h-3 mr-1" />
                    )}
                    Export #{previewIndex + 1}
                  </Button>
                  
                  <Button 
                    onClick={exportAllSpreadImages}
                    variant="outline"
                    size="sm"
                    className="border-purple-400 text-purple-700 hover:bg-purple-100"
                    disabled={isExportingImages || completedCount === 0}
                  >
                    {isExportingImages ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <FolderDown className="w-3 h-3 mr-1" />
                    )}
                    Individual
                  </Button>
                  
                  <Button 
                    onClick={exportAsZip}
                    size="sm"
                    className="col-span-2 bg-purple-700 hover:bg-purple-800 text-white"
                    disabled={isExportingImages || completedCount === 0}
                  >
                    {isExportingImages ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Archive className="w-3 h-3 mr-1" />
                    )}
                    Download ZIP ({completedCount} images)
                  </Button>
                </div>
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
