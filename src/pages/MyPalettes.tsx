import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/shop/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Palette, 
  Trash2, 
  ArrowLeft, 
  Loader2, 
  PlayCircle,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { setCustomColor, setActivePalette, PieceType } from '@/lib/chess/pieceColors';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SavedPalette {
  id: string;
  name: string;
  description: string | null;
  white_colors: Record<string, string>;
  black_colors: Record<string, string>;
  created_at: string;
}

const MyPalettes: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [palettes, setPalettes] = useState<SavedPalette[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pieces: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      toast.error('Please sign in to view your palettes');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPalettes();
    }
  }, [user]);

  const fetchPalettes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_palettes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPalettes((data || []).map(item => ({
        ...item,
        white_colors: item.white_colors as Record<string, string>,
        black_colors: item.black_colors as Record<string, string>,
      })));
    } catch (error) {
      console.error('Error fetching palettes:', error);
      toast.error('Failed to load palettes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPalette = (palette: SavedPalette) => {
    // Apply the saved colors to the custom palette
    pieces.forEach(piece => {
      setCustomColor('w', piece, palette.white_colors[piece]);
      setCustomColor('b', piece, palette.black_colors[piece]);
    });
    
    // Set custom as active palette
    setActivePalette('custom');
    
    toast.success(`"${palette.name}" loaded!`, {
      description: 'Navigate home to use it in your visualization.',
    });
    
    navigate('/');
  };

  const handleDeletePalette = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('saved_palettes')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      
      setPalettes(prev => prev.filter(p => p.id !== deleteId));
      toast.success('Palette deleted');
    } catch (error) {
      console.error('Error deleting palette:', error);
      toast.error('Failed to delete palette');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3">
                  <Palette className="h-7 w-7 text-primary" />
                  My Palettes
                </h1>
                <p className="text-muted-foreground text-sm mt-1 font-serif">
                  Your saved color palettes
                </p>
              </div>
            </div>
          </div>

          {/* Palettes Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : palettes.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Palette className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-display font-semibold">No palettes yet</h2>
              <p className="text-muted-foreground font-serif max-w-md mx-auto">
                Create a custom palette on the home page and save it to see it here.
              </p>
              <Button onClick={() => navigate('/')} className="mt-4">
                Create Your First Palette
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {palettes.map((palette) => (
                <div
                  key={palette.id}
                  className="p-5 rounded-lg border border-border/50 bg-card hover:border-primary/30 transition-all duration-300 group"
                >
                  {/* Palette name and date */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display font-semibold text-lg">{palette.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(palette.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Color swatches */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground w-10">White</span>
                      <div className="flex gap-1">
                        {pieces.map((piece) => (
                          <div
                            key={`w-${piece}`}
                            className="w-7 h-7 rounded-sm shadow-sm ring-1 ring-black/10"
                            style={{ backgroundColor: palette.white_colors[piece] }}
                            title={`White ${piece.toUpperCase()}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground w-10">Black</span>
                      <div className="flex gap-1">
                        {pieces.map((piece) => (
                          <div
                            key={`b-${piece}`}
                            className="w-7 h-7 rounded-sm shadow-sm ring-1 ring-black/10"
                            style={{ backgroundColor: palette.black_colors[piece] }}
                            title={`Black ${piece.toUpperCase()}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                    <Button
                      size="sm"
                      onClick={() => handleLoadPalette(palette)}
                      className="flex-1 gap-2"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Load & Use
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteId(palette.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Palette</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this palette? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePalette}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyPalettes;
