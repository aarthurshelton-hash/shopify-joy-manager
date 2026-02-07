import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { formatValue, formatAppreciation } from '@/lib/nfts/visionNftApi';
import type { VisionNFT } from '@/lib/nfts/visionNftApi';

interface VisionFloorPriceProps {
  visionNFT: VisionNFT;
  showDetails?: boolean;
  className?: string;
}

export const VisionFloorPrice: React.FC<VisionFloorPriceProps> = ({
  visionNFT,
  showDetails = true,
  className = '',
}) => {
  const gain = visionNFT.current_floor_price_cents - visionNFT.mint_price_cents;
  const gainPercentage = visionNFT.mint_price_cents > 0 
    ? (gain / visionNFT.mint_price_cents) * 100 
    : 0;
  
  const isPositive = gain >= 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main Floor Price */}
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" />
        <div>
          <div className="text-2xl font-bold">
            {formatValue(visionNFT.current_floor_price_cents)}
          </div>
          <div className="text-xs text-muted-foreground">Current Floor</div>
        </div>
      </div>

      {/* Gain/Loss */}
      {showDetails && (
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
            {formatAppreciation(gainPercentage)}
          </span>
          <span className="text-sm text-muted-foreground">
            ({formatValue(gain)} from mint)
          </span>
        </div>
      )}

      {/* ATH/ATL */}
      {showDetails && visionNFT.all_time_high_cents && visionNFT.all_time_high_cents > 0 && (
        <div className="text-xs text-muted-foreground">
          <span className="text-green-500">↑ {formatValue(visionNFT.all_time_high_cents)} ATH</span>
          {visionNFT.all_time_low_cents && visionNFT.all_time_low_cents !== visionNFT.mint_price_cents && (
            <span className="ml-2 text-red-500">↓ {formatValue(visionNFT.all_time_low_cents)} ATL</span>
          )}
        </div>
      )}

      {/* Rarity Badge */}
      {visionNFT.rarity_score > 70 && (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs">
          <Activity className="h-3 w-3" />
          Rare ({visionNFT.rarity_score}/100)
        </div>
      )}
    </div>
  );
};

export default VisionFloorPrice;
