/**
 * VisualizationRedirect - Redirects old share links (/v/{shareId}) to canonical game URLs (/g/{hash})
 * 
 * This maintains backward compatibility with existing share links while
 * using the new unified canonical URL system.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { generateGameHash } from '@/lib/visualizations/gameCanonical';
import { motion } from 'framer-motion';

const VisualizationRedirect = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      if (!shareId) {
        setError('Invalid share link');
        return;
      }

      try {
        // Fetch the visualization by public_share_id
        const { data, error: fetchError } = await supabase
          .from('saved_visualizations')
          .select('pgn, game_data')
          .eq('public_share_id', shareId)
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

        // Preserve any existing URL params and add palette if stored
        const paletteId = (data.game_data as { visualizationState?: { paletteId?: string } })?.visualizationState?.paletteId;
        const newParams = new URLSearchParams(searchParams);
        
        if (paletteId && !newParams.has('p')) {
          newParams.set('p', paletteId);
        }

        // Redirect to canonical URL
        const paramString = newParams.toString();
        const redirectUrl = `/g/${gameHash}${paramString ? `?${paramString}` : ''}`;
        
        navigate(redirectUrl, { replace: true });
      } catch (err) {
        console.error('Redirect error:', err);
        setError('Failed to redirect');
      }
    };

    fetchAndRedirect();
  }, [shareId, searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-royal font-bold text-foreground">
            {error}
          </h1>
          <button 
            onClick={() => navigate('/')}
            className="text-primary hover:underline"
          >
            Go to Homepage
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

export default VisualizationRedirect;
