/**
 * En Pensent Adaptive Routing
 * 
 * Optimizes route loading based on device capabilities.
 * Prioritizes critical paths and preloads based on user behavior.
 */

import { lazy, ComponentType } from 'react';
import { DeviceProfile, getDeviceProfile } from './deviceDetection';

// Route priority levels
export type RoutePriority = 'critical' | 'high' | 'medium' | 'low';

interface RouteConfig {
  path: string;
  priority: RoutePriority;
  preloadOn?: string[]; // Preload when visiting these paths
}

// Route priority map for En Pensent
export const ROUTE_PRIORITIES: RouteConfig[] = [
  // Critical - always loaded quickly
  { path: '/', priority: 'critical' },
  { path: '/my-vision', priority: 'critical' },
  { path: '/my-palettes', priority: 'critical' },
  
  // High - preload on related pages
  { path: '/creative-mode', priority: 'high', preloadOn: ['/', '/my-vision'] },
  { path: '/play', priority: 'high', preloadOn: ['/'] },
  { path: '/openings', priority: 'high', preloadOn: ['/creative-mode'] },
  
  // Medium - load on demand
  { path: '/about', priority: 'medium' },
  { path: '/account', priority: 'medium' },
  { path: '/game-history', priority: 'medium', preloadOn: ['/play'] },
  
  // Low - lazy load always
  { path: '/code-analysis', priority: 'low' },
  { path: '/terms', priority: 'low' },
  { path: '/privacy', priority: 'low' },
  { path: '/dmca', priority: 'low' },
];

/**
 * Create an adaptive lazy loader that considers device capabilities
 */
export function createAdaptiveLazy<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  priority: RoutePriority = 'medium'
): React.LazyExoticComponent<T> {
  const profile = getDeviceProfile();
  
  // For critical routes on fast connections, preload immediately
  if (priority === 'critical' && profile.connection === 'fast') {
    // Start preloading
    importFn();
  }
  
  return lazy(importFn);
}

/**
 * Preload routes based on current path and device
 */
export function preloadRoutes(currentPath: string): void {
  const profile = getDeviceProfile();
  
  // Don't preload on slow connections or low-end devices
  if (profile.connection === 'slow' || profile.performanceTier === 'low') {
    return;
  }
  
  const toPreload = ROUTE_PRIORITIES.filter(
    route => route.preloadOn?.includes(currentPath)
  );
  
  // Limit preloads based on connection
  const limit = profile.connection === 'fast' ? 3 : 1;
  
  toPreload.slice(0, limit).forEach(route => {
    // Dynamic imports for preloading
    switch (route.path) {
      case '/creative-mode':
        import('@/pages/CreativeMode');
        break;
      case '/play':
        import('@/pages/Play');
        break;
      case '/game-history':
        import('@/pages/GameHistory');
        break;
      case '/openings':
        import('@/pages/OpeningEncyclopedia');
        break;
    }
  });
}

/**
 * Get loading skeleton complexity based on device
 */
export function getSkeletonComplexity(profile: DeviceProfile): 'simple' | 'detailed' {
  if (profile.performanceTier === 'low' || profile.connection === 'slow') {
    return 'simple';
  }
  return 'detailed';
}

/**
 * Determine if a feature should be enabled based on device
 */
export function shouldEnableFeature(
  feature: 'animations' | 'parallax' | 'realtime' | 'preload' | 'hd-export',
  profile: DeviceProfile
): boolean {
  switch (feature) {
    case 'animations':
      return !profile.prefersReducedMotion && profile.performanceTier !== 'low';
      
    case 'parallax':
      return profile.type === 'desktop' && profile.performanceTier === 'high';
      
    case 'realtime':
      return profile.connection !== 'slow';
      
    case 'preload':
      return profile.connection === 'fast' && profile.performanceTier !== 'low';
      
    case 'hd-export':
      return profile.performanceTier !== 'low' && profile.memoryGB !== null && profile.memoryGB >= 4;
      
    default:
      return true;
  }
}
