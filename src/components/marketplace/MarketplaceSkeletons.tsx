import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const ListingCardSkeleton: React.FC = () => (
  <Card className="overflow-hidden">
    <div className="aspect-square relative">
      <Skeleton className="w-full h-full" />
    </div>
    <CardContent className="p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between items-center pt-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </CardContent>
  </Card>
);

export const ListingsGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ListingCardSkeleton key={i} />
    ))}
  </div>
);

export const TrendingCardSkeleton: React.FC = () => (
  <Card className="overflow-hidden">
    <div className="aspect-square relative">
      <Skeleton className="w-full h-full" />
    </div>
    <CardContent className="p-2 space-y-1">
      <Skeleton className="h-3 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-2.5 w-12" />
        <Skeleton className="h-2.5 w-8" />
      </div>
    </CardContent>
  </Card>
);

export const TrendingGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <TrendingCardSkeleton key={i} />
    ))}
  </div>
);

export const ClaimableCardSkeleton: React.FC = () => (
  <Card className="overflow-hidden">
    <div className="aspect-square relative">
      <Skeleton className="w-full h-full" />
    </div>
    <CardContent className="p-2.5 space-y-2">
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-7 w-full rounded-md" />
    </CardContent>
  </Card>
);

export const ClaimableGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <ClaimableCardSkeleton key={i} />
    ))}
  </div>
);
