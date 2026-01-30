/**
 * Page Loading Fallback
 * 
 * Device-adaptive loading state for lazy-loaded routes.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export function PageLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Minimalist loading indicator */}
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        
        {/* Brand text */}
        <p className="text-sm text-muted-foreground font-medium tracking-wider">
          EN PENSENT
        </p>
      </div>
    </div>
  );
}

/**
 * Skeleton for cards/grids
 */
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-4 animate-pulse"
        >
          <div className="aspect-square bg-muted rounded-md mb-4" />
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for vision board
 */
export function BoardSkeleton({ size = 320 }: { size?: number }) {
  return (
    <div
      className="bg-muted rounded-lg animate-pulse"
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-px p-1">
        {Array.from({ length: 64 }).map((_, i) => (
          <div
            key={i}
            className="bg-muted-foreground/10 rounded-sm"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Inline loading for buttons/actions
 */
export function InlineLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{text}</span>
    </span>
  );
}
