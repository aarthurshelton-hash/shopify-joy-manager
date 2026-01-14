/**
 * MarketplaceDetailRedirect - Redirects marketplace detail pages (/marketplace/{id}) to canonical game URLs (/g/{hash})
 * 
 * This maintains backward compatibility with existing marketplace links while
 * using the new unified canonical URL system.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { generateGameHash } from '@/lib/visualizations/gameCanonical';
import { motion } from 'framer-motion';

const MarketplaceDetailRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      if (!id) {
        setError('Invalid listing ID');
        return;
      }

      try {
        // Fetch the listing and its visualization
        const { data: listing, error: fetchError } = await supabase
          .from('visualization_listings')
          .select(`
            visualization_id,
            saved_visualizations (
              pgn,
              game_data
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching listing:', fetchError);
          setError('Failed to load listing');
          return;
        }

        if (!listing || !listing.saved_visualizations) {
          setError('Listing not found');
          return;
        }

        const viz = listing.saved_visualizations as { pgn?: string; game_data?: { pgn?: string; visualizationState?: { paletteId?: string } } };
        
        // Get PGN from either pgn field or game_data.pgn
        const pgn = viz.pgn || viz.game_data?.pgn || '';
        
        // Generate canonical game hash
        const gameHash = generateGameHash(pgn);

        // Get palette from stored state
        const paletteId = viz.game_data?.visualizationState?.paletteId;
        
        // Build redirect URL with palette and source params
        const params = new URLSearchParams();
        if (paletteId) {
          params.set('p', paletteId);
        }
        params.set('src', 'marketplace'); // Track source for context-aware UI
        params.set('listing', id); // Pass listing ID for purchase functionality
        
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
            onClick={() => navigate('/marketplace')}
            className="text-primary hover:underline"
          >
            Return to Marketplace
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

export default MarketplaceDetailRedirect;
