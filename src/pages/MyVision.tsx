import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getUserVisualizations, deleteVisualization, SavedVisualization } from '@/lib/visualizations/visualizationStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Crown, Trash2, Download, ArrowLeft, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumUpgradeCard } from '@/components/premium';
import AuthModal from '@/components/auth/AuthModal';

const MyVision: React.FC = () => {
  const navigate = useNavigate();
  const { user, isPremium, isLoading: authLoading } = useAuth();
  const [visualizations, setVisualizations] = useState<SavedVisualization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SavedVisualization | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (user && isPremium) {
      loadVisualizations();
    } else {
      setIsLoading(false);
    }
  }, [user, isPremium]);

  const loadVisualizations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await getUserVisualizations(user.id);
    
    if (error) {
      toast.error('Failed to load visualizations', { description: error.message });
    } else {
      setVisualizations(data);
    }
    
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    const { error } = await deleteVisualization(deleteTarget.id, deleteTarget.image_path);
    
    if (error) {
      toast.error('Failed to delete visualization', { description: error.message });
    } else {
      setVisualizations(prev => prev.filter(v => v.id !== deleteTarget.id));
      toast.success('Visualization deleted');
    }
    
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const handleDownload = async (visualization: SavedVisualization) => {
    try {
      const response = await fetch(visualization.image_path);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${visualization.title.replace(/[^a-z0-9]/gi, '-')}.png`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-display font-bold">My Vision Gallery</h1>
            <p className="text-muted-foreground">
              Sign in to access your personal gallery of saved chess visualizations.
            </p>
            <Button onClick={() => setShowAuthModal(true)} className="btn-luxury">
              Sign In to Continue
            </Button>
          </div>
          
          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </div>
      </div>
    );
  }

  // Not premium
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-display font-bold">My Vision Gallery</h1>
            <p className="text-muted-foreground">
              Save and store your chess visualizations with a Premium membership.
            </p>
            <PremiumUpgradeCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
        
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-display font-bold">My Vision Gallery</h1>
          </div>
          <p className="text-muted-foreground">
            Your saved chess visualizations, ready to download anytime.
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : visualizations.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-xl font-medium">No visualizations yet</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Create a chess visualization and save it to your gallery to see it here.
            </p>
            <Button onClick={() => navigate('/')} className="btn-luxury mt-4">
              Create Your First Visualization
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visualizations.map((viz) => (
              <Card key={viz.id} className="overflow-hidden group">
                <div className="relative aspect-square">
                  <img
                    src={viz.image_path}
                    alt={viz.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(viz)}
                      className="gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteTarget(viz)}
                      className="gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium truncate">{viz.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {viz.game_data.white} vs {viz.game_data.black}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(viz.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visualization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}" from your gallery. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyVision;
