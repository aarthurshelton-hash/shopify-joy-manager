/**
 * En Pensent Device Optimization Module
 * 
 * Unified exports for device detection, adaptive routing,
 * and performance optimization.
 */

// Device detection
export {
  type DeviceType,
  type ConnectionQuality,
  type PerformanceTier,
  type DeviceProfile,
  detectDeviceType,
  detectConnectionQuality,
  detectPerformanceTier,
  getDeviceProfile,
  getOptimalImageQuality,
  getOptimalBoardSize,
  shouldEnableAnimations,
  getChunkSize,
  supportsWebGL,
  supportsOffscreenCanvas,
  isRunningAsPWA,
} from './deviceDetection';

// Adaptive routing
export {
  type RoutePriority,
  ROUTE_PRIORITIES,
  createAdaptiveLazy,
  preloadRoutes,
  getSkeletonComplexity,
  shouldEnableFeature,
} from './adaptiveRouting';
