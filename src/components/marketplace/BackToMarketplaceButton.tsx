import React from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';

/**
 * Floating button to navigate back to the marketplace.
 * Only shows on vision detail pages (/g/*, /v/*, /vision/*).
 */
export const BackToMarketplaceButton: React.FC = () => {
  const location = useLocation();
  
  // Only show on vision pages
  const isVisionPage = location.pathname.startsWith('/g/') || 
                       location.pathname.startsWith('/v/') || 
                       location.pathname.startsWith('/vision/');
  
  if (!isVisionPage) return null;

  const handleClick = () => {
    // Open marketplace in new tab to avoid SPA routing issues
    window.open('/marketplace', '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      onClick={handleClick}
      className="fixed bottom-6 left-6 z-50 gap-2 shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 py-2 h-auto"
      size="sm"
    >
      <ShoppingBag className="h-4 w-4" />
      <span className="hidden sm:inline">Back to Marketplace</span>
      <span className="sm:hidden">Marketplace</span>
    </Button>
  );
};

export default BackToMarketplaceButton;
