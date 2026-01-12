import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Play, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { famousGames } from '@/lib/chess/famousGames';
import { simulateGame, SquareData } from '@/lib/chess/gameSimulator';
import { generatePrintCanvas } from '@/lib/chess/canvasRenderer';
import { supabase } from '@/integrations/supabase/client';
import { createListing } from '@/lib/marketplace/marketplaceApi';
import { Json } from '@/integrations/supabase/types';

// Off-palette random colors that DON'T match En Pensent palettes
const OFF_PALETTE_COLORS = [
  '#2F4F4F', '#8B4513', '#CD853F', '#708090', '#556B2F', '#8B0000',
  '#483D8B', '#2E8B57', '#B8860B', '#4682B4', '#D2691E', '#6B8E23',
  '#9932CC', '#FF6347', '#4169E1', '#32CD32', '#FF4500', '#DA70D6',
  '#00CED1', '#FF69B4', '#8A2BE2', '#00FA9A', '#DC143C', '#00BFFF',
  '#1E90FF', '#ADFF2F', '#FF1493', '#7B68EE', '#20B2AA', '#87CEEB',
];

// Generate a random off-palette color scheme for 12 pieces
function generateOffPaletteColors(): { white: Record<string, string>; black: Record<string, string> } {
  const shuffled = [...OFF_PALETTE_COLORS].sort(() => Math.random() - 0.5);
  return {
    white: {
      k: shuffled[0],
      q: shuffled[1],
      r: shuffled[2],
      b: shuffled[3],
      n: shuffled[4],
      p: shuffled[5],
    },
    black: {
      k: shuffled[6],
      q: shuffled[7],
      r: shuffled[8],
      b: shuffled[9],
      n: shuffled[10],
      p: shuffled[11],
    },
  };
}

// Apply custom colors to a simulated board
function applyCustomColorsToBoard(
  board: SquareData[][],
  colors: { white: Record<string, string>; black: Record<string, string> }
): SquareData[][] {
  return board.map(rank =>
    rank.map(square => ({
      ...square,
      visits: square.visits.map(visit => ({
        ...visit,
        hexColor: colors[visit.color][visit.piece],
      })),
    }))
  );
}

// Generate creative titles for non-branded visions
const CREATIVE_TITLES = [
  'Sunset Clash', 'Ocean Depths', 'Earth Tones', 'Forest Canopy', 'Copper Age',
  'Midnight Purple', 'Rustic Charm', 'Steel Gray', 'Olive Grove', 'Slate Dreams',
  'Berry Burst', 'Sandy Beach', 'Wine Country', 'Mint Fresh', 'Mahogany Dreams',
  'Arctic Ice', 'Coral Reef', 'Lavender Fields', 'Bronze Medal', 'Neon Nights',
  'Autumn Leaves', 'Crystal Cave', 'Desert Dusk', 'Emerald City', 'Fire Dance',
  'Golden Hour', 'Horizon Blue', 'Ivory Tower', 'Jade Garden', 'Karma Colors',
  'Lunar Light', 'Mosaic Dream', 'Noble Stone', 'Opal Shine', 'Pearl Mist',
  'Quartz Rose', 'Ruby Glow', 'Sapphire Sky', 'Topaz Trail', 'Urban Edge',
  'Velvet Night', 'Whisper Gray', 'Xenon Flash', 'Yellow Brick', 'Zen Garden',
  'Alpine Snow', 'Bamboo Grove', 'Citrus Burst', 'Driftwood', 'Electric Storm',
];

interface SeedResult {
  title: string;
  success: boolean;
  error?: string;
  visualizationId?: string;
  listingId?: string;
}

const AdminSeedMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState('');
  const [results, setResults] = useState<SeedResult[]>([]);
  const [totalCount, setTotalCount] = useState(50);

  const generateVisualization = useCallback(async (
    game: typeof famousGames[0],
    title: string,
    priceRange: { min: number; max: number }
  ): Promise<SeedResult> => {
    try {
      // Simulate the game
      const simulation = simulateGame(game.pgn);
      
      // Apply random off-palette colors
      const customColors = generateOffPaletteColors();
      const coloredBoard = applyCustomColorsToBoard(simulation.board, customColors);
      
      // Generate the print canvas
      const canvas = await generatePrintCanvas(coloredBoard, simulation.gameData, {
        boardSize: 600,
        darkMode: false,
        withWatermark: false,
        title: title,
      });
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png', 0.95);
      });
      
      // Upload to storage
      const timestamp = Date.now();
      const filename = `${user!.id}/${timestamp}-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('visualizations')
        .upload(filename, blob, {
          contentType: 'image/png',
          upsert: false,
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('visualizations')
        .getPublicUrl(filename);
      
      // Prepare game_data
      const gameDataJson: Json = {
        white: simulation.gameData.white,
        black: simulation.gameData.black,
        event: simulation.gameData.event,
        date: simulation.gameData.date,
        result: simulation.gameData.result,
        pgn: simulation.gameData.pgn,
        moves: simulation.gameData.moves,
        board: coloredBoard as unknown as Json,
        totalMoves: simulation.totalMoves,
        visualizationState: {
          paletteId: 'custom',
          darkMode: false,
          currentMove: Infinity,
          customColors: customColors,
        } as unknown as Json,
      };
      
      // Save to database
      const { data: vizData, error: dbError } = await supabase
        .from('saved_visualizations')
        .insert({
          user_id: user!.id,
          title,
          pgn: game.pgn,
          game_data: gameDataJson,
          image_path: urlData.publicUrl,
        })
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      // Create marketplace listing with random price in range
      const priceCents = Math.floor(Math.random() * (priceRange.max - priceRange.min + 1)) + priceRange.min;
      const { data: listingData, error: listingError } = await createListing(vizData.id, priceCents);
      
      if (listingError) throw listingError;
      
      // Create vision score with small fungible values
      const viewCount = Math.floor(Math.random() * 20) + 5;
      const hdCount = Math.floor(Math.random() * 5);
      const gifCount = Math.floor(Math.random() * 3);
      
      await supabase.rpc('record_vision_interaction', {
        p_visualization_id: vizData.id,
        p_user_id: user!.id,
        p_interaction_type: 'view',
      });
      
      return {
        title,
        success: true,
        visualizationId: vizData.id,
        listingId: listingData?.id,
      };
    } catch (error) {
      console.error('Failed to generate vision:', error);
      return {
        title,
        success: false,
        error: (error as Error).message,
      };
    }
  }, [user]);

  const handleSeed = async () => {
    if (!user) {
      toast.error('You must be logged in as the CEO account');
      return;
    }
    
    setIsSeeding(true);
    setResults([]);
    setProgress(0);
    
    const allResults: SeedResult[] = [];
    const gamesToUse = famousGames.slice(0, Math.min(totalCount, famousGames.length));
    
    // Use each game multiple times if needed, with different titles
    const expandedGames: Array<{ game: typeof famousGames[0]; title: string }> = [];
    let titleIndex = 0;
    
    while (expandedGames.length < totalCount && titleIndex < CREATIVE_TITLES.length) {
      const gameIndex = expandedGames.length % gamesToUse.length;
      expandedGames.push({
        game: gamesToUse[gameIndex],
        title: CREATIVE_TITLES[titleIndex],
      });
      titleIndex++;
    }
    
    for (let i = 0; i < expandedGames.length; i++) {
      const { game, title } = expandedGames[i];
      setCurrentItem(`${title} (${i + 1}/${expandedGames.length})`);
      
      const result = await generateVisualization(game, title, { min: 199, max: 999 });
      allResults.push(result);
      setResults([...allResults]);
      setProgress(((i + 1) / expandedGames.length) * 100);
      
      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsSeeding(false);
    
    const successCount = allResults.filter(r => r.success).length;
    const failCount = allResults.filter(r => !r.success).length;
    
    if (successCount > 0) {
      toast.success(`Created ${successCount} visions`, {
        description: failCount > 0 ? `${failCount} failed` : undefined,
      });
    } else {
      toast.error('Failed to create any visions');
    }
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/marketplace')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Marketplace
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              Seed Marketplace with Visions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-600">CEO Only</p>
                  <p className="text-sm text-muted-foreground">
                    This will generate {totalCount} non-branded visions with random off-palette colors 
                    and list them on the marketplace at $1.99-$9.99 each.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="text-sm text-muted-foreground">Number of visions:</label>
              <select
                value={totalCount}
                onChange={(e) => setTotalCount(Number(e.target.value))}
                disabled={isSeeding}
                className="bg-muted border border-border rounded px-3 py-2"
              >
                <option value={5}>5 (test)</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <Button
              onClick={handleSeed}
              disabled={isSeeding || !user}
              className="w-full"
              size="lg"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start Seeding
                </>
              )}
            </Button>
            
            {isSeeding && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  {currentItem}
                </p>
              </div>
            )}
            
            {results.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    {successCount} successful
                  </span>
                  {failCount > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <XCircle className="h-4 w-4" />
                      {failCount} failed
                    </span>
                  )}
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                  {results.map((result, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`text-sm p-2 rounded ${
                        result.success 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-red-500/10 text-red-600'
                      }`}
                    >
                      {result.success ? '✓' : '✗'} {result.title}
                      {result.error && (
                        <span className="text-xs ml-2 opacity-70">({result.error})</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSeedMarketplace;
