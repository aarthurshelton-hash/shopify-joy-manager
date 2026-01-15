import React from 'react';
import { Clock, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRecentlyViewedStore, RecentlyViewedVision } from '@/stores/recentlyViewedStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { formatDistanceToNow } from 'date-fns';

export const RecentlyViewedSection: React.FC = () => {
  const { getRecentVisions, clearRecentlyViewed } = useRecentlyViewedStore();
  const { formatPrice } = useCurrencyStore();
  
  const recentVisions = getRecentVisions(6);
  
  if (recentVisions.length === 0) return null;

  const handleCardClick = (vision: RecentlyViewedVision) => {
    // Open in new tab using game hash if available, otherwise listing
    const url = vision.gameHash 
      ? `/g/${vision.gameHash}` 
      : vision.listingId 
        ? `/marketplace/${vision.listingId}` 
        : null;
    
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Recently Viewed</h3>
          <Badge variant="secondary" className="text-xs">
            {recentVisions.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearRecentlyViewed}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {recentVisions.map((vision) => (
          <Card
            key={vision.id}
            onClick={() => handleCardClick(vision)}
            className="group cursor-pointer overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-200 hover:shadow-md"
          >
            <CardContent className="p-0">
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={vision.imagePath}
                  alt={vision.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Time badge */}
                <div className="absolute top-1.5 right-1.5">
                  <Badge 
                    variant="secondary" 
                    className="text-2xs px-1.5 py-0.5 bg-background/80 backdrop-blur-sm"
                  >
                    {formatDistanceToNow(vision.viewedAt, { addSuffix: false })}
                  </Badge>
                </div>
                
                {/* Price overlay */}
                {vision.priceCents !== undefined && (
                  <div className="absolute bottom-1.5 left-1.5">
                    <Badge 
                      variant={vision.priceCents === 0 ? 'default' : 'secondary'}
                      className={`text-2xs px-1.5 py-0.5 ${
                        vision.priceCents === 0 
                          ? 'bg-green-500/90 text-white' 
                          : 'bg-background/80 backdrop-blur-sm'
                      }`}
                    >
                      {vision.priceCents === 0 ? 'Free' : formatPrice(vision.priceCents)}
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="p-2">
                <p className="text-xs font-medium truncate">{vision.title}</p>
                {vision.ownerName && (
                  <p className="text-2xs text-muted-foreground truncate">
                    by {vision.ownerName}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewedSection;
