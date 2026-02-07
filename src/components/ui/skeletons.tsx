/**
 * Loading Skeleton Components
 * 
 * Reusable skeleton screens for async loading states
 * following En Pensent design system.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

/**
 * Base skeleton pulse animation
 */
export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        width && `w-[${width}px]`,
        height && `h-[${height}px]`,
        className
      )}
      aria-hidden="true"
    />
  );
}

/**
 * Text skeleton - mimics line of text
 */
export function TextSkeleton({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-muted"
          style={{ width: i === lines - 1 ? '80%' : '100%' }}
        />
      ))}
    </div>
  );
}

/**
 * Card skeleton - for card layouts
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border p-4', className)} aria-hidden="true">
      <div className="space-y-3">
        <Skeleton className="h-40 w-full" />
        <TextSkeleton lines={2} />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

/**
 * Chart skeleton - for visualization loading
 */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)} aria-hidden="true">
      <Skeleton className="h-8 w-48" />
      <div className="flex items-end space-x-1 h-64">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            height={20 + Math.floor(Math.random() * 80)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Table skeleton - for data tables
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full" aria-hidden="true">
      {/* Header */}
      <div className="flex gap-4 border-b pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-6 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="space-y-3 pt-3">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex gap-4">
            {Array.from({ length: columns }).map((_, col) => (
              <Skeleton key={col} className={cn("h-5 flex-1", col === 0 && "w-3/5")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Profile skeleton - for user profiles
 */
export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center space-x-4', className)} aria-hidden="true">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-3 w-[150px]" />
      </div>
    </div>
  );
}

/**
 * Chess board skeleton - for game loading
 */
export function ChessBoardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('aspect-square', className)} aria-hidden="true">
      <div className="grid grid-cols-8 gap-0.5 h-full p-4">
        {Array.from({ length: 64 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse',
              (Math.floor(i / 8) + (i % 8)) % 2 === 0
                ? 'bg-muted'
                : 'bg-muted/50'
            )}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Stats skeleton - for statistics cards
 */
export function StatsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * List skeleton - for list items
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full max-w-[300px]" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Page skeleton - full page loading state
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen space-y-6 p-4 md:p-8" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>
      
      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-64 w-full" />
          <TextSkeleton lines={4} />
        </div>
        <div className="space-y-4">
          <StatsSkeleton count={2} />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading wrapper with accessible label
 */
export function LoadingWrapper({ 
  children,
  isLoading,
  skeleton: SkeletonComponent,
  label = 'Loading content...'
}: { 
  children: React.ReactNode;
  isLoading: boolean;
  skeleton: React.ComponentType;
  label?: string;
}) {
  if (isLoading) {
    return (
      <div role="status" aria-label={label}>
        <SkeletonComponent />
      </div>
    );
  }
  
  return <>{children}</>;
}
