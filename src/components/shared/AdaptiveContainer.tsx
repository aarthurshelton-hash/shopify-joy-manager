/**
 * Adaptive Container
 * 
 * Responsive container that adapts to device type with optimal spacing.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';

interface AdaptiveContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Full width on mobile, centered on larger screens */
  fluidMobile?: boolean;
  /** Maximum width constraint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Padding scheme */
  padding?: 'none' | 'compact' | 'normal' | 'spacious';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  compact: 'px-2 py-2 sm:px-3 sm:py-3',
  normal: 'px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8',
  spacious: 'px-4 py-6 sm:px-8 sm:py-10 lg:px-12 lg:py-16',
};

export function AdaptiveContainer({
  children,
  className,
  fluidMobile = true,
  maxWidth = 'xl',
  padding = 'normal',
}: AdaptiveContainerProps) {
  const { type } = useDeviceProfile();
  
  return (
    <div
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        fluidMobile && type === 'phone' && 'px-3',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Safe area container for PWA/mobile
 */
export function SafeAreaContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isPWA, isIOS } = useDeviceProfile();
  
  return (
    <div
      className={cn(
        'min-h-screen',
        // Add safe area padding for PWA on iOS
        isPWA && isIOS && 'pt-safe-top pb-safe-bottom',
        className
      )}
      style={{
        paddingTop: isPWA && isIOS ? 'env(safe-area-inset-top)' : undefined,
        paddingBottom: isPWA && isIOS ? 'env(safe-area-inset-bottom)' : undefined,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Grid that adapts columns based on device
 */
export function AdaptiveGrid({
  children,
  className,
  minItemWidth = 280,
}: {
  children: React.ReactNode;
  className?: string;
  minItemWidth?: number;
}) {
  const { type, screenWidth } = useDeviceProfile();
  
  // Calculate optimal columns
  const columns = type === 'phone' 
    ? 1 
    : Math.max(1, Math.floor((screenWidth - 64) / minItemWidth));
  
  return (
    <div
      className={cn('grid gap-4', className)}
      style={{
        gridTemplateColumns: `repeat(${Math.min(columns, 4)}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}
