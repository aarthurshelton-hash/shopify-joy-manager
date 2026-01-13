import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Play, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Package, Trash2 } from 'lucide-react';
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
// Note: visit.color is 'w' or 'b' from chess.js, but our colors object uses 'white'/'black'
function applyCustomColorsToBoard(
  board: SquareData[][],
  colors: { white: Record<string, string>; black: Record<string, string> }
): SquareData[][] {
  return board.map(rank =>
    rank.map(square => ({
      ...square,
      visits: square.visits.map(visit => {
        // Map 'w'/'b' to 'white'/'black' for color lookup
        const colorKey = visit.color === 'w' ? 'white' : 'black';
        const pieceColors = colors[colorKey];
        // Safely access the color, fallback to a default if piece key doesn't exist
        const hexColor = pieceColors?.[visit.piece] || '#888888';
        return {
          ...visit,
          hexColor,
        };
      }),
    }))
  );
}

// Generate creative titles for non-branded visions
// First 25 are "Exemplar" editions (company development testers)
const EXEMPLAR_TITLES = [
  'Exemplar №001 • Genesis', 'Exemplar №002 • Prototype', 'Exemplar №003 • Blueprint',
  'Exemplar №004 • Foundation', 'Exemplar №005 • Pioneer', 'Exemplar №006 • Alpha',
  'Exemplar №007 • Benchmark', 'Exemplar №008 • Catalyst', 'Exemplar №009 • Origin',
  'Exemplar №010 • Spectrum', 'Exemplar №011 • Prism', 'Exemplar №012 • Vertex',
  'Exemplar №013 • Meridian', 'Exemplar №014 • Zenith', 'Exemplar №015 • Nexus',
  'Exemplar №016 • Axiom', 'Exemplar №017 • Epoch', 'Exemplar №018 • Vector',
  'Exemplar №019 • Cipher', 'Exemplar №020 • Matrix', 'Exemplar №021 • Helix',
  'Exemplar №022 • Synthesis', 'Exemplar №023 • Thesis', 'Exemplar №024 • Opus',
  'Exemplar №025 • Finale',
];

// Second 25 are creative community-style names
const CREATIVE_TITLES = [
  'Sunset Clash', 'Ocean Depths', 'Earth Tones', 'Forest Canopy', 'Copper Age',
  'Midnight Purple', 'Rustic Charm', 'Steel Gray', 'Olive Grove', 'Slate Dreams',
  'Berry Burst', 'Sandy Beach', 'Wine Country', 'Mint Fresh', 'Mahogany Dreams',
  'Arctic Ice', 'Coral Reef', 'Lavender Fields', 'Bronze Medal', 'Neon Nights',
  'Autumn Leaves', 'Crystal Cave', 'Desert Dusk', 'Emerald City', 'Fire Dance',
];

// Combine: first 25 Exemplars, then 25 creative titles = 50 total
const ALL_TITLES = [...EXEMPLAR_TITLES, ...CREATIVE_TITLES];

interface SeedResult {
  title: string;
  success: boolean;
  error?: string;
  visualizationId?: string;
  listingId?: string;
  isExemplar?: boolean;
}

// Calculate fungible base scores - Exemplars get slightly higher initial recognition
function calculateInitialScores(isExemplar: boolean, index: number) {
  const baseMultiplier = isExemplar ? 1.5 : 1.0;
  // Earlier numbered Exemplars are "rarer" - slight score boost
  const rarityBonus = isExemplar ? Math.max(0, (25 - index) * 0.1) : 0;
  
  return {
    viewCount: Math.floor((Math.random() * 15 + 3) * baseMultiplier + rarityBonus * 5),
    hdDownloads: Math.floor((Math.random() * 3) * baseMultiplier),
    gifDownloads: Math.floor((Math.random() * 2) * baseMultiplier),
    // Exemplars have slight trade history (early adopter activity)
    tradeCount: isExemplar ? Math.floor(Math.random() * 2) : 0,
  };
}

// Calculate price tiers - Exemplars start lower but have growth potential
function calculatePrice(isExemplar: boolean, index: number): number {
  if (isExemplar) {
    // Exemplars: $0.99 - $4.99 (humble beginnings, value grows with platform)
    // Lower numbered = slightly more valuable due to rarity
    const basePrice = 99; // $0.99
    const indexBonus = Math.max(0, (25 - index) * 10); // Up to $2.50 bonus for low numbers
    return basePrice + Math.floor(Math.random() * 300) + indexBonus;
  } else {
    // Community visions: $1.99 - $7.99
    return 199 + Math.floor(Math.random() * 600);
  }
}

const AdminSeedMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState('');
  const [results, setResults] = useState<SeedResult[]>([]);
  const [totalCount, setTotalCount] = useState(50);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStats, setDeleteStats] = useState<{ deleted: number; preserved: number } | null>(null);

  // Check admin status using secure has_role function
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });

      setIsAdmin(data === true);
    };

    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading]);

  const generateVisualization = useCallback(async (
    game: typeof famousGames[0],
    title: string,
    index: number,
    isExemplar: boolean
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
      
      // Prepare game_data with exemplar metadata
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
          isExemplar: isExemplar,
          exemplarNumber: isExemplar ? index + 1 : undefined,
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
      
      // Create marketplace listing with calculated price
      const priceCents = calculatePrice(isExemplar, index);
      const { data: listingData, error: listingError } = await createListing(vizData.id, priceCents);
      
      if (listingError) throw listingError;
      
      // Create vision score with fungible initial values
      const scores = calculateInitialScores(isExemplar, index);
      
      // Record interactions to build the score
      for (let v = 0; v < scores.viewCount; v++) {
        await supabase.rpc('record_vision_interaction', {
          p_visualization_id: vizData.id,
          p_user_id: user!.id,
          p_interaction_type: 'view',
        });
        // Small delay between interactions
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      return {
        title,
        success: true,
        visualizationId: vizData.id,
        listingId: listingData?.id,
        isExemplar,
      };
    } catch (error) {
      console.error('Failed to generate vision:', error);
      return {
        title,
        success: false,
        error: (error as Error).message,
        isExemplar,
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
    
    // Build vision list: first half Exemplars, second half creative
    const expandedGames: Array<{ game: typeof famousGames[0]; title: string; isExemplar: boolean }> = [];
    
    for (let i = 0; i < totalCount; i++) {
      const gameIndex = i % gamesToUse.length;
      const isExemplar = i < 25; // First 25 are Exemplars
      const title = ALL_TITLES[i] || `Vision ${i + 1}`;
      
      expandedGames.push({
        game: gamesToUse[gameIndex],
        title,
        isExemplar,
      });
    }
    
    for (let i = 0; i < expandedGames.length; i++) {
      const { game, title, isExemplar } = expandedGames[i];
      const label = isExemplar ? '🏆' : '🎨';
      setCurrentItem(`${label} ${title} (${i + 1}/${expandedGames.length})`);
      
      const result = await generateVisualization(game, title, i, isExemplar);
      allResults.push(result);
      setResults([...allResults]);
      setProgress(((i + 1) / expandedGames.length) * 100);
      
      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setIsSeeding(false);
    
    const successCount = allResults.filter(r => r.success).length;
    const failCount = allResults.filter(r => !r.success).length;
    const exemplarCount = allResults.filter(r => r.success && r.isExemplar).length;
    
    if (successCount > 0) {
      toast.success(`Created ${successCount} visions`, {
        description: `${exemplarCount} Exemplars, ${successCount - exemplarCount} Creative${failCount > 0 ? ` (${failCount} failed)` : ''}`,
      });
    } else {
      toast.error('Failed to create any visions');
    }
  };

  // Delete admin's test visions (only those without natural value accrual)
  const handleDeleteTestVisions = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'This will delete all YOUR visions that have NOT earned royalties from other users\' print orders.\n\n' +
      'Visions with natural value accrual will be preserved.\n\n' +
      'Are you sure?'
    );
    
    if (!confirmed) return;
    
    setIsDeleting(true);
    setDeleteStats(null);
    
    try {
      // Get all visualizations owned by this admin
      const { data: myVisions, error: fetchError } = await supabase
        .from('saved_visualizations')
        .select('id')
        .eq('user_id', user.id);
      
      if (fetchError) throw fetchError;
      
      if (!myVisions || myVisions.length === 0) {
        toast.info('No visions to delete');
        setIsDeleting(false);
        return;
      }
      
      const visionIds = myVisions.map(v => v.id);
      
      // Get vision scores to check for natural value (royalties from others)
      const { data: scores, error: scoresError } = await supabase
        .from('vision_scores')
        .select('visualization_id, royalty_cents_earned, royalty_orders_count')
        .in('visualization_id', visionIds);
      
      if (scoresError) throw scoresError;
      
      // Identify visions with natural value (royalties earned from other users' orders)
      const visionsWithValue = new Set(
        (scores || [])
          .filter(s => s.royalty_cents_earned > 0 || s.royalty_orders_count > 0)
          .map(s => s.visualization_id)
      );
      
      // Visions to delete (no natural value accrual)
      const visionsToDelete = visionIds.filter(id => !visionsWithValue.has(id));
      const visionsToPreserve = visionIds.filter(id => visionsWithValue.has(id));
      
      if (visionsToDelete.length === 0) {
        toast.info('All your visions have accrued natural value - none deleted');
        setDeleteStats({ deleted: 0, preserved: visionsToPreserve.length });
        setIsDeleting(false);
        return;
      }
      
      // Delete related records first (in order of dependencies)
      // 1. Delete listings
      await supabase
        .from('visualization_listings')
        .delete()
        .in('visualization_id', visionsToDelete);
      
      // 2. Delete vision scores
      await supabase
        .from('vision_scores')
        .delete()
        .in('visualization_id', visionsToDelete);
      
      // 3. Delete vision interactions
      await supabase
        .from('vision_interactions')
        .delete()
        .in('visualization_id', visionsToDelete);
      
      // 4. Delete visualization transfers
      await supabase
        .from('visualization_transfers')
        .delete()
        .in('visualization_id', visionsToDelete);
      
      // 5. Finally delete the visualizations themselves
      const { error: deleteError } = await supabase
        .from('saved_visualizations')
        .delete()
        .in('id', visionsToDelete);
      
      if (deleteError) throw deleteError;
      
      // Also delete stored images from storage
      for (const viz of myVisions.filter(v => visionsToDelete.includes(v.id))) {
        // Extract filename from image path if possible
        // Images are stored as: {user_id}/{timestamp}-{title}.png
        await supabase.storage
          .from('visualizations')
          .remove([`${user.id}/`]); // This will fail silently if path doesn't exist
      }
      
      setDeleteStats({ deleted: visionsToDelete.length, preserved: visionsToPreserve.length });
      toast.success(`Deleted ${visionsToDelete.length} test visions`, {
        description: visionsToPreserve.length > 0 
          ? `${visionsToPreserve.length} visions with natural value preserved`
          : undefined
      });
      
    } catch (error) {
      console.error('Failed to delete test visions:', error);
      toast.error('Failed to delete visions', {
        description: (error as Error).message
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const exemplarSuccessCount = results.filter(r => r.success && r.isExemplar).length;

  // Loading state
  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authorized
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You need admin privileges to access this page.
            </p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                    Generates {totalCount} visions: {Math.min(25, totalCount)} Exemplar editions (numbered testers from our humble beginnings) 
                    + {Math.max(0, totalCount - 25)} creative community visions. Exemplars: $0.99-$4.99, Creative: $1.99-$7.99.
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

            {/* Delete Test Visions Section */}
            <div className="border-t border-border pt-6 mt-6">
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 mb-4">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Delete My Test Visions</p>
                    <p className="text-sm text-muted-foreground">
                      Deletes only YOUR visions that have NOT earned royalties from other users' print orders. 
                      Visions with natural value accrual are preserved. Safe for testing cleanup.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleDeleteTestVisions}
                disabled={isDeleting || isSeeding || !user}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Deleting Test Visions...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5 mr-2" />
                    Delete My Test Visions
                  </>
                )}
              </Button>
              
              {deleteStats && (
                <div className="mt-4 p-3 rounded-lg bg-muted text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-destructive">🗑 {deleteStats.deleted} deleted</span>
                    {deleteStats.preserved > 0 && (
                      <span className="text-green-500">✓ {deleteStats.preserved} preserved (has value)</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            
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
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    {successCount} successful
                  </span>
                  <span className="flex items-center gap-1 text-amber-500">
                    🏆 {exemplarSuccessCount} Exemplars
                  </span>
                  <span className="flex items-center gap-1 text-blue-500">
                    🎨 {successCount - exemplarSuccessCount} Creative
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
                      className={`text-sm p-2 rounded flex items-center gap-2 ${
                        result.success 
                          ? result.isExemplar 
                            ? 'bg-amber-500/10 text-amber-600' 
                            : 'bg-green-500/10 text-green-600'
                          : 'bg-red-500/10 text-red-600'
                      }`}
                    >
                      <span>{result.success ? (result.isExemplar ? '🏆' : '🎨') : '✗'}</span>
                      <span>{result.title}</span>
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
