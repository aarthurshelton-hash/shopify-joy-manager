/**
 * GalleryDetailRedirect - Redirects gallery detail pages (/my-vision/{id}) to canonical game URLs (/g/{hash})
 * 
 * This maintains backward compatibility with existing gallery links while
 * using the new unified canonical URL system.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { generateGameHash } from '@/lib/visualizations/gameCanonical';
import { motion } from 'framer-motion';

const GalleryDetailRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      if (!id) {
        setError('Invalid visualization ID');
        return;
      }

      try {
        // Fetch the visualization by ID
        const { data, error: fetchError } = await supabase
          .from('saved_visualizations')
          .select('pgn, game_data')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching visualization:', fetchError);
          setError('Failed to load visualization');
          return;
        }

        if (!data) {
          setError('Visualization not found');
          return;
        }

        // Get PGN from either pgn field or game_data.pgn
        const pgn = data.pgn || (data.game_data as { pgn?: string })?.pgn || '';
        
        // Generate canonical game hash
        const gameHash = generateGameHash(pgn);

        // Get palette from stored state
        const paletteId = (data.game_data as { visualizationState?: { paletteId?: string } })?.visualizationState?.paletteId;
        
        // Build redirect URL with palette param
        const params = new URLSearchParams();
        if (paletteId) {
          params.set('p', paletteId);
        }
        params.set('src', 'gallery'); // Track source for context-aware UI
        
        const paramString = params.toString();
        const redirectUrl = `/g/${gameHash}${paramString ? `?${paramString}` : ''}`;
        
        navigate(redirectUrl, { replace: true });
      } catch (err) {
        console.error('Redirect error:', err);
        setError('Failed to redirect');
      }
    };

    fetchAndRedirect();
  }, [id, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-royal font-bold text-foreground">
            {error}
          </h1>
          <button 
            onClick={() => navigate('/my-vision')}
            className="text-primary hover:underline"
          >
            Return to Gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full"
      />
    </div>
  );
};

export default GalleryDetailRedirect;
