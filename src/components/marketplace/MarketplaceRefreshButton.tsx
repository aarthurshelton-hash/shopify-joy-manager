import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MarketplaceRefreshButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
}

/**
 * Refresh button for the marketplace to manually reload listings.
 */
export const MarketplaceRefreshButton: React.FC<MarketplaceRefreshButtonProps> = ({
  onRefresh,
  isLoading = false,
}) => {
  const handleRefresh = () => {
    toast.info('Refreshing listings...', { icon: '🔄', duration: 1500 });
    onRefresh();
  };

  return (
    <Button
      onClick={handleRefresh}
      variant="outline"
      size="sm"
      disabled={isLoading}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">Refresh</span>
    </Button>
  );
};

export default MarketplaceRefreshButton;
