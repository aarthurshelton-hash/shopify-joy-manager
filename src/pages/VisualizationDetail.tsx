import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getVisualizationById, SavedVisualization } from '@/lib/visualizations/visualizationStorage';
import { SimulationResult, SquareData, GameData } from '@/lib/chess/gameSimulator';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import PrintPreview from '@/components/chess/PrintPreview';
import { TimelineProvider } from '@/contexts/TimelineContext';
import { LegendHighlightProvider } from '@/contexts/LegendHighlightContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const VisualizationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isPremium, isLoading: authLoading } = useAuth();
  
  const [visualization, setVisualization] = useState<SavedVisualization | null>(null);
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
        const { data, error: fetchError } = await getVisualizationById(id);

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        if (!data) {
          setError('Visualization not found');
          return;
        }

        // Check ownership
        if (data.user_id !== user?.id) {
          setError('You do not have permission to view this visualization');
          return;
        }

        setVisualization(data);
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
    
    // Check if we have full board data stored
    if (gameData.board && Array.isArray(gameData.board)) {
      return {
        board: gameData.board as SquareData[][],
        gameData: {
          white: gameData.white || 'White',
          black: gameData.black || 'Black',
          event: gameData.event || '',
          date: gameData.date || '',
          result: gameData.result || '',
          pgn: gameData.pgn || visualization.pgn || '',
          moves: gameData.moves || [],
        },
        totalMoves: gameData.totalMoves || 0,
      };
    }
    
    // Fallback for older visualizations without board data
    // Create an empty board structure
    const emptyBoard: SquareData[][] = Array(8).fill(null).map((_, rank) =>
      Array(8).fill(null).map((_, file) => ({
        file,
        rank,
        visits: [],
        isLight: (file + rank) % 2 === 1,
      }))
    );
    
    return {
      board: emptyBoard,
      gameData: {
        white: gameData.white || 'White',
        black: gameData.black || 'Black',
        event: gameData.event || '',
        date: gameData.date || '',
        result: gameData.result || '',
        pgn: gameData.pgn || visualization.pgn || '',
        moves: gameData.moves || [],
      },
      totalMoves: gameData.totalMoves || 0,
    };
  };

  const handleBack = () => {
    navigate('/my-vision');
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
            <Button onClick={handleBack} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Gallery
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
            <Button onClick={handleBack} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Gallery
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
            onClick={handleBack} 
            variant="ghost" 
            className="gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Gallery
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
