import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SimulationResult, SquareData, GameData } from '@/lib/chess/gameSimulator';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import PrintPreview from '@/components/chess/PrintPreview';
import { TimelineProvider } from '@/contexts/TimelineContext';
import { LegendHighlightProvider } from '@/contexts/LegendHighlightContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StoredGameData {
  white: string;
  black: string;
  event?: string;
  date?: string;
  result?: string;
  pgn?: string;
  moves?: string[];
  board: SquareData[][];
  totalMoves: number;
}

const VisualizationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isPremium, isLoading: authLoading } = useAuth();
  
  const [visualization, setVisualization] = useState<{
    id: string;
    user_id: string;
    title: string;
    pgn: string | null;
    game_data: StoredGameData;
    image_path: string;
    public_share_id: string | null;
    created_at: string;
    updated_at: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Invalid visualization ID');
      setIsLoading(false);
      return;
    }

    const loadVisualization = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('saved_visualizations')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Visualization not found');
          } else {
            throw fetchError;
          }
          return;
        }

        // Check ownership
        if (data.user_id !== user?.id) {
          setError('You do not have permission to view this visualization');
          return;
        }

        // Parse game_data as StoredGameData
        const gameData = data.game_data as unknown as StoredGameData;
        
        setVisualization({
          id: data.id,
          user_id: data.user_id,
          title: data.title,
          pgn: data.pgn,
          game_data: gameData,
          image_path: data.image_path,
          public_share_id: data.public_share_id,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      } catch (err) {
        console.error('Failed to load visualization:', err);
        setError('Failed to load visualization');
        toast.error('Failed to load visualization');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadVisualization();
    } else if (!authLoading) {
      setError('Please sign in to view this visualization');
      setIsLoading(false);
    }
  }, [id, user, authLoading]);

  // Reconstruct SimulationResult from stored game_data
  const reconstructSimulation = (): SimulationResult | null => {
    if (!visualization) return null;

    const gameData = visualization.game_data;
    
    return {
      board: gameData.board,
      gameData: {
        white: gameData.white || 'White',
        black: gameData.black || 'Black',
        event: gameData.event || '',
        date: gameData.date || '',
        result: gameData.result || '',
        pgn: gameData.pgn || visualization.pgn || '',
        moves: gameData.moves || [],
      },
      totalMoves: gameData.totalMoves,
    };
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <h1 className="text-2xl font-display font-bold">Unable to Load</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate('/my-vision')} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Gallery
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const simulation = reconstructSimulation();

  if (!simulation) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <h1 className="text-2xl font-display font-bold">Invalid Visualization Data</h1>
            <p className="text-muted-foreground">The visualization data could not be loaded.</p>
            <Button onClick={() => navigate('/my-vision')} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Gallery
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Back button and title */}
        <div className="mb-8">
          <Button 
            onClick={() => navigate('/my-vision')} 
            variant="ghost" 
            className="gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Gallery
          </Button>
          <h1 className="text-2xl md:text-3xl font-display font-bold">{visualization?.title}</h1>
          <p className="text-muted-foreground mt-1">
            {simulation.gameData.white} vs {simulation.gameData.black}
            {simulation.gameData.event && ` • ${simulation.gameData.event}`}
            {simulation.gameData.date && ` • ${simulation.gameData.date}`}
          </p>
        </div>

        {/* Full PrintPreview experience */}
        <TimelineProvider>
          <LegendHighlightProvider>
            <PrintPreview
              simulation={simulation}
              pgn={visualization?.pgn || undefined}
              title={visualization?.title}
            />
          </LegendHighlightProvider>
        </TimelineProvider>
      </div>
      <Footer />
    </div>
  );
};

export default VisualizationDetail;
