import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Crown, Calendar, Clock, ChevronLeft, Share2, ExternalLink, Eye, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { recordVisionInteraction, getVisionScore, VisionScore } from '@/lib/visualizations/visionScoring';

interface VisualizationData {
  id: string;
  title: string;
  image_path: string;
  pgn: string | null;
  game_data: {
    white?: string;
    black?: string;
    event?: string;
    date?: string;
    result?: string;
    moves?: string[];
    [key: string]: any;
  };
  created_at: string;
  public_share_id: string;
}

const VisualizationView = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [visualization, setVisualization] = useState<VisualizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [visionScore, setVisionScore] = useState<VisionScore | null>(null);
  const viewRecordedRef = useRef(false);

  useEffect(() => {
    const fetchVisualization = async () => {
      if (!shareId) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('saved_visualizations')
          .select('*')
          .eq('public_share_id', shareId)
          .single();

        if (fetchError || !data) {
          setError('Visualization not found');
          setLoading(false);
          return;
        }

        setVisualization(data as VisualizationData);

        // Get public URL for the image
        const { data: urlData } = supabase.storage
          .from('visualizations')
          .getPublicUrl(data.image_path);

        if (urlData?.publicUrl) {
          setImageUrl(urlData.publicUrl);
        }

        // Record view interaction (only once per session)
        if (!viewRecordedRef.current) {
          viewRecordedRef.current = true;
          recordVisionInteraction(data.id, 'view');
          
          // Fetch vision score for display
          const score = await getVisionScore(data.id);
          setVisionScore(score);
        }
      } catch (err) {
        console.error('Error fetching visualization:', err);
        setError('Failed to load visualization');
      } finally {
        setLoading(false);
      }
    };

    fetchVisualization();
  }, [shareId]);

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: visualization?.title || 'Chess Visualization',
          text: 'Check out this beautiful chess game visualization from En Pensent',
          url
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !visualization) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Crown className="h-10 w-10 text-primary/50" />
            </div>
            <h1 className="text-2xl font-royal font-bold uppercase tracking-wide">
              Visualization Not Found
            </h1>
            <p className="text-muted-foreground font-serif">
              This visualization may have been removed or the link is invalid.
            </p>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Go to Homepage
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const gameData = visualization.game_data || {};
  const createdDate = new Date(visualization.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-5xl mx-auto">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-serif">Back to En Pensent</span>
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Visualization Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3"
            >
              <div className="relative rounded-xl overflow-hidden border border-border/30 shadow-2xl shadow-primary/10">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={visualization.title}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="aspect-square bg-card/50 flex items-center justify-center">
                    <Crown className="h-16 w-16 text-primary/20" />
                  </div>
                )}
                
                {/* Premium badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-primary/30 flex items-center gap-2">
                  <Crown className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-display uppercase tracking-wider text-primary">
                    Visionary Collection
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Info Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-royal font-bold uppercase tracking-wide">
                  {visualization.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {createdDate}
                  </span>
                </div>
              </div>

              {/* Game Details */}
              {(gameData.white || gameData.black || gameData.event) && (
                <div className="p-4 rounded-lg border border-border/30 bg-card/30 space-y-3">
                  <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
                    Game Details
                  </h2>
                  
                  {(gameData.white || gameData.black) && (
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <p className="text-xs text-muted-foreground mb-1">White</p>
                        <p className="font-serif font-medium">{gameData.white || 'Unknown'}</p>
                      </div>
                      <div className="px-4 text-muted-foreground font-display">vs</div>
                      <div className="text-center flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Black</p>
                        <p className="font-serif font-medium">{gameData.black || 'Unknown'}</p>
                      </div>
                    </div>
                  )}

                  {gameData.event && (
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-xs text-muted-foreground">Event</p>
                      <p className="font-serif text-sm">{gameData.event}</p>
                    </div>
                  )}

                  {gameData.date && (
                    <div>
                      <p className="text-xs text-muted-foreground">Date Played</p>
                      <p className="font-serif text-sm">{gameData.date}</p>
                    </div>
                  )}

                  {gameData.result && (
                    <div>
                      <p className="text-xs text-muted-foreground">Result</p>
                      <p className="font-display text-lg">{gameData.result}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Move Count */}
              {gameData.moves && gameData.moves.length > 0 && (
                <div className="p-4 rounded-lg border border-border/30 bg-card/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-serif">Total Moves</span>
                    <span className="font-display text-xl text-primary">
                      {Math.ceil(gameData.moves.length / 2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Vision Score Stats */}
              {visionScore && visionScore.viewCount > 0 && (
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-display uppercase tracking-wider text-primary">
                    <TrendingUp className="h-4 w-4" />
                    Vision Stats
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{visionScore.viewCount} views</span>
                    </div>
                    {visionScore.uniqueViewers > 1 && (
                      <div className="text-muted-foreground">
                        {visionScore.uniqueViewers} unique
                      </div>
                    )}
                  </div>
                  {visionScore.totalScore > 0 && (
                    <div className="pt-2 border-t border-border/30">
                      <span className="text-xs text-muted-foreground">Vision Score: </span>
                      <span className="font-display text-primary">{visionScore.totalScore.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Share Button */}
              <Button 
                onClick={handleShare}
                variant="outline" 
                className="w-full gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share This Visualization
              </Button>

              {/* CTA */}
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                <p className="text-sm text-muted-foreground font-serif">
                  Create your own chess game visualizations and turn your memorable games into art.
                </p>
                <Link to="/">
                  <Button className="w-full gap-2 bg-primary hover:bg-primary/90">
                    <ExternalLink className="h-4 w-4" />
                    Create Your Own
                  </Button>
                </Link>
              </div>

              {/* Branding */}
              <div className="text-center pt-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground font-serif">
                  Powered by
                </p>
                <p className="font-royal text-lg text-gold-gradient">En Pensent</p>
                <p className="text-xs text-muted-foreground font-serif italic">
                  "In Thought" — Where Chess Becomes Art
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default VisualizationView;
